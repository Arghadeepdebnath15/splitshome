import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import TaskCard from '../components/tasks/TaskCard';
import TaskCompleteModal from '../components/tasks/TaskCompleteModal';
import TaskModal from '../components/tasks/TaskModal';
import ExchangeRequestModal from '../components/exchanges/ExchangeRequestModal';
import EmptyState from '../components/common/EmptyState';
import { CheckSquare, PlusCircle, Filter } from 'lucide-react';

const MyTasksPage = () => {
  const { user } = useAuth();
  const { lastEvent } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchMyTasks = async () => {
    try {
      const res = await api.get('/tasks?view=my-tasks');
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [lastEvent]);

  const handleSaveTask = async (taskData) => {
    setModalLoading(true);
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, taskData);
      } else {
        await api.post('/tasks', taskData);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      fetchMyTasks();
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
        fetchMyTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchMyTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExchange = async (exchangeData) => {
    setModalLoading(true);
    try {
      await api.post('/exchanges', exchangeData);
      setIsExchangeModalOpen(false);
      alert('Chore exchange request submitted!');
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'Pending') return t.status === 'Pending' || t.status === 'In Progress';
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <span>My Assigned Tasks</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Household chores assigned directly to you
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
        {['all', 'Pending', 'Completed', 'Overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              statusFilter === status
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading your tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={
            statusFilter === 'all'
              ? "You have no tasks assigned right now. You're completely free!"
              : `No ${statusFilter.toLowerCase()} tasks found.`
          }
          actionLabel="Create a Chore"
          onAction={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onComplete={(t) => setSelectedTaskToComplete(t)}
              onEdit={(t) => {
                setEditingTask(t);
                setIsTaskModalOpen(true);
              }}
              onDelete={handleDeleteTask}
              onExchange={() => setIsExchangeModalOpen(true)}
              currentUserId={user?._id}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        loading={modalLoading}
      />

      {/* Task Complete Modal */}
      <TaskCompleteModal
        isOpen={!!selectedTaskToComplete}
        onClose={() => setSelectedTaskToComplete(null)}
        task={selectedTaskToComplete}
        onConfirm={handleConfirmComplete}
        loading={modalLoading}
      />

      {/* Chore Exchange Modal */}
      <ExchangeRequestModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        tasks={tasks}
        onSubmit={handleCreateExchange}
        loading={modalLoading}
      />
    </div>
  );
};

export default MyTasksPage;

