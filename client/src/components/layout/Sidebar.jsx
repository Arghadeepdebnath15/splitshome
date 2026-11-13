import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  ArrowLeftRight,
  Scale,
  ShoppingBag,
  Trophy,
  History,
  Users,
  Settings,
  LogOut,
  Copy,
  Check,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFlat } from '../../context/FlatContext';
import Avatar from '../common/Avatar';

const Sidebar = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { currentFlat } = useFlat();
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    if (currentFlat?.inviteCode) {
      navigator.clipboard.writeText(currentFlat.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', to: '/my-tasks', icon: CheckSquare },
    { name: 'All Tasks', to: '/tasks', icon: ListTodo },
    { name: 'Chore Exchange', to: '/exchange', icon: ArrowLeftRight },
    { name: 'Credit & Debt Ledger', to: '/credits', icon: Scale, highlight: true },
    { name: 'Item & Pantry Debt', to: '/items', icon: ShoppingBag, badge: 'New' },
    { name: 'Leaderboard', to: '/leaderboard', icon: Trophy },
    { name: 'Activity History', to: '/activity', icon: History },
    { name: 'Flatmates', to: '/flatmates', icon: Users },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between flex-shrink-0 select-none">
      {/* Top Header */}
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/20">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              FlatMate
            </h1>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Shared Living System
            </p>
          </div>
        </div>

        {/* Flat Card / Code Pill */}
        {currentFlat && (
          <div className="mx-4 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentFlat.name}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {currentFlat.members?.length || 1} members
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px]">Invite Code:</span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400"
                title="Copy code"
              >
                <span>{currentFlat.inviteCode}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="px-3 py-2 space-y-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                } ${item.highlight ? 'border border-emerald-500/20' : ''}`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Profile Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name || 'User'} color={user?.avatarColor} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                @{user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

