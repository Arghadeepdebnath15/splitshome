import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ItemDebtCard from '../components/items/ItemDebtCard';
import AddItemDebtModal from '../components/items/AddItemDebtModal';
import EmptyState from '../components/common/EmptyState';
import { ShoppingBag, PlusCircle, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const ItemDebtPage = () => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [itemDebts, setItemDebts] = useState([]);
  const [summary, setSummary] = useState({ iOweCount: 0, theyOweMeCount: 0, settledCount: 0 });
  const [filter, setFilter] = useState('all'); // 'all' | 'i_owe' | 'they_owe_me'
  const [status, setStatus] = useState('owed'); // 'owed' | 'all' | 'returned'
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await api.get(`/items?filter=${filter}&status=${status}`);
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
  }, [filter, status, lastEvent]);

  const handleCreateItemDebt = async (formDataArray) => {
    setModalLoading(true);
    try {
      // formDataArray is always an array (1 or more records)
      const records = Array.isArray(formDataArray) ? formDataArray : [formDataArray];
      await Promise.all(records.map(record => api.post('/items', record)));
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkReturned = async (id) => {
    try {
      await api.put(`/items/${id}/return`);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      // Optimistic update for instant visual response
      setItemDebts(prev => prev.filter(item => item._id !== id));
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      console.error('Delete item failed:', err);
      fetchItems(); // revert state
      alert(err.response?.data?.message || 'Could not delete item record. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Pantry & Item Borrow Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Keep track of shared groceries like 2 onions, 1 glass of rice, spices, or milk
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Borrowed Item</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setFilter('i_owe');
            setStatus('owed');
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === 'i_owe' && status === 'owed'
              ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Things I Owe Flatmates
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {summary.iOweCount}
            </span>
            <span className="text-xs text-slate-400">active item(s)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Items you borrowed from flatmates to return
          </p>
        </div>

        <div
          onClick={() => {
            setFilter('they_owe_me');
            setStatus('owed');
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === 'they_owe_me' && status === 'owed'
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Things Owed To Me
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.theyOweMeCount}
            </span>
            <span className="text-xs text-slate-400">item(s)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Items flatmates borrowed from your pantry shelf
          </p>
        </div>

        <div
          onClick={() => {
            setFilter('all');
            setStatus('returned');
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            status === 'returned'
              ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Settled & Returned
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {summary.settledCount}
            </span>
            <span className="text-xs text-slate-400">returned</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical settled items
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('i_owe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'i_owe'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            I Owe Them
          </button>
          <button
            onClick={() => setFilter('they_owe_me')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'they_owe_me'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            They Owe Me
          </button>
        </div>

        <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <button
            onClick={() => setStatus('owed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              status === 'owed'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Active (Owed)
          </button>
          <button
            onClick={() => setStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              status === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Records
          </button>
          <button
            onClick={() => setStatus('returned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              status === 'returned'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Returned
          </button>
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading pantry debts...
        </div>
      ) : itemDebts.length === 0 ? (
        <EmptyState
          title="No item debts found"
          description={
            status === 'returned'
              ? 'No returned item records found.'
              : 'Pantry is all squared away! No borrowed onions, rice, or groceries pending.'
          }
          actionLabel="Log Borrowed Item"
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
              currentUserId={user?._id}
            />
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemDebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateItemDebt}
        loading={modalLoading}
      />
    </div>
  );
};

export default ItemDebtPage;

