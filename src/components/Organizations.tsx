import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where,
  doc, addDoc, serverTimestamp, getDocs 
} from "firebase/firestore";

import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  MapPin, Users, Star, Search, ShieldCheck, Mail, Globe, 
  Briefcase, HeartHandshake, CheckCircle2, X, Target, Phone, Clock, Calendar,
  Timer, Activity, Users2, Scale, FileText, ShieldAlert, Lock, AlertTriangle, Radio
} from 'lucide-react';

import { useUserProfile } from '../hooks/useUserProfile';

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
const auth = getAuth(app);

export function Organizations() {
  const { user } = useUserProfile();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  
  // Modals State
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [showJoinModal, setShowJoinModal] = useState<any | null>(null);
  
  // Advanced Form Fields
  const [formState, setFormState] = useState({
    coverLetter: "",
    portfolioUrl: "",           // For Tier 2
    radioCallsign: "",         // For Tier 3
    hazardClearance: "No",     // For Tier 3
    deploymentNotes: ""        // For Tier 3
  });

  const [isApplying, setIsApplying] = useState(false);

  // Gatekeepers used throughout this page to lock applications behind verification and a complete profile.
  const isVerified = user?.verificationStatus === 'verified' || user?.verified === true;
  const isAvrMember = user?.isAvrMember === true || user?.avrStatus === 'active' || user?.tier === 'tier3';
  
  const userData = user as any;
  const isProfileComplete = Boolean(
    userData?.name?.trim() && 
    userData?.city?.trim() && 
    userData?.phone?.trim() && 
    userData?.bio?.trim() &&
    userData?.crisisInfo?.bloodType?.trim() &&
    userData?.crisisInfo?.emergencyName?.trim() &&
    userData?.crisisInfo?.emergencyPhone?.trim() &&
    (userData?.availability?.weekdays || userData?.availability?.weekends) &&
    (userData?.skills && userData?.skills.length > 0) &&
    (userData?.languages && userData?.languages.length > 0)
  );

  // --- Fetch data ---
  useEffect(() => {
    const qOrgs = query(collection(db, "organizations"));
    const unsubOrgs = onSnapshot(qOrgs, (snapshot) => {
      setOrganizations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchApps = async () => {
      if (!user) return;
      const qApps = query(collection(db, "applications"), where("volunteerId", "==", user.uid));
      const snap = await getDocs(qApps);
      setMyApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    
    fetchApps();
    return () => unsubOrgs();
  }, [user]);

  // --- Submit tier-specific application ---
  const handleJoinSubmit = async () => {
    if (!user) return alert("Must be logged in.");
    if (!isProfileComplete) return alert("Action Blocked: You must fully complete all mandatory profile sections before applying to any organization.");
    
    const org = showJoinModal;
    const orgTier = org.tier || 'tier1';

    if (!formState.coverLetter.trim()) return alert("Please provide a brief motivation message.");

    if (orgTier === 'tier3' && !isAvrMember) {
      return alert("Access Denied: Tier 3 Crisis Operations require verified Athar Volunteer Reserve (AVR) membership.");
    }
    
    setIsApplying(true);
    try {
      await addDoc(collection(db, "applications"), {
        oppId: "core_crew", 
        oppTitle: "Core Volunteer Crew",
        orgId: org.id,
        orgName: org.name,
        volunteerId: user.uid,
        volunteerName: user.name || "Volunteer",
        orgTier: orgTier,
        ...formState,
        status: "pending",
        type: "normal",
        appliedAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        orgId: org.id,
        title: 'New Core Crew Application!',
        message: `${user.name || 'A volunteer'} applied to join (${orgTier.toUpperCase()}) team.`,
        type: 'volunteer',
        read: false,
        createdAt: serverTimestamp(),
        link: '/applications'
      });

      setMyApplications(prev => [...prev, { orgId: org.id, oppId: 'core_crew', status: 'pending' }]);
      setShowJoinModal(null);
      setFormState({ coverLetter: "", portfolioUrl: "", radioCallsign: "", hazardClearance: "No", deploymentNotes: "" });
      alert("Application sent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to submit application.");
    }
    setIsApplying(false);
  };

  // --- Filtering ---
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          org.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const orgTier = org.tier || 'tier1';
    const matchesTier = tierFilter === 'all' || orgTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const myAcceptedOrgIds = myApplications.filter(a => a.status === 'accepted').map(a => a.orgId);
  const myOrgs = organizations.filter(o => myAcceptedOrgIds.includes(o.id));
  const myPendingCrewOrgIds = myApplications.filter(a => a.status === 'pending' && a.oppId === 'core_crew').map(a => a.orgId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-300 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 text-2xl font-black tracking-tight">Organizations Network</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Discover community initiatives, standard NGOs, and tactical crisis response teams</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search organizations..." 
              className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#1C9290]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* HEADER TIER FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
        {[
          { id: 'all', label: 'All Entities' },
          { id: 'tier1', label: 'Tier 1: Community Initiatives' },
          { id: 'tier2', label: 'Tier 2: NGOs' },
          { id: 'tier3', label: 'Tier 3: Crisis Ops' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTierFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              tierFilter === tab.id 
                ? 'bg-[#1C9290] text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECURITY / PROFILE COMPLETION BANNERS */}
      {!isVerified && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-orange-500 p-2.5 rounded-xl text-white"><ShieldAlert size={20} /></div>
          <div>
            <h4 className="text-orange-900 font-bold text-sm">Identity Verification Required</h4>
            <p className="text-orange-700 text-xs font-medium">Verify your ID in your profile settings to apply for organizational core crews.</p>
          </div>
        </div>
      )}

      {!isProfileComplete && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-rose-600 p-2.5 rounded-xl text-white"><Lock size={20} /></div>
          <div>
            <h4 className="text-rose-900 font-bold text-sm">Profile Incomplete</h4>
            <p className="text-rose-700 text-xs font-medium">You must fully complete all mandatory profile sections (Main Info, About Me, Emergency Deployment, Availability, Skills, and Languages) before applying to any organization.</p>
          </div>
        </div>
      )}

      {/* My Organizations */}
      {myOrgs.length > 0 && (
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-bold text-[#043E52]">My Affiliated Organizations</CardTitle>
            <p className="text-xs text-slate-500 font-medium">Entities where your core crew membership is active</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {myOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200 rounded-xl">
                      <AvatarImage src={org.photoUrl || org.logoUrl || org.avatarUrl} className="object-cover rounded-xl" />
                      <AvatarFallback className="bg-[#1C9290]/10 text-[#1C9290] font-bold rounded-xl">
                        {String(org.name || 'O').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-slate-900 font-bold text-sm">{org.name}</h4>
                      <p className="text-xs text-[#1C9290] font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active Crew
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrg(org)} className="h-9 font-bold text-xs border-slate-200 text-[#043E52]">View Hub</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => {
            const isPending = myPendingCrewOrgIds.includes(org.id);
            const isAccepted = myAcceptedOrgIds.includes(org.id);
            const tier = org.tier || 'tier1';

            return (
              <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-white border-slate-200 rounded-2xl relative">
                
                {/* Banner Header with Tier Badge */}
                <div className={`h-20 w-full border-b border-slate-100 relative overflow-hidden ${
                  tier === 'tier3' ? 'bg-rose-900' : tier === 'tier2' ? 'bg-indigo-900' : 'bg-[#1C9290]'
                }`}>
                  {org.coverUrl ? (
                    <img src={org.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  )}
                  
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <Badge className={`border-none shadow-sm text-[9px] font-black uppercase tracking-wider px-2 py-0.5 ${
                      tier === 'tier3' ? 'bg-rose-100 text-rose-800' : tier === 'tier2' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tier === 'tier3' ? 'Tier 3: Crisis Ops' : tier === 'tier2' ? 'Tier 2: NGO' : 'Tier 1: Initiative'}
                    </Badge>
                  </div>
                </div>
                
                {/* Avatar */}
                <div className="px-5 relative -mt-10 mb-2 z-10">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-md bg-white rounded-xl">
                    <AvatarImage src={org.photoUrl || org.logoUrl || org.avatarUrl} className="object-cover rounded-xl" />
                    <AvatarFallback className="bg-[#1C9290]/10 text-[#1C9290] text-xl font-black rounded-xl">
                      {String(org.name || 'O').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <CardHeader className="pb-2 pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">{org.name}</CardTitle>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                    {org.tagline || org.mission || org.description || 'Dedicated to building community resilience.'}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4 flex flex-col flex-1 pb-5">
                  <div className="space-y-2 mt-auto text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{org.location || org.city || 'Türkiye'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{org.stats?.volunteers || org.volunteers || 0} active members</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-100 mt-2">
                    {isAccepted ? (
                      <Button disabled className="flex-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 opacity-100 text-xs">Joined</Button>
                    ) : isPending ? (
                      <Button disabled className="flex-1 bg-slate-100 text-slate-500 font-bold opacity-100 text-xs">Pending Review</Button>
                    ) : !isVerified || !isProfileComplete ? (
                      <Button disabled variant="outline" className="flex-1 border-slate-200 bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <Lock className="mr-1.5 h-3 w-3" /> Locked
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setShowJoinModal(org)} 
                        className={`flex-1 font-bold text-white text-xs shadow-sm ${
                          tier === 'tier3' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#1C9290] hover:bg-[#157a78]'
                        }`}
                      >
                        {tier === 'tier3' ? 'Deploy (AVR)' : 'Apply to Join'}
                      </Button>
                    )}
                    <Button onClick={() => setSelectedOrg(org)} variant="outline" className="flex-1 font-bold border-slate-200 text-[#043E52] text-xs">View Profile</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- TIER-BASED JOIN MODAL --- */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className={`p-5 flex items-center justify-between text-white shrink-0 ${
              showJoinModal.tier === 'tier3' ? 'bg-rose-900' : showJoinModal.tier === 'tier2' ? 'bg-indigo-900' : 'bg-[#1C9290]'
            }`}>
              <div>
                <Badge className="bg-white/20 text-white border-none mb-1 text-[9px] uppercase font-bold">
                  {showJoinModal.tier === 'tier3' ? 'Tier 3 Crisis Deployment Form' : showJoinModal.tier === 'tier2' ? 'Tier 2 Professional Application' : 'Tier 1 Community Signup'}
                </Badge>
                <h3 className="font-bold text-lg leading-none">{showJoinModal.name}</h3>
              </div>
              <button onClick={() => setShowJoinModal(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              
              {/* TIER 3 CRISIS GATEWAY CHECK */}
              {showJoinModal.tier === 'tier3' && !isAvrMember ? (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2 text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="h-5 w-5 text-rose-600" /> AVR Membership Mandatory
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    This is a Tier 3 Crisis Response entity. Deployments are restricted exclusively to active personnel enrolled in the <strong>Athar Volunteer Reserve (AVR)</strong>. Your profile does not currently reflect AVR clearance.
                  </p>
                </div>
              ) : (
                <>
                  {/* TIER 2 ADVANCED FIELD */}
                  {showJoinModal.tier === 'tier2' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Professional Verification</h4>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Portfolio / Professional Profile Link (LinkedIn, GitHub, or CV)</Label>
                        <Input 
                          placeholder="https://linkedin.com/in/username" 
                          value={formState.portfolioUrl}
                          onChange={(e) => setFormState({...formState, portfolioUrl: e.target.value})}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* TIER 3 ADVANCED TACTICAL QUESTIONNAIRE */}
                  {showJoinModal.tier === 'tier3' && (
                    <div className="space-y-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-rose-600 animate-pulse" /> Advanced Tactical Parameters
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700">Tactical Radio Callsign (Optional)</Label>
                          <Input 
                            placeholder="e.g. Alpha-4" 
                            value={formState.radioCallsign}
                            onChange={(e) => setFormState({...formState, radioCallsign: e.target.value})}
                            className="h-9 text-xs bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700">Hazardous Terrain Clearance</Label>
                          <select 
                            value={formState.hazardClearance} 
                            onChange={(e) => setFormState({...formState, hazardClearance: e.target.value})}
                            className="w-full h-9 px-3 border border-slate-200 rounded-md text-xs font-semibold bg-white"
                          >
                            <option value="No">No Specialized Clearance</option>
                            <option value="Yes - Level 1">Yes - Level 1 (Urban Collapse)</option>
                            <option value="Yes - Level 2">Yes - Level 2 (Wilderness / Flood)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700">Special Deployment Notes / Equipment Ready</Label>
                        <Input 
                          placeholder="e.g. Equipped with satellite comms, portable generator" 
                          value={formState.deploymentNotes}
                          onChange={(e) => setFormState({...formState, deploymentNotes: e.target.value})}
                          className="h-9 text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* STANDARD MOTIVATION LETTER FOR ALL TIERS */}
                  <div className="space-y-1">
                    <Label className="block text-xs font-bold text-slate-700">Motivation / Statement of Purpose</Label>
                    <Textarea 
                      placeholder="Explain your alignment with our operational goals..."
                      className="min-h-[110px] resize-none border-slate-200 focus:border-[#1C9290] rounded-xl text-xs"
                      value={formState.coverLetter}
                      onChange={(e) => setFormState({...formState, coverLetter: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end shrink-0">
              <Button variant="ghost" onClick={() => setShowJoinModal(null)} className="text-slate-600 font-bold text-xs">Cancel</Button>
              {!(showJoinModal.tier === 'tier3' && !isAvrMember) && (
                <Button 
                  onClick={handleJoinSubmit} 
                  disabled={isApplying} 
                  className={`font-bold px-6 shadow-sm text-xs ${
                    showJoinModal.tier === 'tier3' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-[#1C9290] hover:bg-[#157a78] text-white'
                  }`}
                >
                  {isApplying ? "Transmitting..." : "Submit Formal Application"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW PROFILE MODAL --- */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <Card className="w-full max-w-4xl shadow-2xl border-none rounded-2xl overflow-hidden flex flex-col max-h-[90vh] bg-slate-50 relative">
             <Button variant="ghost" onClick={() => setSelectedOrg(null)} className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8 p-0">
               <X size={16}/>
             </Button>

             <div className="flex-1 overflow-y-auto relative">
                <div className="bg-white border-b border-slate-200 shadow-sm relative">
                  <div className={`h-32 w-full relative ${selectedOrg.tier === 'tier3' ? 'bg-rose-900' : selectedOrg.tier === 'tier2' ? 'bg-indigo-900' : 'bg-[#1C9290]'}`}>
                    {selectedOrg.coverUrl ? (
                      <img src={selectedOrg.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    )}
                  </div>

                  <div className="max-w-4xl mx-auto px-6 pb-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10 relative z-10">
                      <Avatar className="w-20 h-20 ring-4 ring-white bg-white shadow-md rounded-xl shrink-0">
                        <AvatarImage src={selectedOrg.photoUrl || selectedOrg.logoUrl || selectedOrg.avatarUrl} className="object-cover rounded-xl" />
                        <AvatarFallback className="bg-slate-100 text-[#1C9290] text-2xl font-bold rounded-xl">
                          {String(selectedOrg.name || 'O').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl font-bold text-slate-900">{selectedOrg.name}</h1>
                          {selectedOrg.verified && <ShieldCheck className="h-4 w-4 text-[#1C9290]" />}
                        </div>
                        <p className="text-slate-500 font-medium text-xs">{selectedOrg.tagline || selectedOrg.category || "Organization Profile"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                  <Card className="border border-slate-200 shadow-sm rounded-xl bg-white p-5 space-y-3">
                     <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">About Entity</h3>
                     <p className="text-slate-600 text-xs leading-relaxed">{selectedOrg.description || "No description provided."}</p>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm rounded-xl bg-white p-5 space-y-3">
                     <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Contact Details</h3>
                     <div className="text-xs text-slate-600 space-y-1.5">
                       <p className="flex items-center gap-2"><Globe size={13}/> {selectedOrg.website || "N/A"}</p>
                       <p className="flex items-center gap-2"><Mail size={13}/> {selectedOrg.email || "N/A"}</p>
                       <p className="flex items-center gap-2"><MapPin size={13}/> {selectedOrg.location || selectedOrg.city || "N/A"}</p>
                     </div>
                  </Card>
                </div>
             </div>
             
             <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <Button variant="ghost" onClick={() => setSelectedOrg(null)} className="text-slate-600 font-bold text-xs px-6">Close</Button>
                { !isProfileComplete ? (
                  <Button disabled className="bg-slate-100 text-slate-400 font-bold text-xs px-6">Locked (Profile Incomplete)</Button>
                ) : (
                  <Button onClick={() => { setSelectedOrg(null); setShowJoinModal(selectedOrg); }} className="bg-[#1C9290] hover:bg-[#157a78] text-white font-bold text-xs px-6">
                    Apply to Join
                  </Button>
                )}
             </div>
          </Card>
        </div>
      )}

    </div>
  );
}