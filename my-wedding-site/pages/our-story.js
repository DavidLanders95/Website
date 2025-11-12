import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';

export default function OurStory() {
  const { t } = useTranslation(['common', 'ourStory']);
  return (
    <Layout>
      <section className="zoomHero" data-zoom>
        <div className="zoomMedia" aria-hidden="true" />
        <div className="zoomOverlay">
          <div>
            <h1>{t('ourStory:heroTitle')}</h1>
            <p>{t('ourStory:heroSubtitle')}</p>
          </div>
        </div>
      </section>

      <section className="story">
        <div className="timelinePro">
          <div className="row" data-reveal>
            <div className="left"><article className="item reveal-left"><h3>{t('ourStory:item1.title')}</h3><p className="muted">{t('ourStory:item1.time')}</p><p>{t('ourStory:item1.text')}</p></article></div>
            <span className="dot" aria-hidden="true" />
            <div className="right" />
          </div>
          <div className="row" data-reveal>
            <div className="left" />
            <span className="dot" aria-hidden="true" />
            <div className="right"><article className="item reveal-right"><h3>{t('ourStory:item2.title')}</h3><p className="muted">{t('ourStory:item2.time')}</p><p>{t('ourStory:item2.text')}</p></article></div>
          </div>
          <div className="row" data-reveal>
            <div className="left"><article className="item reveal-left"><h3>{t('ourStory:item3.title')}</h3><p className="muted">{t('ourStory:item3.time')}</p><p>{t('ourStory:item3.text')}</p></article></div>
            <span className="dot" aria-hidden="true" />
            <div className="right" />
          </div>
          <div className="row" data-reveal>
            <div className="left" />
            <span className="dot" aria-hidden="true" />
            <div className="right"><article className="item reveal-right"><h3>{t('ourStory:item4.title')}</h3><p className="muted">{t('ourStory:item4.time')}</p><p>{t('ourStory:item4.text')}</p></article></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'ourStory'])),
    },
  };
}
