import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, getDoc, getDocs, addDoc, serverTimestamp, writeBatch, updateDoc } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  AlertTriangle, MapPin, Users, Clock, Send, XCircle, 
  Activity, Zap, Plus, ShieldAlert, Megaphone, ShieldX, Phone, Droplet, CheckCircle, Radio, Download,
  CheckCircle2, Lock, Loader2, Sparkles, Wand2
} from 'lucide-react';

import { useUserProfile } from '../../hooks/useUserProfile';
import { auth, db } from '../../lib/firebase'; 

// 🔥 FIX: single shared definition of "is this volunteer AVR-certified" —
// previously this exact OR-chain was copy-pasted in handleActivate AND in the
// roster badge render. One helper now, used everywhere, so the dispatch logic
// and the badge you see on screen can never disagree with each other.
function isAVRCertified(vData: any): boolean {
  return (
    vData?.isAVRMember === true ||
    vData?.isAVRMember === "true" ||
    vData?.avrCertified === true ||
    vData?.avrCertified === "true" ||
    vData?.isAVR === true ||
    vData?.isAVR === "true" ||
    vData?.crisisInfo?.avrCertified === true ||
    vData?.crisisInfo?.avrCertified === "true" ||
    (vData?.skills && vData.skills.includes("AVR"))
  );
}

// 🔥 NEW: counts how many of the crisis's required skills this volunteer has.
// Used both to filter (must match at least one, if skills were specified)
// and to rank (best-matched volunteers get notified first).
function countSkillMatches(volunteerSkills: string[] | undefined, requiredSkills: string[]): number {
  if (!requiredSkills.length) return 1; // no specific skills requested — everyone AVR-certified qualifies equally
  const vSkills = (volunteerSkills || []).map(s => s.toLowerCase());
  return requiredSkills.filter(rs => vSkills.includes(rs.toLowerCase())).length;
}

