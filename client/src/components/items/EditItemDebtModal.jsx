import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import {
  Pencil, AlertCircle, Plus, Minus, ChevronDown,
  Camera, X, Check
} from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';

const unitSuggestions = [
  'pieces', 'glass', 'cup', 'packet', 'kg', 'g',
  'litre', 'ml', 'tsp', 'tbsp', 'cloves', 'slices'
];

const EditItemDebtModal = ({ isOpen, onClose, item, onSubmit, loading }) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pieces');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (item) {
      setItemName(item.itemName || '');
      setQuantity(item.quantity || 1);
      setUnit(item.unit || 'pieces');
      setDescription(item.description || '');
      setImage(item.imageUrl || '');
      setError('');
    }
  }, [item, isOpen]);

  if (!item) return null;

  const adjustQty = (delta) => {
    setQuantity((prev) => {
      const current = parseFloat(prev) || 0;
      const next = current + delta;
      return next > 0 ? (Number.isInteger(next) ? next : Number(next.toFixed(2))) : 1;
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setImage(compressed);
    } catch (err) {
      console.error(err);
      setError('Could not process image.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const parsedQty = parseFloat(quantity);
    if (!itemName.trim()) {
      setError('Please provide an item name.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please provide a valid quantity greater than 0.');
      return;
    }

    onSubmit(item._id, {
      itemName: itemName.trim(),
      quantity: parsedQty,
      unit: unit.trim() || 'units',
      description: description.trim(),
      imageUrl: image || ''
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Pantry Item"
      subtitle={`Update quantity or details for ${item.itemName}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Item Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Item Name *
          </label>
          <input
            type="text"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Potatoes, Onions, Milk"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-2 gap-3">
          {/* Quantity with full custom input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quantity *
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustQty(-1)}
                className="w-8 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
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
                className="flex-1 min-w-0 px-2 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-center"
              />
              <button
                type="button"
                onClick={() => adjustQty(1)}
                className="w-8 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Unit with suggestions */}
          <div className="relative">
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
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-7"
              />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              {showUnits && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden max-h-36 overflow-y-auto">
                  {unitSuggestions.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onMouseDown={() => {
                        setUnit(u);
                        setShowUnits(false);
                      }}
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

        {/* Note / Context */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. For dinner, returning over the weekend"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Photo attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              Photo <span className="text-slate-400 font-normal">(optional)</span>
            </span>
            {image && (
              <button
                type="button"
                onClick={removeImage}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
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
          />

          {image ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36 group">
              <img src={image} alt="Preview" className="w-full h-36 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-xs font-bold bg-white text-slate-900 rounded-lg shadow"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg shadow"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="w-full border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <Camera className="w-4 h-4 text-slate-400" />
              <span>{isCompressing ? 'Compressing photo...' : 'Attach or snap photo'}</span>
            </button>
          )}
        </div>

        {/* Modal Buttons */}
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
            disabled={loading || isCompressing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditItemDebtModal;
