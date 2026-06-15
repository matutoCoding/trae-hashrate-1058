import { NavLink, Outlet } from 'react-router-dom';
import { Settings, Sparkles, Eye, BookOpen, Database } from 'lucide-react';

const navItems = [
  { path: '/', label: '观测设置', icon: Settings },
  { path: '/radiant', label: '辐射点推算', icon: Sparkles },
  { path: '/observation', label: '观测时段', icon: Eye },
  { path: '/records', label: '观测记录', icon: BookOpen },
  { path: '/archive', label: '流星雨档案', icon: Database },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050510] via-[#0a0e27] to-[#1a1435]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(100,100,255,0.1),transparent_70%)]" />
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                opacity: 0.3 + Math.random() * 0.7,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0e27]/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">流星雨观测预报系统</h1>
                  <p className="text-xs text-gray-400">Meteor Shower Observer Pro</p>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white/10 text-amber-400'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0e27]/95 border-t border-white/10">
          <div className="flex items-center justify-around py-2 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive ? 'text-amber-400' : 'text-gray-400'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
