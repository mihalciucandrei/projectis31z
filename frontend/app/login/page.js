'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { errMsg } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { ErrorBox } from '@/components/ui';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await login(email, password); router.push('/cars'); } catch (err) { setError(errMsg(err)); }
    setBusy(false);
  };
  const demo = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="container-page max-w-md py-12">
      <h1 className="mb-6 text-2xl font-extrabold">Вход</h1>
      <form onSubmit={submit} className="card space-y-4 p-5">
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <div><label className="label" htmlFor="pw">Пароль</label><input id="pw" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        <ErrorBox>{error}</ErrorBox>
        <button className="btn-primary w-full" disabled={busy}>Войти</button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">Нет аккаунта? <Link href="/register" className="font-semibold text-road underline">Зарегистрируйтесь</Link></p>
      <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-4 text-sm">
        <p className="mb-2 font-semibold">Демо-аккаунты</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => demo('buyer@automarket.md', 'buyer123')}>Покупатель</button>
          <button type="button" className="btn-ghost" onClick={() => demo('seller@automarket.md', 'seller123')}>Продавец</button>
          <button type="button" className="btn-ghost" onClick={() => demo('admin@automarket.md', 'admin123')}>Админ</button>
        </div>
      </div>
    </div>
  );
}
