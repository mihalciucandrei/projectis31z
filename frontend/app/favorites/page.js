'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRequireAuth, useAuth } from '@/components/AuthProvider';
import CarCard from '@/components/CarCard';
import { Empty, PageTitle, Spinner } from '@/components/ui';

export default function Favorites() {
  const { ready } = useRequireAuth();
  const { favIds } = useAuth();
  const [cars, setCars] = useState(null);

  useEffect(() => { if (ready) api.get('/favorites').then((r) => setCars(r.data)); }, [ready]);
  if (!ready || cars === null) return <Spinner />;

  const visible = cars.filter((c) => favIds.has(c.id));
  return (
    <div className="container-page py-8">
      <PageTitle>Избранное</PageTitle>
      {visible.length === 0 ? (
        <Empty title="Пока пусто"><Link href="/cars" className="text-road underline">Откройте каталог</Link> и нажмите на сердечко у понравившегося авто.</Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map((c) => <CarCard key={c.id} car={c} />)}</div>
      )}
    </div>
  );
}
