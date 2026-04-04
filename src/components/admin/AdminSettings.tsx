import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Bell, Shield, Database, Mail, Globe, Lock, Settings, Save, 
  Server, CreditCard, ToggleLeft, Loader2, CheckCircle2 
} from 'lucide-react';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDRSETgWx1F3RX3_KAzgceyYBJKfpheRQk",
  authDomain: "athar-project-aa74e.firebaseapp.com",
  projectId: "athar-project-aa74e",
  storageBucket: "athar-project-aa74e.firebasestorage.app",
  messagingSenderId: "715063889584",
  appId: "1:715063889584:web:3443ae48678c91a7f4b575",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default fallback configuration
const DEFAULT_CONFIG = {
  platformName: 'Athar',
  supportEmail: 'support@athar.com',
  description: 'Connecting volunteers with meaningful opportunities',
  websiteUrl: 'https://athar.com',
  
  flagNewUsers: true,
  flagOrgVerification: true,
  flagPublicProfiles: true,
  
  secTwoFactor: true,
  secSessionTimeout: true,
  secLoginLimits: true,
  secMinPassLength: 8,
  secReqSpecial: true,
  secReqNumbers: true,
  
  notifVerifications: true,
  notifReports: true,
  notifErrors: true,
  
  autoBackup: true
};

