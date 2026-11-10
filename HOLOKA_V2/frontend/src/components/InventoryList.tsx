import { useCallback, useState, type ReactNode } from 'react';
import type { PageResponse } from '../types';
import { errorMessage } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import Modal from './ui/Modal';
import EmptyState from './ui/EmptyState';
import { Inbox, Plus, Pencil, Trash2 } from 'lucide-react';
import { buttonClass, secondaryClass, inputClass, ErrorNotice, Pagination, useResource } from './ui/ResourceControls';

export interface InventoryFilter {
  search: string;
  status: string;
  page: number;
  size: number;
  sort: string;
}

export default function InventoryList<T extends { id: number; version: number }>({
  title, description, load, columns, statuses, remove, form, canCreate = true, canDelete = true, sortFields,
}: {
  title: string;
  description: string;
  /** Retained for backwards compatibility; row drill-down is not wired up yet. */
  path?: string;
  load: (filter: InventoryFilter) => Promise<PageResponse<T>>;
  columns: { label: string; render: (row: T) => ReactNode }[];
  statuses: { value: string; label: string }[];
  remove: (row: T) => Promise<void>;
  form: (row: T | null, done: () => void, cancel: () => void) => ReactNode;
  canCreate?: boolean;
  canDelete?: boolean;
  sortFields: { value: string; label: string }[];
}) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [filter, setFilter] = useState<InventoryFilter>({
    search: '', status: '', page: 0, size: 20, sort: 'id,desc',
  });
  const [edit, setEdit] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  const query = useCallback(() => load(filter), [load, filter]);
  const { data, loading, error, reload } = useResource(query);

  const done = () => {
    setOpen(false);
    setMessage(isVi ? 'Đã lưu dữ liệu.' : 'Data saved successfully.');
    reload();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setActionError('');
    try {
      await remove(deleting);
      setDeleting(null);
      setMessage(isVi ? 'Đã xóa bản ghi.' : 'Record deleted successfully.');
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setEdit(null);
    setActionError('');
    setOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
        </div>
        {canCreate && (
          <button type="button" className={buttonClass} onClick={openCreate}>
            <Plus size={16} />
            {isVi ? 'Thêm mới' : 'Add New'}
          </button>
        )}
      </div>

      {message && (
        <p
          role="status"
          className="rounded-xl px-3.5 py-2.5 text-sm font-medium"
          style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
        >
          {message}
        </p>
      )}

      {/* Toolbar */}
      <div className="card p-3 flex flex-wrap gap-2.5">
        <input
          aria-label={isVi ? 'Tìm kiếm' : 'Search'}
          className={`${inputClass} flex-1 min-w-48`}
          placeholder={isVi ? 'Tìm kiếm…' : 'Search…'}
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value, page: 0 })}
        />
        <select
          aria-label={isVi ? 'Trạng thái' : 'Status'}
          className={`${inputClass} sm:w-48`}
          value={filter.status}
          onChange={e => setFilter({ ...filter, status: e.target.value, page: 0 })}
        >
          <option value="">{isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
          {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          aria-label={isVi ? 'Sắp xếp' : 'Sort'}
          className={`${inputClass} sm:w-48`}
          value={filter.sort}
          onChange={e => setFilter({ ...filter, sort: e.target.value, page: 0 })}
        >
          <option value="id,desc">{isVi ? 'Mới nhất' : 'Newest'}</option>
          {sortFields.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <ErrorNotice message={error} retry={reload} />

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {columns.map(c => <th key={c.label}>{c.label}</th>)}
                <th className="text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: columns.length + 1 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4" style={{ width: j === 0 ? 150 : 90 }} /></td>
                    ))}
                  </tr>
                ))
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <EmptyState
                      icon={Inbox}
                      title={error ? (isVi ? 'Chưa tải được dữ liệu' : 'Failed to load data') : (isVi ? 'Không có bản ghi phù hợp' : 'No records found')}
                      description={error ? (isVi ? 'Vui lòng thử tải lại.' : 'Please try reloading.') : (isVi ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc.' : 'Try changing your search terms or filters.')}
                    />
                  </td>
                </tr>
              ) : data.items.map(row => (
                <tr key={row.id}>
                  {columns.map(c => <td key={c.label}>{c.render(row)}</td>)}
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        title={isVi ? 'Sửa' : 'Edit'}
                        aria-label={isVi ? 'Sửa' : 'Edit'}
                        onClick={() => { setEdit(row); setActionError(''); setOpen(true); }}
                      >
                        <Pencil size={15} />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          title={isVi ? 'Xóa' : 'Delete'}
                          aria-label={isVi ? 'Xóa' : 'Delete'}
                          onClick={() => { setActionError(''); setDeleting(row); }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!!data?.items.length && (
          <Pagination
            page={filter.page}
            total={data?.totalElements ?? 0}
            size={filter.size}
            onChange={page => setFilter({ ...filter, page })}
          />
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={(edit ? (isVi ? 'Chỉnh sửa · ' : 'Edit · ') : (isVi ? 'Thêm mới · ' : 'Add New · ')) + title}
        size="lg"
      >
        {open && form(edit, done, () => setOpen(false))}
      </Modal>

      <Modal
        isOpen={!!deleting}
        onClose={() => !busy && setDeleting(null)}
        title={isVi ? 'Xác nhận xóa' : 'Confirm Deletion'}
        size="sm"
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isVi
            ? 'Bản ghi có lịch sử liên quan sẽ được hệ thống bảo vệ. Bạn có thể chuyển sang trạng thái ngừng hoạt động nếu không thể xóa.'
            : 'Records with linked historical data are protected by the system. You can set them to inactive if they cannot be deleted.'}
        </p>
        <ErrorNotice message={actionError} />
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className={secondaryClass} disabled={busy} onClick={() => setDeleting(null)}>
            {isVi ? 'Hủy' : 'Cancel'}
          </button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={confirmDelete}>
            {busy ? (isVi ? 'Đang xóa…' : 'Deleting…') : (isVi ? 'Xác nhận xóa' : 'Delete')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
