import React from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { ArrowLeftRight, Check, X, Sparkles, Clock, MessageSquare } from 'lucide-react';

const ExchangeCard = ({ exchange, onRespond, currentUserId, loading }) => {
  const isRequester = exchange.requester?._id === currentUserId;
  const isRecipient =
    exchange.requestedTo?._id === currentUserId ||
    (!exchange.requestedTo && !isRequester); // open pool

  const isPending = exchange.status === 'pending';

  const typeLabels = {
    request_help: { label: 'Help Needed', color: 'warning' },
    volunteer: { label: 'Volunteered to Help', color: 'success' },
    swap: { label: 'Chore Swap Offer', color: 'info' }
  };

  const typeInfo = typeLabels[exchange.type] || { label: 'Exchange', color: 'default' };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={typeInfo.color}>{typeInfo.label}</Badge>
          <Badge variant={exchange.status === 'accepted' ? 'Completed' : exchange.status === 'rejected' ? 'Overdue' : 'Pending'}>
            {exchange.status.toUpperCase()}
          </Badge>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(exchange.createdAt).toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>

      {/* Users & Tasks relation */}
      <div className="space-y-3">
        {/* Requester info */}
        <div className="flex items-center gap-2.5">
          <Avatar
            name={exchange.requester?.name}
            color={exchange.requester?.avatarColor}
            size="xs"
          />
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">
              {exchange.requester?.name} {isRequester ? '(You)' : ''}
            </span>{' '}
            {exchange.type === 'request_help' && 'needs help with:'}
            {exchange.type === 'volunteer' && 'offered to take over:'}
            {exchange.type === 'swap' && 'wants to swap tasks:'}
          </p>
        </div>

        {/* Task Box */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
              {exchange.offeredTask?.title || 'Household task'}
            </h5>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" />
              {exchange.offeredTask?.creditValue || 1} cr
            </span>
          </div>
          {exchange.offeredTask?.category && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Category: {exchange.offeredTask.category} • Due: {new Date(exchange.offeredTask.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* If Swap: Target Task Box */}
        {exchange.type === 'swap' && exchange.targetTask && (
          <div className="relative pt-2">
            <div className="flex items-center justify-center my-1 text-slate-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  In exchange for: {exchange.targetTask.title}
                </h5>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {exchange.targetTask.creditValue || 1} cr
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {exchange.message && (
          <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            "{exchange.message}"
          </p>
        )}
      </div>

      {/* Action buttons if pending and current user can respond */}
      {isPending && isRecipient && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={() => onRespond(exchange._id, 'reject')}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/60"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => onRespond(exchange._id, 'accept')}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Exchange</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExchangeCard;

