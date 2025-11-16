import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export default function Layout({ children }) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { locale } = router;
  const otherLocale = locale === 'en' ? 'fr' : 'en';

  const stripLocalePrefix = (p = '') => p.replace(/^\/(en|fr)(?=[\/?#]|$)/, '') || '/';
  const switchHref = stripLocalePrefix(router.asPath);
  const switchLabel = otherLocale === 'fr' ? '🇫🇷 FR' : '🇮🇪 EN';

  const navLinks = [
    { key: 'home', label: t('nav.home'), href: '/', isActive: router.pathname === '/' },
    { key: 'where', label: t('nav.where'), href: { pathname: '/', hash: 'where' } },
    { key: 'when', label: t('nav.when'), href: { pathname: '/', hash: 'when' } },
    { key: 'what', label: t('nav.what'), href: { pathname: '/', hash: 'what' } },
    { key: 'hostel', label: t('nav.hostel'), href: { pathname: '/', hash: 'hostel' } },
    { key: 'rsvp', label: t('nav.rsvp'), href: '/rsvp', isActive: router.pathname === '/rsvp' },
  ];

  return (
    <div className="container">
      <nav>
        {navLinks.map(({ key, label, href, isActive }) => (
          <Link key={key} href={href} locale={locale} className={isActive ? 'active' : ''}>
            {label}
          </Link>
        ))}
        <Link
          className="langSwitch"
          href={switchHref}
          locale={otherLocale}
          hrefLang={otherLocale}
          aria-label={`Switch language to ${otherLocale.toUpperCase()}`}
        >
          {switchLabel}
        </Link>
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
