import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Receipt, 
  Repeat, 
  LogOut, 
  Menu, 
  X, 
  User,
  ChevronRight,
  Wallet,
  Settings,
  Info,
  Shield,
  FileText,
  Smartphone,
  MapPin,
  ShieldCheck,
  Trash2,
  Bell,
  BellOff,
  Banknote,
  Plus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { storage } from '@/lib/storage';
import { NotificationService } from '@/services/notificationService';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Receipt, label: 'Debts', path: '/debts' },
  { icon: Repeat, label: 'Recurring', path: '/recurring' },
  { icon: Banknote, label: 'Finance', path: '/finance' },
];

export default function Layout() {
  const { user, profile, isGuest, signOut, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    mobile_number: profile?.mobile_number || '',
    address: profile?.address || ''
  });

  useEffect(() => {
    if (user && !isGuest) {
      NotificationService.checkAndNotify(user.id);
    }
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [user, isGuest]);

  const handleRequestNotificationPermission = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      setNotificationPermission('granted');
      toast.success("Notifications enabled! We'll alert you 1 day before due dates.");
      if (user) NotificationService.checkAndNotify(user.id);
    } else {
      setNotificationPermission('denied');
      toast.error("Notification permission denied.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSaveSettings = async () => {
    if (!user && !isGuest) return;
    
    try {
      setIsSaving(true);
      const { error } = await storage.updateProfile(
        isGuest ? 'guest' : user!.id,
        {
          full_name: formData.full_name,
          mobile_number: formData.mobile_number,
          address: formData.address,
          ...(!isGuest && { email: user?.email })
        },
        isGuest
      );
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      await refreshProfile();
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const openSettings = () => {
    setFormData({
      full_name: profile?.full_name || '',
      mobile_number: profile?.mobile_number || '',
      address: profile?.address || ''
    });
    setIsSettingsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      <div className="mesh-bg" />
      
      {/* Mobile Top Header */}
      <header className="md:hidden glass border-b border-white/10 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5 text-white font-black italic cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/icon-192.png" alt="DebtFlow" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg tracking-tighter uppercase">DebtFlow</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 rounded-full border border-white/10 cursor-pointer overflow-hidden outline-none">
            <Avatar className="h-full w-full">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-slate-700 text-white uppercase text-[10px]">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-white/10 text-white">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-semibold">{profile?.full_name || 'User'}</span>
                <span className="text-[10px] text-slate-500">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              {!isGuest && (
                <DropdownMenuItem onClick={openSettings} className="focus:bg-white/5 focus:text-indigo-400">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsAboutOpen(true)} className="focus:bg-white/5 focus:text-indigo-400">
                <Info className="mr-2 h-4 w-4" />
                <span>About Us</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={handleSignOut} className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isGuest ? 'Log In' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-screen">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden md:flex md:w-64 flex-col glass border-r border-white/5 bg-transparent backdrop-blur-3xl">
          <div className="p-8">
            <div className="flex items-center gap-3 text-white font-black italic group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all">
                <img src="/icon-192.png" alt="DebtFlow" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl tracking-tighter uppercase leading-none">DebtFlow</span>
                <span className="text-[7px] text-slate-500 font-bold mt-1">Debt & Monthly Payment Manager</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "glass-card text-indigo-400 shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={20} className={cn(isActive && "text-indigo-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 space-y-4">
            <div className="glass-card p-4 rounded-2xl space-y-4">
              {!isGuest && (
                <button 
                  onClick={openSettings}
                  className="w-full flex items-center gap-3 text-slate-400 hover:text-indigo-400 transition-colors text-sm font-medium"
                >
                  <Settings size={18} />
                  Settings
                </button>
              )}
              <button 
                onClick={() => setIsAboutOpen(true)}
                className="w-full flex items-center gap-3 text-slate-400 hover:text-indigo-400 transition-colors text-sm font-medium"
              >
                <Info size={18} />
                About Us
              </button>
              <div className="h-px bg-white/5 w-full" />
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 text-slate-400 hover:text-rose-400 transition-colors text-sm font-medium"
              >
                <LogOut size={18} />
                {isGuest ? 'Log In' : 'Sign Out'}
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto p-6 md:p-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card bg-slate-900/90 border-t border-white/10 px-2 pb-6 pt-2 h-24 flex items-center justify-around z-50 rounded-t-[2.5rem] backdrop-blur-xl">
        {/* Left Side */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl transition-all duration-300 relative",
                isActive ? "text-indigo-400" : "text-slate-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive && "bg-indigo-500/10 scale-110"
              )}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"
                />
              )}
            </Link>
          );
        })}

        {/* Central Quick Add */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-12 relative">
          <Link 
            to="/quick-add"
            className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 active:scale-90 transition-all border-4 border-slate-950"
          >
            <Plus size={32} strokeWidth={3} />
          </Link>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2">Record</span>
        </div>

        {/* Right Side */}
        {navItems.slice(2).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl transition-all duration-300 relative",
                isActive ? "text-indigo-400" : "text-slate-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive && "bg-indigo-500/10 scale-110"
              )}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">User Profile Settings</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your personal information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input
                  id="name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile" className="text-xs font-bold uppercase tracking-widest text-slate-500">Mobile Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input
                  id="mobile"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  placeholder="+977 98XXXXXXXXX"
                  className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-slate-500">One Line Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Kathmandu, Nepal"
                  className="pl-10 bg-white/5 border-white/10 focus:border-indigo-500/50 h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Notifications</Label>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {notificationPermission === 'granted' ? (
                    <Bell className="text-indigo-400" size={18} />
                  ) : (
                    <BellOff className="text-slate-500" size={18} />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Payment Alerts</span>
                    <span className="text-[10px] text-slate-500">Get notified 1 day before due dates</span>
                  </div>
                </div>
                {notificationPermission === 'granted' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/10 uppercase text-[8px]">Enabled</Badge>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRequestNotificationPermission}
                    className="h-8 text-[10px] uppercase font-bold border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 h-11 rounded-xl font-bold shadow-lg shadow-indigo-500/20"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About Us Dialog */}
      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              About DebtFlow
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Version 1.0.0 • Debt & Monthly Payment Manager.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Info size={18} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Our Mission</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                DebtFlow is designed to simplify the complex task of tracking personal debts, loans, and recurring payments. 
                Whether you're managing small favors among friends or professional financial obligations, 
                our goal is to provide a clean, secure, and intuitive interface for your financial peace of mind.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Shield size={18} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Privacy & Data Policy</h3>
              </div>
              <div className="text-[13px] text-slate-400 space-y-3">
                <p>We are committed to protecting your personal and financial information. Our policy ensures that your data is handled securely and transparently.</p>
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-2">• No third-party data selling</p>
                  <p className="flex items-center gap-2">• End-to-end data encryption at rest</p>
                  <p className="flex items-center gap-2">• Full user ownership of data</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsAboutOpen(false);
                    navigate('/privacy');
                  }}
                  className="mt-2 h-9 text-[10px] uppercase font-black border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl"
                >
                  <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                  View Full Privacy Policy
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsAboutOpen(false);
                    navigate('/data-deletion');
                  }}
                  className="mt-1 h-9 text-[10px] uppercase font-black text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Request Data Deletion
                </Button>
              </div>
            </section>

            <section className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2">Compliance</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                DebtFlow complies with international data protection regulations and Google Play Store policies. 
                This application does not engage in real-money gambling or predatory lending practices.
              </p>
            </section>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-4 border-t border-white/10 pt-4 mt-4">
            <p className="text-[10px] text-black text-center sm:text-left flex-1 italic">
              Developed with ❤️ by <a href="https://www.linkedin.com/in/itsmebcash" target="_blank" rel="noopener noreferrer" className="text-black hover:opacity-70 font-bold transition-all underline underline-offset-2">Bikash</a>
            </p>
            <Button 
              onClick={() => setIsAboutOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 rounded-xl font-bold px-8 shadow-lg shadow-indigo-500/20"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
