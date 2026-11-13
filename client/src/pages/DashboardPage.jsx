import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFlat } from '../context/FlatContext';
import { useSocket } from '../context/SocketContext';
import StatCard from '../components/common/StatCard';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import TaskCompleteModal from '../components/tasks/TaskCompleteModal';
import TaskModal from '../components/tasks/TaskModal';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  PlusCircle,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  History,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { currentFlat } = useFlat();
  const { lastEvent } = useSocket();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setUpcomingTasks(res.data.upcomingTasks);
        setRecentActivity(res.data.recentActivity);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [lastEvent]);

  const handleCreateTask = async (taskData) => {
    setModalLoading(true);
    try {
      const res = await api.post('/tasks', taskData);
      if (res.data.success) {
        setIsTaskModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmComplete = async (taskId, completedByUserId, proofImage) => {
    setModalLoading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/complete`, {
        completedBy: completedByUserId,
        proofImage: proofImage || undefined
      });
      if (res.data.success) {
        setSelectedTaskToComplete(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading household dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-md">
            Household Overview
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-2 tracking-tight">
            Hello, {user?.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-md">
            Welcome to <strong className="underline">{currentFlat?.name}</strong>. Here is the latest chore status, pending responsibilities, and your credit balance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-950 bg-white hover:bg-emerald-50 shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>New Chore</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks & Completion Progress */}
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          subtitle={`${stats?.completedTasks || 0} completed (${stats?.completionRate || 0}%)`}
          icon={CheckSquare}
          color="brand"
          progress={stats?.completionRate || 0}
          onClick={() => navigate('/tasks')}
        />

        {/* Pending & Overdue */}
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          subtitle={stats?.overdueTasks > 0 ? `${stats?.overdueTasks} overdue task(s)!` : 'All tasks on schedule'}
          icon={Clock}
          color={stats?.overdueTasks > 0 ? 'rose' : 'amber'}
          onClick={() => navigate('/tasks?status=Pending')}
        />

        {/* My Tasks */}
        <StatCard
          title="My Assigned Tasks"
          value={stats?.myTasksCount || 0}
          subtitle={`${stats?.myPendingTasks || 0} pending to do`}
          icon={Calendar}
          color="blue"
          onClick={() => navigate('/my-tasks')}
        />

        {/* Chore Credit Balance (MOST IMPORTANT) */}
        <StatCard
          title="My Chore Credit Balance"
          value={
            stats?.netBalance > 0
              ? `+${stats?.netBalance}`
              : stats?.netBalance < 0
                ? `${stats?.netBalance}`
                : '0'
          }
          subtitle={`Earned: +${stats?.creditsEarned || 0} | Owed: -${stats?.creditsOwed || 0}`}
          icon={Scale}
          color={stats?.netBalance >= 0 ? 'brand' : 'rose'}
          onClick={() => navigate('/credits')}
        />
      </div>

      {/* Secondary Highlights: Item Debts & Chore Exchange */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Item Debt Mini Card */}
        <div
          onClick={() => navigate('/items')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Pantry & Borrowed Items
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                You owe {stats?.itemsIOwe || 0} item(s) • Flatmates owe you {stats?.itemsOwedToMe || 0}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Chore Exchange Mini Card */}
        <div
          onClick={() => navigate('/exchange')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Chore Exchange Market
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Swap chores or volunteer for flatmates to earn credits
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Main Grid: Upcoming Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Household Chores */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Household Chores
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tasks due next in {currentFlat?.name}
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No pending tasks right now. Great job keeping the flat clean! 🎉
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={task.assignedTo?.name}
                      color={task.assignedTo?.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {task.title}
                        </h5>
                        <Badge variant={task.priority}>{task.priority}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Assigned to {task.assignedTo?.name} • Due{' '}
                        {new Date(task.dueDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        • <span className="font-bold text-amber-600">{task.creditValue} cr</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTaskToComplete(task)}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Household Activity Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Household Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live stream of chore events
              </p>
            </div>
            <button
              onClick={() => navigate('/activity')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              All
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentActivity.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No activity yet.
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act._id} className="pt-3 first:pt-0 flex items-start gap-2.5 text-xs">
                  <Avatar
                    name={act.actor?.name}
                    color={act.actor?.avatarColor}
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-300 leading-tight">
                      {act.details}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateTask}
        loading={modalLoading}
      />

      {/* Task Completion Modal (with credit calculation preview) */}
      <TaskCompleteModal
        isOpen={!!selectedTaskToComplete}
        onClose={() => setSelectedTaskToComplete(null)}
        task={selectedTaskToComplete}
        onConfirm={handleConfirmComplete}
        loading={modalLoading}
      />
    </div>
  );
};

export default DashboardPage;