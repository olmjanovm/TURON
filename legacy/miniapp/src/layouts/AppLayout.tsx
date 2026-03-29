import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col pt-16 pb-20 bg-orange-50/20">
       <AppHeader />
       <main className="flex-grow px-4 transition-opacity duration-300">
          <Outlet />
       </main>
       <BottomNav />
    </div>
  );
}
