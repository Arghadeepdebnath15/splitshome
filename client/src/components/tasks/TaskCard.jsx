import React from 'react';
import {
  Calendar,
  CheckCircle2,
  MoreVertical,
  Clock,
  Sparkles,
  ArrowRightCircle
} from 'lucide-react';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';

const categoryIcons = {
  Cleaning: '🧹',
  'Washing dishes': '🍽️',
  Cooking: '🍳',
  'Grocery shopping': '🛒',
  Laundry: '🧺',
  'Bathroom cleaning': '🚿',
  'Garbage disposal': '🗑️',
  Other: '✨'
};

const TaskCard = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  onExchange,
  currentUserId
}) => {
  const isAssignedToMe = task.assignedTo?._id === currentUserId;
  const isCompleted = task.status === 'Completed';
  const isOverdue = task.status === 'Overdue';

  const dueDateFormatted = new Date(task.dueDate).toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${
        isCompleted
          ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
          : isOverdue
          ? 'border-rose-200/80 dark:border-rose-900/40'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Category, Priority & Credit Value header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-base" role="img" aria-label={task.category}>
            {categoryIcons[task.category] || '✨'}
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {task.category}
          </span>
          <Badge variant={task.priority}>{task.priority}</Badge>
        </div>

        {/* Credit pill */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300 shadow-sm">
          <Sparkles className="w-3 h-3" />
          <span>{task.creditValue} cr</span>
        </div>
      </div>

      {/* Title & Description */}
      <h4
        className={`text-sm font-bold tracking-tight text-slate-900 dark:text-white ${
          isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
        }`}
      >
        {task.title}
      </h4>

      {task.description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Due Date & Assignee Strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {/* Due Date */}
        <div
          className={`flex items-center gap-1 font-medium ${
            isOverdue
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{dueDateFormatted}</span>
          {isOverdue && <span className="font-bold text-[10px] ml-1">(Overdue)</span>}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          <Avatar
            name={task.assignedTo?.name || 'Unassigned'}
            color={task.assignedTo?.avatarColor}
            size="xs"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {isAssignedToMe ? 'You' : task.assignedTo?.name}
          </span>
        </div>
      </div>

      {/* Completed on behalf banner if completed by someone else */}
      {isCompleted && task.isCompletedOnBehalf && (
        <div className="mt-3 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
          <span className="font-semibold">{task.completedBy?.name}</span> completed this for{' '}
          <span className="font-semibold">{task.assignedTo?.name}</span> (+{task.creditValue} cr)
        </div>
      )}

      {/* Action footer */}
      {!isCompleted && (
        <div className="mt-3 pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => onComplete(task)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Complete</span>
          </button>

          {onExchange && (
            <button
              onClick={() => onExchange(task)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              title="Request Exchange or Help"
            >
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Task"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;

