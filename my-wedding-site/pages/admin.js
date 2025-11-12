import Layout from '../components/Layout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { google } from 'googleapis';

function safeParseDate(s) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export default function AdminPage({ stats, recent, sheetUrl, error }) {
  const { t } = useTranslation(['common', 'admin']);
  return (
    <Layout>
      <section className="rsvpWrap" data-reveal>
        <header className="sectionTitle">
          <h2>{t('admin:heading')}</h2>
          <p className="muted">{t('admin:subtitle')}</p>
        </header>

        {error && <div className="banner error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div className="actions" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          {sheetUrl && (
            <a className="button" href={sheetUrl} target="_blank" rel="noreferrer">{t('admin:openSheet')}</a>
          )}
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="statsGrid">
            <div className="stat"><div className="label">{t('admin:total')}</div><div className="value">{stats.total}</div></div>
            <div className="stat"><div className="label">{t('admin:yes')}</div><div className="value yes">{stats.yes}</div></div>
            <div className="stat"><div className="label">{t('admin:no')}</div><div className="value no">{stats.no}</div></div>
            <div className="stat"><div className="label">{t('admin:unique')}</div><div className="value">{stats.uniqueEmails}</div></div>
            <div className="stat"><div className="label">{t('admin:plusOnes')}</div><div className="value">{stats.plusOnes}</div></div>
            <div className="stat"><div className="label">{t('admin:last')}</div><div className="value">{stats.lastResponse || '-'}</div></div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('admin:recent')}</h3>
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin:name')}</th>
                  <th>{t('admin:email')}</th>
                  <th>{t('admin:attending')}</th>
                  <th>{t('admin:plusOne')}</th>
                  <th>{t('admin:dietary')}</th>
                  <th>{t('admin:time')}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td>{r[0] || ''}</td>
                    <td>{r[1] || ''}</td>
                    <td>{r[2] || ''}</td>
                    <td>{r[4] || ''}</td>
                    <td>{r[3] || ''}</td>
                    <td>{r[5] || ''}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={6} className="muted">{t('admin:noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  async function getStats() {
    try {
      const auth = new google.auth.JWT(
        process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        undefined,
        (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );
      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      const range = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:F';
      if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID not set');

      const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      const rows = Array.isArray(data.values) ? data.values : [];
      // Expect header row? Our app appends without header; handle both
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

      // Recent last 10
      const recent = entries.slice(-10).reverse();

      return { stats: { total, yes, no, plusOnes, uniqueEmails: emails.size, lastResponse }, recent };
    } catch (e) {
      return { error: e.message, stats: { total: 0, yes: 0, no: 0, plusOnes: 0, uniqueEmails: 0, lastResponse: null }, recent: [] };
    }
  }

  const sheetUrl = process.env.NEXT_PUBLIC_RESPONSES_SHEET_URL || null;
  const { stats, recent, error } = await getStats();

  return {
    props: {
      sheetUrl,
      stats,
      recent,
      error: error || null,
      ...(await serverSideTranslations(locale, ['common', 'admin']))
    }
  };
}

