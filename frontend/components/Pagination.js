export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) nums.push(p);
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Страницы">
      <button className="btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Назад</button>
      {nums.map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
          className={n === page ? 'btn-primary' : 'btn-ghost'}>{n}</button>
      ))}
      <button className="btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>Вперёд</button>
    </nav>
  );
}
