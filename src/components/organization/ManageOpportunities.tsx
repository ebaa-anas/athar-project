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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { 
  MapPin, Users, Clock, Plus, Edit3, Trash2, CheckCircle, Tag, XCircle, Send 
} from 'lucide-react';

export function ManageOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  // --- CATEGORIES LIST ---
  const categories = ["Medical", "Education", "Environment", "Disaster Relief", "Social", "Other"];
  const types = ["One-time", "Recurring"];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'Medical', 
    type: 'One-time', // Added to match the volunteer tabs!
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
          // Sort by newest first (done locally to prevent Firebase index errors)
          opps.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setOpportunities(opps);
        });
        
        return () => unsubscribeData();
      } else {
        setOpportunities([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

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

  // 2. THE POST STAMP: Attach orgId and orgName before saving
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
        isCrisis: false         // False because this is the normal dashboard
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
        <MetricCard label="Live Feeds" value={opportunities.length} icon={Clock} color="text-[#E16A3D]" bg="bg-orange-50" border="border-[#E16A3D]" />
      </div>

      {/* List */}
      <div className="space-y-4">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="border-l-4 border-l-[#1C9290]">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[#043E52]">{opp.title}</h3>
                        <Badge variant="outline" className="text-[#E16A3D] border-[#E16A3D] bg-orange-50 font-bold uppercase text-[10px]">
                          {opp.category}
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold uppercase text-[10px]">
                          {opp.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opp.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Deadline: {opp.deadline}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(opp)} className="text-slate-400 hover:text-[#043E52]"><Edit3 size={16} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteDoc(doc(db, "opportunities", opp.id))} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></Button>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">{opp.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {opp.skills?.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="bg-white text-[#1C9290] border border-teal-100 text-[10px] font-bold">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div className="lg:w-72 border-l border-slate-100 lg:pl-6">
                    <div className="flex justify-between text-sm font-semibold mb-1 text-[#043E52]">
                        <span>Application Progress</span>
                        <span>{Math.round(((opp.applicantsCount || 0) / (parseInt(opp.goal) || 1)) * 100) || 0}%</span>
                    </div>
                    <Progress value={((opp.applicantsCount || 0) / (parseInt(opp.goal) || 1)) * 100} className="h-2.5 bg-slate-100" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                        <span>{opp.applicantsCount || 0} Applied</span>
                        <span>Goal: {opp.goal}</span>
                    </div>
                    <Button className="w-full mt-4 bg-[#043E52] text-white h-9 text-sm">Manage Applicants</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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