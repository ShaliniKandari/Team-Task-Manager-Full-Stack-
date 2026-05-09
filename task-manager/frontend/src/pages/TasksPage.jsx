import { useEffect, useState } from 'react';
import { CheckSquare, Filter } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import TaskBadge from '../components/TaskBadge';
import { format, isPast } from 'date-fns';

const STATUSES = ['', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', assigneeId: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
    api.get(`/tasks?${params}`)
      .then(r => setTasks(r.data.tasks))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters]);

  const handleStatusChange = async (taskId, status) => {
    const { data } = await api.put(`/tasks/${taskId}`, { status });
    setTasks(ts => ts.map(t => t.id === taskId ? data.task : t));
  };

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select className="input w-36 text-xs" value={filters.status} onChange={setFilter('status')}>
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="input w-36 text-xs" value={filters.priority} onChange={setFilter('priority')}>
            <option value="">All priorities</option>
            {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={filters.assigneeId === user?.id}
              onChange={e => setFilters(f => ({ ...f, assigneeId: e.target.checked ? user?.id : '' }))}
            />
            Mine only
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {tasks.map(task => {
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
            return (
              <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <TaskBadge type="priority" value={task.priority} />
                  <select
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value)}
                  >
                    {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  {task.assignee && (
                    <span className="text-xs text-gray-400">{task.assignee.name}</span>
                  )}
                  {task.dueDate && (
                    <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
