import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckSquare, Trash2, Crown } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/projects', form);
      setProjects(p => [data.project, ...p]);
      setShowCreate(false);
      setForm({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    setProjects(p => p.filter(x => x.id !== id));
  };

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No projects yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
          <button className="btn-primary mt-4" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <div key={p.id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <FolderKanban size={18} className="text-indigo-600" />
                </div>
                <div className="flex items-center gap-1">
                  {p.myRole === 'ADMIN' && (
                    <span className="badge bg-indigo-50 text-indigo-600">
                      <Crown size={10} className="mr-1" />Admin
                    </span>
                  )}
                  {p.myRole === 'ADMIN' && p.owner?.id === user?.id && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">{p.name}</h2>
                {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {p.members?.length ?? 0} members
                </span>
                <span className="flex items-center gap-1">
                  <CheckSquare size={12} /> {p._count?.tasks ?? 0} tasks
                </span>
              </div>

              <Link to={`/projects/${p.id}`} className="btn-secondary w-full justify-center text-xs mt-1">
                Open Project
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
            <input
              className="input"
              placeholder="My awesome project"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
