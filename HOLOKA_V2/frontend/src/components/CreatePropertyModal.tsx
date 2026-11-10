import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveProperty, type Property, type PropertyWrite } from '../services/propertyService';
import { errorMessage } from '../services/api';
import { Field, inputClass, ErrorNotice, SaveButtons } from './ui/ResourceControls';

export const propertyTypes = {
  APARTMENT: 'Căn hộ',
  ROOM_RENTAL: 'Nhà trọ',
  SERVICED_APARTMENT: 'Căn hộ dịch vụ',
  HOUSE: 'Nhà ở',
  BUILDING: 'Tòa nhà',
  OTHER: 'Khác',
};

export const propertyTypesEn = {
  APARTMENT: 'Apartment',
  ROOM_RENTAL: 'Room Rental',
  SERVICED_APARTMENT: 'Serviced Apartment',
  HOUSE: 'House',
  BUILDING: 'Building',
  OTHER: 'Other',
};

export default function CreatePropertyModal({
  initial, onSaved, onCancel,
}: {
  initial: Property | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const ws = user!.workspaces[0];

  const typesMap = isVi ? propertyTypes : propertyTypesEn;

  const [form, setForm] = useState<PropertyWrite>(() =>
    initial
      ? {
          name: initial.name,
          code: initial.code,
          address: initial.address,
          description: initial.description || '',
          propertyType: initial.propertyType,
          status: initial.status,
          ownerUserId: initial.ownerUserId,
          version: initial.version,
        }
      : {
          name: '',
          code: '',
          address: '',
          description: '',
          propertyType: 'APARTMENT',
          status: 'ACTIVE',
          ownerUserId: user!.id,
        }
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await saveProperty(ws.id, form, initial?.id);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <Field label={isVi ? 'Tên bất động sản' : 'Property Name'}>
        <input
          autoFocus
          required
          maxLength={160}
          className={inputClass}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label={isVi ? 'Mã bất động sản' : 'Property Code'}>
        <input
          required
          pattern="[A-Za-z0-9_-]{1,40}"
          maxLength={40}
          className={inputClass}
          value={form.code}
          onChange={e => setForm({ ...form, code: e.target.value })}
        />
      </Field>
      <Field label={isVi ? 'Loại' : 'Property Type'}>
        <select
          className={inputClass}
          value={form.propertyType}
          onChange={e => setForm({ ...form, propertyType: e.target.value as Property['propertyType'] })}
        >
          {Object.entries(typesMap).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Field>
      <Field label={isVi ? 'Địa chỉ' : 'Address'}>
        <input
          required
          maxLength={500}
          className={inputClass}
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
        />
      </Field>
      <Field label={isVi ? 'Mô tả' : 'Description'}>
        <textarea
          maxLength={4000}
          className={inputClass}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
      </Field>
      <Field label={isVi ? 'Trạng thái' : 'Status'}>
        <select
          className={inputClass}
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value as Property['status'] })}
        >
          <option value="ACTIVE">{isVi ? 'Hoạt động' : 'Active'}</option>
          <option value="INACTIVE">{isVi ? 'Ngừng hoạt động' : 'Inactive'}</option>
        </select>
      </Field>
      <SaveButtons busy={busy} onCancel={onCancel} />
    </form>
  );
}
