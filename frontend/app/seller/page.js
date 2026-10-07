'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api, { errMsg } from '@/lib/api';
import { useRequireAuth } from '@/components/AuthProvider';
import CarImage from '@/components/CarImage';
import { Empty, ErrorBox, PageTitle, Spinner, StatusBadge } from '@/components/ui';
import { fmtKm, fmtPrice } from '@/lib/format';

export default function SellerCars() {
  const { ready } = useRequireAuth(['seller', 'admin']);
  const [cars, setCars] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => api.get('/cars/mine', { params: { page_size: 60 } }).then((r) => setCars(r.data.items)), []);
  useEffect(() => { if (ready) load(); }, [ready, load]);

  const run = async (fn) => { setError(''); try { await fn(); await load(); } catch (e) { setError(errMsg(e)); } };
  const toggleArchive = (c) => run(() => api.put(`/cars/${c.id}`, { status: c.status === 'archived' ? 'active' : 'archived' }));
  const remove = (c) => confirm(`Удалить «${c.brand} ${c.model}»?`) && run(() => api.delete(`/cars/${c.id}`));

  if (!ready || cars === null) return <Spinner />;
  return (
    <div className="container-page py-8">
      <PageTitle aside={<Link href="/seller/new" className="btn-accent">Новое объявление</Link>}>Мои объявления</PageTitle>
      <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>
      {cars.length === 0 ? <Empty title="Вы ещё ничего не опубликовали"><Link href="/seller/new" className="text-road underline">Создайте первое объявление</Link></Empty> : (
        <div className="space-y-3">
          {cars.map((c) => (
            <div key={c.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded bg-slate-200 sm:w-40"><CarImage src={c.main_photo} id={c.id} alt="" /></div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/cars/${c.id}`} className="font-bold hover:underline">{c.brand} {c.model}, {c.year}</Link>
                  <StatusBadge status={c.status} />
                </div>
                <p className="font-extrabold text-road">{fmtPrice(c.price)}</p>
                <p className="text-sm text-ink-mute">{fmtKm(c.mileage)}, {c.city}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/seller/${c.id}`} className="btn-ghost">Изменить</Link>
                {(c.status === 'active' || c.status === 'archived') && (
                  <button className="btn-ghost" onClick={() => toggleArchive(c)}>{c.status === 'archived' ? 'Опубликовать' : 'В архив'}</button>
                )}
                <button className="btn-danger" onClick={() => remove(c)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
