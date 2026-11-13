import React from 'react';
import Avatar from '../common/Avatar';
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Scale } from 'lucide-react';

const LedgerTable = ({ ledger = [], currentUserId }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Chore Credit Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immutable source of truth for work completed on behalf of flatmates
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 sm:px-6">Flatmate</th>
              <th className="py-3 px-4 text-right">Credits Earned</th>
              <th className="py-3 px-4 text-right">Credits Owed</th>
              <th className="py-3 px-4 sm:px-6 text-right">Net Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {ledger.map((item) => {
              const isCurrentUser = item.user._id === currentUserId;
              const isPositive = item.netBalance > 0;
              const isZero = item.netBalance === 0;

              return (
                <tr
                  key={item.user._id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    isCurrentUser ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {/* Person */}
                  <td className="py-3.5 px-4 sm:px-6 flex items-center gap-3">
                    <Avatar
                      name={item.user.name}
                      color={item.user.avatarColor}
                      size="sm"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{item.user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        @{item.user.username}
                      </p>
                    </div>
                  </td>

                  {/* Credits Earned */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{item.creditsEarned}
                    </span>
                  </td>

                  {/* Credits Owed */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      -{item.creditsOwed}
                    </span>
                  </td>

                  {/* Net Balance */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        isPositive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : isZero
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : isZero ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isPositive ? `+${item.netBalance}` : item.netBalance}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerTable;

