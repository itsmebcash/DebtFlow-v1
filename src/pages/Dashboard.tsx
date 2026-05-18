import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Clock, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CloudOff,
  RefreshCw,
  LogIn
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { formatDisplayDate } from '@/lib/calendar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency } from '@/lib/utils';

type Debt = Database['public']['Tables']['debts']['Row'];
type Recurring = Database['public']['Tables']['recurring_payments']['Row'];

export default function Dashboard() {
  const { user, profile, isGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [upcomingObligations, setUpcomingObligations] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalBorrowed: 0,
    totalLent: 0,
    totalRecurring: 0,
    overdueCount: 0,
    pendingPayments: 0,
    paidCount: 0,
    totalTasks: 0,
    progressPercentage: 0,
    totalIncome: 0,
    totalExpenses: 0
  });

  useEffect(() => {
    if (!user && !isGuest) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [debtsRes, recurringRes, paymentsRes, historyRes, incomeRes, expenseRes] = await Promise.all([
          storage.getDebts(user?.id || null, isGuest),
          storage.getRecurring(user?.id || null, isGuest),
          storage.getAllDebtPayments(user?.id || null, isGuest),
          storage.getAllRecurringHistory(user?.id || null, isGuest),
          storage.getIncomes(user?.id || null, isGuest),
          storage.getExpenses(user?.id || null, isGuest)
        ]);

        const debtsData = debtsRes.data || [];
        const recurringData = recurringRes.data || [];
        const paymentsData = paymentsRes.data || [];
        const historyData = historyRes.data || [];
        const incomeData = incomeRes.data || [];
        const expenseData = expenseRes.data || [];
        
        setDebts(debtsData);
        setRecurring(recurringData);
        setIncomes(incomeData);
        setExpenses(expenseData);

        // Pre-create maps for O(1) lookups
        const debtMap = new Map(debtsData.map(d => [d.id, d]));
        const recurringMap = new Map(recurringData.map(r => [r.id, r]));
        
        // Group debt payments by debt_id for faster summary calculation
        const paymentTotals = new Map<string, number>();
        paymentsData.forEach(p => {
          const current = paymentTotals.get(p.debt_id) || 0;
          paymentTotals.set(p.debt_id, current + (Number(p.amount) || 0));
        });

        // Process Recent Transactions (combine debt payments and recurring history)
        // Optimization: only take top 5 from each first then sort
        const topPayments = paymentsData.slice(0, 5).map(p => {
          const debt = debtMap.get(p.debt_id);
          const isBorrowed = debt?.contact_info === 'borrowed' || (!debt?.contact_info && debt?.category === 'borrowed');
          return {
            id: p.id,
            title: debt?.person_name || 'Debt Payment',
            desc: isBorrowed ? 'Payment to Lender' : 'Payment received from Debtor',
            amount: p.amount,
            date: p.payment_date,
            type: isBorrowed ? 'out' : 'in',
            category: 'Debt'
          };
        });

        const topHistory = historyData.filter(h => h.status === 'paid').slice(0, 5).map(h => {
          const rec = recurringMap.get(h.recurring_id);
          return {
            id: h.id,
            title: rec?.title || 'Recurring Bill',
            desc: `Payment for ${h.month}/${h.year}`,
            amount: rec?.amount || 0,
            date: h.payment_date || h.created_at,
            type: 'out',
            category: 'Recurring'
          };
        });

        const topIncomes = incomeData.slice(0, 5).map(i => ({
          id: i.id,
          title: i.title,
          desc: i.category,
          amount: i.amount,
          date: i.date || i.created_at,
          type: 'in',
          category: 'Income'
        }));

        const topExpenses = expenseData.slice(0, 5).map(e => ({
          id: e.id,
          title: e.title,
          desc: e.category || 'General',
          amount: e.amount,
          date: e.date || e.created_at,
          type: 'out',
          category: 'Expense'
        }));

        const combinedTransactions = [
          ...topPayments,
          ...topHistory,
          ...topIncomes,
          ...topExpenses
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

        setRecentPayments(combinedTransactions);

        // Process Upcoming Obligations
        const now = new Date();
        const fifteenDaysFromNow = new Date();
        fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
        fifteenDaysFromNow.setHours(23, 59, 59, 999);

        const activeRecurring = recurringData.filter(r => r.is_active !== false);
        
        // Process current month recurring paid status
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Paid check for recurring
        // Paid check for recurring
        const paidHistorySet = new Set();
        historyData.forEach(h => {
          if (h.status === 'paid') {
            const recId = typeof h.recurring_id === 'object' ? h.recurring_id.id : h.recurring_id;
            paidHistorySet.add(`${recId}-${h.month}-${h.year}`);
          }
        });

        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const upcomingDebts = debtsData
          .filter(d => 
            d.status !== 'paid' && 
            (d as any).payback_terms !== 'whenever' &&
            d.due_date && 
            new Date(d.due_date) <= fifteenDaysFromNow &&
            new Date(d.due_date) >= startOfPrevMonth
          )
          .map(d => ({
            id: d.id,
            type: 'debt',
            title: d.person_name,
            amount: d.amount,
            date: d.due_date,
            status: new Date(d.due_date) < now ? 'overdue' : d.status === 'pending' ? 'pending' : d.status,
            category: d.category
          }));

        const upcomingRecurring: any[] = [];
        
        // Check past month for overdue and current + next 15 days for upcoming
        const checkMonths: { m: number, y: number }[] = [];
        
        // 1. Previous month
        checkMonths.push({ m: startOfPrevMonth.getMonth() + 1, y: startOfPrevMonth.getFullYear() });
        
        // 2. Current month
        checkMonths.push({ m: now.getMonth() + 1, y: now.getFullYear() });
        
        // 3. Next month (only if fifteenDaysFromNow overlaps it)
        if (fifteenDaysFromNow.getMonth() !== now.getMonth()) {
          checkMonths.push({ m: fifteenDaysFromNow.getMonth() + 1, y: fifteenDaysFromNow.getFullYear() });
        }
        
        activeRecurring.forEach(r => {
          checkMonths.forEach(({ m, y }) => {
            const key = `${r.id}-${m}-${y}`;
            if (!paidHistorySet.has(key)) {
              const lastDay = new Date(y, m, 0).getDate();
              const day = Math.min(r.due_day || 1, lastDay);
              const dueDate = new Date(y, m - 1, day, 12, 0, 0);
              
              const isOverdue = dueDate < now;
              const isWithin15Days = dueDate >= now && dueDate <= fifteenDaysFromNow;

              if (isOverdue || isWithin15Days) {
                upcomingRecurring.push({
                  id: `${r.id}-${m}-${y}`,
                  type: 'recurring',
                  title: r.title,
                  amount: r.amount,
                  date: dueDate.toISOString(),
                  status: isOverdue ? 'overdue' : 'pending',
                  category: 'Recurring'
                });
              }
            }
          });
        });

        const combinedObligations = [
          ...upcomingDebts,
          ...upcomingRecurring
        ].sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        setUpcomingObligations(combinedObligations.slice(0, 10));

        // Calculate summary using optimized totals Map
        let borrowed = 0;
        let lent = 0;
        let overdue = 0;
        let recurringTotal = 0;
        let totalIncome = 0;
        let totalExpenses = 0;

        incomeData.forEach(i => {
          if (i.status === 'received' || i.status === 'pending') {
            totalIncome += Number(i.amount) || 0;
          }
        });

        expenseData.forEach(e => {
          totalExpenses += Number(e.amount) || 0;
        });

        debtsData.forEach((d: Debt) => {
          const totalPaid = paymentTotals.get(d.id) || 0;
          const remaining = Math.max(0, (Number(d.amount) || 0) - totalPaid);

          const isBorrowed = d.contact_info === 'borrowed' || (!d.contact_info && d.category === 'borrowed');

          if (isBorrowed) {
            borrowed += remaining;
          } else {
            lent += remaining;
          }
          
          if (d.status === 'overdue') overdue++;
        });

        activeRecurring.forEach((r: Recurring) => {
          recurringTotal += Number(r.amount) || 0;
        });

        const nowMonth = now.getMonth() + 1;
        const nowYear = now.getFullYear();
        const paidRecurringCount = activeRecurring.filter(r => 
          paidHistorySet.has(`${r.id}-${nowMonth}-${nowYear}`)
        ).length;

        // Goal Progress Calculation
        const totalItemsCount = debtsData.length + activeRecurring.length;
        const paidItemsCount = debtsData.filter(d => d.status === 'paid').length + paidRecurringCount; 
        const progress = totalItemsCount > 0 ? (paidItemsCount / totalItemsCount) * 100 : 0;

        const totalRemainingItems = debtsData.filter(d => d.status !== 'paid').length + upcomingRecurring.length;

        setSummary({
          totalBorrowed: borrowed,
          totalLent: lent,
          totalRecurring: recurringTotal,
          overdueCount: overdue,
          pendingPayments: totalRemainingItems,
          paidCount: paidItemsCount,
          totalTasks: totalItemsCount,
          progressPercentage: Math.round(progress),
          totalIncome,
          totalExpenses
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isGuest]);

  const chartData = [
    { name: 'Income', value: summary.totalIncome, color: '#10b981' }, // emerald-500
    { name: 'Expenses', value: summary.totalExpenses, color: '#f43f5e' }, // rose-500
    { name: 'Debt Owed', value: summary.totalBorrowed, color: '#f97316' }, // orange-500
    { name: 'Recurring', value: summary.totalRecurring, color: '#6366f1' } // indigo-500
  ];

  const netBalance = summary.totalIncome - (summary.totalExpenses + summary.totalBorrowed + summary.totalRecurring);
  const healthStatus = netBalance > 0 ? 'Healthy' : netBalance > -1000 ? 'Warning' : 'Critical';

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const calendarPref = profile?.calendar_preference || 'AD';

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          Dashboard
          {isGuest && (
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 gap-1.5 px-3 py-1 text-xs">
              <CloudOff size={12} />
              Offline Mode
            </Badge>
          )}
        </h1>
        <p className="text-slate-400 flex flex-wrap items-center gap-2">
          <span>Welcome, <span className="text-indigo-400 font-semibold">{profile?.full_name || (isGuest ? 'Guest User' : (user?.email?.split('@')[0] || 'User'))}</span>.</span>
          {isGuest ? (
            <span className="flex items-center gap-2">
              <span>Your data is stored locally.</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/login')}
                className="h-7 px-2 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg gap-1.5"
              >
                <LogIn size={12} />
                Login to Sync
              </Button>
            </span>
          ) : (
            <span>Debt & Monthly Payment Manager.</span>
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: `Rs. ${formatCurrency(summary.totalIncome)}`, icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Expenses', value: `Rs. ${formatCurrency(summary.totalExpenses)}`, icon: ArrowDownLeft, color: 'text-rose-400', bg: 'bg-rose-400/10' },
          { label: 'Debt Balance', value: `Rs. ${formatCurrency(summary.totalBorrowed)}`, icon: CreditCard, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          { label: 'Financial Health', value: healthStatus, icon: TrendingUp, color: healthStatus === 'Healthy' ? 'text-emerald-400' : 'text-rose-400', bg: healthStatus === 'Healthy' ? 'bg-emerald-400/10' : 'bg-rose-400/10' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="glass p-6 rounded-[1.5rem] flex flex-col gap-1 transition-transform hover:scale-[1.02] cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-colors group-hover:bg-white/10`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold mt-1 ${stat.color} break-all line-clamp-2`}>{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card rounded-[1.5rem] overflow-hidden flex flex-col p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Financial Breakdown</h3>
            <p className="text-xs text-slate-500">Visual comparison of your financial standing</p>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => `Rs. ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Progress */}
        <div className="glass-card rounded-[1.5rem] p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Goal Progress</h3>
            <p className="text-xs text-slate-500">Payment status for current month</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 58}
                  strokeDashoffset={2 * Math.PI * 58 * (1 - summary.progressPercentage / 100)}
                  className="text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{summary.progressPercentage}%</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Paid</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-sm font-medium text-slate-300">Paid Items</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">{summary.paidCount} Items</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-sm font-medium text-slate-400">Remaining</span>
                </div>
                <span className="text-sm font-bold text-slate-300">{summary.totalTasks - summary.paidCount} Items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="glass-card rounded-[1.5rem] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Upcoming Obligations</h3>
              <p className="text-xs text-slate-500">Critical payments in next 15 days</p>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Calendar size={18} />
            </div>
          </div>
          
          <div className="space-y-2">
            {upcomingObligations.map(item => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {item.type === 'recurring' ? (
                      <RefreshCw size={16} className="text-indigo-400" />
                    ) : (
                      <Clock size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-white truncate">{item.title}</h4>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1.5 mt-0.5">
                      <span className={item.type === 'recurring' ? 'text-indigo-400' : 'text-slate-400'}>
                        {item.type === 'recurring' ? 'Recurring' : 'Debt'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span>{item.date ? formatDisplayDate(new Date(item.date.includes('T') ? item.date : `${item.date}T12:00:00`), calendarPref) : 'Pending'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-black text-white leading-none">Rs. {formatCurrency(item.amount)}</p>
                  <div className="mt-1 flex justify-end">
                    <span className={cn(
                      "text-[8px] px-2 py-0.5 rounded-lg uppercase font-black tracking-widest border",
                      item.status === 'overdue' 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {upcomingObligations.length === 0 && (
              <div className="text-center py-10 glass-card rounded-2xl border-dashed border-white/10">
                <CheckCircle2 className="mx-auto mb-3 text-emerald-500/20" size={32} />
                <p className="text-xs text-slate-500 italic">No upcoming payments detected.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[1.5rem] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-500">History of your latest activities</p>
            </div>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          
          <div className="space-y-2">
             {recentPayments.map((activity, i) => (
               <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all group">
                 <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${activity.type === 'in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {activity.type === 'in' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-white truncate">{activity.title}</h4>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black truncate mt-0.5 flex items-center gap-1.5">
                        <span className={activity.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}>{activity.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="line-clamp-1">{activity.desc}</span>
                      </p>
                    </div>
                 </div>
                 <div className="text-right shrink-0">
                   <p className={cn("text-[14px] font-black", activity.type === 'in' ? "text-emerald-400" : "text-white")}>
                     {activity.type === 'in' ? '+' : '-'} Rs. {formatCurrency(activity.amount)}
                   </p>
                   <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                     {formatDisplayDate(new Date(activity.date.includes('T') ? activity.date : `${activity.date}T12:00:00`), calendarPref)}
                   </p>
                 </div>
               </div>
             ))}
             {recentPayments.length === 0 && (
              <div className="text-center py-10 glass-card rounded-2xl border-dashed border-white/10">
                <Clock className="mx-auto mb-3 text-slate-500/20" size={32} />
                <p className="text-xs text-slate-500 italic">No recent transactions found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
