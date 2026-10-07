import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('am_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function errMsg(e) {
  const d = e?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => x.msg).join('; ');
  return 'Не удалось выполнить запрос. Проверьте соединение и попробуйте ещё раз.';
}

export default api;
