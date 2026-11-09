import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Plus, DoorOpen, User, CalendarClock, ArrowRight, CheckCircle2, AlertCircle, Wrench, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRooms, type Room } from '../services/roomService';
import { getProperties } from '../services/propertyService';

export default function RoomsPage() {
  const { user } = useAuth();
  const wsId = user?.workspaces?.[0]?.id ?? 1;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'>('ALL');

  useEffect(() => {
    Promise.all([
      getRooms(wsId),
      getProperties(wsId).catch(() => [])
    ]).then(([roomData, propData]) => {
      const propMap = new Map(propData.map(p => [p.id, p.name]));
      const enriched = roomData.map(r => ({
        ...r,
        propertyName: r.propertyName || propMap.get(r.propertyId) || `Khu nhà #${r.propertyId}`,
      }));
      setRooms(enriched);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [wsId]);

  const filteredRooms = rooms.filter(room => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.roomCode && room.roomCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room.propertyName && room.propertyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room.tenantName && room.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || room.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const countAvailable = rooms.filter(r => r.status === 'AVAILABLE').length;
  const countOccupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const countMaintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans pb-16 text-left">
      
      {/* ─── Tiêu đề trang & Nút thêm phòng ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Danh sách phòng trọ
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Tổng cộng {rooms.length} phòng ({countOccupied} có khách, {countAvailable} đang trống, {countMaintenance} bảo trì)
          </p>
        </div>

        <button
          type="button"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm phòng mới</span>
        </button>
      </div>

      {/* ─── Thanh Lọc & Tìm Kiếm Tối Giản ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Bộ lọc trạng thái kiểu Tab chuyên nghiệp */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OCCUPIED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'OCCUPIED'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Đang ở ({countOccupied})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'AVAILABLE'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Đang trống ({countAvailable})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('MAINTENANCE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'MAINTENANCE'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Bảo trì ({countMaintenance})
          </button>
        </div>

        {/* Hộp Tìm Kiếm Gọn Gàng */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên phòng, người thuê, tòa nhà..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* ─── Lưới Thẻ Phòng Sạch Sẽ, Hiện Đại ─── */}
      {loading ? (
        <div className="py-16 text-center text-sm font-medium text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Đang tải danh sách phòng...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
          <p className="text-base font-bold text-slate-800 dark:text-white">Không tìm thấy phòng nào</p>
          <p className="text-xs text-slate-500">Vui lòng thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map(room => {
            const isOccupied = room.status === 'OCCUPIED';
            const isAvailable = room.status === 'AVAILABLE';

            return (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700/60 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Header thẻ phòng */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {room.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building size={12} />
                        <span className="truncate max-w-[150px]">{room.propertyName || 'Khu chính'}</span>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        isOccupied
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isAvailable
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {isOccupied ? 'Có khách' : isAvailable ? 'Trống' : 'Bảo trì'}
                    </span>
                  </div>

                  {/* Giá thuê */}
                  <div className="my-3 py-2 border-y border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Giá thuê:</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {room.monthlyRent ? room.monthlyRent.toLocaleString('vi-VN') : '0'} đ<span className="text-xs font-normal text-slate-400">/tháng</span>
                    </span>
                  </div>

                  {/* Thông tin người thuê */}
                  {isOccupied ? (
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User size={13} className="text-slate-400" />
                        <span className="truncate">{room.tenantName || 'Khách thuê'}</span>
                      </div>
                      {room.contractEndDate && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <CalendarClock size={12} />
                          <span>Hết hạn: {room.contractEndDate}</span>
                        </div>
                      )}
                    </div>
                  ) : isAvailable ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Phòng đang sẵn sàng bàn giao
                    </p>
                  ) : (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      Đang xử lý sửa chữa
                    </p>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isAvailable ? (
                    <NavLink
                      to="/contracts"
                      className="w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold text-center block transition-colors"
                    >
                      + Lập hợp đồng
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/contracts"
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold text-center block transition-colors"
                    >
                      Xem chi tiết
                    </NavLink>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

