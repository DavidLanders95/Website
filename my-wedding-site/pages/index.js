import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';
import MiniCalendar from '../components/MiniCalendar';
import HeroBanner from '../components/HeroBanner';

export default function Home() {
  const { t } = useTranslation(['common', 'home']);
  const confettiRef = useRef(null);
  const hostelPhotos = [1, 2, 3, 4, 5, 6];
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const photoCount = hostelPhotos.length;

  const fireConfetti = async () => {
    try {
      const confetti = confettiRef.current || (await import('canvas-confetti')).default;
      confettiRef.current = confetti;

      const rand = (min, max) => Math.random() * (max - min) + min;
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));

      // Irish (green, white, gold) on left; French (blue, white, red) on right
      const irish = ['#169B62', '#FFFFFF', '#FF8F00'];
      const french = ['#0055A4', '#FFFFFF', '#ED2939'];
      const colors = [...irish, ...french];

      // 1) Center burst
      confetti({
        particleCount: Math.floor(rand(120, 200)),
        spread: rand(75, 120),
        startVelocity: rand(45, 70),
        gravity: rand(0.8, 1.0),
        decay: rand(0.87, 0.93),
        scalar: rand(0.9, 1.1),
        colors,
        origin: { x: 0.5, y: 0.35 },
      });

      // 2) Ring of mini-bursts around center
      const ringBursts = 8;
      for (let i = 0; i < ringBursts; i++) {
        const angle = (i / ringBursts) * Math.PI * 2;
        const x = 0.5 + Math.cos(angle) * 0.22;
        const y = 0.35 + Math.sin(angle) * 0.12;
        confetti({
          particleCount: 18,
          spread: 30 + rand(0, 20),
          startVelocity: 40,
          gravity: 0.9,
          decay: 0.92,
          scalar: 0.9,
          colors,
          origin: { x, y },
        });
      }

      await wait(180);

      // 3) Side cannons with slight drift (Irish left, French right)
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.6 },
        startVelocity: 55,
        drift: 0.6,
        gravity: 0.95,
        colors: irish,
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.6 },
        startVelocity: 55,
        drift: -0.6,
        gravity: 0.95,
        colors: french,
      });

      await wait(220);
      // Removed the long falling stream for a snappier effect
    } catch {}
  };
  useEffect(() => {
    fireConfetti();
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
      } else if (event.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev === null ? prev : (prev + 1) % photoCount));
      } else if (event.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev === null ? prev : (prev + photoCount - 1) % photoCount));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex, photoCount]);

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const showNext = () => setLightboxIndex((prev) => (prev === null ? prev : (prev + 1) % photoCount));
  const showPrev = () => setLightboxIndex((prev) => (prev === null ? prev : (prev + photoCount - 1) % photoCount));
  const embedQuery = t('home:where.embedQuery');
  const embedLat = t('home:where.embedLat');
  const embedLng = t('home:where.embedLng');
  const embedZoom = t('home:where.embedZoom');
  const embedUrl = t('home:where.embedUrl');
  const embedSrc = (embedLat && embedLng)
    ? `https://www.google.com/maps?ll=${encodeURIComponent(embedLat)},${encodeURIComponent(embedLng)}&q=${encodeURIComponent(embedLat)},${encodeURIComponent(embedLng)}&z=${encodeURIComponent(embedZoom || '16')}&t=m&output=embed`
    : (embedUrl
      ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}z=${encodeURIComponent(embedZoom || '16')}&output=embed`
      : (embedQuery ? `https://www.google.com/maps?q=${encodeURIComponent(embedQuery)}&z=${encodeURIComponent(embedZoom || '16')}&output=embed` : ''));
  const heroSubtitleUrl = t('home:heroSubtitleUrl');
  return (
    <Layout>
      <section className="hero" aria-labelledby="hero-heading">
        <div>
          <h2 id="hero-heading">{t('home:heroTitle')}</h2>
          <p>
            {heroSubtitleUrl
              ? (<a href={heroSubtitleUrl} target="_blank" rel="noreferrer">{t('home:heroSubtitle')}</a>)
              : t('home:heroSubtitle')}
          </p>
          <div className="heroCtas">
            <Link className="button" href="/rsvp">{t('home:ctaRsvp')}</Link>
            <button type="button" className="button secondary" onClick={fireConfetti}>{t('home:ctaConfetti')}</button>
          </div>
        </div>
      </section>

      <HeroBanner />

      <section className="infoGrid" aria-labelledby="where when">
        <div id="where" className="card" data-reveal>
          <h3>{t('home:where.heading')}</h3>
          <p className="whereSubtitle">{t('home:where.subtitle')}</p>
          <p>{t('home:where.venue')}</p>
          {t('home:where.mapLink') && (
            <p><a href={t('home:where.mapLink')} target="_blank" rel="noreferrer">{t('home:where.viewMap')}</a></p>
          )}
          {embedSrc && (
            <div className="map">
              <iframe
                title={t('home:where.heading')}
                src={embedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
        </div>
        <div id="when" className="card" data-reveal>
          <h3>{t('home:when.heading')}</h3>
          <p className="whenSubtitle">{t('home:when.subtitle')}</p>
          {(() => {
            const year = 2026;
            const month = 6; // July (0-indexed)
            const highlight = `2026-07-04`;
            return (
              <MiniCalendar initialYear={year} initialMonth={month} highlights={[highlight]} />
            );
          })()}
        </div>
      </section>

      <section id="what" className={`timeline ${Array.isArray(t('home:what.lines', { returnObjects: true })) && t('home:what.lines', { returnObjects: true }).length ? 'simple' : ''}`} data-reveal>
        <h3>{t('home:what.heading')}</h3>
        {(() => {
          const lines = t('home:what.lines', { returnObjects: true });
          if (Array.isArray(lines) && lines.length) {
            return (
              <ul>
                {lines.map((line, idx) => (
                  <li key={idx}><span>{line}</span></li>
                ))}
              </ul>
            );
          }
          return null;
        })()}
      </section>

      <section id="hostel" className={`timeline ${Array.isArray(t('home:hostel.lines', { returnObjects: true })) && t('home:hostel.lines', { returnObjects: true }).length ? 'simple' : ''}`} data-reveal>
        <h3>{t('home:hostel.heading')}</h3>
        {(() => {
          const lines = t('home:hostel.lines', { returnObjects: true });
          if (Array.isArray(lines) && lines.length) {
            return (
              <ul>
                {lines.map((line, idx) => (
                  <li key={idx}><span>{line}</span></li>
                ))}
              </ul>
            );
          }
          return null;
        })()}
        <div className="hostelGallery" aria-label="Hostel photos">
          {hostelPhotos.map((n, idx) => (
            <button
              key={n}
              type="button"
              className="hostelPhoto"
              onClick={() => openLightbox(idx)}
              aria-label={t('home:hostelPhotoExpand', { index: n })}
            >
              <Image
                src={`/hostel/gite-${n}.png`}
                alt={t('home:hostelPhotoAlt', { index: n })}
                fill
                sizes="(max-width: 700px) 50vw, (max-width: 1024px) 33vw, 320px"
                className="hostelImage"
                priority={n <= 2}
              />
            </button>
          ))}
        </div>
      </section>

      {lightboxIndex !== null && (
        <div
          className="lightboxOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={t('home:hostel.heading')}
          onClick={closeLightbox}
        >
          <div className="lightboxContent" role="document" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lightboxClose" onClick={closeLightbox} aria-label={t('home:hostelLightbox.close')}>
              ×
            </button>
            <div className="lightboxImageWrap">
              <Image
                src={`/hostel/gite-${hostelPhotos[lightboxIndex]}.png`}
                alt={t('home:hostelPhotoAlt', { index: hostelPhotos[lightboxIndex] })}
                fill
                sizes="90vw"
                className="hostelImage"
                priority
              />
            </div>
            <div className="lightboxNav">
              <button type="button" className="lightboxArrow" onClick={showPrev} aria-label={t('home:hostelLightbox.previous')}>
                ‹
              </button>
              <span className="lightboxCounter">
                {lightboxIndex + 1} / {photoCount}
              </span>
              <button type="button" className="lightboxArrow" onClick={showNext} aria-label={t('home:hostelLightbox.next')}>
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'home'])),
    },
  };
}
