import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { 
  Plus, 
  ChevronRight, 
  TrendingUp,
  Wallet,
  X
} from 'lucide-react';
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
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function QuickAdd() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [quickExpense, setQuickExpense] = useState({
    title: '',
    amount: '',
    incomeSourceId: 'none'
  });

  useEffect(() => {
    const fetchIncomes = async () => {
      const { data } = await storage.getIncomes(user?.id || null, isGuest);
      if (data) setIncomes(data);
    };
    fetchIncomes();
  }, [user, isGuest]);

  const handleQuickExpense = async () => {
    if (!quickExpense.title || !quickExpense.amount) {
      toast.error('Please enter title and amount');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const amount = Number(quickExpense.amount);
      if (quickExpense.incomeSourceId !== 'none') {
        const source = incomes.find(i => i.id === quickExpense.incomeSourceId);
        if (source && (Number(source.amount) || 0) < amount) {
          toast.error(`Not enough balance in "${source.title}". Available: Rs. ${Number(source.amount).toLocaleString()}`);
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await storage.addExpense({
        user_id: user?.id || 'guest',
        title: quickExpense.title,
        amount: Number(quickExpense.amount),
        income_source_id: quickExpense.incomeSourceId === 'none' ? null : quickExpense.incomeSourceId,
        date: new Date().toISOString().split('T')[0]
      }, isGuest);

      if (error) throw error;

      toast.success('Expense recorded!');
      navigate('/finance');
    } catch (error) {
      console.error('Quick expense error:', error);
      toast.error('Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col pt-10 px-6 overflow-y-auto pb-48">
      <div className="flex items-center justify-between mb-12 shrink-0 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Quick Expense</h1>
            <p className="text-sm text-slate-500">Record a spending instantly</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full bg-white/5 border border-white/10 text-slate-400 h-12 w-12"
        >
          <X size={24} />
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-xl mx-auto w-full"
      >
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">What did you buy?</Label>
          <Input 
            value={quickExpense.title}
            onChange={e => setQuickExpense({...quickExpense, title: e.target.value})}
            placeholder="Enter item or service name..."
            autoFocus
            className="text-2xl md:text-3xl py-10 px-8 bg-white/[0.03] border-white/10 rounded-[2rem] focus:bg-white/[0.05] focus:border-rose-500/30 transition-all placeholder:text-white/60 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Amount</Label>
            <div className="relative">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">Rs.</span>
              <Input 
                type="number"
                value={quickExpense.amount}
                onChange={e => setQuickExpense({...quickExpense, amount: e.target.value})}
                placeholder="0.00"
                className="text-2xl md:text-3xl py-10 pl-20 pr-8 bg-white/[0.03] border-white/10 rounded-[2rem] focus:bg-white/[0.05] focus:border-rose-500/30 transition-all placeholder:text-white/60 font-black text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Paid From</Label>
            <Select 
              value={quickExpense.incomeSourceId} 
              onValueChange={(v) => setQuickExpense({...quickExpense, incomeSourceId: v})}
            >
              <SelectTrigger className="h-[84px] bg-white/[0.03] border-white/10 rounded-[2rem] px-8 text-lg font-medium text-white">
                <div className="flex items-center gap-3">
                  <Wallet size={20} className="text-emerald-500" />
                  <SelectValue placeholder="Select Source" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="none">None (Cash/Other)</SelectItem>
                {incomes.map(income => (
                  <SelectItem key={income.id} value={income.id}>
                    {income.title} (Rs. {Number(income.amount).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleQuickExpense}
          disabled={isSubmitting}
          className="w-full h-[84px] bg-rose-600 hover:bg-rose-500 rounded-[2.5rem] font-black text-2xl uppercase tracking-tight shadow-2xl shadow-rose-900/40 group active:scale-[0.98] transition-all mt-8"
        >
          {isSubmitting ? 'Recording...' : (
            <div className="flex items-center gap-3">
              <span>Save Record</span>
              <Plus size={28} className="group-hover:rotate-90 transition-transform duration-500" />
            </div>
          )}
        </Button>

        <p className="text-center text-slate-600 text-sm italic">
          This will be added to your expense history instantly.
        </p>
      </motion.div>
    </div>
  );
}
