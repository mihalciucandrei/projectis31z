import { STATUS, RES_STATUS } from '@/lib/format';

const COLORS = {
  active: 'bg-emerald-100 text-emerald-800',
  reserved: 'bg-amber-100 text-amber-800',
  sold: 'bg-slate-200 text-slate-700',
  archived: 'bg-slate-100 text-slate-500',
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-slate-200 text-slate-600',
};

export function StatusBadge({ status, reservation }) {
  const label = reservation ? RES_STATUS[status] : STATUS[status];
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${COLORS[status] || ''}`}>{label}</span>;
}

export function Spinner({ label = 'Загрузка…' }) {
  return <div className="py-16 text-center text-sm text-ink-mute">{label}</div>;
}

export function Empty({ title, children }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-mute">{children}</div>}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{children}</div>;
}

export function PageTitle({ children, aside }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{children}</h1>
      {aside}
    </div>
  );
}
