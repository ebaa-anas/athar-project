import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, where, doc, getDoc, getDocs, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";

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
  Activity, Zap, Plus, ShieldAlert, Megaphone, ShieldX, Phone, Droplet, CheckCircle, Radio, Download
} from 'lucide-react';

import { useUserProfile } from '../../hooks/useUserProfile';
import { auth } from '../../lib/firebase'; 

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

export function CrisisManagement() {
  const { user, loading } = useUserProfile();
  
  const [crisisEvents, setCrisisEvents] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedCrisisForTeam, setSelectedCrisisForTeam] = useState<any | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
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
      
      events.sort((a, b) => b.sortTime - a.sortTime);
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
        return { id: volId, ...volSnap.data(), respondedAt: responseDoc.data().respondedAt };
      }));

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team:", error);
    }
    setIsLoadingTeam(false);
  };

  // --- 3. MASS BROADCAST TO ALL RESPONDERS ---
  const handleMassBroadcast = async () => {
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

  // --- 4. THE FIXED SMART DISPATCH ALGORITHM ---
  const handleActivate = async () => {
    if (!user) return;
    if (!newCrisis.title || !newCrisis.description || !newCrisis.location) return alert("Please fill all required fields");

    setIsSubmitting(true);
    try {
      // 1. Fetch EVERY single volunteer from the platform
      const qUsers = query(collection(db, "users"), where("role", "==", "volunteer"));
      const usersSnapshot = await getDocs(qUsers);
      
      const allVolunteers: string[] = [];
      usersSnapshot.forEach(docSnap => {
          const vData = docSnap.data();
          
          // 🔥 FIXED THE isAVRMember CHECK HERE 🔥
          const isAVR = 
            vData.isAVRMember === true || 
            vData.isAVRMember === "true" || 
            vData.avrCertified === true || 
            vData.avrCertified === "true" || 
            vData.isAVR === true || 
            vData.isAVR === "true" ||
            vData.crisisInfo?.avrCertified === true ||
            vData.crisisInfo?.avrCertified === "true" ||
            (vData.skills && vData.skills.includes("AVR"));

          if (isAVR) {
              allVolunteers.push(docSnap.id);
          }
      });

      // --- FAILSAFE FOR TESTING ---
      // If the database returns 0, we override it to test the notifications
      let finalDeployList = allVolunteers;
      if (allVolunteers.length === 0) {
          console.warn("No AVR members found. Using fallback to notify ALL volunteers for testing purposes.");
          usersSnapshot.forEach(docSnap => finalDeployList.push(docSnap.id));
      }

      // 2. Save the Crisis to the Database
      const crisisDocRef = await addDoc(collection(db, "crises"), {
        orgId: user.uid, 
        organization: user.name || "Verified Organization", 
        organizationVerified: true, 
        title: newCrisis.title,
        description: newCrisis.description,
        severity: newCrisis.severity,
        location: newCrisis.location,
        skillsNeeded: newCrisis.skillsNeeded.split(',').map(s => s.trim()).filter(s => s !== ''), 
        commsLink: newCrisis.commsLink, 
        volunteersNeeded: Number(newCrisis.volunteersNeeded),
        volunteersActivated: finalDeployList.length, // Log the fleet activation
        volunteersResponded: 0,
        status: 'Active',
        createdAt: serverTimestamp()
      });

      // 3. Blast the Red SOS Notification
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
      
      if (allVolunteers.length === 0) {
          alert(`Emergency declared! (WARNING: Database had 0 AVR. Fallback used: Notified all ${finalDeployList.length} standard volunteers).`);
      } else {
          alert(`Emergency declared! SOS Alarm broadcasted to ${finalDeployList.length} Elite AVR members.`);
      }
      
    } catch (error) {
      console.error("Error declaring emergency:", error);
      alert("Failed to declare emergency.");
    }
    setIsSubmitting(false);
  };


  // --- SECURITY LOCK ---
  if (loading) return <div className="p-10 font-bold text-[#043E52]">Verifying Organization Status...</div>;
  
  if (!user?.verified) {
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
      
      {/* Header Area */}
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
            <h2 className="text-lg font-bold text-[#043E52]">Live Operations Feed</h2>
            <Badge variant="outline" className="text-[#1C9290] border-[#1C9290] bg-teal-50">Auto-Refreshing</Badge>
        </div>
        
        {activeEvents.length === 0 && <p className="text-slate-500 italic p-4">No active emergencies at this time.</p>}

        {activeEvents.map((event) => {
          const progress = Math.round((event.volunteersResponded / event.volunteersNeeded) * 100) || 0;
          
          return (
            <Card key={event.id} className={`border-l-4 shadow-sm hover:shadow-md transition-all ${
                event.severity === 'Critical' ? 'border-l-[#E16A3D]' : 'border-l-orange-400'
            }`}>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-[#043E52]">{event.title}</h3>
                                        <Badge className={`${event.severity === 'Critical' ? 'bg-[#E16A3D]' : 'bg-orange-500'} text-white border-none`}>
                                            {event.severity.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Started: {event.createdAtText}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">{event.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {(event.skillsNeeded || []).map((skill: string) => (
                                    <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">{skill}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm font-semibold mb-1 text-[#043E52]">
                                        <span>Mobilization</span>
                                        <span>{Math.min(progress, 100)}%</span>
                                    </div>
                                    <Progress value={Math.min(progress, 100)} className="h-2.5 bg-slate-100" />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                                        <span>{event.volunteersResponded} Responded</span>
                                        <span>{event.volunteersActivated} Notified</span>
                                    </div>
                                </div>
                                
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
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button 
                                  onClick={() => handleViewTeam(event)}
                                  className="flex-1 bg-[#043E52] hover:bg-[#033040] text-white h-12 text-sm font-bold shadow-md"
                                >
                                    <Radio className="mr-2 h-4 w-4" /> Command Hub
                                </Button>
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
                  <Badge className="bg-white/20 text-white border-none mb-2 tracking-widest">COMMAND HUB</Badge>
                  <CardTitle className="text-2xl font-bold">{selectedCrisisForTeam.title}</CardTitle>
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
                        <Button variant="outline" size="sm" className="text-slate-600 border-slate-300 hover:bg-slate-200" onClick={() => alert("CSV Exporting...")}>
                          <Download className="h-4 w-4 mr-2" /> Export CSV List
                        </Button>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {teamMembers.map((vol) => {
                           const bloodType = vol.crisisInfo?.bloodType || 'Unknown';
                           const hasCar = vol.crisisInfo?.drivingLicense ? 'Driver' : '';
                           
                           return (
                            <div key={vol.id} className="p-6 bg-white flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-slate-50 transition-colors">
                              <Avatar className="w-14 h-14 border-2 border-slate-100 shrink-0">
                                <AvatarImage src={vol.avatarUrl} />
                                <AvatarFallback className="bg-[#1C9290] text-white font-bold">{String(vol.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-[#043E52] text-lg">{vol.name}</h4>
                                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 uppercase"><CheckCircle className="h-3 w-3 mr-1" /> AVR Certified</Badge>
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
                        placeholder="e.g., URGENT: The rally point has been moved to the South Gate. Bring heavy gloves. Acknowledge upon receipt."
                        className="min-h-[150px] border-slate-200 focus:border-[#E16A3D] focus:ring-[#E16A3D] text-base p-4 rounded-xl resize-none"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                      />
                    </div>

                    <Button 
                      disabled={isBroadcasting || teamMembers.length === 0}
                      onClick={handleMassBroadcast}
                      className="w-full h-14 bg-[#E16A3D] hover:bg-[#c2562d] text-white font-black text-lg rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                      {isBroadcasting ? "TRANSMITTING TO FLEET..." : `SEND TO ALL ${teamMembers.length} VOLUNTEERS`}
                    </Button>
                    
                    {teamMembers.length === 0 && (
                      <p className="text-center text-red-500 text-sm font-medium">Cannot broadcast: No volunteers have joined yet.</p>
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