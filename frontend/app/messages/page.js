'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api, { errMsg } from '@/lib/api';
import { useAuth, useRequireAuth } from '@/components/AuthProvider';
import { Empty, ErrorBox, PageTitle, Spinner } from '@/components/ui';
import { fmtDate } from '@/lib/format';

export default function Messages() {
  const { ready, user } = useRequireAuth();
  const { refreshUnread } = useAuth();
  const [msgs, setMsgs] = useState(null);
  const [active, setActive] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setMsgs((await api.get('/messages')).data);
  }, []);
  useEffect(() => { if (ready) load(); }, [ready, load]);

  const threads = useMemo(() => {
    if (!msgs || !user) return [];
    const map = new Map();
    for (const m of msgs) {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const otherName = m.sender_id === user.id ? m.receiver_name : m.sender_name;
      const key = `${m.car_id}:${otherId}`;
      if (!map.has(key)) map.set(key, { key, carId: m.car_id, car: m.car_title, otherId, otherName, items: [], unread: 0 });
      const t = map.get(key);
      t.items.push(m);
      if (m.receiver_id === user.id && !m.is_read) t.unread += 1;
    }
    return [...map.values()].sort((a, b) => new Date(b.items.at(-1).created_at) - new Date(a.items.at(-1).created_at));
  }, [msgs, user]);

  const current = threads.find((t) => t.key === active) || null;

  const open = async (t) => {
    setActive(t.key); setError('');
    if (t.unread) {
      await api.post('/messages/read', null, { params: { car_id: t.carId, with_user_id: t.otherId } });
      await load(); refreshUnread();
    }
  };

  const send = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/messages', { car_id: current.carId, receiver_id: current.otherId, message_text: text });
      setText(''); await load();
    } catch (err) { setError(errMsg(err)); }
  };

  if (!ready || msgs === null) return <Spinner />;

  return (
    <div className="container-page py-8">
      <PageTitle>Сообщения</PageTitle>
      {threads.length === 0 ? (
        <Empty title="Переписок пока нет">Откройте объявление и напишите продавцу — диалог появится здесь.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <ul className="card divide-y divide-slate-100 overflow-hidden">
            {threads.map((t) => (
              <li key={t.key}>
                <button onClick={() => open(t)} className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${active === t.key ? 'bg-slate-100' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{t.otherName}</span>
                    {t.unread > 0 && <span className="rounded-full bg-plate px-2 text-xs font-bold">{t.unread}</span>}
                  </div>
                  <div className="truncate text-xs text-ink-mute">{t.car}</div>
                  <div className="truncate text-sm text-ink-soft">{t.items.at(-1).message_text}</div>
                </button>
              </li>
            ))}
          </ul>
          <div className="card flex min-h-80 flex-col p-4">
            {!current ? <p className="m-auto text-sm text-ink-mute">Выберите диалог слева</p> : (
              <>
                <div className="mb-3 border-b border-slate-100 pb-3">
                  <p className="font-bold">{current.otherName}</p>
                  <Link href={`/cars/${current.carId}`} className="text-sm text-road hover:underline">{current.car}</Link>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {current.items.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : ''}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-ink text-white' : 'bg-slate-100'}`}>
                          <p className="whitespace-pre-line">{m.message_text}</p>
                          <p className={`mt-1 text-[11px] ${mine ? 'text-white/60' : 'text-ink-mute'}`}>{fmtDate(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={send} className="mt-3 flex gap-2">
                  <label className="sr-only" htmlFor="reply">Ответ</label>
                  <input id="reply" className="input" required value={text} onChange={(e) => setText(e.target.value)} placeholder="Ваше сообщение" />
                  <button className="btn-primary" disabled={!text.trim()}>Отправить</button>
                </form>
                <div className="mt-2"><ErrorBox>{error}</ErrorBox></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
