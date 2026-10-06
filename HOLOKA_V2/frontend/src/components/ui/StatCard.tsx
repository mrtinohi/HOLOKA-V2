export interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: number;
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, className = "" }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-slate-50 text-slate-500`}>
          <Icon size={24} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 text-sm font-medium">
           <span className={trend > 0 ? "text-emerald-500" : "text-rose-500"}>
              {trend > 0 ? '+' : ''}{trend}%
           </span>
           <span className="text-slate-400 ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}
