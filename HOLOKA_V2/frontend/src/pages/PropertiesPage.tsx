import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import InventoryList, { type InventoryFilter } from '../components/InventoryList';
import CreatePropertyModal, { propertyTypes, propertyTypesEn } from '../components/CreatePropertyModal';
import { listProperties, deleteProperty } from '../services/propertyService';
import { RecordStatusBadge } from '../components/ui/Badge';

export default function PropertiesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const ws = user!.workspaces[0];

  const typesMap = isVi ? propertyTypes : propertyTypesEn;

  const load = useCallback(
    (filter: InventoryFilter) => listProperties(ws.id, { ...filter, status: filter.status || undefined }),
    [ws.id]
  );

  return (
    <InventoryList
      title={isVi ? 'Bất động sản' : 'Properties'}
      description={isVi ? 'Quản lý danh mục tài sản trong workspace.' : 'Manage real estate properties within this workspace.'}
      path="/properties"
      load={load}
      columns={[
        {
          label: isVi ? 'Tên / Mã' : 'Name / Code',
          render: p => (
            <div>
              <strong>{p.name}</strong>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.code}</p>
            </div>
          ),
        },
        {
          label: isVi ? 'Loại' : 'Type',
          render: p => typesMap[p.propertyType] || p.propertyType,
        },
        {
          label: isVi ? 'Địa chỉ' : 'Address',
          render: p => p.address,
        },
        {
          label: isVi ? 'Trạng thái' : 'Status',
          render: p => <RecordStatusBadge status={p.status} />,
        },
      ]}
      statuses={[
        { value: 'ACTIVE',   label: isVi ? 'Hoạt động' : 'Active' },
        { value: 'INACTIVE', label: isVi ? 'Ngừng hoạt động' : 'Inactive' },
      ]}
      sortFields={[
        { value: 'name,asc', label: isVi ? 'Tên A–Z' : 'Name A–Z' },
        { value: 'code,asc', label: isVi ? 'Mã A–Z' : 'Code A–Z' },
      ]}
      canCreate={ws.role === 'OWNER'}
      canDelete={ws.role === 'OWNER'}
      remove={p => deleteProperty(ws.id, p)}
      form={(initial, onSaved, onCancel) => (
        <CreatePropertyModal initial={initial} onSaved={onSaved} onCancel={onCancel} />
      )}
    />
  );
}
