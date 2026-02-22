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
import { Textarea } from './ui/textarea'; // <-- Added Textarea for the cover letter
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MapPin, Users, Search, Heart, 
  Building2, ShieldCheck, Zap, CheckCircle2, Calendar, X
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
const auth = getAuth(app);

export function ExploreOpportunities() {
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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      
      {/* Compact & Color-Matched Hero */}
      <div className="rounded-2xl bg-[#1C9290] p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Explore Missions</h1>
          <p className="text-teal-50 text-sm">Find your next opportunity and create real impact.</p>
        </div>
        
        <div className="w-full md:w-96 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-100 group-focus-within:text-[#1C9290]" />
          <Input 
            placeholder="Search by mission or organization..." 
            className="h-12 pl-10 pr-4 w-full bg-black/10 border-black/10 text-white placeholder:text-teal-100 rounded-xl focus:bg-white focus:text-slate-900 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-12 shadow-sm">
            <TabsTrigger value="all" className="rounded-md px-6 font-semibold data-[state=active]:bg-[#1C9290] data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 transition-all">All</TabsTrigger>
            <TabsTrigger value="One-time" className="rounded-md px-6 font-semibold data-[state=active]:bg-[#1C9290] data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 transition-all">One-time</TabsTrigger>
            <TabsTrigger value="Recurring" className="rounded-md px-6 font-semibold data-[state=active]:bg-[#1C9290] data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 transition-all">Recurring</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-slate-500 text-sm font-bold bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <Zap size={16} className="text-amber-500 fill-amber-500" />
            {filtered.length} Live Opportunities
          </div>
        </div>

        {/* Horizontal Row List Content */}
        <TabsContent value="all" className="outline-none mt-0">
          <div className="flex flex-col gap-3">
            {filtered.map((opp) => <MissionRow key={opp.id} opp={opp} />)}
          </div>
        </TabsContent>

        <TabsContent value="One-time" className="outline-none mt-0">
          <div className="flex flex-col gap-3">
            {filtered.filter(o => o.type === 'One-time').map((opp) => <MissionRow key={opp.id} opp={opp} />)}
          </div>
        </TabsContent>

        <TabsContent value="Recurring" className="outline-none mt-0">
          <div className="flex flex-col gap-3">
            {filtered.filter(o => o.type === 'Recurring').map((opp) => <MissionRow key={opp.id} opp={opp} />)}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// --- HORIZONTAL ROW COMPONENT ---
function MissionRow({ opp }: { opp: any }) {
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  // --- NEW STATES FOR THE POP-UP ---
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Check if already applied on load
  useEffect(() => {
    const checkIfAlreadyApplied = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "applications"),
        where("oppId", "==", opp.id),
        where("volunteerId", "==", user.uid)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setHasApplied(true);
      }
    };

    checkIfAlreadyApplied();
  }, [opp.id]);

  // --- THE NEW SUBMIT FUNCTION WITH COVER LETTER ---
  const submitApplication = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to apply.");
      return;
    }

    if (coverLetter.trim() === "") {
      alert("Please write a short cover letter before applying.");
      return;
    }

    setIsApplying(true);

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const volunteerName = userDoc.exists() ? userDoc.data().name : "Volunteer";

      const safeOrgId = opp.orgId || opp.organization || "unknown_org";
      const safeTitle = opp.title || "Untitled Mission";

      // Include the real cover letter here!
      await addDoc(collection(db, "applications"), {
        oppId: opp.id,
        oppTitle: safeTitle,
        orgId: safeOrgId,            
        volunteerId: user.uid,       
        volunteerName: volunteerName,
        coverLetter: coverLetter, // <--- SAVED TO DATABASE
        status: "pending",
        appliedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "opportunities", opp.id), {
        applicantsCount: increment(1)
      });

      setHasApplied(true);
      setShowModal(false); // Close the modal on success
    } catch (error: any) {
      console.error("EXACT ERROR APPLYING:", error);
      alert(`Application Failed: ${error.message}`); 
    }

    setIsApplying(false);
  };

  return (
    <>
      <Card className={`group bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden ${hasApplied ? 'ring-2 ring-[#1C9290] bg-teal-50/20' : ''}`}>
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          
          {/* Left: Organization Info */}
          <div className="flex items-center gap-4 w-full md:w-[220px] shrink-0">
            <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center text-[#1C9290] border border-teal-100 shrink-0">
              <Building2 size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <ShieldCheck size={12} className="text-[#1C9290]" />
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Verified</p>
              </div>
              <h4 className="text-sm font-bold text-slate-800 truncate pr-2">
                {opp.orgName || opp.organization || "NGO"}
              </h4>
            </div>
          </div>

          {/* Middle: Mission Details */}
          <div className="flex-1 min-w-0 w-full py-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-teal-50 text-[#1C9290] hover:bg-teal-100 border-none px-2 py-0 font-bold text-[10px] uppercase">
                {opp.category || "General"}
              </Badge>
              <Badge variant="outline" className="text-slate-500 border-slate-200 bg-white font-bold text-[10px] uppercase">
                {opp.type || "One-time"}
              </Badge>
            </div>
            
            <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-[#1C9290] transition-colors">
              {opp.title}
            </h3>
            
            <p className="text-sm text-slate-500 line-clamp-2 mt-1 mb-2 italic">
              "{opp.description}"
            </p>

            <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs font-medium">
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {opp.location || "Remote"}</span>
              <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> {opp.applicantsCount || 0} / {opp.goal || "∞"} Slots</span>
              {opp.deadline && (
                <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                  <Calendar size={12} /> Deadline: {opp.deadline}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0 justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
            {hasApplied ? (
              <Button disabled className="w-full md:w-32 h-10 bg-teal-50 text-[#1C9290] font-bold text-sm rounded-lg opacity-100">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Applied
              </Button>
            ) : (
              <Button 
                onClick={() => setShowModal(true)} // <-- Opens the Modal instead of instantly applying!
                className="w-full md:w-32 h-10 bg-[#1C9290] hover:bg-[#157a78] text-white font-bold text-sm rounded-lg shadow-sm transition-colors"
              >
                Apply Now
              </Button>
            )}
            
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shrink-0">
              <Heart size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- THE COVER LETTER MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            
            <div className="bg-[#043E52] p-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg leading-none">Submit Application</h3>
                <p className="text-teal-100 text-xs mt-1">Applying for: {opp.title}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-teal-100 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Why do you want to join this mission?
              </label>
              <p className="text-xs text-slate-500 mb-4">
                Organizations review this cover letter to see if you are a good fit. Be brief but highlight any relevant experience.
              </p>
              <Textarea 
                placeholder="I am passionate about community service because..."
                className="min-h-[140px] resize-none border-slate-200 focus:border-[#1C9290] focus:ring-[#1C9290]/20 rounded-xl"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="text-slate-600 hover:bg-slate-200 font-bold">
                Cancel
              </Button>
              <Button 
                onClick={submitApplication} 
                disabled={isApplying}
                className="bg-[#1C9290] hover:bg-[#157a78] text-white font-bold min-w-[140px]"
              >
                {isApplying ? "Sending..." : "Submit Application"}
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}