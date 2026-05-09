import { MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react';
import { useState } from 'react';
import { format, isPast } from 'date-fns';
import TaskBadge from './TaskBadge';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, currentUserId, isAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const canEdit = isAdmin || task.creatorId === currentUserId || task.assigneeId === currentUserId;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';

  return (
    <div className={`card p-3 select-none ${isOverdue ? 'border-red-200' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</p>
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 min-w-36">
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                >
                  <Pencil size={12} /> Edit
                </button>
                {/* Quick status changes */}
                {STATUSES.filter(s => s !== task.status).map(s => (
                  <button
                    key={s}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => { setMenuOpen(false); onStatusChange(s); }}
                  >
                    → Move to {s.replace('_', ' ')}
                  </button>
                ))}
                {(isAdmin || task.creatorId === currentUserId) && (
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <TaskBadge type="priority" value={task.priority} />
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            <Calendar size={10} />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 text-xs font-bold" style={{ fontSize: 9 }}>
              {task.assignee.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-400">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
}
