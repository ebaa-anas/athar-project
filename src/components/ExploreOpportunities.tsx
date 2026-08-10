import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, orderBy, 
  doc, getDoc, addDoc, updateDoc, increment, serverTimestamp, getDocs, where
} from "firebase/firestore";

import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MapPin, Users, Search, Heart, Sparkles,
  Building2, ShieldCheck, Zap, CheckCircle2, Calendar, X, ShieldAlert, Lock, Loader2, Target, Clock
} from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

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

export function ExploreOpportunities() {
  const { user, loading: userLoading } = useUserProfile();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // --- PROFILE COMPLETION VALIDATOR ---
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

  // 1. FETCH LIVE DATA FROM FIREBASE (ORDERED BY HISTORY)
  useEffect(() => {
    const q = query(collection(db, "opportunities"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOpportunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. SMART MATCHING ALGORITHM
  const calculateMatchScore = (opp: any, userProfile: any) => {
    if (!userProfile) return 0;
    let score = 0;

    // Skills Match (40%)
    const userSkills = userProfile.skills || [];
    const reqSkills = opp.requiredSkills || [];
    if (reqSkills.length > 0) {
      const matched = reqSkills.filter((s: string) => userSkills.includes(s));
      score += (matched.length / reqSkills.length) * 40;
    } else { score += 30; }

    // Location Match (30%)
    const userCity = userProfile.city || '';
    if (opp.location?.toLowerCase() === 'remote' || opp.location?.toLowerCase() === 'online') score += 30;
    else if (userCity && opp.location?.toLowerCase().includes(userCity.toLowerCase())) score += 30;

    // Cause/Interest Match (30%)
    const userCauses = userProfile.supportedCauses?.map((c: any) => (c.title || c.category)?.toLowerCase()) || [];
    if (userCauses.includes(opp.category?.toLowerCase()) || userCauses.includes(opp.cause?.toLowerCase())) score += 30;

    return Math.round(score);
  };

  // 3. FILTERING & SORTING ENGINE (WITH VISIBILITY MATRIX ENFORCEMENT)
  const processedOpportunities = useMemo(() => {
    const visibleOpps = opportunities.filter(opp => {
      const target = opp.targetAudience || 'public';
      
      // AVR Exclusive missions should not show on standard volunteer feed
      if (target === 'avr_only') return false; 

      // Internal Roster missions should only show if the user belongs to that organization
      if (target === 'org_internal') {
        const userOrgs = user?.affiliatedOrgs || user?.organizations || [];
        const isMember = userOrgs.includes(opp.orgId);
        return isMember; 
      }

      return true;
    });

    let results = visibleOpps.map(opp => ({
      ...opp,
      matchScore: calculateMatchScore(opp, user)
    }));

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      results = results.filter(o => 
        o.title?.toLowerCase().includes(lower) || 
        (o.orgName || o.organization)?.toLowerCase().includes(lower)
      );
    }

    // Tab filtering
    if (activeTab === "matched") {
      return results.filter(o => o.matchScore >= 40).sort((a, b) => b.matchScore - a.matchScore);
    } else if (activeTab === "One-time") {
      return results.filter(o => o.type === "One-time");
    } else if (activeTab === "Recurring") {
      return results.filter(o => o.type === "Recurring");
    }

    return results;
  }, [opportunities, user, searchTerm, activeTab]);

  const isVerified = user?.verificationStatus === 'verified' || user?.verified === true;

  if (loading || userLoading) {
    return (
      <div className="p-12 text-center text-role-accent-teal font-bold flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin mb-4" /> 
        SYNCING MISSION BOARD...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300 font-sans">
      
      {/* Platform Matched Hero */}
      <div className="rounded-2xl bg-role-accent-teal p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4"><Target size={300} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Explore Missions</h1>
            <p className="text-teal-50 text-base font-medium max-w-lg">
              Discover opportunities precisely matched to your skill set and location.
            </p>
          </div>
          
          <div className="w-full md:w-96 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-100" />
            <Input 
              placeholder="Filter by mission or NGO..." 
              className="h-14 pl-12 pr-4 w-full bg-black/10 border-none text-white placeholder:text-teal-100 rounded-2xl focus:bg-white focus:text-slate-900 transition-all font-medium shadow-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="bg-amber-500 p-2 rounded-lg text-white"><ShieldAlert size={20} /></div>
          <div>
            <h4 className="text-amber-900 font-bold text-sm">Identity Verification Required</h4>
            <p className="text-amber-700 text-xs font-medium">Please verify your ID in your profile settings to apply for field operations.</p>
          </div>
        </div>
      )}

      {!isProfileComplete && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-red-600 p-2.5 rounded-xl text-white"><Lock size={20} /></div>
          <div>
            <h4 className="text-red-900 font-bold text-sm">Profile Incomplete</h4>
            <p className="text-red-700 text-xs font-medium">
              You must fully complete all mandatory profile sections (Main Info, About Me, Emergency Deployment, Availability, Skills, and Languages) before applying to any mission.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto flex flex-wrap justify-start shadow-inner border border-slate-200">
            <TabsTrigger value="all" className="rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-role-accent-teal data-[state=active]:shadow-md text-slate-500 transition-all">All Missions</TabsTrigger>
            <TabsTrigger value="matched" className="rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-brand-cta data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 flex items-center gap-2 transition-all">
              <Sparkles size={14} className={activeTab === 'matched' ? "text-white/80" : ""} /> Top Matches
            </TabsTrigger>
            <TabsTrigger value="One-time" className="rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-role-accent-teal text-slate-500 transition-all">One-time</TabsTrigger>
            <TabsTrigger value="Recurring" className="rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-role-accent-teal text-slate-500 transition-all">Recurring</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3 text-slate-600 text-[10px] uppercase tracking-widest font-black bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-2 w-2 bg-brand-cta rounded-full animate-ping" />
            {processedOpportunities.length} Active Deployments
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {processedOpportunities.length > 0 ? (
            processedOpportunities.map((opp) => (
              <MissionRow key={opp.id} opp={opp} isVerified={isVerified} isProfileComplete={isProfileComplete} showMatch={activeTab === 'matched'} />
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Target size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-slate-900 font-bold text-lg">No Missions Found</h3>
              <p className="text-slate-400 text-sm mt-1 font-medium">Try broadening your search or updating your skill tags.</p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

// --- SUB-COMPONENT: MISSION ROW ---
function MissionRow({ opp, isVerified, isProfileComplete, showMatch }: { opp: any, isVerified: boolean, isProfileComplete: boolean, showMatch: boolean }) {
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [orgLogo, setOrgLogo] = useState<string | null>(null);

  // FETCH ORG LOGO
  useEffect(() => {
    const fetchOrgData = async () => {
      const orgId = opp.orgId || opp.organization;
      if (orgId) {
        const orgDoc = await getDoc(doc(db, "organizations", orgId));
        if (orgDoc.exists()) {
          setOrgLogo(orgDoc.data().photoUrl || orgDoc.data().logoUrl || null);
        }
      }
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "applications"), where("oppId", "==", opp.id), where("volunteerId", "==", user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) setHasApplied(true);
      }
    };
    fetchOrgData();
  }, [opp.id, opp.orgId]);

  const submitApplication = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Session expired.");
    if (!isProfileComplete) return alert("Action Blocked: Complete your profile information before applying.");
    if (!coverLetter.trim()) return alert("Please provide a short motivation letter.");

    setIsApplying(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const vName = userDoc.exists() ? userDoc.data().name : "Volunteer";
      const orgId = opp.orgId || opp.organization || "unknown";

      await addDoc(collection(db, "applications"), {
        oppId: opp.id, oppTitle: opp.title, orgId, volunteerId: user.uid, volunteerName: vName,
        coverLetter, status: "pending", appliedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "opportunities", opp.id), { applicantsCount: increment(1) });
      
      await addDoc(collection(db, "notifications"), {
        orgId, title: 'New Application', message: `${vName} applied for ${opp.title}`,
        type: 'application', read: false, createdAt: serverTimestamp()
      });

      setHasApplied(true);
      setShowModal(false);
    } catch (e: any) { alert(`Error: ${e.message}`); }
    setIsApplying(false);
  };

  return (
    <>
      <Card className={`group transition-all duration-300 border-slate-200 hover:border-role-accent-teal shadow-sm rounded-xl overflow-hidden relative ${hasApplied ? 'bg-teal-50/30 ring-1 ring-role-accent-teal/20' : 'bg-white'}`}>
        
        {/* Dynamic Match Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${opp.matchScore >= 80 ? 'bg-brand-cta' : 'bg-role-accent-teal'}`} />

        <CardContent className="p-0">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
            
            {/* Left Section: Organization with Background Branding */}
            <div className="flex items-center gap-3 w-full md:w-[200px] shrink-0 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
               <Avatar className="h-10 w-10 rounded-lg shrink-0 shadow-sm transition-transform group-hover:scale-105">
                 <AvatarImage src={orgLogo || ""} className="object-cover" />
                 <AvatarFallback className="bg-role-accent-teal/10 text-role-accent-teal rounded-lg"><Building2 size={20} /></AvatarFallback>
               </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={11} className="text-role-accent-teal" />
                  <p className="text-[8px] font-black uppercase text-role-accent-teal tracking-tighter">Verified</p>
                </div>
                <h4 className="text-[11px] font-black text-slate-700 truncate uppercase tracking-tight">
                  {opp.orgName || opp.organization || "NGO"}
                </h4>
              </div>
            </div>

            {/* Center Section: Core Mission Content */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-role-accent-teal/10 text-role-accent-teal border-none px-2 py-0 text-[9px] font-bold uppercase tracking-wider">{opp.category || "Social"}</Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-200 px-2 py-0 text-[9px] font-bold uppercase tracking-wider">{opp.type || "One-time"}</Badge>
                
                {showMatch && (
                   <Badge className={`border-none font-black text-[9px] uppercase ml-auto px-2 py-0.5 rounded-md ${opp.matchScore >= 80 ? 'bg-brand-cta text-white shadow-sm' : 'bg-role-accent-teal/10 text-role-accent-teal'}`}>
                     <Sparkles size={8} className="mr-1 inline" /> {opp.matchScore}% Match
                   </Badge>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-role-accent-teal transition-colors line-clamp-1">
                {opp.title}
              </h3>
              
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium italic">
                "{opp.description}"
              </p>
              
              {/* Meta Data with Color Accents */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-role-accent-teal" /> {opp.location || "Remote"}</span>
                <span className="flex items-center gap-1.5"><Users size={13} className="text-role-accent-teal" /> {opp.applicantsCount || 0} / {opp.goal || "∞"} Applicants</span>
                {opp.deadline && (
                  <span className="flex items-center gap-1.5 text-warning-dark bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    <Clock size={12} /> Deadline: {opp.deadline}
                  </span>
                )}
              </div>
            </div>

            {/* Right Section: Compact CTA Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end md:ml-2 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
              {hasApplied ? (
                <Button disabled className="h-10 px-6 bg-role-accent-teal/10 text-role-accent-teal font-black text-[10px] uppercase rounded-xl border border-role-accent-teal/20 opacity-100">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Applied
                </Button>
              ) : !isVerified || !isProfileComplete ? (
                <Button disabled className="h-10 px-6 bg-slate-100 text-slate-400 font-black text-[10px] uppercase rounded-xl">
                  <Lock className="mr-1.5 h-3.5 w-3.5" /> Locked
                </Button>
              ) : (
                <Button onClick={() => setShowModal(true)} className="h-10 px-6 bg-role-accent-teal hover:bg-role-volunteer-dark text-white font-black text-[10px] uppercase rounded-xl shadow-md transition-all active:scale-95">
                  Apply Now
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-slate-300 hover:text-brand-cta hover:bg-brand-cta/10 hover:border-brand-cta/30 transition-all shrink-0">
                <Heart size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- APPLICATION MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="bg-role-accent-teal p-8 text-white flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Mission Application</h3>
                <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mt-1">{opp.title}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Motivation Letter</label>
              <Textarea 
                placeholder="Explain why your skills make you the right fit for this specific deployment..." 
                className="min-h-[160px] rounded-2xl border-slate-200 p-5 font-medium text-slate-700 focus:ring-role-accent-teal focus:border-role-accent-teal transition-all"
                value={coverLetter} 
                onChange={(e) => setCoverLetter(e.target.value)} 
              />
              <div className="flex items-center gap-2 mt-4 text-role-accent-teal">
                <ShieldCheck size={14} />
                <p className="text-[9px] font-bold uppercase tracking-wider">Your Athar Impact CV will be attached automatically.</p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1 h-14 font-black uppercase text-xs tracking-widest text-slate-500">Cancel</Button>
              <Button 
                onClick={submitApplication} 
                disabled={isApplying} 
                className="flex-[2] h-14 bg-role-accent-teal hover:bg-role-volunteer-dark text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap size={16} className="fill-current" />}
                {isApplying ? "Transmitting..." : "Send Application"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}