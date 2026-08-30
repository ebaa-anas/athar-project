import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
  Users2, Timer, Activity, Scale, Landmark, FileDigit, Building,
  ShieldAlert, UploadCloud, Check, HeartHandshake, Camera, Loader2, Image as ImageIcon, Gavel, X
} from 'lucide-react';

import { useUserProfile } from '../../hooks/useUserProfile';
import { updateOrganizationProfile } from '../../lib/authService';
import {
  getProfileErrors,
  getRequiredDocs,
  areAllDocsUploaded,
  deriveOrgVerification,
} from '../../lib/orgVerification';

import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

const PREDEFINED_CAUSES = [
  "Disaster Relief", "Education", "Environment & Climate", 
  "Healthcare", "Poverty Alleviation", "Food Security", 
  "Animal Welfare", "Human Rights", "Community Development",
  "Elderly Care", "Refugee Support", "Youth Empowerment"
];

export function OrganizationProfile() {
  const { user, loading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [orgStats, setOrgStats] = useState({ hours: 0, missions: 0, volunteers: 0 });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false); 
  const [auditFiles, setAuditFiles] = useState<Record<string, string | null>>({
    incorporation: null, financial: null, safeguarding: null, insurance: null, signatoryId: null
  });

  const [profileData, setProfileData] = useState({
    name: '', tagline: '', email: '', phone: '', website: '',
    address: '', city: '', country: '', description: '', mission: '',
    impactSummary: '0 projects verified.', category: 'Non-Profit Organization',
    photoUrl: '', coverUrl: '', registrationId: '', yearFounded: '', 
    boardMembers: '', safeguardingPolicy: '', causes: '' 
  });

  const [auditData, setAuditData] = useState({
    legalName: '', licenseId: '', headOfBoard: '', financialYear: '', 
    foundingDate: '', signatoryName: '', signatoryRole: ''
  });

  useEffect(() => {
    const loadOrganizationData = async () => {
      if (user) {
        // Start with the basic details already on the user "nametag" document
        let currentData = {
          name: user.name || user.legalName || '', 
          tagline: user.tagline || '', 
          email: user.email || '',
          phone: user.phone || '', 
          website: user.website || '', 
          address: user.address || '',
          city: user.city || '', 
          country: user.country || '', 
          description: user.description || '',
          mission: user.mission || '', 
          impactSummary: user.impactSummary || '0 projects verified.',
          category: user.category || 'Non-Profit Organization', 
          photoUrl: user.photoUrl || user.logoUrl || '',
          coverUrl: user.coverUrl || '', 
          registrationId: user.registrationId || user.officialId || '',
          yearFounded: user.yearFounded || '', 
          boardMembers: user.boardMembers || '',
          safeguardingPolicy: user.safeguardingPolicy || '', 
          causes: user.causes || '' 
        };

        // Then overlay the richer profile from the "organizations" collection
        if (user.uid) {
          try {
            const orgRef = doc(db, "organizations", user.uid);
            const orgSnap = await getDoc(orgRef);
            
            if (orgSnap.exists()) {
              const orgData = orgSnap.data();
              // Merge data, prioritizing the specific organization database fields
              currentData = {
                ...currentData,
                ...orgData,
                name: orgData.name || currentData.name,
                phone: orgData.phone || currentData.phone,
                registrationId: orgData.registrationId || currentData.registrationId,
                email: orgData.email || currentData.email
              };
            }
          } catch (error) {
            console.error("Failed to fetch organization specific data:", error);
          }
        }

        setProfileData(currentData);

        // Drop straight into edit mode if any required field is still missing
        if (!currentData.description || !currentData.mission || !currentData.address || !currentData.phone || !currentData.causes) {
           setIsEditing(true);
        }
      }
    };

    loadOrganizationData();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const qMissions = query(collection(db, "opportunities"), where("orgId", "==", user.uid));
    const unsubMissions = onSnapshot(qMissions, (snap) => setOrgStats(prev => ({ ...prev, missions: snap.docs.length })));

    const qApps = query(collection(db, "applications"), where("orgId", "==", user.uid));
    const unsubApps = onSnapshot(qApps, (snap) => {
      const apps = snap.docs.map(d => d.data());
      const activeApps = apps.filter(a => a.status === 'accepted' || a.status === 'completed');
      const totalHours = activeApps.reduce((acc, curr) => acc + (curr.hoursContributed || 0), 0);
      const uniqueVolunteers = new Set(activeApps.map(a => a.volunteerId)).size;
      setOrgStats(prev => ({ ...prev, volunteers: uniqueVolunteers || activeApps.length, hours: totalHours }));
    });

    return () => { unsubMissions(); unsubApps(); };
  }, [user]);

  const { currentTier, isVerified, vStatus } = deriveOrgVerification(user);

  const profileErrors = getProfileErrors(profileData, currentTier);
  const isProfileComplete = profileErrors.length === 0;

  const requiredDocs = getRequiredDocs(currentTier);

  const toggleCause = (cause: string) => {
    if (!isEditing) return;
    let currentCauses = profileData.causes ? profileData.causes.split(',').map(c => c.trim()).filter(Boolean) : [];
    if (currentCauses.includes(cause)) {
      currentCauses = currentCauses.filter(c => c !== cause);
    } else {
      if (currentCauses.length < 5) currentCauses.push(cause);
      else alert("You can select a maximum of 5 core causes.");
    }
    setProfileData({ ...profileData, causes: currentCauses.join(',') });
  };

  const handleSave = async () => {
    if (!user) return;

    if (!isProfileComplete) {
      return alert("Incomplete Profile: You must fill out all mandatory sections before saving:\n\n- " + profileErrors.join('\n- '));
    }

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
          let width = img.width; let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width; canvas.height = height;
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
    setTimeout(() => {
      setAuditFiles(prev => ({ ...prev, [docType]: file.name }));
      setUploadingDoc(null);
    }, 1500);
  };

  const handleSubmitAudit = async () => {
    if (!user) return;
    setIsSubmittingAudit(true);
    try {
      await updateOrganizationProfile(user.uid, {
        verificationStatus: "pending", auditData: auditData,
        auditFiles: auditFiles, auditSubmittedAt: new Date().toISOString()
      });
      alert("Audit Package securely transmitted to the Queue. You will be notified via email upon review completion.");
      setShowVerifyModal(false);
    } catch (error) {
      console.error("Error submitting audit:", error);
      alert("Failed to submit audit. Please check your connection.");
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-role-org animate-pulse">SYNCING DATA...</div>;

  const currentCausesArray = profileData.causes ? profileData.causes.split(',').map(c => c.trim()).filter(Boolean) : [];

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-sans space-y-6">

      {/* Profile completion warning banner */}
      {!isProfileComplete && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-b-2xl shadow-sm mb-6 flex items-start sm:items-center gap-4 max-w-6xl mx-auto border-t-0">
          <div className="bg-red-600 p-2.5 rounded-xl text-white shrink-0"><ShieldAlert size={20} /></div>
          <div>
            <h4 className="text-red-900 font-bold text-sm">Action Required: Complete Organization Profile</h4>
            <p className="text-red-700 text-xs font-medium mt-0.5">
              Your profile is incomplete. <strong>You cannot post any volunteering opportunities</strong> until all mandatory fields (About Entity, Mission Statement, Causes, Contact, and Location) are completed.
            </p>
          </div>
        </div>
      )}
      
      {/* Profile header */}
      <div className="bg-white border-b border-role-accent-teal/10 shadow-sm">
        <div className="h-32 md:h-48 w-full relative group/hero bg-role-org">
          {profileData.coverUrl ? (
            <img src={profileData.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          )}
          
          <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
          <div className={`absolute top-3 right-4 z-20 transition-opacity duration-200 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover/hero:opacity-100'}`}>
             <Button onClick={() => coverInputRef.current?.click()} size="sm" variant="secondary" className="bg-white/90 hover:bg-white text-role-org font-bold shadow-sm text-xs">
               {isUploadingCover ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1.5 h-3 w-3 text-role-accent-teal" />}
               Change Cover
             </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10 md:-mt-12 relative z-10">
            
            <div className="relative group inline-block shrink-0">
              <Avatar className="w-24 h-24 md:w-28 md:h-28 ring-4 ring-white bg-white shadow-sm rounded-xl">
                <AvatarImage src={profileData.photoUrl} className="object-cover rounded-xl bg-white" />
                <AvatarFallback className="bg-slate-100 text-role-org text-2xl font-bold rounded-xl border-b-4 border-role-accent-teal">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'ORG'}
                </AvatarFallback>
              </Avatar>
              <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={`absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm
                  ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                {isUploadingLogo ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-role-accent-teal" />}
              </div>
            </div>

            <div className="flex-1 pb-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 w-full md:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {isEditing ? (
                    <Input 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                      className="text-lg font-bold text-role-org h-9 w-full md:w-72 border-role-accent-teal/30 focus:ring-role-accent-teal"
                      placeholder="Official Organization Name *"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl md:text-2xl font-bold text-slate-900">{profileData.name || "Unnamed Organization"}</h1>
                      {isVerified && !isEditing && <ShieldCheck className="h-5 w-5 text-emerald-500" title="Verified" />}
                    </div>
                  )}
                  {!isEditing && (
                    <Badge className={`text-[10px] uppercase font-bold px-2 py-0.5 border shadow-none ${
                        currentTier === 'tier3' ? 'bg-red-100 text-red-700 border-red-300' : 
                        currentTier === 'tier2' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        'bg-emerald-100 text-emerald-700 border-emerald-300'
                    }`}>
                        {currentTier === 'tier3' ? 'Tier 3: Crisis Ops' : currentTier === 'tier2' ? 'Tier 2: NGO' : 'Tier 1: Initiative'}
                    </Badge>
                  )}
                </div>
                
                {isEditing ? (
                  <Input 
                    value={profileData.tagline} 
                    onChange={(e) => setProfileData({...profileData, tagline: e.target.value})} 
                    className="text-slate-600 text-sm h-8 w-full md:w-80 border-slate-300 focus:ring-role-accent-teal mt-2"
                    placeholder="Short mission tagline..."
                  />
                ) : (
                  <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
                    {profileData.tagline || "Official Entity"}
                    {!isVerified && <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[9px] px-1.5 uppercase">Audit Pending</Badge>}
                  </p>
                )}
              </div>

              <div className="shrink-0 w-full md:w-auto">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="w-full md:w-auto border-slate-200 text-role-org hover:bg-role-accent-teal/10 hover:text-role-accent-teal hover:border-role-accent-teal/30 font-bold shadow-sm text-xs uppercase tracking-wider h-9 transition-colors">
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="w-full md:w-auto bg-role-accent-teal hover:bg-role-accent-teal/80 text-white font-bold shadow-sm text-xs uppercase tracking-wider h-9 transition-colors">
                      <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    {isProfileComplete && (
                      <Button onClick={() => setIsEditing(false)} size="sm" variant="outline" className="border-slate-300 text-slate-600 font-bold shadow-sm text-xs uppercase tracking-wider h-9 transition-colors">
                         <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Stats & Charter */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             {[
               { label: 'Impact Hours', val: orgStats.hours.toString(), icon: Timer, color: 'text-role-accent-teal', bg: 'bg-teal-50' },
               { label: 'Missions', val: orgStats.missions.toString(), icon: Activity, color: 'text-role-accent-teal', bg: 'bg-role-accent-teal/10' },
               { label: 'Volunteers', val: orgStats.volunteers.toString(), icon: Users2, color: 'text-blue-600', bg: 'bg-blue-50' },
               { label: 'Trust Rank', val: isVerified ? 'A+' : 'N/A', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' }
             ].map((m, i) => (
               <Card key={i} className="border border-slate-200 shadow-sm p-3 flex flex-col items-center justify-center text-center bg-white rounded-xl hover:border-role-accent-teal/30 transition-colors">
                 <div className={`p-2 rounded-lg ${m.bg} mb-1.5`}><m.icon className={`h-4 w-4 ${m.color}`} /></div>
                 <div className="text-xl font-bold text-role-org">{m.val}</div>
                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.label}</div>
               </Card>
             ))}
          </div>

          <Card className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                 <Landmark className="h-5 w-5 text-role-accent-teal" /> Entity Governance & Charter
               </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
               <div className="space-y-2">
                 <Label className="font-bold text-role-org text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> About the Entity *</Label>
                 {isEditing ? (
                   <Textarea value={profileData.description} onChange={(e)=>setProfileData({...profileData, description: e.target.value})} className="bg-white border-slate-300 p-3 text-sm min-h-[100px] rounded-lg focus:ring-role-accent-teal" placeholder="Provide a detailed operational description..." />
                 ) : (
                   <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{profileData.description || "Operational description pending."}</p>
                 )}
               </div>

               <div className="space-y-2 pt-2">
                 <Label className="font-bold text-role-org text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Impact Summary</Label>
                 {isEditing ? (
                   <Textarea value={profileData.impactSummary} onChange={(e)=>setProfileData({...profileData, impactSummary: e.target.value})} className="bg-white border-slate-300 p-3 text-sm min-h-[80px] rounded-lg focus:ring-role-accent-teal" placeholder="Provide a brief summary of organizational impact (e.g. 100+ projects completed)..." />
                 ) : (
                   <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{profileData.impactSummary || "No impact summary provided."}</p>
                 )}
               </div>

               <div className="space-y-3 pt-2">
                 <div className="flex items-center justify-between">
                   <Label className="font-bold text-role-org text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                     <HeartHandshake className="h-3.5 w-3.5 text-role-accent-teal" /> Core Causes (Matching Keywords) *
                   </Label>
                   {isEditing && <span className="text-[10px] text-slate-400">{currentCausesArray.length}/5 Selected</span>}
                 </div>
                 
                 {isEditing ? (
                   <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-wrap gap-2">
                     {PREDEFINED_CAUSES.map((cause) => {
                       const isSelected = currentCausesArray.includes(cause);
                       return (
                         <Badge 
                           key={cause}
                           variant="outline"
                           onClick={() => toggleCause(cause)}
                           className={`cursor-pointer px-3 py-1.5 text-xs font-semibold transition-all duration-200 
                             ${isSelected 
                               ? 'bg-role-accent-teal/15 text-role-accent-teal border-role-accent-teal shadow-sm scale-[1.02]' 
                               : 'bg-white text-slate-500 border-slate-200 hover:border-role-accent-teal/50 hover:text-role-accent-teal'}`}
                         >
                           {cause}
                         </Badge>
                       );
                     })}
                   </div>
                 ) : (
                   <div className="flex flex-wrap gap-2">
                     {currentCausesArray.length > 0 ? currentCausesArray.map((cause, idx) => (
                       <Badge key={idx} variant="secondary" className="bg-role-accent-teal/10 text-role-accent-teal hover:bg-role-accent-teal/15 border border-role-accent-teal/30 font-semibold px-3 py-1 text-xs">
                         {cause}
                       </Badge>
                     )) : (
                       <span className="text-slate-500 text-xs italic">No specific matching keywords selected yet.</span>
                     )}
                   </div>
                 )}
               </div>
               
               <Separator className="bg-slate-100" />
               
               <div className="space-y-2">
                 <Label className="font-bold text-role-org text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> Legal Mission Statement *</Label>
                 {isEditing ? (
                   <Textarea value={profileData.mission} onChange={(e)=>setProfileData({...profileData, mission: e.target.value})} className="bg-white border-slate-300 p-3 text-sm min-h-[60px] rounded-lg focus:ring-role-accent-teal" placeholder="Enter official registered mission statement..." />
                 ) : (
                   <blockquote className="border-l-2 border-role-accent-teal pl-4 py-1 text-sm font-medium text-slate-700 italic bg-role-accent-teal/5 rounded-r-lg">
                     "{profileData.mission || "Mission statement pending review."}"
                   </blockquote>
                 )}
               </div>

               {/* Board & safeguarding fields are editable at any tier, but only required for tier2/3 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                   <div className="space-y-2">
                       <Label className="font-bold text-role-org text-[10px] uppercase tracking-widest flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> Board of Directors {currentTier !== 'tier1' && '*'}</Label>
                       {isEditing ? (
                       <Textarea value={profileData.boardMembers} onChange={(e)=>setProfileData({...profileData, boardMembers: e.target.value})} className="bg-white border-slate-300 text-sm h-20" placeholder="List key board members/trustees..." />
                       ) : (
                       <p className="text-slate-600 text-xs leading-relaxed">{profileData.boardMembers || "Board roster not disclosed publicly."}</p>
                       )}
                   </div>
                   <div className="space-y-2">
                       <Label className="font-bold text-role-org text-[10px] uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Safeguarding Policy {currentTier !== 'tier1' && '*'}</Label>
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
          
          <Card className={`border shadow-sm rounded-xl overflow-hidden ${isVerified ? 'bg-role-org text-white border-transparent' : 'bg-white border-slate-200'}`}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <ShieldCheck className={`h-7 w-7 ${isVerified ? 'text-emerald-400' : 'text-amber-500'}`} />
                <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 ${isVerified ? 'text-white border-white/20 bg-white/10' : 'text-amber-700 border-amber-200 bg-amber-50'}`}>
                  {isVerified ? (currentTier === 'tier3' ? 'GOV VERIFIED' : 'VERIFIED ACTIVE') : 'AUDIT REQUIRED'}
                </Badge>
              </div>
              
              {currentTier === 'tier1' ? (
                <div className="space-y-3">
                   <h3 className="text-lg font-bold">Community Initiative</h3>
                   <p className="text-teal-50/80 text-xs leading-relaxed">As a Tier 1 entity, your profile is auto-verified to create local community missions. Advanced legal audits are only required for Tier 2 (NGO) or Tier 3 (Crisis Ops).</p>
                </div>
              ) : isVerified ? (
                <div className="space-y-3">
                   <h3 className="text-lg font-bold">Fiduciary Identity Confirmed</h3>
                   <p className="text-slate-300 text-xs leading-relaxed">
                     {currentTier === 'tier3' 
                        ? 'This entity has passed the National Disaster Response Framework (NDRF) audit and is legally authorized for public crisis deployment.' 
                        : 'This entity has passed the standard verification audit and is authorized for regular platform operations.'}
                   </p>
                   <div className="bg-role-org-dark rounded-lg p-3 space-y-2 mt-2 border border-white/10">
                      <div className="flex justify-between text-xs"><span className="text-teal-100/60 font-semibold uppercase tracking-wider text-[9px]">Reg ID</span><span className="font-bold font-mono text-teal-100">{profileData.registrationId || 'Verified'}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-teal-100/60 font-semibold uppercase tracking-wider text-[9px]">Founded</span><span className="font-bold">{profileData.yearFounded || 'Verified'}</span></div>
                   </div>
                </div>
              ) : vStatus === "pending" ? (
                <div className="space-y-3">
                   <h3 className="text-lg font-bold text-slate-900 tracking-tight">Audit in Progress</h3>
                   <p className="text-xs text-slate-500 leading-relaxed">Your corporate documents are currently under review by the Compliance Team.</p>
                   <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex flex-col gap-2 mt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-amber-800 uppercase tracking-wider">
                        <span>Review Queue</span>
                        <Timer className="h-4 w-4 animate-spin-slow text-amber-500" />
                      </div>
                      <Progress value={65} className="h-1.5 bg-amber-200 [&>div]:bg-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest text-right">Est. 48-72h</span>
                   </div>
                </div>
              ) : (
                <div className="space-y-3 relative">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Unverified Entity</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {currentTier === 'tier3' 
                        ? 'To access the Athar Volunteer Reserve (AVR) crisis portal, you must complete the mandatory government NDRF audit.' 
                        : 'To officially post public volunteer opportunities on the platform, you must submit foundational verification documents.'}
                  </p>
                  
                  {!isProfileComplete ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 space-y-2">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Action Required: Incomplete Profile
                      </p>
                      <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                        Click <strong>"Edit Profile"</strong> and resolve the following to unlock the audit portal:
                      </p>
                      <ul className="list-disc pl-4 text-[10px] text-amber-700 font-medium space-y-0.5">
                        {profileErrors.map((errorMsg, idx) => (
                           <li key={idx}>{errorMsg}</li>
                        ))}
                      </ul>
                    </div>
                  ) : isEditing ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                      <p className="text-xs text-slate-500 font-medium text-center">Save your profile changes to initiate the audit.</p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-role-accent-teal hover:bg-role-accent-teal/80 text-white font-bold h-10 rounded-lg text-xs uppercase tracking-wider mt-2 transition-colors relative z-10 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        setShowVerifyModal(true);
                      }}
                    >
                      {currentTier === 'tier3' ? 'Initiate Gov Audit Now' : 'Submit Verification Docs'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm rounded-xl bg-white p-5 space-y-4">
             <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-1 border-b border-slate-100 pb-3">
               <Globe className="h-4 w-4 text-role-accent-teal" /> Public Directory Info
             </h4>
             
             {isEditing ? (
               <div className="space-y-3">
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gov Registration / Tax ID *</Label><Input value={profileData.registrationId} onChange={(e)=>setProfileData({...profileData, registrationId: e.target.value})} placeholder="e.g. EIN-12345" className="h-9 text-xs rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Year Founded</Label><Input value={profileData.yearFounded} onChange={(e)=>setProfileData({...profileData, yearFounded: e.target.value})} placeholder="e.g. 2010" type="number" className="h-9 text-xs rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Website</Label><Input value={profileData.website} onChange={(e)=>setProfileData({...profileData, website: e.target.value})} placeholder="https://..." className="h-9 text-xs rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Public Email</Label><Input value={profileData.email} onChange={(e)=>setProfileData({...profileData, email: e.target.value})} placeholder="contact@org.com" className="h-9 text-xs rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phone *</Label><Input value={profileData.phone} onChange={(e)=>setProfileData({...profileData, phone: e.target.value})} placeholder="+90..." className="h-9 text-xs rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">City</Label><Input value={profileData.city} onChange={(e)=>setProfileData({...profileData, city: e.target.value})} placeholder="City" className="h-9 text-xs rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
                   <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Country</Label><Input value={profileData.country} onChange={(e)=>setProfileData({...profileData, country: e.target.value})} placeholder="Country" className="h-9 text-xs rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
                 </div>
                 
                 <div className="space-y-1"><Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HQ Address *</Label><Textarea value={profileData.address} onChange={(e)=>setProfileData({...profileData, address: e.target.value})} placeholder="Full Address..." className="h-16 text-xs resize-none rounded-md border-slate-200 focus:ring-role-accent-teal" /></div>
               </div>
             ) : (
               <div className="space-y-3.5">
                 <div className="flex items-center gap-3 text-sm text-slate-600"><FileDigit className="h-4 w-4 text-role-accent-teal shrink-0" /> <span className="font-mono text-xs font-semibold">{profileData.registrationId || "Reg ID Pending"}</span></div>
                 <div className="flex items-center gap-3 text-sm text-slate-600"><Globe className="h-4 w-4 text-role-accent-teal shrink-0" /> <a href={profileData.website} target="_blank" rel="noreferrer" className="hover:underline hover:text-role-accent-teal truncate font-medium">{profileData.website || "Not provided"}</a></div>
                 <div className="flex items-center gap-3 text-sm text-slate-600"><Mail className="h-4 w-4 text-role-accent-teal shrink-0" /> <span className="truncate font-medium">{profileData.email || "Not provided"}</span></div>
                 <div className="flex items-center gap-3 text-sm text-slate-600"><Phone className="h-4 w-4 text-role-accent-teal shrink-0" /> <span className="font-medium">{profileData.phone || "Not provided"}</span></div>
                 <Separator className="bg-slate-100" />
                 
                 <div className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                    <MapPin className="h-4 w-4 text-role-accent-teal shrink-0 mt-0.5" /> 
                    <div>
                        <span className="font-medium block">{profileData.address || "HQ Location Not Logged"}</span>
                        {(profileData.city || profileData.country) && (
                            <span className="text-xs text-slate-500 mt-0.5 block">{profileData.city}{profileData.city && profileData.country && ', '}{profileData.country}</span>
                        )}
                    </div>
                 </div>
               </div>
             )}
          </Card>
        </div>
      </div>

      {/* Audit modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-role-org/90 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border-none my-auto flex flex-col md:flex-row h-full max-h-[90vh]">
            
            {/* Sidebar */}
            <div className="w-full md:w-[35%] bg-gradient-to-b from-role-org to-role-org-dark p-8 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                 <ShieldCheck className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                <Landmark className="h-10 w-10 text-role-accent-teal mb-5" />
                <h2 className="text-2xl font-black leading-tight mb-2 tracking-tight whitespace-pre-line">
                    {currentTier === 'tier3' ? 'Regulatory\nCompliance Audit' : 'Platform\nVerification'}
                </h2>
                <p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest mt-4">
                    {currentTier === 'tier3' ? 'National Disaster Framework v4.2' : 'Standard Trust & Safety Audit'}
                </p>
                <p className="text-slate-300 text-xs leading-relaxed mt-6">
                  {currentTier === 'tier3' 
                    ? 'Under the NDRF regulations, organizations seeking to deploy volunteers to active crises must prove fiduciary transparency, legal accountability, and robust liability coverage.' 
                    : 'To officially register and deploy community missions, you must submit foundational legal and financial documentation to ensure platform transparency.'}
                </p>
              </div>
              <div className="space-y-3 text-[11px] font-bold text-role-accent-teal mt-8 md:mt-0 relative z-10 uppercase tracking-wider">
                 <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-role-accent-teal" /> Secure 256-bit Encryption</p>
                 <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-role-accent-teal" /> {currentTier === 'tier3' ? 'Ministry Direct Routing' : 'Platform Safe Routing'}</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col bg-slate-50">
              <div className="space-y-6 flex-1">
                
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-tight">1. Fiduciary Identification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Legal Entity Name</Label>
                        <Input value={auditData.legalName} onChange={e => setAuditData({...auditData, legalName: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm focus:ring-role-accent-teal" placeholder="Exact Registered Name" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tax ID / License Number</Label>
                        <Input value={auditData.licenseId} onChange={e => setAuditData({...auditData, licenseId: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm font-mono focus:ring-role-accent-teal" placeholder="e.g. NGO-TAX-XXXX" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Authorized Signatory Name</Label>
                        <Input value={auditData.signatoryName} onChange={e => setAuditData({...auditData, signatoryName: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm focus:ring-role-accent-teal" placeholder="Full Name of Representative" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Signatory Role</Label>
                        <Input value={auditData.signatoryRole} onChange={e => setAuditData({...auditData, signatoryRole: e.target.value})} className="h-11 bg-white border-slate-200 rounded-lg text-sm focus:ring-role-accent-teal" placeholder="e.g. CEO, Board Member" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-tight">2. Required Documentation</h3>
                  <p className="text-xs text-slate-500 mb-4">Please upload the following official documents in PDF format. Maximum file size is 10MB per document.</p>
                  
                  <div className="space-y-3">
                    {requiredDocs.map((docItem) => (
                      <label key={docItem.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-dashed border-slate-300 hover:border-role-accent-teal transition-colors cursor-pointer group">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${auditFiles[docItem.id] ? 'bg-role-accent-teal/10' : 'bg-slate-100 group-hover:bg-role-accent-teal/10'}`}>
                              <docItem.icon className={`h-5 w-5 ${auditFiles[docItem.id] ? 'text-role-accent-teal' : 'text-slate-500 group-hover:text-role-accent-teal'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-role-org">{docItem.title}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                                {auditFiles[docItem.id] ? <span className="text-role-accent-teal font-bold">{auditFiles[docItem.id]}</span> : docItem.desc}
                              </p>
                            </div>
                         </div>
                         <input 
                           type="file" 
                           accept=".pdf,.jpg,.jpeg,.png" 
                           className="hidden" 
                           onChange={(e) => handleAuditDocumentUpload(e, docItem.id)}
                         />
                         <Button asChild size="sm" variant={auditFiles[docItem.id] ? 'default' : 'outline'} className={`text-xs font-bold uppercase tracking-wider h-8 ${auditFiles[docItem.id] ? 'bg-role-accent-teal hover:bg-role-accent-teal/80 text-white border-none' : ''}`}>
                           <span>
                             {uploadingDoc === docItem.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : auditFiles[docItem.id] ? <Check className="mr-2 h-3.5 w-3.5" /> : <UploadCloud className="mr-2 h-3.5 w-3.5" />}
                             {uploadingDoc === docItem.id ? 'Uploading...' : auditFiles[docItem.id] ? 'Uploaded' : 'Upload'}
                           </span>
                         </Button>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Legal consent block */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900">
                     <Gavel className="h-5 w-5 text-role-accent-teal" />
                     <h3 className="font-bold text-sm uppercase tracking-tight">{currentTier === 'tier3' ? 'Regulatory Terms & Oath' : 'Platform Code of Conduct'}</h3>
                  </div>
                  <div className="h-28 overflow-y-auto pr-2 text-xs text-slate-600 space-y-2.5 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {currentTier === 'tier3' ? (
                      <>
                        <p><strong>1. Verification Authority:</strong> By submitting this audit, the Organization grants explicit permission to verify legal standings with government regulatory departments.</p>
                        <p><strong>2. Operational Accountability:</strong> The Organization assumes full fiduciary and civil liability for all disaster field operations conducted through the AVR portal.</p>
                        <p><strong>3. Vetting Requirements:</strong> The Organization certifies under penalty of perjury that all internal personnel have undergone mandatory background clearance.</p>
                        <p><strong>4. Audit Revocation:</strong> Status may be revoked without notice if operational irregularities are detected.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>1. Document Review:</strong> By submitting, you grant the platform compliance team permission to review the provided foundational documentation.</p>
                        <p><strong>2. Accuracy of Information:</strong> The Organization certifies that all uploaded documents are true, accurate, and current representations of legal standing.</p>
                        <p><strong>3. Community Guidelines:</strong> The Organization agrees to strictly adhere to the standard safety and volunteer management guidelines of the platform.</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 pt-3 mt-3">
                     <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c)=>setAgreedToTerms(c as boolean)} className="h-5 w-5 border-slate-300 data-[state=checked]:bg-role-accent-teal data-[state=checked]:border-role-accent-teal" />
                     <label htmlFor="terms" className="text-xs font-bold text-role-org cursor-pointer uppercase tracking-wider">I legally certify the accuracy of all submitted data.</label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-slate-200 shrink-0">
                <Button variant="outline" className="text-slate-500 font-bold uppercase tracking-wider text-xs h-11" onClick={() => setShowVerifyModal(false)}>Cancel</Button>
                
                <Button 
                  disabled={!agreedToTerms || !auditData.legalName || !auditData.licenseId || !areAllDocsUploaded(requiredDocs, auditFiles) || isSubmittingAudit}
                  className="bg-role-accent-teal hover:bg-role-accent-teal/80 text-white font-bold px-8 shadow-md h-11 uppercase tracking-wider text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitAudit}
                >
                  {isSubmittingAudit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {isSubmittingAudit ? "Transmitting..." : "Sign & Submit"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}