export function CrisisManagement() {
  const { user, loading } = useUserProfile();
  
  const [crisisEvents, setCrisisEvents] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [closingId, setClosingId] = useState<string | null>(null);
  
  const [selectedCrisisForTeam, setSelectedCrisisForTeam] = useState<any | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  // 🔥 AI Tasking State
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  const [newCrisis, setNewCrisis] = useState({
    title: '', description: '', severity: 'Critical', location: '', volunteersNeeded: 10, skillsNeeded: '', commsLink: '' 
  });

  // --- 1. FETCH LIVE CRISES ---
  useEffect(() => {
    if (!user || !user.verified) return;

    const q = query(collection(db, "crises"), where("orgId", "==", user.uid));

    const unsubscribeData = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let safeDate = 'Recently';
        let sortTime = 0; 

        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          safeDate = new Date(data.createdAt.toDate()).toLocaleString();
          sortTime = data.createdAt.toDate().getTime(); 
        }

        return { id: docSnap.id, ...data, createdAtText: safeDate, sortTime };
      });
      
      events.sort((a, b) => {
        if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
        if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
        return b.sortTime - a.sortTime;
      });
      
      setCrisisEvents(events);
    });

    return () => unsubscribeData();
  }, [user]);

  // --- 2. FETCH RESPONDERS ---
  const handleViewTeam = async (crisis: any) => {
    setSelectedCrisisForTeam(crisis);
    setIsLoadingTeam(true);
    setTeamMembers([]); 

    try {
      const q = query(collection(db, "crisisResponses"), where("crisisId", "==", crisis.id), where("status", "==", "accepted"));
      const snapshot = await getDocs(q);
      
      const members = await Promise.all(snapshot.docs.map(async (responseDoc) => {
        const volId = responseDoc.data().volunteerId;
        const volSnap = await getDoc(doc(db, "users", volId));
        // 🔥 FIX: if the volunteer's account was deleted after they accepted,
        // volSnap.data() is undefined and this used to spread garbage into the
        // roster (blank name, crash on .charAt in the avatar fallback). Skip it.
        if (!volSnap.exists()) return null;
        return { id: volId, ...volSnap.data(), respondedAt: responseDoc.data().respondedAt };
      }));

      setTeamMembers(members.filter(Boolean));
    } catch (error) {
      console.error("Error fetching team:", error);
    }
    setIsLoadingTeam(false);
  };

  // --- 3. MASS BROADCAST TO ALL RESPONDERS ---
  const handleMassBroadcast = async () => {
    if (!selectedCrisisForTeam) return; // 🔥 guard: modal state can close mid-request
    if (!broadcastMessage.trim()) return alert("Please type a message to broadcast.");
    if (teamMembers.length === 0) return alert("No volunteers have responded yet.");

    setIsBroadcasting(true);
    try {
      const batch = writeBatch(db);
      teamMembers.forEach(vol => {
        const notifRef = doc(collection(db, "notifications")); 
        batch.set(notifRef, {
          userId: vol.id,
          organizationName: user.name || "Command Center",
          title: `URGENT UPDATE: ${selectedCrisisForTeam.title}`,
          message: broadcastMessage,
          type: 'info', 
          read: false,
          createdAt: serverTimestamp(),
          link: '/crisis'
        });
      });

      await batch.commit(); 
      alert(`Successfully broadcasted to ${teamMembers.length} volunteers.`);
      setBroadcastMessage("");
    } catch (error) {
      console.error("Broadcast failed:", error);
      alert("Failed to send broadcast.");
    }
    setIsBroadcasting(false);
  };

  // --- 4. THE SMART DISPATCH ALGORITHM ---
  const handleActivate = async () => {
    if (!user) return;
    if (!newCrisis.title || !newCrisis.description || !newCrisis.location) return alert("Please fill all required fields");

    setIsSubmitting(true);
    try {
      const requiredSkills = newCrisis.skillsNeeded.split(',').map(s => s.trim()).filter(s => s !== '');

      const qUsers = query(collection(db, "users"), where("role", "==", "volunteer"));
      const usersSnapshot = await getDocs(qUsers);

      // 🔥 FIX: this used to be "every AVR volunteer on the platform, notify all of
      // them" — skillsNeeded was collected in the form but never actually used.
      // Now: must be AVR-certified AND (no specific skills requested, or match at
      // least one), ranked by how many required skills they have, and capped so a
      // request for 10 people doesn't page hundreds.
      const ranked = usersSnapshot.docs
        .map(docSnap => {
          const vData = docSnap.data();
          const matchCount = countSkillMatches(vData.skills, requiredSkills);
          return { id: docSnap.id, matchCount, avr: isAVRCertified(vData) };
        })
        .filter(v => v.avr && v.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount);

      const dispatchCap = Math.max(Number(newCrisis.volunteersNeeded) * 3, 15);
      const finalDeployList = ranked.slice(0, dispatchCap).map(v => v.id);

      const crisisDocRef = await addDoc(collection(db, "crises"), {
        orgId: user.uid, 
        organization: user.name || "Verified Organization", 
        organizationVerified: true, 
        title: newCrisis.title,
        description: newCrisis.description,
        severity: newCrisis.severity,
        location: newCrisis.location,
        skillsNeeded: requiredSkills, 
        commsLink: newCrisis.commsLink, 
        volunteersNeeded: Number(newCrisis.volunteersNeeded),
        volunteersActivated: finalDeployList.length,
        volunteersResponded: 0,
        status: 'Active',
        createdAt: serverTimestamp()
      });

      if (finalDeployList.length > 0) {
        const batch = writeBatch(db);
        finalDeployList.forEach(vId => {
          const notifRef = doc(collection(db, "notifications"));
          batch.set(notifRef, {
            userId: vId,
            organizationName: user.name || "Crisis Command",
            title: `🚨 URGENT SOS: ${newCrisis.title}`,
            message: `EMERGENCY ALERT: ${newCrisis.location}. ${newCrisis.volunteersNeeded} responders requested immediately. Deploy now!`,
            type: 'alert', 
            read: false,
            createdAt: serverTimestamp(),
            link: '/crisis-response', 
            crisisId: crisisDocRef.id
          });
        });
        await batch.commit();
      }

      setShowCreateForm(false);
      setNewCrisis({ title: '', description: '', severity: 'Critical', location: '', volunteersNeeded: 10, skillsNeeded: '', commsLink: '' });
      
      if (finalDeployList.length === 0) {
          alert(`Emergency declared, but NO AVR-certified volunteers matched the requested skills. No one has been notified yet — you'll need to reach responders manually or broaden the skill requirements.`);
      } else {
          alert(`Emergency declared! SOS Alarm broadcasted to ${finalDeployList.length} matched AVR members.`);
      }
      
    } catch (error) {
      console.error("Error declaring emergency:", error);
      alert("Failed to declare emergency.");
    }
    setIsSubmitting(false);
  };

  // --- 5. STAND DOWN (RESOLVE) CRISIS ---
  const handleResolveCrisis = async (crisisId: string) => {
    if (!window.confirm("Are you sure you want to stand down? This will close the emergency and volunteers will be notified that the crisis is resolved.")) {
      return;
    }

    setClosingId(crisisId);
    try {
      const crisisRef = doc(db, "crises", crisisId);
      await updateDoc(crisisRef, {
        status: "Resolved",
        resolvedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error resolving crisis:", error);
      alert("Failed to resolve crisis.");
    } finally {
      setClosingId(null);
    }
  };

  // 🔥 NEW: real CSV export — the button used to just alert() a fake message.
  const handleExportCSV = () => {
    if (teamMembers.length === 0) return;
    const headers = ['Name', 'Phone', 'Blood Type', 'AVR Certified', 'Skills'];
    const rows = teamMembers.map(vol => [
      vol.name || '',
      vol.phone || '',
      vol.crisisInfo?.bloodType || 'Unknown',
      isAVRCertified(vol) ? 'Yes' : 'No',
      (vol.skills || []).join('; ')
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(selectedCrisisForTeam?.title || 'crisis').replace(/[^a-z0-9]/gi, '_')}-roster.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 🔥 NEW: Generative AI Tasking Engine (Llama-3 Integration)
  const handleGenerateAITasks = async () => {
    if (!newCrisis.title || !newCrisis.location) {
      alert("Please provide at least an Incident Title and Location for the AI to analyze.");
      return;
    }
    
    setIsGeneratingTasks(true);
    try {
      // Connects to OpenRouter using your existing Llama-3 preference
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "system",
              content: "You are an expert crisis management AI for Project Athar. Based on the crisis title, location, and severity, quickly generate a professional situation report (description) and a comma-separated list of the 5 most critical skills needed (skillsNeeded). Return ONLY valid JSON with keys: 'description' and 'skillsNeeded'."
            },
            {
              role: "user",
              content: `Title: ${newCrisis.title}, Location: ${newCrisis.location}, Severity: ${newCrisis.severity}`
            }
          ]
        })
      });

      const data = await response.json();
      const aiContent = data.choices[0].message.content;
      
      // Clean potential markdown from Llama-3 response
      const cleanedJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      setNewCrisis(prev => ({
        ...prev,
        description: parsed.description || prev.description,
        skillsNeeded: parsed.skillsNeeded || prev.skillsNeeded
      }));
      
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate AI tasks. Please check your API connection.");
    }
    setIsGeneratingTasks(false);
  };

  // --- SECURITY LOCK ---
  if (loading) return <div className="p-10 font-bold text-[#043E52]">Verifying Organization Status...</div>;
  
  if (!user?.verified && user?.verificationStatus !== 'verified') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-100 p-8 rounded-full border-4 border-slate-200 shadow-sm">
          <ShieldX className="h-20 w-20 text-slate-400" />
        </div>
        <div className="max-w-xl space-y-4">
          <h2 className="text-4xl font-black text-[#043E52] uppercase tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            The Crisis Response Center is strictly reserved for <strong>Government-Verified Entities</strong>. 
            You must complete the verification audit in your Profile settings before you can declare emergencies or mobilize the Athar Volunteer Reserve.
          </p>
        </div>
      </div>
    );
  }

  const activeEvents = crisisEvents.filter(e => e.status === 'Active');
  const totalActivated = activeEvents.reduce((acc, e) => acc + (e.volunteersActivated || 0), 0);
  const totalResponded = activeEvents.reduce((acc, e) => acc + (e.volunteersResponded || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#043E52] flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[#E16A3D]" /> 
            Crisis Command Center
          </h1>
          <p className="text-slate-500 mt-1">Monitor active emergencies and broadcast to deployed teams.</p>
        </div>
        <Button 
          className="bg-[#E16A3D] hover:bg-[#c2562d] text-white shadow-md font-semibold transition-transform active:scale-95 h-12 px-6"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="mr-2 h-5 w-5" /> Declare Emergency
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Active Incidents" value={activeEvents.length} icon={Activity} color="text-[#E16A3D]" bg="bg-orange-50" border="border-[#E16A3D]" />
        <MetricCard label="Mobilized Volunteers" value={totalActivated} icon={Users} color="text-[#043E52]" bg="bg-slate-50" border="border-[#043E52]" />
        <MetricCard label="On-Site Responders" value={totalResponded} icon={MapPin} color="text-[#1C9290]" bg="bg-teal-50" border="border-[#1C9290]" />
        <MetricCard label="Avg Response Time" value="12m" icon={Zap} color="text-blue-600" bg="bg-blue-50" border="border-blue-500" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#043E52]">Operations Feed</h2>
            <Badge variant="outline" className="text-[#1C9290] border-[#1C9290] bg-teal-50">Auto-Refreshing</Badge>
        </div>
        
        {crisisEvents.length === 0 && <p className="text-slate-500 italic p-4">No emergencies declared yet.</p>}

        {crisisEvents.map((event) => {
          const isResolved = event.status === 'Resolved';
          const progress = Math.round((event.volunteersResponded / event.volunteersNeeded) * 100) || 0;
          
          return (
            <Card key={event.id} className={`border-l-4 shadow-sm hover:shadow-md transition-all ${
                isResolved ? 'border-l-slate-300 opacity-80 bg-slate-50' : 
                event.severity === 'Critical' ? 'border-l-[#E16A3D]' : 'border-l-orange-400'
            }`}>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        {isResolved && (
                                          <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                                            <Lock size={16} />
                                          </div>
                                        )}
                                        <h3 className={`text-lg font-bold ${isResolved ? 'text-slate-600 line-through decoration-slate-300' : 'text-[#043E52]'}`}>{event.title}</h3>
                                        
                                        {isResolved ? (
                                          <Badge className="bg-slate-200 text-slate-600 font-black uppercase text-[9px] tracking-wider border-none">
                                            Resolved
                                          </Badge>
                                        ) : (
                                          <Badge className={`${event.severity === 'Critical' ? 'bg-[#E16A3D]' : 'bg-orange-500'} text-white border-none`}>
                                              {event.severity.toUpperCase()}
                                          </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Started: {event.createdAtText}</span>
                                    </div>
                                </div>
                            </div>
                            <p className={`text-sm leading-relaxed mb-4 p-3 rounded-lg border ${isResolved ? 'bg-white text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                              {event.description}
                            </p>
                            {!isResolved && (
                              <div className="flex flex-wrap gap-2">
                                  {(event.skillsNeeded || []).map((skill: string) => (
                                      <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">{skill}</Badge>
                                  ))}
                              </div>
                            )}
                        </div>

                        <div className={`lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0 ${isResolved ? 'border-slate-200' : 'border-slate-100'}`}>
                            <div className="space-y-4">
                                <div>
                                    <div className={`flex justify-between text-sm font-semibold mb-1 ${isResolved ? 'text-slate-500' : 'text-[#043E52]'}`}>
                                        <span>Mobilization</span>
                                        <span>{Math.min(progress, 100)}%</span>
                                    </div>
                                    <Progress value={Math.min(progress, 100)} className={`h-2.5 ${isResolved ? 'bg-slate-200 [&>div]:bg-slate-400' : 'bg-slate-100'}`} />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                                        <span>{event.volunteersResponded} Responded</span>
                                        <span>{event.volunteersActivated} Notified</span>
                                    </div>
                                </div>
                                
                                {!isResolved && (
                                  <div className="grid grid-cols-2 gap-2 text-center">
                                      <div className="bg-[#1C9290]/5 p-2 rounded-lg border border-[#1C9290]/10">
                                          <p className="text-xs text-slate-500">Target</p>
                                          <p className="font-bold text-[#1C9290]">{event.volunteersNeeded}</p>
                                      </div>
                                      <div className="bg-[#043E52]/5 p-2 rounded-lg border border-[#043E52]/10">
                                          <p className="text-xs text-slate-500">Shortfall</p>
                                          <p className="font-bold text-[#043E52]">{Math.max(0, event.volunteersNeeded - event.volunteersResponded)}</p>
                                      </div>
                                  </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button 
                                  onClick={() => handleViewTeam(event)}
                                  className={`flex-1 text-white h-11 text-sm font-bold shadow-sm ${isResolved ? 'bg-slate-400 hover:bg-slate-500' : 'bg-[#043E52] hover:bg-[#033040]'}`}
                                >
                                    <Radio className="mr-2 h-4 w-4" /> {isResolved ? 'View Logs' : 'Command Hub'}
                                </Button>
                                
                                {!isResolved && (
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleResolveCrisis(event.id)}
                                    disabled={closingId === event.id}
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 text-sm font-bold shadow-sm"
                                  >
                                      {closingId === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                      Stand Down
                                  </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          );
        })}
      </div>

      {/* --- THE COMMAND HUB MODAL --- */}
      {selectedCrisisForTeam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-4xl shadow-2xl border-none rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <CardHeader className="bg-[#043E52] text-white p-6 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="bg-white/20 text-white border-none mb-2 tracking-widest">
                    {selectedCrisisForTeam.status === 'Resolved' ? 'HISTORICAL LOGS' : 'COMMAND HUB'}
                  </Badge>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {selectedCrisisForTeam.title}
                    {selectedCrisisForTeam.status === 'Resolved' && <Badge className="bg-slate-500 text-white border-none text-[10px] ml-2">RESOLVED</Badge>}
                  </CardTitle>
                  <p className="text-teal-100 mt-1">{teamMembers.length} Volunteers Deployed to Sector</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedCrisisForTeam(null)} className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0">✕</Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 overflow-hidden flex flex-col bg-white h-full">
              
              <Tabs defaultValue="roster" className="w-full h-full flex flex-col">
                <TabsList className="bg-slate-100 rounded-none w-full justify-start h-14 px-4 border-b border-slate-200">
                  <TabsTrigger value="roster" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] font-bold px-6">Roster & Details</TabsTrigger>
                  <TabsTrigger value="broadcast" className="data-[state=active]:bg-[#E16A3D] data-[state=active]:text-white font-bold px-6 flex items-center gap-2">
                    <Megaphone className="h-4 w-4" /> Mass Broadcast
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="roster" className="p-0 m-0 overflow-y-auto flex-1">
                  {isLoadingTeam ? (
                    <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Establishing Secure Connection...</div>
                  ) : teamMembers.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <Users className="h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="text-lg font-bold text-[#043E52]">Awaiting Responses</h3>
                      <p className="text-slate-500 text-sm">No volunteers have accepted this deployment yet.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Deployed Personnel</span>
                        <Button variant="outline" size="sm" className="text-slate-600 border-slate-300 hover:bg-slate-200" onClick={handleExportCSV}>
                          <Download className="h-4 w-4 mr-2" /> Export CSV List
                        </Button>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {teamMembers.map((vol) => {
                           const bloodType = vol.crisisInfo?.bloodType || 'Unknown';
                           const hasCar = vol.crisisInfo?.drivingLicense ? 'Driver' : '';
                           const certified = isAVRCertified(vol);
                           
                           return (
                            <div key={vol.id} className="p-6 bg-white flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-slate-50 transition-colors">
                              <Avatar className="w-14 h-14 border-2 border-slate-100 shrink-0">
                                <AvatarImage src={vol.avatarUrl} />
                                <AvatarFallback className="bg-[#1C9290] text-white font-bold">{String(vol.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-[#043E52] text-lg">{vol.name}</h4>
                                  {certified ? (
                                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 uppercase"><CheckCircle className="h-3 w-3 mr-1" /> AVR Certified</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 uppercase">Standard Volunteer</Badge>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium mb-2">
                                  <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-400" /> {vol.phone || 'No phone'}</span>
                                  <span className="flex items-center gap-1.5"><Droplet className="h-4 w-4 text-red-400" /> Type: {bloodType}</span>
                                  {hasCar && <span className="text-[#E16A3D] font-bold text-xs bg-orange-50 px-2 py-0.5 rounded-md">Has Vehicle</span>}
                                </div>
                                
                                <div className="flex flex-wrap gap-1.5">
                                  {(vol.skills || []).slice(0,3).map((skill: string, i: number) => (
                                    <span key={i} className="text-[10px] uppercase tracking-wider font-bold text-[#1C9290] bg-teal-50 px-2 py-1 rounded-md">{skill}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="broadcast" className="p-8 m-0 flex-1 bg-slate-50">
                  <div className="max-w-2xl mx-auto space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                      <h3 className="text-xl font-bold text-[#043E52] flex items-center gap-2 mb-2">
                        <Radio className="text-[#E16A3D]" /> Transmit Mission Update
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Send an urgent push notification and in-app alert to all <strong>{teamMembers.length}</strong> volunteers currently deployed to this crisis.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="font-bold text-slate-700 uppercase tracking-widest text-xs">Message Payload</Label>
                      <Textarea 
                        placeholder={selectedCrisisForTeam.status === 'Resolved' ? "Communications disabled. This crisis is resolved." : "e.g., URGENT: The rally point has been moved to the South Gate. Bring heavy gloves. Acknowledge upon receipt."}
                        className="min-h-[150px] border-slate-200 focus:border-[#E16A3D] focus:ring-[#E16A3D] text-base p-4 rounded-xl resize-none"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        disabled={selectedCrisisForTeam.status === 'Resolved'}
                      />
                    </div>

                    <Button 
                      disabled={isBroadcasting || teamMembers.length === 0 || selectedCrisisForTeam.status === 'Resolved'}
                      onClick={handleMassBroadcast}
                      className="w-full h-14 bg-[#E16A3D] hover:bg-[#c2562d] text-white font-black text-lg rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                      {isBroadcasting ? "TRANSMITTING TO FLEET..." : `SEND TO ALL ${teamMembers.length} VOLUNTEERS`}
                    </Button>
                    
                    {teamMembers.length === 0 && selectedCrisisForTeam.status !== 'Resolved' && (
                      <p className="text-center text-red-500 text-sm font-medium">Cannot broadcast: No volunteers have joined yet.</p>
                    )}
                    {selectedCrisisForTeam.status === 'Resolved' && (
                      <p className="text-center text-slate-500 text-sm font-medium">Broadcasting is disabled for resolved crises.</p>
                    )}
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- CREATE CRISIS MODAL --- */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <Card className="w-full max-w-xl shadow-2xl border-none rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <CardHeader className="bg-[#043E52] text-white p-5 shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-full"><AlertTriangle className="h-5 w-5 text-red-200" /></div>
                            <CardTitle className="text-white text-xl">Declare Emergency</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"><XCircle className="h-6 w-6" /></Button>
                    </div>
                </CardHeader>
                <div className="p-6 overflow-y-auto bg-slate-50 space-y-5">
                    
                    {/* 🔥 AI Task Generator Banner */}
                    <div className="bg-gradient-to-r from-[#043E52] to-[#1C9290] p-4 rounded-xl flex items-center justify-between shadow-sm">
                       <div>
                         <h4 className="text-white font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-300"/> Generative AI Tasking</h4>
                         <p className="text-white/80 text-xs mt-1">Enter Title & Location, then let AI write the report and find required skills.</p>
                       </div>
                       <Button
                         onClick={handleGenerateAITasks}
                         disabled={isGeneratingTasks || !newCrisis.title || !newCrisis.location}
                         className="bg-white text-[#043E52] hover:bg-slate-100 font-bold text-xs h-9 ml-4"
                       >
                         {isGeneratingTasks ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                         Auto-Generate
                       </Button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="space-y-1.5"><Label className="font-bold text-[#043E52] text-xs uppercase tracking-widest">Incident Title</Label><Input placeholder="e.g. Structural Collapse" value={newCrisis.title} onChange={(e) => setNewCrisis({...newCrisis, title: e.target.value})} className="border-slate-200 h-11 focus:border-[#E16A3D] focus:ring-[#E16A3D]" /></div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="font-bold text-[#043E52] text-xs uppercase tracking-widest">Severity</Label>
                            <select className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E16A3D]" onChange={(e) => setNewCrisis({...newCrisis, severity: e.target.value})} value={newCrisis.severity}>
                              <option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option>
                            </select>
                          </div>
                          <div className="space-y-1.5"><Label className="font-bold text-[#043E52] text-xs uppercase tracking-widest">Location / City</Label><Input placeholder="e.g. Kadıköy, Istanbul" value={newCrisis.location} onChange={(e) => setNewCrisis({...newCrisis, location: e.target.value})} className="border-slate-200 h-11 focus:border-[#E16A3D] focus:ring-[#E16A3D]" /></div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="space-y-1.5"><Label className="font-bold text-[#043E52] text-xs uppercase tracking-widest">Required Skills (Comma separated)</Label><Input placeholder="e.g. Medical Aid, Driving License" value={newCrisis.skillsNeeded} onChange={(e) => setNewCrisis({...newCrisis, skillsNeeded: e.target.value})} className="border-slate-200 h-11 focus:border-[#E16A3D] focus:ring-[#E16A3D]" /></div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-bold text-[#043E52] text-xs uppercase tracking-widest">AVR Volunteers Needed</Label>
                          <Input type="number" value={newCrisis.volunteersNeeded} onChange={(e) => setNewCrisis({...newCrisis, volunteersNeeded: Number(e.target.value)})} className="border-slate-200 h-11 focus:border-[#E16A3D] focus:ring-[#E16A3D]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-bold text-[#043E52] text-xs uppercase tracking-widest">Secure Comms Link</Label>
                          <Input placeholder="e.g. https://chat.whatsapp.com/..." value={newCrisis.commsLink} onChange={(e) => setNewCrisis({...newCrisis, commsLink: e.target.value})} className="border-slate-200 h-11 focus:border-[#E16A3D] focus:ring-[#E16A3D]" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="space-y-1.5"><Label className="font-bold text-[#043E52] text-xs uppercase tracking-widest">Situation Report</Label><Textarea placeholder="Describe the incident details..." value={newCrisis.description} onChange={(e) => setNewCrisis({...newCrisis, description: e.target.value})} className="min-h-[100px] border-slate-200 focus:border-[#E16A3D] focus:ring-[#E16A3D] resize-none" /></div>
                    </div>
                </div>
                
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  <Button disabled={isSubmitting} className="w-full bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold h-12 text-base shadow-md" onClick={handleActivate}>
                      {isSubmitting ? "TRANSMITTING..." : <><Send className="mr-2 h-5 w-5" /> ACTIVATE RESERVE ALGORITHM</>}
                  </Button>
                </div>
            </Card>
        </div> 
      )}

    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, bg, border }: any) {
    return (
        <Card className={`border-t-4 ${border} shadow-sm`}><CardContent className="p-5 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p><p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p></div><div className={`p-3 rounded-full ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div></CardContent></Card>
    );
}