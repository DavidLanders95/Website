import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';

export default function Travel() {
  const { t } = useTranslation(['common', 'travel']);
  return (
    <Layout>
      <h2>{t('travel:heading')}</h2>
      <p>{t('travel:content')}</p>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'travel'])),
    },
  };
}
