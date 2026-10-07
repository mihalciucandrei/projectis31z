'use client';
import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '@/lib/api';
import { useRequireAuth } from '@/components/AuthProvider';
import { ErrorBox, PageTitle, Spinner } from '@/components/ui';
import { ROLE, fmtDay, fmtPrice } from '@/lib/format';

function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-extrabold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-ink-mute">
            <tr><th className="pb-2 font-semibold">Значение</th><th className="pb-2 font-semibold">Объявления</th><th className="pb-2 text-right font-semibold">В продаже</th><th className="pb-2 text-right font-semibold">Продано</th><th className="pb-2 text-right font-semibold">Средняя цена</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                <td className="py-2 pr-3 font-semibold">{r.key}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 rounded-sm bg-road" style={{ width: `${(r.total / max) * 140 + 4}px` }} />
                    <span>{r.total}</span>
                  </div>
                </td>
                <td className="py-2 text-right">{r.active}</td>
                <td className="py-2 text-right">{r.sold}</td>
                <td className="py-2 text-right">{r.avg_price != null ? fmtPrice(r.avg_price) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Admin() {
  const { ready, user: me } = useRequireAuth(['admin']);
  const [tab, setTab] = useState('analytics');
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const loadUsers = useCallback(() => api.get('/admin/users').then((r) => setUsers(r.data)), []);
  useEffect(() => {
    if (!ready) return;
    Promise.all(['summary', 'analytics/by-brand', 'analytics/by-city', 'analytics/by-month'].map((p) => api.get(`/admin/${p}`)))
      .then(([s, b, c, m]) => setData({ summary: s.data, brand: b.data, city: c.data, month: m.data }))
      .catch((e) => setError(errMsg(e)));
    loadUsers();
  }, [ready, loadUsers]);

  const run = async (fn) => { setError(''); try { await fn(); await loadUsers(); } catch (e) { setError(errMsg(e)); } };

  if (!ready || !data) return <Spinner />;
  const s = data.summary;
  const tiles = [['Пользователи', s.users], ['Объявления', s.cars_total], ['В продаже', s.cars_active], ['Забронировано', s.cars_reserved], ['Продано', s.cars_sold], ['Брони в ожидании', s.reservations_pending], ['Сообщения', s.messages]];

  return (
    <div className="container-page py-8">
      <PageTitle>Администрирование</PageTitle>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map(([k, v]) => (<div key={k} className="card p-3"><p className="text-xs font-semibold text-ink-mute">{k}</p><p className="text-2xl font-black">{v}</p></div>))}
      </div>
      <div className="mb-5 flex gap-2" role="tablist">
        {[['analytics', 'Аналитика'], ['users', 'Пользователи']].map(([k, t]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>
      <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>

      {tab === 'analytics' ? (
        <div className="space-y-5">
          <Bars title="По маркам" rows={data.brand} />
          <Bars title="По городам" rows={data.city} />
          <Bars title="По месяцам публикации" rows={data.month} />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-ink-mute"><tr><th className="p-3">Имя</th><th className="p-3">Email</th><th className="p-3">Роль</th><th className="p-3">Регистрация</th><th className="p-3" /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select aria-label={`Роль ${u.name}`} className="input w-auto py-1" disabled={u.id === me.id} value={u.role}
                      onChange={(e) => run(() => api.patch(`/admin/users/${u.id}/role`, { role: e.target.value }))}>
                      {Object.entries(ROLE).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-ink-mute">{fmtDay(u.created_at)}</td>
                  <td className="p-3 text-right">
                    {u.id !== me.id && <button className="btn-danger py-1" onClick={() => confirm(`Удалить ${u.name} со всеми объявлениями?`) && run(() => api.delete(`/admin/users/${u.id}`))}>Удалить</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
