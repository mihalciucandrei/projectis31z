'use client';

import { useState } from 'react';

const BRAND_IMAGE_MAP = {
  volkswagen: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
  bmw: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
  mercedes: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
  mercedesbenz: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
  audi: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80',
  toyota: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  skoda: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80',
  dacia: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
  renault: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80',
  ford: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  honda: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80',
  tesla: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
  hyundai: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  opel: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
};

const PALETTE = [['#1d4fa3', '#0f2a43'], ['#2f6f5e', '#123a30'], ['#8a3b3b', '#3b1717'], ['#5b4a9a', '#241b4a'], ['#3b6f8a', '#10303f'], ['#7a6a2f', '#33290c']];

const normalizeBrandName = (brand = '') => {
  const compact = String(brand || '').toLowerCase().replace(/[^a-z]/g, '');
  if (BRAND_IMAGE_MAP[compact]) return compact;
  if (compact.endsWith('benz') && compact.startsWith('mercedes')) return 'mercedesbenz';
  return 'default';
};

function Placeholder({ id = 0, label }) {
  const [a, b] = PALETTE[id % PALETTE.length];
  const gid = `g${id}`;
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" role="img" aria-label={label || 'Фото отсутствует'} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${gid})`} />
      <rect y="150" width="320" height="50" fill="#000" opacity=".18" />
      <path d="M52 138 L70 108 Q80 92 104 90 L196 90 Q222 92 238 112 L270 120 Q284 124 284 138 L284 148 L52 148 Z" fill="#fff" opacity=".92" />
      <path d="M92 108 L106 97 L152 97 L152 118 L84 118 Z M162 97 L196 97 Q210 99 220 114 L220 118 L162 118 Z" fill={a} opacity=".55" />
      <circle cx="100" cy="150" r="17" fill="#0f2a43" /><circle cx="100" cy="150" r="7" fill="#cbd5e1" />
      <circle cx="236" cy="150" r="17" fill="#0f2a43" /><circle cx="236" cy="150" r="7" fill="#cbd5e1" />
    </svg>
  );
}

export default function CarImage({ src, id, alt, brand }) {
  const fallbackBrand = brand ? brand : alt ? alt.split(' ')[0] : '';
  const fallbackSrc = BRAND_IMAGE_MAP[normalizeBrandName(fallbackBrand)] || BRAND_IMAGE_MAP.default;
  const [failed, setFailed] = useState(false);
  const imageSrc = src || fallbackSrc;

  if (!imageSrc || failed) return <Placeholder id={id} label={alt} />;

  return <img src={imageSrc} alt={alt || ''} className="h-full w-full object-cover" loading="lazy" onError={() => setFailed(true)} />;
}
