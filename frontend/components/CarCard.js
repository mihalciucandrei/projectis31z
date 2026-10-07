'use client';
import Link from 'next/link';
import CarImage from '@/components/CarImage';
import { StatusBadge } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { BODY, FUEL, TRANS, fmtKm, fmtPrice } from '@/lib/format';

export default function CarCard({ car }) {
  const { favIds, toggleFavorite, user } = useAuth();
  const fav = favIds.has(car.id);
  const own = user && user.id === car.seller_id;
  return (
    <article className="card group overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
        <Link href={`/cars/${car.id}`} aria-label={`${car.brand} ${car.model}`} className="block h-full">
          <CarImage src={car.main_photo} id={car.id} brand={car.brand} alt={`${car.brand} ${car.model}`} />
        </Link>
        {car.status !== 'active' && <div className="absolute left-2 top-2"><StatusBadge status={car.status} /></div>}
        {!own && (
          <button
            onClick={() => toggleFavorite(car.id)}
            aria-pressed={fav}
            aria-label={fav ? 'Убрать из избранного' : 'Добавить в избранное'}
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={fav ? '#dc2626' : 'none'} stroke={fav ? '#dc2626' : '#0f2a43'} strokeWidth="2">
              <path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.3 12C19 16.4 12 21 12 21z" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4">
        <Link href={`/cars/${car.id}`} className="block">
          <h3 className="truncate text-base font-bold">{car.brand} {car.model}</h3>
          <p className="mt-0.5 text-xl font-extrabold text-road">{fmtPrice(car.price)}</p>
        </Link>
        <p className="mt-2 text-sm text-ink-soft">
          {car.year} г., {fmtKm(car.mileage)}, {FUEL[car.fuel_type]}
        </p>
        <p className="text-sm text-ink-soft">{TRANS[car.transmission]}, {BODY[car.body_type]}</p>
        <p className="mt-2 text-xs font-semibold text-ink-mute">{car.city}</p>
      </div>
    </article>
  );
}
