import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { Database } from '@/lib/supabase';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  Trash2, 
  Calendar,
  Wallet,
  Coins,
  Briefcase,
  User,
  PlusCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Banknote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/calendar';

type Income = Database['public']['Tables']['incomes']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'];

export default function Finance() {
  const { user, isGuest } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Income Form State
  const [incomeForm, setIncomeForm] = useState({
    title: '',
    amount: '',
    category: 'salary' as Income['category'],
    income_type: 'recurring' as Income['income_type'],
    status: 'received' as Income['status'],
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [user, isGuest]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incomeRes, expenseRes] = await Promise.all([
        storage.getIncomes(user?.id || null, isGuest),
        storage.getExpenses(user?.id || null, isGuest)
      ]);
      setIncomes(incomeRes.data || []);
      setExpenses(expenseRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isGuest) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await storage.addIncome({
        ...incomeForm,
        user_id: user?.id || 'guest',
        amount: Number(incomeForm.amount)
      }, isGuest);

      if (error) throw error;
      
      toast.success('Income recorded successfully');
      setIsIncomeDialogOpen(false);
      setIncomeForm({
        title: '',
        amount: '',
        category: 'salary',
        income_type: 'recurring',
        status: 'received',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      console.error('Add income error:', error);
      toast.error('Failed to add income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      const { error } = await storage.deleteIncome(id, isGuest);
      if (error) throw error;
      toast.success('Income record deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await storage.deleteExpense(id, isGuest);
      if (error) throw error;
      toast.success('Expense record deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const getStatusIcon = (status: Income['status']) => {
    switch (status) {
      case 'received': return <CheckCircle2 className="text-emerald-500" size={14} />;
      case 'pending': return <Clock className="text-amber-500" size={14} />;
      case 'overdue': return <AlertCircle className="text-rose-500" size={14} />;
      case 'failed': return <XCircle className="text-slate-500" size={14} />;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Income & Expenses
          </h1>
          <p className="text-slate-400">Manage your cash flow and track every rupee.</p>
        </div>
        
        <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
          <DialogTrigger 
            render={
              <Button className="bg-emerald-600 hover:bg-emerald-500 rounded-xl h-11 px-6 font-bold shadow-lg shadow-emerald-500/20 gap-2 border-0">
                <PlusCircle size={18} />
                Add Income
              </Button>
            }
          />
          <DialogContent className="glass-card border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record New Income</DialogTitle>
              <CardDescription className="text-slate-400">Enter details about your earning.</CardDescription>
            </DialogHeader>
            <form onSubmit={handleAddIncome} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Title</Label>
                <Input 
                  placeholder="e.g. Monthly Salary" 
                  value={incomeForm.title}
                  onChange={e => setIncomeForm({...incomeForm, title: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Amount (Rs.)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00" 
                    value={incomeForm.amount}
                    onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Date</Label>
                  <Input 
                    type="date"
                    value={incomeForm.date}
                    onChange={e => setIncomeForm({...incomeForm, date: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Category</Label>
                  <Select value={incomeForm.category} onValueChange={(v: any) => setIncomeForm({...incomeForm, category: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="salary">Salary (Fixed)</SelectItem>
                      <SelectItem value="business">Business (Varies)</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Income Type</Label>
                  <Select value={incomeForm.income_type} onValueChange={(v: any) => setIncomeForm({...incomeForm, income_type: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="one-time">One Time</SelectItem>
                      <SelectItem value="not-fixed">Not Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Status</Label>
                <Select value={incomeForm.status} onValueChange={(v: any) => setIncomeForm({...incomeForm, status: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl h-11 font-bold shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Record Income'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <div className="flex justify-start mb-6 sticky top-0 z-10 pt-2 bg-slate-950/80 backdrop-blur-sm -mx-2 px-2 pb-2">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full h-12 inline-flex">
            <TabsTrigger 
              value="income" 
              className="px-6 sm:px-8 rounded-full h-full text-slate-400 hover:text-white hover:bg-emerald-500/20 data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-2 font-black uppercase text-[10px] sm:text-[11px] tracking-widest transition-all"
            >
              <ArrowUpCircle size={18} />
              In
            </TabsTrigger>
            <TabsTrigger 
              value="expense" 
              className="px-6 sm:px-8 rounded-full h-full text-slate-400 hover:text-white hover:bg-rose-500/20 data-[state=active]:bg-rose-500 data-[state=active]:text-white gap-2 font-black uppercase text-[10px] sm:text-[11px] tracking-widest transition-all"
            >
              <ArrowDownCircle size={18} />
              Out
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="income" className="mt-0 pt-0 outline-none">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {incomes.map((income, index) => (
                <motion.div
                  key={income.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="flex items-center justify-between p-3 glass-card rounded-2xl hover:bg-white/5 transition-all group border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform hidden sm:flex">
                        {income.category === 'salary' ? <Wallet size={16} /> : 
                         income.category === 'business' ? <Briefcase size={16} /> :
                         income.category === 'freelance' ? <Coins size={16} /> : <Banknote size={16} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-white leading-tight truncate">{income.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                            {income.date ? formatDisplayDate(new Date(`${income.date}T12:00:00`), 'AD') : formatDisplayDate(new Date(income.created_at), 'AD')}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-none">
                            {income.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[14px] font-black text-emerald-400 leading-none">
                          Rs. {formatCurrency(income.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {getStatusIcon(income.status)}
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 leading-none">
                            {income.status}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteIncome(income.id)}
                        className="h-9 w-9 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {incomes.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500/40 gap-6 glass-card rounded-[2rem] border-dashed">
                  <div className="relative">
                    <Coins size={80} strokeWidth={1} />
                    <XCircle size={24} className="absolute -bottom-1 -right-1 text-rose-500/40" />
                  </div>
                  <p className="font-bold italic text-lg tracking-tight">No income records found.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="expense" className="mt-0 pt-0 outline-none">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="flex items-center justify-between p-3 glass-card rounded-2xl hover:bg-white/5 transition-all group border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform hidden sm:flex">
                        <ArrowDownCircle size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-white leading-tight truncate">{expense.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                            {expense.date ? formatDisplayDate(new Date(`${expense.date}T12:00:00`), 'AD') : formatDisplayDate(new Date(expense.created_at), 'AD')}
                          </span>
                          {expense.category && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-[9px] text-rose-400 font-bold uppercase tracking-widest leading-none">
                                {expense.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[14px] font-black text-rose-400 leading-none">
                          Rs. {formatCurrency(expense.amount)}
                        </p>
                        {expense.income_source_id && (
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <Wallet size={10} className="text-emerald-500" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 leading-none">
                              Deducted
                            </span>
                          </div>
                        )}
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-9 w-9 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {expenses.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500/40 gap-6 glass-card rounded-[2rem] border-dashed">
                  <div className="relative">
                    <ArrowDownCircle size={80} strokeWidth={1} />
                    <XCircle size={24} className="absolute -bottom-1 -right-1 text-rose-500/40" />
                  </div>
                  <p className="font-bold italic text-lg tracking-tight">No expense records found.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
