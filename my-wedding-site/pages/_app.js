import { appWithTranslation } from 'next-i18next';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default appWithTranslation(MyApp);

// Client-only enhancements
if (typeof window !== 'undefined') {
  // Always start at top on (re)load; disable browser scroll restoration
  try {
    window.history.scrollRestoration = 'manual';
    const resetToTop = () => {
      const doc = document.documentElement;
      const prev = doc.style.scrollBehavior;
      doc.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      doc.style.scrollBehavior = prev;
    };
    // Run once on initial load regardless of hash
    setTimeout(() => resetToTop(), 0);
  } catch {}

  // Intersection-based reveal animations
  window.__initReveal = window.__initReveal || (() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window) || els.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    els.forEach((el) => io.observe(el));
  });

  // Simple hero zoom effect: scales from 1.12 to 1.0 on first 300px
  window.__initZoom = window.__initZoom || (() => {
    const el = document.querySelector('[data-zoom]');
    if (!el) return;
    const onScroll = () => {
      const max = 300;
      const y = Math.max(0, Math.min(max, window.scrollY));
      const scale = 1.12 - (y / max) * 0.12; // 1.12 -> 1.0
      el.style.setProperty('--zoom', String(scale));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  });

  // Defer init to next tick to allow page to render
  setTimeout(() => {
    try { window.__initReveal(); } catch {}
    try { window.__initZoom(); } catch {}
  }, 0);
}
