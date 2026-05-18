import React, { useState } from 'react';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/calendar';

type Recurring = Database['public']['Tables']['recurring_payments']['Row'];

interface RecurringFormProps {
  recurring?: Recurring;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Rent', 'EMI', 'Electricity', 'Water', 'Internet', 'Credit Card', 
  'Subscription', 'Insurance', 'School Fees', 'Gym', 'Mobile', 'Custom'
];

export default function RecurringForm({ recurring, onSuccess, onCancel }: RecurringFormProps) {
  const { user, profile, isGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(recurring?.title || '');
  const [amount, setAmount] = useState(recurring?.amount.toString() || '');
  const [category, setCategory] = useState(recurring?.category || '');
  const [frequency, setFrequency] = useState<any>(recurring?.frequency || 'monthly');
  const [dueDay, setDueDay] = useState(recurring?.due_day.toString() || '1');
  const [autoRepeat, setAutoRepeat] = useState(recurring?.auto_repeat ?? true);

  // Date picker states to match DebtForm
  const [dummyDate, setDummyDate] = useState<Date | undefined>(
    recurring?.due_day 
      ? new Date(new Date().getFullYear(), new Date().getMonth(), recurring.due_day) 
      : new Date()
  );
  const [calendarType, setCalendarType] = useState<'AD' | 'BS'>(profile?.calendar_preference || 'AD');

  const handleDateSelect = (date: Date | undefined) => {
    setDummyDate(date);
    if (date) {
      setDueDay(date.getDate().toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isGuest) return;
    setLoading(true);

    try {
      const data = {
        user_id: user?.id || 'guest',
        title,
        amount: parseFloat(amount),
        category,
        frequency,
        due_day: parseInt(dueDay),
        auto_repeat: autoRepeat,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (recurring?.id) {
        const { error } = await storage.updateRecurring(recurring.id, data, isGuest);
        if (error) throw error;
        toast.success('Payment updated successfully');
      } else {
        const { error } = await storage.addRecurring(data, isGuest);
        if (error) throw error;
        toast.success('Payment added successfully');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">Title / Name</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
          placeholder="e.g. Monthly Rent, Bike EMI"
          className="glass border-white/10 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-white">Amount (Rs.)</Label>
          <Input 
            id="amount" 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
            placeholder="0.00"
            className="glass border-white/10 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="glass border-white/10 text-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 text-white">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="glass border-white/10 text-white">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 text-white">
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-white font-semibold">Due Day</Label>
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
                    "w-full justify-start text-left font-normal glass border-white/10 text-white",
                    !dummyDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dummyDate ? (
                    formatDisplayDate(dummyDate, calendarType)
                  ) : (
                    <span>Pick a day</span>
                  )}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dummyDate}
                onSelect={handleDateSelect}
                initialFocus
                calendarType={calendarType}
              />
            </PopoverContent>
          </Popover>
          <input type="hidden" value={dueDay} required />
          <p className="text-[10px] text-slate-500 mt-1 italic">Selected Day: {dueDay}</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl glass">
        <div className="space-y-0.5">
          <Label className="text-base text-white">Auto-Repeat</Label>
          <p className="text-xs text-slate-500">Automatically create a record for every new month.</p>
        </div>
        <Switch 
          checked={autoRepeat}
          onCheckedChange={setAutoRepeat}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-400">Cancel</Button>
        <Button type="submit" disabled={loading} className="px-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {recurring ? 'Update Payment' : 'Add Payment'}
        </Button>
      </div>
    </form>
  );
}
