export const fmtPrice = (v) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v)) + ' €';
export const fmtKm = (v) => new Intl.NumberFormat('ru-RU').format(v) + ' км';
export const fmtDate = (v) =>
  new Date(v).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const fmtDay = (v) => new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export const FUEL = { petrol: 'Бензин', diesel: 'Дизель', hybrid: 'Гибрид', electric: 'Электро', gas: 'Газ' };
export const TRANS = { manual: 'Механика', automatic: 'Автомат' };
export const BODY = { sedan: 'Седан', hatchback: 'Хэтчбек', suv: 'Внедорожник', coupe: 'Купе', wagon: 'Универсал', minivan: 'Минивэн', pickup: 'Пикап' };
export const STATUS = { active: 'В продаже', reserved: 'Забронирован', sold: 'Продан', archived: 'В архиве' };
export const RES_STATUS = { pending: 'Ожидает подтверждения', confirmed: 'Подтверждена', cancelled: 'Отменена', expired: 'Истекла' };
export const ROLE = { buyer: 'Покупатель', seller: 'Продавец', admin: 'Администратор' };
