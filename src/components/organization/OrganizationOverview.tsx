import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where, addDoc, serverTimestamp 
} from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { 
  Users, Briefcase, TrendingUp, MapPin, 
  AlertCircle, Shield, AlertTriangle, 
  Building2, Crosshair, Radio, ShieldAlert, Loader2
} from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';

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

// --- MAP COORDINATES HELPER ---
const getCityCoordinates = (locationString: string) => {
  if (!locationString) return { x: 50, y: 50 };
  const loc = locationString.toLowerCase();
  if (loc.includes('istanbul')) return { x: 20, y: 25 };
  if (loc.includes('izmir')) return { x: 12, y: 55 };
  if (loc.includes('ankara')) return { x: 42, y: 40 };
  if (loc.includes('antalya')) return { x: 30, y: 75 };
  if (loc.includes('adana')) return { x: 55, y: 80 };
  if (loc.includes('gaziantep')) return { x: 65, y: 82 };
  if (loc.includes('diyarbakir')) return { x: 78, y: 70 };
  if (loc.includes('erzurum')) return { x: 80, y: 35 };
  if (loc.includes('trabzon')) return { x: 70, y: 15 };
  if (loc.includes('van')) return { x: 92, y: 55 };
  if (loc.includes('hatay')) return { x: 58, y: 88 };
  if (loc.includes('kahramanmaras') || loc.includes('maraş')) return { x: 60, y: 75 };
  if (loc.includes('malatya')) return { x: 65, y: 60 };
  if (loc.includes('bursa')) return { x: 25, y: 30 };
  return { x: 50, y: 50 }; 
};

