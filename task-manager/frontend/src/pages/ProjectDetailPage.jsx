import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Users, Trash2, UserPlus, Crown, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

const COLUMNS = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  const load = () => {
    api.get(`/projects/${projectId}`)
      .then(r => setProject(r.data.project))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const isAdmin = project?.myRole === 'ADMIN';

  const handleTaskSaved = (task) => {
    setProject(p => {
      const existing = p.tasks.find(t => t.id === task.id);
      return {
        ...p,
        tasks: existing
          ? p.tasks.map(t => t.id === task.id ? task : t)
          : [task, ...p.tasks],
      };
    });
    setShowTaskForm(false);
    setEditTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setProject(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== taskId) }));
  };

  const handleStatusChange = async (taskId, status) => {
    const { data } = await api.put(`/tasks/${taskId}`, { status });
    setProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === taskId ? data.task : t) }));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    setAddingMember(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { email: memberEmail, role: memberRole });
      setProject(p => ({ ...p, members: [...p.members, data.member] }));
      setMemberEmail('');
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${projectId}/members/${memberId}`);
    setProject(p => ({ ...p, members: p.members.filter(m => m.userId !== memberId) }));
  };

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = project?.tasks?.filter(t => t.status === col.key) ?? [];
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{project?.name}</h1>
            {project?.description && <p className="text-sm text-gray-500">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs" onClick={() => setShowMembers(true)}>
            <Users size={14} /> {project?.members?.length} Members
          </button>
          {isAdmin && (
            <button className="btn-primary text-xs" onClick={() => setShowTaskForm(true)}>
              <Plus size={14} /> Add Task
            </button>
          )}
          {!isAdmin && (
            <button className="btn-primary text-xs" onClick={() => setShowTaskForm(true)}>
              <Plus size={14} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(col => (
            <div key={col.key} className="w-72 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                  {tasksByStatus[col.key].length}
                </span>
              </div>
              <div className="flex flex-col gap-2 min-h-24">
                {tasksByStatus[col.key].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => { setEditTask(task); setShowTaskForm(true); }}
                    onDelete={() => handleDeleteTask(task.id)}
                    onStatusChange={(status) => handleStatusChange(task.id, status)}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Form Modal */}
      <Modal
        open={showTaskForm}
        onClose={() => { setShowTaskForm(false); setEditTask(null); }}
        title={editTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          projectId={projectId}
          members={project?.members ?? []}
          task={editTask}
          onSaved={handleTaskSaved}
          onCancel={() => { setShowTaskForm(false); setEditTask(null); }}
        />
      </Modal>

      {/* Members Modal */}
      <Modal open={showMembers} onClose={() => setShowMembers(false)} title="Project Members">
        <div className="space-y-4">
          {isAdmin && (
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="user@email.com"
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  required
                />
                <select
                  className="input w-32"
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {memberError && <p className="text-xs text-red-600">{memberError}</p>}
              <button className="btn-primary w-full justify-center text-sm" disabled={addingMember}>
                <UserPlus size={14} /> {addingMember ? 'Adding…' : 'Add Member'}
              </button>
            </form>
          )}

          <div className="divide-y divide-gray-50">
            {project?.members?.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-indigo-700 text-xs font-bold">
                    {m.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{m.user?.name}</p>
                  <p className="text-xs text-gray-400">{m.user?.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${m.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {m.role === 'ADMIN' && <Crown size={10} className="mr-1" />}
                    {m.role}
                  </span>
                  {isAdmin && m.userId !== user?.id && (
                    <button onClick={() => handleRemoveMember(m.userId)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
