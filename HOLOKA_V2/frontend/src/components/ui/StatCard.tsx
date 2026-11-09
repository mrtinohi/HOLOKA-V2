export interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: number;
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, className = "" }: StatCardProps) {
  return (
    <div className={`bg-white dark:bg-[#111827] rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200 flex flex-col ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2 tracking-tight">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50">
          <Icon size={24} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 text-sm font-medium flex items-center">
           <span className={trend > 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
              {trend > 0 ? '+' : ''}{trend}%
           </span>
           <span className="text-slate-400 dark:text-slate-500 ml-2">so với tháng trước</span>
        </div>
      )}
    </div>
  );
}
