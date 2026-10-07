'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api, { errMsg } from '@/lib/api';
import { useRequireAuth } from '@/components/AuthProvider';
import CarForm from '@/components/CarForm';
import { Empty, ErrorBox, PageTitle, Spinner } from '@/components/ui';

export default function EditCar() {
  const { id } = useParams();
  const { ready } = useRequireAuth(['seller', 'admin']);
  const [car, setCar] = useState(undefined);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(() => api.get(`/cars/${id}`).then((r) => setCar(r.data)).catch(() => setCar(null)), [id]);
  useEffect(() => { if (ready) load(); }, [ready, load]);

  const upload = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setUploading(true); setError('');
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    try { setCar((await api.post(`/cars/${id}/photos`, fd)).data); } catch (err) { setError(errMsg(err)); }
    setUploading(false); if (fileRef.current) fileRef.current.value = '';
  };
  const photoAction = async (fn) => { setError(''); try { setCar((await fn()).data); } catch (err) { setError(errMsg(err)); } };

  if (!ready || car === undefined) return <Spinner />;
  if (car === null) return <div className="container-page py-10"><Empty title="Объявление не найдено" /></div>;

  return (
    <div className="container-page max-w-3xl py-8">
      <PageTitle aside={<Link href={`/cars/${id}`} className="btn-ghost">Открыть на сайте</Link>}>{car.brand} {car.model}</PageTitle>
      <CarForm initial={car} submitLabel="Сохранить изменения" onSubmit={async (data) => {
        setCar((await api.put(`/cars/${id}`, data)).data); setSaved(true); setTimeout(() => setSaved(false), 2500);
      }} />
      {saved && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">Изменения сохранены</p>}

      <section className="card mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Фотографии</h2>
          <label className="btn-accent cursor-pointer">
            {uploading ? 'Загрузка…' : 'Добавить фото'}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={upload} disabled={uploading} />
          </label>
        </div>
        <p className="mb-3 text-xs text-ink-mute">JPEG, PNG или WEBP, до 5 МБ. Первое фото становится главным.</p>
        <ErrorBox>{error}</ErrorBox>
        {car.photos.length === 0 ? <p className="text-sm text-ink-mute">Фото пока нет — без них объявление показывается с заглушкой.</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {car.photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="aspect-[4/3] w-full object-cover" />
                <div className="flex items-center justify-between gap-1 p-2 text-xs">
                  {p.is_main ? <span className="font-bold text-emerald-700">Главное</span>
                    : <button className="font-semibold text-road hover:underline" onClick={() => photoAction(() => api.patch(`/cars/${id}/photos/${p.id}/main`))}>Сделать главным</button>}
                  <button className="font-semibold text-red-700 hover:underline" onClick={() => photoAction(() => api.delete(`/cars/${id}/photos/${p.id}`))}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
