import Layout from '../components/Layout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AdminPage() {
  const { t } = useTranslation(['common', 'admin']);
  const { data, error } = useSWR('/.netlify/functions/admin-stats', fetcher);

  const stats = data?.stats || { total: 0, yes: 0, no: 0, plusOnes: 0, uniqueEmails: 0, lastResponse: null };
  const recent = data?.recent || [];
  const sheetUrl = data?.sheetUrl;
  const apiError = error || data?.error;

  return (
    <Layout>
      <section className="rsvpWrap" data-reveal>
        <header className="sectionTitle">
          <h2>{t('admin:heading')}</h2>
          <p className="muted">{t('admin:subtitle')}</p>
        </header>

        {apiError && <div className="banner error" style={{ marginBottom: '1rem' }}>{apiError}</div>}
        {!data && !error && <div className="banner" style={{ marginBottom: '1rem' }}>Loading...</div>}

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
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'admin']))
    }
  };
}

