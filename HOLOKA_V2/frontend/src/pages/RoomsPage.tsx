import { useState, useEffect } from 'react';
import { Search, Filter, Plus, DoorOpen, MoreVertical, CalendarClock, User } from 'lucide-react';
import { getRooms, type Room } from '../services/roomService';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hardcoded workspaceId = 1
    getRooms(1).then(data => {
      setRooms(data);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-medium">Available</span>;
      case 'OCCUPIED': return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-medium">Occupied</span>;
      case 'MAINTENANCE': return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-medium">Maintenance</span>;
      default: return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rooms</h1>
          <p className="text-sm text-slate-500 mt-1">Manage individual rooms and track occupancy.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
          <Plus size={18} />
          Add Room
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
            placeholder="Search by room name, code or property..."
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors">
            <Filter size={18} />
            Filters
          </button>
          <select className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors focus:ring-2 focus:ring-primary-500">
             <option>All Status</option>
             <option>Available</option>
             <option>Occupied</option>
             <option>Maintenance</option>
          </select>
        </div>
      </div>

      {/* Grid View for Rooms */}
      {loading ? (
         <div className="py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
            Loading rooms...
         </div>
      ) : rooms.length === 0 ? (
         <div className="py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
            No rooms found.
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map(room => (
               <div key={room.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group flex flex-col">
                  
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                           ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 
                             room.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-600' : 
                             'bg-rose-50 text-rose-600'}
                        `}>
                           <DoorOpen size={20} />
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-800">{room.name}</h3>
                           <p className="text-xs font-mono text-slate-500 mt-0.5">{room.roomCode}</p>
                        </div>
                     </div>
                     <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={18} />
                     </button>
                  </div>

                  <div className="space-y-2 flex-1">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Property:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[120px]" title={room.propertyName}>{room.propertyName}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Rent:</span>
                        <span className="font-bold text-slate-800">{room.monthlyRent.toLocaleString()} ₫</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Status:</span>
                        {getStatusBadge(room.status)}
                     </div>
                  </div>

                  {/* Contract Info Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                     {room.status === 'OCCUPIED' ? (
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-sm text-slate-600">
                              <User size={14} className="text-slate-400" />
                              <span className="truncate">{room.tenantName}</span>
                           </div>
                           <div className="flex items-center gap-2 text-sm text-slate-600">
                              <CalendarClock size={14} className="text-slate-400" />
                              <span className="truncate text-xs">Ends: {room.contractEndDate}</span>
                           </div>
                        </div>
                     ) : room.status === 'AVAILABLE' ? (
                        <div className="text-center">
                           <button className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors py-1">
                              + Create Contract
                           </button>
                        </div>
                     ) : (
                        <div className="text-center text-sm text-slate-500 italic py-1">
                           Under Maintenance
                        </div>
                     )}
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
}
