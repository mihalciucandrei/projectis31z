import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'AutoMarket — автомобили в Молдове',
  description: 'Покупка и продажа автомобилей: поиск, фильтры, избранное, бронирование.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-sm text-ink-mute">
            AutoMarket — платформа продажи автомобилей. Учебный проект.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