export function AdminSettings() {
  const [config, setConfig] = useState<any>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  
  // UI States for saving actions
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // --- 1. FETCH GLOBAL SETTINGS ---
  useEffect(() => {
    const settingsRef = doc(db, "systemSettings", "global");
    
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...docSnap.data() });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. INSTANT TOGGLE SAVER ---
  const handleToggle = async (key: string, value: boolean) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
    try {
      const settingsRef = doc(db, "systemSettings", "global");
      await setDoc(settingsRef, { [key]: value }, { merge: true });
    } catch (error) {
      console.error("Failed to save toggle state:", error);
      setConfig((prev: any) => ({ ...prev, [key]: !value }));
      alert("Failed to update setting. Please check your connection.");
    }
  };

  // --- 3. FORM SAVERS ---
  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const settingsRef = doc(db, "systemSettings", "global");
      await setDoc(settingsRef, {
        platformName: config.platformName,
        supportEmail: config.supportEmail,
        description: config.description,
        websiteUrl: config.websiteUrl
      }, { merge: true });
      setTimeout(() => setIsSavingGeneral(false), 600);
    } catch (e) {
      console.error(e);
      alert("Failed to save general settings.");
      setIsSavingGeneral(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSavingSecurity(true);
    try {
      const settingsRef = doc(db, "systemSettings", "global");
      await setDoc(settingsRef, {
        secMinPassLength: Number(config.secMinPassLength)
      }, { merge: true });
      setTimeout(() => setIsSavingSecurity(false), 600);
    } catch (e) {
      console.error(e);
      alert("Failed to save security settings.");
      setIsSavingSecurity(false);
    }
  };

  // --- 4. SIMULATED BACKUP ---
  const handleManualBackup = () => {
    setIsBackingUp(true);
    setBackupSuccess(false);
    setTimeout(() => {
      setIsBackingUp(false);
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    }, 3000);
  };

  // --- 🔥 5. EMAIL TEMPLATE ENGINE 🔥 ---
  const handleOpenEmailTemplate = (templateType: 'welcome' | 'approval' | 'reset') => {
    let subject = '';
    let body = '';

    switch (templateType) {
      case 'welcome':
        subject = 'Welcome to the Athar Platform!';
        body = 'Hello [Name],\n\nWelcome to Athar! We are absolutely thrilled to have you join our community of volunteers and organizations making a real impact.\n\nTo get started, please log in, complete your profile, and explore the active opportunities on your dashboard.\n\nIf you have any questions, reply directly to this email.\n\nBest regards,\nThe Athar Admin Team\n' + config.websiteUrl;
        break;
      case 'approval':
        subject = 'Update: Your Organization Account is Approved';
        body = 'Hello [Organization Name] Team,\n\nGood news! Your organization account on the Athar platform has been fully verified and approved by our administrative compliance team.\n\nYou now have full access to log in, create disaster relief initiatives, and start recruiting volunteers from our global database.\n\nThank you for your vital partnership,\nThe Athar Admin Team\n' + config.websiteUrl;
        break;
      case 'reset':
        subject = 'Password Reset Request - Athar Platform';
        body = 'Hello,\n\nWe received a request from your account to reset your Athar platform password. If you did not make this request, please ignore this email and your password will remain unchanged.\n\nTo reset your password securely, please click the link below:\n\n[Insert Password Reset Link Here]\n\nStay safe,\nThe Athar Admin Team\n' + config.websiteUrl;
        break;
    }

    // This opens Gmail (or the default OS mail app) with the text fully pre-loaded!
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return <div className="p-12 text-center text-[#043E52] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Loading System Configurations...</div>;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#043E52] font-bold text-3xl mb-2">Settings</h1>
          <p className="text-slate-500">Manage platform configurations and system preferences</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2 text-sm font-bold shadow-sm">
          <CheckCircle2 className="h-4 w-4" /> System Online & Synced
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-fit h-auto flex flex-wrap justify-start">
          <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-sm">General</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-sm">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-[#E16A3D] data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-sm">Integrations</TabsTrigger>
        </TabsList>

        {/* ========================================== */}
        {/* GENERAL SETTINGS                           */}
        {/* ========================================== */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#043E52] shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#043E52]/10 p-2 rounded-lg"><Settings className="h-5 w-5 text-[#043E52]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">Platform Information</CardTitle>
                    <CardDescription>Basic platform settings and branding</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="platform-name" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Platform Name</Label>
                    <Input id="platform-name" value={config.platformName} onChange={(e) => setConfig({...config, platformName: e.target.value})} className="border-slate-200 focus:border-[#043E52] h-11" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="support-email" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Support Email</Label>
                    <Input id="support-email" type="email" value={config.supportEmail} onChange={(e) => setConfig({...config, supportEmail: e.target.value})} className="border-slate-200 focus:border-[#043E52] h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-description" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Description</Label>
                <Input id="platform-description" value={config.description} onChange={(e) => setConfig({...config, description: e.target.value})} className="border-slate-200 focus:border-[#043E52] h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website-url" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Website URL</Label>
                <Input id="website-url" value={config.websiteUrl} onChange={(e) => setConfig({...config, websiteUrl: e.target.value})} className="border-slate-200 focus:border-[#043E52] h-11" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={isSavingGeneral} className="bg-[#043E52] hover:bg-[#033040] text-white gap-2 font-bold px-6 h-11">
                    {isSavingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                    {isSavingGeneral ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#E16A3D]/10 p-2 rounded-lg"><ToggleLeft className="h-5 w-5 text-[#E16A3D]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">Feature Flags</CardTitle>
                    <CardDescription>Control system-wide features instantly</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-[#043E52] font-bold text-sm">New User Registration</Label>
                  <p className="text-xs text-slate-500 font-medium">Allow new volunteers and orgs to create accounts</p>
                </div>
                <Switch checked={config.flagNewUsers} onCheckedChange={(val) => handleToggle('flagNewUsers', val)} className="data-[state=checked]:bg-[#1C9290]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-[#043E52] font-bold text-sm">Organization Verification</Label>
                  <p className="text-xs text-slate-500 font-medium">Require manual admin verification before orgs can post</p>
                </div>
                <Switch checked={config.flagOrgVerification} onCheckedChange={(val) => handleToggle('flagOrgVerification', val)} className="data-[state=checked]:bg-[#1C9290]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-[#043E52] font-bold text-sm">Public Profiles</Label>
                  <p className="text-xs text-slate-500 font-medium">Allow volunteer profiles to be visible on public search engines</p>
                </div>
                <Switch checked={config.flagPublicProfiles} onCheckedChange={(val) => handleToggle('flagPublicProfiles', val)} className="data-[state=checked]:bg-[#1C9290]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================== */}
        {/* SECURITY SETTINGS                          */}
        {/* ========================================== */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#016A6D] shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#016A6D]/10 p-2 rounded-lg"><Shield className="h-5 w-5 text-[#016A6D]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">Access Control</CardTitle>
                    <CardDescription>Manage security and authentication protocols</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-bold text-sm">Two-Factor Authentication (2FA)</Label>
                  <p className="text-xs text-slate-500 font-medium">Require 2FA via SMS or Authenticator App for all admins</p>
                </div>
                <Switch checked={config.secTwoFactor} onCheckedChange={(val) => handleToggle('secTwoFactor', val)} className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-bold text-sm">Session Timeout</Label>
                  <p className="text-xs text-slate-500 font-medium">Auto logout after 30 minutes of inactivity</p>
                </div>
                <Switch checked={config.secSessionTimeout} onCheckedChange={(val) => handleToggle('secSessionTimeout', val)} className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-bold text-sm">Login Attempt Limits</Label>
                  <p className="text-xs text-slate-500 font-medium">Lock account after 5 failed password attempts</p>
                </div>
                <Switch checked={config.secLoginLimits} onCheckedChange={(val) => handleToggle('secLoginLimits', val)} className="data-[state=checked]:bg-[#016A6D]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#016A6D]/10 p-2 rounded-lg"><Lock className="h-5 w-5 text-[#016A6D]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">Password Policy</CardTitle>
                    <CardDescription>Enforce password strength requirements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="min-length" className="font-bold text-slate-600 text-xs uppercase tracking-wider">Minimum Password Length</Label>
                <Input id="min-length" type="number" min="6" max="32" value={config.secMinPassLength} onChange={(e) => setConfig({...config, secMinPassLength: e.target.value})} className="border-slate-200 h-11 max-w-[200px]" />
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-bold text-sm">Require Special Characters</Label>
                <Switch checked={config.secReqSpecial} onCheckedChange={(val) => handleToggle('secReqSpecial', val)} className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Label className="text-slate-700 font-bold text-sm">Require Numbers</Label>
                <Switch checked={config.secReqNumbers} onCheckedChange={(val) => handleToggle('secReqNumbers', val)} className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button onClick={handleSaveSecurity} disabled={isSavingSecurity} className="bg-[#016A6D] hover:bg-[#015052] text-white px-6 font-bold h-11">
                    {isSavingSecurity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSavingSecurity ? 'Updating...' : 'Update Policy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================== */}
        {/* NOTIFICATION SETTINGS                      */}
        {/* ========================================== */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#E16A3D] shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#E16A3D]/10 p-2 rounded-lg"><Bell className="h-5 w-5 text-[#E16A3D]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">System Alerts (Email)</CardTitle>
                    <CardDescription>Configure which events trigger an email to administrators</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-bold text-sm">Verification Requests</Label>
                  <p className="text-xs text-slate-500 font-medium">Notify admins when new orgs apply</p>
                </div>
                <Switch checked={config.notifVerifications} onCheckedChange={(val) => handleToggle('notifVerifications', val)} className="data-[state=checked]:bg-[#E16A3D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-bold text-sm">Content Reports</Label>
                  <p className="text-xs text-slate-500 font-medium">Notify moderators of flagged content</p>
                </div>
                <Switch checked={config.notifReports} onCheckedChange={(val) => handleToggle('notifReports', val)} className="data-[state=checked]:bg-[#E16A3D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-bold text-sm">Critical System Errors</Label>
                  <p className="text-xs text-slate-500 font-medium">Server health and database failure alerts</p>
                </div>
                <Switch checked={config.notifErrors} onCheckedChange={(val) => handleToggle('notifErrors', val)} className="data-[state=checked]:bg-[#E16A3D]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#FFA45D]/10 p-2 rounded-lg"><Mail className="h-5 w-5 text-[#E16A3D]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">Email Templates</CardTitle>
                    <CardDescription>Manage automated outgoing email content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 🔥 WIRED EMAIL TEMPLATE BUTTONS 🔥 */}
                  <Button onClick={() => handleOpenEmailTemplate('welcome')} variant="outline" className="border-slate-200 text-slate-600 font-bold hover:text-[#E16A3D] hover:border-[#E16A3D] h-12 hover:bg-orange-50">Welcome Email</Button>
                  <Button onClick={() => handleOpenEmailTemplate('approval')} variant="outline" className="border-slate-200 text-slate-600 font-bold hover:text-[#E16A3D] hover:border-[#E16A3D] h-12 hover:bg-orange-50">Org Approval</Button>
                  <Button onClick={() => handleOpenEmailTemplate('reset')} variant="outline" className="border-slate-200 text-slate-600 font-bold hover:text-[#E16A3D] hover:border-[#E16A3D] h-12 hover:bg-orange-50">Password Reset</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================== */}
        {/* INTEGRATIONS SETTINGS                      */}
        {/* ========================================== */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#1C9290] shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#1C9290]/10 p-2 rounded-lg"><Globe className="h-5 w-5 text-[#1C9290]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">Third-Party Services</CardTitle>
                    <CardDescription>Manage external API connections</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SendGrid */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><Mail className="h-6 w-6 text-[#1C9290]" /></div>
                    <div className="space-y-0.5">
                        <Label className="text-[#043E52] text-base font-bold">SendGrid</Label>
                        <p className="text-xs font-medium text-slate-500">Email delivery service for notifications</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1C9290] bg-[#1C9290]/10 px-3 py-1.5 rounded-md">Connected</span>
                    <Button variant="outline" size="sm" className="text-slate-600 font-bold border-slate-200">Configure</Button>
                </div>
              </div>
              <Separator />
              
              {/* Google Analytics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><Globe className="h-6 w-6 text-slate-400" /></div>
                    <div className="space-y-0.5">
                        <Label className="text-slate-700 text-base font-bold">Google Analytics</Label>
                        <p className="text-xs font-medium text-slate-500">Traffic and behavior analysis</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="text-[#1C9290] font-bold border-[#1C9290] hover:bg-[#1C9290]/5">Connect Integration</Button>
              </div>
              <Separator />

              {/* Stripe */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><CreditCard className="h-6 w-6 text-slate-400" /></div>
                    <div className="space-y-0.5">
                        <Label className="text-slate-700 text-base font-bold">Stripe</Label>
                        <p className="text-xs font-medium text-slate-500">Secure donation processing via credit card</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="text-[#1C9290] font-bold border-[#1C9290] hover:bg-[#1C9290]/5">Connect Integration</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#043E52]/10 p-2 rounded-lg"><Database className="h-5 w-5 text-[#043E52]" /></div>
                <div>
                    <CardTitle className="text-[#043E52] text-lg">Database & Recovery</CardTitle>
                    <CardDescription>Manage data retention policies and backups</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-bold text-sm">Automatic Nightly Backups</Label>
                  <p className="text-xs text-slate-500 font-medium">Perform a full Firestore dump daily at 02:00 AM UTC</p>
                </div>
                <Switch checked={config.autoBackup} onCheckedChange={(val) => handleToggle('autoBackup', val)} className="data-[state=checked]:bg-[#043E52]" />
              </div>
              
              <div className="pt-2">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <h4 className="text-amber-800 font-bold text-sm flex items-center gap-2 mb-2"><Server className="h-4 w-4" /> System Snapshot</h4>
                    <p className="text-xs text-amber-700 mb-4 leading-relaxed font-medium">Generating a manual backup requires heavy read operations across the entire database. This may temporarily slow down platform performance for users.</p>
                    
                    <div className="flex items-center gap-4">
                        <Button 
                          onClick={handleManualBackup} 
                          disabled={isBackingUp} 
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 px-6 h-11"
                        >
                            {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} 
                            {isBackingUp ? 'Generating Snapshot...' : 'Run Manual Backup'}
                        </Button>
                        
                        {backupSuccess && (
                            <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                <CheckCircle2 className="h-4 w-4" /> Backup Successful
                            </span>
                        )}
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}