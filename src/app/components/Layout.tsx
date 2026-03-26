import { Outlet, Link, useLocation } from 'react-router';
import { Home, Dumbbell, TreePine, CalendarDays, Heart, FolderOpen, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/workout', icon: Dumbbell, label: 'Workout' },
    { path: '/favorites', icon: Heart, label: 'Fav' },
    { path: '/programs', icon: FolderOpen, label: 'Programs' },
    { path: '/skills', icon: TreePine, label: 'Skills' },
    { path: '/calendar', icon: CalendarDays, label: 'Calendar' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Content */}
      <main className="pb-24 min-h-screen">
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={signOut}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-xs"
            title="Logout"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 z-50">
        <div className="grid grid-cols-6 items-center h-16 max-w-screen-xl mx-auto px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-orange-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}