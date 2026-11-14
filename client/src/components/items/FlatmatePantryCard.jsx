import React, { useState } from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import {
  ChevronDown, ChevronUp, Check, Trash2, ArrowRight,
  Clock, ArrowDownLeft, ArrowUpRight, CheckCircle2,
  Maximize2, X, AlertCircle, ShoppingBag
} from 'lucide-react';

const itemEmojis = {
  onion: '🧅', onions: '🧅',
  rice: '🍚',
  milk: '🥛',
  egg: '🥚', eggs: '🥚',
  oil: '🫒',
  butter: '🧈',
  bread: '🍞',
  potato: '🥔', potatoes: '🥔',
  tomato: '🍅', tomatoes: '🍅',
  coffee: '☕',
  tea: '🍵',
  sugar: '🍬',
  salt: '🧂',
  garlic: '🧄',
  ginger: '🫚',
  cheese: '🧀'
};

const getItemEmoji = (name = '') => {
  const clean = name.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(itemEmojis)) {
    if (clean.includes(key)) return emoji;
  }
  return '📦';
};

const FlatmatePantryCard = ({
  member,
  items = [],
  currentUserId,
  onMarkReturned,
  onDelete,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState('they_owe_me'); // 'they_owe_me' | 'i_owe_them' | 'returned'
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Group items for this flatmate
  const theyOweMe = items.filter(
    (item) =>
      item.lender?._id === currentUserId &&
      item.borrower?._id === member._id &&
      item.status === 'owed'
  );

  const iOweThem = items.filter(
    (item) =>
      item.borrower?._id === currentUserId &&
      item.lender?._id === member._id &&
      item.status === 'owed'
  );

  const returnedItems = items.filter(
    (item) =>
      item.status === 'returned' &&
      ((item.borrower?._id === currentUserId && item.lender?._id === member._id) ||
        (item.lender?._id === currentUserId && item.borrower?._id === member._id))
  );

  const totalActive = theyOweMe.length + iOweThem.length;

  const handleDelete = async (itemId) => {
    setDeletingId(itemId);
    try {
      await onDelete(itemId);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Determine which tab to show by default if one has items and the other doesn't
  React.useEffect(() => {
    if (theyOweMe.length > 0) {
      setActiveTab('they_owe_me');
    } else if (iOweThem.length > 0) {
      setActiveTab('i_owe_them');
    } else if (returnedItems.length > 0) {
      setActiveTab('returned');
    }
  }, [items.length]);

  const currentTabItems =
    activeTab === 'they_owe_me'
      ? theyOweMe
      : activeTab === 'i_owe_them'
      ? iOweThem
      : returnedItems;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* ── CARD HEADER (Clickable Accordion) ── */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Left: Avatar + Flatmate Name */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Avatar name={member.name} color={member.avatarColor} size="md" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
              <span>{member.name}</span>
            </h3>
            <p className="text-xs text-slate-400">@{member.username}</p>
          </div>
        </div>

        {/* Right: Balance Badges & Chevron */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {totalActive === 0 ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              All settled
            </span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {theyOweMe.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  Owes you {theyOweMe.length}
                </span>
              )}
              {iOweThem.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <ArrowDownLeft className="w-3 h-3 text-amber-500" />
                  You owe {iOweThem.length}
                </span>
              )}
            </div>
          )}

          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── EXPANDED ACCORDION BODY ── */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5">
          {/* Sub-Tabs: They Owe Me / I Owe Them / Returned */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-4 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('they_owe_me')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'they_owe_me'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>They Owe Me</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'they_owe_me'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {theyOweMe.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('i_owe_them')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'i_owe_them'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>I Owe Them</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'i_owe_them'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {iOweThem.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('returned')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'returned'
                  ? 'bg-slate-800 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>History</span>
              <span className="text-[10px] opacity-70">({returnedItems.length})</span>
            </button>
          </div>

          {/* Items List in Active Tab */}
          {currentTabItems.length === 0 ? (
            <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
              <span className="text-2xl block mb-1">
                {activeTab === 'returned' ? '📜' : '✨'}
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {activeTab === 'they_owe_me'
                  ? `${member.name} doesn't owe you any kitchen items right now.`
                  : activeTab === 'i_owe_them'
                  ? `You don't owe ${member.name} anything right now.`
                  : 'No settled history records yet.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeTab !== 'returned' && 'Tap "+ Record Borrowed Item" above to log a new share.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentTabItems.map((item) => {
                const emoji = getItemEmoji(item.itemName);
                const isReturned = item.status === 'returned';
                const isI_Owe = item.borrower?._id === currentUserId;

                return (
                  <div
                    key={item._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Thumbnail + Item Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      {item.imageUrl ? (
                        <div
                          onClick={() => setSelectedPhoto(item)}
                          className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 cursor-pointer group shadow-sm border border-slate-200 dark:border-slate-700"
                          title="Click to view full photo"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-3 h-3" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                          {emoji}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {item.quantity} {item.unit} of {item.itemName}
                          </h4>
                          {isReturned ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              Returned
                            </span>
                          ) : isI_Owe ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              You Owe
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Owed to You
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5 truncate max-w-sm">
                            "{item.description}"
                          </p>
                        )}

                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                          {isReturned && item.returnedAt && (
                            <span> · Returned {new Date(item.returnedAt).toLocaleDateString()}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isReturned && (
                        <button
                          type="button"
                          onClick={() => onMarkReturned(item._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Returned</span>
                        </button>
                      )}

                      {/* Delete with inline confirmation */}
                      {confirmDeleteId === item._id ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl px-2 py-1">
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                            Delete?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className="px-2 py-0.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm disabled:opacity-50"
                          >
                            {deletingId === item._id ? '...' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item._id)}
                          className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete item record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox Photo Modal ── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>{getItemEmoji(selectedPhoto.itemName)}</span>
                <span>
                  {selectedPhoto.itemName} ({selectedPhoto.quantity} {selectedPhoto.unit})
                </span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.itemName}
                className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlatmatePantryCard;
