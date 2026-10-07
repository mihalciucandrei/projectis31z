import { Suspense } from 'react';
import Catalog from './Catalog';
import { Spinner } from '@/components/ui';

export const metadata = { title: 'Каталог — AutoMarket' };

export default function CarsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Catalog />
    </Suspense>
  );
}
