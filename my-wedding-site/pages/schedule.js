import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';

export default function Schedule() {
  const { t } = useTranslation(['common', 'schedule']);
  return (
    <Layout>
      <h2>{t('schedule:heading')}</h2>
      <ul>
        <li>{t('schedule:item1')}</li>
        <li>{t('schedule:item2')}</li>
        <li>{t('schedule:item3')}</li>
      </ul>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'schedule'])),
    },
  };
}
