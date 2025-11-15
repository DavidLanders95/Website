const { google } = require('googleapis');

function safeParseDate(s) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

exports.handler = async () => {
  try {
    const keyB64 = process.env.GOOGLE_SHEETS_PRIVATE_KEY_BASE64 || '';
    const rawKey = keyB64 ? Buffer.from(keyB64, 'base64').toString('utf8') : (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      undefined,
      rawKey.trim(),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:F';
    if (!spreadsheetId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing spreadsheet ID' }) };
    }

    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = Array.isArray(data.values) ? data.values : [];
    const hasHeader = rows.length > 0 && rows[0][0] === 'Name' && rows[0][1] === 'Email';
    const entries = hasHeader ? rows.slice(1) : rows;

    const total = entries.length;
    let yes = 0, no = 0, plusOnes = 0;
    const emails = new Set();
    let last = null;
    for (const r of entries) {
      const attending = (r[2] || '').toString().trim();
      if (/^y(es)?$/i.test(attending)) yes++; else if (/^no$/i.test(attending)) no++;
      if ((r[4] || '').toString().trim()) plusOnes++;
      if (r[1]) emails.add(r[1].toString().trim().toLowerCase());
      const d = safeParseDate(r[5]);
      if (d && (!last || d > last)) last = d;
    }
    const lastResponse = last ? last.toLocaleString() : null;

    const recent = entries.slice(-10).reverse();
    const stats = { total, yes, no, plusOnes, uniqueEmails: emails.size, lastResponse };
    const sheetUrl = process.env.NEXT_PUBLIC_RESPONSES_SHEET_URL || null;


    return { statusCode: 200, body: JSON.stringify({ stats, recent, sheetUrl }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message, stats: { total: 0, yes: 0, no: 0, plusOnes: 0, uniqueEmails: 0, lastResponse: null }, recent: [] }) };
  }
};
