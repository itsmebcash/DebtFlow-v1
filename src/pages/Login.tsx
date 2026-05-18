import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, loading, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: {
            shouldCreateUser: true,
          }
        });
        if (error) throw error;
        setOtpSent(true);
        toast.success('6-digit code sent to your email!');
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email'
        });
        if (error) throw error;
        toast.success('Security Sync Complete');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    continueAsGuest();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="mesh-bg" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px]"
      >
        <div className="flex flex-col items-center mb-10 gap-3">
          <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-[1.5rem] flex items-center justify-center text-indigo-400 shadow-2xl font-black text-3xl italic">
            <ShieldCheck size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter text-white mb-1 uppercase italic">DebtFlow</h1>
            <p className="text-slate-500 text-[9px] font-bold">Debt & Monthly Payment Manager</p>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] overflow-hidden border-white/10 shadow-2xl">
          <div className="p-8 pb-4">
            <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight italic">
              Log In
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {otpSent 
                ? 'Check your email for the 6-digit sync code' 
                : 'Login to save your data to cloud'}
            </p>
          </div>
          
          <form onSubmit={handleAuth}>
            <div className="px-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Enter your email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="vault@access.com" 
                  required 
                  disabled={otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 glass border-white/10 text-white placeholder:text-slate-700 focus:ring-indigo-500/50 rounded-xl font-bold text-lg"
                />
              </div>

              {otpSent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="token" className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">6-Digit Sync Code</Label>
                  <Input 
                    id="token" 
                    type="text" 
                    placeholder="000 000"
                    required 
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-14 glass border-indigo-500/20 text-white placeholder:text-slate-700 focus:ring-indigo-400/50 rounded-xl text-center text-2xl tracking-[0.5em] font-black"
                  />
                </motion.div>
              )}
            </div>
            
            <div className="p-8 flex flex-col gap-6">
              <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-base uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all" disabled={isLoading}>
                {isLoading 
                  ? (otpSent ? 'Verifying...' : 'Sending code...') 
                  : (otpSent ? 'Confirm & Sync' : 'Request Access Code')}
              </Button>

              <div className="flex flex-col gap-4 items-center">
                {!otpSent ? (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleSkip}
                    className="w-full h-14 glass border-white/10 text-indigo-400 hover:bg-white/5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Skip Login • Use Guest Mode
                  </Button>
                ) : (
                  <button 
                    type="button" 
                    className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] hover:text-indigo-400 transition-colors"
                    onClick={() => {
                      setOtpSent(false);
                      setToken('');
                    }}
                  >
                    Use different email
                  </button>
                )}
                
                <div className="w-full h-[1px] bg-white/5" />
                
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">
                  Data automatically syncs when you sign in
                </p>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
