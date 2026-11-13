import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFlat } from '../context/FlatContext';
import { useSocket } from '../context/SocketContext';
import TaskCard from '../components/tasks/TaskCard';
import TaskKanban from '../components/tasks/TaskKanban';
import TaskModal from '../components/tasks/TaskModal';
import TaskCompleteModal from '../components/tasks/TaskCompleteModal';
import ExchangeRequestModal from '../components/exchanges/ExchangeRequestModal';
import EmptyState from '../components/common/EmptyState';
import {
  ListTodo,
  PlusCircle,
  Kanban,
  LayoutGrid,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

const categories = [
  'all',
  'Cleaning',
  'Washing dishes',
  'Cooking',
  'Grocery shopping',
  'Laundry',
  'Bathroom cleaning',
  'Garbage disposal',
  'Other'
];

const AllTasksPage = () => {
  const { user } = useAuth();
  const { members } = useFlat();
  const { lastEvent } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'grid'
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState(null);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
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
    fetchTasks();
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
      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmComplete = async (taskId, completedByUserId) => {
    setModalLoading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/complete`, {
        completedBy: completedByUserId
      });
      if (res.data.success) {
        setSelectedTaskToComplete(null);
        fetchTasks();
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
      fetchTasks();
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

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (selectedMember !== 'all' && t.assignedTo?._id !== selectedMember) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-emerald-600" />
            <span>All Household Tasks</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full chore board with member filtering and Kanban workflow
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Chore</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by name or description..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Member filter */}
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Flatmates</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      {/* Main Task View (Kanban or Grid) */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No chores match your filters"
          description="Try adjusting your filter options or add a new chore."
          actionLabel="Add New Chore"
          onAction={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
        />
      ) : viewMode === 'kanban' ? (
        <TaskKanban
          tasks={filteredTasks}
          onComplete={(t) => setSelectedTaskToComplete(t)}
          onEdit={(t) => {
            setEditingTask(t);
            setIsTaskModalOpen(true);
          }}
          onDelete={handleDeleteTask}
          onExchange={() => setIsExchangeModalOpen(true)}
          currentUserId={user?._id}
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

      {/* Modals */}
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

      <TaskCompleteModal
        isOpen={!!selectedTaskToComplete}
        onClose={() => setSelectedTaskToComplete(null)}
        task={selectedTaskToComplete}
        onConfirm={handleConfirmComplete}
        loading={modalLoading}
      />

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

export default AllTasksPage;

