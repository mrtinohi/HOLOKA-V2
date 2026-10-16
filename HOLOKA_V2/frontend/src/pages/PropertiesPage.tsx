import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InventoryList, { type InventoryFilter } from '../components/InventoryList';
import CreatePropertyModal, { propertyTypes } from '../components/CreatePropertyModal';
import { listProperties, deleteProperty } from '../services/propertyService';
import { RecordStatusBadge } from '../components/ui/Badge';
export default function PropertiesPage() {
  const { user } = useAuth(); const ws = user!.workspaces[0];
  const load = useCallback((filter: InventoryFilter) => listProperties(ws.id, { ...filter, status: filter.status || undefined }), [ws.id]);
  return <InventoryList title="Bất động sản" description="Quản lý danh mục tài sản trong workspace." path="/properties" load={load}
    columns={[{ label: 'Tên / Mã', render: p => <div><strong>{p.name}</strong><p className="text-xs text-slate-500">{p.code}</p></div> }, { label: 'Loại', render: p => propertyTypes[p.propertyType] }, { label: 'Địa chỉ', render: p => p.address }, { label: 'Trạng thái', render: p => <RecordStatusBadge status={p.status} /> }]}
    statuses={[{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Ngừng hoạt động' }]} sortFields={[{ value: 'name,asc', label: 'Tên A–Z' }, { value: 'code,asc', label: 'Mã A–Z' }]}
    canCreate={ws.role === 'OWNER'} canDelete={ws.role === 'OWNER'} remove={p => deleteProperty(ws.id, p)}
    form={(initial, onSaved, onCancel) => <CreatePropertyModal initial={initial} onSaved={onSaved} onCancel={onCancel} />} />;
}
