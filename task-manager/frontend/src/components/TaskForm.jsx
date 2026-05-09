import { useState } from 'react';
import api from '../lib/api';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TaskForm({ projectId, members, task, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'TODO',
    priority: task?.priority ?? 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task?.assigneeId ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        projectId,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };
      const { data } = task
        ? await api.put(`/tasks/${task.id}`, payload)
        : await api.post('/tasks', payload);
      onSaved(data.task);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input className="input" value={form.title} onChange={set('title')} required placeholder="Task title" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
        <textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="More details…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
          <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
          <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.userId} value={m.userId}>{m.user?.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
