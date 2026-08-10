import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, where, serverTimestamp, deleteDoc, doc, updateDoc, getDoc 
} from "firebase/firestore";

// Firebase config
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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  MapPin, Users, Clock, Plus, Edit3, Trash2, CheckCircle, Tag, XCircle, Send,
  ArrowLeft, Loader2, CheckCircle2, Lock, ShieldAlert, Check, X
} from 'lucide-react';

export function ManageOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [closingId, setClosingId] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [orgProfile, setOrgProfile] = useState<any>(null);

  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const categories = ["Medical", "Education", "Environment", "Disaster Relief", "Social", "Other"];
  const types = ["One-time", "Recurring"];

  const [formData, setFormData] = useState({
    title: '', description: '', location: '', category: 'Medical', 
    type: 'One-time', goal: '', contactEmail: '', deadline: '', visibility: 'public'
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Org data normally lives in "organizations", but some older accounts
        // were only ever written to "users" — fall back there if needed.
        let fetchedData = null;
        const orgRef = await getDoc(doc(db, "organizations", user.uid));

        if (orgRef.exists()) {
          fetchedData = orgRef.data();
        } else {
          const userRef = await getDoc(doc(db, "users", user.uid));
          if (userRef.exists()) fetchedData = userRef.data();
        }
        
        if (fetchedData) setOrgProfile(fetchedData);

        const q = query(collection(db, "opportunities"), where("orgId", "==", user.uid));
        
        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const opps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          opps.sort((a, b) => {
            if (a.status === 'closed' && b.status !== 'closed') return 1;
            if (a.status !== 'closed' && b.status === 'closed') return -1;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
          });
          
          setOpportunities(opps);
          
          if (selectedOpp) {
             const updatedSelected = opps.find(o => o.id === selectedOpp.id);
             if (updatedSelected) setSelectedOpp(updatedSelected);
          }
        });
        
        return () => unsubscribeData();
      } else {
        setOpportunities([]);
        setOrgProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, [selectedOpp]);

  useEffect(() => {
    if (!selectedOpp) return;
    const qApps = query(collection(db, "applications"), where("oppId", "==", selectedOpp.id));
    const unsubApps = onSnapshot(qApps, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplicants(fetchedApps);
    });
    return () => unsubApps();
  }, [selectedOpp]);

  // Auto-close missions whose deadline has passed
  useEffect(() => {
    const closeExpiredMissions = async () => {
      const today = new Date().toISOString().split('T')[0]; 
      
      const expiredOpps = opportunities.filter(
        o => o.status !== 'closed' && o.deadline && o.deadline < today
      );
      
      for (const opp of expiredOpps) {
        try {
          await updateDoc(doc(db, "opportunities", opp.id), { 
            status: "closed", 
            closedAt: serverTimestamp(),
            closedReason: "deadline_passed"
          });
        } catch (error) {
          console.error("Failed to auto-close mission:", error);
        }
      }
    };

    if (opportunities.length > 0) {
      closeExpiredMissions();
    }
  }, [opportunities]);

  // Posting requires both identity verification and a complete profile;
  // tier1 orgs are auto-verified and exempt from the extra board/safeguarding fields.
  const currentTier = orgProfile?.tier || 'tier1';
  
  const isVerified = currentTier === 'tier1' ? true : (
    orgProfile?.verified === true || 
    orgProfile?.isVerified === true ||
    orgProfile?.verificationStatus === 'verified' || 
    orgProfile?.status === 'verified'
  );

  const isProfileComplete = orgProfile ? Boolean(
    orgProfile.name?.trim().length >= 3 &&
    orgProfile.description?.trim().length >= 50 &&
    orgProfile.mission?.trim().length >= 20 &&
    (orgProfile.registrationId?.trim().length >= 5 || orgProfile.officialId?.trim().length >= 5) &&
    orgProfile.address?.trim().length >= 10 &&
    orgProfile.phone?.trim().length >= 8 &&
    (Array.isArray(orgProfile.causes) ? orgProfile.causes.length > 0 : orgProfile.causes?.trim().length > 0) &&
    (currentTier === 'tier1' ? true : (
      orgProfile.boardMembers?.trim().length >= 15 &&
      orgProfile.safeguardingPolicy?.trim().length >= 30
    ))
  ) : false;

  const canPost = isVerified && isProfileComplete;

  const handleAddSkill = (e: any) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
        setSkillInput('');
      }
    }
  };

  const handleEdit = (opp: any) => {
    setFormData({ 
        title: opp.title, description: opp.description, location: opp.location,
        category: opp.category || 'Medical', type: opp.type || 'One-time',
        goal: opp.goal, contactEmail: opp.contactEmail, deadline: opp.deadline,
        visibility: opp.targetAudience === 'org_internal' ? 'internal' : 'public'
    });
    setSkills(opp.skills || []);
    setEditingId(opp.id);
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    if (!canPost) return alert("Action Locked: Please complete your profile and verify your identity first.");
    
    setEditingId(null);
    setSkills([]);
    setFormData({ title: '', description: '', location: '', category: 'Medical', type: 'One-time', goal: '', contactEmail: '', deadline: '', visibility: 'public' });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!canPost) return alert("Security Block: Incomplete profile or unverified identity.");

    setLoading(true);
    const user = auth.currentUser;

    if (!user || !orgProfile) {
      alert("System Error: Cannot verify organization credentials.");
      setLoading(false);
      return;
    }

    try {
      let visibilityTarget = 'public';
      if (currentTier === 'tier3') visibilityTarget = 'avr_only';
      else if (currentTier === 'tier2') visibilityTarget = formData.visibility === 'internal' ? 'org_internal' : 'public';
      else visibilityTarget = 'public'; 

      const dataToSave = { 
        ...formData, 
        skills, 
        updatedAt: serverTimestamp(),
        orgId: user.uid,        
        orgName: orgProfile.name || "Verified NGO",       
        orgTier: currentTier,           
        targetAudience: visibilityTarget, 
        isCrisis: currentTier === 'tier3', 
        status: "active"        
      };

      if (editingId) {
        await updateDoc(doc(db, "opportunities", editingId), dataToSave);
      } else {
        await addDoc(collection(db, "opportunities"), { 
          ...dataToSave, 
          createdAt: serverTimestamp(), 
          applicantsCount: 0 
        });
      }
      setShowForm(false);
    } catch (err) { 
      alert(err); 
    }
    setLoading(false);
  };

  const handleDelete = async (oppId: string) => {
     if (window.confirm("WARNING: Deleting removes this opportunity entirely. Are you sure?")) {
        try {
           await deleteDoc(doc(db, "opportunities", oppId));
           if (selectedOpp?.id === oppId) setSelectedOpp(null);
        } catch(e) {
           alert("Failed to delete opportunity.");
        }
     }
  };

  const handleCloseOpportunity = async (oppId: string, auto: boolean = false) => {
    if (!auto && !window.confirm("Are you sure you want to close this mission? Volunteers will no longer be able to apply.")) return;

    if (!auto) setClosingId(oppId);
    try {
      await updateDoc(doc(db, "opportunities", oppId), { status: "closed", closedAt: serverTimestamp() });
    } catch (error) {
      alert("Failed to close mission.");
    } finally {
      if (!auto) setClosingId(null);
    }
  };

  const handleApplicationStatus = async (appId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, "applications", appId), { status: newStatus });

      if (newStatus === 'accepted' && selectedOpp) {
        const currentDeployed = applicants.filter(a => a.status === 'accepted' || a.id === appId).length;
        const goal = parseInt(selectedOpp.goal) || 1;

        if (currentDeployed >= goal) {
          await handleCloseOpportunity(selectedOpp.id, true);
          alert(`Goal of ${goal} volunteers reached! The opportunity has been automatically disabled/closed.`);
        }
      }
    } catch (error) {
       console.error("Failed to update status", error);
       alert("An error occurred updating the application.");
    }
  };

  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) return alert("Message cannot be empty.");
    
    const acceptedVols = applicants.filter(a => a.status === 'accepted');
    if (acceptedVols.length === 0) return alert("You don't have any deployed volunteers for this mission yet.");
    
    setIsBroadcasting(true);
    try {
      const user = auth.currentUser;
      const orgName = orgProfile?.name || "Organization Command";

      await addDoc(collection(db, "messages"), {
        missionId: selectedOpp.id, text: broadcastMessage, senderId: user!.uid,
        senderName: orgName, senderRole: "organization",
        avatar: orgProfile?.photoUrl || "", timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, "opportunities", selectedOpp.id), { lastActivityAt: serverTimestamp() });

      setBroadcastMessage("");
      alert("Message successfully broadcasted!");
    } catch (error) {
      alert("Failed to broadcast message.");
    }
    setIsBroadcasting(false);
  };

  if (selectedOpp) {
    const deployedCount = applicants.filter(a => a.status === 'accepted').length;

    return (
      <div className="space-y-6 pb-10 max-w-7xl mx-auto p-4 animate-in fade-in duration-300">
        <Button variant="ghost" onClick={() => setSelectedOpp(null)} className="text-slate-500 hover:text-[#043E52] hover:bg-slate-100 -ml-2 font-bold mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Opportunities
        </Button>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 space-y-6">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#043E52]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#043E52] text-lg leading-tight flex items-center gap-2">
                  {selectedOpp.title}
                  {selectedOpp.status === 'closed' && <Badge className="bg-slate-200 text-slate-600 text-[10px] uppercase font-black border-none">Closed</Badge>}
                </CardTitle>
                <CardDescription className="text-xs font-semibold">Mission Communications Hub</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                    <span>Goal Required</span><Badge className="bg-slate-200 text-slate-700">{selectedOpp.goal}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                    <span>Deployed (Accepted)</span><Badge className="bg-[#E16A3D]">{deployedCount}</Badge>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Broadcast to Team</Label>
                  <Textarea 
                    placeholder={selectedOpp.status === 'closed' ? "This mission is closed." : "Type instructions..."} 
                    className="min-h-[120px] resize-none border-slate-200 focus:border-[#1C9290] text-sm"
                    value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)}
                    disabled={selectedOpp.status === 'closed'}
                  />
                  <Button 
                    onClick={handleBroadcastMessage} 
                    disabled={isBroadcasting || deployedCount === 0 || !broadcastMessage.trim() || selectedOpp.status === 'closed'} 
                    className="w-full bg-[#043E52] hover:bg-[#033040] text-white font-bold mt-2"
                  >
                    {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send to Comms</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:w-2/3 space-y-4">
            <h2 className="text-lg font-bold text-[#043E52] flex items-center gap-2"><Users className="h-5 w-5 text-[#1C9290]" /> Roster & Applications</h2>
            {applicants.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-bold text-slate-600">No applicants yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {applicants.map((app) => (
                  <Card key={app.id} className="border-slate-200 shadow-sm hover:border-[#1C9290]/30 transition-colors">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-slate-200">
                          <AvatarImage src={app.volunteerAvatar} />
                          <AvatarFallback className="bg-[#043E52] text-white font-bold">{String(app.volunteerName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-[#043E52] text-sm">{app.volunteerName || "Unknown Volunteer"}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Applied: {app.createdAt ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'Recently'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        {app.status === 'pending' && selectedOpp.status !== 'closed' ? (
                           <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApplicationStatus(app.id, 'accepted')} className="bg-[#1C9290] hover:bg-teal-700 text-white h-8 text-[10px] uppercase font-bold tracking-wide"><Check className="h-3 w-3 mr-1"/> Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => handleApplicationStatus(app.id, 'rejected')} className="border-rose-200 text-rose-600 hover:bg-rose-50 h-8 text-[10px] uppercase font-bold tracking-wide"><X className="h-3 w-3 mr-1"/> Reject</Button>
                           </div>
                        ) : (
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            app.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            {app.status || 'Pending'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const todayString = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#043E52] flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-[#1C9290]" /> Opportunity Management
          </h1>
          {/* Validation Warnings */}
          {!isProfileComplete && (
            <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1.5 bg-rose-50 p-2 rounded-md border border-rose-200 w-fit">
              <ShieldAlert className="h-4 w-4" /> Action Required: Complete your Organization Profile settings to unlock posting.
            </p>
          )}
          {!isVerified && isProfileComplete && (
            <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1.5 bg-amber-50 p-2 rounded-md border border-amber-200 w-fit">
              <ShieldAlert className="h-4 w-4" /> Your account is pending document verification. Posting is currently disabled.
            </p>
          )}
        </div>
        
        <Button 
            className={`${canPost ? 'bg-[#043E52] hover:bg-[#033040] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`} 
            onClick={handleOpenCreate}
            disabled={!canPost}
        >
          {canPost ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
          {canPost ? 'Post Opportunity' : 'Locked'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Missions" value={opportunities.length} icon={Tag} color="text-[#043E52]" bg="bg-slate-50" border="border-[#043E52]" />
        <MetricCard label="Active Applicants" value={opportunities.reduce((a, b) => a + (b.applicantsCount || 0), 0)} icon={Users} color="text-[#1C9290]" bg="bg-teal-50" border="border-[#1C9290]" />
        <MetricCard label="Live Feeds" value={opportunities.filter(o => o.status !== 'closed').length} icon={Clock} color="text-[#E16A3D]" bg="bg-orange-50" border="border-[#E16A3D]" />
      </div>

      <div className="space-y-4">
        {opportunities.map((opp) => {
          const isClosed = opp.status === 'closed';

          return (
            <Card key={opp.id} className={`transition-all duration-300 ${isClosed ? 'opacity-80 bg-slate-50 border-l-4 border-l-slate-300' : 'border-l-4 border-l-[#1C9290]'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          {isClosed && <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500"><Lock size={16} /></div>}
                          <h3 className={`text-lg font-bold ${isClosed ? 'text-slate-600 line-through decoration-slate-300' : 'text-[#043E52]'}`}>{opp.title}</h3>
                          
                          {isClosed ? (
                            <Badge className="bg-slate-200 text-slate-600 font-black uppercase text-[9px] border-none">Archived / Disabled</Badge>
                          ) : (
                            <>
                              <Badge variant="outline" className="text-[#E16A3D] border-[#E16A3D] bg-orange-50 font-bold uppercase text-[10px]">{opp.category}</Badge>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold uppercase text-[10px]">
                                {opp.targetAudience === 'avr_only' ? 'AVR Exclusive' : opp.targetAudience === 'org_internal' ? 'Internal Roster' : 'Public System'}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opp.location}</span>
                          {!isClosed && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Deadline: {opp.deadline}</span>}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 flex-col sm:flex-row items-end sm:items-center">
                        {!isClosed && (
                          <Button variant="outline" size="sm" onClick={() => handleCloseOpportunity(opp.id)} disabled={closingId === opp.id} className="h-8 border-orange-200 text-orange-600 font-bold text-[10px] uppercase">
                            {closingId === opp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />} Close
                          </Button>
                        )}
                        {!isClosed && <Button variant="ghost" size="sm" onClick={() => handleEdit(opp)} className="text-slate-400 hover:text-[#043E52] h-8"><Edit3 size={16} /></Button>}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(opp.id)} className="text-slate-300 hover:text-rose-500 h-8"><Trash2 size={16} /></Button>
                      </div>
                    </div>
                    <p className={`text-sm mb-4 p-3 rounded-lg border ${isClosed ? 'bg-white text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>{opp.description}</p>
                    
                    {!isClosed && (
                      <div className="flex flex-wrap gap-2">
                        {opp.skills?.map((skill: string) => <Badge key={skill} variant="secondary" className="bg-white text-[#1C9290] border border-teal-100 text-[10px] font-bold">{skill}</Badge>)}
                      </div>
                    )}
                  </div>

                  <div className={`lg:w-72 border-l lg:pl-6 ${isClosed ? 'border-slate-200' : 'border-slate-100'}`}>
                      <div className={`flex justify-between text-sm font-semibold mb-1 ${isClosed ? 'text-slate-500' : 'text-[#043E52]'}`}>
                          <span>Progress</span><span>{Math.round(((opp.applicantsCount || 0) / (parseInt(opp.goal) || 1)) * 100) || 0}%</span>
                      </div>
                      <Progress value={((opp.applicantsCount || 0) / (parseInt(opp.goal) || 1)) * 100} className={`h-2.5 ${isClosed ? 'bg-slate-200 [&>div]:bg-slate-400' : 'bg-slate-100'}`} />
                      <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                          <span>{opp.applicantsCount || 0} Applied</span><span>Goal: {opp.goal}</span>
                      </div>
                      <Button onClick={() => setSelectedOpp(opp)} className={`w-full mt-4 h-9 text-sm ${isClosed ? 'bg-slate-200 text-slate-700' : 'bg-[#043E52] text-white'}`}>
                        {isClosed ? 'View Roster' : 'Manage Applicants'}
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-xl border-none">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[#043E52] text-lg">{editingId ? 'Edit Opportunity' : 'New Opportunity'}</CardTitle>
              <XCircle className="h-6 w-6 text-slate-300 cursor-pointer hover:text-red-500" onClick={() => setShowForm(false)} />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Volunteer Goal</Label><Input type="number" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Location</Label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                
                {/* Prevent selecting a deadline in the past */}
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input 
                    type="date" 
                    min={todayString} 
                    value={formData.deadline} 
                    onChange={e => setFormData({...formData, deadline: e.target.value})} 
                  />
                </div>
              </div>

              {orgProfile?.tier === 'tier2' && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Label className="flex items-center gap-1.5 text-[#043E52]">
                    <Users className="h-4 w-4 text-[#1C9290]" /> Visibility Target
                  </Label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm" 
                    value={formData.visibility} 
                    onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                  >
                    <option value="public">Public (Attract new volunteers system-wide)</option>
                    <option value="internal">Internal Roster (Restrict to verified org members)</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Required Skills (Enter)</Label>
                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleAddSkill} placeholder="e.g. Nursing" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {skills.map((s, i) => (
                    <Badge key={i} className="bg-slate-100 text-[#043E52] border-none">{s} <XCircle size={12} className="ml-1 cursor-pointer" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} /></Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>

              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#1C9290] text-white font-bold h-11">
                <Send className="mr-2 h-4 w-4" /> {editingId ? 'UPDATE CHANGES' : 'PUBLISH NOW'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, bg, border }: any) {
  return (
    <Card className={`border-t-4 ${border} shadow-sm`}>
      <CardContent className="p-5 flex items-center justify-between">
        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p><p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p></div>
        <div className={`p-3 rounded-full ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
      </CardContent>
    </Card>
  );
}