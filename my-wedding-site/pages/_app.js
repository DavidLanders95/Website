import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { appWithTranslation } from 'next-i18next';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Keep existing scroll-to-top behavior on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.history.scrollRestoration = 'manual';
      const doc = document.documentElement;
      const prev = doc.style.scrollBehavior;
      doc.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      doc.style.scrollBehavior = prev;
    } catch {}
  }, []);

  // Re-initialize reveal + zoom effects on every route change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    let io;
    if ('IntersectionObserver' in window && els.length) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
      els.forEach((el) => io.observe(el));
    } else {
      els.forEach((el) => el.classList.add('in'));
    }

    const zoomEl = document.querySelector('[data-zoom]');
    let onScroll;
    if (zoomEl) {
      onScroll = () => {
        const max = 300;
        const y = Math.max(0, Math.min(max, window.scrollY));
        const scale = 1.12 - (y / max) * 0.12;
        zoomEl.style.setProperty('--zoom', String(scale));
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      if (io) io.disconnect();
      if (onScroll) window.removeEventListener('scroll', onScroll);
    };
  }, [router.asPath]);

  return <Component {...pageProps} />;
}

export default appWithTranslation(MyApp);
