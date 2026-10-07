'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { errMsg } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { ErrorBox } from '@/components/ui';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'buyer', phone: '', city: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...f, phone: f.phone || null, city: f.city || null };
      const u = await register(payload);
      router.push(u.role === 'seller' ? '/seller/new' : '/cars');
    } catch (err) { setError(errMsg(err)); }
    setBusy(false);
  };

  return (
    <div className="container-page max-w-md py-12">
      <h1 className="mb-6 text-2xl font-extrabold">Регистрация</h1>
      <form onSubmit={submit} className="card space-y-4 p-5">
        <fieldset>
          <legend className="label">Я хочу</legend>
          <div className="grid grid-cols-2 gap-2">
            {[['buyer', 'Покупать'], ['seller', 'Продавать']].map(([v, t]) => (
              <label key={v} className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-semibold ${f.role === v ? 'border-ink bg-ink text-white' : 'border-slate-300 bg-white'}`}>
                <input type="radio" className="sr-only" name="role" value={v} checked={f.role === v} onChange={set('role')} />{t}
              </label>
            ))}
          </div>
        </fieldset>
        <div><label className="label" htmlFor="name">Имя</label><input id="name" required minLength={2} className="input" value={f.name} onChange={set('name')} /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={f.email} onChange={set('email')} /></div>
        <div><label className="label" htmlFor="pw">Пароль (минимум 6 символов)</label><input id="pw" type="password" required minLength={6} className="input" value={f.password} onChange={set('password')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="phone">Телефон</label><input id="phone" className="input" value={f.phone} onChange={set('phone')} /></div>
          <div><label className="label" htmlFor="city">Город</label><input id="city" className="input" value={f.city} onChange={set('city')} /></div>
        </div>
        <ErrorBox>{error}</ErrorBox>
        <button className="btn-primary w-full" disabled={busy}>Создать аккаунт</button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">Уже есть аккаунт? <Link href="/login" className="font-semibold text-road underline">Войти</Link></p>
    </div>
  );
}
