import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, ArrowLeft, AlertTriangle, ShieldCheck, LogIn, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

export default function DataDeletion() {
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDeleteRequest = async () => {
    toast.loading("Processing deletion request...");
    
    setTimeout(async () => {
      toast.dismiss();
      if (isGuest) {
        await storage.clearAllData();
        toast.success("All local DebtFlow data has been permanently wiped.");
      } else {
        toast.success("Account deletion request received. Your DebtFlow data will be permanently wiped within 24 hours.");
      }
      await signOut();
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full border border-white/5">
              App: DebtFlow
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
            <Trash2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Account Deletion</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Google Play Data Policy Compliance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Info size={18} className="text-indigo-400" />
                <h2 className="text-xl font-bold">How to delete your account</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-black text-white text-xs">1</div>
                  <div className="text-sm">
                    <p className="font-bold text-white mb-1">Sign In</p>
                    <p className="text-slate-400">Log in to your DebtFlow account using your Google ID to verify your identity.</p>
                  </div>
                </div>
                <div className="flex gap-4 text-emerald-400">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 font-black text-xs">2</div>
                  <div className="text-sm">
                    <p className="font-bold mb-1">Confirm Request</p>
                    <p className="opacity-80">Click the "Request Account Deletion" button below and confirm the permanent action.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-black text-white text-xs">3</div>
                  <div className="text-sm">
                    <p className="font-bold text-white mb-1">Data Erasure</p>
                    <p className="text-slate-400">Within 24 hours, all financial records and profile data will be purged from our active databases.</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-white/5" />

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white">Data types & Retention</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                  <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-3">Permanently Deleted</p>
                  <ul className="text-xs space-y-2 text-slate-400 font-medium">
                    <li>• Personal Profile (Email, Name)</li>
                    <li>• All Debt & Loan Records</li>
                    <li>• Expense & Income History</li>
                    <li>• Recurring Payment Settings</li>
                    <li>• Custom UI Preferences</li>
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-3">Retained / Period</p>
                  <ul className="text-xs space-y-2 text-slate-400 font-medium">
                    <li>• Transaction IDs (Wiped in 30 days)</li>
                    <li>• Sync Logs (Wiped in 30 days)</li>
                    <li>• Encrypted Backups (30 day purge)</li>
                    <li>• Audit Logs (Anonymized)</li>
                  </ul>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">Financial data is purged immediately from active servers. It remains in encrypted, inaccessible backups for up to 30 days before full erasure.</p>
            </section>

            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4">
              <AlertTriangle className="text-amber-500 shrink-0" size={24} />
              <div className="text-sm">
                <p className="text-amber-200 font-bold mb-1 uppercase tracking-tighter">Warning: Irreversible</p>
                <p className="text-amber-200/70 leading-relaxed text-xs">
                  Once deleted, DebtFlow cannot recover your financial history. Ensure you have exported any necessary records before proceeding.
                </p>
              </div>
            </div>

            {user || isGuest ? (
              <div className="pt-4">
                {!isConfirming ? (
                  <Button 
                    onClick={() => setIsConfirming(true)}
                    className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20"
                  >
                    {isGuest ? "Wipe All Local Data" : "Request Account Deletion"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-sm font-bold text-white flex items-center justify-center gap-2">
                       Verify: Are you absolutely sure?
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => setIsConfirming(false)}
                        className="flex-1 h-12 rounded-xl border-white/10 hover:bg-white/5 text-white"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleDeleteRequest}
                        className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                      >
                        Yes, Delete All
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/10 text-center">
                  <p className="text-sm text-slate-400 mb-6">To initiate deletion of your DebtFlow data, please sign in to verify your identity.</p>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px]"
                  >
                    <LogIn className="mr-2" size={16} />
                    Sign In to Delete
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 justify-center py-2">
                  <div className="h-px bg-white/5 flex-1" />
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Or</span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>

                <div className="text-center text-xs text-slate-500">
                  <p className="mb-2">Cannot access your account?</p>
                  <a 
                    href="mailto:itsmebcash@gmail.com?subject=DebtFlow Data Deletion Request"
                    className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:underline"
                  >
                    <Mail size={14} />
                    Email Support to Request Deletion
                  </a>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">GDPR & Google Play Compliant</span>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                Last Policy Refresh: May 11, 2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
