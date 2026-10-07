'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api, { errMsg } from '@/lib/api';
import { useRequireAuth } from '@/components/AuthProvider';
import CarImage from '@/components/CarImage';
import { Empty, ErrorBox, PageTitle, Spinner, StatusBadge } from '@/components/ui';
import { fmtDate, fmtPrice } from '@/lib/format';

function ResCard({ r, mode, onAction, busy }) {
  const active = r.status === 'pending' || r.status === 'confirmed';
  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row">
      <div className="h-28 w-full shrink-0 overflow-hidden rounded bg-slate-200 sm:w-44">
        <CarImage src={r.car.main_photo} id={r.car.id} brand={r.car.brand} alt={`${r.car.brand} ${r.car.model}`} />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/cars/${r.car.id}`} className="font-bold hover:underline">{r.car.brand} {r.car.model}, {r.car.year}</Link>
          <StatusBadge status={r.status} reservation />
        </div>
        <p className="font-extrabold text-road">{fmtPrice(r.car.price)}</p>
        <p className="mt-1 text-xs text-ink-mute">Создана {fmtDate(r.created_at)}{r.confirmed_at && `, подтверждена ${fmtDate(r.confirmed_at)}`}</p>
        {mode === 'incoming' && (
          <p className="mt-1 text-sm text-ink-soft">Покупатель: <b>{r.buyer.name}</b>{r.buyer.phone && `, ${r.buyer.phone}`}, {r.buyer.email}</p>
        )}
      </div>
      {active && (
        <div className="flex gap-2 sm:flex-col">
          {mode === 'incoming' && r.status === 'pending' && <button className="btn-primary" disabled={busy} onClick={() => onAction(r.id, 'confirm')}>Подтвердить продажу</button>}
          {(mode === 'incoming' || r.status === 'pending') && <button className="btn-danger" disabled={busy} onClick={() => onAction(r.id, 'cancel')}>Отменить</button>}
        </div>
      )}
    </div>
  );
}

export default function Reservations() {
  const { ready, user } = useRequireAuth();
  const [tab, setTab] = useState('mine');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canSell = user && user.role !== 'buyer';

  const load = useCallback(() => {
    setList(null);
    api.get(tab === 'mine' ? '/reservations/mine' : '/reservations/incoming').then((r) => setList(r.data));
  }, [tab]);
  useEffect(() => { if (ready) load(); }, [ready, load]);

  const act = async (id, action) => {
    setBusy(true); setError('');
    try { await api.post(`/reservations/${id}/${action}`); load(); } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  if (!ready) return <Spinner />;
  return (
    <div className="container-page py-8">
      <PageTitle>Брони</PageTitle>
      {canSell && (
        <div className="mb-5 flex gap-2" role="tablist">
          {[['mine', 'Мои брони'], ['incoming', 'Входящие на мои авто']].map(([k, t]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab(k)}>{t}</button>
          ))}
        </div>
      )}
      <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>
      {list === null ? <Spinner /> : list.length === 0 ? (
        <Empty title="Броней нет">{tab === 'mine' ? <>Выберите авто в <Link href="/cars" className="text-road underline">каталоге</Link> и нажмите «Забронировать».</> : 'Когда покупатель забронирует ваше авто, бронь появится здесь.'}</Empty>
      ) : (
        <div className="space-y-4">{list.map((r) => <ResCard key={r.id} r={r} mode={tab} onAction={act} busy={busy} />)}</div>
      )}
    </div>
  );
}
