import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Database } from '@/lib/supabase';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  ArrowRight, 
  Lock, 
  History, 
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDisplayDate, formatFullDate } from '@/lib/calendar';
import { motion } from 'motion/react';

type Debt = Database['public']['Tables']['debts']['Row'];
type Payment = Database['public']['Tables']['debt_payments']['Row'];

export default function PublicDebt() {
  const { publicId } = useParams();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  
  const fetchPublicData = async () => {
    if (!publicId) return;
    setLoading(true);
    
    const { data: debtData, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .eq('public_id', publicId)
      .eq('is_public', true)
      .single();

    if (debtError) {
      setLoading(false);
      return;
    }

    if (debtData) {
      setDebt(debtData);
      
      const [paymentsRes, profileRes] = await Promise.all([
        supabase.from('debt_payments').select('*').eq('debt_id', debtData.id).order('payment_date', { ascending: false }),
        supabase.from('profiles').select('full_name').eq('id', debtData.user_id).single()
      ]);

      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (profileRes.data) setOwnerProfile({ full_name: profileRes.data.full_name, email: null });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPublicData();
  }, [publicId]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading public portal...</div>;
  if (!debt) return <div className="h-screen flex items-center justify-center flex-col gap-4 text-zinc-400">
    <AlertCircle size={48} className="opacity-20" />
    <p>This debt progress page is no longer active or private.</p>
  </div>;

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const progressPercent = Math.min(Math.round((totalPaid / debt.amount) * 100), 100);

  const getStatusDisplay = () => {
    if ((debt.status as string) === 'paid') return { label: 'Fully Resolved', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' };
    
    const now = new Date();
    const dueDate = debt.due_date ? new Date(debt.due_date) : null;
    
    if (dueDate && now > dueDate && (debt.status as string) !== 'paid') {
      const diffTime = Math.abs(now.getTime() - dueDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      return { 
        label: `Overdue by ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'}`, 
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/20' 
      };
    }

    if (totalPaid > 0) return { label: 'Partially Resolved', color: 'bg-amber-500/20 text-amber-400 border-amber-500/20' };
    
    return { label: 'Active Obligation', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20' };
  };

  const statusInfo = getStatusDisplay();
  const ownerName = ownerProfile?.full_name || 'Financial Member';

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
            <p className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[11px]">
              Formal reporting for <span className="text-white font-black">{debt.person_name}</span>
            </p>
          </div>
        </div>

        <div className="glass-card rounded-[1.5rem] overflow-hidden shadow-xl border-white/5">
          <div className="h-2 bg-white/5 w-full relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
            />
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-5xl font-black text-white tracking-tighter leading-none mb-1">
                {progressPercent}%
              </h2>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold mb-1">
                 Repayment Progress
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining:</span>
                <span className="text-sm font-black text-white">Rs. {formatCurrency(Math.max(0, debt.amount - totalPaid))}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center p-4 glass bg-white/5 rounded-2xl border-white/5 group">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Total</p>
                <h4 className="text-xl font-bold text-white tracking-tight">Rs. {formatCurrency(debt.amount)}</h4>
              </div>
              <div className="text-center p-4 glass bg-emerald-500/5 rounded-2xl border-emerald-500/10 group">
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Amount Paid</p>
                <h4 className="text-xl font-bold text-emerald-400 tracking-tight">Rs. {formatCurrency(totalPaid)}</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/5 pt-6">
               <div className="flex flex-col gap-1.5 items-center text-center sm:items-start sm:text-left h-full px-2">
                 <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px] leading-none mb-1">Date Taken</span>
                 <span className="font-bold text-white text-sm leading-relaxed">{formatFullDate(new Date(debt.created_at), 'AD')}</span>
               </div>
               <div className="flex flex-col gap-1.5 items-center text-center sm:items-end sm:text-right h-full px-2">
                 <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px] leading-none mb-1">Target Date</span>
                 <span className="font-bold text-white text-sm leading-relaxed">{debt.due_date ? formatFullDate(new Date(`${debt.due_date}T12:00:00`), 'AD') : 'NO TARGET'}</span>
               </div>
            </div>

            {debt.notes && (
              <div className="pt-6 border-t border-white/5">
                <div className="flex flex-col gap-2 p-5 bg-white/[0.02] border border-white/5 rounded-[1.25rem] text-sm text-slate-300 italic text-center leading-relaxed group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FileText size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Record Notes</span>
                  </div>
                  "{debt.notes}"
                </div>
              </div>
            )}


            {/* Status Indicator */}
            <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-3">
               <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px] leading-none">Current Status</span>
               <Badge className={cn(
                 "uppercase tracking-[0.1em] font-black px-6 py-2 text-[11px] border-2 shadow-lg transition-all",
                 statusInfo.color
               )}>{statusInfo.label}</Badge>
            </div>

            {/* Payback Terms Visualizer */}
            {((debt as any).payback_terms === 'emi' || (debt as any).payback_terms === 'installments') ? (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex flex-col gap-2 px-2">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                      {(debt as any).payback_terms === 'emi' ? `${(debt as any).emi_months} Month Payment Plan` : `${(debt as any).installment_count} Step Installment Plan`}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Suggested Payment</span>
                    <span className="text-white font-bold text-lg">
                      {(() => {
                        const totalInstallments = (debt as any).payback_terms === 'emi' ? (debt as any).emi_months : (debt as any).installment_count;
                        const remainingInstallments = Math.max(1, totalInstallments - payments.length);
                        const suggestedAmount = (debt.amount - totalPaid) / remainingInstallments;
                        return `Rs. ${formatCurrency(suggestedAmount)} / period`;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-white/5">
                  {Array.from({ length: (debt as any).payback_terms === 'emi' ? (debt as any).emi_months : (debt as any).installment_count }).map((_, idx) => {
                    const count = (debt as any).payback_terms === 'emi' ? (debt as any).emi_months : (debt as any).installment_count;
                    const perAmount = debt.amount / count;
                    const isPaid = totalPaid >= (perAmount * (idx + 1)) - 1;
                    
                    return (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-all shadow-lg",
                          isPaid 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10" 
                            : "bg-white/5 text-slate-600 border-white/5"
                        )}
                      >
                        {isPaid ? <CheckCircle2 size={16} /> : idx + 1}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (debt as any).payback_terms === 'whenever' ? (
              <div className="pt-4 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center gap-3">
                  <Clock className="text-indigo-400" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 leading-none mb-1">Flexi-Pay</p>
                    <p className="text-xs text-white font-medium">Repayment scheduled "Whenever possible"</p>
                  </div>
                </div>
              </div>
            ) : (debt as any).payback_terms === 'lumpsum' ? (
              <div className="pt-4 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center gap-3">
                  <DollarSign className="text-amber-400" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 leading-none mb-1">Single Repayment</p>
                    <p className="text-xs text-white font-medium">Lumpsum payment required in full</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Payment History */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-white font-bold px-2">
              <History size={16} className="text-indigo-400" />
              <h3 className="uppercase tracking-[0.2em] text-[10px]">Payment Ledger</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {payments.map(payment => (
                <div key={payment.id} className="glass-card p-4 rounded-xl border-white/5 space-y-3 hover:bg-white/[0.05] transition-colors overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                        {formatDisplayDate(new Date(payment.payment_date.includes('T') ? payment.payment_date : `${payment.payment_date}T12:00:00`), 'AD')}
                      </p>
                      <span className="text-lg font-black text-emerald-400 tracking-tight">Rs. {formatCurrency(payment.amount)}</span>
                    </div>
                  </div>
                  
                    {payment.notes && (
                    <div className="p-2 bg-white/[0.02] rounded-lg border-l-2 border-emerald-500/30">
                      <p className="text-[10px] text-slate-400 italic leading-relaxed line-clamp-2">
                        {payment.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {payments.length === 0 && (
              <div className="p-8 text-center glass-card rounded-2xl border-dashed border-white/10">
                <Clock size={24} className="mx-auto text-slate-700 mb-2" />
                <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Awaiting Transaction Log</p>
              </div>
            )}
          </section>
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
