import React from 'react';
import { Menu, Sun, Moon, Sparkles, Copy, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFlat } from '../../context/FlatContext';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = ({ onOpenMobile }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentFlat } = useFlat();
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    if (currentFlat?.inviteCode) {
      navigator.clipboard.writeText(currentFlat.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile hamburger & flat pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {currentFlat && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">
              {currentFlat.name}
            </span>
            <span className="text-slate-400">•</span>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 font-mono text-[11px] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Copy Invite Code"
            >
              <span>{currentFlat.inviteCode}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Real-time Notifications */}
        <NotificationDropdown />
      </div>
    </header>
  );
};

export default Navbar;

