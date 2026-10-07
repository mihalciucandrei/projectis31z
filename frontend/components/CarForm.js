'use client';
import { useState } from 'react';
import { ErrorBox } from '@/components/ui';
import { BODY, FUEL, TRANS } from '@/lib/format';
import { errMsg } from '@/lib/api';

const DEFAULTS = { brand: '', model: '', year: new Date().getFullYear() - 5, price: '', mileage: '', fuel_type: 'petrol', transmission: 'manual', body_type: 'sedan', city: '', description: '' };

export default function CarForm({ initial, onSubmit, submitLabel }) {
  const [f, setF] = useState({ ...DEFAULTS, ...(initial || {}), description: initial?.description || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await onSubmit({ ...f, year: Number(f.year), price: Number(f.price), mileage: Number(f.mileage), description: f.description || null });
    } catch (err) { setError(errMsg(err)); }
    setBusy(false);
  };

  const field = (k, label, props = {}) => (
    <div><label className="label" htmlFor={`c-${k}`}>{label}</label><input id={`c-${k}`} className="input" required value={f[k]} onChange={set(k)} {...props} /></div>
  );
  const sel = (k, label, opts) => (
    <div><label className="label" htmlFor={`c-${k}`}>{label}</label>
      <select id={`c-${k}`} className="input" value={f[k]} onChange={set(k)}>{Object.entries(opts).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
  );

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {field('brand', 'Марка', { maxLength: 60 })}
        {field('model', 'Модель', { maxLength: 80 })}
        {field('year', 'Год выпуска', { type: 'number', min: 1950, max: 2100 })}
        {field('price', 'Цена, €', { type: 'number', min: 1, step: '0.01' })}
        {field('mileage', 'Пробег, км', { type: 'number', min: 0 })}
        {field('city', 'Город', { maxLength: 80 })}
        {sel('fuel_type', 'Топливо', FUEL)}
        {sel('transmission', 'Коробка передач', TRANS)}
        {sel('body_type', 'Кузов', BODY)}
      </div>
      <div>
        <label className="label" htmlFor="c-desc">Описание</label>
        <textarea id="c-desc" className="input min-h-32" maxLength={5000} value={f.description} onChange={set('description')} placeholder="Состояние, комплектация, история обслуживания" />
      </div>
      <ErrorBox>{error}</ErrorBox>
      <button className="btn-primary" disabled={busy}>{submitLabel}</button>
    </form>
  );
}
