import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CalendarDays,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Globe
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDisplayDate, getBsMonthName, adToBs, CalendarType } from '@/lib/calendar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import RecurringForm from '@/components/recurring/RecurringForm';
import { cn, formatCurrency } from '@/lib/utils';

type Recurring = Database['public']['Tables']['recurring_payments']['Row'];
type History = Database['public']['Tables']['recurring_history']['Row'];

export default function Recurring() {
  const { user, profile, isGuest } = useAuth();
  const [items, setItems] = useState<Recurring[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [allHistory, setAllHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [calendarPreference, setCalendarPreference] = useState<CalendarType>('BS');
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementRange, setStatementRange] = useState<3 | 6 | 12>(3);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<Recurring | null>(null);
  const [paymentIncomeSourceId, setPaymentIncomeSourceId] = useState<string>('none');
  const [incomes, setIncomes] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<Recurring | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const fetchData = async () => {
    if (!user && !isGuest) return;
    setLoading(true);
    
    const [itemsRes, incomesRes] = await Promise.all([
      storage.getRecurring(user?.id || null, isGuest),
      storage.getIncomes(user?.id || null, isGuest)
    ]);
    
    const itemsData = itemsRes.data;
    if (itemsData) {
      setItems(itemsData);
      const recurringIds = itemsData.map(i => i.id);
      const { data: historyData } = await storage.getRecurringHistory(recurringIds, isGuest);
      if (historyData) {
        setAllHistory(historyData);
        setHistory(historyData.filter(h => h.month === selectedMonth && h.year === selectedYear));
      }
    }

    if (incomesRes.data) {
      setIncomes(incomesRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, isGuest, selectedMonth, selectedYear]);

  useEffect(() => {
    if (profile?.calendar_preference) {
      setCalendarPreference(profile.calendar_preference as CalendarType);
    }
  }, [profile]);

  const handleMarkAsPaid = async () => {
    if (!paymentItem) return;
    
    // Validate balance
    const amountToPay = Number(paymentItem.amount);
    if (paymentIncomeSourceId !== 'none') {
      const source = incomes.find(i => i.id === paymentIncomeSourceId);
      if (source && (Number(source.amount) || 0) < amountToPay) {
        toast.error(`Not enough balance in "${source.title}". Available: Rs. ${formatCurrency(source.amount)}`);
        return;
      }
    }

    const existing = history.find(h => h.recurring_id === paymentItem.id);
    
    const payload = existing ? {
      ...existing,
      status: 'paid' as const,
      amount_paid: amountToPay,
      income_source_id: paymentIncomeSourceId === 'none' ? null : paymentIncomeSourceId
    } : {
      recurring_id: paymentItem.id,
      month: selectedMonth,
      year: selectedYear,
      status: 'paid' as const,
      amount_paid: amountToPay,
      income_source_id: paymentIncomeSourceId === 'none' ? null : paymentIncomeSourceId
    };

    const { error } = await storage.upsertRecurringHistory(payload, isGuest);
    
    if (error) toast.error('Action failed');
    else toast.success('Marked as Paid');

    setIsPaymentDialogOpen(false);
    setPaymentItem(null);
    setPaymentIncomeSourceId('none');
    fetchData();
  };

  const togglePaymentStatus = async (recurring: Recurring) => {
    const existing = history.find(h => h.recurring_id === recurring.id);
    
    if (existing && existing.status === 'paid') {
      // Quickly unmark if already paid
      const { error } = await storage.upsertRecurringHistory({
        ...existing,
        status: 'pending', 
        amount_paid: 0,
        income_source_id: null
      }, isGuest);
      
      if (error) toast.error('Update failed');
      else {
        toast.success(`Marked as pending`);
        fetchData();
      }
    } else {
      // Opening dialog to select income source when marking as paid
      setPaymentItem(recurring);
      setIsPaymentDialogOpen(true);
    }
  };

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1).toLocaleString('default', { month: 'long' });
  };

  const changeMonth = (offset: number) => {
    let nextMonth = selectedMonth + offset;
    let nextYear = selectedYear;
    
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear--;
    }
    
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  const getDueDate = (item: Recurring, month: number, year: number) => {
    const date = new Date(year, month - 1, item.due_day, 12, 0, 0);
    if (date.getMonth() !== month - 1) {
      return new Date(year, month, 0, 12, 0, 0);
    }
    return date;
  };

  const getNextDueDate = (item: Recurring) => {
    let nextMonth = selectedMonth + 1;
    let nextYear = selectedYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    return getDueDate(item, nextMonth, nextYear);
  };

  const toggleCalendar = async () => {
    const newPref = calendarPreference === 'AD' ? 'BS' : 'AD';
    setCalendarPreference(newPref);
    
    if (user && !isGuest) {
      try {
        await supabase
          .from('profiles')
          .update({ calendar_preference: newPref })
          .eq('id', user.id);
      } catch (err) {
        console.error('Failed to update preference:', err);
      }
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    const { error } = await storage.deleteRecurring(itemToDelete, isGuest);
    if (error) {
      toast.error('Failed to delete obligation');
    } else {
      toast.success('Obligation deleted');
      setItemToDelete(null);
      setIsDeleteConfirmOpen(false);
      fetchData();
    }
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const getStatementPeriod = (range: number) => {
    const periods = [];
    let m = selectedMonth;
    let y = selectedYear;

    for (let i = 0; i < range; i++) {
      periods.push({ month: m, year: y });
      m--;
      if (m < 1) {
        m = 12;
        y--;
      }
    }
    return periods.reverse();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Monthly Tracker</h1>
          <p className="text-slate-400">Track and manage your repeating monthly obligations.</p>
        </div>
        <Button onClick={() => { setSelectedItem(undefined); setIsFormDialogOpen(true); }} className="h-12 px-6 shadow-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-xl font-bold shrink-0">
          <Plus size={18} className="mr-2" />
          Add Payment
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between glass p-2 rounded-[1.5rem] shadow-xl relative">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-white hover:bg-white/5 h-12 w-12 rounded-xl">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {calendarPreference === 'BS' 
              ? `${getBsMonthName(new Date(selectedYear, selectedMonth - 1, 1))} ${adToBs(new Date(selectedYear, selectedMonth - 1, 1)).split('-')[0]}`
              : `${getMonthName(selectedMonth)} ${selectedYear}`
            }
          </h2>
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.2em] whitespace-nowrap">Monthly Billing Period</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleCalendar}
            className="hidden sm:flex h-12 px-3 text-[10px] font-black tracking-widest text-indigo-400 hover:text-white hover:bg-white/5 rounded-xl gap-2 border border-white/5"
          >
            <Globe size={14} />
            {calendarPreference}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="text-slate-400 hover:text-white hover:bg-white/5 h-12 w-12 rounded-xl">
            <ChevronRight size={24} />
          </Button>
        </div>
        
        {/* Mobile Toggle */}
        <button 
          onClick={toggleCalendar}
          className="sm:hidden absolute -top-3 -right-2 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-[8px] font-black italic">{calendarPreference}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Monthly Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-[1.5rem] p-6 border-white/10 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CalendarDays size={64} className="text-white" />
            </div>
            <div className="mb-2 relative z-10">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Total Monthly</p>
            </div>
            <h3 className="text-3xl font-bold text-white relative z-10">Rs. {formatCurrency(items.reduce((acc, curr) => acc + Number(curr.amount), 0))}</h3>
            <div className="mt-2 flex flex-col gap-2 relative z-10">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-none">Across {items.length} active bills</p>
              <button 
                onClick={() => setIsStatementOpen(true)}
                className="text-[10px] font-bold text-indigo-300 hover:text-white hover:underline transition-all flex items-center gap-1 group/btn w-fit"
              >
                <FileCheck size={12} className="group-hover/btn:scale-110 transition-transform" />
                View Statement
              </button>
            </div>
          </div>

          {(() => {
            const paidCount = history.filter(h => h.status === 'paid').length;
            const pendingCount = items.length - paidCount;
            const paidAmount = history.filter(h => h.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount_paid), 0);
            const remainingAmount = items.filter(item => !allHistory.find(h => h.recurring_id === item.id && h.month === selectedMonth && h.year === selectedYear && h.status === 'paid'))
              .reduce((acc, curr) => acc + Number(curr.amount), 0);

            return (
              <div className="glass-card rounded-[1.5rem] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paid Items</span>
                  <span className="text-xs font-bold text-emerald-400">{paidCount} Bills</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Items</span>
                  <span className="text-xs font-bold text-amber-400">{pendingCount} Bills</span>
                </div>
                
                <div className="pt-4 border-t border-white/5 grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Paid This Month</span>
                    <span className="text-xl font-bold text-emerald-400">
                      Rs. {formatCurrency(paidAmount)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Remaining</span>
                    <span className="text-xl font-bold text-amber-400">
                      Rs. {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Column: List of items for current month */}
        <div className="lg:col-span-3 space-y-4">
          <div className="space-y-4">
            {items.map((item, idx) => {
              const h = history.find(h => h.recurring_id === item.id);
              const isPaid = h?.status === 'paid';
              const isExpanded = expandedItems.includes(item.id);
              
              return (
                <div key={item.id} className={cn(
                  "glass-card rounded-[1.5rem] overflow-hidden transition-all duration-300",
                  isPaid && !isExpanded ? "opacity-60" : "opacity-100"
                )}>
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedItems(prev => prev.filter(id => id !== item.id));
                      } else {
                        setExpandedItems(prev => [...prev, item.id]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <h4 className="text-[12px] font-bold text-white leading-tight truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{item.category}</span>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            isPaid ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest",
                            isPaid ? "text-emerald-400" : "text-amber-400"
                          )}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cn(
                          "font-bold text-white leading-none transition-all",
                          isExpanded ? "text-base sm:text-lg" : "text-sm sm:text-base"
                        )}>
                          Rs. {formatCurrency(item.amount)}
                        </p>
                        <p className={cn(
                          "text-[9px] font-bold mt-1 uppercase tracking-wider",
                          isExpanded ? "text-slate-500" : "text-indigo-400"
                        )}>
                          {isExpanded 
                            ? `Due: ${formatDisplayDate(getDueDate(item, selectedMonth, selectedYear), calendarPreference)}` 
                            : calendarPreference === 'BS'
                              ? `${getBsMonthName(new Date(selectedYear, selectedMonth - 1, 1)).substring(0, 3)} ${adToBs(new Date(selectedYear, selectedMonth - 1, 1)).split('-')[0]}`
                              : `${getMonthName(selectedMonth).substring(0, 3)} ${selectedYear}`}
                        </p>
                      </div>
                      <div className="text-slate-500 transition-colors p-1 group-hover:text-white">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-none">Payment Status</span>
                            <div className="flex items-center gap-3">
                              <Badge className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase border",
                                isPaid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              )}>
                                {isPaid ? 'Payment Confirmed' : 'Payment Required'}
                              </Badge>
                              {!isPaid && (
                                <div className="flex items-center gap-1.5 text-amber-500 text-[9px] font-bold uppercase">
                                  <AlertCircle size={10} />
                                  Overdue?
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-none">Expected Amount</span>
                            <p className="text-xl font-bold text-white">Rs. {formatCurrency(item.amount)}</p>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end gap-3">
                          <div className="flex gap-2">
                            <Button 
                              className={cn(
                                "flex-1 h-12 rounded-xl font-bold transition-all",
                                isPaid 
                                  ? "bg-slate-800 text-slate-400 hover:bg-slate-700" 
                                  : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/10"
                              )}
                              onClick={() => togglePaymentStatus(item)}
                            >
                              <CheckCircle2 size={18} className="mr-2" />
                              {isPaid ? 'Unmark Payment' : 'Mark as Paid'}
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "icon" }),
                                  "h-12 w-12 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl border border-white/5"
                                )}
                              >
                                <MoreVertical size={18} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card border-white/10 text-white">
                                <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsFormDialogOpen(true); }}>
                                  Edit Setup
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => confirmDelete(item.id)} className="text-rose-400">
                                  Delete Obligation
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <p className="text-center text-[9px] text-slate-500 font-medium">
                            {isPaid 
                              ? (
                                <span className="flex flex-col gap-0.5">
                                  <span>Paid on {new Date(h.payment_date || h.created_at).toLocaleDateString()}</span>
                                  <span className="text-indigo-400 font-bold uppercase">Next Due: {formatDisplayDate(getNextDueDate(item), calendarPreference)}</span>
                                </span>
                              ) 
                              : `Schedule for due day ${item.due_day} of each month.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {items.length === 0 && (
              <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-4 glass-card rounded-[1.5rem] border-dashed border-white/10">
                 <CalendarDays size={64} className="opacity-10" />
                 <div className="space-y-1">
                   <p className="text-base font-bold text-white">No obligations trackable yet.</p>
                   <p className="text-sm">Start by adding your first monthly recurring bill.</p>
                 </div>
                 <Button onClick={() => setIsFormDialogOpen(true)} className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30 font-bold rounded-xl h-12 px-8">
                   Add Monthly Bill
                 </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="max-w-4xl glass-card border-white/10 text-white overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Billing Statement</DialogTitle>
            <DialogDescription className="text-slate-400">
              Overview of your payment status across recent months.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Select Period:</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[3, 6, 12].map((range) => (
                <div 
                  key={range} 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setStatementRange(range as 3 | 6 | 12)}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                    statementRange === range 
                      ? "bg-indigo-600 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                      : "border-white/20 bg-white/5 group-hover:border-white/40"
                  )}>
                    {statementRange === range && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
                    statementRange === range ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                  )}>
                    Last {range} Months
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-y-auto space-y-4 pr-2">
            {items.map((item) => {
              const periods = getStatementPeriod(statementRange);
              const paidInPeriod = periods.filter(p => 
                allHistory.find(h => h.recurring_id === item.id && h.month === p.month && h.year === p.year && h.status === 'paid')
              ).length;

              return (
                <div key={item.id} className="glass-card p-4 rounded-xl border border-white/10 group">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white leading-tight">{item.title}</span>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-1">Rs. {formatCurrency(item.amount)}</span>
                    </div>
                    <Badge className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase",
                      paidInPeriod === statementRange ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-white/5"
                    )}>
                      {paidInPeriod}/{statementRange} Months Paid
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {periods.map((p, i) => {
                      const h = allHistory.find(h => h.recurring_id === item.id && h.month === p.month && h.year === p.year);
                      const isPaid = h?.status === 'paid';
                      const isFuture = p.year > new Date().getFullYear() || (p.year === new Date().getFullYear() && p.month > new Date().getMonth() + 1);
                      
                      const monthLabel = calendarPreference === 'BS' 
                        ? getBsMonthName(new Date(p.year, p.month - 1, 1)).substring(0, 3)
                        : getMonthName(p.month).substring(0, 3);
                      
                      const yearLabel = calendarPreference === 'BS' 
                        ? adToBs(new Date(p.year, p.month - 1, 1)).split('-')[0]
                        : p.year;

                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                            isFuture 
                              ? "bg-slate-900/50 border-white/5 opacity-40" 
                              : isPaid 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          )}
                        >
                          <span className="text-[8px] font-bold uppercase tracking-wider mb-1 opacity-60">
                            {monthLabel} {yearLabel}
                          </span>
                          {isPaid ? (
                            <CheckCircle2 size={14} />
                          ) : isFuture ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          ) : (
                            <Clock size={14} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest p-4 glass rounded-xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-2.5 h-2.5 rounded shadow-[0_0_8px_rgba(52,211,153,0.3)] bg-emerald-400" />
                Paid
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <div className="w-2.5 h-2.5 rounded shadow-[0_0_8px_rgba(251,191,36,0.3)] bg-amber-400" />
                Pending
              </div>
              <div className="flex items-center gap-1.5 opacity-50">
                <div className="w-2.5 h-2.5 rounded bg-slate-800" />
                Future
              </div>
            </div>
            <span>Summary: {statementRange} Months Range</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirm Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Confirming payment for <span className="text-indigo-400 font-bold">{paymentItem?.title}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Select Income Source</Label>
              <Select value={paymentIncomeSourceId} onValueChange={setPaymentIncomeSourceId}>
                <SelectTrigger className="bg-slate-800/50 border-white/10 h-11">
                  <SelectValue placeholder="Select income source">
                    {paymentIncomeSourceId !== 'none' 
                      ? incomes.find(i => i.id === paymentIncomeSourceId)?.title 
                      : 'None / Other'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="glass border-white/10 text-white">
                  <SelectItem value="none">None / Other</SelectItem>
                  {incomes.filter(i => i.status === 'received').map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.title} (Rs. {formatCurrency(i.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleMarkAsPaid} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold px-6">
                Mark Paid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Monthly Obligation</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure your repeating payment details.
            </DialogDescription>
          </DialogHeader>
          <RecurringForm 
            recurring={selectedItem}
            onCancel={() => setIsFormDialogOpen(false)}
            onSuccess={() => {
              setIsFormDialogOpen(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Obligation</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this monthly obligation? This will also remove the tracking history for it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-500 rounded-xl font-bold">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
