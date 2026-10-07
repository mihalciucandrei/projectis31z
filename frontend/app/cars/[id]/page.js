'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api, { errMsg } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import CarImage from '@/components/CarImage';
import { Empty, ErrorBox, Spinner, StatusBadge } from '@/components/ui';
import { BODY, FUEL, TRANS, fmtDay, fmtKm, fmtPrice } from '@/lib/format';

export default function CarPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, favIds, toggleFavorite } = useAuth();
  const [car, setCar] = useState(undefined);
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/cars/${id}`).then((r) => setCar(r.data)).catch(() => setCar(null));
  }, [id]);
  useEffect(load, [load, user?.id]);

  if (car === undefined) return <Spinner />;
  if (car === null) return <div className="container-page py-10"><Empty title="Объявление не найдено"><Link href="/cars" className="text-road underline">Вернуться в каталог</Link></Empty></div>;

  const own = user && user.id === car.seller_id;
  const isAdmin = user?.role === 'admin';
  const fav = favIds.has(car.id);
  const photo = car.photos[idx]?.url;

  const act = async (fn, okText) => {
    setBusy(true); setError(''); setNote(null);
    try { await fn(); if (okText) setNote(okText); } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  const reserve = () => act(async () => {
    await api.post('/reservations', { car_id: car.id });
    load();
  }, 'Автомобиль забронирован. Продавец должен подтвердить бронь — статус виден в разделе «Брони».');

  const send = (e) => {
    e.preventDefault();
    act(async () => { await api.post('/messages', { car_id: car.id, message_text: text }); setText(''); }, 'Сообщение отправлено продавцу. Ответ придёт в раздел «Сообщения».');
  };

  const remove = () => {
    if (!confirm('Удалить это объявление?')) return;
    act(async () => { await api.delete(`/cars/${car.id}`); router.push('/cars'); });
  };

  const specs = [['Год', car.year], ['Пробег', fmtKm(car.mileage)], ['Топливо', FUEL[car.fuel_type]], ['Коробка', TRANS[car.transmission]], ['Кузов', BODY[car.body_type]], ['Город', car.city]];

  return (
    <div className="container-page py-8">
      <Link href="/cars" className="text-sm font-semibold text-road hover:underline">← К каталогу</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="card overflow-hidden">
            <div className="aspect-[16/10] bg-slate-200"><CarImage src={photo} id={car.id} alt={`${car.brand} ${car.model}`} /></div>
            {car.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {car.photos.map((p, i) => (
                  <button key={p.id} onClick={() => setIdx(i)} aria-label={`Фото ${i + 1}`}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded border-2 ${i === idx ? 'border-road' : 'border-transparent'}`}>
                    <CarImage src={p.url} id={car.id} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card mt-6 p-5">
            <h2 className="mb-3 text-lg font-extrabold">Характеристики</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {specs.map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold text-ink-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
            {car.description && (<>
              <h2 className="mb-2 mt-6 text-lg font-extrabold">Описание</h2>
              <p className="max-w-prose whitespace-pre-line text-ink-soft">{car.description}</p>
            </>)}
            <p className="mt-6 text-xs text-ink-mute">Опубликовано {fmtDay(car.created_at)}</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-extrabold">{car.brand} {car.model}</h1>
              <StatusBadge status={car.status} />
            </div>
            <p className="mt-1 text-3xl font-black text-road">{fmtPrice(car.price)}</p>

            <div className="mt-4 flex flex-col gap-2">
              {!own && car.status === 'active' && (
                user ? <button className="btn-accent" disabled={busy} onClick={reserve}>Забронировать</button>
                     : <Link href="/login" className="btn-accent">Войдите, чтобы забронировать</Link>
              )}
              {!own && <button className="btn-ghost" onClick={() => toggleFavorite(car.id)}>{fav ? 'Убрать из избранного' : 'В избранное'}</button>}
              {(own || isAdmin) && <Link className="btn-ghost" href={`/seller/${car.id}`}>Редактировать</Link>}
              {(own || isAdmin) && <button className="btn-danger" disabled={busy} onClick={remove}>Удалить объявление</button>}
            </div>
            {note && <p role="status" className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{note}</p>}
            <div className="mt-3"><ErrorBox>{error}</ErrorBox></div>
          </div>

          <div className="card p-5">
            <h2 className="font-extrabold">Продавец</h2>
            <p className="mt-1 font-semibold">{car.seller.name}</p>
            <p className="text-sm text-ink-soft">{car.seller.city}</p>
            {car.seller.phone && <a className="mt-1 block text-sm font-semibold text-road" href={`tel:${car.seller.phone.replace(/\s/g, '')}`}>{car.seller.phone}</a>}

            {!own && (user ? (
              <form onSubmit={send} className="mt-4">
                <label className="label" htmlFor="msg">Написать продавцу</label>
                <textarea id="msg" className="input min-h-24" required maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Автомобиль ещё в продаже? Когда можно посмотреть?" />
                <button className="btn-primary mt-2 w-full" disabled={busy || !text.trim()}>Отправить</button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-ink-mute"><Link href="/login" className="font-semibold text-road underline">Войдите</Link>, чтобы написать продавцу.</p>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
