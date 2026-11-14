import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import {
  ShoppingBag, AlertCircle, Users, User, Check,
  Plus, Minus, ChevronDown, Camera, Image as ImageIcon, X
} from 'lucide-react';
import { useFlat } from '../../context/FlatContext';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageUtils';

const commonItems = [
  { name: 'Onions',      unit: 'onions',    emoji: '🧅', defaultQty: 2 },
  { name: 'Potatoes',    unit: 'potatoes',  emoji: '🥔', defaultQty: 3 },
  { name: 'Rice',        unit: 'glass',     emoji: '🍚', defaultQty: 1 },
  { name: 'Milk',        unit: 'packet',    emoji: '🥛', defaultQty: 1 },
  { name: 'Eggs',        unit: 'eggs',      emoji: '🥚', defaultQty: 2 },
  { name: 'Cooking Oil', unit: 'cup',       emoji: '🫒', defaultQty: 1 },
  { name: 'Garlic',      unit: 'cloves',    emoji: '🧄', defaultQty: 3 },
  { name: 'Tomatoes',    unit: 'tomatoes',  emoji: '🍅', defaultQty: 2 },
  { name: 'Sugar',       unit: 'spoon',     emoji: '🍬', defaultQty: 2 },
  { name: 'Salt',        unit: 'tsp',       emoji: '🧂', defaultQty: 1 },
  { name: 'Bread',       unit: 'slices',    emoji: '🍞', defaultQty: 2 },
  { name: 'Butter',      unit: 'tbsp',      emoji: '🧈', defaultQty: 1 },
];

const unitSuggestions = [
  'pieces', 'glass', 'cup', 'packet', 'kg', 'g',
  'litre', 'ml', 'tsp', 'tbsp', 'cloves', 'slices'
];

const AddItemDebtModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const { members } = useFlat();
  const { user } = useAuth();

  const [direction, setDirection] = useState('they_borrowed'); // 'i_borrowed' | 'they_borrowed'
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]); // multi-select for they_borrowed
  const [singlePartnerId, setSinglePartnerId] = useState('');      // single-select for i_borrowed
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pieces');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [splitEqually, setSplitEqually] = useState(false); // split qty equally among borrowers
  const [showUnits, setShowUnits] = useState(false);
  const [error, setError] = useState('');

  const otherMembers = members.filter((m) => m._id !== user?._id);

  // Init single partner
  useEffect(() => {
    if (otherMembers.length > 0 && !singlePartnerId) {
      setSinglePartnerId(otherMembers[0]._id);
    }
  }, [otherMembers]);

  // Reset selection on direction change
  useEffect(() => {
    setSelectedPartnerIds([]);
    setError('');
  }, [direction]);

  const toggleMember = (id) => {
    setSelectedPartnerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedPartnerIds.length === otherMembers.length) {
      setSelectedPartnerIds([]);
    } else {
      setSelectedPartnerIds(otherMembers.map(m => m._id));
    }
  };

  const allSelected = selectedPartnerIds.length === otherMembers.length && otherMembers.length > 0;

  const selectPreset = (preset) => {
    setItemName(preset.name);
    setUnit(preset.unit);
    setQuantity(preset.defaultQty);
  };

  const adjustQty = (delta) => {
    setQuantity(prev => {
      const current = parseFloat(prev) || 0;
      const next = current + delta;
      return next > 0 ? (Number.isInteger(next) ? next : Number(next.toFixed(2))) : 1;
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingImage(true);
    setError('');
    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setImage(compressed);
    } catch (err) {
      console.error(err);
      setError('Could not process image. Please try another photo.');
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Live preview of what will be created
  const getPreviewText = () => {
    const qtyDisplay = `${quantity} ${unit}`;
    const item = itemName || '…';
    if (direction === 'i_borrowed') {
      const partner = otherMembers.find(m => m._id === singlePartnerId);
      return partner ? `You borrowed ${qtyDisplay} of ${item} from ${partner.name}` : '';
    } else {
      if (selectedPartnerIds.length === 0) return '';
      const names = selectedPartnerIds.map(id => {
        const m = otherMembers.find(m => m._id === id);
        return m?.name || '';
      });
      const perQty = splitEqually
        ? `${Number((quantity / selectedPartnerIds.length).toFixed(2))} ${unit}`
        : qtyDisplay;
      if (names.length === 1) return `${names[0]} borrowed ${perQty} of ${item} from you`;
      return `${names.join(', ')} each borrowed ${perQty} of ${item} from you`;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!itemName.trim()) { setError('Please provide an item name.'); return; }
    if (!quantity || Number(quantity) <= 0) { setError('Please provide a valid quantity.'); return; }

    if (direction === 'i_borrowed') {
      if (!singlePartnerId) { setError('Please select who you borrowed from.'); return; }
      onSubmit([{
        borrowerId: user._id,
        lenderId: singlePartnerId,
        itemName: itemName.trim(),
        quantity: Number(quantity),
        unit: unit.trim() || 'units',
        description: description.trim(),
        imageUrl: image || ''
      }]);
    } else {
      if (selectedPartnerIds.length === 0) { setError('Please select at least one flatmate.'); return; }
      const perQty = splitEqually
        ? Number((quantity / selectedPartnerIds.length).toFixed(2))
        : Number(quantity);

      const records = selectedPartnerIds.map(borrowerId => ({
        borrowerId,
        lenderId: user._id,
        itemName: itemName.trim(),
        quantity: perQty,
        unit: unit.trim() || 'units',
        description: description.trim(),
        imageUrl: image || ''
      }));
      onSubmit(records);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Borrowed Pantry Item"
      subtitle="Track shared kitchen items like potatoes, rice, oil, spices…"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direction toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            What happened?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('they_borrowed')}
              className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                direction === 'they_borrowed'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-lg block mb-1">🤝</span>
              Flatmate(s) borrowed from me
            </button>
            <button
              type="button"
              onClick={() => setDirection('i_borrowed')}
              className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                direction === 'i_borrowed'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-lg block mb-1">🙋</span>
              I borrowed from a flatmate
            </button>
          </div>
        </div>

        {/* ── THEY BORROWED: multi-select checkboxes ── */}
        {direction === 'they_borrowed' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Who borrowed from you?
                {selectedPartnerIds.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    {selectedPartnerIds.length} selected
                  </span>
                )}
              </label>
              {otherMembers.length > 1 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    allSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {allSelected ? '✓ All Selected' : 'Select All'}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {otherMembers.map((member) => {
                const isSelected = selectedPartnerIds.includes(member._id);
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => toggleMember(member._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Avatar name={member.name} color={member.avatarColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
                      <p className="text-[11px] text-slate-400">@{member.username}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Split equally toggle */}
            {selectedPartnerIds.length > 1 && (
              <div className="mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setSplitEqually(!splitEqually)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${splitEqually ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${splitEqually ? 'left-4' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Split <strong>{quantity} {unit}</strong> equally among {selectedPartnerIds.length} flatmates
                    {splitEqually && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        → {Number((quantity / selectedPartnerIds.length).toFixed(2))} {unit} each
                      </span>
                    )}
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* ── I BORROWED: single dropdown ── */}
        {direction === 'i_borrowed' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Borrowed from:
            </label>
            <div className="space-y-2">
              {otherMembers.map((member) => (
                <button
                  key={member._id}
                  type="button"
                  onClick={() => setSinglePartnerId(member._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    singlePartnerId === member._id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Avatar name={member.name} color={member.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
                    <p className="text-[11px] text-slate-400">@{member.username}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    singlePartnerId === member._id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {singlePartnerId === member._id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick presets */}
        <div>
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            Quick presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {commonItems.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => selectPreset(preset)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  itemName === preset.name
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Item Name + Quantity + Unit */}
        <div className="grid grid-cols-5 gap-2">
          {/* Item Name */}
          <div className="col-span-5 sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Potatoes"
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          {/* Quantity with stepper */}
          <div className="col-span-3 sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quantity *
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustQty(-1)}
                className="w-8 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="flex-1 min-w-0 px-2 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-center"
              />
              <button
                type="button"
                onClick={() => adjustQty(1)}
                className="w-8 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Unit with suggestions */}
          <div className="col-span-2 sm:col-span-1 relative">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Unit
            </label>
            <div className="relative">
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                onFocus={() => setShowUnits(true)}
                onBlur={() => setTimeout(() => setShowUnits(false), 150)}
                placeholder="glass"
                className="w-full px-2 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-6"
              />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              {showUnits && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  {unitSuggestions.map(u => (
                    <button
                      key={u} type="button"
                      onMouseDown={() => { setUnit(u); setShowUnits(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Context / Note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. For Sunday dinner, will return this week"
            className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Image Attachment (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Item Photo / Receipt <span className="text-slate-400 font-normal">(optional)</span>
            </span>
            {image && (
              <button
                type="button"
                onClick={removeImage}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
            id="pantry-item-image-input"
          />

          {image ? (
            <div className="relative rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center max-h-48 group">
              <img
                src={image}
                alt="Item preview"
                className="w-full h-44 object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 shadow hover:bg-slate-100"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white shadow hover:bg-rose-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressingImage}
              className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-50/50 dark:bg-slate-850 transition-all"
            >
              {isCompressingImage ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <span className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                  Optimizing photo...
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Take photo or upload image</span>
                  <span className="text-[10px] text-slate-400">Tap to use camera or choose from gallery</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Live Preview */}
        {getPreviewText() && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
            <span className="font-bold">Preview: </span>{getPreviewText()}
            {direction === 'they_borrowed' && selectedPartnerIds.length > 1 && (
              <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                ({selectedPartnerIds.length} separate records will be created)
              </span>
            )}
          </div>
        )}

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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {loading
                ? 'Saving…'
                : direction === 'they_borrowed' && selectedPartnerIds.length > 1
                ? `Save ${selectedPartnerIds.length} Records`
                : 'Save Record'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddItemDebtModal;
