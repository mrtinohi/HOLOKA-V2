import { useCallback, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { PageResponse } from '../types';
import { errorMessage } from '../services/api';
import Modal from './ui/Modal';
import { buttonClass, secondaryClass, inputClass, ErrorNotice, Pagination, useResource } from './ui/ResourceControls';

export interface InventoryFilter { search: string; status: string; page: number; size: number; sort: string }
export default function InventoryList<T extends { id: number; version: number }>({ title, description, path, load, columns, statuses, remove, form, canCreate = true, canDelete = true, sortFields }: {
  title: string; description: string; path: string; load: (filter: InventoryFilter) => Promise<PageResponse<T>>;
  columns: { label: string; render: (row: T) => ReactNode }[]; statuses: { value: string; label: string }[];
  remove: (row: T) => Promise<void>; form: (row: T | null, done: () => void, cancel: () => void) => ReactNode;
  canCreate?: boolean; canDelete?: boolean; sortFields: { value: string; label: string }[];
}) {
  const [filter, setFilter] = useState<InventoryFilter>({ search: '', status: '', page: 0, size: 20, sort: 'id,desc' });
  const query = useCallback(() => load(filter), [load, filter]);
  const { data, loading, error, reload } = useResource(query);
  const [edit, setEdit] = useState<T | null>(null); const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null); const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(''); const [message, setMessage] = useState('');
  const done = () => { setOpen(false); setMessage('Đã lưu dữ liệu.'); reload(); };
  const confirmDelete = async () => {
    if (!deleting) return; setBusy(true); setActionError('');
    try { await remove(deleting); setDeleting(null); setMessage('Đã xóa bản ghi.'); reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div>{canCreate && <button className={buttonClass} onClick={() => { setEdit(null); setOpen(true); }}>Thêm mới</button>}</div>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    <div className="card flex flex-wrap gap-3 p-4"><input aria-label="Tìm kiếm" className={inputClass + ' flex-1 min-w-48'} placeholder="Tìm kiếm…" value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value, page: 0 })} />
      <select aria-label="Trạng thái" className={inputClass + ' sm:w-48'} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value, page: 0 })}><option value="">Tất cả trạng thái</option>{statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      <select aria-label="Sắp xếp" className={inputClass + ' sm:w-48'} value={filter.sort} onChange={e => setFilter({ ...filter, sort: e.target.value, page: 0 })}><option value="id,desc">Mới nhất</option>{sortFields.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
    </div><ErrorNotice message={error} retry={reload} />
    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{columns.map(c => <th className="whitespace-nowrap px-5 py-4" key={c.label}>{c.label}</th>)}<th className="px-5 py-4">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">
      {loading ? <tr><td className="p-8 text-center text-slate-500" colSpan={columns.length + 1}>Đang tải…</td></tr> : !data?.items.length ? <tr><td className="p-8 text-center text-slate-500" colSpan={columns.length + 1}>{error ? 'Chưa tải được dữ liệu.' : 'Không có bản ghi phù hợp.'}</td></tr> : data.items.map(row => <tr key={row.id}>{columns.map(c => <td className="px-5 py-4" key={c.label}>{c.render(row)}</td>)}<td className="px-5 py-4"><div className="flex gap-2 whitespace-nowrap"><Link className={secondaryClass} to={path + '/' + row.id}>Chi tiết</Link><button className={secondaryClass} onClick={() => { setEdit(row); setOpen(true); }}>Sửa</button>{canDelete && <button className={secondaryClass} onClick={() => { setActionError(''); setDeleting(row); }}>Xóa</button>}</div></td></tr>)}
    </tbody></table></div><Pagination page={filter.page} total={data?.totalElements ?? 0} onChange={page => setFilter({ ...filter, page })} />
    <Modal isOpen={open} onClose={() => setOpen(false)} title={(edit ? 'Chỉnh sửa · ' : 'Thêm · ') + title}>{open && form(edit, done, () => setOpen(false))}</Modal>
    <Modal isOpen={!!deleting} onClose={() => !busy && setDeleting(null)} title="Xác nhận xóa"><p className="mb-4 text-sm text-slate-600">Bản ghi có lịch sử liên quan sẽ được hệ thống bảo vệ. Bạn có thể chuyển sang ngừng hoạt động nếu không thể xóa.</p><ErrorNotice message={actionError} /><div className="mt-4 flex justify-end gap-3"><button className={secondaryClass} disabled={busy} onClick={() => setDeleting(null)}>Hủy</button><button className={buttonClass} disabled={busy} onClick={confirmDelete}>{busy ? 'Đang xóa…' : 'Xác nhận xóa'}</button></div></Modal>
  </div>;
}
