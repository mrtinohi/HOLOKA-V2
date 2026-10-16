import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PageResponse } from '../../types';
import { errorMessage } from '../../services/api';

export const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
export const buttonClass = 'rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50';
export const secondaryClass = 'rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40';
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return message ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}{retry && <button onClick={retry} className="ml-3 underline">Thử lại</button>}</div> : null;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;
}
export function Pagination({ page, total, size = 20, onChange }: { page: number; total: number; size?: number; onChange: (page: number) => void }) {
  return <div className="flex items-center justify-between gap-3 py-4 text-sm text-slate-500"><span>{total} bản ghi · Trang {page + 1}/{Math.max(1, Math.ceil(total / size))}</span><div className="flex gap-2"><button className={secondaryClass} disabled={page === 0} onClick={() => onChange(page - 1)}>Trước</button><button className={secondaryClass} disabled={(page + 1) * size >= total} onClick={() => onChange(page + 1)}>Sau</button></div></div>;
}
export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    load().then(value => { if (active) setData(value); })
      .catch(e => { if (active) { setData(null); setError(errorMessage(e)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { data, error, loading, reload };
}
export function AsyncSelect<T extends { id: number }>({ label, value, onChange, load, text, disabled = false, required = true }: {
  label: string; value: number | undefined; onChange: (id: number) => void;
  load: (search: string, page: number) => Promise<PageResponse<T>>;
  text: (item: T) => string; disabled?: boolean; required?: boolean;
}) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(0);
  const query = useCallback(() => disabled ? Promise.resolve({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as PageResponse<T>) : load(search, page), [load, search, page, disabled]);
  const { data, error, loading } = useResource(query);
  const selected = useRef<T | null>(null);
  const found = data?.items.find(item => item.id === value);
  useEffect(() => { if (found) selected.current = found; }, [found]);
  return <div className="space-y-2"><Field label={label}>
    <input aria-label={'Tìm ' + label} disabled={disabled} className={inputClass} placeholder="Tìm kiếm để chọn…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
    <select className={inputClass} required={required} disabled={disabled || loading} value={value || ''} onChange={e => onChange(Number(e.target.value))}>
      <option value="">{loading ? 'Đang tải…' : 'Chọn ' + label.toLowerCase()}</option>
      {!!value && !found && <option value={value}>{selected.current?.id === value ? text(selected.current) : '#' + value}</option>}
      {data?.items.map(item => <option key={item.id} value={item.id}>{text(item)}</option>)}
    </select></Field><ErrorNotice message={error} />
    {data && data.totalPages > 1 && <Pagination page={page} total={data.totalElements} onChange={setPage} />}
  </div>;
}
export function SaveButtons({ busy, onCancel }: { busy: boolean; onCancel: () => void }) {
  return <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={onCancel} className={secondaryClass}>Hủy</button><button disabled={busy} className={buttonClass}>{busy ? 'Đang lưu…' : 'Lưu'}</button></div>;
}
