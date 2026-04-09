import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';

import { 
  CheckCircle, XCircle, Eye, ExternalLink, MapPin, Users, Clock, 
  Building2, FileText, Filter, FileDigit, Loader2, Building, Fingerprint,
  X, ShieldAlert, Landmark, Shield, DownloadCloud, Scale, Globe, FileCheck,
  ArrowLeft, Mail, Phone, Calendar, User, UserCheck, Activity, Droplet, Car, ShieldCheck
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

export default function VerificationRequests() {
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);
  const [verifiedReqs, setVerifiedReqs] = useState<any[]>([]);
  const [rejectedReqs, setRejectedReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- DUAL PIPELINE STATE ---
  const [viewMode, setViewMode] = useState<'organizations' | 'users'>('organizations');

  // --- INLINE NAVIGATION & MODAL STATES ---
  const [selectedFiles, setSelectedFiles] = useState<any | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // --- 1. FETCH LIVE DATA ---
  useEffect(() => {
    const allRecords = new Map();

    const updateState = () => {
      const pending: any[] = [];
      const verified: any[] = [];
      const rejected: any[] = [];

      Array.from(allRecords.values()).forEach((data) => {
        if (data.verificationStatus === 'pending') {
          pending.push(data);
        } else if (data.verificationStatus === 'verified' || data.verified === true) {
          verified.push(data);
        } else if (data.verificationStatus === 'rejected') {
          rejected.push(data);
        }
      });

      // Sort newest submissions first
      pending.sort((a, b) => {
        const timeA = a.auditSubmittedAt ? new Date(a.auditSubmittedAt).getTime() : (a.legalIdentity?.submittedAt ? new Date(a.legalIdentity.submittedAt).getTime() : 0);
        const timeB = b.auditSubmittedAt ? new Date(b.auditSubmittedAt).getTime() : (b.legalIdentity?.submittedAt ? new Date(b.legalIdentity.submittedAt).getTime() : 0);
        return timeB - timeA;
      });

      setPendingReqs(pending);
      setVerifiedReqs(verified);
      setRejectedReqs(rejected);
      setLoading(false);
    };

    const handleSnapshot = (collectionName: string) => {
      return (snapshot: any) => {
        snapshot.docs.forEach((doc: any) => {
          const data: any = { id: doc.id, collectionName, ...doc.data() };
          if (data.verificationStatus) {
            allRecords.set(doc.id, data);
          }
        });
        updateState();
      };
    };

    const unsubUsers = onSnapshot(collection(db, "users"), handleSnapshot("users"));
    const unsubOrgs = onSnapshot(collection(db, "organizations"), handleSnapshot("organizations"));

    return () => {
      unsubUsers();
      unsubOrgs();
    };
  }, []);

  // --- 2. DYNAMIC PIPELINE FILTERING ---
  const displayPending = pendingReqs.filter(r => r.collectionName === viewMode);
  const displayVerified = verifiedReqs.filter(r => r.collectionName === viewMode);
  const displayRejected = rejectedReqs.filter(r => r.collectionName === viewMode);
  
  const totalApplications = displayPending.length + displayVerified.length + displayRejected.length;
  const approvalRate = totalApplications > 0 ? Math.round((displayVerified.length / totalApplications) * 100) : 0;

  // --- 3. APPROVE / REJECT HANDLERS ---
  const handleApprove = async (docId: string, entityName: string, collectionName: string) => {
    if (!window.confirm(`Are you sure you want to verify ${entityName || 'this user'}? This grants them full trusted access.`)) return;
    
    setProcessingId(docId);
    try {
      await updateDoc(doc(db, collectionName, docId), {
        verified: true,
        verificationStatus: "verified",
        verifiedAt: serverTimestamp(),
      });
      setSelectedFiles(null);
      setViewingProfileId(null);
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve request.");
    }
    setProcessingId(null);
  };

  const handleReject = async (docId: string, collectionName: string) => {
    const reason = window.prompt("Please provide a reason for rejection for the compliance log:");
    if (!reason) return;
    
    setProcessingId(docId);
    try {
      await updateDoc(doc(db, collectionName, docId), {
        verified: false,
        verificationStatus: "rejected",
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
      });
      setSelectedFiles(null);
      setViewingProfileId(null);
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Failed to reject request.");
    }
    setProcessingId(null);
  };

  const handleRealDownload = (fileUrlOrData: string, docTitle: string, orgName: string) => {
    if (fileUrlOrData.startsWith('http') || fileUrlOrData.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fileUrlOrData;
      a.download = `${orgName.replace(/\s+/g, '_')}_${docTitle.replace(/\s+/g, '_')}`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const pdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkJPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iaiAgJSBwYWdlIGNvbnRlbnQKPDwKICAvTGVuZ3RoIDEwMwo+PgpzdHJlYW0KQlQKNTAgNzUwIFRECi9GMSAyNCBUZgooQVRIQVIgT0ZGSUNJQUwgRE9DVU1FTlQpIFRqCjAgLTUwIFRECi9GMSAxNCBUZgooQXVkaXQgUGxhY2Vob2xkZXI6IFN0b3JhZ2Ugbm90IGxpbmtlZCB5ZXQuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2NyAwMDAwMCBuIAowMDAwMDAwMTY0IDAwMDAwIG4gCjAwMDAwMDAyOTMgMDAwMDAgbiAKMDAwMDAwMDM4NCAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0OTgKJSVFT0YK";
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: 'application/pdf'});
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      let finalName = fileUrlOrData.includes('.') ? fileUrlOrData : `${orgName.replace(/\s+/g, '_')}_${docTitle.replace(/\s+/g, '_')}.pdf`;
      if (!finalName.toLowerCase().endsWith('.pdf')) finalName += '.pdf';

      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString();
    return 'Recently';
  };

  if (loading) return <div className="p-12 text-center text-[#043E52] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Fetching Compliance Queue...</div>;

  // ============================================================================
  // 🔥 DYNAMIC INLINE PROFILE VIEW (HANDLES BOTH ORGS & USERS) 🔥
  // ============================================================================
  if (viewingProfileId) {
    const profile = [...pendingReqs, ...verifiedReqs, ...rejectedReqs].find(o => o.id === viewingProfileId);
    if (!profile) return setViewingProfileId(null);

    const isUser = profile.collectionName === 'users';
    
    // SAFE NAME EXTRACTION TO PREVENT CRASHES
    const safeName = isUser 
      ? (profile.legalIdentity?.legalName || profile.name || 'Unknown User')
      : (profile.auditData?.legalName || profile.name || 'Unknown Organization');

    return (
      <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Button variant="ghost" onClick={() => setViewingProfileId(null)} className="text-slate-500 hover:text-[#043E52] hover:bg-slate-100 -ml-4 h-10 font-bold uppercase tracking-wider text-xs">
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue
        </Button>

        <Card className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border-slate-200">
            <div className={`h-48 relative shrink-0 ${isUser ? 'bg-gradient-to-r from-[#016A6D] to-[#1C9290]' : 'bg-[#043E52]'}`}>
               {profile.coverUrl && !isUser && <img src={profile.coverUrl} className="w-full h-full object-cover opacity-60" />}
            </div>

            <div className="p-6 md:p-8 -mt-16 relative z-10">
               <div className="flex flex-col md:flex-row gap-5 items-start md:items-end mb-8">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-xl bg-white rounded-2xl">
                    <AvatarImage src={profile.photoUrl || profile.logoUrl || profile.avatarUrl} className="object-cover rounded-xl" />
                    <AvatarFallback className="bg-slate-100 text-[#043E52] text-3xl font-bold rounded-xl">{safeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 pb-2">
                     <h2 className="text-3xl font-black text-[#043E52] leading-none mb-2">{safeName}</h2>
                     <p className="text-slate-500 font-bold text-sm mb-3">
                        {isUser ? (profile.email || 'No email provided') : (profile.tagline || 'No tagline provided')}
                     </p>
                     
                     <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isUser ? (
                          <>
                             <Badge variant="secondary" className="bg-[#1C9290]/10 text-[#1C9290] border-none font-bold text-[10px] px-2 py-1">Volunteer</Badge>
                             <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md"><Globe className="h-3.5 w-3.5" /> {profile.legalIdentity?.type === 'citizen' ? 'Citizen' : 'Foreigner'}</span>
                             <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md"><Fingerprint className="h-3.5 w-3.5" /> ID: {profile.legalIdentity?.idNumber || 'N/A'}</span>
                          </>
                        ) : (
                          <>
                             <Badge variant="secondary" className="bg-[#1C9290]/10 text-[#1C9290] border-none font-bold text-[10px] px-2 py-1">{profile.category || 'Non-Profit'}</Badge>
                             <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md"><FileDigit className="h-3.5 w-3.5" /> ID: {profile.registrationId || profile.auditData?.licenseId || 'N/A'}</span>
                             <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md"><Calendar className="h-3.5 w-3.5" /> Est: {profile.yearFounded || 'N/A'}</span>
                          </>
                        )}
                     </div>
                  </div>
                  
                  {profile.verificationStatus === 'pending' && (
                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                      <Button onClick={() => handleApprove(profile.id, safeName, profile.collectionName)} className="bg-[#1C9290] hover:bg-[#157a78] text-white font-bold h-11 px-6 shadow-md"><CheckCircle className="mr-2 h-4 w-4"/> Approve</Button>
                      <Button onClick={() => handleReject(profile.id, profile.collectionName)} variant="destructive" className="h-11 font-bold px-6 shadow-md"><XCircle className="mr-2 h-4 w-4"/> Reject</Button>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Contact & Quick Info */}
                  <div className="lg:col-span-1 space-y-6">
                     <Card className="border border-slate-100 shadow-sm bg-slate-50/50">
                       <CardContent className="p-5 space-y-4">
                         <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Contact Info</h4>
                         <div className="space-y-3 text-sm text-slate-600 font-medium">
                           <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#1C9290]"/> <span className="break-all">{profile.email || 'N/A'}</span></div>
                           <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#1C9290]"/> <span>{profile.phone || 'N/A'}</span></div>
                           {isUser ? (
                             <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#E16A3D]"/> <span>{profile.city ? `${profile.city}, ${profile.country || ''}` : 'Location N/A'}</span></div>
                           ) : (
                             <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-[#1C9290]"/> <a href={profile.website} target="_blank" rel="noreferrer" className="hover:underline text-[#1C9290]">{profile.website || 'N/A'}</a></div>
                           )}
                         </div>
                       </CardContent>
                     </Card>

                     {isUser ? (
                       <Card className="border border-rose-100 shadow-sm bg-rose-50/30">
                         <CardContent className="p-5 space-y-4">
                           <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest border-b border-rose-200 pb-2 mb-3 flex items-center gap-2"><Activity className="h-4 w-4"/> Crisis Readiness</h4>
                           <div className="space-y-3 text-sm text-slate-600 font-medium">
                             <div className="flex items-center justify-between"><span>Blood Type</span><strong className="text-rose-700">{profile.crisisInfo?.bloodType || 'N/A'}</strong></div>
                             <div className="flex items-center justify-between"><span>Driver</span><strong>{profile.crisisInfo?.drivingLicense ? 'Yes' : 'No'}</strong></div>
                             <Separator className="bg-rose-100" />
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Emergency Contact</p>
                                <p className="text-[#043E52] font-bold">{profile.crisisInfo?.emergencyName || 'N/A'} <span className="text-[10px] text-slate-500 font-normal">({profile.crisisInfo?.emergencyRelation || 'Relation N/A'})</span></p>
                                <p className="text-xs mt-0.5">{profile.crisisInfo?.emergencyPhone || 'No phone'}</p>
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ) : (
                       <Card className="border border-slate-100 shadow-sm bg-slate-50/50">
                         <CardContent className="p-5 space-y-4">
                           <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Headquarters</h4>
                           <div className="space-y-3 text-sm text-slate-600 font-medium">
                             <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-[#E16A3D] mt-0.5"/> <span>{profile.address || 'Address not provided'}</span></div>
                             <div className="flex items-center gap-3 pl-7"><span>{profile.city ? `${profile.city}, ${profile.country || ''}` : 'City/Country N/A'}</span></div>
                           </div>
                         </CardContent>
                       </Card>
                     )}
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-2 space-y-6">
                     {isUser ? (
                       <>
                         <Card className="border border-slate-100 shadow-sm">
                           <CardContent className="p-6">
                             <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><UserCheck className="h-4 w-4 text-[#1C9290]" /> Identity Declaration</h4>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Legal Name</p><p className="font-bold text-slate-800 text-sm">{profile.legalIdentity?.legalName || 'N/A'}</p></div>
                               <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">ID Number</p><p className="font-bold text-slate-800 text-sm font-mono">{profile.legalIdentity?.idNumber || 'N/A'}</p></div>
                               <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Birth Year</p><p className="font-bold text-slate-800 text-sm">{profile.legalIdentity?.birthYear || 'N/A'}</p></div>
                               <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status</p><p className="font-bold text-slate-800 text-sm">{profile.legalIdentity?.type || 'N/A'}</p></div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="border border-slate-100 shadow-sm">
                           <CardContent className="p-6">
                              <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-[#1C9290]" /> Volunteer Bio</h4>
                              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                                {profile.bio || 'No bio provided.'}
                              </p>
                           </CardContent>
                         </Card>
                       </>
                     ) : (
                       <>
                         <Card className="border border-slate-100 shadow-sm">
                           <CardContent className="p-6 space-y-6">
                             <div>
                               <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><Building className="h-4 w-4 text-[#1C9290]" /> Organizational Charter</h4>
                               <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                                 {profile.description || 'No description provided.'}
                               </p>
                             </div>
                             <div>
                               <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><Scale className="h-4 w-4 text-[#1C9290]" /> Legal Mission Statement</h4>
                               <blockquote className="border-l-4 border-[#1C9290] pl-4 py-2 text-sm font-bold text-slate-700 italic bg-slate-50/80 rounded-r-xl">
                                 "{profile.mission || 'Pending.'}"
                               </blockquote>
                             </div>
                           </CardContent>
                         </Card>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border border-slate-100 shadow-sm">
                               <CardContent className="p-5">
                                  <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-[#E16A3D]" /> Board of Directors</h4>
                                  <p className="text-sm text-slate-600 bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                    {profile.boardMembers || 'Not disclosed.'}
                                  </p>
                               </CardContent>
                            </Card>
                            <Card className="border border-slate-100 shadow-sm">
                               <CardContent className="p-5">
                                  <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[#E16A3D]" /> Safeguarding Policy</h4>
                                  <p className="text-sm text-slate-600 bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                    {profile.safeguardingPolicy || 'Not disclosed.'}
                                  </p>
                               </CardContent>
                            </Card>
                         </div>
                       </>
                     )}
                  </div>
               </div>
            </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // MAIN DASHBOARD UI
  // ============================================================================
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      
      {/* Header & Master Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[#043E52] font-bold text-2xl mb-1">Compliance & Verification</h1>
          <p className="text-slate-500 font-medium text-sm">Validate identity credentials and corporate audits to maintain platform trust.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button 
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'organizations' ? 'bg-white text-[#043E52] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} 
            onClick={() => setViewMode('organizations')}
          >
            <Building2 className="h-4 w-4" /> NGO Audits
          </button>
          <button 
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'users' ? 'bg-white text-[#043E52] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} 
            onClick={() => setViewMode('users')}
          >
            <UserCheck className="h-4 w-4" /> Volunteer KYC
          </button>
        </div>
      </div>

      {/* DYNAMIC STATS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#E16A3D] to-[#c2562d] text-white border-none shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><FileText className="h-24 w-24" /></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div><p className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">Pending Approval</p><p className="text-4xl font-bold">{displayPending.length}</p></div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Clock className="h-6 w-6 text-white" /></div>
            </div>
            <div className="mt-4 text-[10px] font-bold text-orange-100 bg-black/10 w-fit px-3 py-1 rounded-full uppercase tracking-wider">Requires Action</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1C9290] to-[#157a78] text-white border-none shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle className="h-24 w-24" /></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div><p className="text-teal-100 text-xs font-bold uppercase tracking-wider mb-1">Verified Entities</p><p className="text-4xl font-bold">{displayVerified.length}</p></div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><ShieldCheck className="h-6 w-6 text-white" /></div>
            </div>
            <div className="mt-4 text-[10px] font-bold text-teal-100 bg-black/10 w-fit px-3 py-1 rounded-full uppercase tracking-wider">Active on Platform</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#043E52] to-[#033040] text-white border-none shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="h-24 w-24" /></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div><p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">Pipeline Clearance</p><p className="text-4xl font-bold">{approvalRate}%</p></div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><Activity className="h-6 w-6 text-white" /></div>
            </div>
            <div className="mt-4 text-[10px] font-bold text-slate-300 bg-white/5 w-fit px-3 py-1 rounded-full uppercase tracking-wider">{totalApplications} Total Submissions</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit h-auto">
          <TabsTrigger value="pending" className="data-[state=active]:bg-[#E16A3D] data-[state=active]:text-white rounded-lg px-6 py-2 transition-all font-bold text-xs uppercase tracking-wider">
            Pending Queue <Badge className="ml-2 bg-white text-[#E16A3D] hover:bg-white/90 shadow-none font-black">{displayPending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="verified" className="data-[state=active]:bg-[#1C9290] data-[state=active]:text-white rounded-lg px-6 py-2 transition-all font-bold text-xs uppercase tracking-wider">Verified DB</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all font-bold text-xs uppercase tracking-wider">Rejected</TabsTrigger>
        </TabsList>

        {/* PENDING QUEUE */}
        <TabsContent value="pending" className="space-y-4">
          {displayPending.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <CheckCircle className="h-12 w-12 text-[#1C9290] mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-slate-700">Queue is Empty</h3>
              <p className="text-slate-500 mt-1 text-sm">All submissions in this pipeline have been processed.</p>
            </div>
          ) : displayPending.map((request) => {
            
            // SAFE NAME HANDLING
            const safeName = viewMode === 'users' 
              ? (request.legalIdentity?.legalName || request.name || "Unknown User")
              : (request.auditData?.legalName || request.name || "Unnamed Org");

            return (
            <Card key={request.id} className="border border-slate-200 hover:shadow-md transition-all duration-300 group overflow-hidden bg-white">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1.5 bg-[#E16A3D] h-2 md:h-auto"></div>
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex flex-col xl:flex-row gap-6">
                    <div className="flex items-start gap-4 min-w-[240px] shrink-0">
                      <Avatar className="w-14 h-14 md:w-16 md:h-16 border-2 border-orange-100 shadow-sm bg-slate-50">
                        <AvatarImage src={request.photoUrl || request.logoUrl || request.avatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-[#043E52] text-white font-bold text-xl">{safeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-[#043E52] font-bold text-base md:text-lg mb-1 leading-tight">{safeName}</h3>
                        <Badge variant="secondary" className="bg-slate-100 text-[#043E52] border-slate-200 font-bold uppercase text-[9px] tracking-wider">
                          {viewMode === 'users' ? 'Volunteer' : (request.category || 'Non-Profit')}
                        </Badge>
                      </div>
                    </div>

                    {/* DYNAMIC DATA DISPLAY BASED ON PIPELINE */}
                    {viewMode === 'users' ? (
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 border-l border-slate-100 pl-0 xl:pl-6">
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Legal Name</p>
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs md:text-sm truncate"><User className="h-3.5 w-3.5 text-[#1C9290]" /> {request.legalIdentity?.legalName || 'N/A'}</div>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Residency Type</p>
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs md:text-sm"><Globe className="h-3.5 w-3.5 text-[#1C9290]" /> {request.legalIdentity?.type === 'citizen' ? 'TC Citizen' : 'Foreign Resident'}</div>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">ID Number</p>
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs md:text-sm font-mono"><Fingerprint className="h-3.5 w-3.5 text-[#E16A3D]" /> {request.legalIdentity?.idNumber || 'N/A'}</div>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Birth Year</p>
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs md:text-sm"><Calendar className="h-3.5 w-3.5 text-[#E16A3D]" /> {request.legalIdentity?.birthYear || 'N/A'}</div>
                        </div>
                        <div className="col-span-2 md:col-span-4 mt-2 bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex items-center justify-between">
                           <div>
                               <p className="text-[10px] md:text-xs font-bold text-[#043E52] uppercase tracking-wider mb-0.5">KYC Database Check</p>
                               <p className="text-[9px] md:text-[10px] text-slate-500 font-medium">Verify against National Identity Registry (MERNIS)</p>
                           </div>
                           <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[9px] uppercase tracking-widest">Pending API Match</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 border-l border-slate-100 pl-0 xl:pl-6">
                          <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Legal Signatory</p>
                              <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs md:text-sm"><Fingerprint className="h-3.5 w-3.5 text-[#E16A3D]" /> {request.auditData?.signatoryName || 'Missing'}</div>
                          </div>
                          <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tax / License ID</p>
                              <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs md:text-sm font-mono"><FileDigit className="h-3.5 w-3.5 text-[#016A6D]" /> {request.auditData?.licenseId || request.registrationId || 'Missing'}</div>
                          </div>
                          <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Founding Date</p>
                              <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs md:text-sm"><Clock className="h-3.5 w-3.5 text-[#016A6D]" /> {request.yearFounded || 'Unknown'}</div>
                          </div>
                          <div className="col-span-2 md:col-span-3 mt-2 bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex items-center justify-between">
                              <div>
                                  <p className="text-[10px] md:text-xs font-bold text-[#043E52] uppercase tracking-wider mb-0.5">Uploaded Audit Documents</p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 font-medium">Incorporation, Financials, Safeguarding, Insurance, ID</p>
                              </div>
                              <Button onClick={() => setSelectedFiles(request)} size="sm" variant="outline" className="text-[9px] uppercase font-bold text-[#1C9290] border-[#1C9290] bg-white h-7 md:h-8">
                                  View Files
                              </Button>
                          </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-[240px] bg-slate-50 p-5 md:p-6 flex flex-col justify-center gap-3 border-l border-slate-100 shrink-0">
                    <div className="flex items-center justify-between text-[10px] md:text-xs text-slate-500 mb-1">
                        <span className="uppercase font-bold tracking-wider">Submitted:</span>
                        <span className="font-bold text-[#043E52]">
                          {formatDate(viewMode === 'users' ? request.legalIdentity?.submittedAt : (request.auditSubmittedAt || request.createdAt))}
                        </span>
                    </div>
                    
                    <Button onClick={() => handleApprove(request.id, safeName, request.collectionName)} disabled={processingId === request.id} className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white shadow-sm font-bold uppercase tracking-wider text-xs h-10">
                        {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4" /> Approve</>}
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={() => setViewingProfileId(request.id)} variant="outline" className="flex-1 border-slate-200 text-[#043E52] hover:bg-white h-9" title="Review Profile">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleReject(request.id, request.collectionName)}
                          disabled={processingId === request.id}
                          variant="outline" 
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-9" 
                          title="Reject Request"
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </div>
            </Card>
          )})}
        </TabsContent>

        {/* VERIFIED DB */}
        <TabsContent value="verified" className="space-y-4">
          {displayVerified.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No verified records found in this pipeline.</div>
          ) : displayVerified.map((docItem) => {
            const safeName = viewMode === 'users' 
              ? (docItem.legalIdentity?.legalName || docItem.name || "Unknown User")
              : (docItem.auditData?.legalName || docItem.name || "Unnamed Org");

            return (
            <Card key={docItem.id} className="border border-slate-200 hover:shadow-sm transition-all group bg-white">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-slate-200 bg-slate-50">
                      <AvatarImage src={docItem.photoUrl || docItem.logoUrl || docItem.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-[#1C9290] text-white font-bold">{safeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-[#043E52] font-bold text-base mb-1 leading-none">{safeName}</h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[9px]">{viewMode === 'users' ? 'Volunteer' : (docItem.category || 'Non-Profit')}</Badge>
                        <span className="flex items-center gap-1"><FileDigit className="h-3 w-3" /> ID: {viewMode === 'users' ? docItem.legalIdentity?.idNumber : (docItem.auditData?.licenseId || docItem.registrationId || 'Verified')}</span>
                      </div>
                    </div>
                </div>
                <div className="flex flex-row md:flex-col items-end gap-2 md:gap-1 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right flex-1 md:flex-none">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Verified On</p>
                        <p className="text-xs font-bold text-[#043E52]">{formatDate(docItem.verifiedAt)}</p>
                    </div>
                    <Badge className="bg-[#1C9290]/10 text-[#1C9290] hover:bg-[#1C9290]/20 border-none px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px]">
                        <CheckCircle className="h-3 w-3 mr-1.5" /> Active Status
                    </Badge>
                </div>
              </CardContent>
            </Card>
          )})}
        </TabsContent>

        {/* REJECTED TABS */}
        <TabsContent value="rejected" className="space-y-4">
          {displayRejected.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No rejected records found in this pipeline.</div>
          ) : displayRejected.map((request) => {
            const safeName = viewMode === 'users' 
              ? (request.legalIdentity?.legalName || request.name || "Unknown User")
              : (request.auditData?.legalName || request.name || "Unnamed Org");

            return (
            <Card key={request.id} className="border border-red-200 bg-red-50/30">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-slate-800 font-bold text-base mb-1">{safeName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{viewMode === 'users' ? 'Volunteer' : (request.category || 'Organization')}</p>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-red-700 border-red-200 bg-white font-bold px-2 py-0.5 text-[10px]">
                          Reason: {request.rejectionReason || 'Failed compliance check'}
                        </Badge>
                    </div>
                </div>
                <div className="text-left md:text-right mt-2 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-red-100 pt-4 md:pt-0">
                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 mb-1 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5">Verification Failed</Badge>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rejected: {formatDate(request.rejectedAt)}</p>
                </div>
              </CardContent>
            </Card>
          )})}
        </TabsContent>
      </Tabs>

      {/* THE FILES VAULT MODAL (ORGS ONLY) */}
      {selectedFiles && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#043E52]/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-none">
            
            <div className="p-5 md:p-6 bg-[#043E52] text-white flex justify-between items-start shrink-0">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <FileText className="h-5 w-5 text-[#1C9290]" />
                   <h2 className="font-bold text-base md:text-lg leading-tight uppercase tracking-tight">Audit Documentation</h2>
                 </div>
                 <p className="text-teal-200 text-xs font-semibold">{selectedFiles.auditData?.legalName || selectedFiles.name}</p>
               </div>
               <button onClick={() => setSelectedFiles(null)} className="text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="p-5 md:p-6 bg-slate-50 space-y-3">
               {[
                 { id: 'incorporation', title: 'Certificate of Incorporation', icon: FileCheck },
                 { id: 'financial', title: 'Latest Financial Audit (Form 990)', icon: Landmark },
                 { id: 'safeguarding', title: 'Safeguarding Policy', icon: ShieldAlert },
                 { id: 'insurance', title: 'Liability Insurance', icon: Shield },
                 { id: 'signatoryId', title: 'Signatory Government ID', icon: Fingerprint }
               ].map((docItem) => {
                 const fileName = selectedFiles.auditFiles?.[docItem.id];
                 return (
                   <div key={docItem.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${fileName ? 'bg-teal-50' : 'bg-red-50'}`}>
                           <docItem.icon className={`h-4 w-4 md:h-5 md:w-5 ${fileName ? 'text-[#1C9290]' : 'text-red-400'}`} />
                         </div>
                         <div>
                           <p className="text-xs md:text-sm font-bold text-[#043E52]">{docItem.title}</p>
                           {fileName ? (
                             <p className="text-[9px] md:text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px] md:max-w-[250px]">{fileName}</p>
                           ) : (
                             <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-0.5">Missing Document</p>
                           )}
                         </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleRealDownload(fileName, docItem.title, selectedFiles.auditData?.legalName || selectedFiles.name)} 
                        size="sm" 
                        variant={fileName ? "outline" : "ghost"} 
                        disabled={!fileName} 
                        className={fileName ? "border-slate-200 text-[#043E52] hover:bg-slate-50 font-bold uppercase tracking-wider text-[9px] md:text-[10px] h-8" : "opacity-50"}
                      >
                        <DownloadCloud className="mr-1.5 md:mr-2 h-3.5 w-3.5" /> Download
                      </Button>
                   </div>
                 );
               })}
            </div>

            <div className="p-4 md:p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
               <Button variant="outline" className="text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs h-9 md:h-10" onClick={() => setSelectedFiles(null)}>Close Vault</Button>
               <Button className="bg-[#1C9290] hover:bg-[#157a78] text-white font-bold px-5 md:px-6 shadow-md h-9 md:h-10 uppercase tracking-wider text-[10px] md:text-xs" onClick={() => setSelectedFiles(null)}>
                  Acknowledge Review
               </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}