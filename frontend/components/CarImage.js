const PALETTE = [['#1d4fa3', '#0f2a43'], ['#2f6f5e', '#123a30'], ['#8a3b3b', '#3b1717'], ['#5b4a9a', '#241b4a'], ['#3b6f8a', '#10303f'], ['#7a6a2f', '#33290c']];

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

export default function CarImage({ src, id, alt }) {
  if (!src) return <Placeholder id={id} label={alt} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt || ''} className="h-full w-full object-cover" loading="lazy" />;
}
