import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '▦' },
    { name: 'Stock Predictor', path: '/playground', icon: '◈' },
    { name: 'AI Advisor', path: '/advisor', icon: '◎' },
    { name: 'News Feed', path: '/news', icon: '◻' },
    { name: 'Portfolio', path: '/portfolio', icon: '◷' },
    { name: 'Academy', path: '/academy', icon: '◆' },
    { name: 'Community', path: '/community', icon: '◈' },
  ];

  return (
    <aside className="w-56 bg-[#111827] border-r border-[#1f2937] flex flex-col h-full z-10">
      {/* ── Logo ── */}
      <div className="p-6 pb-2">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-[#14b8a6] flex items-center justify-center text-xs text-black font-black">T</span>
          <span>Trade<span className="text-[#14b8a6]">FinX</span></span>
        </h1>
      </div>

      <p className="text-[10px] text-gray-500 mt-6 mb-2 px-6 uppercase tracking-wider font-semibold">Navigation</p>

      {/* ── Nav Links ── */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
                ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20'
                : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <span className="text-sm opacity-80">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}

        <p className="text-[10px] text-gray-500 mt-6 mb-2 px-2 uppercase tracking-wider font-semibold">Account</p>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
              ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20'
              : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <span className="text-sm opacity-60">◈</span> Settings
        </NavLink>
      </nav>

      {/* ── User Profile & Logout ── */}
      <div className="p-4">
        <div className="bg-[#1a2332] border border-[#1f2937] rounded-xl p-3 flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#14b8a6] flex items-center justify-center text-black font-bold shrink-0 text-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-[#14b8a6] truncate font-semibold uppercase tracking-widest">
              PRO MEMBER
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-400 hover:text-red-400 transition-colors"
        >
          <span>⊣</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
