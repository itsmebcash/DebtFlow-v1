import React, { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, UserPlus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/calendar';

type Debt = Database['public']['Tables']['debts']['Row'];

interface DebtFormProps {
  debt?: Debt;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DebtForm({ debt, onSuccess, onCancel }: DebtFormProps) {
  const { user, profile, isGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [personName, setPersonName] = useState(debt?.person_name || '');
  const [amount, setAmount] = useState(debt?.amount.toString() || '');
  const [category, setCategory] = useState<any>(debt?.category || 'personal');
  const [status, setStatus] = useState<any>(debt?.status || 'active');
  const [debtType, setDebtType] = useState<'borrowed' | 'lent'>(
    debt?.contact_info === 'lent' ? 'lent' : 'borrowed'
  );
  const [notes, setNotes] = useState(debt?.notes || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(debt?.due_date ? new Date(debt.due_date) : undefined);
  const [existingPeople, setExistingPeople] = useState<string[]>([]);
  const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);
  
  // New States for Payback Terms
  const [paybackTerms, setPaybackTerms] = useState<string>((debt as any)?.payback_terms || 'lumpsum');
  const [emiMonths, setEmiMonths] = useState<string>('3');
  const [installmentCount, setInstallmentCount] = useState<string>('3');
  const [calendarType, setCalendarType] = useState<'AD' | 'BS'>(profile?.calendar_preference || 'AD');
  const [keepPerson, setKeepPerson] = useState(false);

  useEffect(() => {
    const fetchPeople = async () => {
      const { data } = await storage.getDebts(user?.id || null, isGuest);
      if (data) {
        const uniqueNames = Array.from(new Set(data.map((d: any) => d.person_name))).sort();
        setExistingPeople(uniqueNames);
        // If there's a debt being edited, we already have personName.
        // If not, and there are existing people, let's start with a dropdown.
        if (!debt && uniqueNames.length > 0) {
          setIsAddingNewPerson(false);
        } else if (!debt && uniqueNames.length === 0) {
          setIsAddingNewPerson(true);
        }
      }
    };
    fetchPeople();
  }, [user?.id, isGuest, debt]);

  const paybackTypes = [
    { id: 'lumpsum', name: 'Lumpsum' },
    { id: 'emi', name: 'EMI' },
    { id: 'installments', name: 'Multiple Installments' },
    { id: 'whenever', name: 'Whenever I can' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isGuest) return;
    setLoading(true);

    try {
      // Determine final category
      const debtData = {
        user_id: user?.id || 'guest',
        person_name: personName,
        amount: parseFloat(amount),
        category: category,
        contact_info: debtType, // Using contact_info to store "borrowed" or "lent"
        status,
        notes,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        payback_terms: paybackTerms,
        emi_months: paybackTerms === 'emi' ? parseInt(emiMonths) : null,
        installment_count: paybackTerms === 'installments' ? parseInt(installmentCount) : null,
        updated_at: new Date().toISOString()
      };

      if (debt?.id) {
        const { error } = await storage.updateDebt(debt.id, debtData, isGuest);
        if (error) throw error;
        toast.success('Debt updated successfully');
        onSuccess();
      } else {
        const { error } = await storage.addDebt(debtData, isGuest);
        if (error) throw error;
        toast.success('Debt added successfully');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save debt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="flex justify-center mb-2">
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-white/5 w-full max-w-[280px]">
          <button
            type="button"
            onClick={() => {
              setDebtType('borrowed');
            }}
            className={cn(
              "flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
              debtType === 'borrowed' 
                ? "bg-rose-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", debtType === 'borrowed' ? "bg-white" : "bg-rose-500")} />
            I Owe (Borrow)
          </button>
          <button
            type="button"
            onClick={() => {
              setDebtType('lent');
            }}
            className={cn(
              "flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
              debtType === 'lent' 
                ? "bg-emerald-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", debtType === 'lent' ? "bg-white" : "bg-emerald-500")} />
            I Lent (Lend)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="person_name">Person Name</Label>
            {existingPeople.length > 0 && (
              <button 
                type="button"
                onClick={() => {
                  if (!isAddingNewPerson) {
                    setPersonName('');
                  }
                  setIsAddingNewPerson(!isAddingNewPerson);
                }}
                className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-xs font-bold text-indigo-400 flex items-center gap-2 transition-all border border-indigo-500/10"
              >
                {isAddingNewPerson ? (
                  <><Users size={14} /> Select Existing</>
                ) : (
                  <><UserPlus size={14} /> Add New Person</>
                )}
              </button>
            )}
          </div>
          
          {isAddingNewPerson ? (
            <Input 
              id="person_name" 
              value={personName} 
              onChange={(e) => setPersonName(e.target.value)} 
              required 
              placeholder="Full name of the person"
              className="bg-slate-800/50 border-white/10"
              autoFocus={!debt}
            />
          ) : (
            <Select value={personName} onValueChange={setPersonName}>
              <SelectTrigger className="bg-slate-800/50 border-white/10">
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 text-white">
                {existingPeople.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (Rs.)</Label>
          <Input 
            id="amount" 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={category} 
            onValueChange={setCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="borrowed">Borrowed</SelectItem>
              <SelectItem value="lent">Lent (General)</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="friends">Friends</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <Label className="text-white font-semibold">Payback Terms</Label>
          <Select value={paybackTerms} onValueChange={setPaybackTerms}>
            <SelectTrigger className="w-[180px] glass border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 text-white">
              {paybackTypes.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {paybackTerms === 'lumpsum' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between">
              <Label className="text-slate-400">Due Date</Label>
              <div className="flex bg-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setCalendarType('AD')}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    calendarType === 'AD' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  AD
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarType('BS')}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    calendarType === 'BS' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  BS
                </button>
              </div>
            </div>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-white/10",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      formatDisplayDate(dueDate, calendarType)
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  calendarType={calendarType}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {paybackTerms === 'whenever' && (
          <p className="text-xs text-slate-500 italic">No specific due date. Flexible repayment.</p>
        )}

        {paybackTerms === 'emi' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between">
              <Label className="text-slate-400">Duration (Months)</Label>
              <Select value={emiMonths} onValueChange={setEmiMonths}>
                <SelectTrigger className="w-[100px] glass border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 text-white">
                  {[3, 6, 12, 18, 24, 36].map(m => (
                    <SelectItem key={m} value={m.toString()}>{m}m</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {amount && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs text-indigo-300">Estimated Monthly Installment</p>
                <p className="text-lg font-bold text-white">Rs. {(parseFloat(amount) / parseInt(emiMonths)).toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        {paybackTerms === 'installments' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between">
              <Label className="text-slate-400">Number of Installments</Label>
              <Select value={installmentCount} onValueChange={setInstallmentCount}>
                <SelectTrigger className="w-[100px] glass border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 text-white">
                  {[2, 3, 4, 5, 6, 8, 10].map(c => (
                    <SelectItem key={c} value={c.toString()}>{c}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {amount && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs text-indigo-300">Per Installment amount</p>
                <p className="text-lg font-bold text-white">Rs. {(parseFloat(amount) / parseInt(installmentCount)).toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Add any extra details here..."
          className="min-h-[100px] bg-slate-800/50 border-white/10"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900 pb-2 border-t border-white/5">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-400">Cancel</Button>
        <Button type="submit" disabled={loading} className="px-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {debt ? 'Update Debt' : 'Add Debt'}
        </Button>
      </div>
    </form>
  );
}
