import { useState, useEffect } from 'react';
import { Building, DoorOpen, Wrench, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { getDashboardOverview, type OverviewData } from '../services/dashboardService';
import StatCard from '../components/ui/StatCard';

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Assuming workspaceId = 1 for now until full auth/workspace selection is built
    getDashboardOverview(1)
      .then(setData)
      .catch(err => {
        console.error(err);
        setError('Failed to load dashboard data. Ensure backend is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 text-rose-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Overview</h1>
            <p className="text-slate-500 mt-1">Here's what's happening with your properties today.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Properties" value={data.totalProperties} icon={Building} />
        <StatCard title="Occupancy Rate" value={`${data.occupancyRate}%`} icon={DoorOpen} trend={2.5} />
        <StatCard title="Monthly Revenue" value={`${data.monthlyRevenue.toLocaleString()} ₫`} icon={CreditCard} trend={12} />
        <StatCard title="Open Maintenance" value={data.openMaintenance} icon={Wrench} className={data.openMaintenance > 0 ? "border-l-4 border-l-rose-500" : ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart Area Placeholder */}
         <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-slate-800">Revenue & Occupancy</h3>
               <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 py-1.5 px-3 rounded-md">
                  <option>Last 6 Months</option>
                  <option>This Year</option>
               </select>
            </div>
            <div className="h-72 bg-slate-50 rounded-lg border border-slate-100 border-dashed flex items-center justify-center">
               <p className="text-slate-400 font-medium">[Chart Placeholder]</p>
            </div>
         </div>

         {/* Today's Action Center connected to real data */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-0 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={20} />
                  Today's Action
               </h3>
               <p className="text-xs text-slate-500 mt-1">HOLOKA AI highlights what needs attention.</p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
               
               {/* URGENT Section */}
               {(data.outstandingPayments > 0 || data.openMaintenance > 0) && (
                 <div>
                    <h4 className="text-xs font-bold uppercase text-rose-500 tracking-wider mb-3">Urgent</h4>
                    <div className="space-y-3">
                       {data.outstandingPayments > 0 && (
                       <div className="flex items-start gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                          <div>
                             <p className="text-sm font-semibold text-slate-700">Outstanding Payments</p>
                             <p className="text-xs text-slate-500 mt-0.5">Total outstanding: {data.outstandingPayments.toLocaleString()} ₫</p>
                          </div>
                       </div>
                       )}
                       {data.openMaintenance > 0 && (
                       <div className="flex items-start gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                          <div>
                             <p className="text-sm font-semibold text-slate-700">{data.openMaintenance} high-priority maintenance</p>
                             <p className="text-xs text-slate-500 mt-0.5">Needs immediate review</p>
                          </div>
                       </div>
                       )}
                    </div>
                 </div>
               )}

               {/* NEEDS ATTENTION Section */}
               {(data.contractsExpiringSoon > 0 || data.pendingTasks > 0) && (
                 <div>
                    <h4 className="text-xs font-bold uppercase text-amber-500 tracking-wider mb-3">Needs Attention</h4>
                    <div className="space-y-3">
                       {data.contractsExpiringSoon > 0 && (
                       <div className="flex items-start gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                          <div>
                             <p className="text-sm font-semibold text-slate-700">{data.contractsExpiringSoon} contracts expiring soon</p>
                             <p className="text-xs text-slate-500 mt-0.5">Within next 30 days</p>
                          </div>
                       </div>
                       )}
                       {data.pendingTasks > 0 && (
                       <div className="flex items-start gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                          <div>
                             <p className="text-sm font-semibold text-slate-700">{data.pendingTasks} pending tasks</p>
                             <p className="text-xs text-slate-500 mt-0.5">Incomplete tasks in workspace</p>
                          </div>
                       </div>
                       )}
                    </div>
                 </div>
               )}

               {data.outstandingPayments === 0 && data.openMaintenance === 0 && data.contractsExpiringSoon === 0 && data.pendingTasks === 0 && (
                 <div className="text-sm text-slate-500 text-center py-8">
                   No urgent actions needed today.
                 </div>
               )}

            </div>
         </div>
      </div>
    </div>
  );
}
