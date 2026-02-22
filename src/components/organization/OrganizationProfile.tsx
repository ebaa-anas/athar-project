import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { 
  Mail, Phone, MapPin, Globe, Edit3, Save, CheckCircle2, ShieldCheck, 
  Users2, Timer, Library, Landmark, AlertCircle, FileText, 
  ChevronRight, Fingerprint, Activity, Handshake, Scale, Building2, Gavel
} from 'lucide-react';

// --- DATABASE HOOKS ---
import { useUserProfile } from '../../hooks/useUserProfile';
import { updateOrganizationProfile, submitVerificationRequest } from '../../lib/authService';

export function OrganizationProfile() {
  const { user, loading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '', tagline: '', email: '', phone: '', website: '',
    address: '', city: '', country: '', description: '', mission: '',
    impactSummary: '0 projects verified.', category: 'Non-Profit Organization'
  });

  const [verifyForm, setVerifyForm] = useState({
    legalName: '', regNumber: '', foundingDate: '', 
    taxStatus: 'NGO', boardHead: '', boardMembers: '',
    safetyPolicy: '', financialYearEnd: '', liabilityInsurance: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '', tagline: user.tagline || '', email: user.email || '',
        phone: user.phone || '', website: user.website || '', address: user.address || '',
        city: user.city || '', country: user.country || '', description: user.description || '',
        mission: user.mission || '', impactSummary: user.impactSummary || '',
        category: user.category || 'Non-Profit'
      });
    }
  }, [user]);

  const isVerified = user?.verified || false;
  const vStatus = user?.verificationStatus || "unverified";

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await updateOrganizationProfile(user.uid, profileData);
    setIsEditing(false);
    setIsSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-[#043E52]">SYNCING SECURE DATA...</div>;

  return (
    <div className="bg-[#f1f5f9] min-h-screen pb-20 font-sans">
      
      {/* 1. PROFESSIONAL HERO BLOCK */}
      <div className="bg-[#043E52] pt-16 pb-24 px-6 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          <Avatar className="w-40 h-40 border-8 border-white shadow-2xl rounded-[2.5rem] bg-white">
            <AvatarImage src={user?.photoUrl} className="object-cover" />
            <AvatarFallback className="bg-slate-200 text-[#043E52] text-4xl font-black">ORG</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left text-white">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-4xl font-black tracking-tight uppercase italic">{profileData.name || "UNREGISTERED ENTITY"}</h1>
              {isVerified && <Badge className="bg-[#1C9290] py-1">TRUSTED</Badge>}
            </div>
            <p className="text-white/60 text-lg font-medium">{profileData.tagline || "Compliance Status: Audit Pending"}</p>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold h-12 px-6 rounded-xl backdrop-blur-md">
                <Edit3 className="mr-2 h-4 w-4" /> MANAGE PROFILE
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="bg-[#1C9290] hover:bg-[#157a78] text-white font-black h-12 px-8 rounded-xl shadow-lg transition-all active:scale-95">
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "SYNCING..." : "PUBLISH CHANGES"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 -mt-10 relative z-20">
        
        {/* 2. MAIN CONTENT (PUBLIC VIEW PREVIEW) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
               <div className="flex items-center gap-2 mb-2">
                 <Activity className="h-5 w-5 text-[#1C9290]" />
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Public Information</span>
               </div>
               <CardTitle className="text-2xl font-black text-[#043E52]">Organizational Charter</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="space-y-3">
                  <Label className="font-black text-[#043E52] text-xs uppercase tracking-tighter">About the Entity</Label>
                  {isEditing ? (
                    <Textarea value={profileData.description} onChange={(e)=>setProfileData({...profileData, description: e.target.value})} className="bg-slate-50 border-none p-6 text-lg min-h-[150px] rounded-2xl" />
                  ) : (
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">{profileData.description || "Charter details not provided."}</p>
                  )}
               </div>
               <Separator />
               <div className="space-y-3">
                  <Label className="font-black text-[#043E52] text-xs uppercase tracking-tighter">Legal Mission Statement</Label>
                  {isEditing ? (
                    <Input value={profileData.mission} onChange={(e)=>setProfileData({...profileData, mission: e.target.value})} className="bg-slate-50 border-none h-14 px-6 rounded-xl" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-800 italic">"{profileData.mission || "Mission statement pending review."}"</p>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* IMPACT DATA GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Hours', val: '0', icon: Timer, color: 'text-teal-600', bg: 'bg-teal-50' },
               { label: 'Projects', val: '0', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
               { label: 'Members', val: '0', icon: Users2, color: 'text-blue-600', bg: 'bg-blue-50' },
               { label: 'Ranking', val: 'N/A', icon: Scale, color: 'text-slate-600', bg: 'bg-slate-50' }
             ].map((m, i) => (
               <Card key={i} className="border-none shadow-sm p-5 text-center flex flex-col items-center gap-2 rounded-2xl bg-white">
                  <div className={`p-2 rounded-lg ${m.bg}`}><m.icon className={`h-5 w-5 ${m.color}`} /></div>
                  <div className="text-2xl font-black text-[#043E52]">{m.val}</div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{m.label}</div>
               </Card>
             ))}
          </div>
        </div>

        {/* 3. SIDEBAR (GOVERNANCE & ACTIONS) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className={`border-none shadow-xl rounded-[2rem] overflow-hidden ${isVerified ? 'bg-[#1C9290] text-white' : 'bg-white'}`}>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <ShieldCheck className={`h-10 w-10 ${isVerified ? 'text-white' : 'text-orange-500 animate-pulse'}`} />
                <Badge variant="outline" className={isVerified ? 'text-white border-white' : 'text-orange-600 border-orange-200'}>LEVEL 1</Badge>
              </div>
              
              {isVerified ? (
                <div className="space-y-4">
                   <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Identity Confirmed</h3>
                   <p className="text-white/80 text-sm leading-relaxed">This entity is legally authorized for public operations under Government Framework v4.0.</p>
                </div>
              ) : vStatus === "pending" ? (
                <div className="space-y-4">
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Audit in Progress</h3>
                   <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                      <Timer className="h-5 w-5 text-orange-600 animate-spin-slow" />
                      <span className="text-[10px] font-black uppercase text-orange-800">Review Estimated: 48-72h</span>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-[#043E52] uppercase tracking-tighter leading-none">Unverified Entity</h3>
                  <p className="text-xs text-slate-400 font-medium">To unlock project publishing, you must complete the rigorous Government Verification audit.</p>
                  <Button onClick={() => setShowVerifyModal(true)} className="w-full bg-[#043E52] text-white font-black h-14 rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
                    START AUDIT NOW
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* PUBLIC CTAS */}
          <div className="space-y-3">
             <Button className="w-full justify-between bg-white border border-slate-200 text-[#043E52] font-black h-16 px-6 rounded-2xl hover:bg-slate-50 shadow-sm group">
                VOLUNTEER WITH US <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#1C9290] transition-colors" />
             </Button>
             <Button className="w-full justify-between bg-white border border-slate-200 text-[#043E52] font-black h-16 px-6 rounded-2xl hover:bg-slate-50 shadow-sm group">
                PARTNER WITH US <Handshake className="h-5 w-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
             </Button>
          </div>

          <Card className="border-none shadow-sm rounded-2xl p-6 space-y-4">
             <div className="flex items-center gap-3 text-sm font-bold text-slate-600"><Globe className="h-4 w-4 text-[#043E52]" /> {profileData.website || "Domain Pending"}</div>
             <div className="flex items-center gap-3 text-sm font-bold text-slate-600"><Mail className="h-4 w-4 text-[#043E52]" /> {profileData.email}</div>
             <Separator />
             <div className="flex items-start gap-3 text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest"><MapPin className="h-4 w-4 text-[#043E52]" /> {profileData.address || "HQ Not Logged"}</div>
          </Card>
        </div>
      </div>

      {/* --- 4. THE COMPREHENSIVE GOVERNMENT AUDIT MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#043E52]/95 backdrop-blur-xl p-4 overflow-y-auto">
          <Card className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-none my-auto">
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Sidebar */}
              <div className="w-full md:w-[30%] bg-[#043E52] p-12 text-white flex flex-col justify-between overflow-hidden relative">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#1C9290]/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <Fingerprint className="h-16 w-16 text-[#1C9290] mb-8" />
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">Official<br/>Audit Portal</h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Compliance Framework v4.2</p>
                </div>
                <div className="space-y-4 relative z-10 text-[10px] font-bold text-[#1C9290]">
                   <p className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Secure Data Encryption</p>
                   <p className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Ministry Audit Ready</p>
                </div>
              </div>

              {/* Rigorous Form Content */}
              <div className="flex-1 p-12 overflow-y-auto space-y-10">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Legal Registered Entity Name</Label>
                       <Input className="h-14 bg-slate-50 border-none font-bold px-6 rounded-xl" placeholder="Full Registered Name" />
                    </div>
                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">NGO / License ID Number</Label>
                       <Input className="h-14 bg-slate-50 border-none font-bold px-6 rounded-xl" placeholder="NGO-TAX-XXXXXX" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Head of Board / Chairperson</Label>
                       <Input className="h-12 bg-slate-50 border-none px-4 rounded-xl" placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Financial Year-End</Label>
                       <Input type="date" className="h-12 bg-slate-50 border-none px-4 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Founding Date</Label>
                       <Input type="date" className="h-12 bg-slate-50 border-none px-4 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Current Board Members & Legal Officers</Label>
                     <Textarea className="bg-slate-50 border-none p-6 rounded-xl text-sm h-24" placeholder="List names of primary stakeholders and legal officers..." />
                  </div>

                  <div className="space-y-2">
                     <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Safety, Vetting & Liability Policy</Label>
                     <Textarea className="bg-slate-50 border-none p-6 rounded-xl text-sm h-32 leading-relaxed" placeholder="Describe background check protocols and volunteer protection frameworks in detail..." />
                  </div>

                  <div className="flex items-center space-x-4 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                     <FileText className="h-10 w-10 text-slate-300" />
                     <div>
                        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Upload Legal Charter / Registration PDF</p>
                        <p className="text-[10px] text-slate-400 font-medium">Max size: 10MB. Format: PDF only.</p>
                     </div>
                  </div>

                  {/* LEGAL CONSENT BLOCK */}
                  <div className="bg-[#043E52]/5 rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center gap-3 text-[#043E52]">
                       <Gavel className="h-6 w-6" />
                       <h3 className="text-lg font-black uppercase tracking-tighter">Regulatory Terms & Consent</h3>
                    </div>
                    <div className="h-40 overflow-y-auto pr-4 text-[11px] font-medium text-slate-600 leading-relaxed space-y-4">
                       <p><strong>1. Verification Authority:</strong> By submitting this audit, the Organization grants Athar explicit permission to verify legal standings with national regulatory bodies.</p>
                       <p><strong>2. Operational Accountability:</strong> The Organization assumes full liability for all field operations. Verified status does not transfer liability to the Athar platform.</p>
                       <p><strong>3. Vetting Requirements:</strong> The Organization certifies that all personnel working with minors or vulnerable groups have undergone a certified National Police Clearance.</p>
                       <p><strong>4. Misrepresentation:</strong> Any false claims regarding tax status or board composition will result in immediate permanent expulsion and reporting to the Ministry.</p>
                       <p><strong>5. Data Retention:</strong> All audit documentation is stored on an encrypted server and shared only with government-authorized auditors.</p>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                       <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c)=>setAgreedToTerms(c as boolean)} className="h-6 w-6 border-[#1C9290] data-[state=checked]:bg-[#1C9290]" />
                       <label htmlFor="terms" className="text-[10px] font-black text-[#043E52] uppercase tracking-[0.1em] cursor-pointer">I legally certify that I have read and agree to all operational regulations.</label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8">
                  <Button variant="ghost" className="text-slate-400 font-black text-[10px] uppercase tracking-widest" onClick={() => setShowVerifyModal(false)}>Discard Application</Button>
                  <Button 
                    disabled={!agreedToTerms}
                    className="bg-[#043E52] hover:bg-black text-white font-black px-12 h-16 rounded-2xl shadow-2xl transition-all"
                    onClick={() => {
                        alert("Application Submitted to Government Queue.");
                        setShowVerifyModal(false);
                    }}
                  >
                    LEGALLY SUBMIT AUDIT
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}