export function OrganizationOverview() {
  const { user } = useUserProfile();
  
  // --- UI STATES ---
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // --- REAL DATA STATES ---
  const [crises, setCrises] = useState<any[]>([]);
  const [activeCrisis, setActiveCrisis] = useState<any | null>(null);
  
  const [dashboardStats, setDashboardStats] = useState({
    activeVolunteers: 0,
    openOpportunities: 0,
    pendingApplications: 0,
    totalImpactHours: 0
  });
  
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [topVolunteers, setTopVolunteers] = useState<any[]>([]);

  // --- NEW OPPORTUNITY FORM STATE ---
  const [newOpp, setNewOpp] = useState({
    title: "", cause: "Community Support", type: "On-Site (Physical)",
    location: "", skills: "", volunteersNeeded: "", date: "", description: ""
  });

  // --- 1. FETCH LIVE DASHBOARD DATA ---
  useEffect(() => {
    if (!user) return;

    // Fetch All Crises for Map
    const unsubCrises = onSnapshot(query(collection(db, "crises")), (snapshot) => {
      const fetchedCrises = snapshot.docs.map((doc, index) => {
        const data = doc.data() as any; // 🔥 TYPE FIX
        let baseCoords = getCityCoordinates(data.location || "");
        if (baseCoords.x === 50 && baseCoords.y === 50) {
            baseCoords.x = 40 + ((index % 5) * 6);
            baseCoords.y = 35 + ((index % 4) * 6);
        } else {
            baseCoords.x += (index % 2 === 0 ? 1 : -1);
            baseCoords.y += (index % 3 === 0 ? 1 : -1);
        }
        return { id: doc.id, ...data, coords: baseCoords };
      });
      setCrises(fetchedCrises);
      if (fetchedCrises.length > 0 && !activeCrisis) setActiveCrisis(fetchedCrises[0]);
    });

    // Fetch Organization's Opportunities
    const qOpps = query(collection(db, "opportunities"), where("orgId", "==", user.uid));
    const unsubOpps = onSnapshot(qOpps, (snapshot) => {
      const opps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)); // 🔥 TYPE FIX
      
      const openCount = opps.filter(o => o.status !== 'completed').length;
      
      const events = opps
        .filter(o => o.date && new Date(o.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
        
      setUpcomingEvents(events);
      setDashboardStats(prev => ({ ...prev, openOpportunities: openCount }));
    });

    // Fetch Organization's Applications
    const qApps = query(collection(db, "applications"), where("orgId", "==", user.uid));
    const unsubApps = onSnapshot(qApps, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)); // 🔥 TYPE FIX
      
      const pending = apps.filter(a => a.status === 'pending' || !a.status);
      const accepted = apps.filter(a => a.status === 'accepted');
      
      const uniqueVols = new Set(accepted.map(a => a.volunteerId)).size;
      const impactHours = accepted.length * 4; 
      
      setDashboardStats(prev => ({
        ...prev,
        pendingApplications: pending.length,
        activeVolunteers: uniqueVols,
        totalImpactHours: impactHours
      }));

      const recent = pending
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .slice(0, 4);
      setRecentApps(recent);

      const volCounts: Record<string, any> = {};
      accepted.forEach(a => {
         if (!volCounts[a.volunteerId]) {
             volCounts[a.volunteerId] = { name: a.volunteerName, count: 0, avatar: a.volunteerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${a.volunteerName}` };
         }
         volCounts[a.volunteerId].count += 1;
      });
      
      const topVols = Object.values(volCounts)
         .sort((a, b) => b.count - a.count)
         .slice(0, 4)
         .map(v => ({ name: v.name || 'Volunteer', hours: v.count * 4, avatar: v.avatar }));
         
      setTopVolunteers(topVols);
      setLoadingData(false);
    });

    return () => { unsubCrises(); unsubOpps(); unsubApps(); };
  }, [user]);

  // --- 2. HANDLE POSTING NEW OPPORTUNITY ---
  const handleDeployOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newOpp.title || !newOpp.date) return alert("Title and Date are required.");
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "opportunities"), {
        orgId: user.uid,
        orgName: user.name || "Organization",
        title: newOpp.title,
        cause: newOpp.cause,
        type: newOpp.type,
        location: newOpp.location,
        skills: newOpp.skills.split(',').map(s => s.trim()),
        volunteersNeeded: Number(newOpp.volunteersNeeded) || 10,
        volunteersResponded: 0,
        date: newOpp.date,
        description: newOpp.description,
        status: "open",
        createdAt: serverTimestamp()
      });
      
      setIsOppModalOpen(false);
      setNewOpp({ title: "", cause: "Community Support", type: "On-Site (Physical)", location: "", skills: "", volunteersNeeded: "", date: "", description: "" });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to post opportunity.");
    }
    setIsSubmitting(false);
  };


  if (loadingData) return <div className="p-12 text-center text-[#043E52] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Initiating Command Hub...</div>;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#043E52] uppercase tracking-tight">Organization Command</h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 font-semibold text-sm">
            <Building2 className="h-4 w-4 text-[#1C9290]" />
            <span>{user?.name || "Verified Partner"}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Dialog open={isOppModalOpen} onOpenChange={setIsOppModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md h-10 px-5 font-bold uppercase tracking-wider text-xs">
                <Briefcase className="mr-2 h-4 w-4" /> Post Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-none rounded-2xl shadow-2xl p-8">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#1C9290] text-white uppercase text-[10px] font-bold">Deployment Feed</Badge>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Now</span>
                </div>
                <DialogTitle className="text-xl font-bold text-[#043E52] uppercase tracking-tight">New Opportunity Specs</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleDeployOpportunity} className="space-y-6 pt-4 border-t border-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Opportunity Title</Label>
                      <Input value={newOpp.title} onChange={e => setNewOpp({...newOpp, title: e.target.value})} placeholder="e.g. Saturday Meal Sorting" required className="border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Supporting Cause</Label>
                      <select value={newOpp.cause} onChange={e => setNewOpp({...newOpp, cause: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm font-semibold text-[#043E52]">
                        <option>Community Support</option>
                        <option>Disaster Relief</option>
                        <option>Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Environment Type</Label>
                      <select value={newOpp.type} onChange={e => setNewOpp({...newOpp, type: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm font-semibold">
                        <option>On-Site (Physical)</option>
                        <option>Online (Remote)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Location / Meeting Link</Label>
                      <Input value={newOpp.location} onChange={e => setNewOpp({...newOpp, location: e.target.value})} placeholder="123 Charity Way, NY" className="border-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Skills (Comma Separated)</Label>
                    <Input value={newOpp.skills} onChange={e => setNewOpp({...newOpp, skills: e.target.value})} placeholder="Logistics, Packing" className="border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Volunteers Needed</Label>
                    <Input value={newOpp.volunteersNeeded} onChange={e => setNewOpp({...newOpp, volunteersNeeded: e.target.value})} type="number" className="border-slate-200" placeholder="10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Shift Date & Time</Label>
                    <Input value={newOpp.date} onChange={e => setNewOpp({...newOpp, date: e.target.value})} type="datetime-local" required className="border-slate-200" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Full Description</Label>
                  <Textarea value={newOpp.description} onChange={e => setNewOpp({...newOpp, description: e.target.value})} placeholder="Detail specific tasks and goals..." className="min-h-[100px] border-slate-200" />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white font-bold h-12 uppercase tracking-wider text-xs shadow-md">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deploy Opportunity"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. CRISIS HUB CARD */}
      <Card className="border border-[#1C9290]/30 bg-[#1C9290]/5 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#1C9290]" />
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-[#043E52]">
              <div className="bg-[#1C9290] text-white p-2.5 rounded-lg shadow-sm"><Shield className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-tight">Verified Partner Hub</h3>
                <p className="text-slate-600 text-sm">Authorized to activate the <span className="font-semibold text-[#1C9290]">Athar Volunteer Reserve (AVR)</span>.</p>
              </div>
            </div>
            <Button onClick={() => window.location.href = '/dashboard/organization/crisis'} className="bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold uppercase tracking-wider text-xs px-6 h-10 shadow-md">
              <AlertTriangle className="mr-2 h-4 w-4" /> Activate Crisis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. DYNAMIC STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Volunteers</p>
              <p className="text-2xl font-black text-[#043E52] mt-1">{dashboardStats.activeVolunteers}</p>
            </div>
            <div className="bg-[#043E52]/10 p-3 rounded-xl"><Users className="h-5 w-5 text-[#043E52]" /></div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Open Opportunities</p>
              <p className="text-2xl font-black text-[#1C9290] mt-1">{dashboardStats.openOpportunities}</p>
            </div>
            <div className="bg-[#1C9290]/10 p-3 rounded-xl"><Briefcase className="h-5 w-5 text-[#1C9290]" /></div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Applications</p>
              <p className="text-2xl font-black text-[#E16A3D] mt-1">{dashboardStats.pendingApplications}</p>
            </div>
            <div className="bg-[#E16A3D]/10 p-3 rounded-xl"><AlertCircle className="h-5 w-5 text-[#E16A3D]" /></div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Impact Hours</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{dashboardStats.totalImpactHours}h</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl"><TrendingUp className="h-5 w-5 text-slate-700" /></div>
          </CardContent>
        </Card>
      </div>

      {/* 3.5 THE GEOSPATIAL MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px]">
        <Card className="lg:col-span-2 bg-[#021c25] border-slate-800 shadow-md overflow-hidden relative flex flex-col">
          <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between z-10 relative">
            <div className="flex items-center gap-2">
              <Crosshair className="text-[#1C9290] h-4 w-4 animate-pulse" />
              <h2 className="text-white font-semibold tracking-wider uppercase text-xs">National Crisis Radar</h2>
            </div>
            <Badge className="bg-[#1C9290]/20 text-[#1C9290] border-none text-[10px]">TÜRKİYE</Badge>
          </div>

          <div className="flex-1 relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#043E52]/40 to-[#021c25]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1C929015_1px,transparent_1px),linear-gradient(to_bottom,#1C929015_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
               <div className="w-[600px] h-[600px] rounded-full border border-[#1C9290]/30 border-t-[#1C9290] animate-[spin_4s_linear_infinite]" />
            </div>

            {crises.map((crisis) => {
              const isActive = activeCrisis?.id === crisis.id;
              const isMine = crisis.orgId === user?.uid;

              return (
                <button
                  key={crisis.id}
                  onClick={() => setActiveCrisis(crisis)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all"
                  style={{ left: `${crisis.coords.x}%`, top: `${crisis.coords.y}%` }}
                >
                  <div className={`absolute inset-0 rounded-full animate-ping ${isActive ? 'scale-150 opacity-40' : 'scale-110 opacity-20'} ${isMine ? 'bg-[#E16A3D]' : 'bg-[#1C9290]'}`} />
                  <div className={`relative h-3 w-3 rounded-full border-2 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-colors
                    ${isActive ? 'border-white z-20' : 'border-[#043E52] group-hover:bg-[#14b8a6]'} ${isMine ? 'bg-[#E16A3D]' : 'bg-[#1C9290]'}`}
                  >
                     <div className="h-1 w-1 bg-white rounded-full" />
                  </div>
                  <div className={`absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border text-[9px] font-bold tracking-wider pointer-events-none transition-all
                    ${isActive ? 'border-[#E16A3D]/50 text-white z-20 opacity-100 translate-y-0' : 'border-[#1C9290]/30 text-teal-100 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'}`}
                  >
                    {crisis.location || 'Unknown'}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* MAP SIDEBAR */}
        <Card className="bg-white border-slate-200 shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-[#043E52] text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#E16A3D]" /> Crisis Intel
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeCrisis ? (
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge className="bg-orange-100 text-orange-800 border-none text-[9px]">ACTIVE</Badge>
                    {activeCrisis.orgId === user?.uid && <Badge className="bg-teal-100 text-teal-800 border-none text-[9px]">YOUR OPERATION</Badge>}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{activeCrisis.title}</h2>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-500">
                    <MapPin className="h-3 w-3" /> {activeCrisis.location || 'Unknown Location'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Commanding Org</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{activeCrisis.organization || 'Unknown'}</p>
                  </div>
                  <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-100">
                    <p className="text-[9px] font-bold text-teal-600/70 uppercase tracking-wider">AVR Deployed</p>
                    <p className="font-semibold text-[#1C9290] text-sm mt-0.5">{activeCrisis.volunteersResponded || 0} Units</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Operation Details</p>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {activeCrisis.description || "No detailed intelligence provided yet."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <ShieldAlert className="h-8 w-8 text-slate-200" />
                <p className="text-xs font-semibold">Select a target on the map.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 4. LISTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* RECENT APPLICATIONS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 pt-4 px-5">
              <div>
                <CardTitle className="text-base font-bold text-[#043E52] uppercase">Pending Talent</CardTitle>
                <CardDescription className="text-xs">Review volunteers ready to join.</CardDescription>
              </div>
              <Badge className="bg-[#E16A3D] text-white font-bold">{recentApps.length} New</Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 px-5 pb-5">
              {recentApps.length === 0 ? (
                <div className="text-center p-6 text-slate-400 text-sm">No pending applications at this time.</div>
              ) : (
                recentApps.map((app) => (
                  <div key={app.id} className="flex flex-col sm:flex-row gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <img src={app.volunteerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${app.volunteerName}`} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-sm">{app.volunteerName || 'Unknown Volunteer'}</h4>
                        <span className="text-[10px] text-slate-400">{app.createdAt ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 truncate">Applied for <span className="font-semibold text-[#043E52]">{app.oppTitle || 'Opportunity'}</span></p>
                      <div className="flex gap-2 mt-2">
                        <Button onClick={() => window.location.href = '/dashboard/organization/applications'} className="h-7 bg-[#1C9290] hover:bg-[#157a78] text-white font-bold text-[10px] px-4">Review</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR: TOP VOLUNTEERS & TIMELINE */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-5">
              <CardTitle className="text-base font-bold text-[#043E52] uppercase">Top Impactors</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-5 pb-5 space-y-3">
              {topVolunteers.length === 0 ? (
                <div className="text-center p-4 text-slate-400 text-xs">Deploy volunteers to see rankings.</div>
              ) : (
                topVolunteers.map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1C9290]/10 flex items-center justify-center text-[#1C9290] font-bold text-xs">#{i+1}</div>
                    <img src={v.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${v.name}`} className="w-8 h-8 rounded-full border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{v.name}</p>
                      <p className="text-[10px] text-slate-500">{v.hours} Hours Logged</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-[#043E52] text-white">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-base font-bold uppercase">Upcoming Deployments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              {upcomingEvents.length === 0 ? (
                 <div className="text-center p-4 text-teal-100/50 text-xs">No upcoming scheduled events.</div>
              ) : (
                upcomingEvents.map(event => (
                  <div key={event.id} className="p-3 bg-white/10 rounded-lg border border-white/5">
                    <p className="text-[10px] font-bold uppercase text-[#1C9290] mb-0.5">{new Date(event.date).toLocaleDateString()}</p>
                    <p className="text-sm font-semibold mb-2 truncate">{event.title}</p>
                    <div className="flex justify-between items-center text-[9px] font-bold mb-1 uppercase">
                      <span className="text-teal-100/70">Manned</span>
                      <span>{event.volunteersResponded || 0} / {event.volunteersNeeded || 10}</span>
                    </div>
                    <Progress value={((event.volunteersResponded || 0)/(event.volunteersNeeded || 10))*100} className="h-1.5 bg-white/10" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}