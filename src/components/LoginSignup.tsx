import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Mail, Lock, User, ArrowRight, X, ShieldAlert, Eye, EyeOff, Building2, Phone, CheckSquare } from 'lucide-react';
import atharLogo from '../assets/athar-logo.png';
import { auth } from '../lib/firebase';
import { signUpVolunteer, loginUser, signUpOrganization, loginWithGoogle, friendlyAuthError } from '../lib/authService';
import { sendPasswordResetEmail } from 'firebase/auth'; 

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
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // State for 3-Tier Architecture 
  const [orgTier, setOrgTier] = useState('tier1'); 
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Single inline banner for auth feedback (replaces scattered alert() calls so
  // failures are always shown to the user, with a clear message).
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // --- THEME CONFIG ---
  const getTheme = () => {
    switch (userType) {
      case 'admin':
        return {
          sidePanel: 'bg-slate-900',
          button: 'bg-role-admin-accent hover:bg-role-admin-accent-dark text-slate-900',
          accentText: 'text-role-admin-accent',
          title: 'System Administration',
          desc: 'Secure access for platform management and oversight.',
          stats: [{ label: 'System Uptime', value: '99.9%' }, { label: 'Active Admins', value: '12' }, { label: 'Security Level', value: 'High' }]
        };
      case 'organization':
        return {
          sidePanel: 'bg-role-org',
          button: 'bg-role-org hover:bg-role-org-dark text-white',
          accentText: 'text-role-org',
          title: 'Organization Portal',
          desc: 'Manage your initiatives and connect with volunteers.',
          stats: [{ label: 'Organizations', value: '800+' }, { label: 'Opportunities', value: '5k+' }, { label: 'Impact Hours', value: '1.2M' }]
        };
      default: // Volunteer
        return {
          sidePanel: 'bg-role-volunteer',
          button: 'bg-role-volunteer hover:bg-role-volunteer-dark text-white',
          accentText: 'text-role-volunteer',
          title: 'Volunteer Community',
          desc: 'Join thousands making a real difference every day.',
          stats: [{ label: 'Volunteers', value: '15k+' }, { label: 'Events', value: '250+' }, { label: 'Communities', value: '81' }]
        };
    }
  };

  const theme = getTheme();

  // --- HANDLERS ---
  const roleLabel = (role: string) =>
    role === 'admin' ? 'an administrator' : `a ${role}`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!loginEmail || !loginPassword) {
      setFeedback({ type: 'error', text: 'Please enter your email and password.' });
      return;
    }

    setLoading(true);
    const result = await loginUser(loginEmail, loginPassword);

    if (result.success) {
      if (result.role !== userType) {
        setFeedback({
          type: 'error',
          text: `This account is registered as ${roleLabel(result.role)}, not ${roleLabel(userType)}. Please use the correct portal.`,
        });
        auth.signOut();
      } else {
        onLogin();
      }
    } else {
      setFeedback({ type: 'error', text: result.error || 'Login failed. Please try again.' });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Core Form Validation — same lightweight set for volunteers and every org
    // tier. Legal details (tax ID, documents) are collected later, only for the
    // tiers that need verifying.
    if (!signupName || !signupEmail || !signupPass || !confirmPass || !signupPhone) {
      setFeedback({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    if (signupPass !== confirmPass) {
      setFeedback({ type: 'error', text: 'Passwords do not match. Please re-enter them.' });
      return;
    }

    if (!acceptTerms) {
      setFeedback({ type: 'error', text: 'You must agree to the Terms of Service and Data Privacy Policy.' });
      return;
    }

    setLoading(true);

    const result = userType === 'organization'
      ? await signUpOrganization(signupEmail, signupPass, signupName, orgTier, signupPhone)
      : await signUpVolunteer(signupEmail, signupPass, signupName, signupPhone);

    if (result.success) {
      setFeedback({ type: 'success', text: 'Account created successfully! Switch to the Login tab to sign in.' });
    } else {
      setFeedback({ type: 'error', text: result.error || 'Sign up failed. Please try again.' });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!loginEmail) {
      setFeedback({ type: 'error', text: "Enter your email in the Email field above, then click 'Forgot password?'." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setFeedback({ type: 'success', text: 'Password reset email sent. Check your inbox and spam folder.' });
    } catch (error: any) {
      setFeedback({ type: 'error', text: friendlyAuthError(error) });
    }
  };

  const handleSocialLogin = async () => {
    setFeedback(null);
    if (userType === 'admin') {
        return;
    }
    setLoading(true);

    const result = await loginWithGoogle(userType);
    if (result.success) {
      onLogin();
    } else {
      setFeedback({ type: 'error', text: result.error || 'Google sign-in failed. Please try again.' });
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
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-5 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-auto">
            
            <div className="lg:hidden flex justify-center mb-8">
                <img src={atharLogo} alt="Athar" className="w-12 h-12" />
            </div>

            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900">
                  {userType === 'admin' ? 'Secure Access' : 'Get Started'}
                </h2>
                <p className="text-slate-500 mt-2">
                  {userType === 'admin'
                    ? 'Enter your administrative credentials'
                    : 'Enter your credentials to access your account'}
                </p>
            </div>

            {/* Inline auth feedback — shown for every login/signup failure */}
            {feedback && (
              <div
                role="alert"
                className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  feedback.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-green-200 bg-green-50 text-green-800'
                }`}
              >
                {feedback.type === 'error'
                  ? <ShieldAlert className="h-5 w-5 flex-none mt-0.5" />
                  : <CheckSquare className="h-5 w-5 flex-none mt-0.5" />}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* SMART RENDERING: Admins only get Login form */}
            {userType === 'admin' ? (
              <div className="mt-8">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-8 flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-role-admin-accent-dark" />
                  <p className="text-xs font-bold text-role-admin-accent-dark uppercase tracking-wider">Authorized Personnel Only</p>
                </div>
                
                {/* ADMIN LOGIN FORM */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email">Administrator Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input 
                                id="email" type="email" placeholder="admin@athar.gov" 
                                className="pl-10 h-11 bg-slate-50 border-slate-200"
                                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password">Secure Password</Label>
                            <a href="#" onClick={handleForgotPassword} className="text-xs font-semibold text-role-admin-accent-dark hover:text-role-admin-accent">Forgot password?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input 
                                id="password" 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200" 
                                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className={`w-full h-11 ${theme.button}`}>
                        {loading ? 'Authenticating...' : 'Secure Login'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full" onValueChange={() => setFeedback(null)}>
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100 p-1 rounded-xl">
                      <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white shadow-sm">Login</TabsTrigger>
                      <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white shadow-sm">Sign Up</TabsTrigger>
                  </TabsList>

                  {/* STANDARD LOGIN FORM */}
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
                                  <a href="#" onClick={handleForgotPassword} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Forgot password?</a>
                              </div>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                  <Input 
                                      id="password" 
                                      type={showPassword ? "text" : "password"} 
                                      placeholder="••••••••" 
                                      className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200"
                                      value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                              </div>
                          </div>
                          <Button type="submit" disabled={loading} className={`w-full h-11 ${theme.button}`}>
                              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                      </form>
                  </TabsContent>

                  {/* SIGN UP FORM */}
                  <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                          
                          {/* Row 1: Full Name */}
                          <div className="space-y-2">
                              <Label htmlFor="name">{userType === 'organization' ? 'Organization Name' : 'Full Legal Name'}</Label>
                              <div className="relative">
                                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                  <Input 
                                      id="name" 
                                      placeholder={userType === 'organization' ? 'e.g. Red Crescent' : 'e.g. John Doe'} 
                                      className="pl-10 h-11 bg-slate-50 border-slate-200"
                                      value={signupName} 
                                      onChange={(e) => setSignupName(e.target.value)}
                                  />
                              </div>
                          </div>

                          {/* Row 2: Grid for Email & Phone */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Official Email</Label>
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
                                <Label htmlFor="signup-phone">Contact Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        id="signup-phone" 
                                        type="tel" 
                                        placeholder="+90 5XX XXX XX XX" 
                                        className="pl-10 h-11 bg-slate-50 border-slate-200"
                                        value={signupPhone} 
                                        onChange={(e) => setSignupPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                          </div>

                          {/* Row 3: Entity Classification (Only renders for Organizations).
                              This is all we ask an organization for up front — Tier 1
                              is ready to go, Tier 2/3 supply legal details when they
                              start verification. */}
                          {userType === 'organization' && (
                            <div className="space-y-2">
                                <Label htmlFor="org-tier">Entity Classification</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <select
                                        id="org-tier"
                                        value={orgTier}
                                        onChange={(e) => setOrgTier(e.target.value)}
                                        className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-role-org appearance-none"
                                    >
                                        <option value="tier1">Tier 1: Student Club / Youth Forum</option>
                                        <option value="tier2">Tier 2: Society / Standard NGO</option>
                                        <option value="tier3">Tier 3: Disaster Response NGO</option>
                                    </select>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Tier 2 and Tier 3 entities complete a document review before posting opportunities.
                                </p>
                            </div>
                          )}

                          {/* Row 4: Grid for Passwords */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-pass">Create Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        id="signup-pass" 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200"
                                        value={signupPass} 
                                        onChange={(e) => setSignupPass(e.target.value)}
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-pass">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        id="confirm-pass" 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200"
                                        value={confirmPass} 
                                        onChange={(e) => setConfirmPass(e.target.value)}
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                          </div>

                          {/* Row 5: Terms and Conditions */}
                          <div className="flex items-start space-x-3 pt-2">
                              <button 
                                type="button" 
                                onClick={() => setAcceptTerms(!acceptTerms)}
                                className="mt-0.5 focus:outline-none"
                              >
                                {acceptTerms ? (
                                  <CheckSquare className={`h-5 w-5 ${theme.accentText}`} />
                                ) : (
                                  <div className="h-5 w-5 border-2 border-slate-300 rounded-[4px]" />
                                )}
                              </button>
                              <Label className="text-xs text-slate-500 leading-tight cursor-pointer" onClick={() => setAcceptTerms(!acceptTerms)}>
                                I certify that the information provided is accurate and agree to the
                                <span className={`${theme.accentText} font-semibold hover:underline mx-1`}>Terms of Service</span>
                                and
                                <span className={`${theme.accentText} font-semibold hover:underline ml-1`}>Data Privacy Policy</span>
                                regarding security vetting.
                              </Label>
                          </div>

                          <Button type="submit" disabled={loading} className={`w-full h-11 mt-4 ${theme.button}`}>
                              {loading ? "Processing Secure Verification..." : "Submit Registration Request"}
                          </Button>
                      </form>
                  </TabsContent>
              </Tabs>
            )}

            {/* Social Logins */}
            {userType !== 'admin' && (
              <>
                <div className="relative mt-8">
                    <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span></div>
                </div>

                <div className="mt-6 flex justify-center">
                    <Button 
                      type="button"
                      onClick={handleSocialLogin} 
                      disabled={loading}
                      variant="outline" 
                      className="w-full max-w-xs h-11 border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold text-slate-600 transition-all active:scale-[0.98]"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" alt="Google" />
                      Sign in with Google
                    </Button>
                </div>
              </>
            )}

        </div>
      </div>
    </div>
  );
}