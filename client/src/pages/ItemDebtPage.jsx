import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFlat } from '../context/FlatContext';
import { useSocket } from '../context/SocketContext';
import FlatmatePantryCard from '../components/items/FlatmatePantryCard';
import ItemDebtCard from '../components/items/ItemDebtCard';
import AddItemDebtModal from '../components/items/AddItemDebtModal';
import EditItemDebtModal from '../components/items/EditItemDebtModal';
import EmptyState from '../components/common/EmptyState';
import {
  ShoppingBag, PlusCircle, ArrowDownLeft, ArrowUpRight,
  CheckCircle2, Users, List, RefreshCw, Sparkles
} from 'lucide-react';

const ItemDebtPage = () => {
  const { user } = useAuth();
  const { members } = useFlat();
  const { lastEvent } = useSocket();

  const [itemDebts, setItemDebts] = useState([]);
  const [summary, setSummary] = useState({ iOweCount: 0, theyOweMeCount: 0, settledCount: 0 });
  const [viewMode, setViewMode] = useState('by_flatmate'); // 'by_flatmate' | 'all_items'
  const [status, setStatus] = useState('all'); // 'all' | 'owed' | 'returned'
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Other flatmates (excluding current user)
  const otherMembers = members.filter((m) => m._id !== user?._id);

  const fetchItems = async () => {
    try {
      const res = await api.get(`/items?filter=all&status=${status}`);
      if (res.data.success) {
        setItemDebts(res.data.itemDebts);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [status, lastEvent]);

  const handleCreateItemDebt = async (formDataArray) => {
    setModalLoading(true);
    try {
      const records = Array.isArray(formDataArray) ? formDataArray : [formDataArray];
      await Promise.all(records.map((record) => api.post('/items', record)));
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleUpdateItemDebt = async (itemId, updateData) => {
    setModalLoading(true);
    try {
      // Optimistic update
      setItemDebts((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, ...updateData } : item))
      );
      const res = await api.put(`/items/${itemId}`, updateData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setEditingItem(null);
        fetchItems();
      }
    } catch (err) {
      console.error('Update item failed:', err);
      fetchItems();
      alert(err.response?.data?.message || 'Could not update item. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkReturned = async (id) => {
    try {
      // Optimistic update
      setItemDebts((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: 'returned', returnedAt: new Date() } : item
        )
      );
      await api.put(`/items/${id}/return`);
      fetchItems();
    } catch (err) {
      console.error(err);
      fetchItems();
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      // Optimistic update for instant visual response
      setItemDebts((prev) => prev.filter((item) => item._id !== id));
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      console.error('Delete item failed:', err);
      fetchItems();
      alert(err.response?.data?.message || 'Could not delete item record. Please try again.');
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pantry & Kitchen Debts
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-1">
            Track borrowed staples like potatoes, onions, rice, milk & spices per flatmate
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 shadow-md shadow-emerald-600/20 transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Borrowed Item</span>
        </button>
      </div>

      {/* ── COMPACT 1-LINE STAT SUMMARY ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Pills */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Pantry Status:
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20">
            <ArrowDownLeft className="w-3.5 h-3.5 text-amber-500" />
            <span>You owe: {summary.iOweCount} item{summary.iOweCount === 1 ? '' : 's'}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Owed to you: {summary.theyOweMeCount} item{summary.theyOweMeCount === 1 ? '' : 's'}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Returned: {summary.settledCount}</span>
          </span>
        </div>

        {/* View Mode Toggle: By Flatmate vs All Items */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('by_flatmate')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'by_flatmate'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>By Flatmate</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all_items')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'all_items'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>All Items Feed</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="font-semibold">Loading pantry shares...</span>
        </div>
      ) : otherMembers.length === 0 ? (
        <EmptyState
          title="No flatmates found"
          description="Invite flatmates to your household using your invite code to start tracking shared pantry items."
          actionLabel="View Flatmates"
          onAction={() => (window.location.href = '/flatmates')}
        />
      ) : viewMode === 'by_flatmate' ? (
        /* ── VIEW 1: PER-FLATMATE MODERN ACCORDION CARDS ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing <strong>{otherMembers.length} flatmate card{otherMembers.length === 1 ? '' : 's'}</strong> — tap any card to view what you owe them & what they owe you:
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {otherMembers.map((member, index) => {
              const memberItems = itemDebts.filter(
                (item) =>
                  (item.borrower?._id === member._id && item.lender?._id === user?._id) ||
                  (item.lender?._id === member._id && item.borrower?._id === user?._id)
              );

              return (
                <FlatmatePantryCard
                  key={member._id}
                  member={member}
                  items={memberItems}
                  currentUserId={user?._id}
                  onMarkReturned={handleMarkReturned}
                  onDelete={handleDeleteItem}
                  onEdit={handleOpenEdit}
                  defaultExpanded={index === 0 && memberItems.length > 0}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* ── VIEW 2: FLAT FEED OF ALL ITEMS ── */
        <div className="space-y-4">
          {itemDebts.length === 0 ? (
            <EmptyState
              title="No pantry items recorded"
              description="Pantry is all squared away! Tap below to record borrowed potatoes, onions, rice, etc."
              actionLabel="Record Borrowed Item"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemDebts.map((item) => (
                <ItemDebtCard
                  key={item._id}
                  itemDebt={item}
                  onMarkReturned={handleMarkReturned}
                  onDelete={handleDeleteItem}
                  onEdit={handleOpenEdit}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD ITEM MODAL ── */}
      <AddItemDebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateItemDebt}
        loading={modalLoading}
      />

      {/* ── EDIT ITEM MODAL ── */}
      <EditItemDebtModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSubmit={handleUpdateItemDebt}
        loading={modalLoading}
      />
    </div>
  );
};

export default ItemDebtPage;
