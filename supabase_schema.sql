-- SQL for Supabase SQL Editor

-- 1. Profiles Table (Linked to Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  calendar_preference TEXT DEFAULT 'BS' CHECK (calendar_preference IN ('AD', 'BS')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Debts Table
CREATE TABLE debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  contact_info TEXT,
  category TEXT NOT NULL CHECK (category IN ('borrowed', 'lent', 'family', 'friends', 'business', 'personal')),
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  due_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'pending')),
  payment_method TEXT,
  attachment_url TEXT,
  is_public BOOLEAN DEFAULT false,
  public_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Debt Payments (Transactions)
CREATE TABLE debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Recurring Payments (Templates)
CREATE TABLE recurring_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  auto_repeat BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Recurring History (Actual monthly records)
CREATE TABLE recurring_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_id UUID REFERENCES recurring_payments(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  amount_paid DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(recurring_id, month, year)
);

-- 6. Incomes Table
CREATE TABLE incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'pending', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Expenses Table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  income_source_id UUID REFERENCES incomes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Debt Payments Extension (Add income_source_id)
ALTER TABLE debt_payments ADD COLUMN IF NOT EXISTS income_source_id UUID REFERENCES incomes(id) ON DELETE SET NULL;

-- 9. Recurring History Extension (Add income_source_id)
ALTER TABLE recurring_history ADD COLUMN IF NOT EXISTS income_source_id UUID REFERENCES incomes(id) ON DELETE SET NULL;

-- 10. RLS Policies
-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can view name of debt owners" ON profiles FOR SELECT USING (
  id IN (SELECT user_id FROM debts WHERE is_public = true)
);

-- Debts
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own debts" ON debts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view shared debts" ON debts FOR SELECT USING (is_public = true);

-- Debt Payments
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own debt payments" ON debt_payments FOR ALL 
USING (EXISTS (SELECT 1 FROM debts WHERE id = debt_payments.debt_id AND user_id = auth.uid()));
CREATE POLICY "Public can view payments for shared debts" ON debt_payments FOR SELECT 
USING (EXISTS (SELECT 1 FROM debts WHERE id = debt_payments.debt_id AND is_public = true));

-- Recurring Payments
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recurring payments" ON recurring_payments FOR ALL USING (auth.uid() = user_id);

-- Recurring History
ALTER TABLE recurring_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recurring history" ON recurring_history FOR ALL 
USING (EXISTS (SELECT 1 FROM recurring_payments WHERE id = recurring_history.recurring_id AND user_id = auth.uid()));

-- Incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own incomes" ON incomes FOR ALL USING (auth.uid() = user_id);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_user_id ON recurring_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_history_recurring_id ON recurring_history(recurring_id);

-- Constraints
ALTER TABLE debts ADD CONSTRAINT positive_debt_amount CHECK (amount >= 0);
ALTER TABLE debt_payments ADD CONSTRAINT positive_payment_amount CHECK (amount >= 0);
ALTER TABLE recurring_payments ADD CONSTRAINT positive_recurring_amount CHECK (amount >= 0);
ALTER TABLE recurring_history ADD CONSTRAINT positive_history_amount CHECK (amount_paid >= 0);

-- 8. Functions
-- Trigger to sync profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
