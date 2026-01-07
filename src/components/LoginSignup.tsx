import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import atharLogo from '../assets/athar-logo.png';

interface LoginSignupProps {
  onLogin: () => void;
  onClose: () => void; // <--- 1. Added Exit Function
  userType: 'volunteer' | 'organization' | 'admin';
}

export function LoginSignup({ onLogin, onClose, userType }: LoginSignupProps) {
  // State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Theme Configuration
  const getTheme = () => {
    switch (userType) {
      case 'admin':
        return {
          sidePanel: 'bg-[#043E52]', // Nile Blue (Professional/Authority)
          accent: 'text-[#E16A3D]', // Sunset Orange (Alert/Action)
          button: 'bg-[#043E52] hover:bg-[#033040]',
          title: 'System Administration',
          desc: 'Secure access for platform management and oversight.',
          stats: [
            { label: 'System Uptime', value: '99.9%' },
            { label: 'Active Admins', value: '12' },
            { label: 'Security Level', value: 'High' }
          ]
        };
      case 'organization':
        return {
          sidePanel: 'bg-[#016A6D]', // Pine (Growth/Stability)
          accent: 'text-white',
          button: 'bg-[#016A6D] hover:bg-[#015052]',
          title: 'Organization Portal',
          desc: 'Manage your initiatives and connect with volunteers.',
          stats: [
            { label: 'Organizations', value: '800+' },
            { label: 'Opportunities', value: '5k+' },
            { label: 'Impact Hours', value: '1.2M' }
          ]
        };
      default: // Volunteer
        return {
          sidePanel: 'bg-[#1C9290]', // Sea Green (Hope/Energy)
          accent: 'text-white',
          button: 'bg-[#1C9290] hover:bg-[#157a78]',
          title: 'Volunteer Community',
          desc: 'Join thousands making a real difference every day.',
          stats: [
            { label: 'Volunteers', value: '15k+' },
            { label: 'Events', value: '250+' },
            { label: 'Communities', value: '81' }
          ]
        };
    }
  };

  const theme = getTheme();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen w-full flex relative">
      
      {/* 2. ADDED EXIT BUTTON (Top Right) */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full h-10 w-10 transition-colors"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* LEFT SIDE: Visual Brand Panel (Unchanged) */}
      <div className={`hidden lg:flex w-1/2 ${theme.sidePanel} relative overflow-hidden flex-col justify-between p-12 text-white`}>
        
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <img src={atharLogo} alt="Athar" className="w-8 h-8 brightness-0 invert" />
            </div>
            <span className="text-2xl font-bold tracking-wide">Athar</span>
        </div>

        {/* Central Text */}
        <div className="relative z-10 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight mb-6">
                {theme.title}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
                {theme.desc}
            </p>
            
            {/* Quick Stats Row */}
            <div className="flex gap-8 border-t border-white/20 pt-8">
                {theme.stats.map((stat, idx) => (
                    <div key={idx}>
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-sm text-white/60 uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-white/40">
            © 2026 Athar Platform. Secure Connection.
        </div>
      </div>

      {/* RIGHT SIDE: The Form (Clean & Professional) */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            
            {/* Mobile Logo (Visible only on small screens) */}
            <div className="lg:hidden flex justify-center mb-8">
                <img src={atharLogo} alt="Athar" className="w-12 h-12" />
            </div>

            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900">Get Started</h2>
                <p className="text-slate-500 mt-2">Enter your credentials to access your account</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-xs font-semibold text-slate-500 hover:text-slate-800">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className={`w-full h-11 text-base font-semibold shadow-lg shadow-slate-200 transition-all active:scale-[0.98] ${theme.button} text-white`}>
                            Sign In <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="signup">
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input id="name" placeholder="John Doe" className="pl-10 h-11 bg-slate-50 border-slate-200" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input id="signup-email" type="email" placeholder="name@example.com" className="pl-10 h-11 bg-slate-50 border-slate-200" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-pass">Create Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input id="signup-pass" type="password" placeholder="••••••••" className="pl-10 h-11 bg-slate-50 border-slate-200" />
                            </div>
                        </div>

                        <Button type="submit" className={`w-full h-11 text-base font-semibold shadow-lg shadow-slate-200 transition-all active:scale-[0.98] ${theme.button} text-white`}>
                            Create Account
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>

            {/* Social Login Separator */}
            <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                </Button>
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                    <svg className="mr-2 h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    Facebook
                </Button>
            </div>

        </div>
      </div>
    </div>
  );
}