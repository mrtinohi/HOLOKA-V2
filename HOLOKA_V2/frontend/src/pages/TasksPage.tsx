import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listTasks, createTask, updateTaskStatus } from '../services/taskService';
import type { TaskView, TaskCreate, TaskStatus, Priority } from '../types';
import Modal from '../components/ui/Modal';
import { PriorityBadge } from '../components/ui/Badge';

/* ── Kanban column config ─────────────────────────────────────────────────── */
const COLUMNS: { status: TaskStatus; label: string; color: string; bg: string }[] = [
  { status: 'TODO',        label: '📋 Cần làm',    color: '#475569', bg: '#f8fafc' },
  { status: 'IN_PROGRESS', label: '⚡ Đang làm',   color: '#0284c7', bg: '#f0f9ff' },
  { status: 'COMPLETED',   label: '✅ Hoàn thành', color: '#059669', bg: '#ecfdf5' },
];

/* ── Create Form ─────────────────────────────────────────────────────────── */
function CreateTaskForm({ onSubmit, onCancel, loading }: {
  onSubmit: (v: TaskCreate) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<TaskCreate>({
    propertyId: 0,
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const set = <K extends keyof TaskCreate>(k: K, v: TaskCreate[K]) =>
    setForm(f => ({ ...f, [k]: v }));
  const inputCls = 'w-full px-3 py-2 rounded-xl border text-sm focus:outline-none';
  const inputStyle = { borderColor: '#e2e8f0' };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Tiêu đề *</label>
          <input required className={inputCls} style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Kiểm tra hệ thống điện tầng 2..." />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Mô tả</label>
          <textarea className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Chi tiết công việc..." />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Property ID *</label>
          <input required type="number" className={inputCls} style={inputStyle} value={form.propertyId || ''} onChange={e => set('propertyId', Number(e.target.value))} placeholder="1" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Ngày hạn</label>
          <input type="date" className={inputCls} style={inputStyle} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Ưu tiên</label>
          <select className={inputCls} style={inputStyle} value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>Hủy</button>
        <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {loading ? 'Đang tạo…' : 'Tạo task'}
        </button>
      </div>
    </form>
  );
}

/* ── Task Card ───────────────────────────────────────────────────────────── */
function TaskCard({ task, onAction, wsId }: { task: TaskView; onAction: () => void; wsId: number }) {
  const nextMap: Partial<Record<TaskStatus, TaskStatus>> = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
  };
  const next = nextMap[task.status];
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  const doNext = async () => {
    if (!next) return;
    await updateTaskStatus(wsId, task.id, next, task.version);
    onAction();
  };

  return (
    <div
      className="rounded-2xl p-4 space-y-2.5 fade-in"
      style={{ background: '#fff', border: `1px solid ${task.overdue ? 'rgba(244,63,94,0.25)' : '#f1f5f9'}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start gap-2">
        <p className="text-sm font-semibold flex-1" style={{ color: '#0f172a', lineHeight: 1.4 }}>{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-xs line-clamp-2" style={{ color: '#94a3b8' }}>{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs" style={{ color: task.overdue ? '#f43f5e' : '#94a3b8' }}>
          {task.overdue && <AlertCircle size={11} />}
          <span>Hạn: {fmtDate(task.dueDate)}</span>
          {task.overdue && <span className="font-semibold">(Quá hạn)</span>}
        </div>
        <span className="text-xs" style={{ color: '#94a3b8' }}>Prop #{task.propertyId}</span>
      </div>

      {next && (
        <button
          onClick={doNext}
          className="w-full py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
        >
          {next === 'COMPLETED' ? '✓ Hoàn thành' : '▶ Bắt đầu'}
        </button>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function TasksPage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;

  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listTasks(wsId, { overdue: overdueOnly || undefined, size: 100 })
      .then(res => setTasks(res.items))
      .finally(() => setLoading(false));
  }, [wsId, overdueOnly]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form: TaskCreate) => {
    setSaving(true);
    try {
      await createTask(wsId, form);
      setCreateOpen(false);
      load();
    } finally { setSaving(false); }
  };

  const byStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const totalOverdue = tasks.filter(t => t.overdue).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Công việc</h1>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
            Quản lý task vận hành.
            {totalOverdue > 0 && (
              <span className="ml-2 font-semibold" style={{ color: '#f43f5e' }}>
                ⚠ {totalOverdue} task quá hạn
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#f43f5e' }}
            />
            <span style={{ color: '#475569' }}>Chỉ quá hạn</span>
          </label>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            <Plus size={17} /> Tạo task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 fade-in">
        {COLUMNS.map(col => (
          <div key={col.status} className="card p-4">
            <p className="text-2xl font-bold" style={{ color: col.color }}>{byStatus(col.status).length}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{col.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 fade-in">
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.status);
          return (
            <div
              key={col.status}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: col.bg, minHeight: 200 }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold" style={{ color: col.color }}>{col.label}</h3>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: col.color, color: '#fff' }}
                >
                  {colTasks.length}
                </span>
              </div>

              {loading ? (
                Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
              ) : colTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Không có task</p>
                </div>
              ) : colTasks.map(task => (
                <TaskCard key={task.id} task={task} onAction={load} wsId={wsId} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Tạo công việc mới" size="md">
        <CreateTaskForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
      </Modal>
    </div>
  );
}
