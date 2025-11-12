import { useState } from 'react';
import Image from 'next/image';

// Simple hero banner that uses `/public/hero/hero.jpeg`, with a fallback to `/public/hero/hero.png` if missing
export default function HeroBanner() {
  const [src, setSrc] = useState('/hero/hero.jpeg');

  return (
    <section className="heroBanner simple" aria-label="Hero banner">
      <div className="heroGrid">
        <div className="tile" style={{ gridColumn: '1 / span 12' }} aria-hidden="true">
          <Image
            src={src}
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
