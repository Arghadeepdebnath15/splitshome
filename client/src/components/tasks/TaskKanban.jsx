import React from 'react';
import TaskCard from './TaskCard';
import { Circle, PlayCircle, CheckCircle } from 'lucide-react';

const TaskKanban = ({
  tasks,
  onComplete,
  onEdit,
  onDelete,
  onExchange,
  currentUserId
}) => {
  const pendingTasks = tasks.filter(
    (t) => t.status === 'Pending' || t.status === 'Overdue'
  );
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  const columns = [
    {
      id: 'pending',
      title: 'Pending & Overdue',
      icon: Circle,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      tasks: pendingTasks
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      icon: PlayCircle,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
      tasks: inProgressTasks
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: CheckCircle,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      tasks: completedTasks
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => (
        <div
          key={col.id}
          className="bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 flex flex-col min-h-[500px]"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${col.color}`}>
                <col.icon className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {col.title}
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}
            >
              {col.tasks.length}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {col.tasks.length === 0 ? (
              <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                No tasks here
              </div>
            ) : (
              col.tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onExchange={onExchange}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskKanban;

