import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';

function stripDiacritics(input) {
  const s = String(input || '').normalize('NFD');
  try {
    // Use Unicode property escapes when available
    return s.replace(new RegExp('\\\p{Diacritic}+', 'gu'), '');
  } catch {
    // Fallback: remove combining marks block
    return s.replace(/[\u0300-\u036f]+/g, '');
  }
}

function normalizeName(str) {
  return stripDiacritics(str)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function pick(lower, keys) {
  for (const k of keys) {
    const val = lower[k];
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
  }
  return '';
}

function loadFromExcel() {
  try {
    const excelPath = path.join(process.cwd(), 'data', 'Wedding planner - Guest list.xlsx');
    if (!fs.existsSync(excelPath)) return null;
    const wb = xlsx.readFile(excelPath);
    const wantedSheet = process.env.GUESTLIST_SHEET_NAME;
    let ws = null;
    if (wantedSheet && wb.Sheets[wantedSheet]) {
      ws = wb.Sheets[wantedSheet];
    } else if (process.env.GUESTLIST_SHEET_INDEX) {
      const idx = Number(process.env.GUESTLIST_SHEET_INDEX);
      if (!Number.isNaN(idx) && wb.SheetNames[idx]) ws = wb.Sheets[wb.SheetNames[idx]];
    }
    if (!ws) ws = wb.Sheets[wb.SheetNames[0]];

    // First try to detect a header row explicitly via header:1 (array-of-arrays)
    const grid = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
    let headerRow = -1;
    let nameCol = -1;
    let partyCol = -1;
    const headerCandidates = ['name', 'full name', 'fullname', 'guest', 'guest name', 'name of guest'];
    const partyCandidates = ['party', 'group', 'household', 'family', 'party id', 'partyid', 'party_id'];
    for (let r = 0; r < Math.min(grid.length, 25); r++) {
      const row = grid[r].map((c) => String(c || '').toLowerCase().trim());
      // Find likely name column
      let nIdx = -1; let pIdx = -1;
      for (let c = 0; c < row.length; c++) {
        if (nIdx === -1 && headerCandidates.includes(row[c])) nIdx = c;
        if (pIdx === -1 && partyCandidates.includes(row[c])) pIdx = c;
      }
      if (nIdx !== -1) {
        headerRow = r; nameCol = nIdx; partyCol = pIdx;
        break;
      }
    }

    const guests = [];
    if (headerRow !== -1 && nameCol !== -1) {
      // Parse from the detected header row downward; forward-fill party numbers
      let currentParty = '';
      for (let r = headerRow + 1; r < grid.length; r++) {
        const row = grid[r];
        const rawName = String(row[nameCol] || '').trim();
        if (!rawName) continue;
        let rawParty = partyCol !== -1 ? String(row[partyCol] || '').trim() : '';
        if (rawParty) currentParty = rawParty; else rawParty = currentParty;
        guests.push({ name: rawName, party: rawParty || null });
      }
    } else {
      // Fallback to object-mode mapping using flexible keys
      const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
      for (const row of rows) {
        const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [String(k).toLowerCase().trim(), v]));
        const directName = pick(lower, [ 'name', 'full name', 'fullname', 'full_name', 'guest', 'guest name', 'name of guest' ]);
        const first = pick(lower, ['first', 'first name', 'given name']);
        const last = pick(lower, ['last', 'last name', 'surname', 'family name']);
        const fallbackName = [first, last].filter(Boolean).join(' ').trim();
        const name = (directName || fallbackName);
        const party = pick(lower, ['party', 'group', 'household', 'family', 'party id', 'partyid', 'party_id']);
        if (name) guests.push({ name, party: party || null });
      }
    }

    if (process.env.NODE_ENV === 'development') {
      try { console.debug('[guest-lookup] Parsed guests (first 3):', guests.slice(0, 3)); } catch {}
    }
    return guests;
  } catch (e) {
    console.error('Failed reading Excel guest list', e);
    return null;
  }
}

function loadFromJson() {
  try {
    const file = path.join(process.cwd(), 'data', 'guest-list.json');
    const raw = fs.readFileSync(file, 'utf8');
    const guests = JSON.parse(raw);
    return Array.isArray(guests) ? guests.map((g) => ({ name: g.name, party: g.party || null })) : null;
  } catch {
    return null;
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { name } = req.body || {};
  const query = normalizeName(name);
  if (!query) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const excel = loadFromExcel();
    const baseGuests = excel || loadFromJson() || [];
    if (!baseGuests.length) {
      return res.status(200).json({ matches: [] });
    }

    // Build party map
    const byParty = new Map();
    const singles = [];
    for (const g of baseGuests) {
      if (g.party) {
        if (!byParty.has(g.party)) byParty.set(g.party, []);
        byParty.get(g.party).push(g.name);
      } else {
        singles.push(g.name);
      }
    }

    // Build a flat list for matching with party info
    const flat = [];
    for (const [party, members] of byParty.entries()) {
      for (const m of members) flat.push({ name: m, party, partyMembers: members });
    }
    for (const s of singles) flat.push({ name: s, party: null, partyMembers: [s] });

    const matches = flat
      .map((g) => ({ ...g, _norm: normalizeName(g.name) }))
      .filter((g) => g._norm.includes(query))
      .slice(0, 5)
      .map(({ name, party, partyMembers }) => ({ name, party, partyMembers }));

    return res.status(200).json({ matches });
  } catch (e) {
    console.error('guest-lookup error', e);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}
