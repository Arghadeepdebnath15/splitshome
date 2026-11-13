import React from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { ArrowRight, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

const TransactionHistory = ({ transactions = [], onDispute, currentUserId }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Permanent Transaction History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable log of all chore completions, offsets, and mutual settlements
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[500px] overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No chore transactions recorded yet.
          </div>
        ) : (
          transactions.map((txn) => {
            const isCreditor = txn.creditor?._id === currentUserId;
            const isDebtor = txn.debtor?._id === currentUserId;
            const isDisputed = txn.status === 'disputed';

            return (
              <div
                key={txn._id}
                className="p-4 sm:px-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Avatar
                      name={txn.debtor?.name}
                      color={txn.debtor?.avatarColor}
                      size="xs"
                    />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <Avatar
                      name={txn.creditor?.name}
                      color={txn.creditor?.avatarColor}
                      size="xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {txn.debtor?.name} owes {txn.creditor?.name}
                      </p>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        {txn.credits} credit{txn.credits === 1 ? '' : 's'}
                      </span>
                      {isDisputed && (
                        <Badge variant="danger">Disputed</Badge>
                      )}
                      {txn.type === 'debt_settled' && (
                        <Badge variant="success">Settlement</Badge>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {txn.notes || (txn.task ? `Task: ${txn.task.title}` : 'Chore credit exchange')}
                    </p>

                    {isDisputed && txn.disputeReason && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
                        Dispute reason: {txn.disputeReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                  <div className="text-right text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(txn.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {!isDisputed && (isCreditor || isDebtor) && (
                    <button
                      onClick={() => onDispute(txn)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      Dispute
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;

