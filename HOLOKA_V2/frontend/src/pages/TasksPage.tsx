import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { listTasks, createTask, updateTaskStatus } from '../services/taskService';
import type { TaskView, TaskCreate, TaskStatus, Priority } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { PriorityBadge } from '../components/ui/Badge';
import { ErrorNotice, Field } from '../components/ui/ResourceControls';
import { errorMessage } from '../services/api';

function CreateTaskForm({
  onSubmit, onCancel, loading,
}: {
  onSubmit: (v: TaskCreate) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [form, setForm] = useState<TaskCreate>({
    propertyId: 0,
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const set = <K extends keyof TaskCreate>(k: K, v: TaskCreate[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label={isVi ? 'Tiêu đề *' : 'Task Title *'}>
            <input
              required
              className="input"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={isVi ? 'Kiểm tra hệ thống điện tầng 2…' : 'Check electrical wiring floor 2…'}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={isVi ? 'Mô tả' : 'Description'}>
            <textarea
              className="textarea"
              rows={2}
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder={isVi ? 'Chi tiết công việc…' : 'Task details…'}
            />
          </Field>
        </div>
        <Field label={isVi ? 'Bất động sản (ID) *' : 'Property (ID) *'}>
          <input
            required
            type="number"
            min={1}
            className="input"
            value={form.propertyId || ''}
            onChange={e => set('propertyId', Number(e.target.value))}
            placeholder="1"
          />
        </Field>
        <Field label={isVi ? 'Ngày hạn' : 'Due Date'}>
          <input type="date" className="input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </Field>
        <Field label={isVi ? 'Mức độ ưu tiên' : 'Priority'}>
          <select className="input" value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
            <option value="LOW">{isVi ? 'Thấp' : 'Low'}</option>
            <option value="MEDIUM">{isVi ? 'Trung bình' : 'Medium'}</option>
            <option value="HIGH">{isVi ? 'Cao' : 'High'}</option>
            <option value="URGENT">{isVi ? 'Khẩn cấp' : 'Urgent'}</option>
          </select>
        </Field>
      </div>

      <div className="flex justify-end gap-2.5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          {isVi ? 'Hủy' : 'Cancel'}
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading
            ? (isVi ? 'Đang tạo…' : 'Creating…')
            : (isVi ? 'Tạo công việc' : 'Create Task')}
        </button>
      </div>
    </form>
  );
}

function TaskCard({ task, onAction, wsId }: { task: TaskView; onAction: () => void; wsId: number }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const nextMap: Partial<Record<TaskStatus, TaskStatus>> = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
  };
  const next = nextMap[task.status];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const doNext = async () => {
    if (!next) return;
    setBusy(true);
    setError('');
    try {
      await updateTaskStatus(wsId, task.id, next, task.version);
      onAction();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="card p-3.5 space-y-2.5"
      style={task.overdue ? { borderColor: 'var(--danger-border)' } : undefined}
    >
      <div className="flex items-start gap-2">
        <p className="text-sm font-semibold flex-1 leading-snug" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1" style={{ color: task.overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
          {task.overdue && <AlertCircle size={11} />}
          {isVi ? 'Hạn: ' : 'Due: '}
          {new Date(task.dueDate).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{isVi ? 'BĐS #' : 'Property #'}{task.propertyId}</span>
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

      {next && (
        <button type="button" onClick={doNext} disabled={busy} className="btn btn-secondary w-full">
          {busy
            ? (isVi ? 'Đang cập nhật…' : 'Updating…')
            : next === 'COMPLETED'
            ? (isVi ? 'Hoàn thành' : 'Mark Done')
            : (isVi ? 'Bắt đầu' : 'Start Task')}
        </button>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    listTasks(wsId, { overdue: overdueOnly || undefined, size: 100 })
      .then(res => { if (active) { setTasks(res.items); setError(''); } })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId, overdueOnly]);

  useEffect(() => load(), [load]);

  const handleCreate = async (form: TaskCreate) => {
    setSaving(true);
    try {
      await createTask(wsId, form);
      setCreateOpen(false);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally { setSaving(false); }
  };

  const byStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);
  const totalOverdue = tasks.filter(t => t.overdue).length;

  const columns: { status: TaskStatus; label: string; tone: string }[] = [
    { status: 'TODO',        label: isVi ? 'Cần làm' : 'To Do',         tone: 'var(--text-muted)' },
    { status: 'IN_PROGRESS', label: isVi ? 'Đang làm' : 'In Progress',  tone: 'var(--info)' },
    { status: 'COMPLETED',   label: isVi ? 'Hoàn thành' : 'Completed',   tone: 'var(--success)' },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Công việc nhân viên' : 'Staff Tasks'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {tasks.length} {isVi ? 'công việc' : 'tasks'}
            {totalOverdue > 0 && (
              <span className="font-semibold ml-1.5" style={{ color: 'var(--danger)' }}>
                · {totalOverdue} {isVi ? 'quá hạn' : 'overdue'}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--danger)' }}
            />
            {isVi ? 'Chỉ quá hạn' : 'Overdue only'}
          </label>
          <button type="button" onClick={() => setCreateOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            {isVi ? 'Tạo công việc' : 'Create Task'}
          </button>
        </div>
      </div>

      <ErrorNotice message={error} retry={load} />

      {/* Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = byStatus(col.status);
          return (
            <section
              key={col.status}
              className="rounded-2xl p-3 space-y-2.5"
              style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
              aria-label={col.label}
            >
              <header className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.tone }} />
                  <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{col.label}</h2>
                </div>
                <span
                  className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums"
                  style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  {colTasks.length}
                </span>
              </header>

              <div className="space-y-2.5">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)
                ) : colTasks.length === 0 ? (
                  <EmptyState
                    icon={col.status === 'COMPLETED' ? CheckCircle2 : AlertCircle}
                    title={isVi ? 'Không có công việc' : 'No tasks in this list'}
                  />
                ) : colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onAction={load} wsId={wsId} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={isVi ? 'Tạo công việc mới' : 'Create New Task'}
        size="md"
      >
        <CreateTaskForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
      </Modal>
    </div>
  );
}
