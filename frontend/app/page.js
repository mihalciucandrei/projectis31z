'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import CarCard from '@/components/CarCard';
import { Spinner } from '@/components/ui';
import { BODY } from '@/lib/format';

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cars, setCars] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    api.get('/cars', { params: { page_size: 8 } }).then((r) => setCars(r.data.items)).catch(() => setCars([]));
    api.get('/cars/meta').then((r) => setMeta(r.data)).catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    router.push(`/cars${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <>
      <section className="bg-ink pb-14 pt-12 text-white">
        <div className="container-page">
          <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
            Найдите свой следующий автомобиль в Молдове
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Объявления частных продавцов и дилеров с понятными карточками: пробег, топливо, коробка, город и цена.
          </p>
          <form onSubmit={search} className="plate mt-8 max-w-2xl shadow-xl" role="search">
            <div className="plate-strip"><i />MD</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Марка или модель" aria-label="Марка или модель" />
            <button type="submit">Найти</button>
          </form>
          {meta && (
            <div className="mt-6 flex flex-wrap gap-2">
              {meta.brands.slice(0, 8).map((b) => (
                <Link key={b.name} href={`/cars?brand=${encodeURIComponent(b.name)}`}
                  className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/90 hover:bg-white/10">
                  {b.name} <span className="text-white/50">{b.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-extrabold">Свежие объявления</h2>
          <Link href="/cars" className="text-sm font-semibold text-road hover:underline">Весь каталог</Link>
        </div>
        {cars === null ? <Spinner /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cars.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        )}
      </section>

      <section className="container-page mt-12">
        <h2 className="mb-4 text-xl font-extrabold">По типу кузова</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BODY).map(([k, v]) => (
            <Link key={k} href={`/cars?body_type=${k}`} className="btn-ghost">{v}</Link>
          ))}
        </div>
      </section>
    </>
  );
}
