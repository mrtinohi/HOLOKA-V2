import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import InventoryList, { type InventoryFilter } from '../components/InventoryList';
import { listBuildings, saveBuilding, deleteBuilding, type Building, type BuildingWrite } from '../services/buildingService';
import { listProperties } from '../services/propertyService';
import { errorMessage } from '../services/api';
import { RecordStatusBadge } from '../components/ui/Badge';
import { AsyncSelect, Field, inputClass, ErrorNotice, SaveButtons } from '../components/ui/ResourceControls';

function BuildingForm({ initial, done, cancel }: { initial: Building | null; done: () => void; cancel: () => void }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const ws = user!.workspaces[0].id;

  const [form, setForm] = useState<BuildingWrite>(() =>
    initial
      ? {
          propertyId: initial.propertyId,
          name: initial.name,
          code: initial.code,
          numberOfFloors: initial.numberOfFloors,
          description: initial.description || '',
          status: initial.status,
          version: initial.version,
        }
      : {
          propertyId: 0,
          name: '',
          code: '',
          numberOfFloors: 1,
          description: '',
          status: 'ACTIVE',
        }
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const properties = useCallback(
    (search: string, page: number) => listProperties(ws, { search, page, status: 'ACTIVE' }),
    [ws]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await saveBuilding(ws, form, initial?.id);
      done();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <AsyncSelect
        label={isVi ? 'Bất động sản' : 'Property'}
        value={form.propertyId}
        disabled={!!initial}
        onChange={propertyId => setForm({ ...form, propertyId })}
        load={properties}
        text={p => p.name + ' · ' + p.code}
      />
      <Field label={isVi ? 'Tên tòa nhà' : 'Building Name'}>
        <input
          required
          maxLength={160}
          className={inputClass}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label={isVi ? 'Mã tòa nhà' : 'Building Code'}>
        <input
          required
          pattern="[A-Za-z0-9_-]{1,40}"
          className={inputClass}
          value={form.code}
          onChange={e => setForm({ ...form, code: e.target.value })}
        />
      </Field>
      <Field label={isVi ? 'Số tầng' : 'Number of Floors'}>
        <input
          required
          type="number"
          min={1}
          max={300}
          className={inputClass}
          value={form.numberOfFloors}
          onChange={e => setForm({ ...form, numberOfFloors: Number(e.target.value) })}
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
          onChange={e => setForm({ ...form, status: e.target.value as Building['status'] })}
        >
          <option value="ACTIVE">{isVi ? 'Hoạt động' : 'Active'}</option>
          <option value="INACTIVE">{isVi ? 'Ngừng hoạt động' : 'Inactive'}</option>
        </select>
      </Field>
      <SaveButtons busy={busy} onCancel={cancel} />
    </form>
  );
}

export default function BuildingsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const ws = user!.workspaces[0].id;

  const load = useCallback(
    (filter: InventoryFilter) => listBuildings(ws, { ...filter, status: filter.status || undefined }),
    [ws]
  );

  return (
    <InventoryList
      title={isVi ? 'Tòa nhà' : 'Buildings'}
      description={isVi ? 'Mỗi tòa nhà thuộc một bất động sản; phòng được quản lý theo tòa nhà.' : 'Each building belongs to a property; rooms are organized under buildings.'}
      path="/buildings"
      load={load}
      columns={[
        {
          label: isVi ? 'Tên' : 'Name',
          render: b => <strong>{b.name}</strong>,
        },
        {
          label: isVi ? 'Mã' : 'Code',
          render: b => b.code,
        },
        {
          label: isVi ? 'Số tầng' : 'Floors',
          render: b => b.numberOfFloors,
        },
        {
          label: isVi ? 'Trạng thái' : 'Status',
          render: b => <RecordStatusBadge status={b.status} />,
        },
      ]}
      statuses={[
        { value: 'ACTIVE',   label: isVi ? 'Hoạt động' : 'Active' },
        { value: 'INACTIVE', label: isVi ? 'Ngừng hoạt động' : 'Inactive' },
      ]}
      sortFields={[
        { value: 'name,asc', label: isVi ? 'Tên A–Z' : 'Name A–Z' },
      ]}
      remove={b => deleteBuilding(ws, b)}
      form={(initial, done, cancel) => (
        <BuildingForm initial={initial} done={done} cancel={cancel} />
      )}
    />
  );
}
