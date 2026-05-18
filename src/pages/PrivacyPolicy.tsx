import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-400 font-bold mb-8 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
        </div>

        <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Introduction</h2>
            <p>
              DebtFlow ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by DebtFlow.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Information We Collect</h2>
            <p className="mb-4">
              We collect information that you provide directly to us when you use our application:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Information:</strong> Your email address and profile information provided via Google Authentication.</li>
              <li><strong>Profile Information:</strong> Optional information you may provide, such as your name, mobile number, and physical address.</li>
              <li><strong>Financial Data:</strong> Information regarding your debts, incomes, expenses, and recurring payments that you manually enter into the application.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">How We Use Your Information</h2>
            <p className="mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, maintain, and improve our services.</li>
              <li>To synchronize your financial data across your devices via our secure cloud database.</li>
              <li>To notify you about upcoming recurring payments and debt obligations.</li>
              <li>To protect the security and integrity of our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase (PostgreSQL) and is protected by industry-standard security measures. We only store information necessary to provide the features of the application. We do not sell your personal or financial data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Children's Privacy</h2>
            <p>
              DebtFlow is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information without parental consent, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: <span className="text-indigo-400 font-medium">itsmebcash@gmail.com</span>
            </p>
          </section>

          <div className="pt-8 border-t border-white/5 text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            Last Updated: May 10, 2026
          </div>
        </div>
      </div>
    </div>
  );
}
