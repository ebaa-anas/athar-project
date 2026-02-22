import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Mail, Lock, User, ArrowRight, X } from 'lucide-react';
import atharLogo from '../assets/athar-logo.png';
import { auth } from '../lib/firebase';
import { signUpVolunteer, loginUser, signUpOrganization } from '../lib/authService';
interface LoginSignupProps {
  onLogin: () => void;
  onClose: () => void;
  userType: 'volunteer' | 'organization' | 'admin';
}

export function LoginSignup({ onLogin, onClose, userType }: LoginSignupProps) {
  // --- STATE VARIABLES ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // New State for Sign Up
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [loading, setLoading] = useState(false);

  // --- THEME CONFIG ---
  const getTheme = () => {
    switch (userType) {
      case 'admin':
        return {
          sidePanel: 'bg-[#043E52]',
          button: 'bg-[#043E52] hover:bg-[#033040]',
          title: 'System Administration',
          desc: 'Secure access for platform management and oversight.',
          stats: [{ label: 'System Uptime', value: '99.9%' }, { label: 'Active Admins', value: '12' }, { label: 'Security Level', value: 'High' }]
        };
      case 'organization':
        return {
          sidePanel: 'bg-[#016A6D]',
          button: 'bg-[#016A6D] hover:bg-[#015052]',
          title: 'Organization Portal',
          desc: 'Manage your initiatives and connect with volunteers.',
          stats: [{ label: 'Organizations', value: '800+' }, { label: 'Opportunities', value: '5k+' }, { label: 'Impact Hours', value: '1.2M' }]
        };
      default: // Volunteer
        return {
          sidePanel: 'bg-[#1C9290]',
          button: 'bg-[#1C9290] hover:bg-[#157a78]',
          title: 'Volunteer Community',
          desc: 'Join thousands making a real difference every day.',
          stats: [{ label: 'Volunteers', value: '15k+' }, { label: 'Events', value: '250+' }, { label: 'Communities', value: '81' }]
        };
    }
  };

  const theme = getTheme();

  // --- HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);
    
    // Use our new loginUser function
    const result = await loginUser(loginEmail, loginPassword);

    if (result.success) {
      // THE MAGIC AUTHORIZATION LOCK
      if (result.role !== userType) {
        alert(`Access Denied: You are registered as a ${result.role}, not an ${userType}.`);
        auth.signOut(); // Kick them back out of Firebase session
      } else {
        onLogin(); // Roles match, let them in!
      }
    } else {
      alert("Login Failed: " + result.error);
    }
    setLoading(false);
  };

  // MISSING FUNCTION RESTORED HERE:
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!signupName || !signupEmail || !signupPass) {
      alert("Please fill in all fields");
      setLoading(false);
      return;
    }

    let success = false;

    // The Magic Switch: Check which portal they are trying to use
    if (userType === 'organization') {
      success = await signUpOrganization(signupEmail, signupPass, signupName);
    } else {
      success = await signUpVolunteer(signupEmail, signupPass, signupName);
    }

    if (success) {
      alert("Account Created Successfully! You can now log in.");
      // Optional: switch to login tab programmatically if we had a state for the tab
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex relative">
      
      {/* EXIT BUTTON */}
      <Button 
        variant="ghost" size="icon" onClick={onClose}
        className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full h-10 w-10 transition-colors"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* LEFT SIDE: Visual Brand Panel */}
      <div className={`hidden lg:flex w-1/2 ${theme.sidePanel} relative overflow-hidden flex-col justify-between p-12 text-white`}>
        <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <img src={atharLogo} alt="Athar" className="w-8 h-8 brightness-0 invert" />
            </div>
            <span className="text-2xl font-bold tracking-wide">Athar</span>
        </div>

        <div className="relative z-10 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight mb-6">{theme.title}</h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">{theme.desc}</p>
            <div className="flex gap-8 border-t border-white/20 pt-8">
                {theme.stats.map((stat, idx) => (
                    <div key={idx}>
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-sm text-white/60 uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className="relative z-10 text-sm text-white/40">© 2026 Athar Platform. Secure Connection.</div>
      </div>

      {/* RIGHT SIDE: The Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            
            <div className="lg:hidden flex justify-center mb-8">
                <img src={atharLogo} alt="Athar" className="w-12 h-12" />
            </div>

            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900">Get Started</h2>
                <p className="text-slate-500 mt-2">Enter your credentials to access your account</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white shadow-sm">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white shadow-sm">Sign Up</TabsTrigger>
                </TabsList>

                {/* LOGIN FORM */}
                <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input 
                                    id="email" type="email" placeholder="name@example.com" 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                                    value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
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
                                    id="password" type="password" placeholder="••••••••" 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button type="submit" className={`w-full h-11 ${theme.button} text-white`}>
                            Sign In <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </TabsContent>

                {/* SIGN UP FORM */}
                <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name / Organization Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input 
                                    id="name" 
                                    placeholder="e.g. John Doe or Red Crescent" 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                                    value={signupName} 
                                    onChange={(e) => setSignupName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input 
                                    id="signup-email" 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                                    value={signupEmail} 
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-pass">Create Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input 
                                    id="signup-pass" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                                    value={signupPass} 
                                    onChange={(e) => setSignupPass(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className={`w-full h-11 ${theme.button} text-white`}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>

            <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50">Google</Button>
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50">Facebook</Button>
            </div>

        </div>
      </div>
    </div>
  );
}