import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Plus, User, CalendarClock, Building, DoorOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getRooms, type Room } from '../services/roomService';
import { getProperties } from '../services/propertyService';
import EmptyState from '../components/ui/EmptyState';

type RoomFilter = 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

const money = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function RoomsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user?.workspaces?.[0]?.id ?? 1;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoomFilter>('ALL');

  const statusStyle: Record<Room['status'], { label: string; cls: string }> = {
    OCCUPIED:    { label: isVi ? 'Có khách' : 'Occupied',    cls: 'badge-success' },
    AVAILABLE:   { label: isVi ? 'Trống' : 'Vacant',        cls: 'badge-warning' },
    MAINTENANCE: { label: isVi ? 'Bảo trì' : 'Maintenance', cls: 'badge-danger' },
    INACTIVE:    { label: isVi ? 'Ngừng' : 'Inactive',      cls: 'badge-neutral' },
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([getRooms(wsId), getProperties(wsId).catch(() => [])])
      .then(([roomData, propData]) => {
        if (!active) return;
        const propMap = new Map(propData.map(p => [p.id, p.name]));
        setRooms(roomData.map(r => ({
          ...r,
          propertyName: r.propertyName || propMap.get(r.propertyId) || (isVi ? `Khu #${r.propertyId}` : `Property #${r.propertyId}`),
        })));
      })
      .catch(() => { if (active) setError(isVi ? 'Không tải được danh sách phòng.' : 'Failed to load rooms list.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [wsId, isVi]);

  const count = (status: Room['status']) => rooms.filter(r => r.status === status).length;

  const filteredRooms = rooms.filter(room => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q
      || room.name.toLowerCase().includes(q)
      || room.roomCode?.toLowerCase().includes(q)
      || room.propertyName?.toLowerCase().includes(q)
      || room.tenantName?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tabs: { key: RoomFilter; label: string; count: number }[] = [
    { key: 'ALL',         label: isVi ? 'Tất cả' : 'All',          count: rooms.length },
    { key: 'OCCUPIED',    label: isVi ? 'Đang ở' : 'Occupied',     count: count('OCCUPIED') },
    { key: 'AVAILABLE',   label: isVi ? 'Đang trống' : 'Vacant',   count: count('AVAILABLE') },
    { key: 'MAINTENANCE', label: isVi ? 'Bảo trì' : 'Maintenance', count: count('MAINTENANCE') },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Phòng & căn hộ' : 'Rooms & Units'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {rooms.length} {isVi ? 'phòng' : 'units'} · {count('OCCUPIED')} {isVi ? 'có khách' : 'occupied'} · {count('AVAILABLE')} {isVi ? 'trống' : 'vacant'} · {count('MAINTENANCE')} {isVi ? 'bảo trì' : 'maintenance'}
          </p>
        </div>
        <button type="button" className="btn btn-primary">
          <Plus size={16} />
          {isVi ? 'Thêm phòng' : 'Add Room'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="inline-flex items-center p-1 rounded-xl overflow-x-auto"
          style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
          role="tablist"
          aria-label={isVi ? 'Lọc theo trạng thái' : 'Filter by status'}
        >
          {tabs.map(tab => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                style={active
                  ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: 'var(--shadow-sm)' }
                  : { color: 'var(--text-muted)' }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isVi ? 'Tìm theo tên phòng, khách thuê, tòa nhà…' : 'Search by room, tenant, building…'}
            className="input pl-9"
            aria-label={isVi ? 'Tìm phòng' : 'Search rooms'}
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl px-3.5 py-2.5 text-sm"
          style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={DoorOpen}
            title={isVi ? 'Không tìm thấy phòng nào' : 'No rooms found'}
            description={isVi ? 'Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.' : 'Try changing your search terms or selecting another filter.'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredRooms.map((room, i) => {
            const status = statusStyle[room.status] ?? statusStyle.INACTIVE;
            return (
              <article
                key={room.id}
                className="card card-interactive p-4 flex flex-col gap-3 stagger"
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {room.name}
                    </h2>
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Building size={11} className="flex-shrink-0" />
                      <span className="truncate">{room.propertyName}</span>
                    </p>
                  </div>
                  <span className={`badge ${status.cls} flex-shrink-0`}>{status.label}</span>
                </div>

                <div
                  className="flex items-baseline justify-between py-2.5"
                  style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{isVi ? 'Giá thuê' : 'Rent'}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {room.monthlyRent ? money(room.monthlyRent) : '0'} ₫
                    <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{isVi ? '/tháng' : '/mo'}</span>
                  </span>
                </div>

                <div className="min-h-[38px] text-xs space-y-1">
                  {room.status === 'OCCUPIED' ? (
                    <>
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <User size={12} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        <span className="truncate">{room.tenantName || (isVi ? 'Khách thuê' : 'Tenant')}</span>
                      </div>
                      {room.contractEndDate && (
                        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          <CalendarClock size={12} className="flex-shrink-0" />
                          <span>{isVi ? 'Hết hạn: ' : 'Expires: '}{room.contractEndDate}</span>
                        </div>
                      )}
                    </>
                  ) : room.status === 'AVAILABLE' ? (
                    <p style={{ color: 'var(--warning)' }}>{isVi ? 'Sẵn sàng bàn giao' : 'Ready for occupancy'}</p>
                  ) : (
                    <p style={{ color: 'var(--danger)' }}>{isVi ? 'Đang xử lý sửa chữa' : 'Under maintenance'}</p>
                  )}
                </div>

                <NavLink
                  to="/contracts"
                  className={`${room.status === 'AVAILABLE' ? 'btn btn-primary' : 'btn btn-secondary'} w-full`}
                >
                  {room.status === 'AVAILABLE' ? (isVi ? 'Lập hợp đồng' : 'Create Lease') : (isVi ? 'Xem chi tiết' : 'View Details')}
                </NavLink>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
