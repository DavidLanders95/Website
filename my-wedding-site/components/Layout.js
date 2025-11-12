import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export default function Layout({ children }) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { locale } = router;
  const otherLocale = locale === 'en' ? 'fr' : 'en';

  // Build locale-switch href without nesting locale prefix twice
  const stripLocalePrefix = (p) => p.replace(/^\/(en|fr)(?=\/|$)/, '') || '/';
  const switchHref = `/${otherLocale}${stripLocalePrefix(router.asPath)}`;

  const switchLabel = otherLocale === 'fr' ? '🇫🇷 FR' : '🇮🇪 EN';

  return (
    <div className="container">
      <nav>
        <a className={router.pathname === '/' ? 'active' : ''} href="/">{t('nav.home')}</a>
        <a href="/#where">{t('nav.where')}</a>
        <a href="/#when">{t('nav.when')}</a>
        <a href="/#what">{t('nav.what')}</a>
        <a href="/#hostel">{t('nav.hostel')}</a>
        {/* Removed Our Story, Schedule, and Travel from navigation per request */}
        <a className={router.pathname === '/rsvp' ? 'active' : ''} href="/rsvp">{t('nav.rsvp')}</a>
        <a className="langSwitch" href={switchHref} hrefLang={otherLocale} aria-label={`Switch language to ${otherLocale.toUpperCase()}`}>
          {switchLabel}
        </a>
      </nav>
      <main>
        {children}
      </main>
      <footer>
        <p>© {new Date().getFullYear()} · {t('footer')}</p>
      </footer>
    </div>
  );
}
