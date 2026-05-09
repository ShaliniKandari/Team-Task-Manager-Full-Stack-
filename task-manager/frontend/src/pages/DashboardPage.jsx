import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, AlertTriangle, ListTodo, Layers, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import TaskBadge from '../components/TaskBadge';

const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: 'Total Tasks', value: data?.totalTasks ?? 0, icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'My Open Tasks', value: data?.myTasks ?? 0, icon: ListTodo, color: 'text-blue-600 bg-blue-50' },
    { label: 'Overdue', value: data?.overdueTasks ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Completed', value: data?.statusBreakdown?.find(s => s.status === 'DONE')?._count ?? 0, icon: CheckSquare, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening across your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {data?.statusBreakdown?.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-4 gap-3">
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(status => {
              const count = data.statusBreakdown.find(s => s.status === status)?._count ?? 0;
              const total = data.totalTasks || 1;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{STATUS_LABELS[status]}</span>
                    <span className="text-xs font-medium text-gray-700">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.round((count / total) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Recent Tasks</h2>
          <Link to="/tasks" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {data?.recentTasks?.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No tasks yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.recentTasks?.map(task => (
              <div key={task.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TaskBadge type="status" value={task.status} />
                  <TaskBadge type="priority" value={task.priority} />
                  {task.dueDate && (
                    <span className={`text-xs ${isPast(new Date(task.dueDate)) && task.status !== 'DONE' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
