import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { History, Filter, Clock, Sparkles } from 'lucide-react';

const ActivityHistoryPage = () => {
  const { lastEvent } = useSocket();
  const [activities, setActivities] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get(`/activities?category=${categoryFilter}&limit=100`);
      if (res.data.success) {
        setActivities(res.data.activities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [categoryFilter, lastEvent]);

  const categories = [
    { id: 'all', label: 'All Activities' },
    { id: 'credit', label: 'Chore Credits & Debts' },
    { id: 'task', label: 'Tasks & Chores' },
    { id: 'item_debt', label: 'Pantry / Items' },
    { id: 'exchange', label: 'Chore Exchanges' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>Household Activity Feed</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full audit trail of chores completed, credits earned, debts settled, and items borrowed
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${categoryFilter === c.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Activities Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading activity stream...
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            title="No activity records found"
            description="Recent household actions and chore exchanges will be recorded here automatically."
          />
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {activities.map((act) => (
              <div key={act._id} className="relative flex items-start gap-3 text-xs">
                {/* Node circle */}
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900 flex-shrink-0" />

                <div className="flex-1 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={act.actor?.name}
                        color={act.actor?.avatarColor}
                        size="xs"
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {act.actor?.name}
                      </span>
                      <Badge variant={act.category === 'credit' ? 'warning' : act.category === 'item_debt' ? 'info' : 'default'}>
                        {act.category.replace('_', ' ')}
                      </Badge>
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(act.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {act.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHistoryPage;