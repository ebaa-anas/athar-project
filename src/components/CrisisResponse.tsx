import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where, doc, updateDoc, increment, serverTimestamp, addDoc 
} from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertTriangle, Clock, MapPin, Users, CheckCircle,
  Zap, TrendingUp, Shield, Navigation, Phone, AlertCircle, ShieldAlert, ShieldCheck, X,
  UserCheck, BookOpen, Activity, Star, Lock, Unlock, Loader2
} from 'lucide-react';
import { Label } from './ui/label';
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

// Helper for formatting time
const timeAgo = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "Just now";
};

export function CrisisResponse() {
  const { user, loading } = useUserProfile();
  const [crises, setCrises] = useState<any[]>([]);
  const [myResponses, setMyResponses] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // --- 🔥 AVR CLEARANCE TRACKERS 🔥 ---
  const [coreTrainingComplete, setCoreTrainingComplete] = useState(false);
  const [simulationsMastered, setSimulationsMastered] = useState(0);

  // --- 1. FETCH CRISES & CLEARANCE DATA ---
  useEffect(() => {
    if (!user) return; 

    // Fetch Crises
    const unsubscribeCrises = onSnapshot(collection(db, "crises"), (snapshot) => {
      const allCrises = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCrises(allCrises);
    });

    // Fetch My Responses
    const qResponses = query(collection(db, "crisisResponses"), where("volunteerId", "==", user.uid));
    const unsubscribeResponses = onSnapshot(qResponses, (snapshot) => {
      setMyResponses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Clearance Req 1: Core Training (Course ID '1')
    const qSkills = query(collection(db, "userSkills"), where("userId", "==", user.uid), where("courseId", "==", "1"), where("isCompleted", "==", true));
    const unsubSkills = onSnapshot(qSkills, (snap) => {
        setCoreTrainingComplete(!snap.empty);
    });

    // Fetch Clearance Req 2: AI Simulations (Score >= 90)
    const qSims = query(collection(db, "userSimulations"), where("userId", "==", user.uid), where("score", ">=", 90));
    const unsubSims = onSnapshot(qSims, (snap) => {
        setSimulationsMastered(snap.size);
    });

    return () => {
      unsubscribeCrises();
      unsubscribeResponses();
      unsubSkills();
      unsubSims();
    };
  }, [user]);

  // --- 2. CATEGORIZE ALERTS ---
  const activeAlerts = crises.filter(c => 
    c.status === 'Active' && !myResponses.find(r => r.crisisId === c.id)
  );

  const acceptedAlerts = crises.filter(c => 
    c.status === 'Active' && myResponses.find(r => r.crisisId === c.id && r.status === 'accepted')
  );

  const completedAlerts = crises.filter(c => 
    c.status === 'Completed' && myResponses.find(r => r.crisisId === c.id && r.status === 'accepted')
  );

  // --- 3. HANDLE ACCEPT / DECLINE ---
  const handleResponse = async (crisisId: string, status: 'accepted' | 'declined') => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await addDoc(collection(db, "crisisResponses"), {
        crisisId,
        volunteerId: currentUser.uid,
        status,
        respondedAt: serverTimestamp()
      });

      if (status === 'accepted') {
        await updateDoc(doc(db, "crises", crisisId), {
          volunteersResponded: increment(1)
        });
      }
    } catch (error) {
      console.error("Error responding to crisis:", error);
    }
  };

  // --- 4. ACTION: SECURE DIRECTIONS ---
  const handleSecureDirections = (location: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(mapsUrl, '_blank');
  };

  // --- 5. ACTION: CONNECT COMMAND (DEPLOY) ---
  const handleConnectCommand = async () => {
    if (!user || !selectedAlert) return;
    setIsDeploying(true);

    try {
      await addDoc(collection(db, "crisisResponses"), {
        crisisId: selectedAlert.id,
        volunteerId: user.uid,
        status: "accepted",
        respondedAt: serverTimestamp()
      });

      await addDoc(collection(db, "applications"), {
        oppId: selectedAlert.id,
        oppTitle: `CRISIS: ${selectedAlert.title}`,
        orgId: selectedAlert.orgId,
        orgName: selectedAlert.organization || "Command Center",
        volunteerId: user.uid,
        volunteerName: user.name || "AVR Responder",
        status: "accepted", 
        type: "emergency",
        appliedAt: serverTimestamp()
      });

      const crisisRef = doc(db, "crises", selectedAlert.id);
      await updateDoc(crisisRef, {
        volunteersResponded: increment(1)
      });

      if (selectedAlert.commsLink) {
          let url = selectedAlert.commsLink;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
          }
          window.open(url, '_blank');
      }

      alert("Deployment Confirmed. You are now connected to the Command Channel. Please check your 'Messages' tab.");
      setSelectedAlert(null);

    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Error connecting to command. Please try again.");
    }
    setIsDeploying(false);
  };


  // ============================================================================
  // 🔥 THE ELITE AVR CLEARANCE DASHBOARD (NON-MEMBERS) 🔥
  // ============================================================================
  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 text-[#016A6D] animate-spin" /></div>;
  
  if (!user?.isAVRMember) {
    const isIdVerified = user?.verificationStatus === 'verified';
    const hasImpact = (user?.impactPoints || 0) >= 500;
    const hasCoreTraining = coreTrainingComplete;
    const hasSimulations = simulationsMastered >= 2;

    const meetsAllReqs = isIdVerified && hasImpact && hasCoreTraining && hasSimulations;

    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
        
        {/* Banner */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-[#016A6D] to-[#1C9290] text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <ShieldAlert className="w-64 h-64" />
          </div>
          <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20 shrink-0">
              <Shield className="h-16 w-16 text-teal-100" />
            </div>
            <div>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none font-black text-[10px] uppercase tracking-widest mb-3 px-3 py-1">Restricted Clearance</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3 tracking-tight">Athar Volunteer Reserve (AVR)</h2>
              <p className="text-teal-50 text-base leading-relaxed max-w-2xl font-medium">
                The AVR is our elite emergency deployment unit. To access live crisis comms and field deployments, you must prove your identity, complete field readiness training, and demonstrate competence under pressure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Grid */}
        <div className="space-y-4">
          <h3 className="text-[#043E52] font-black text-xl uppercase tracking-tight ml-2">Clearance Requirements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Req 1: Identity */}
            <Card className={`border-2 transition-colors ${isIdVerified ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
              <CardContent className="p-6 flex items-start gap-5">
                <div className={`p-3 rounded-2xl shrink-0 ${isIdVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {isIdVerified ? <CheckCircle className="h-8 w-8" /> : <UserCheck className="h-8 w-8" />}
                </div>
                <div>
                  <h4 className={`font-black text-lg ${isIdVerified ? 'text-emerald-700' : 'text-[#043E52]'}`}>Official KYC Verification</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1 mb-3">Identity must be verified against the MERNIS national database.</p>
                  <Badge className={`font-bold uppercase tracking-wider text-[10px] ${isIdVerified ? 'bg-emerald-500 hover:bg-emerald-500 border-none text-white' : 'bg-slate-100 text-slate-400 border-none'}`}>
                    {isIdVerified ? 'Identity Verified' : 'Pending Verification'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Req 2: Core Training */}
            <Card className={`border-2 transition-colors ${hasCoreTraining ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
              <CardContent className="p-6 flex items-start gap-5">
                <div className={`p-3 rounded-2xl shrink-0 ${hasCoreTraining ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {hasCoreTraining ? <CheckCircle className="h-8 w-8" /> : <BookOpen className="h-8 w-8" />}
                </div>
                <div>
                  <h4 className={`font-black text-lg ${hasCoreTraining ? 'text-emerald-700' : 'text-[#043E52]'}`}>Core Protocol Certification</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1 mb-3">Must complete the "Emergency Response Fundamentals" path.</p>
                  <Badge className={`font-bold uppercase tracking-wider text-[10px] ${hasCoreTraining ? 'bg-emerald-500 hover:bg-emerald-500 border-none text-white' : 'bg-slate-100 text-slate-400 border-none'}`}>
                    {hasCoreTraining ? 'Certified' : 'Incomplete'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Req 3: AI Simulations */}
            <Card className={`border-2 transition-colors ${hasSimulations ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
              <CardContent className="p-6 flex items-start gap-5">
                <div className={`p-3 rounded-2xl shrink-0 ${hasSimulations ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {hasSimulations ? <CheckCircle className="h-8 w-8" /> : <Activity className="h-8 w-8" />}
                </div>
                <div className="w-full">
                  <h4 className={`font-black text-lg ${hasSimulations ? 'text-emerald-700' : 'text-[#043E52]'}`}>AI Stress Testing</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1 mb-3">Master at least 2 crisis scenarios (90%+ Score) in the Simulator.</p>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <span>{simulationsMastered} / 2 Mastered</span>
                    <span className={hasSimulations ? 'text-emerald-500' : ''}>{Math.min(100, Math.round((simulationsMastered/2)*100))}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${hasSimulations ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (simulationsMastered/2)*100)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Req 4: Impact Points */}
            <Card className={`border-2 transition-colors ${hasImpact ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
              <CardContent className="p-6 flex items-start gap-5">
                <div className={`p-3 rounded-2xl shrink-0 ${hasImpact ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {hasImpact ? <CheckCircle className="h-8 w-8" /> : <Star className="h-8 w-8" />}
                </div>
                <div className="w-full">
                  <h4 className={`font-black text-lg ${hasImpact ? 'text-emerald-700' : 'text-[#043E52]'}`}>Field Impact Record</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1 mb-3">Accumulate 500+ Impact Points across the platform.</p>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <span>{user?.impactPoints || 0} / 500 Points</span>
                    <span className={hasImpact ? 'text-emerald-500' : ''}>{Math.min(100, Math.round(((user?.impactPoints || 0)/500)*100))}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${hasImpact ? 'bg-emerald-500' : 'bg-[#1C9290]'}`} style={{ width: `${Math.min(100, ((user?.impactPoints || 0)/500)*100)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Area */}
        <div className="pt-6 flex flex-col items-center text-center">
          {meetsAllReqs ? (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
              <div className="bg-emerald-100 p-4 rounded-full mb-4">
                <Unlock className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-[#016A6D] mb-2">All Clearances Approved</h3>
              <p className="text-slate-500 font-medium mb-6">You are officially eligible to join the Athar Volunteer Reserve.</p>
              <Button 
                onClick={async () => await updateDoc(doc(db, "users", user.uid), { isAVRMember: true })}
                className="bg-[#016A6D] hover:bg-[#125d56] h-14 px-10 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all hover:scale-105"
              >
                <ShieldCheck className="mr-2 h-5 w-5" /> Request AVR Activation
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-50">
              <Lock className="h-8 w-8 text-slate-400 mb-3" />
              <Button disabled className="bg-slate-200 text-slate-400 font-black h-14 px-10 uppercase tracking-wider rounded-2xl">
                Requirements Not Met
              </Button>
            </div>
          )}
        </div>

      </div>
    );
  }

  // ============================================================================
  // MAIN AVR DASHBOARD (FOR MEMBERS)
  // ============================================================================
  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-[#016A6D] text-3xl font-black tracking-tight mb-2">Crisis Command Hub</h1>
        <p className="text-slate-500 font-medium">
          Secure AVR Channel. Receive real-time crisis alerts matched to your verified tactical skills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="bg-red-50 p-2.5 rounded-xl"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Alerts</p><p className="text-2xl font-black text-[#043E52]">{activeAlerts.length}</p></div></div></CardContent></Card>
        <Card className="border-l-4 border-l-[#1C9290] shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="bg-teal-50 p-2.5 rounded-xl"><Zap className="h-5 w-5 text-[#1C9290]" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deployments</p><p className="text-2xl font-black text-[#043E52]">{acceptedAlerts.length}</p></div></div></CardContent></Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="bg-blue-50 p-2.5 rounded-xl"><CheckCircle className="h-5 w-5 text-blue-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p><p className="text-2xl font-black text-[#043E52]">{completedAlerts.length}</p></div></div></CardContent></Card>
        <Card className="border-l-4 border-l-[#016A6D] shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="bg-[#016A6D]/10 p-2.5 rounded-xl"><TrendingUp className="h-5 w-5 text-[#016A6D]" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Readiness</p><p className="text-2xl font-black text-[#043E52]">Tier 1</p></div></div></CardContent></Card>
      </div>

      <Card className="border-none shadow-md bg-gradient-to-br from-[#016A6D] to-[#1C9290] text-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
              <Shield className="h-8 w-8 text-teal-100" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2 tracking-tight">
                Athar Volunteer Reserve Status: <Badge className="bg-emerald-500 text-white border-none ml-2 font-black text-[10px] uppercase tracking-widest px-2 py-0.5 shadow-sm">ACTIVE</Badge>
              </h3>
              <p className="text-teal-50 text-sm mb-4 leading-relaxed max-w-3xl font-medium">
                You are cleared for deployment. Verified government and NGO partners can activate you instantly for crisis response. 
                Alerts are matched securely to your verified KYC and skill credentials.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-teal-100 uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Skills Verified</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> MERNIS Checked</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Standby Ready</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-wrap justify-start">
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-white font-bold text-xs uppercase tracking-wider text-slate-500 data-[state=active]:text-[#E16A3D] px-5 py-2.5 shadow-sm">
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge className="ml-2 bg-[#E16A3D] text-white border-none px-1.5 min-w-[20px] h-5 flex items-center justify-center shadow-none">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-white font-bold text-xs uppercase tracking-wider text-slate-500 data-[state=active]:text-[#1C9290] px-5 py-2.5 shadow-sm">
            My Deployments ({acceptedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white font-bold text-xs uppercase tracking-wider text-slate-500 data-[state=active]:text-[#016A6D] px-5 py-2.5 shadow-sm">
            Mission History ({completedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeAlerts.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
              <CardContent className="p-16 text-center flex flex-col items-center">
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-[#016A6D] mb-2 tracking-tight">Sector is Clear</h3>
                <p className="text-slate-500 font-medium">You're on standby. We will notify you instantly when an emergency matches your profile.</p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <CrisisAlertCard 
                key={alert.id} 
                alert={alert} 
                onAccept={handleResponse}
                onDecline={handleResponse}
                onViewDetails={setSelectedAlert}
                statusType="active"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4 mt-6">
          {acceptedAlerts.map((alert) => (
            <CrisisAlertCard 
              key={alert.id} 
              alert={alert}
              onViewDetails={setSelectedAlert}
              statusType="accepted"
            />
          ))}
          {acceptedAlerts.length === 0 && <p className="text-center text-slate-500 py-10 font-medium italic">You are not currently deployed on any missions.</p>}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedAlerts.map((alert) => (
            <CrisisAlertCard 
              key={alert.id} 
              alert={alert}
              onViewDetails={setSelectedAlert}
              statusType="completed"
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* --- THE CRISIS BRIEFING MODAL --- */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#043E52]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
            
            <div className={`${selectedAlert.severity === 'Critical' ? 'bg-[#E16A3D]' : 'bg-amber-500'} p-6 md:p-8 relative`}>
              <button 
                onClick={() => setSelectedAlert(null)} 
                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-2 rounded-full"
              >
                <X size={20} />
              </button>
              
              <Badge className="bg-black/20 hover:bg-black/20 text-white border-none mb-3 text-[10px] tracking-widest uppercase font-black shadow-none">
                {selectedAlert.severity} PRIORITY
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2 tracking-tight">
                {selectedAlert.title}
              </h2>
              <div className="flex items-center gap-2 text-white/90 font-bold text-sm uppercase tracking-wider">
                {selectedAlert.organization} <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 space-y-6">
              
              <div className="space-y-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <Label className="text-[10px] font-black text-[#016A6D] uppercase tracking-widest border-b border-slate-100 pb-2 flex w-full">Situation Report</Label>
                <div className="w-full min-h-[60px] pt-2 text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedAlert.description}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <Label className="text-[10px] font-black text-[#016A6D] uppercase tracking-widest border-b border-slate-100 pb-2 flex w-full">Location Data</Label>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="bg-orange-50 p-2 rounded-lg shrink-0 border border-orange-100">
                      <MapPin className="h-4 w-4 text-[#E16A3D]" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">{selectedAlert.location}</span>
                  </div>
                </div>

                <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <Label className="text-[10px] font-black text-[#016A6D] uppercase tracking-widest border-b border-slate-100 pb-2 flex w-full">Command Center</Label>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="bg-teal-50 p-2 rounded-lg shrink-0 border border-teal-100">
                      <Phone className="h-4 w-4 text-[#1C9290]" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">Secure Comms Channel</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                <Button 
                  onClick={() => handleSecureDirections(selectedAlert.location)}
                  className="w-full h-12 bg-[#016A6D] hover:bg-[#125d56] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-transform active:scale-95"
                >
                  <Navigation className="mr-2 h-4 w-4" /> Secure Directions
                </Button>
                
                <Button 
                  onClick={handleConnectCommand}
                  disabled={isDeploying}
                  variant="outline" 
                  className="w-full h-12 bg-white hover:bg-teal-50 border-2 border-[#1C9290] text-[#1C9290] font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Phone className="mr-2 h-4 w-4" /> 
                  {isDeploying ? "Deploying..." : "Connect Command"}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENT: Crisis Alert Card ---
function CrisisAlertCard({ alert, onAccept, onDecline, onViewDetails, statusType }: any) {
  const timeString = timeAgo(alert.createdAt);

  return (
    <Card className={`border-2 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden ${
      alert.severity === 'Critical' && statusType === 'active' ? 'border-[#E16A3D] bg-white' :
      statusType === 'accepted' ? 'border-[#1C9290] bg-white' :
      'border-slate-200 bg-white'
    }`}>
      <div className="flex flex-col md:flex-row">
        {/* Color Strip */}
        <div className={`w-full md:w-2 h-2 md:h-auto ${
          alert.severity === 'Critical' && statusType === 'active' ? 'bg-[#E16A3D]' : 
          statusType === 'accepted' ? 'bg-[#1C9290]' : 'bg-slate-300'
        }`} />
        
        <div className="p-6 flex-1">
          <div className="flex flex-col md:flex-row items-start justify-between gap-5">
            
            <div className="flex-1 w-full space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-black text-[#016A6D] tracking-tight">{alert.title}</h3>
                <Badge className={
                  alert.severity === 'Critical' ? 'bg-[#E16A3D] hover:bg-[#c2562d] font-bold text-[9px] uppercase tracking-widest border-none' :
                  alert.severity === 'High' ? 'bg-orange-500 hover:bg-orange-600 font-bold text-[9px] uppercase tracking-widest border-none' :
                  'bg-yellow-500 hover:bg-yellow-600 font-bold text-[9px] uppercase tracking-widest border-none'
                }>
                  {alert.severity}
                </Badge>
                {statusType === 'accepted' && (
                  <Badge className="bg-[#1C9290] hover:bg-[#157a78] border-none font-bold text-[9px] uppercase tracking-widest px-2"><CheckCircle className="h-3 w-3 mr-1" /> RESPONDING</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-[#043E52]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1C9290]" />
                  {alert.organization}
                </div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {timeString}</div>
                <div className="flex items-center gap-1.5 truncate max-w-[200px]"><MapPin className="h-3.5 w-3.5" /> {alert.location}</div>
              </div>

              <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {alert.description}
              </p>
              
              <div>
                <div className="flex flex-wrap gap-2">
                  {(alert.skillsNeeded || []).map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="border-teal-200 text-teal-700 bg-teal-50/50 font-bold text-[9px] uppercase tracking-widest px-2 py-0.5">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 w-fit">
                <Users className="h-4 w-4 text-slate-400" />
                <span><strong className="text-[#016A6D]">{alert.volunteersResponded} / {alert.volunteersNeeded}</strong> Personnel Activated</span>
              </div>
            </div>
            
            {/* Actions Column */}
            <div className="flex flex-col gap-3 w-full md:w-48 shrink-0 md:pl-6 md:border-l border-slate-100 justify-center">
              {statusType === 'active' && onAccept && onDecline && (
                <>
                  <Button 
                    className="w-full bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold h-11 shadow-sm text-xs uppercase tracking-wider"
                    onClick={() => onViewDetails(alert)}
                  >
                    <Zap className="mr-2 h-4 w-4" /> View Briefing
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-10 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-red-500 font-bold text-xs uppercase tracking-wider"
                    onClick={() => onDecline(alert.id, 'declined')}
                  >
                    Ignore
                  </Button>
                </>
              )}
              
              {statusType === 'accepted' && (
                <>
                  <Button className="w-full bg-[#1C9290] hover:bg-[#157a78] font-bold h-11 shadow-sm text-xs uppercase tracking-wider" onClick={() => onViewDetails(alert)}>
                    <Navigation className="mr-2 h-4 w-4" /> Mission Comms
                  </Button>
                </>
              )}

              {(statusType === 'active' || statusType === 'completed') && onViewDetails && (
                <Button 
                  variant="ghost"
                  className="w-full h-10 text-slate-500 font-bold hover:text-[#016A6D] hover:bg-slate-50 text-xs uppercase tracking-wider"
                  onClick={() => onViewDetails(alert)}
                >
                  Read Full Briefing
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </Card>
  );
}