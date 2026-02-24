import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where, doc, updateDoc, getDoc, addDoc, serverTimestamp 
} from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, Filter, CheckCircle, X, Eye, Download, Mail, Phone, MapPin, 
  Clock, Briefcase, ArrowLeft, Calendar, User, Star, Heart, Globe, 
  Activity, AlertCircle
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

// --- SAFETY HELPERS ---
const safeArray = (data: any) => Array.isArray(data) ? data : [];
const safeObject = (data: any) => (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};

export function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // --- 1. FETCH ENTIRE VOLUNTEER PROFILE SAFELY ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(collection(db, "applications"), where("orgId", "==", user.uid));

        const unsubscribeData = onSnapshot(q, async (snapshot) => {
          const basicApps = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

          const enrichedApps = await Promise.all(basicApps.map(async (app: any) => {
            let vp: any = {}; 
            
            try {
              if (app.volunteerId) {
                const userDocRef = doc(db, "users", app.volunteerId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  vp = userDocSnap.data() || {};
                }
              }
            } catch (err) {
              console.error("Error fetching volunteer profile", err);
            }

            let safeDate = 'Recently';
            if (app.appliedAt && typeof app.appliedAt.toDate === 'function') {
              safeDate = new Date(app.appliedAt.toDate()).toLocaleDateString();
            } else if (typeof app.appliedAt === 'string') {
              safeDate = new Date(app.appliedAt).toLocaleDateString();
            }

            const safeLocation = vp.location || (vp.city ? `${vp.city}, ${vp.country || ''}` : 'Location unspecified');
            const normalizedStatus = String(app.status || 'pending').toLowerCase();

            return {
              id: app.id,
              rawVolunteerId: app.volunteerId, // Saved so we can send them a notification!
              status: normalizedStatus,
              opportunity: String(app.oppTitle || 'Opportunity'),
              appliedDate: safeDate,
              coverLetter: String(app.coverLetter || "No cover letter attached."),
              
              volunteer: {
                name: String(app.volunteerName || vp.name || 'Unknown Volunteer'),
                email: String(vp.email || 'No email provided'),
                phone: String(vp.phone || 'No phone provided'),
                location: String(safeLocation),
                avatar: String(vp.avatarUrl || ''),
                bio: String(vp.bio || 'No bio provided.'),
                linkedIn: String(vp.linkedIn || ''),
                rating: Number(vp.rating || 5.0),
                totalHours: Number(vp.totalHours || 0),
                completedProjects: Number(vp.completedProjects || 0),
                
                skills: safeArray(vp.skills),
                interests: safeArray(vp.interests),
                educations: safeArray(vp.educations),
                experiences: safeArray(vp.experiences),
                languages: safeArray(vp.languages),
                
                crisisInfo: safeObject(vp.crisisInfo),
                availability: safeObject(vp.availability)
              }
            };
          }));

          enrichedApps.sort((a: any, b: any) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
          setApplications(enrichedApps);
        });

        return () => unsubscribeData();
      } else {
        setApplications([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  
  // --- 2. UPDATE STATUS & SEND NOTIFICATION ---
  const handleUpdateStatus = async (appObj: any, newStatus: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // A. Update the Application Document
      await updateDoc(doc(db, "applications", appObj.id), { status: newStatus });

      // B. Fetch Organization Name to make the notification personal
      const orgDoc = await getDoc(doc(db, "organizations", user.uid));
      const orgName = orgDoc.exists() ? orgDoc.data().name : "An Organization";

      // C. Shoot the notification to the Volunteer!
      await addDoc(collection(db, "notifications"), {
        userId: appObj.rawVolunteerId, 
        organizationName: orgName, // <--- ADDED THIS SO NOTIFICATIONS CAN READ IT
        title: newStatus === 'accepted' ? 'Application Accepted! 🎉' : 'Application Update',
        message: newStatus === 'accepted' 
          ? `Congratulations! ${orgName} accepted your application for "${appObj.opportunity}".` 
          : `${orgName} has reviewed your application for "${appObj.opportunity}". Unfortunately, they went with another candidate this time.`,
        type: newStatus === 'accepted' ? 'success' : 'info',
        read: false,
        createdAt: serverTimestamp(),
        link: newStatus === 'accepted' ? '/tasks' : '/explore'
      });

      // D. Close the profile view if it's open
      if (selectedApp) setSelectedApp(null);
      
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };
  const filteredApps = applications.filter(a => {
    const volName = String(a?.volunteer?.name || "").toLowerCase();
    const oppName = String(a?.opportunity || "").toLowerCase();
    const search = String(searchTerm || "").toLowerCase();
    return volName.includes(search) || oppName.includes(search);
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  // ==========================================
  // VIEW 1: THE FULL SOCIAL IMPACT PORTFOLIO
  // ==========================================
  if (selectedApp) {
    const vol = selectedApp.volunteer;
    const firstLetter = String(vol?.name || 'U').charAt(0).toUpperCase();

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedApp(null)} className="text-slate-500 hover:text-[#043E52] hover:bg-slate-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#043E52]/5 text-[#043E52] border-[#043E52]/20 text-sm py-1 px-3">
              Applying for: <strong className="ml-1">{selectedApp.opportunity}</strong>
            </Badge>
            <Badge className={`text-sm px-4 py-1.5 ${
                selectedApp.status === 'accepted' ? 'bg-[#1C9290]/10 text-[#1C9290] hover:bg-[#1C9290]/20' :
                selectedApp.status === 'rejected' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                'bg-[#E16A3D]/10 text-[#E16A3D] hover:bg-[#E16A3D]/20'
              }`}
            >
              {String(selectedApp.status).toUpperCase()}
            </Badge>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl border border-slate-100">
          <div className="h-32 bg-[#1C9290]"></div>
          <CardContent className="px-8 pb-6 flex flex-col md:flex-row gap-6 relative -mt-12 items-end">
            <Avatar className="w-32 h-32 border-4 border-white shadow-md bg-white">
              <AvatarImage src={vol.avatar} />
              <AvatarFallback className="bg-slate-100 text-[#043E52] text-4xl font-black">{firstLetter}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-slate-900">{vol.name}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Mail size={16} /> {vol.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={16} /> {vol.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin size={16} /> {vol.location}</span>
                {vol.linkedIn && (
                  <a href={vol.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#1C9290] hover:underline">
                    <Globe size={16} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-lg text-[#043E52] flex items-center gap-2"><User className="h-5 w-5 text-[#1C9290]" /> About Me</CardTitle></CardHeader>
              <CardContent><p className="text-slate-600 text-sm leading-relaxed">{vol.bio}</p></CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-4"><CardTitle className="text-lg text-[#043E52] flex items-center gap-2"><Briefcase className="h-5 w-5 text-[#1C9290]" /> Education</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {vol.educations.length > 0 ? vol.educations.map((edu: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Briefcase size={20} /></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{String(edu?.level || '')} in {String(edu?.fieldOfStudy || edu?.institution || '')}</h4>
                      <p className="text-xs text-slate-500 font-medium">{String(edu?.institution || '')}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Class of {String(edu?.gradYear || '')}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500 italic">No education history added.</p>}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-4"><CardTitle className="text-lg text-[#043E52] flex items-center gap-2"><Briefcase className="h-5 w-5 text-[#1C9290]" /> Volunteer Experience</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {vol.experiences.length > 0 ? vol.experiences.map((exp: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200"><Briefcase size={20} /></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{String(exp?.title || '')}</h4>
                      <p className="text-xs font-bold text-[#1C9290] mb-1">{String(exp?.organization || '')}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-2">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {String(exp?.startDate || '')} - {String(exp?.endDate || 'Present')}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {String(exp?.location || '')}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{String(exp?.description || '')}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500 italic">No experience added.</p>}
              </CardContent>
            </Card>

            <Card className="border-[#1C9290]/30 shadow-md rounded-2xl bg-teal-50/30">
              <CardHeader className="pb-2 border-b border-teal-100/50"><CardTitle className="text-lg text-[#043E52] flex items-center gap-2"><Mail className="h-5 w-5 text-[#1C9290]" /> Application Cover Letter</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="bg-white p-5 rounded-xl border border-teal-100 shadow-sm">
                  <p className="text-slate-700 italic text-sm leading-relaxed">"{selectedApp.coverLetter}"</p>
                </div>
                <div className="flex gap-4 pt-2">
                  {selectedApp.status === 'pending' ? (
                    <>
                      <Button onClick={() => handleUpdateStatus(selectedApp, 'accepted')} className="flex-1 h-12 bg-[#1C9290] hover:bg-[#157a78] text-white text-base font-bold shadow-md"><CheckCircle className="mr-2 h-5 w-5" /> Accept Application</Button>
                      <Button onClick={() => handleUpdateStatus(selectedApp, 'rejected')} variant="outline" className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 text-base font-bold"><X className="mr-2 h-5 w-5" /> Decline</Button>
                    </>
                  ) : (
                    <div className="w-full text-center text-slate-500 font-medium py-3">This application has already been <strong className="uppercase">{selectedApp.status}</strong>.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-red-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="bg-[#e63946] text-white px-5 py-3 flex items-center gap-2 font-bold text-sm"><AlertCircle size={18} /> Emergency Deployment</div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between p-4">
                    <span className="flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} className="text-slate-400" /> Driver</span>
                    {vol.crisisInfo?.drivingLicense ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Yes</Badge> : <Badge variant="outline" className="text-slate-400">No</Badge>}
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <span className="flex items-center gap-2 text-sm text-slate-600"><Activity size={16} className="text-red-400" /> Blood Type</span>
                    <span className="font-bold text-slate-900">{String(vol.crisisInfo?.bloodType || 'N/A')}</span>
                  </div>
                  <div className="p-4">
                    <span className="flex items-center gap-2 text-sm text-slate-600 mb-2"><Phone size={16} className="text-slate-400" /> Emergency Contact</span>
                    <div className="pl-6">
                      <p className="text-sm font-bold text-slate-900">{String(vol.crisisInfo?.emergencyName || 'Not provided')} <span className="font-normal text-slate-400 text-xs">({String(vol.crisisInfo?.emergencyRelation || 'N/A')})</span></p>
                      <p className="text-sm text-slate-500 mt-0.5">{String(vol.crisisInfo?.emergencyPhone || 'N/A')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base text-[#043E52] flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-400" /> Availability</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Days</span>
                  <div className="flex gap-2">
                    {vol.availability?.weekdays && <Badge variant="secondary" className="bg-indigo-50 text-indigo-600">Weekdays</Badge>}
                    {vol.availability?.weekends && <Badge variant="secondary" className="bg-indigo-50 text-indigo-600">Weekends</Badge>}
                    {!vol.availability?.weekdays && !vol.availability?.weekends && <span className="text-xs text-slate-400">Not set</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Format</span>
                  <span className="text-sm font-bold text-slate-800">{String(vol.availability?.format || 'Flexible')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Hours</span>
                  <span className="text-sm font-bold text-slate-800">{String(vol.availability?.hours || 'Not set')}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base text-[#043E52] flex items-center gap-2"><Heart className="h-5 w-5 text-pink-400" /> Causes</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {vol.interests.length > 0 ? vol.interests.map((cause: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-slate-50 border-slate-200 text-slate-600">{String(cause)}</Badge>
                  )) : <span className="text-xs text-slate-400">None specified</span>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base text-[#043E52] flex items-center gap-2"><CheckCircle className="h-5 w-5 text-[#1C9290]" /> Verified Skills</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {vol.skills.length > 0 ? vol.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-teal-200 text-[#1C9290] bg-white text-xs px-2 py-1">{String(skill)}</Badge>
                  )) : <span className="text-xs text-slate-400">No skills listed</span>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base text-[#043E52] flex items-center gap-2"><Globe className="h-5 w-5 text-slate-400" /> Languages</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {vol.languages.length > 0 ? vol.languages.map((lang: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <span className="text-sm font-bold text-slate-800">{String(lang?.name || '')}</span>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-medium">{String(lang?.proficiency || '')}</Badge>
                    </div>
                  )) : <div className="p-4 text-xs text-slate-400">No languages listed</div>}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE MAIN APPLICATIONS LIST
  // ==========================================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] text-2xl font-bold">Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage volunteer applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50"><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Total Applications</p><p className="text-[#043E52] text-2xl font-bold mt-2">{applications.length}</p></div><div className="bg-[#043E52]/10 p-3 rounded-lg"><Briefcase className="h-5 w-5 text-[#043E52]" /></div></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Pending Review</p><p className="text-[#E16A3D] text-2xl font-bold mt-2">{pendingCount}</p></div><div className="bg-[#E16A3D]/10 p-3 rounded-lg"><Clock className="h-5 w-5 text-[#E16A3D]" /></div></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Accepted</p><p className="text-[#1C9290] text-2xl font-bold mt-2">{acceptedCount}</p></div><div className="bg-[#1C9290]/10 p-3 rounded-lg"><CheckCircle className="h-5 w-5 text-[#1C9290]" /></div></div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Rejected</p><p className="text-slate-700 text-2xl font-bold mt-2">{rejectedCount}</p></div><div className="bg-slate-100 p-3 rounded-lg"><X className="h-5 w-5 text-slate-500" /></div></div></CardContent></Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by volunteer name or mission..." className="pl-10 border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100 text-slate-500">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-[#E16A3D] data-[state=active]:shadow-sm">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm">Accepted ({acceptedCount})</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">All ({applications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {filteredApps.filter(a => a.status === 'pending').map((app) => (
              <Card key={app.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-[#E16A3D]/30">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Avatar className="w-16 h-16 border-2 border-slate-100">
                      <AvatarImage src={app.volunteer?.avatar} />
                      <AvatarFallback className="bg-[#043E52] text-white font-bold text-xl">
                        {String(app.volunteer?.name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#043E52]">{app.volunteer?.name}</h3>
                          <p className="text-sm text-[#1C9290] font-medium">Applied for: {app.opportunity}</p>
                          <p className="text-xs text-slate-500 mt-1">{app.appliedDate}</p>
                        </div>
                        <Badge variant="outline" className="bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20">Pending Review</Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-500"><Mail className="h-4 w-4 text-[#043E52]" /><span className="truncate">{app.volunteer?.email}</span></div>
                        <div className="flex items-center gap-2 text-slate-500"><Phone className="h-4 w-4 text-[#043E52]" /><span>{app.volunteer?.phone}</span></div>
                        <div className="flex items-center gap-2 text-slate-500"><MapPin className="h-4 w-4 text-[#043E52]" /><span>{app.volunteer?.location}</span></div>
                        <div className="flex items-center gap-2 text-slate-500"><Star className="h-4 w-4 fill-[#E16A3D] text-[#E16A3D]" /><span>{app.volunteer?.rating} rating</span></div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {(app.volunteer?.skills || []).map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-slate-100 text-[#043E52] border border-slate-200">
                              {String(skill)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Cover Letter Summary</p>
                        <p className="text-sm text-slate-600 bg-white border border-slate-100 p-3 rounded-lg italic line-clamp-2">
                          "{app.coverLetter}"
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                        <Button onClick={() => handleUpdateStatus(app, 'accepted')} className="bg-[#1C9290] hover:bg-[#157a78] text-white shadow-sm"><CheckCircle className="mr-2 h-4 w-4" /> Accept</Button>
                        <Button onClick={() => handleUpdateStatus(app, 'rejected')} variant="outline" className="border-slate-200 text-[#E16A3D] hover:text-[#c2562d] hover:bg-[#E16A3D]/5 hover:border-[#E16A3D]/20"><X className="mr-2 h-4 w-4" /> Decline</Button>
                        <Button onClick={() => setSelectedApp(app)} variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50"><Eye className="mr-2 h-4 w-4" /> View Full Profile</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['accepted', 'rejected', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="space-y-4">
              {filteredApps
                .filter(a => tab === 'all' ? true : a.status === tab)
                .map((app) => (
                <Card key={app.id} className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedApp(app)}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-slate-200">
                        <AvatarImage src={app.volunteer?.avatar} />
                        <AvatarFallback className="bg-[#043E52] text-white font-bold">{String(app.volunteer?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="text-[#043E52] font-bold">{app.volunteer?.name}</h4>
                        <p className="text-sm text-slate-500">{app.opportunity}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          app.status === 'accepted' ? 'bg-[#1C9290]/10 text-[#1C9290] border-[#1C9290]/20' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20'
                        }
                      >
                        {String(app.status || 'pending').charAt(0).toUpperCase() + String(app.status || 'pending').slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}