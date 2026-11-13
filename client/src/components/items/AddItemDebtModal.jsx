import React, { useState } from 'react';
import Modal from '../common/Modal';
import { ShoppingBag, AlertCircle, Sparkles } from 'lucide-react';
import { useFlat } from '../../context/FlatContext';
import { useAuth } from '../../context/AuthContext';

const commonItems = [
  { name: 'Onions', unit: 'pieces/onions', emoji: '🧅', defaultQty: 2 },
  { name: 'Rice', unit: 'glass', emoji: '🍚', defaultQty: 1 },
  { name: 'Milk', unit: 'packet/litre', emoji: '🥛', defaultQty: 1 },
  { name: 'Eggs', unit: 'pieces/eggs', emoji: '🥚', defaultQty: 2 },
  { name: 'Cooking Oil', unit: 'cup/ml', emoji: '🫒', defaultQty: 1 },
  { name: 'Garlic', unit: 'cloves', emoji: '🧄', defaultQty: 3 },
  { name: 'Tomatoes', unit: 'pieces', emoji: '🍅', defaultQty: 2 },
  { name: 'Sugar', unit: 'spoon/cup', emoji: '🍬', defaultQty: 1 }
];

const AddItemDebtModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const { members } = useFlat();
  const { user } = useAuth();

  const [direction, setDirection] = useState('i_borrowed'); // 'i_borrowed' | 'they_borrowed'
  const [partnerId, setPartnerId] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pieces');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Flatmates excluding logged in user
  const otherMembers = members.filter((m) => m._id !== user?._id);

  React.useEffect(() => {
    if (otherMembers.length > 0 && !partnerId) {
      setPartnerId(otherMembers[0]._id);
    }
  }, [otherMembers, partnerId]);

  const selectPreset = (preset) => {
    setItemName(preset.name);
    setUnit(preset.unit);
    setQuantity(preset.defaultQty);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Please provide an item name.');
      return;
    }
    if (!partnerId) {
      setError('Please select a flatmate.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError('Please provide a valid quantity.');
      return;
    }

    const borrowerId = direction === 'i_borrowed' ? user._id : partnerId;
    const lenderId = direction === 'i_borrowed' ? partnerId : user._id;

    onSubmit({
      borrowerId,
      lenderId,
      itemName: itemName.trim(),
      quantity: Number(quantity),
      unit: unit.trim() || 'units',
      description: description.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Borrowed Pantry Item"
      subtitle="Track kitchen items like '2 onions', '1 glass rice', etc."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direction: Did I borrow or did they borrow? */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Who borrowed what?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('i_borrowed')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                direction === 'i_borrowed'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              🙋‍♂️ I borrowed from flatmate
            </button>

            <button
              type="button"
              onClick={() => setDirection('they_borrowed')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                direction === 'they_borrowed'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              🤝 Flatmate borrowed from me
            </button>
          </div>
        </div>

        {/* Partner flatmate */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {direction === 'i_borrowed' ? 'Borrowed From:' : 'Lent To:'}
          </label>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {otherMembers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} (@{m.username})
              </option>
            ))}
          </select>
        </div>

        {/* Quick presets for flatmate classics */}
        <div>
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Quick presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {commonItems.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => selectPreset(preset)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 transition-colors"
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Item Name & Quantity & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Unit (e.g. glass, onions)
            </label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. glass, onions, kg"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Rice, Onions"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Context / Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Borrowed for making dinner, will return over the weekend"
            className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{loading ? 'Recording...' : 'Save Item Debt'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddItemDebtModal;

