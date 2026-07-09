import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Database } from '@/lib/supabase';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  History, 
  CheckCircle2,
  AlertCircle,
  Clock,
  CalendarDays,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate, formatFullDate, getBsMonthName } from '@/lib/calendar';
import { motion } from 'motion/react';

type Recurring = Database['public']['Tables']['recurring_payments']['Row'];
type History = Database['public']['Tables']['recurring_history']['Row'];

export default function PublicRecurring() {
  const { publicId } = useParams();
  const [recurring, setRecurring] = useState<Recurring | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  
  const fetchPublicData = async () => {
    if (!publicId) return;
    setLoading(true);
    
    const { data: recurringData, error: recurringError } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('public_id', publicId)
      .eq('is_public', true)
      .single();

    if (recurringError) {
      setLoading(false);
      return;
    }

    if (recurringData) {
      setRecurring(recurringData);
      
      const [historyRes, profileRes] = await Promise.all([
        supabase.from('recurring_history').select('*').eq('recurring_id', recurringData.id).order('year', { ascending: false }).order('month', { ascending: false }),
        supabase.from('profiles').select('full_name').eq('id', recurringData.user_id).single()
      ]);

      if (historyRes.data) setHistory(historyRes.data);
      if (profileRes.data) setOwnerProfile({ full_name: profileRes.data.full_name, email: null });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPublicData();
  }, [publicId]);

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1).toLocaleString('default', { month: 'long' });
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return freq;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading public statement...</div>;
  if (!recurring) return <div className="h-screen flex items-center justify-center flex-col gap-4 text-zinc-400">
    <AlertCircle size={48} className="opacity-20" />
    <p>This payment statement is no longer available or private.</p>
  </div>;

  const totalPaid = history.filter(h => h.status === 'paid').reduce((acc, h) => acc + Number(h.amount_paid), 0);
  const paidMonths = history.filter(h => h.status === 'paid').length;
  const ownerName = ownerProfile?.full_name || 'Financial Member';

  const dueDateString = `Day ${recurring.due_day} of each month`;

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      <div className="mesh-bg" />
      
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl">
               <img src="/icon-192.png" alt="DebtFlow" className="w-full h-full object-cover" />
            </div>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/10 uppercase tracking-[0.2em] px-3 py-0.5 text-[9px]">Debt & Monthly Payment Manager</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">DebtFlow</h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
              Shared by <span className="text-indigo-400 border-b border-indigo-500/30 pb-0.5">{ownerName}</span>
            </p>
            <div className="flex items-center gap-2">
              <TrendingDown size={14} className="text-rose-400" />
              <p className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[11px]">
                Payment Statement for <span className="text-white font-black">{recurring.title}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Overview Card */}
        <div className="glass-card rounded-[1.5rem] overflow-hidden shadow-xl border-white/5">
          <div className="h-2 bg-white/5 w-full relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${history.length > 0 ? Math.min(100, (paidMonths / Math.max(1, history.length)) * 100) : 0}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
            />
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Receipt size={20} className="text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{recurring.category}</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">
                Rs. {formatCurrency(recurring.amount)}
              </h2>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold mb-1">
                {getFrequencyLabel(recurring.frequency)} Obligation
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <CalendarDays size={12} className="text-indigo-400" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {recurring.frequency === 'monthly' ? dueDateString : `Due every ${recurring.frequency}`}
                </span>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center p-4 glass bg-white/5 rounded-2xl border-white/5 group">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly Amount</p>
                <h4 className="text-lg font-bold text-white tracking-tight">Rs. {formatCurrency(recurring.amount)}</h4>
              </div>
              <div className="text-center p-4 glass bg-emerald-500/5 rounded-2xl border-emerald-500/10 group">
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Paid</p>
                <h4 className="text-lg font-bold text-emerald-400 tracking-tight">Rs. {formatCurrency(totalPaid)}</h4>
              </div>
              <div className="text-center p-4 glass bg-indigo-500/5 rounded-2xl border-indigo-500/10 group">
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Months Paid</p>
                <h4 className="text-lg font-bold text-indigo-400 tracking-tight">{paidMonths}/{history.length}</h4>
              </div>
            </div>

            {/* Payment History Timeline */}
            {history.length > 0 && (
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <History size={16} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Payment Timeline</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {history.map((h, idx) => {
                    const isPaid = h.status === 'paid';
                    const monthLabel = getMonthName(h.month).substring(0, 3);
                    
                    return (
                      <motion.div
                        key={`${h.recurring_id}-${h.year}-${h.month}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                          isPaid 
                            ? "bg-emerald-500/10 border-emerald-500/20" 
                            : "bg-amber-500/5 border-amber-500/10"
                        )}
                      >
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider mb-1",
                          isPaid ? "text-emerald-400" : "text-amber-400"
                        )}>
                          {monthLabel} {h.year}
                        </span>
                        {isPaid ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <CheckCircle2 size={18} className="text-emerald-400" />
                            <span className="text-[8px] font-bold text-emerald-500/80">
                              Rs. {formatCurrency(h.amount_paid)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <Clock size={18} className="text-amber-400" />
                            <span className="text-[7px] font-bold text-amber-500/60 uppercase tracking-wider">
                              {h.status === 'overdue' ? 'Overdue' : 'Pending'}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {history.length === 0 && (
              <div className="pt-4 border-t border-white/5">
                <div className="p-8 text-center glass rounded-2xl border-dashed border-white/10">
                  <Clock size={24} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Awaiting First Payment Record</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest p-4 glass-card rounded-xl border-white/5">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <div className="w-2.5 h-2.5 rounded shadow-[0_0_8px_rgba(52,211,153,0.3)] bg-emerald-400" />
            Paid
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <div className="w-2.5 h-2.5 rounded shadow-[0_0_8px_rgba(251,191,36,0.3)] bg-amber-400" />
            Pending
          </div>
        </div>

        <footer className="text-center py-10 border-t border-white/5 mt-6">
           <div className="flex items-center justify-center gap-2 text-white font-black text-lg mb-1 italic">
             <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
               <img src="/icon-192.png" alt="DebtFlow" className="w-full h-full object-cover" />
             </div>
             <span>DEBTFLOW</span>
           </div>
           <p className="text-[8px] text-slate-700 font-bold uppercase tracking-[0.4em]">Debt & Monthly Payment Manager</p>
        </footer>
      </div>
    </div>
  );
}
