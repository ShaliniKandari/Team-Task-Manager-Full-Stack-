const STATUS = {
  TODO:        { label: 'To Do',       cls: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  IN_REVIEW:   { label: 'In Review',   cls: 'bg-yellow-100 text-yellow-700' },
  DONE:        { label: 'Done',        cls: 'bg-green-100 text-green-700' },
};

const PRIORITY = {
  LOW:    { label: 'Low',    cls: 'bg-gray-100 text-gray-500' },
  MEDIUM: { label: 'Medium', cls: 'bg-blue-50 text-blue-600' },
  HIGH:   { label: 'High',   cls: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Urgent', cls: 'bg-red-100 text-red-600' },
};

export default function TaskBadge({ type, value }) {
  const map = type === 'status' ? STATUS : PRIORITY;
  const cfg = map[value];
  if (!cfg) return null;
  return (
    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
  );
}
