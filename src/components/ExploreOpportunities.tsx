import { useState, useEffect } from 'react';
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
  MapPin, Users, Search, Heart, 
  Building2, ShieldCheck, Zap, CheckCircle2, Calendar, X, ShieldAlert, Lock, Loader2
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

export function ExploreOpportunities() {
  const { user, loading: userLoading } = useUserProfile(); // 🔥 Global user profile hook
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "opportunities"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOpportunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = opportunities.filter(opp => 
    opp.isCrisis !== true && 
    (opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (opp.orgName || opp.organization)?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 🔥 CHECK GLOBAL VERIFICATION STATUS 🔥
  const isVerified = user?.verificationStatus === 'verified';

  if (loading || userLoading) {
    return <div className="p-12 text-center text-[#016A6D] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Loading Mission Board...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Compact & Color-Matched Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-[#016A6D] to-[#1C9290] p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">Explore Missions</h1>
          <p className="text-teal-50 text-sm font-medium">Find your next opportunity and create real impact.</p>
        </div>
        
        <div className="w-full md:w-96 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-100 group-focus-within:text-[#016A6D]" />
          <Input 
            placeholder="Search by mission or organization..." 
            className="h-12 pl-10 pr-4 w-full bg-black/10 border-black/10 text-white placeholder:text-teal-100 rounded-xl focus:bg-white focus:text-slate-900 transition-colors font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 🔥 THE GLOBAL SECURITY BANNER 🔥 */}
      {!isVerified && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="text-red-800 font-bold text-sm">Identity Verification Required</h4>
              <p className="text-red-600 text-xs font-medium">You must verify your identity in your profile before applying to any field operations or NGO missions.</p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-wrap justify-start shadow-sm border border-slate-200">
            <TabsTrigger value="all" className="rounded-lg px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm text-slate-500 transition-all">All Missions</TabsTrigger>
            <TabsTrigger value="One-time" className="rounded-lg px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm text-slate-500 transition-all">One-time</TabsTrigger>
            <TabsTrigger value="Recurring" className="rounded-lg px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm text-slate-500 transition-all">Recurring</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider font-bold bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            {filtered.length} Live Opportunities
          </div>
        </div>

        {/* Horizontal Row List Content */}
        <TabsContent value="all" className="outline-none mt-0">
          <div className="flex flex-col gap-4">
            {filtered.map((opp) => <MissionRow key={opp.id} opp={opp} isVerified={isVerified} />)}
          </div>
        </TabsContent>

        <TabsContent value="One-time" className="outline-none mt-0">
          <div className="flex flex-col gap-4">
            {filtered.filter(o => o.type === 'One-time').map((opp) => <MissionRow key={opp.id} opp={opp} isVerified={isVerified} />)}
          </div>
        </TabsContent>

        <TabsContent value="Recurring" className="outline-none mt-0">
          <div className="flex flex-col gap-4">
            {filtered.filter(o => o.type === 'Recurring').map((opp) => <MissionRow key={opp.id} opp={opp} isVerified={isVerified} />)}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// --- HORIZONTAL ROW COMPONENT ---
function MissionRow({ opp, isVerified }: { opp: any, isVerified: boolean }) {
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    const checkIfAlreadyApplied = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "applications"), where("oppId", "==", opp.id), where("volunteerId", "==", user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) setHasApplied(true);
    };
    checkIfAlreadyApplied();
  }, [opp.id]);

  const submitApplication = async () => {
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to apply.");
    if (coverLetter.trim() === "") return alert("Please write a short cover letter before applying.");

    setIsApplying(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const volunteerName = userDoc.exists() ? userDoc.data().name : "Volunteer";
      const safeOrgId = opp.orgId || opp.organization || "unknown_org";
      const safeTitle = opp.title || "Untitled Mission";

      await addDoc(collection(db, "applications"), {
        oppId: opp.id,
        oppTitle: safeTitle,
        orgId: safeOrgId,            
        volunteerId: user.uid,       
        volunteerName: volunteerName,
        coverLetter: coverLetter, 
        status: "pending",
        appliedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "opportunities", opp.id), { applicantsCount: increment(1) });

      if (safeOrgId !== "unknown_org") {
        await addDoc(collection(db, "notifications"), {
          orgId: safeOrgId, 
          title: 'New Application Received',
          message: `${volunteerName} applied for "${safeTitle}".`,
          type: 'application',
          read: false,
          createdAt: serverTimestamp(),
          link: '/applications'
        });
      }

      setHasApplied(true);
      setShowModal(false); 
    } catch (error: any) {
      console.error("EXACT ERROR APPLYING:", error);
      alert(`Application Failed: ${error.message}`); 
    }
    setIsApplying(false);
  };

  return (
    <>
      <Card className={`group bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden ${hasApplied ? 'ring-2 ring-[#016A6D] bg-teal-50/20' : ''}`}>
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4 w-full md:w-[220px] shrink-0">
            <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center text-[#1C9290] border border-teal-100 shrink-0"><Building2 size={22} /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5"><ShieldCheck size={12} className="text-[#1C9290]" /><p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Verified</p></div>
              <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{opp.orgName || opp.organization || "NGO"}</h4>
            </div>
          </div>
          <div className="flex-1 min-w-0 w-full py-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-[#1C9290]/10 text-[#1C9290] hover:bg-[#1C9290]/20 border-none px-2 py-0 font-bold text-[10px] uppercase tracking-wider">{opp.category || "General"}</Badge>
              <Badge variant="outline" className="text-slate-500 border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider">{opp.type || "One-time"}</Badge>
            </div>
            <h3 className="text-base font-black text-[#016A6D] truncate group-hover:text-[#1C9290] transition-colors tracking-tight">{opp.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1 mb-3 font-medium">"{opp.description}"</p>
            <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {opp.location || "Remote"}</span>
              <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> <span className="text-[#016A6D]">{opp.applicantsCount || 0}</span> / {opp.goal || "∞"} Slots</span>
              {opp.deadline && <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100"><Calendar size={12} /> Deadline: {opp.deadline}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0 justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
            {hasApplied ? (
              <Button disabled className="w-full md:w-auto px-6 h-11 bg-teal-50 text-[#016A6D] font-bold text-xs uppercase tracking-wider rounded-xl opacity-100 shadow-sm border border-teal-100"><CheckCircle2 className="mr-2 h-4 w-4" /> Applied</Button>
            ) : !isVerified ? (
              // 🔥 NEW: IDENTITY LOCK 🔥
              <Button disabled variant="outline" className="w-full md:w-auto px-6 h-11 border-slate-200 bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider rounded-xl">
                <Lock className="mr-2 h-3.5 w-3.5" /> ID Required
              </Button>
            ) : (
              <Button onClick={() => setShowModal(true)} className="w-full md:w-auto px-6 h-11 bg-[#016A6D] hover:bg-[#125d56] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-colors">Apply Now</Button>
            )}
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shrink-0"><Heart size={18} /></Button>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#016A6D]/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-[#016A6D] p-6 flex items-center justify-between text-white">
              <div><h3 className="font-bold text-lg leading-none tracking-tight">Submit Application</h3><p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest mt-1.5">Applying for: {opp.title}</p></div>
              <button onClick={() => setShowModal(false)} className="text-teal-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={18} /></button>
            </div>
            <div className="p-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Why do you want to join this mission?</label>
              <p className="text-xs font-medium text-slate-500 mb-4">Organizations review this cover letter to see if you are a good fit.</p>
              <Textarea placeholder="I am passionate about community service because..." className="min-h-[140px] resize-none border-slate-200 focus:border-[#1C9290] focus:ring-[#1C9290]/20 rounded-xl font-medium text-sm p-4" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)} className="text-slate-600 hover:bg-white font-bold text-xs uppercase tracking-wider h-10 border-slate-200 px-6">Cancel</Button>
              <Button onClick={submitApplication} disabled={isApplying} className="bg-[#016A6D] hover:bg-[#125d56] text-white font-bold text-xs uppercase tracking-wider h-10 px-6 shadow-sm">{isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{isApplying ? "Sending..." : "Submit Application"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}