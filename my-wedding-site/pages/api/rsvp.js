import { google } from 'googleapis';
import nodemailer from 'nodemailer';

function getAuth(scopes) {
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
  const b64 = process.env.GOOGLE_SHEETS_PRIVATE_KEY_BASE64 || '';
  if (!key && b64) {
    try { key = Buffer.from(b64, 'base64').toString('utf8'); } catch {}
  }
  // Replace literal \n with newline, and trim surrounding quotes/spaces
  key = key.replace(/\\n/g, '\n').trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  return new google.auth.JWT(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    undefined,
    key,
    scopes
  );
}

function getSheetsClient() {
  const auth = getAuth(['https://www.googleapis.com/auth/spreadsheets']);
  return google.sheets({ version: 'v4', auth });
}

function getDocsClient() {
  const auth = getAuth(['https://www.googleapis.com/auth/documents']);
  return google.docs({ version: 'v1', auth });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { Name, Email, Attending, DietaryRestrictions, PlusOneName, responses, ContactEmail } = req.body || {};
  const effectiveEmail = (Email || ContactEmail || '').toString();
  const now = new Date().toISOString();

  try {
    const sheets = getSheetsClient();
    const extractId = (url) => {
      if (!url) return '';
      const m = String(url).match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return m ? m[1] : '';
    };
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || extractId(process.env.GOOGLE_SHEETS_SPREADSHEET_URL) || extractId(process.env.NEXT_PUBLIC_RESPONSES_SHEET_URL);
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Missing Google Sheet ID. Set GOOGLE_SHEETS_SPREADSHEET_ID or GOOGLE_SHEETS_SPREADSHEET_URL, and share the sheet with the service account email.' });
    }
    const range = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:F';

    // Prepare normalized responses array
    const list = Array.isArray(responses) && responses.length
      ? responses.map((r) => ({ Name: r.Name, Attending: r.Attending, DietaryRestrictions: r.DietaryRestrictions || '', PlusOneName: r.PlusOneName || '', Staying: r.Staying || '' }))
      : (Name ? [{ Name, Attending, DietaryRestrictions: DietaryRestrictions || '', PlusOneName: PlusOneName || '', Staying: req.body.Staying || '' }] : []);

    // If configured, update specific columns on an existing Guest List tab
    const updateTab = process.env.GOOGLE_SHEETS_TAB || 'Guest List';
    const nameAnchor = process.env.GOOGLE_SHEETS_NAME_ANCHOR; // e.g., C5
    const attendingCol = process.env.GOOGLE_SHEETS_ATTENDING_COL; // e.g., I
    const dietaryCol = process.env.GOOGLE_SHEETS_DIETARY_COL; // e.g., L
    const stayingCol = process.env.GOOGLE_SHEETS_STAYING_COL;   // e.g., O
    const shouldUpdateGuestList = Boolean(nameAnchor && attendingCol && dietaryCol);

    if (shouldUpdateGuestList && list.length) {
      // Parse anchor like C5 -> column=C, headerRow=5, data starts at headerRow+1
      const match = String(nameAnchor).match(/^([A-Za-z]+)(\d+)$/);
      if (!match) {
        return res.status(500).json({ error: `Invalid GOOGLE_SHEETS_NAME_ANCHOR: ${nameAnchor}` });
      }
      const nameCol = match[1].toUpperCase();
      const headerRow = parseInt(match[2], 10);
      const startRow = headerRow + 1;

      // Fetch the name column from startRow to the end
      const nameColRange = `'${updateTab}'!${nameCol}${startRow}:${nameCol}`;
      const { data: colData } = await sheets.spreadsheets.values.get({ spreadsheetId, range: nameColRange, majorDimension: 'COLUMNS' });
      const names = Array.isArray(colData.values) && colData.values.length ? colData.values[0] : [];

      const norm = (s) => String(s || '').trim().toLowerCase();
      const updates = [];
      let updatedCount = 0;
      const notFound = [];
      list.forEach((r) => {
        const idx = names.findIndex((n) => norm(n) === norm(r.Name));
        if (idx === -1) {
          notFound.push(r.Name);
          return;
        }
        const rowNumber = startRow + idx;
        // Attending -> attendingCol, DietaryRestrictions -> dietaryCol
        updates.push({ range: `'${updateTab}'!${attendingCol}${rowNumber}`, values: [[r.Attending || '']] });
        updates.push({ range: `'${updateTab}'!${dietaryCol}${rowNumber}`, values: [[r.DietaryRestrictions || '']] });
        if (stayingCol) {
          updates.push({ range: `'${updateTab}'!${stayingCol}${rowNumber}`, values: [[r.Staying || '']] });
        }
        updatedCount += 1;
      });

      if (updates.length) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
        });
      }

      // Continue to optional Doc/email steps, and return status including notFound
      var operationResult = { mode: 'update', updated: updatedCount, notFound };
    } else {
      // Appending new rows is disabled; require update mode env vars
      return res.status(400).json({ error: 'Append mode disabled. Configure GOOGLE_SHEETS_NAME_ANCHOR, GOOGLE_SHEETS_ATTENDING_COL, and GOOGLE_SHEETS_DIETARY_COL to update existing rows.' });
    }

    // Do not append new rows to the sheet; we only update existing rows per above.

    // Optionally append a line to a Google Doc for easy reading
    if (process.env.GOOGLE_DOCS_DOCUMENT_ID) {
      try {
        const docs = getDocsClient();
        const docId = process.env.GOOGLE_DOCS_DOCUMENT_ID;
        if (Array.isArray(responses) && responses.length) {
          const lines = responses.map((r)=>`RSVP — ${r.Name} | ${effectiveEmail || ''} | Attending: ${r.Attending}${r.PlusOneName ? ` | +1: ${r.PlusOneName}` : ''}${r.DietaryRestrictions ? ` | Dietary: ${r.DietaryRestrictions}` : ''}${r.Staying ? ` | Staying: ${r.Staying}` : ''} | ${now}`);
          await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: lines.map((text)=>({ insertText: { endOfSegmentLocation: {}, text: text + "\n" } })) }
          });
        } else {
          const line = `RSVP — ${Name} | ${effectiveEmail || ''} | Attending: ${Attending}${PlusOneName ? ` | +1: ${PlusOneName}` : ''}${DietaryRestrictions ? ` | Dietary: ${DietaryRestrictions}` : ''}${req.body.Staying ? ` | Staying: ${req.body.Staying}` : ''} | ${now}`;
          await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: [{ insertText: { endOfSegmentLocation: {}, text: line + "\n" } }] }
          });
        }
      } catch (e) {
        console.error('Failed to append to Google Doc', e);
      }
    }

    // Guest-facing confirmation email (only when ContactEmail provided)
    try {
      const guestTo = (ContactEmail || '').toString().trim();
      const smtpHost = process.env.SMTP_HOST;
      if (guestTo && smtpHost) {
        const smtpPort = Number(process.env.SMTP_PORT || 587);
        const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const from = process.env.NOTIFY_EMAIL_FROM || 'no-reply@example.com';
        const transport = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpSecure, auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined });

        const lines = Array.isArray(responses) && responses.length
          ? responses.map((r)=>`• ${r.Name}: ${r.Attending}${r.DietaryRestrictions?` — Dietary: ${r.DietaryRestrictions}`:''}${r.Staying?` — Staying: ${r.Staying}`:''}`)
          : [`• ${Name}: ${Attending}${DietaryRestrictions?` — Dietary: ${DietaryRestrictions}`:''}${PlusOneName?` — +1: ${PlusOneName}`:''}`];

        const text = `Thank you! We've received your RSVP (${new Date(now).toLocaleString()}).\n\n${lines.join('\n')}\n\nIf you need to make changes, just submit the form again or contact us.`;
        const subject = 'RSVP received — thank you!';
        await transport.sendMail({ from, to: guestTo, subject, text });
      }
    } catch (e) {
      console.error('Guest confirmation email failed', e);
    }

    // Optional backup email notification
    try {
      const to = process.env.NOTIFY_EMAIL_TO;
      const from = process.env.NOTIFY_EMAIL_FROM || to;
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT || 587);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

      if (to && smtpHost) {
        const transport = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
        });
        const subject = Array.isArray(responses) && responses.length
          ? `RSVP (party, ${responses.length} guests)`
          : `RSVP (${Name})`;
        const lines = Array.isArray(responses) && responses.length
          ? responses.map((r)=>`- ${r.Name} | Attending: ${r.Attending}${r.DietaryRestrictions?` | Dietary: ${r.DietaryRestrictions}`:''}${r.Staying?` | Staying: ${r.Staying}`:''}`)
          : [`- ${Name} | Attending: ${Attending}${DietaryRestrictions?` | Dietary: ${DietaryRestrictions}`:''}${PlusOneName?` | +1: ${PlusOneName}`:''}${req.body.Staying?` | Staying: ${req.body.Staying}`:''}`];
        const text = `New RSVP received at ${now}\n${lines.join('\n')}\n`;
        await transport.sendMail({ from, to, subject, text });
      }
    } catch (e) {
      console.error('Email notification failed', e);
    }

    res.status(200).json({ ok: true, ...operationResult });
  } catch (err) {
    console.error(err);
    // Best-effort failure notification
    try {
      const to = process.env.NOTIFY_EMAIL_TO;
      const from = process.env.NOTIFY_EMAIL_FROM || to;
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT || 587);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
      if (to && smtpHost) {
        const transport = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpSecure, auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined });
        const text = `RSVP failed to save at ${now}\nPayload: ${JSON.stringify(req.body)}`;
        await transport.sendMail({ from, to, subject: 'RSVP save FAILED', text });
      }
    } catch (e) {
      console.error('Email fail-notify failed', e);
    }
    res.status(500).json({ error: 'Failed to save RSVP' });
  }
}


