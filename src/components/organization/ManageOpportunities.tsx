import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, where, serverTimestamp, deleteDoc, doc, updateDoc, getDoc 
} from "firebase/firestore";

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
const auth = getAuth(app); // Needed to know WHO is logged in

// --- UI COMPONENTS ---
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
  ArrowLeft, MessageSquare, Loader2, CheckCircle2, Lock, Activity, AlertCircle
} from 'lucide-react';

export function ManageOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 🔥 NEW: State for closing an opportunity 🔥
  const [closingId, setClosingId] = useState<string | null>(null);

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  // --- APPLICANT MANAGEMENT STATES ---
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- CATEGORIES LIST ---
  const categories = ["Medical", "Education", "Environment", "Disaster Relief", "Social", "Other"];
  const types = ["One-time", "Recurring"];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'Medical', 
    type: 'One-time', 
    goal: '',
    contactEmail: '',
    deadline: '',
  });

  // 1. THE FETCH LOCK: Only get THIS organization's opportunities
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Query only where the orgId matches the logged-in user
        const q = query(
          collection(db, "opportunities"), 
          where("orgId", "==", user.uid)
        );
        
        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const opps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // 🔥 Sort logic: Active first, then closed, then by date 🔥
          opps.sort((a, b) => {
            if (a.status === 'closed' && b.status !== 'closed') return 1;
            if (a.status !== 'closed' && b.status === 'closed') return -1;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
          });
          
          setOpportunities(opps);
        });
        
        return () => unsubscribeData();
      } else {
        setOpportunities([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. FETCH APPLICANTS WHEN AN OPPORTUNITY IS SELECTED
  useEffect(() => {
    if (!selectedOpp) return;

    const qApps = query(
      collection(db, "applications"),
      where("oppId", "==", selectedOpp.id)
    );

    const unsubApps = onSnapshot(qApps, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplicants(fetchedApps);
    });

    return () => unsubApps();
  }, [selectedOpp]);

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
        title: opp.title,
        description: opp.description,
        location: opp.location,
        category: opp.category || 'Medical', 
        type: opp.type || 'One-time',
        goal: opp.goal,
        contactEmail: opp.contactEmail,
        deadline: opp.deadline 
    });
    setSkills(opp.skills || []);
    setEditingId(opp.id);
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setSkills([]);
    setFormData({ title: '', description: '', location: '', category: 'Medical', type: 'One-time', goal: '', contactEmail: '', deadline: '' });
    setShowForm(true);
  };

  // 3. THE POST STAMP: Attach orgId and orgName before saving
  const handleSubmit = async () => {
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to post.");
      setLoading(false);
      return;
    }

    try {
      // Fetch the organization's official name from the users collection
      const orgDoc = await getDoc(doc(db, "users", user.uid));
      const orgName = orgDoc.exists() ? orgDoc.data().name : "Verified NGO";

      // Prepare the complete data object
      const dataToSave = { 
        ...formData, 
        skills, 
        updatedAt: serverTimestamp(),
        orgId: user.uid,        // The connection ID!
        orgName: orgName,       // The display name!
        isCrisis: false,        // False because this is the normal dashboard
        status: "active"        // 🔥 ALWAYS SET NEW OPPS TO ACTIVE 🔥
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

  // 🔥 NEW: THE CLOSE FUNCTION 🔥
  const handleCloseOpportunity = async (oppId: string) => {
    if (!window.confirm("Are you sure you want to close this mission? It will be archived and volunteers will no longer be able to apply.")) {
      return;
    }

    setClosingId(oppId);
    try {
      const oppRef = doc(db, "opportunities", oppId);
      await updateDoc(oppRef, {
        status: "closed",
        closedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error closing mission:", error);
      alert("Failed to close mission. Please check your connection.");
    } finally {
      setClosingId(null);
    }
  };

  // BROADCAST TO MISSION COMMS (MESSAGES COLLECTION)
  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) return alert("Message cannot be empty.");
    
    // Only allow broadcasting if there are actually accepted volunteers
    const acceptedVols = applicants.filter(a => a.status === 'accepted');
    if (acceptedVols.length === 0) return alert("You don't have any deployed (accepted) volunteers for this mission yet.");
    
    setIsBroadcasting(true);
    try {
      const user = auth.currentUser;
      const orgDoc = await getDoc(doc(db, "users", user!.uid));
      const orgData = orgDoc.exists() ? orgDoc.data() : {};
      const orgName = orgData.name || "Organization Command";

      // 1. Post directly to the 'messages' collection linked to this missionId
      await addDoc(collection(db, "messages"), {
        missionId: selectedOpp.id,
        text: broadcastMessage,
        senderId: user!.uid,
        senderName: orgName,
        senderRole: "organization",
        avatar: orgData.photoUrl || orgData.avatarUrl || orgData.logoUrl || "",
        timestamp: serverTimestamp()
      });

      // 2. Update the opportunity's last activity so it jumps to the top of the Comms Hub
      await updateDoc(doc(db, "opportunities", selectedOpp.id), {
        lastActivityAt: serverTimestamp()
      });

      setBroadcastMessage("");
      alert("Message successfully broadcasted to the Mission Comms channel!");
    } catch (error) {
      console.error("Broadcast failed:", error);
      alert("Failed to broadcast message.");
    }
    setIsBroadcasting(false);
  };

  // --- APPLICANT MANAGEMENT VIEW ---
  if (selectedOpp) {
    const deployedCount = applicants.filter(a => a.status === 'accepted').length;

    return (
      <div className="space-y-6 pb-10 max-w-7xl mx-auto p-4 animate-in fade-in duration-300">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedOpp(null)} 
          className="text-slate-500 hover:text-[#043E52] hover:bg-slate-100 -ml-2 font-bold mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Opportunities
        </Button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT: BROADCAST TOOL */}
          <div className="md:w-1/3 space-y-6">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#043E52]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#043E52] text-lg leading-tight flex items-center gap-2">
                  {selectedOpp.title}
                  {selectedOpp.status === 'closed' && (
                    <Badge className="bg-slate-200 text-slate-600 text-[10px] uppercase font-black border-none hover:bg-slate-200">Closed</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs font-semibold">Mission Communications Hub</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                    <span>Total Applicants</span>
                    <Badge className="bg-[#1C9290]">{applicants.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                    <span>Deployed (Accepted)</span>
                    <Badge className="bg-[#E16A3D]">{deployedCount}</Badge>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Broadcast to Deployed Team</Label>
                  <Textarea 
                    placeholder={selectedOpp.status === 'closed' ? "This mission is closed." : "Type instructions, updates, or meeting links here..."} 
                    className="min-h-[120px] resize-none border-slate-200 focus:border-[#1C9290] text-sm"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    disabled={selectedOpp.status === 'closed'}
                  />
                  <Button 
                    onClick={handleBroadcastMessage} 
                    disabled={isBroadcasting || deployedCount === 0 || !broadcastMessage.trim() || selectedOpp.status === 'closed'} 
                    className="w-full bg-[#043E52] hover:bg-[#033040] text-white font-bold mt-2"
                  >
                    {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send to Mission Comms</>}
                  </Button>
                  {deployedCount === 0 && selectedOpp.status !== 'closed' && (
                    <p className="text-[10px] text-orange-600 font-bold text-center mt-2">You need accepted volunteers to broadcast.</p>
                  )}
                  {selectedOpp.status === 'closed' && (
                    <p className="text-[10px] text-slate-500 font-bold text-center mt-2">Broadcasting disabled for closed missions.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: APPLICANT LIST */}
          <div className="md:w-2/3 space-y-4">
            <h2 className="text-lg font-bold text-[#043E52] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#1C9290]" /> Roster & Applications
            </h2>
            
            {applicants.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-bold text-slate-600">No applicants yet</p>
                  <p className="text-sm text-slate-500 mt-1">When volunteers apply to this mission, they will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {applicants.map((app) => (
                  <Card key={app.id} className="border-slate-200 shadow-sm hover:border-[#1C9290]/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
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
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${
                          app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {app.status || 'Pending'}
                        </Badge>
                        {app.status === 'pending' && selectedOpp.status !== 'closed' && (
                           <span className="text-[10px] text-slate-400 italic">Review in Applications tab</span>
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

  // --- ORIGINAL OPPORTUNITIES VIEW ---
  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto p-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#043E52] flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-[#1C9290]" /> 
            Opportunity Management
          </h1>
        </div>
        <Button className="bg-[#043E52] hover:bg-[#033040] text-white" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Post Opportunity
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Missions" value={opportunities.length} icon={Tag} color="text-[#043E52]" bg="bg-slate-50" border="border-[#043E52]" />
        <MetricCard label="Active Applicants" value={opportunities.reduce((a, b) => a + (b.applicantsCount || 0), 0)} icon={Users} color="text-[#1C9290]" bg="bg-teal-50" border="border-[#1C9290]" />
        {/* Count only active opportunities */}
        <MetricCard label="Live Feeds" value={opportunities.filter(o => o.status !== 'closed').length} icon={Clock} color="text-[#E16A3D]" bg="bg-orange-50" border="border-[#E16A3D]" />
      </div>

      {/* List */}
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
                          {/* 🔥 Show Closed Badge 🔥 */}
                          {isClosed && (
                            <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                              <Lock size={16} />
                            </div>
                          )}
                          <h3 className={`text-lg font-bold ${isClosed ? 'text-slate-600 line-through decoration-slate-300' : 'text-[#043E52]'}`}>{opp.title}</h3>
                          
                          {isClosed && (
                            <Badge className="bg-slate-200 text-slate-600 font-black uppercase text-[9px] tracking-wider border-none hover:bg-slate-200">Archived</Badge>
                          )}
                          {!isClosed && (
                            <>
                              <Badge variant="outline" className="text-[#E16A3D] border-[#E16A3D] bg-orange-50 font-bold uppercase text-[10px]">
                                {opp.category}
                              </Badge>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold uppercase text-[10px]">
                                {opp.type}
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
                        {/* 🔥 CLOSE BUTTON 🔥 */}
                        {!isClosed && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCloseOpportunity(opp.id)}
                            disabled={closingId === opp.id}
                            className="h-8 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold text-[10px] uppercase tracking-widest rounded-md"
                          >
                            {closingId === opp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                            Close
                          </Button>
                        )}
                        {!isClosed && <Button variant="ghost" size="sm" onClick={() => handleEdit(opp)} className="text-slate-400 hover:text-[#043E52] h-8"><Edit3 size={16} /></Button>}
                        
                        {/* Keep delete for severe mistakes, but highly discourage it */}
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (window.confirm("WARNING: Deleting this completely removes it and all volunteer hours associated with it. Are you absolutely sure?")) {
                            deleteDoc(doc(db, "opportunities", opp.id))
                          }
                        }} className="text-slate-300 hover:text-red-500 h-8"><Trash2 size={16} /></Button>
                      </div>
                    </div>
                    <p className={`text-sm mb-4 p-3 rounded-lg border ${isClosed ? 'bg-white text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>{opp.description}</p>
                    
                    {!isClosed && (
                      <div className="flex flex-wrap gap-2">
                        {opp.skills?.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-white text-[#1C9290] border border-teal-100 text-[10px] font-bold">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`lg:w-72 border-l lg:pl-6 ${isClosed ? 'border-slate-200' : 'border-slate-100'}`}>
                      <div className={`flex justify-between text-sm font-semibold mb-1 ${isClosed ? 'text-slate-500' : 'text-[#043E52]'}`}>
                          <span>Application Progress</span>
                          <span>{Math.round(((opp.applicantsCount || 0) / (parseInt(opp.goal) || 1)) * 100) || 0}%</span>
                      </div>
                      <Progress value={((opp.applicantsCount || 0) / (parseInt(opp.goal) || 1)) * 100} className={`h-2.5 ${isClosed ? 'bg-slate-200 [&>div]:bg-slate-400' : 'bg-slate-100'}`} />
                      <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                          <span>{opp.applicantsCount || 0} Applied</span>
                          <span>Goal: {opp.goal}</span>
                      </div>
                      <Button onClick={() => setSelectedOpp(opp)} className={`w-full mt-4 h-9 text-sm ${isClosed ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-[#043E52] text-white'}`}>
                        {isClosed ? 'View Roster' : 'Manage Applicants'}
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-xl border-none">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[#043E52] text-lg">{editingId ? 'Edit Opportunity' : 'New Opportunity'}</CardTitle>
              <XCircle className="h-6 w-6 text-slate-300 cursor-pointer hover:text-red-500" onClick={() => setShowForm(false)} />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#1C9290]"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#1C9290]"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Volunteer Goal</Label>
                  <Input type="number" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Location</Label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} /></div>
              </div>

              <div className="space-y-2">
                <Label>Required Skills (Enter)</Label>
                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleAddSkill} placeholder="e.g. Nursing" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {skills.map((s, i) => (
                    <Badge key={i} className="bg-slate-100 text-[#043E52] border-none">{s} <XCircle size={12} className="ml-1 cursor-pointer" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} /></Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

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