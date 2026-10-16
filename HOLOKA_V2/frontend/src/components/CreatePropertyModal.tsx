import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveProperty, type Property, type PropertyWrite } from '../services/propertyService';
import { errorMessage } from '../services/api';
import { Field, inputClass, ErrorNotice, SaveButtons } from './ui/ResourceControls';
export const propertyTypes = { APARTMENT: 'Căn hộ', ROOM_RENTAL: 'Nhà trọ', SERVICED_APARTMENT: 'Căn hộ dịch vụ', HOUSE: 'Nhà ở', BUILDING: 'Tòa nhà', OTHER: 'Khác' };
export default function CreatePropertyModal({ initial, onSaved, onCancel }: { initial: Property | null; onSaved: () => void; onCancel: () => void }) {
  const { user } = useAuth(); const ws = user!.workspaces[0];
  const [form, setForm] = useState<PropertyWrite>(() => initial ? { name: initial.name, code: initial.code, address: initial.address, description: initial.description || '', propertyType: initial.propertyType, status: initial.status, ownerUserId: initial.ownerUserId, version: initial.version } : { name: '', code: '', address: '', description: '', propertyType: 'APARTMENT', status: 'ACTIVE', ownerUserId: user!.id });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await saveProperty(ws.id, form, initial?.id); onSaved(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-4"><ErrorNotice message={error} />
    <Field label="Tên bất động sản"><input autoFocus required maxLength={160} className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
    <Field label="Mã bất động sản"><input required pattern="[A-Za-z0-9_-]{1,40}" maxLength={40} className={inputClass} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
    <Field label="Loại"><select className={inputClass} value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value as Property['propertyType'] })}>{Object.entries(propertyTypes).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
    <Field label="Địa chỉ"><input required maxLength={500} className={inputClass} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field>
    <Field label="Mô tả"><textarea maxLength={4000} className={inputClass} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
    <Field label="Trạng thái"><select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Property['status'] })}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select></Field>
    <SaveButtons busy={busy} onCancel={onCancel} /></form>;
}
