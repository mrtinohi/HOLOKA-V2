import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2, DoorOpen, Wrench, CreditCard,
  TrendingUp, TrendingDown, AlertTriangle,
  Clock, FileWarning, Users, Sparkles,
  ArrowUpRight, Activity, Plus, ShieldCheck
} from 'lucide-react';
import { getDashboardOverview, type OverviewData } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

/* ────────── Stat Card ────────── */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  trend?: number;
  sub?: string;
  delay?: number;
  to?: string;
}

function StatCard({ title, value, icon: Icon, gradient, trend, sub, delay = 0, to }: StatCardProps) {
  const content = (
    <div
      className="card card-glow fade-in p-5 flex flex-col justify-between h-full group text-left"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300"
          style={{ background: gradient }}
        >
          <Icon size={22} color="white" strokeWidth={2.2} />
        </div>

        {trend !== undefined ? (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              trend >= 0
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                : 'text-rose-700 bg-rose-50 border border-rose-200'
            }`}
          >
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        ) : (
          to && (
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
              <ArrowUpRight size={15} />
            </div>
          )
        )}
      </div>

      <div className="mt-4">
        <p className="text-3xl font-black text-slate-900 font-display tracking-tight leading-none">
          {value}
        </p>
        {sub && <p className="text-xs mt-1.5 font-medium text-slate-500">{sub}</p>}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {title}
        </p>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors" />
      </div>
    </div>
  );

  return to ? (
    <NavLink to={to} className="block h-full focus:outline-none">
      {content}
    </NavLink>
  ) : (
    content
  );
}

/* ────────── Action Item ────────── */
interface ActionItemProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  sub: string;
  tag: string;
  tagColor: string;
  tagBg: string;
}

function ActionItem({ icon: Icon, iconColor, iconBg, title, sub, tag, tagColor, tagBg }: ActionItemProps) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-200/60 cursor-pointer group text-left">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: iconBg }}
      >
        <Icon size={17} color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
      <span
        className="badge flex-shrink-0 border"
        style={{ background: tagBg, color: tagColor, borderColor: `${tagColor}30` }}
      >
        {tag}
      </span>
    </div>
  );
}

/* ────────── Skeleton ────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-72 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton h-44 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}

/* ────────── Dashboard Page ────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const workspaceId = user?.workspaces?.[0]?.id ?? 1;

  useEffect(() => {
    getDashboardOverview(workspaceId)
      .then(setData)
      .catch(err => {
        console.error(err);
        setError('Error connecting to backend server on port 8081.');
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center gap-4 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
        <AlertTriangle size={24} className="text-rose-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-base">Error loading dashboard</p>
          <p className="text-sm text-rose-600 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('dash.greeting_morning');
    if (h < 18) return t('dash.greeting_afternoon');
    return t('dash.greeting_evening');
  })();

  const allGood =
    data.outstandingPayments === 0 &&
    data.openMaintenance === 0 &&
    data.contractsExpiringSoon === 0 &&
    data.pendingTasks === 0;

  return (
    <div className="space-y-6">
      {/* ─── Hero Banner Header ─── */}
      <div className="fade-in flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200">
              <Sparkles size={12} className="text-indigo-500" />
              {t('dash.smart_workspace')}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('dash.online_sync')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
            {greeting},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              {user?.fullName || 'Quản Trị Viên'}
            </span>{' '}
            👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('dash.workspace_sub')}{' '}
            <strong className="text-slate-700 font-bold">{user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
            <Activity size={14} className="text-indigo-500" />
            <span>
              {new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>

          <NavLink
            to="/properties"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{t('dash.add_property')}</span>
          </NavLink>
        </div>
      </div>

      {/* ─── 4 Primary Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t('dash.stat_properties')}
          value={data.totalProperties}
          icon={Building2}
          gradient="linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
          sub={`${data.totalBuildings} ${t('dash.buildings_suffix')} • ${data.totalRooms} ${t('dash.rooms_suffix')}`}
          delay={0.0}
          to="/properties"
        />
        <StatCard
          title={t('dash.stat_occupancy')}
          value={`${data.occupancyRate}%`}
          icon={DoorOpen}
          gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
          trend={2.5}
          sub={`${data.occupiedRooms} / ${data.totalRooms} ${t('dash.occupied_suffix')}`}
          delay={0.05}
          to="/rooms"
        />
        <StatCard
          title={t('dash.stat_revenue')}
          value={data.monthlyRevenue > 0 ? `${(data.monthlyRevenue / 1_000_000).toFixed(1)}M ₫` : '0 ₫'}
          icon={CreditCard}
          gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
          trend={data.monthlyRevenue > 0 ? 12 : undefined}
          sub={`${data.activeContracts} ${t('dash.contracts_suffix')}`}
          delay={0.1}
          to="/finance"
        />
        <StatCard
          title={t('dash.stat_maintenance')}
          value={data.openMaintenance}
          icon={Wrench}
          gradient={
            data.openMaintenance > 0
              ? 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'
              : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
          }
          sub={data.openMaintenance > 0 ? t('dash.maintenance_urgent') : t('dash.maintenance_ok')}
          delay={0.15}
          to="/maintenance"
        />
      </div>

      {/* ─── Middle Section: Mini KPI Grid & Action Center ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Operational Metrics Matrix */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: t('dash.available_rooms'),
              value: data.availableRooms,
              color: '#059669',
              bg: 'rgba(16, 185, 129, 0.08)',
              border: '#34d399',
              desc: t('dash.available_desc'),
            },
            {
              label: t('dash.maintenance_rooms'),
              value: data.maintenanceRooms,
              color: '#d97706',
              bg: 'rgba(245, 158, 11, 0.08)',
              border: '#fbbf24',
              desc: t('dash.maintenance_desc'),
            },
            {
              label: t('dash.unpaid_invoices'),
              value:
                data.outstandingPayments > 0
                  ? `${(data.outstandingPayments / 1_000_000).toFixed(1)}M ₫`
                  : '0 ₫',
              color: '#e11d48',
              bg: 'rgba(244, 63, 94, 0.08)',
              border: '#f87171',
              desc: t('dash.unpaid_desc'),
            },
            {
              label: t('dash.expiring_contracts'),
              value: data.contractsExpiringSoon,
              color: '#d97706',
              bg: 'rgba(245, 158, 11, 0.08)',
              border: '#fbbf24',
              desc: t('dash.expiring_desc'),
            },
            {
              label: t('dash.staff_tasks'),
              value: data.pendingTasks,
              color: '#4f46e5',
              bg: 'rgba(99, 102, 241, 0.08)',
              border: '#818cf8',
              desc: t('dash.tasks_desc'),
            },
            {
              label: t('dash.operating_costs'),
              value:
                data.monthlyExpense > 0
                  ? `${(data.monthlyExpense / 1_000_000).toFixed(1)}M ₫`
                  : '0 ₫',
              color: '#475569',
              bg: 'rgba(100, 116, 139, 0.08)',
              border: '#cbd5e1',
              desc: t('dash.costs_desc'),
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className="card p-5 fade-in flex flex-col justify-between hover:shadow-lg transition-all duration-300 text-left"
              style={{ animationDelay: `${0.2 + i * 0.04}s` }}
            >
              <div>
                <p
                  className="text-2xl font-black font-display tracking-tight"
                  style={{ color: item.color }}
                >
                  {item.value}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">{item.label}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Right: Smart Alert & Action Center */}
        <div
          className="card fade-in overflow-hidden flex flex-col"
          style={{ animationDelay: '0.25s' }}
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">{t('dash.attention_title')}</h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              AI Smart Alert
            </span>
          </div>

          <div className="flex-1 p-3.5 space-y-1.5 overflow-y-auto max-h-[360px]">
            {allGood ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shadow-sm mb-3">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{t('dash.all_good_title')}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {t('dash.all_good_desc')}
                </p>
              </div>
            ) : (
              <>
                {data.outstandingPayments > 0 && (
                  <ActionItem
                    icon={CreditCard}
                    iconColor="#e11d48"
                    iconBg="rgba(244, 63, 94, 0.12)"
                    title="Hóa đơn chưa thanh toán"
                    sub={`Tổng nợ: ${data.outstandingPayments.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ₫`}
                    tag={language === 'vi' ? 'KHẨN CẤP' : 'URGENT'}
                    tagColor="#e11d48"
                    tagBg="rgba(244, 63, 94, 0.1)"
                  />
                )}
                {data.openMaintenance > 0 && (
                  <ActionItem
                    icon={Wrench}
                    iconColor="#e11d48"
                    iconBg="rgba(244, 63, 94, 0.12)"
                    title={`${data.openMaintenance} sự cố bảo trì chờ xử lý`}
                    sub="Cần điều phối nhân viên kỹ thuật"
                    tag={language === 'vi' ? 'ƯU TIÊN' : 'HIGH'}
                    tagColor="#e11d48"
                    tagBg="rgba(244, 63, 94, 0.1)"
                  />
                )}
                {data.contractsExpiringSoon > 0 && (
                  <ActionItem
                    icon={FileWarning}
                    iconColor="#d97706"
                    iconBg="rgba(245, 158, 11, 0.12)"
                    title={`${data.contractsExpiringSoon} hợp đồng sắp hết hạn`}
                    sub="Đến hạn trong 30 ngày tiếp theo"
                    tag={language === 'vi' ? 'CẢNH BÁO' : 'WARNING'}
                    tagColor="#d97706"
                    tagBg="rgba(245, 158, 11, 0.1)"
                  />
                )}
                {data.pendingTasks > 0 && (
                  <ActionItem
                    icon={Clock}
                    iconColor="#4f46e5"
                    iconBg="rgba(99, 102, 241, 0.12)"
                    title={`${data.pendingTasks} công việc nhân viên chưa xong`}
                    sub="Đang phân công trong workspace"
                    tag={language === 'vi' ? 'THEO DÕI' : 'PENDING'}
                    tagColor="#4f46e5"
                    tagBg="rgba(99, 102, 241, 0.1)"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Workspace Status Footer Bar ─── */}
      <div
        className="card p-4 sm:p-5 fade-in flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-white via-indigo-50/20 to-white text-left"
        style={{ animationDelay: '0.3s' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              {t('layout.workspace')}:{' '}
              <span className="text-indigo-600 font-black">
                {user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              {t('dash.workspace_footer_desc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span><strong>{data.totalRooms}</strong> {t('dash.rooms_suffix')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span><strong>{data.activeContracts}</strong> {t('dash.contracts_suffix')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span><strong>{data.availableRooms}</strong> {t('dash.available_rooms')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
