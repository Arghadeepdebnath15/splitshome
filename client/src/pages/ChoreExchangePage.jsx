import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ExchangeCard from '../components/exchanges/ExchangeCard';
import ExchangeRequestModal from '../components/exchanges/ExchangeRequestModal';
import EmptyState from '../components/common/EmptyState';
import { ArrowLeftRight, PlusCircle, HelpCircle, HeartHandshake } from 'lucide-react';

const ChoreExchangePage = () => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [exchanges, setExchanges] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'accepted' | 'all'
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchExchangeData = async () => {
    try {
      const [exRes, taskRes] = await Promise.all([
        api.get(`/exchanges?status=${statusFilter}`),
        api.get('/tasks')
      ]);

      if (exRes.data.success) {
        setExchanges(exRes.data.exchanges);
      }
      if (taskRes.data.success) {
        setTasks(taskRes.data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeData();
  }, [statusFilter, lastEvent]);

  const handleCreateExchange = async (data) => {
    setModalLoading(true);
    try {
      const res = await api.post('/exchanges', data);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchExchangeData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRespond = async (exchangeId, action) => {
    setModalLoading(true);
    try {
      const res = await api.post(`/exchanges/${exchangeId}/respond`, { action });
      if (res.data.success) {
        fetchExchangeData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            <span>Chore Exchange & Borrowed Work</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trade chores, volunteer for flatmates, or request someone to take over your task
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Propose Exchange</span>
        </button>
      </div>

      {/* Explainer Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex-shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ask for Help</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Busy or out of town? Request a flatmate to take over your chore.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex-shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Volunteer</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Have free time? Offer to take a flatmate's chore and earn credits.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex-shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chore Swap</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Offer your cleaning task in exchange for cooking or dishwashing.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
        {['pending', 'accepted', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {s === 'pending' ? 'Active Requests' : s === 'accepted' ? 'Completed Swaps' : 'All Requests'}
          </button>
        ))}
      </div>

      {/* Exchange Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading exchange requests...
        </div>
      ) : exchanges.length === 0 ? (
        <EmptyState
          title="No exchange requests found"
          description={
            statusFilter === 'pending'
              ? 'No pending chore exchange requests right now. Would you like to propose one?'
              : 'No exchange requests in this view.'
          }
          actionLabel="Propose an Exchange"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exchanges.map((ex) => (
            <ExchangeCard
              key={ex._id}
              exchange={ex}
              onRespond={handleRespond}
              currentUserId={user?._id}
              loading={modalLoading}
            />
          ))}
        </div>
      )}

      {/* Proposal Modal */}
      <ExchangeRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={tasks}
        onSubmit={handleCreateExchange}
        loading={modalLoading}
      />
    </div>
  );
};

export default ChoreExchangePage;

