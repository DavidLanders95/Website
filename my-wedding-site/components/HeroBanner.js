import Image from 'next/image';

const HERO_SRC = '/hero/hero.png';

export default function HeroBanner() {

  return (
    <section className="heroBanner simple" aria-label="Hero banner">
      <div className="heroGrid">
        <div className="tile" style={{ gridColumn: '1 / span 12' }} aria-hidden="true">
          <Image
            src={HERO_SRC}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: 'contain', objectPosition: '50% 0%' }}
            priority
            onError={() => {
              // Fallback to PNG if JPEG is not present
              if (src !== '/hero/hero.png') setSrc('/hero/hero.png');
            }}
          />
        </div>
      </div>
    </section>
  );
}
