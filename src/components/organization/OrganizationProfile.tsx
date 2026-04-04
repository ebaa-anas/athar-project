import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { 
  Mail, Phone, MapPin, Globe, Edit3, Save, CheckCircle2, ShieldCheck, 
  Users2, Timer, Activity, Scale, Fingerprint, FileText, Gavel,
  Camera, Loader2, Image as ImageIcon, Landmark, FileDigit, Building, 
  ShieldAlert, UploadCloud, Check, FileCheck, Shield
} from 'lucide-react';

import { useUserProfile } from '../../hooks/useUserProfile';
import { updateOrganizationProfile } from '../../lib/authService';

export function OrganizationProfile() {
  const { user, loading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // --- IMAGE UPLOAD STATES ---
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- AUDIT DOCUMENT UPLOAD STATES ---
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false); // 🔥 NEW STATE FOR SUBMISSION
  const [auditFiles, setAuditFiles] = useState<Record<string, string | null>>({
    incorporation: null,
    financial: null,
    safeguarding: null,
    insurance: null,
    signatoryId: null
  });

  const [profileData, setProfileData] = useState({
    name: '', tagline: '', email: '', phone: '', website: '',
    address: '', city: '', country: '', description: '', mission: '',
    impactSummary: '0 projects verified.', category: 'Non-Profit Organization',
    photoUrl: '', coverUrl: '',
    registrationId: '', yearFounded: '', boardMembers: '', safeguardingPolicy: ''
  });

  const [auditData, setAuditData] = useState({
    legalName: '', licenseId: '', headOfBoard: '', financialYear: '', 
    foundingDate: '', signatoryName: '', signatoryRole: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '', tagline: user.tagline || '', email: user.email || '',
        phone: user.phone || '', website: user.website || '', address: user.address || '',
        city: user.city || '', country: user.country || '', description: user.description || '',
        mission: user.mission || '', impactSummary: user.impactSummary || '',
        category: user.category || 'Non-Profit',
        photoUrl: user.photoUrl || user.logoUrl || '',
        coverUrl: user.coverUrl || '',
        registrationId: user.registrationId || '',
        yearFounded: user.yearFounded || '',
        boardMembers: user.boardMembers || '',
        safeguardingPolicy: user.safeguardingPolicy || ''
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

  const processImage = (file: File, isCover: boolean) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = isCover ? 1200 : 400; 
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
        img.onerror = (error) => reject(error);
      };
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingCover(true);

    try {
      const base64String = await processImage(file, type === 'cover');
      if (type === 'logo') {
        setProfileData(prev => ({ ...prev, photoUrl: base64String }));
        await updateOrganizationProfile(user.uid, { photoUrl: base64String, logoUrl: base64String });
      } else {
        setProfileData(prev => ({ ...prev, coverUrl: base64String }));
        await updateOrganizationProfile(user.uid, { coverUrl: base64String });
      }
    } catch (error) {
      alert("Failed to save image. Please try a smaller file.");
    } finally {
      setIsUploadingLogo(false);
      setIsUploadingCover(false);
    }
  };

  const handleAuditDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    
    // Simulate a secure server upload delay
    setTimeout(() => {
      setAuditFiles(prev => ({ ...prev, [docType]: file.name }));
      setUploadingDoc(null);
    }, 1500);
  };

  const areAllDocsUploaded = () => {
    return auditFiles.incorporation && auditFiles.financial && auditFiles.safeguarding && auditFiles.insurance && auditFiles.signatoryId;
  };

  // 🔥 NEW: THE SUBMISSION ENGINE 🔥
  const handleSubmitAudit = async () => {
    if (!user) return;
    setIsSubmittingAudit(true);
    try {
      // We pass the new audit data and flip the status to "pending"
      // This will instantly update the local UI and trigger the Admin Dashboard!
      await updateOrganizationProfile(user.uid, {
        verificationStatus: "pending",
        auditData: auditData,
        auditFiles: auditFiles, // In a real app, these would be Firebase Storage URLs
        auditSubmittedAt: new Date().toISOString()
      });
      
      alert("Audit Package securely transmitted to the Ministry Queue. You will be notified via email upon review completion.");
      setShowVerifyModal(false);
    } catch (error) {
      console.error("Error submitting audit:", error);
      alert("Failed to submit audit. Please check your connection.");
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-[#043E52] animate-pulse">SYNCING DATA...</div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-sans space-y-6">
      
      {/* --- 1. COMPACT PROFILE HEADER --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="h-32 md:h-48 w-full relative group/hero bg-[#043E52]">
          {profileData.coverUrl ? (
            <img src={profileData.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          )}
          
          <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
          <div className={`absolute top-3 right-4 z-20 transition-opacity duration-200 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover/hero:opacity-100'}`}>
             <Button onClick={() => coverInputRef.current?.click()} size="sm" variant="secondary" className="bg-white/90 hover:bg-white text-[#043E52] font-bold shadow-sm text-xs">
               {isUploadingCover ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1.5 h-3 w-3" />}
               Change Cover
             </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10 md:-mt-12 relative z-10">
            
            <div className="relative group inline-block shrink-0">
              <Avatar className="w-24 h-24 md:w-28 md:h-28 ring-4 ring-white bg-white shadow-sm rounded-xl">
                <AvatarImage src={profileData.photoUrl} className="object-cover rounded-xl bg-white" />
                <AvatarFallback className="bg-slate-100 text-[#043E52] text-2xl font-bold rounded-xl">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'ORG'}
                </AvatarFallback>
              </Avatar>
              <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={`absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm
                  ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                {isUploadingLogo ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </div>
            </div>

            <div className="flex-1 pb-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                      className="text-lg font-bold text-[#043E52] h-9 w-full md:w-72 border-slate-300"
                      placeholder="Official Organization Name"
                    />
                  ) : (
                    <h1 className="text-xl md:text-2xl font-bold text-[#043E52]">{profileData.name || "Unnamed Organization"}</h1>
                  )}
                  {isVerified && !isEditing && <ShieldCheck className="h-5 w-5 text-[#1C9290]" title="Government Verified" />}
                </div>
                
                {isEditing ? (
                  <Input 
                    value={profileData.tagline} 
                    onChange={(e) => setProfileData({...profileData, tagline: e.target.value})} 
                    className="text-slate-600 text-sm h-8 w-full md:w-80 border-slate-300"
                    placeholder="Short mission tagline..."
                  />
                ) : (
                  <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                    {profileData.tagline || "Official Entity"}
                    {!isVerified && <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[9px] px-1.5 uppercase">Audit Pending</Badge>}
                  </p>
                )}
              </div>

              <div className="shrink-0 w-full md:w-auto">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="w-full md:w-auto border-slate-200 text-[#043E52] hover:bg-slate-50 font-bold shadow-sm text-xs uppercase tracking-wider h-9">
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                ) : (
                  <Button onClick={handleSave} disabled={isSaving} size="sm" className="w-full md:w-auto bg-[#1C9290] hover:bg-[#157a78] text-white font-bold shadow-sm text-xs uppercase tracking-wider h-9">
                    <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. MAIN LAYOUT GRID --- */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Stats & Charter */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             {[
               { label: 'Impact Hours', val: '0', icon: Timer, color: 'text-[#1C9290]', bg: 'bg-teal-50' },
               { label: 'Missions', val: '0', icon: Activity, color: 'text-[#043E52]', bg: 'bg-slate-100' },
               { label: 'Volunteers', val: '0', icon: Users2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
               { label: 'Trust Rank', val: isVerified ? 'A+' : 'N/A', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' }
             ].map((m, i) => (
               <Card key={i} className="border border-slate-200 shadow-sm p-3 flex flex-col items-center justify-center text-center bg-white rounded-xl">
                 <div className={`p-2 rounded-lg ${m.bg} mb-1.5`}><m.icon className={`h-4 w-4 ${m.color}`} /></div>
                 <div className="text-xl font-bold text-[#043E52]">{m.val}</div>
                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.label}</div>
               </Card>
             ))}
          </div>

          <Card className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-[#043E52] flex items-center gap-2 uppercase tracking-tight">
                 <Landmark className="h-5 w-5 text-[#1C9290]" /> Entity Governance & Charter
               </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
               <div className="space-y-2">
                 <Label className="font-bold text-[#043E52] text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> About the Entity</Label>
                 {isEditing ? (
                   <Textarea value={profileData.description} onChange={(e)=>setProfileData({...profileData, description: e.target.value})} className="bg-white border-slate-300 p-3 text-sm min-h-[100px] rounded-lg focus:ring-[#1C9290]" placeholder="Provide a comprehensive operational description..." />
                 ) : (
                   <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{profileData.description || "Operational description pending."}</p>
                 )}
               </div>
               
               <Separator className="bg-slate-100" />
               
               <div className="space-y-2">
                 <Label className="font-bold text-[#043E52] text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> Legal Mission Statement</Label>
                 {isEditing ? (
                   <Textarea value={profileData.mission} onChange={(e)=>setProfileData({...profileData, mission: e.target.value})} className="bg-white border-slate-300 p-3 text-sm min-h-[60px] rounded-lg focus:ring-[#1C9290]" placeholder="Enter official registered mission statement..." />
                 ) : (
                   <blockquote className="border-l-2 border-[#1C9290] pl-4 py-1 text-sm font-medium text-slate-700 italic bg-slate-50/50 rounded-r-lg">
                     "{profileData.mission || "Mission statement pending review."}"
                   </blockquote>
                 )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-[#043E52] text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> Board of Directors</Label>
                    {isEditing ? (
                      <Textarea value={profileData.boardMembers} onChange={(e)=>setProfileData({...profileData, boardMembers: e.target.value})} className="bg-white border-slate-300 text-sm h-20" placeholder="List key board members/trustees..." />
                    ) : (
                      <p className="text-slate-600 text-xs leading-relaxed">{profileData.boardMembers || "Board roster not disclosed publicly."}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[#043E52] text-[10px] uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Safeguarding Policy</Label>
                    {isEditing ? (
                      <Textarea value={profileData.safeguardingPolicy} onChange={(e)=>setProfileData({...profileData, safeguardingPolicy: e.target.value})} className="bg-white border-slate-300 text-sm h-20" placeholder="Briefly detail volunteer/minor safeguarding protocols..." />
                    ) : (
                      <p className="text-slate-600 text-xs leading-relaxed">{profileData.safeguardingPolicy || "Safeguarding and liability policies pending."}</p>
                    )}
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          <Card className={`border shadow-sm rounded-xl overflow-hidden ${isVerified ? 'bg-[#043E52] text-white border-transparent' : 'bg-white border-slate-200'}`}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <ShieldCheck className={`h-7 w-7 ${isVerified ? 'text-[#1C9290]' : 'text-amber-500'}`} />
                <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 ${isVerified ? 'text-white border-white/20 bg-white/10' : 'text-amber-700 border-amber-200 bg-amber-50'}`}>
                  {isVerified ? 'GOVERNMENT VERIFIED' : 'AUDIT REQUIRED'}
                </Badge>
              </div>
              
              {isVerified ? (
                <div className="space-y-3">
                   <h3 className="text-lg font-bold">Fiduciary Identity Confirmed</h3>
                   <p className="text-slate-300 text-xs leading-relaxed">This entity has passed the National Disaster Response Framework (NDRF) audit and is legally authorized for public deployment.</p>
                   <div className="bg-[#033040] rounded-lg p-3 space-y-2 mt-2 border border-white/10">
                      <div className="flex justify-between text-xs"><span className="text-teal-100/60 font-semibold uppercase tracking-wider text-[9px]">Reg ID</span><span className="font-bold font-mono text-teal-100">{profileData.registrationId || 'Verified'}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-teal-100/60 font-semibold uppercase tracking-wider text-[9px]">Founded</span><span className="font-bold">{profileData.yearFounded || 'Verified'}</span></div>
                   </div>
                </div>
              ) : vStatus === "pending" ? (
                <div className="space-y-3">
                   <h3 className="text-lg font-bold text-[#043E52] tracking-tight">Audit in Progress</h3>
                   <p className="text-xs text-slate-500 leading-relaxed">Your corporate documents are currently under review by the Ministry Compliance Team.</p>
                   <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex flex-col gap-2 mt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-amber-800 uppercase tracking-wider">
                        <span>Review Queue</span>
                        <Timer className="h-4 w-4 animate-spin-slow" />
                      </div>
                      <Progress value={65} className="h-1.5 bg-amber-200 [&>div]:bg-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest text-right">Est. 48-72h</span>
                   </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-[#043E52] tracking-tight">Unverified Entity</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">To access the Athar Volunteer Reserve (AVR) and deploy missions, you must complete a fiduciary compliance audit.</p>
                  <Button onClick={() => setShowVerifyModal(true)} className="w-full bg-[#043E52] hover:bg-[#033040] text-white font-bold h-10 rounded-lg text-xs uppercase tracking-wider mt-2">
                    Initiate Audit Now
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm rounded-xl bg-white p-5 space-y-4">
             <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-wider flex items-center gap-2 mb-1 border-b border-slate-100 pb-3">
               <Globe className="h-4 w-4 text-[#1C9290]" /> Public Directory Info
             </h4>
             
             {isEditing ? (
               <div className="space-y-3">
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gov Registration / Tax ID</Label><Input value={profileData.registrationId} onChange={(e)=>setProfileData({...profileData, registrationId: e.target.value})} placeholder="e.g. EIN-12345" className="h-9 text-xs rounded-md border-slate-200" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Year Founded</Label><Input value={profileData.yearFounded} onChange={(e)=>setProfileData({...profileData, yearFounded: e.target.value})} placeholder="e.g. 2010" type="number" className="h-9 text-xs rounded-md border-slate-200" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Website</Label><Input value={profileData.website} onChange={(e)=>setProfileData({...profileData, website: e.target.value})} placeholder="https://..." className="h-9 text-xs rounded-md border-slate-200" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Public Email</Label><Input value={profileData.email} onChange={(e)=>setProfileData({...profileData, email: e.target.value})} placeholder="contact@org.com" className="h-9 text-xs rounded-md border-slate-200" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phone</Label><Input value={profileData.phone} onChange={(e)=>setProfileData({...profileData, phone: e.target.value})} placeholder="+90..." className="h-9 text-xs rounded-md border-slate-200" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HQ Address</Label><Textarea value={profileData.address} onChange={(e)=>setProfileData({...profileData, address: e.target.value})} placeholder="Full Address..." className="h-16 text-xs resize-none rounded-md border-slate-200" /></div>
               </div>
             ) : (
               <div className="space-y-3.5">
                 <div className="flex items-center gap-3 text-sm text-slate-600"><FileDigit className="h-4 w-4 text-slate-400 shrink-0" /> <span className="font-mono text-xs font-semibold">{profileData.registrationId || "Reg ID Pending"}</span></div>
                 <div className="flex items-center gap-3 text-sm text-slate-600"><Globe className="h-4 w-4 text-slate-400 shrink-0" /> <a href={profileData.website} target="_blank" rel="noreferrer" className="hover:underline hover:text-[#1C9290] truncate font-medium">{profileData.website || "Not provided"}</a></div>
                 <div className="flex items-center gap-3 text-sm text-slate-600"><Mail className="h-4 w-4 text-slate-400 shrink-0" /> <span className="truncate font-medium">{profileData.email || "Not provided"}</span></div>
                 <div className="flex items-center gap-3 text-sm text-slate-600"><Phone className="h-4 w-4 text-slate-400 shrink-0" /> <span className="font-medium">{profileData.phone || "Not provided"}</span></div>
                 <Separator className="bg-slate-100" />
                 <div className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" /> <span className="font-medium">{profileData.address || "HQ Location Not Logged"}</span></div>
               </div>
             )}
          </Card>
        </div>
      </div>

      {/* --- 3. UPGRADED GOVERNMENT AUDIT MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#043E52]/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border-none my-auto flex flex-col md:flex-row h-full max-h-[90vh]">
            
            {/* Sidebar */}
            <div className="w-full md:w-[35%] bg-gradient-to-b from-[#043E52] to-[#021c25] p-8 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                 <ShieldCheck className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                <Landmark className="h-10 w-10 text-[#1C9290] mb-5" />
                <h2 className="text-2xl font-black leading-tight mb-2 tracking-tight">Regulatory<br/>Compliance Audit</h2>
                <p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest mt-4">National Disaster Framework v4.2</p>
                <p className="text-slate-300 text-xs leading-relaxed mt-6">
                  Under the NDRF regulations, organizations seeking to deploy volunteers to active crises must prove fiduciary transparency, legal accountability, and robust liability coverage.
                </p>
              </div>
              <div className="space-y-3 text-[11px] font-bold text-teal-400 mt-8 md:mt-0 relative z-10 uppercase tracking-wider">
                 <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Secure 256-bit Encryption</p>
                 <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Ministry Direct Routing</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col bg-slate-50">
              <div className="space-y-6 flex-1">
                
                <div>
                  <h3 className="text-sm font-bold text-[#043E52] border-b border-slate-200 pb-2 mb-4 uppercase tracking-tight">1. Fiduciary Identification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Legal Entity Name</Label>
                        <Input value={auditData.legalName} onChange={e => setAuditData({...auditData, legalName: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm focus:ring-[#1C9290]" placeholder="Exact Registered Name" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tax ID / License Number</Label>
                        <Input value={auditData.licenseId} onChange={e => setAuditData({...auditData, licenseId: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm font-mono focus:ring-[#1C9290]" placeholder="e.g. NGO-TAX-XXXX" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Authorized Signatory Name</Label>
                        <Input value={auditData.signatoryName} onChange={e => setAuditData({...auditData, signatoryName: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm focus:ring-[#1C9290]" placeholder="Full Name of Representative" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Signatory Role</Label>
                        <Input value={auditData.signatoryRole} onChange={e => setAuditData({...auditData, signatoryRole: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm focus:ring-[#1C9290]" placeholder="e.g. CEO, Board Member" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#043E52] border-b border-slate-200 pb-2 mb-4 uppercase tracking-tight">2. Required Documentation</h3>
                  <p className="text-xs text-slate-500 mb-4">Please upload the following official documents in PDF format. Maximum file size is 10MB per document.</p>
                  
                  <div className="space-y-3">
                    
                    {/* Document Upload Row Builder */}
                    {[
                      { id: 'incorporation', title: 'Certificate of Incorporation', desc: 'Proof of Legal Status', icon: FileCheck },
                      { id: 'financial', title: 'Latest Financial Audit (Form 990)', desc: 'Fiduciary Transparency', icon: Landmark },
                      { id: 'safeguarding', title: 'Data Protection & Safeguarding Policy', desc: 'GDPR/KVKK & Minor Protection', icon: ShieldAlert },
                      { id: 'insurance', title: 'Comprehensive Liability Insurance', desc: 'Volunteer Medical & Civil Liability', icon: Shield },
                      { id: 'signatoryId', title: 'Signatory Government ID', desc: 'Passport or National ID', icon: Fingerprint }
                    ].map((docItem) => (
                      <label key={docItem.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-dashed border-slate-300 hover:border-[#1C9290] transition-colors cursor-pointer group">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${auditFiles[docItem.id] ? 'bg-emerald-50' : 'bg-slate-100 group-hover:bg-teal-50'}`}>
                              <docItem.icon className={`h-5 w-5 ${auditFiles[docItem.id] ? 'text-emerald-600' : 'text-slate-500 group-hover:text-[#1C9290]'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#043E52]">{docItem.title}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                                {auditFiles[docItem.id] ? <span className="text-emerald-600 font-bold">{auditFiles[docItem.id]}</span> : docItem.desc}
                              </p>
                            </div>
                         </div>
                         <input 
                           type="file" 
                           accept=".pdf,.jpg,.jpeg,.png" 
                           className="hidden" 
                           onChange={(e) => handleAuditDocumentUpload(e, docItem.id)}
                         />
                         <Button asChild size="sm" variant={auditFiles[docItem.id] ? 'default' : 'outline'} className={`text-xs font-bold uppercase tracking-wider h-8 ${auditFiles[docItem.id] ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-none' : ''}`}>
                           <span>
                             {uploadingDoc === docItem.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : auditFiles[docItem.id] ? <Check className="mr-2 h-3.5 w-3.5" /> : <UploadCloud className="mr-2 h-3.5 w-3.5" />}
                             {uploadingDoc === docItem.id ? 'Uploading...' : auditFiles[docItem.id] ? 'Uploaded' : 'Upload'}
                           </span>
                         </Button>
                      </label>
                    ))}

                  </div>
                </div>

                {/* LEGAL CONSENT BLOCK */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[#043E52]">
                     <Gavel className="h-5 w-5" />
                     <h3 className="font-bold text-sm uppercase tracking-tight">Regulatory Terms & Oath</h3>
                  </div>
                  <div className="h-28 overflow-y-auto pr-2 text-xs text-slate-600 space-y-2.5 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p><strong>1. Verification Authority:</strong> By submitting this audit, the Organization grants the Ministry and its agents explicit permission to verify legal standings with relevant state departments.</p>
                     <p><strong>2. Operational Accountability:</strong> The Organization assumes full fiduciary and civil liability for all field operations conducted through the Athar platform.</p>
                     <p><strong>3. Vetting Requirements:</strong> The Organization certifies under penalty of perjury that all internal personnel managing volunteers have undergone mandatory background clearance.</p>
                     <p><strong>4. Audit Revocation:</strong> Verification status may be revoked without notice if operational irregularities or safeguarding violations are detected.</p>
                  </div>
                  <div className="flex items-center space-x-3 pt-3 mt-3">
                     <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c)=>setAgreedToTerms(c as boolean)} className="h-5 w-5 border-slate-300 data-[state=checked]:bg-[#1C9290] data-[state=checked]:border-[#1C9290]" />
                     <label htmlFor="terms" className="text-xs font-bold text-[#043E52] cursor-pointer uppercase tracking-wider">I legally certify the accuracy of all submitted data.</label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-slate-200 shrink-0">
                <Button variant="outline" className="text-slate-500 font-bold uppercase tracking-wider text-xs h-11" onClick={() => setShowVerifyModal(false)}>Cancel Audit</Button>
                
                {/* 🔥 UPDATED: WIRED SUBMIT BUTTON 🔥 */}
                <Button 
                  disabled={!agreedToTerms || !auditData.legalName || !auditData.licenseId || !areAllDocsUploaded() || isSubmittingAudit}
                  className="bg-[#1C9290] hover:bg-[#157a78] text-white font-bold px-8 shadow-md h-11 uppercase tracking-wider text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitAudit}
                >
                  {isSubmittingAudit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {isSubmittingAudit ? "Transmitting..." : "Sign & Submit Audit"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}