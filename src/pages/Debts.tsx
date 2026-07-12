import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Share2, 
  FileText,
  DollarSign,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
  Clock
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDisplayDate, formatFullDate } from '@/lib/calendar';
import DebtForm from '@/components/debt/DebtForm';
import { toast } from 'sonner';

type Debt = Database['public']['Tables']['debts']['Row'];

export default function Debts() {
  const { user, profile, isGuest } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPersonDeleteConfirmOpen, setIsPersonDeleteConfirmOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>(undefined);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [expandedDebts, setExpandedDebts] = useState<string[]>([]);
  const [paymentDebtId, setPaymentDebtId] = useState<string>('');
  const [paymentIncomeSourceId, setPaymentIncomeSourceId] = useState<string>('none');
  const [incomes, setIncomes] = useState<any[]>([]);

  const fetchDebts = async () => {
    if (!user && !isGuest) return;
    setLoading(true);
    const [debtsRes, incomesRes] = await Promise.all([
      storage.getDebts(user?.id || null, isGuest),
      storage.getIncomes(user?.id || null, isGuest)
    ]);
    
    const debtsData = debtsRes.data;
    if (debtsData) {
      setDebts(debtsData);
      setIncomes(incomesRes.data || []);
      
      // Fetch payments for all debts
      const allPayments: any[] = [];
      for (const debt of debtsData) {
        const { data: pData } = await storage.getDebtPayments(debt.id, isGuest);
        if (pData) allPayments.push(...pData);
      }
      setPayments(allPayments);
    }

    if (incomesRes.data) {
      setIncomes(incomesRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDebts();
  }, [user, isGuest]);

  const handleDelete = async () => {
    if (!debtToDelete) return;
    
    const { error } = await storage.deleteDebt(debtToDelete, isGuest);
    if (error) {
      toast.error('Failed to delete debt');
    } else {
      toast.success('Debt deleted');
      setDebtToDelete(null);
      setIsDeleteConfirmOpen(false);
      fetchDebts();
    }
  };

  const confirmDelete = (id: string) => {
    setDebtToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeletePerson = async () => {
    if (!personToDelete) return;
    
    // Get all debts for this person
    const personDebts = debts.filter(d => d.person_name === personToDelete);
    const deletePromises = personDebts.map(d => storage.deleteDebt(d.id, isGuest));
    
    await Promise.all(deletePromises);
    toast.success(`All records for ${personToDelete} deleted`);
    setPersonToDelete(null);
    setIsPersonDeleteConfirmOpen(false);
    fetchDebts();
  };

  const confirmDeletePerson = (name: string) => {
    setPersonToDelete(name);
    setIsPersonDeleteConfirmOpen(true);
  };

  const handleShare = async (debt: Debt) => {
    if (isGuest) {
      toast.error('Please Login to share');
      return;
    }
    const { data: updatedDebt, error } = await storage.updateDebt(debt.id, { is_public: true }, isGuest);

    if (error) {
      toast.error('Failed to share');
    } else {
      const publicId = updatedDebt?.public_id || debt.public_id;
      if (!publicId) {
        toast.error('No public ID available for this debt');
        return;
      }
      const shareUrl = `${window.location.origin}/shared/${publicId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Public URL copied to clipboard');
      fetchDebts();
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebtId || !paymentAmount || !user && !isGuest) return;
    
    setIsRecordingPayment(true);
    const amount = parseFloat(paymentAmount);
    
    try {
      // Validate balance if income source is selected
      if (paymentIncomeSourceId !== 'none') {
        const source = incomes.find(i => i.id === paymentIncomeSourceId);
        if (source && (Number(source.amount) || 0) < amount) {
          toast.error(`Not enough balance in "${source.title}". Available: Rs. ${formatCurrency(source.amount)}`);
          setIsRecordingPayment(false);
          return;
        }
      }

      // Validate amount against remaining balance
      const targetDebt = debts.find(d => d.id === paymentDebtId);
      if (targetDebt) {
        const { remaining } = getDebtProgress(targetDebt.id, Number(targetDebt.amount));
        if (amount > remaining) {
          toast.error(`Amount exceeds remaining balance (Rs. ${formatCurrency(remaining)})`);
          setIsRecordingPayment(false);
          return;
        }
      }

      const { error } = await storage.addDebtPayment({
        debt_id: paymentDebtId,
        amount: amount,
        payment_date: new Date().toISOString(),
        notes: paymentNotes,
        income_source_id: paymentIncomeSourceId === 'none' ? null : paymentIncomeSourceId
      }, isGuest);

      if (error) {
        toast.error('Failed to record payment');
      } else {
        toast.success('Payment recorded');
        setPaymentAmount('');
        setPaymentNotes('');
        setPaymentDebtId('');
        setIsPaymentDialogOpen(false);
        
        if (targetDebt) {
          const debtPayments = payments.filter(p => p.debt_id === targetDebt.id);
          const totalPaid = debtPayments.reduce((sum, p) => sum + Number(p.amount), 0) + amount;
          if (totalPaid >= Number(targetDebt.amount)) {
            await storage.updateDebt(targetDebt.id, { status: 'paid' }, isGuest);
          }
        }
        
        fetchDebts();
      }
    } catch (error: any) {
      toast.error(error.message || 'Record payment failed');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const getDebtProgress = (debtId: string, totalAmount: number) => {
    const debtPayments = payments.filter(p => p.debt_id === debtId);
    const totalPaid = debtPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      paid: totalPaid,
      percent: Math.min(100, (totalPaid / totalAmount) * 100),
      remaining: Math.max(0, totalAmount - totalPaid)
    };
  };

  const filteredDebts = debts.filter(d => {
    const matchesSearch = d.person_name.toLowerCase().includes(search.toLowerCase()) || 
                          d.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const groupedDebts = filteredDebts.reduce((acc, debt) => {
    if (!acc[debt.person_name]) {
      acc[debt.person_name] = [];
    }
    acc[debt.person_name].push(debt);
    return acc;
  }, {} as Record<string, Debt[]>);

  const peopleEntries = Object.entries(groupedDebts).sort((a, b) => {
    const aFullyPaid = a[1].every(d => d.status === 'paid');
    const bFullyPaid = b[1].every(d => d.status === 'paid');
    
    if (aFullyPaid && !bFullyPaid) return 1;
    if (!aFullyPaid && bFullyPaid) return -1;
    return a[0].localeCompare(b[0]);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'overdue': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'active': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'overdue': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
      case 'active': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
      case 'pending': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Personal Debts</h1>
          <p className="text-slate-400">Manage what you owe and what is owed to you.</p>
        </div>
        <Button onClick={() => { setSelectedDebt(undefined); setIsFormDialogOpen(true); }} className="h-12 px-6 shadow-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-xl font-bold">
          <Plus size={18} className="mr-2" />
          Add Debt
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <Input 
            placeholder="Search by name or notes..." 
            className="pl-10 h-12 glass border-white/10 text-white placeholder:text-slate-500 focus:ring-indigo-500/50 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-12 w-[140px] px-4 rounded-xl border border-white/10 glass text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 text-white">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      All Status
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="overdue">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      Overdue
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Paid
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {peopleEntries.map(([personName, personDebts]) => {
          const isExpanded = expandedPerson === personName;
          
          // Person summary
          const stats = personDebts.reduce((acc, d) => {
            const isBorrowed = d.contact_info === 'borrowed' || (!d.contact_info && d.category === 'borrowed');
            const progress = getDebtProgress(d.id, Number(d.amount));
            if (isBorrowed) {
              acc.totalBorrowed += progress.remaining;
            } else {
              acc.totalLent += progress.remaining;
            }
            return acc;
          }, { totalBorrowed: 0, totalLent: 0 });

          return (
            <div 
              key={personName} 
              className={cn(
                "glass-card rounded-[1.5rem] overflow-hidden group transition-all duration-300",
                personDebts.every(d => d.status === 'paid') && "opacity-60 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
              )}
            >
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedPerson(isExpanded ? null : personName)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white leading-tight mb-3 break-words pr-8">{personName}</h3>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                    {stats.totalBorrowed > 0 && (
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-rose-400/60 leading-none mb-1 tracking-tight">Owe</span>
                        <span className="text-sm font-bold text-rose-400 leading-none">Rs. {formatCurrency(stats.totalBorrowed)}</span>
                      </div>
                    )}
                    {stats.totalLent > 0 && (
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-emerald-400/60 leading-none mb-1 tracking-tight">Lent</span>
                        <span className="text-sm font-bold text-emerald-400 leading-none">Rs. {formatCurrency(stats.totalLent)}</span>
                      </div>
                    )}
                    <div className="flex flex-col border-l border-white/10 pl-4 h-6 justify-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 leading-none mb-1 tracking-tight">Debts</span>
                      <span className="text-sm font-bold text-slate-400 leading-none">
                        {personDebts.filter(d => d.status !== 'paid').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                          "h-10 w-10 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl border border-transparent"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal size={18} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card border-white/10 text-white min-w-[160px]">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info("Generating person-wide statement link...");
                            handleShare(personDebts[0]); 
                          }}
                        >
                          <Share2 size={14} className="mr-2" /> Share Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-rose-400 focus:text-rose-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeletePerson(personName);
                          }}
                        >
                          <Trash2 size={14} className="mr-2" /> Delete All Records
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="text-slate-500 group-hover:text-white transition-colors p-1">
                      {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 px-4 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl font-bold text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPerson(personName);
                      setPaymentAmount('');
                      setPaymentNotes('');
                      const activeDebt = personDebts.find(d => d.status !== 'paid');
                      if (activeDebt) setPaymentDebtId(activeDebt.id);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    Add Payment
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 pt-0 border-t border-white/5 bg-black/20 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                    {personDebts.map((debt) => {
                      const isBorrowed = debt.contact_info === 'borrowed' || (!debt.contact_info && debt.category === 'borrowed');
                      const progress = getDebtProgress(debt.id, Number(debt.amount));
                      const isPaid = debt.status === 'paid';
                      const isDebtExpanded = expandedDebts.includes(debt.id);

                      return (
                        <div 
                          key={debt.id} 
                          className={cn(
                            "glass-card rounded-2xl border border-white/5 overflow-hidden group/item shadow-sm transition-all duration-300",
                            isPaid && !isDebtExpanded ? "opacity-70" : "opacity-100"
                          )}
                        >
                          <div 
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => {
                              if (expandedDebts.includes(debt.id)) {
                                setExpandedDebts(prev => prev.filter(id => id !== debt.id));
                              } else {
                                setExpandedDebts(prev => [...prev, debt.id]);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                isBorrowed ? "bg-rose-500" : "bg-emerald-500"
                              )} />
                              <div className="flex flex-col">
                                <span className={cn(
                                  "text-sm font-bold tracking-tight transition-all",
                                  isPaid && !isDebtExpanded ? "text-slate-500 line-through" : "text-white"
                                )}>
                                  Rs. {formatCurrency(debt.amount)}
                                </span>
                                {!isDebtExpanded && (
                                  <span className="text-[10px] text-slate-600 font-medium tracking-tight">Click to see details</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-[8px] h-5 px-2 rounded-md font-black uppercase tracking-widest border", getStatusColor(debt.status))}>
                                <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", getStatusDotColor(debt.status))} />
                                {debt.status}
                              </Badge>
                              <div className="text-slate-500 group-hover/item:text-white transition-colors">
                                {isDebtExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                          </div>
                          
                          {isDebtExpanded && (
                            <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1">
                              <div className="h-px bg-white/5" />
                              
                              <div className="flex justify-between items-center text-[10px]">
                                <span className={cn(
                                  "font-bold uppercase tracking-widest",
                                  isBorrowed ? "text-rose-400" : "text-emerald-400"
                                )}>
                                  {isBorrowed ? 'I Owe' : 'I Lent'}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "icon" }),
                                      "h-7 w-7 text-slate-500 hover:text-white"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal size={14} />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="glass-card border-white/10 text-white">
                                    <DropdownMenuItem onClick={() => { setSelectedDebt(debt); setIsFormDialogOpen(true); }}>
                                      <Edit2 size={12} className="mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare(debt)}>
                                      <Share2 size={12} className="mr-2" /> {debt.is_public ? 'Copy Link' : 'Share'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => confirmDelete(debt.id)} className="text-rose-400">
                                      <Trash2 size={12} className="mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                  <span>Progress</span>
                                  <span className="text-indigo-400">{Math.round(progress.percent)}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500 transition-all duration-500" 
                                    style={{ width: `${progress.percent}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[9px] font-medium text-slate-500">
                                  <span>Paid: {formatCurrency(progress.paid)}</span>
                                  <span className={cn(progress.remaining > 0 ? "text-white" : "text-emerald-500")}>
                                    Bal: {formatCurrency(progress.remaining)}
                                  </span>
                                </div>
                              </div>

                              {/* Payback Terms Breakdown */}
                              {(debt as any).payback_terms === 'emi' || (debt as any).payback_terms === 'installments' ? (
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-indigo-400">
                                      <History size={10} />
                                      <span className="text-[9px] font-bold uppercase tracking-wider">
                                        {(debt as any).payback_terms === 'emi' ? `${(debt as any).emi_months} Months Plan` : `${(debt as any).installment_count} Installments`}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-white font-medium">
                                      {(() => {
                                        const isEmi = (debt as any).payback_terms === 'emi';
                                        const debtPaymentsCount = payments.filter(p => p.debt_id === debt.id).length;
                                        const totalInstallments = isEmi ? (debt as any).emi_months : (debt as any).installment_count;
                                        const remainingInstallments = Math.max(1, totalInstallments - debtPaymentsCount);
                                        const suggestedAmount = progress.remaining / remainingInstallments;
                                        return (
                                          <>
                                            <span className="text-slate-500 mr-1">Suggested:</span>
                                            Rs. {formatCurrency(suggestedAmount)} / {isEmi ? "month" : "period"}
                                          </>
                                        );
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                                    {Array.from({ length: (debt as any).payback_terms === 'emi' ? (debt as any).emi_months : (debt as any).installment_count }).map((_, idx) => {
                                      const count = (debt as any).payback_terms === 'emi' ? (debt as any).emi_months : (debt as any).installment_count;
                                      const perAmount = Number(debt.amount) / count;
                                      const isStepPaid = progress.paid >= (perAmount * (idx + 1)) - 1;
                                      
                                      return (
                                        <div 
                                          key={idx} 
                                          className={cn(
                                            "w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold transition-all border",
                                            isStepPaid 
                                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" 
                                              : "bg-black/20 text-slate-600 border-white/5"
                                          )}
                                        >
                                          {idx + 1}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (debt as any).payback_terms === 'whenever' ? (
                                <div className="p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/10 flex items-center justify-center gap-2">
                                  <Clock size={10} className="text-indigo-400" />
                                  <p className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-wider">Flexible Payback Terms</p>
                                </div>
                              ) : (debt as any).payback_terms === 'lumpsum' ? (
                                <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10 flex items-center justify-center gap-2">
                                  <DollarSign size={10} className="text-amber-400" />
                                  <p className="text-[9px] text-amber-400/70 font-bold uppercase tracking-wider">Full Lumpsum Payment</p>
                                </div>
                              ) : null}

                              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase">
                                  <FileText size={10} />
                                  {debt.category}
                                </div>
                                <div className="text-slate-500 italic text-[9px]">
                                  {debt.due_date ? formatFullDate(new Date(`${debt.due_date}T12:00:00`), profile?.calendar_preference || 'AD') : 'No Due Date'}
                                </div>
                              </div>

                              {debt.notes && (
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 italic leading-relaxed">
                                  "{debt.notes}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDebts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 glass-card rounded-[2rem] border-dashed border-white/10">
          <FileText size={64} className="mb-4 opacity-10" />
          <p className="text-sm font-medium">No debts found matching your criteria.</p>
        </div>
      )}

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Debt Record</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the details of this financial interaction.
            </DialogDescription>
          </DialogHeader>
          <DebtForm 
            debt={selectedDebt} 
            onCancel={() => setIsFormDialogOpen(false)} 
            onSuccess={() => {
              setIsFormDialogOpen(false);
              fetchDebts();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Debt</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this debt record? This action cannot be undone.
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

      {/* Delete Person Confirmation */}
      <Dialog open={isPersonDeleteConfirmOpen} onOpenChange={setIsPersonDeleteConfirmOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete All Records?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will permanently delete ALL debt and payment history for <span className="text-white font-bold">{personToDelete}</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsPersonDeleteConfirmOpen(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleDeletePerson} className="bg-rose-600 hover:bg-rose-500 rounded-xl font-bold">
              Delete Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md glass-card border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Record Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Record a payment for <span className="text-indigo-400 font-bold">{selectedPerson}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
             <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Debt</Label>
                  <Select value={paymentDebtId} onValueChange={setPaymentDebtId}>
                    <SelectTrigger className="bg-slate-800/50 border-white/10 h-11">
                      <SelectValue>
                        {paymentDebtId ? (() => {
                          const debt = debts.find(d => d.id === paymentDebtId);
                          if (!debt) return "Select target debt";
                          const progress = getDebtProgress(debt.id, Number(debt.amount));
                          return `${debt.category.charAt(0).toUpperCase() + debt.category.slice(1)} - Rs. ${formatCurrency(progress.remaining)} left`;
                        })() : "Select target debt"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 text-white">
                      {selectedPerson && groupedDebts[selectedPerson]?.filter(d => d.status !== 'paid').map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-bold">{d.category.charAt(0).toUpperCase() + d.category.slice(1)}</span>
                            <span className="text-[10px] text-slate-400">
                              Rs. {formatCurrency(d.amount)} total • Rs. {formatCurrency(Number(d.amount) - getDebtProgress(d.id, Number(d.amount)).paid)} remaining
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPerson && groupedDebts[selectedPerson]?.filter(d => d.status !== 'paid').length === 0 && (
                    <p className="text-[10px] text-rose-400 italic">This person has no active debts to pay.</p>
                  )}
                </div>

                {paymentDebtId && (() => {
                  const debt = debts.find(d => d.id === paymentDebtId);
                  if (!debt) return null;
                  
                  const paybackTerms = (debt as any).payback_terms || 'lumpsum';
                  const isEmi = paybackTerms === 'emi';
                  const isInstallments = paybackTerms === 'installments';
                  
                  const progress = getDebtProgress(debt.id, Number(debt.amount));
                  const debtPaymentsCount = payments.filter(p => p.debt_id === debt.id).length;
                  
                  let planTitle = "PAYMENT PLAN";
                  let suggestedLabel = "Suggested amount";
                  let suggestedAmount = progress.remaining;

                  if (isEmi) {
                    planTitle = "EMI PLAN";
                    const total = (debt as any).emi_months || 1;
                    const remaining = Math.max(1, total - debtPaymentsCount);
                    suggestedAmount = progress.remaining / remaining;
                    suggestedLabel = `Suggested amount (${remaining} ${remaining === 1 ? 'month' : 'months'} left)`;
                  } else if (isInstallments) {
                    planTitle = "INSTALLMENT PLAN";
                    const total = (debt as any).installment_count || 1;
                    const remaining = Math.max(1, total - debtPaymentsCount);
                    suggestedAmount = progress.remaining / remaining;
                    suggestedLabel = `Suggested amount (${remaining} ${remaining === 1 ? 'installment' : 'installments'} left)`;
                  } else {
                    planTitle = "LUMPSUM PLAN";
                    suggestedLabel = "Suggested amount (Full payment)";
                    suggestedAmount = progress.remaining;
                  }
                  
                  return (
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-2 text-indigo-400 mb-1">
                        <History size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {planTitle}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-300/80">
                        {suggestedLabel}: 
                        <span className="text-white font-bold ml-1">Rs. {formatCurrency(suggestedAmount)}</span>
                      </p>
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  <Label>Payment Amount (Rs.)</Label>
                  {(() => {
                    const target = debts.find(d => d.id === paymentDebtId);
                    const remaining = target ? getDebtProgress(target.id, Number(target.amount)).remaining : 0;
                    const amount = parseFloat(paymentAmount) || 0;
                    const isOverLimit = amount > remaining;
                    
                    return (
                      <>
                        <Input 
                          type="number" 
                          value={paymentAmount} 
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                          max={remaining}
                          className={cn(
                            "glass border-white/10 h-11 transition-all",
                            isOverLimit && "border-rose-500/50 focus:ring-rose-500/50"
                          )}
                          required
                        />
                        {paymentDebtId && (
                          <div className="flex justify-between items-center mt-1">
                            <p className={cn(
                              "text-[10px] font-medium transition-colors",
                              isOverLimit ? "text-rose-400" : "text-slate-500"
                            )}>
                              {isOverLimit ? (
                                `Cannot exceed balance of Rs. ${formatCurrency(remaining)}`
                              ) : (
                                `Remaining balance: Rs. ${formatCurrency(remaining)}`
                              )}
                            </p>
                            {isOverLimit && (
                              <button 
                                type="button"
                                onClick={() => setPaymentAmount(remaining.toString())}
                                className="text-[10px] text-indigo-400 font-bold hover:underline"
                              >
                                Use Max
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>Paid From (Select Source)</Label>
                  <Select value={paymentIncomeSourceId} onValueChange={setPaymentIncomeSourceId}>
                    <SelectTrigger className="glass border-white/10 h-11">
                      <SelectValue placeholder="Select income source" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 text-white">
                      <SelectItem value="none">None / Other (Cash)</SelectItem>
                      {incomes.filter(i => i.status === 'received').map(i => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.title} (Rs. {formatCurrency(i.amount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-500 italic">Deducts amount from selected source balance.</p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Notes (Optional)</Label>
                  <Textarea 
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Paid via Esewa, partial payment..."
                    className="glass border-white/10 min-h-[80px]"
                  />
                </div>
             </div>
             <div className="flex justify-end gap-3 pt-6 border-t border-white/5 sticky bottom-0 bg-slate-900 pb-2">
                <Button type="button" variant="ghost" onClick={() => setIsPaymentDialogOpen(false)} className="text-slate-400">Cancel</Button>
                {(() => {
                  const target = debts.find(d => d.id === paymentDebtId);
                  const remaining = target ? getDebtProgress(target.id, Number(target.amount)).remaining : 0;
                  const amount = parseFloat(paymentAmount) || 0;
                  const isOverLimit = amount > remaining;
                  
                  return (
                    <Button 
                      type="submit" 
                      disabled={!paymentDebtId || isOverLimit || amount <= 0 || isRecordingPayment}
                      className={cn(
                        "px-8 rounded-xl font-bold h-11 transition-all",
                        isOverLimit ? "bg-rose-500/20 text-rose-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
                      )}
                    >
                      {isRecordingPayment && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                      Record Payment
                    </Button>
                  );
                })()}
              </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
