import React, { useState } from 'react';
import { useFlat } from '../context/FlatContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { Users, Copy, Check, Shield, Mail, Phone, Calendar } from 'lucide-react';

const FlatmatesPage = () => {
  const { currentFlat } = useFlat();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (currentFlat?.inviteCode) {
      navigator.clipboard.writeText(currentFlat.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Household Flatmates</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Members of {currentFlat?.name || 'your flat'}
          </p>
        </div>
      </div>

      {/* Invite Code Share Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
            Invite New Flatmates
          </span>
          <h3 className="text-lg font-bold mt-2">
            Share this invitation code with your roommates
          </h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Anyone with this code can register and join {currentFlat?.name}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
          <span className="font-mono text-base font-extrabold tracking-widest px-3">
            {currentFlat?.inviteCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 shadow-md transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Flatmate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentFlat?.members?.map((memberItem) => {
          const m = memberItem.user || memberItem;
          const isCurrentUser = m._id === user?._id;

          return (
            <div
              key={m._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Avatar name={m.name} color={m.avatarColor} size="lg" />
                  <div className="flex items-center gap-1">
                    {memberItem.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Member
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        You
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {m.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  @{m.username}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  {m.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Joined {new Date(memberItem.joinedAt || m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlatmatesPage;