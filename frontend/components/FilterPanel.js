'use client';
import { useEffect, useState } from 'react';
import { BODY, FUEL, TRANS } from '@/lib/format';

const EMPTY = { q: '', brand: '', city: '', price_min: '', price_max: '', year_min: '', year_max: '', mileage_max: '', fuel_type: '', transmission: '', body_type: '' };

export default function FilterPanel({ meta, values, onApply }) {
  const [f, setF] = useState({ ...EMPTY, ...values });
  useEffect(() => setF({ ...EMPTY, ...values }), [values]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const select = (k, label, options) => (
    <div>
      <label className="label" htmlFor={`f-${k}`}>{label}</label>
      <select id={`f-${k}`} className="input" value={f[k]} onChange={set(k)}>
        <option value="">Любой</option>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
  const range = (a, b, label, ph) => (
    <div>
      <span className="label">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" type="number" min="0" placeholder={ph[0]} aria-label={`${label} от`} value={f[a]} onChange={set(a)} />
        <input className="input" type="number" min="0" placeholder={ph[1]} aria-label={`${label} до`} value={f[b]} onChange={set(b)} />
      </div>
    </div>
  );

  return (
    <form className="card space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); onApply(f); }}>
      <div>
        <label className="label" htmlFor="f-q">Поиск</label>
        <input id="f-q" className="input" placeholder="Марка, модель, описание" value={f.q} onChange={set('q')} />
      </div>
      {select('brand', 'Марка', (meta?.brands || []).map((b) => [b.name, `${b.name} (${b.count})`]))}
      {select('city', 'Город', (meta?.cities || []).map((c) => [c.name, `${c.name} (${c.count})`]))}
      {range('price_min', 'price_max', 'Цена, €', ['от', 'до'])}
      {range('year_min', 'year_max', 'Год выпуска', ['2010', '2024'])}
      <div>
        <label className="label" htmlFor="f-mileage_max">Пробег до, км</label>
        <input id="f-mileage_max" className="input" type="number" min="0" value={f.mileage_max} onChange={set('mileage_max')} />
      </div>
      {select('fuel_type', 'Топливо', Object.entries(FUEL))}
      {select('transmission', 'Коробка передач', Object.entries(TRANS))}
      {select('body_type', 'Кузов', Object.entries(BODY))}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" type="submit">Показать</button>
        <button className="btn-ghost" type="button" onClick={() => onApply(EMPTY)}>Сбросить</button>
      </div>
    </form>
  );
}
