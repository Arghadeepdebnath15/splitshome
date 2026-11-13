import React from 'react';
import Avatar from '../common/Avatar';
import { ArrowRight, CheckCircle, Handshake } from 'lucide-react';

const PairwiseDebtCard = ({ pair, onSettle, currentUserId }) => {
  const { userA, userB, netAmount, debtor, creditor, isSettled } = pair;

  if (isSettled) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between opacity-80">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar name={userA.name} color={userA.avatarColor} size="sm" />
            <Avatar name={userB.name} color={userB.avatarColor} size="sm" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {userA.name} & {userB.name}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3 h-3" />
              <span>All settled up (0 balance)</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isDebtorMe = debtor?._id === currentUserId;
  const isCreditorMe = creditor?._id === currentUserId;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        {/* Users involved */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={debtor?.name} color={debtor?.avatarColor} size="sm" />
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <Avatar name={creditor?.name} color={creditor?.avatarColor} size="sm" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              <span className={isDebtorMe ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                {debtor?.name} {isDebtorMe ? '(You)' : ''}
              </span>{' '}
              owes{' '}
              <span className={isCreditorMe ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>
                {creditor?.name} {isCreditorMe ? '(You)' : ''}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chore Debt Balance
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
            {netAmount} credit{netAmount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Settle button */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Mutual settlement / chore offset
        </span>
        <button
          onClick={() => onSettle(debtor, creditor, netAmount)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors"
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>Settle Up</span>
        </button>
      </div>
    </div>
  );
};

export default PairwiseDebtCard;

