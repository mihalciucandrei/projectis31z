'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import CarCard from '@/components/CarCard';
import FilterPanel from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import { Empty, PageTitle, Spinner } from '@/components/ui';

const SORTS = [['newest', 'Сначала новые'], ['price_asc', 'Сначала дешёвые'], ['price_desc', 'Сначала дорогие'], ['year_desc', 'Сначала новее по году'], ['mileage_asc', 'Меньший пробег']];

export default function Catalog() {
  const router = useRouter();
  const sp = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const values = useMemo(() => Object.fromEntries(sp.entries()), [sp]);
  const page = Number(values.page || 1);
  const sort = values.sort || 'newest';

  useEffect(() => { api.get('/cars/meta').then((r) => setMeta(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    setData(null);
    api.get('/cars', { params: { ...values, page_size: 12 } })
      .then((r) => setData(r.data))
      .catch(() => setData({ items: [], total: 0, pages: 1, error: true }));
  }, [values]);

  const push = (next) => {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v !== '' && v != null) params.set(k, v); });
    router.push(`/cars?${params.toString()}`);
  };
  const apply = (f) => push({ ...f, sort });

  return (
    <div className="container-page py-8">
      <PageTitle aside={
        <div className="flex items-center gap-2">
          <button className="btn-ghost lg:hidden" onClick={() => setShowFilters(!showFilters)}>Фильтры</button>
          <label className="sr-only" htmlFor="sort">Сортировка</label>
          <select id="sort" className="input w-auto" value={sort} onChange={(e) => push({ ...values, sort: e.target.value, page: 1 })}>
            {SORTS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
      }>
        Каталог{data && !data.error ? <span className="ml-2 text-base font-semibold text-ink-mute">{data.total} объявл.</span> : null}
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <FilterPanel meta={meta} values={values} onApply={apply} />
        </aside>
        <section>
          {data === null ? <Spinner /> : data.error ? (
            <Empty title="Не удалось загрузить каталог">Проверьте, что backend запущен, и обновите страницу.</Empty>
          ) : data.items.length === 0 ? (
            <Empty title="Ничего не найдено">Попробуйте убрать часть фильтров или расширить диапазон цены.</Empty>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((c) => <CarCard key={c.id} car={c} />)}
              </div>
              <Pagination page={page} pages={data.pages} onChange={(p) => { push({ ...values, page: p }); window.scrollTo({ top: 0 }); }} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
