import { supabase } from './supabase';

const GUEST_DATA_KEY = 'debtflow_guest_data';

interface GuestData {
  debts: any[];
  debt_payments: any[];
  recurring_payments: any[];
  recurring_history: any[];
  profiles: any[];
  incomes: any[];
  expenses: any[];
}

const getLocalData = (): GuestData => {
  try {
    const data = localStorage.getItem(GUEST_DATA_KEY);
    if (!data) return { 
      debts: [], 
      debt_payments: [], 
      recurring_payments: [], 
      recurring_history: [], 
      profiles: [],
      incomes: [],
      expenses: []
    };
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local data:', e);
    return { 
      debts: [], 
      debt_payments: [], 
      recurring_payments: [], 
      recurring_history: [], 
      profiles: [],
      incomes: [],
      expenses: []
    };
  }
};

const saveLocalData = (data: GuestData) => {
  try {
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving local data:', e);
  }
};

export const storage = {
  getLocalData,
  async getDebts(userId: string | null, isGuest: boolean) {
    if (isGuest) {
      return { data: getLocalData().debts, error: null };
    }
    return supabase.from('debts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  async addDebt(debt: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      const newDebt = { ...debt, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      data.debts.push(newDebt);
      saveLocalData(data);
      return { data: newDebt, error: null };
    }
    return supabase.from('debts').insert(debt).select().single();
  },

  async updateDebt(id: string, updates: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      data.debts = data.debts.map(d => d.id === id ? { ...d, ...updates } : d);
      saveLocalData(data);
      return { error: null };
    }
    return supabase.from('debts').update(updates).eq('id', id);
  },

  async deleteDebt(id: string, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      data.debts = data.debts.filter(d => d.id !== id);
      data.debt_payments = data.debt_payments.filter(p => p.debt_id !== id);
      saveLocalData(data);
      return { error: null };
    }
    return supabase.from('debts').delete().eq('id', id);
  },

  async getRecurring(userId: string | null, isGuest: boolean) {
    if (isGuest) {
      return { data: getLocalData().recurring_payments, error: null };
    }
    return supabase.from('recurring_payments').select('*').eq('user_id', userId);
  },

  async addRecurring(item: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      const newItem = { ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      data.recurring_payments.push(newItem);
      saveLocalData(data);
      return { data: newItem, error: null };
    }
    return supabase.from('recurring_payments').insert(item).select().single();
  },

  async getRecurringHistory(recurringIds: string[], isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      return { data: data.recurring_history.filter(h => recurringIds.includes(h.recurring_id)), error: null };
    }
    return supabase.from('recurring_history').select('*').in('recurring_id', recurringIds);
  },

  async upsertRecurringHistory(history: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      let existingIdx = -1;
      
      if (history.id) {
        existingIdx = data.recurring_history.findIndex(h => h.id === history.id);
      } else {
        existingIdx = data.recurring_history.findIndex(h => 
          h.recurring_id === history.recurring_id && 
          h.month === history.month && 
          h.year === history.year
        );
      }
      
      const isMarkingAsPaid = history.status === 'paid' && (!data.recurring_history[existingIdx] || data.recurring_history[existingIdx].status !== 'paid');

      if (existingIdx > -1) {
        data.recurring_history[existingIdx] = { ...data.recurring_history[existingIdx], ...history };
      } else {
        data.recurring_history.push({ ...history, id: crypto.randomUUID(), created_at: new Date().toISOString() });
      }

      // Deduct from income if marking as paid
      if (isMarkingAsPaid && history.income_source_id && history.amount_paid) {
        data.incomes = data.incomes.map(i => 
          i.id === history.income_source_id 
            ? { ...i, amount: Math.max(0, (Number(i.amount) || 0) - (Number(history.amount_paid) || 0)) } 
            : i
        );
      }

      saveLocalData(data);
      return { error: null };
    }

    // Supabase logic for deduction
    if (history.status === 'paid' && history.income_source_id && history.amount_paid) {
      // Check if it's already paid to avoid double deduction
      let shouldDeduct = true;
      if (history.id) {
        const { data: existing } = await supabase.from('recurring_history').select('status').eq('id', history.id).single();
        if (existing?.status === 'paid') shouldDeduct = false;
      } else {
        const { data: existing } = await supabase.from('recurring_history').select('status')
          .eq('recurring_id', history.recurring_id)
          .eq('month', history.month)
          .eq('year', history.year)
          .single();
        if (existing?.status === 'paid') shouldDeduct = false;
      }

      if (shouldDeduct) {
        const { data: income } = await supabase.from('incomes').select('amount').eq('id', history.income_source_id).single();
        if (income) {
          const newAmount = Math.max(0, (Number(income.amount) || 0) - (Number(history.amount_paid) || 0));
          await supabase.from('incomes').update({ amount: newAmount }).eq('id', history.income_source_id);
        }
      }
    }

    return supabase.from('recurring_history').upsert(history);
  },

  async updateRecurring(id: string, updates: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      data.recurring_payments = data.recurring_payments.map(r => r.id === id ? { ...r, ...updates } : r);
      saveLocalData(data);
      return { error: null };
    }
    return supabase.from('recurring_payments').update(updates).eq('id', id);
  },

  async updateProfile(id: string, updates: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      const profile = data.profiles.find(p => p.id === id) || { id, full_name: '', mobile_number: '', address: '' };
      const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
      
      const idx = data.profiles.findIndex(p => p.id === id);
      if (idx > -1) {
        data.profiles[idx] = updatedProfile;
      } else {
        data.profiles.push(updatedProfile);
      }
      
      saveLocalData(data);
      return { data: updatedProfile, error: null };
    }
    return supabase.from('profiles').upsert({ id, ...updates }).select().single();
  },

  async deleteRecurring(id: string, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      data.recurring_payments = data.recurring_payments.filter(r => r.id !== id);
      data.recurring_history = data.recurring_history.filter(h => h.recurring_id !== id);
      saveLocalData(data);
      return { error: null };
    }
    return supabase.from('recurring_payments').delete().eq('id', id);
  },

  async getIncomes(userId: string | null, isGuest: boolean) {
    if (isGuest) {
      return { data: getLocalData().incomes, error: null };
    }
    return supabase.from('incomes').select('*').eq('user_id', userId).order('date', { ascending: false });
  },

  async addIncome(income: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      const newIncome = { ...income, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      data.incomes.push(newIncome);
      saveLocalData(data);
      return { data: newIncome, error: null };
    }
    return supabase.from('incomes').insert(income).select().single();
  },

  async updateIncome(id: string, updates: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      data.incomes = data.incomes.map(i => i.id === id ? { ...i, ...updates } : i);
      saveLocalData(data);
      return { error: null };
    }
    return supabase.from('incomes').update(updates).eq('id', id);
  },

  async deleteIncome(id: string, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      data.incomes = data.incomes.filter(i => i.id !== id);
      // Optional: Handle cleanup of references in expenses/payments if needed
      saveLocalData(data);
      return { error: null };
    }
    return supabase.from('incomes').delete().eq('id', id);
  },

  async getExpenses(userId: string | null, isGuest: boolean) {
    if (isGuest) {
      return { data: getLocalData().expenses, error: null };
    }
    return supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
  },

  async addExpense(expense: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      const newExpense = { ...expense, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      data.expenses.push(newExpense);
      
      // Deduct from income source if selected
      if (expense.income_source_id) {
        data.incomes = data.incomes.map(i => 
          i.id === expense.income_source_id 
            ? { ...i, amount: Math.max(0, (Number(i.amount) || 0) - (Number(expense.amount) || 0)) } 
            : i
        );
      }
      
      saveLocalData(data);
      return { data: newExpense, error: null };
    }

    // Supabase logic
    if (expense.income_source_id) {
      // Get current income amount first
      const { data: income } = await supabase.from('incomes').select('amount').eq('id', expense.income_source_id).single();
      if (income) {
        const newAmount = Math.max(0, (Number(income.amount) || 0) - (Number(expense.amount) || 0));
        await supabase.from('incomes').update({ amount: newAmount }).eq('id', expense.income_source_id);
      }
    }

    return supabase.from('expenses').insert(expense).select().single();
  },

  async deleteExpense(id: string, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      data.expenses = data.expenses.filter(e => e.id !== id);
      saveLocalData(data);
      return { error: null };
    }
    return supabase.from('expenses').delete().eq('id', id);
  },

  async getDebtPayments(debtId: string, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      return { data: data.debt_payments.filter(p => p.debt_id === debtId), error: null };
    }
    return supabase.from('debt_payments').select('*').eq('debt_id', debtId);
  },

  async getAllDebtPayments(userId: string | null, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      return { data: data.debt_payments, error: null };
    }
    return supabase
      .from('debt_payments')
      .select('*, debts!inner()')
      .eq('debts.user_id', userId)
      .order('payment_date', { ascending: false });
  },

  async getAllRecurringHistory(userId: string | null, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      return { data: data.recurring_history, error: null };
    }
    return supabase
      .from('recurring_history')
      .select('*, recurring_payments!inner()')
      .eq('recurring_payments.user_id', userId)
      .order('created_at', { ascending: false });
  },

  async addDebtPayment(payment: any, isGuest: boolean) {
    if (isGuest) {
      const data = getLocalData();
      const newPayment = { ...payment, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      data.debt_payments.push(newPayment);
      
      // Deduct from income source if selected
      if (payment.income_source_id) {
        data.incomes = data.incomes.map(i => 
          i.id === payment.income_source_id 
            ? { ...i, amount: Math.max(0, (Number(i.amount) || 0) - (Number(payment.amount) || 0)) } 
            : i
        );
      }
      
      saveLocalData(data);
      return { data: newPayment, error: null };
    }

    // Supabase logic
    if (payment.income_source_id) {
      const { data: income } = await supabase.from('incomes').select('amount').eq('id', payment.income_source_id).single();
      if (income) {
        const newAmount = Math.max(0, (Number(income.amount) || 0) - (Number(payment.amount) || 0));
        await supabase.from('incomes').update({ amount: newAmount }).eq('id', payment.income_source_id);
      }
    }

    return supabase.from('debt_payments').insert(payment).select().single();
  },

  async syncGuestData(userId: string) {
    const data = getLocalData();
    if (data.debts.length === 0 && data.recurring_payments.length === 0 && data.profiles.length === 0) return;

    // Check if user already has data in Supabase to avoid duplicates (as requested by user)
    // If they have existing debts or recurring payments, we ignore local data
    const [debtsRes, recurringRes] = await Promise.all([
      supabase.from('debts').select('id').eq('user_id', userId).limit(1),
      supabase.from('recurring_payments').select('id').eq('user_id', userId).limit(1)
    ]);

    const hasSupabaseData = (debtsRes.data && debtsRes.data.length > 0) || (recurringRes.data && recurringRes.data.length > 0);

    if (hasSupabaseData) {
      // User has existing data in Supabase, ignore guest data to avoid duplicates
      localStorage.removeItem(GUEST_DATA_KEY);
      return;
    }

    // Sync profile if guest profile has data
    const guestProfile = data.profiles.find(p => p.id === 'guest');
    if (guestProfile) {
      const { id: _, updated_at: __, ...profileToSync } = guestProfile;
      await supabase.from('profiles').upsert({ id: userId, ...profileToSync });
    }

    // Sync debts
    for (const debt of data.debts) {
      const { id, ...debtToSync } = debt;
      debtToSync.user_id = userId;
      const { data: syncedDebt } = await supabase.from('debts').insert(debtToSync).select().single();
      
      if (syncedDebt) {
        // Sync related payments
        const relatedPayments = data.debt_payments.filter(p => p.debt_id === id);
        for (const payment of relatedPayments) {
          const { id: _, ...paymentToSync } = payment;
          paymentToSync.debt_id = syncedDebt.id;
          await supabase.from('debt_payments').insert(paymentToSync);
        }
      }
    }

    // Sync recurring
    for (const rec of data.recurring_payments) {
      const { id, ...recToSync } = rec;
      recToSync.user_id = userId;
      const { data: syncedRec } = await supabase.from('recurring_payments').insert(recToSync).select().single();
      
      if (syncedRec) {
        const relatedHistory = data.recurring_history.filter(h => h.recurring_id === id);
        for (const hist of relatedHistory) {
          const { id: _, ...histToSync } = hist;
          histToSync.recurring_id = syncedRec.id;
          await supabase.from('recurring_history').insert(histToSync);
        }
      }
    }

    // Clear guest data after sync
    localStorage.removeItem(GUEST_DATA_KEY);
  },

  async syncFullData(userId: string) {
    const data = getLocalData();
    if (data.debts.length === 0 && data.recurring_payments.length === 0 && data.profiles.length === 0 && data.incomes.length === 0 && data.expenses.length === 0) return;

    // Check if user already has data in Supabase to avoid duplicates
    const [debtsRes, recurringRes, incomeRes] = await Promise.all([
      supabase.from('debts').select('id').eq('user_id', userId).limit(1),
      supabase.from('recurring_payments').select('id').eq('user_id', userId).limit(1),
      supabase.from('incomes').select('id').eq('user_id', userId).limit(1)
    ]);

    const hasSupabaseData = (debtsRes.data && debtsRes.data.length > 0) || 
                          (recurringRes.data && recurringRes.data.length > 0) ||
                          (incomeRes.data && incomeRes.data.length > 0);

    if (hasSupabaseData) {
      localStorage.removeItem(GUEST_DATA_KEY);
      return;
    }

    // Sync profile
    const guestProfile = data.profiles.find(p => p.id === 'guest');
    if (guestProfile) {
      const { id: _, updated_at: __, ...profileToSync } = guestProfile;
      await supabase.from('profiles').upsert({ id: userId, ...profileToSync });
    }

    // Sync Incomes first (to get new IDs for references)
    const incomeMap = new Map();
    for (const income of data.incomes) {
      const { id, ...incomeToSync } = income;
      incomeToSync.user_id = userId;
      const { data: syncedIncome } = await supabase.from('incomes').insert(incomeToSync).select().single();
      if (syncedIncome) incomeMap.set(id, syncedIncome.id);
    }

    // Sync debts
    for (const debt of data.debts) {
      const { id, ...debtToSync } = debt;
      debtToSync.user_id = userId;
      const { data: syncedDebt } = await supabase.from('debts').insert(debtToSync).select().single();
      
      if (syncedDebt) {
        const relatedPayments = data.debt_payments.filter(p => p.debt_id === id);
        for (const payment of relatedPayments) {
          const { id: _, ...paymentToSync } = payment;
          paymentToSync.debt_id = syncedDebt.id;
          if (paymentToSync.income_source_id) {
            paymentToSync.income_source_id = incomeMap.get(paymentToSync.income_source_id) || null;
          }
          await supabase.from('debt_payments').insert(paymentToSync);
        }
      }
    }

    // Sync recurring
    for (const rec of data.recurring_payments) {
      const { id, ...recToSync } = rec;
      recToSync.user_id = userId;
      const { data: syncedRec } = await supabase.from('recurring_payments').insert(recToSync).select().single();
      
      if (syncedRec) {
        const relatedHistory = data.recurring_history.filter(h => h.recurring_id === id);
        for (const hist of relatedHistory) {
          const { id: _, ...histToSync } = hist;
          histToSync.recurring_id = syncedRec.id;
          if (histToSync.income_source_id) {
            histToSync.income_source_id = incomeMap.get(histToSync.income_source_id) || null;
          }
          await supabase.from('recurring_history').insert(histToSync);
        }
      }
    }

    // Sync Expenses
    for (const expense of data.expenses) {
      const { id, ...expenseToSync } = expense;
      expenseToSync.user_id = userId;
      if (expenseToSync.income_source_id) {
        expenseToSync.income_source_id = incomeMap.get(expenseToSync.income_source_id) || null;
      }
      await supabase.from('expenses').insert(expenseToSync);
    }

    localStorage.removeItem(GUEST_DATA_KEY);
  },

  async clearAllData() {
    localStorage.removeItem(GUEST_DATA_KEY);
    localStorage.removeItem('isGuest');
  }
};
