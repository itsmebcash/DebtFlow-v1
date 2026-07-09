import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL and Anon Key must be provided in environment variables. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          calendar_preference: 'AD' | 'BS'
          mobile_number: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          calendar_preference?: 'AD' | 'BS'
          mobile_number?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          calendar_preference?: 'AD' | 'BS'
          mobile_number?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          user_id: string
          person_name: string
          contact_info: string | null
          category: 'borrowed' | 'lent' | 'family' | 'friends' | 'business' | 'personal'
          amount: number
          interest_rate: number | null
          due_date: string | null
          notes: string | null
          status: 'active' | 'paid' | 'overdue' | 'pending'
          payback_terms: string | null
          emi_months: number | null
          installment_count: number | null
          payment_method: string | null
          attachment_url: string | null
          is_public: boolean
          public_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          person_name: string
          contact_info?: string | null
          category: 'borrowed' | 'lent' | 'family' | 'friends' | 'business' | 'personal'
          amount: number
          interest_rate?: number | null
          due_date?: string | null
          notes?: string | null
          status?: 'active' | 'paid' | 'overdue' | 'pending'
          payback_terms?: string | null
          emi_months?: number | null
          installment_count?: number | null
          payment_method?: string | null
          attachment_url?: string | null
          is_public?: boolean
          public_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          person_name?: string
          contact_info?: string | null
          category?: 'borrowed' | 'lent' | 'family' | 'friends' | 'business' | 'personal'
          amount?: number
          interest_rate?: number | null
          due_date?: string | null
          notes?: string | null
          status?: 'active' | 'paid' | 'overdue' | 'pending'
          payback_terms?: string | null
          emi_months?: number | null
          installment_count?: number | null
          payment_method?: string | null
          attachment_url?: string | null
          is_public?: boolean
          public_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debt_payments: {
        Row: {
          id: string
          debt_id: string
          amount: number
          payment_date: string
          notes: string | null
          attachment_url: string | null
          income_source_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          debt_id: string
          amount: number
          payment_date?: string
          notes?: string | null
          attachment_url?: string | null
          income_source_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          debt_id?: string
          amount?: number
          payment_date?: string
          notes?: string | null
          attachment_url?: string | null
          income_source_id?: string | null
          created_at?: string
        }
      }
      recurring_payments: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string
          amount: number
          frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          due_day: number
          auto_repeat: boolean
          reminder_enabled: boolean
          notes: string | null
          is_active: boolean
          is_public: boolean
          public_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: string
          amount: number
          frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          due_day: number
          auto_repeat?: boolean
          reminder_enabled?: boolean
          notes?: string | null
          is_active?: boolean
          is_public?: boolean
          public_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: string
          amount?: number
          frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          due_day?: number
          auto_repeat?: boolean
          reminder_enabled?: boolean
          notes?: string | null
          is_active?: boolean
          is_public?: boolean
          public_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recurring_history: {
        Row: {
          id: string
          recurring_id: string
          month: number
          year: number
          status: 'paid' | 'pending' | 'overdue'
          amount_paid: number
          payment_date: string | null
          income_source_id: string | null
          proof_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recurring_id: string
          month: number
          year: number
          status?: 'paid' | 'pending' | 'overdue'
          amount_paid?: number
          payment_date?: string | null
          income_source_id?: string | null
          proof_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recurring_id?: string
          month?: number
          year?: number
          status?: 'paid' | 'pending' | 'overdue'
          amount_paid?: number
          payment_date?: string | null
          income_source_id?: string | null
          proof_url?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      incomes: {
        Row: {
          id: string
          user_id: string
          title: string
          amount: number
          category: 'salary' | 'business' | 'freelance' | 'other'
          income_type: 'recurring' | 'one-time' | 'not-fixed'
          status: 'received' | 'pending' | 'failed' | 'overdue'
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          amount: number
          category: 'salary' | 'business' | 'freelance' | 'other'
          income_type: 'recurring' | 'one-time' | 'not-fixed'
          status?: 'received' | 'pending' | 'failed' | 'overdue'
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          amount?: number
          category?: 'salary' | 'business' | 'freelance' | 'other'
          income_type?: 'recurring' | 'one-time' | 'not-fixed'
          status?: 'received' | 'pending' | 'failed' | 'overdue'
          date?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          title: string
          amount: number
          category: string | null
          income_source_id: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          amount: number
          category?: string | null
          income_source_id?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          amount?: number
          category?: string | null
          income_source_id?: string | null
          date?: string
          created_at?: string
        }
      }
    }
  }
}
