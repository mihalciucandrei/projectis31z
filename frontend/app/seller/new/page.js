'use client';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useRequireAuth } from '@/components/AuthProvider';
import CarForm from '@/components/CarForm';
import { PageTitle, Spinner } from '@/components/ui';

export default function NewCar() {
  const { ready } = useRequireAuth(['seller', 'admin']);
  const router = useRouter();
  if (!ready) return <Spinner />;
  return (
    <div className="container-page max-w-3xl py-8">
      <PageTitle>Новое объявление</PageTitle>
      <p className="mb-4 text-sm text-ink-mute">Фотографии можно добавить на следующем шаге.</p>
      <CarForm submitLabel="Создать и добавить фото" onSubmit={async (data) => {
        const { data: car } = await api.post('/cars', data);
        router.push(`/seller/${car.id}`);
      }} />
    </div>
  );
}
