import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PageResponse } from '../../types';
import { errorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

/* ─── Shared class strings (single source of truth) ─────────────────────── */
export const inputClass = 'input';
export const buttonClass = 'btn btn-primary';
export const secondaryClass = 'btn btn-secondary';

/* ─── Error notice ──────────────────────────────────────────────────────── */
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl p-3.5 text-sm"
      style={{
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger-border)',
        color: 'var(--danger)',
      }}
    >
      <span className="flex-1">{message}</span>
      {retry && (
        <button type="button" onClick={retry} className="font-semibold underline underline-offset-2 shrink-0">
          {isVi ? 'Thử lại' : 'Retry'}
        </button>
      )}
    </div>
  );
}

/* ─── Field ─────────────────────────────────────────────────────────────── */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
    </label>
  );
}

/* ─── Pagination ────────────────────────────────────────────────────────── */
export function Pagination({
  page, total, size = 20, onChange,
}: { page: number; total: number; size?: number; onChange: (page: number) => void }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
      style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
    >
      <span>
        {isVi ? 'Trang ' : 'Page '}
        <strong style={{ color: 'var(--text-primary)' }}>{page + 1}</strong>
        {isVi ? ` / ${totalPages}` : ` of ${totalPages}`}
        <span className="mx-1.5">·</span>
        {total} {isVi ? 'bản ghi' : 'records'}
      </span>
      <div className="flex gap-2">
        <button type="button" className={secondaryClass} disabled={page === 0} onClick={() => onChange(page - 1)}>
          {isVi ? 'Trước' : 'Previous'}
        </button>
        <button type="button" className={secondaryClass} disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
          {isVi ? 'Sau' : 'Next'}
        </button>
      </div>
    </div>
  );
}

/* ─── Data loading ──────────────────────────────────────────────────────── */
export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    load()
      .then(value => { if (active) setData(value); })
      .catch(e => { if (active) { setData(null); setError(errorMessage(e)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, revision]);

  const reload = useCallback(() => setRevision(v => v + 1), []);
  return { data, error, loading, reload };
}

/* ─── Searchable async select ───────────────────────────────────────────── */
export function AsyncSelect<T extends { id: number }>({
  label, value, onChange, load, text, disabled = false, required = true,
}: {
  label: string;
  value: number | undefined;
  onChange: (id: number) => void;
  load: (search: string, page: number) => Promise<PageResponse<T>>;
  text: (item: T) => string;
  disabled?: boolean;
  required?: boolean;
}) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const query = useCallback(
    () => disabled
      ? Promise.resolve({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as PageResponse<T>)
      : load(search, page),
    [load, search, page, disabled]
  );
  const { data, error, loading } = useResource(query);
  const selected = useRef<T | null>(null);
  const found = data?.items.find(item => item.id === value);

  useEffect(() => { if (found) selected.current = found; }, [found]);

  return (
    <div className="space-y-2">
      <Field label={label}>
        <input
          aria-label={(isVi ? 'Tìm ' : 'Search ') + label}
          disabled={disabled}
          className={inputClass}
          placeholder={isVi ? 'Tìm kiếm để chọn…' : 'Search to select…'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <select
          className={`${inputClass} mt-2`}
          required={required}
          disabled={disabled || loading}
          value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
        >
          <option value="">
            {loading ? (isVi ? 'Đang tải…' : 'Loading…') : (isVi ? 'Chọn ' + label.toLowerCase() : 'Select ' + label)}
          </option>
          {!!value && !found && (
            <option value={value}>
              {selected.current?.id === value ? text(selected.current) : '#' + value}
            </option>
          )}
          {data?.items.map(item => <option key={item.id} value={item.id}>{text(item)}</option>)}
        </select>
      </Field>
      <ErrorNotice message={error} />
      {data && data.totalPages > 1 && <Pagination page={page} total={data.totalElements} onChange={setPage} />}
    </div>
  );
}

/* ─── Form actions ──────────────────────────────────────────────────────── */
export function SaveButtons({ busy, onCancel, label }: { busy: boolean; onCancel: () => void; label?: string }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const defaultLabel = label ?? (isVi ? 'Lưu' : 'Save');

  return (
    <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      <button type="button" disabled={busy} onClick={onCancel} className={secondaryClass}>
        {isVi ? 'Hủy' : 'Cancel'}
      </button>
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy ? (isVi ? 'Đang lưu…' : 'Saving…') : defaultLabel}
      </button>
    </div>
  );
}
