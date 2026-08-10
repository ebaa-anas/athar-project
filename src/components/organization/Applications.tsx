import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where, doc, updateDoc, getDoc, addDoc, serverTimestamp, increment 
} from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { 
  Search, Filter, CheckCircle, X, Eye, Download, Mail, Phone, MapPin, 
  Clock, Briefcase, ArrowLeft, Calendar, User, Star, Globe, 
  Activity, AlertCircle, Shield
} from 'lucide-react';

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

const safeArray = (data: any) => Array.isArray(data) ? data : [];
const safeObject = (data: any) => (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};

export function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [crisisVerifications, setCrisisVerifications] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let unsubscribeApps = () => {};
    let unsubscribeCrises = () => {};
    let unsubscribeResp = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {

        const qApps = query(collection(db, "applications"), where("orgId", "==", user.uid));
        unsubscribeApps = onSnapshot(qApps, async (snapshot) => {
          const basicApps = snapshot.docs.map(docSnap => ({ id: docSnap.id, type: 'normal', ...docSnap.data() }));

          const enrichedApps = await Promise.all(basicApps.map(async (app: any) => {
            let vp: any = {}; 
            try {
              if (app.volunteerId) {
                const userDocSnap = await getDoc(doc(db, "users", app.volunteerId));
                if (userDocSnap.exists()) vp = userDocSnap.data() || {};
              }
            } catch (err) { console.error(err); }

            let safeDate = 'Recently';
            if (app.appliedAt?.toDate) safeDate = new Date(app.appliedAt.toDate()).toLocaleDateString();
            else if (typeof app.appliedAt === 'string') safeDate = new Date(app.appliedAt).toLocaleDateString();

            return {
              ...app,
              rawVolunteerId: app.volunteerId,
              status: String(app.status || 'pending').toLowerCase(),
              opportunity: String(app.oppTitle || app.opportunity || app.title || 'Community Mission'),
              appliedDate: safeDate,
              coverLetter: String(app.coverLetter || "No cover letter attached."),
              proofNote: app.proofNote || null,
              proofLink: app.proofLink || null,
              
              volunteer: {
                name: String(app.volunteerName || vp.name || 'Unknown Volunteer'),
                email: String(vp.email || 'No email provided'),
                phone: String(vp.phone || 'No phone provided'),
                location: String(vp.location || vp.city || 'Location unspecified'),
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

        const qCrises = query(collection(db, "crises"), where("orgId", "==", user.uid));
        unsubscribeCrises = onSnapshot(qCrises, (crisisSnap) => {
            const orgCrisisIds = crisisSnap.docs.map(d => d.id);
            const crisisDataMap: any = {};
            crisisSnap.docs.forEach(d => crisisDataMap[d.id] = d.data());

            const qResp = query(collection(db, "crisisResponses"));
            unsubscribeResp = onSnapshot(qResp, async (respSnap) => {
                const pendingCrisisResponses = respSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter((d: any) => orgCrisisIds.includes(d.crisisId) && d.status === 'pending_verification');

                const enrichedCrisisApps = await Promise.all(pendingCrisisResponses.map(async (resp: any) => {
                    let vp: any = {}; 
                    try {
                        const userDocSnap = await getDoc(doc(db, "users", resp.volunteerId));
                        if (userDocSnap.exists()) vp = userDocSnap.data() || {};
                    } catch (err) { console.error(err); }

                    return {
                        ...resp,
                        type: 'crisis',
                        rawVolunteerId: resp.volunteerId,
                        opportunity: crisisDataMap[resp.crisisId]?.title || 'Emergency Deployment',
                        status: 'pending_verification',
                        appliedDate: 'Emergency Response',
                        coverLetter: "Direct Emergency Deployment.",
                        volunteer: {
                            name: String(vp.name || 'Unknown Responder'),
                            email: String(vp.email || 'No email provided'),
                            phone: String(vp.phone || 'No phone provided'),
                            location: String(vp.location || vp.city || 'Location unspecified'),
                            avatar: String(vp.avatarUrl || ''),
                            bio: String(vp.bio || 'No bio provided.'),
                            skills: safeArray(vp.skills),
                            crisisInfo: safeObject(vp.crisisInfo),
                            rating: Number(vp.rating || 5.0)
                        }
                    };
                }));
                setCrisisVerifications(enrichedCrisisApps);
            });
        });

      } else {
        setApplications([]);
        setCrisisVerifications([]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeApps();
      unsubscribeCrises();
      unsubscribeResp();
    };
  }, []);

  const handleUpdateStatus = async (appObj: any, newStatus: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "applications", appObj.id), { status: newStatus });

      const orgDoc = await getDoc(doc(db, "organizations", user.uid));
      const orgName = orgDoc.exists() ? orgDoc.data().name : "An Organization";

      const isCoreCrew = appObj.oppId === 'core_crew';
      const successTitle = isCoreCrew ? 'Welcome to the Team! 🎉' : 'Application Accepted! 🎉';
      const successMsg = isCoreCrew 
        ? `Congratulations! ${orgName} has accepted your application to join their Core Volunteer Crew.`
        : `Congratulations! ${orgName} accepted your application for "${appObj.opportunity}".`;
      const rejectMsg = isCoreCrew
        ? `${orgName} has reviewed your application to join their team. Unfortunately, they are not adding new members at this time.`
        : `${orgName} has reviewed your application for "${appObj.opportunity}". Unfortunately, they went with another candidate.`;

      await addDoc(collection(db, "notifications"), {
        userId: appObj.rawVolunteerId, 
        organizationName: orgName, 
        title: newStatus === 'accepted' ? successTitle : 'Application Update',
        message: newStatus === 'accepted' ? successMsg : rejectMsg,
        type: newStatus === 'accepted' ? 'success' : 'info',
        read: false,
        createdAt: serverTimestamp(),
        link: newStatus === 'accepted' ? (isCoreCrew ? '/organizations' : '/tasks') : '/explore'
      });
      
      if (selectedApp) setSelectedApp(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  // Crisis responses earn more hours/points than a standard mission
  const handleVerifyTask = async (appObj: any) => {
    try {
      setIsVerifying(true);
      const user = auth.currentUser;
      if (!user) return;

      const collectionName = appObj.type === 'crisis' ? 'crisisResponses' : 'applications';
      const hoursToAward = appObj.type === 'crisis' ? 12 : 4;
      const pointsToAward = appObj.type === 'crisis' ? 200 : 50;

      await updateDoc(doc(db, collectionName, appObj.id), { 
        status: 'completed',
        verifiedAt: serverTimestamp(),
        verifiedBy: user.uid
      });

      await updateDoc(doc(db, "users", appObj.rawVolunteerId), {
        totalHours: increment(hoursToAward),
        completedProjects: increment(1),
        impactScore: increment(pointsToAward)
      });

      const orgDoc = await getDoc(doc(db, "organizations", user.uid));
      const orgName = orgDoc.exists() ? orgDoc.data().name : "An Organization";

      await addDoc(collection(db, "notifications"), {
        userId: appObj.rawVolunteerId, 
        organizationName: orgName, 
        title: 'Mission Verified! 🏆',
        message: `${orgName} verified your work for "${appObj.opportunity}". You earned ${hoursToAward} Hours and +${pointsToAward} Impact Score!`,
        type: 'success',
        read: false,
        createdAt: serverTimestamp(),
        link: '/tasks'
      });

      alert("Verification successful! Points have been awarded to the volunteer.");
      if (selectedApp) setSelectedApp(null);
    } catch (error) {
      console.error("Error verifying:", error);
      alert("Failed to verify task.");
    }
    setIsVerifying(false);
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
  
  const verificationsList = [...applications.filter(a => a.status === 'pending_verification'), ...crisisVerifications];
  const verificationsCount = verificationsList.length;

  // Volunteer profile view
  if (selectedApp) {
    const vol = selectedApp.volunteer;
    const firstLetter = String(vol?.name || 'U').charAt(0).toUpperCase();
    const isCoreCrewApp = selectedApp.oppId === 'core_crew';

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedApp(null)} className="text-slate-500 hover:text-[#043E52] hover:bg-slate-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            {isCoreCrewApp ? (
              <Badge variant="outline" className="bg-orange-50 text-[#E16A3D] border-orange-200 text-sm py-1 px-3">
                <Shield className="mr-1.5 h-3.5 w-3.5" /> CORE CREW MEMBERSHIP
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-[#043E52]/5 text-[#043E52] border-[#043E52]/20 text-sm py-1 px-3">
                Mission: <strong className="ml-1">{selectedApp.opportunity}</strong>
              </Badge>
            )}
            
            <Badge className={`text-sm px-4 py-1.5 ${
                selectedApp.status === 'accepted' ? 'bg-[#043E52]/10 text-[#043E52] border-none shadow-none' :
                selectedApp.status === 'rejected' ? 'bg-red-50 text-red-600 border-none shadow-none' :
                selectedApp.status === 'pending_verification' ? 'bg-amber-100 text-amber-700 border-none shadow-none' :
                'bg-[#E16A3D]/10 text-[#E16A3D] border-none shadow-none'
              }`}
            >
              {String(selectedApp.status).toUpperCase().replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl border border-slate-100">
          <div className="h-32 bg-[#043E52]"></div>
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
                  <a href={vol.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#043E52] hover:underline">
                    <Globe size={16} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {selectedApp.status === 'pending_verification' && (
              <Card className="border-amber-200 shadow-md rounded-2xl bg-amber-50/30 overflow-hidden">
                <div className="bg-amber-100 px-6 py-3 border-b border-amber-200 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-700" />
                  <h3 className="font-bold text-amber-800">Verification Request Submitted</h3>
                </div>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Volunteer's Completion Note</p>
                    <p className="bg-white p-4 rounded-xl border border-amber-100 text-slate-700 italic">
                      "{selectedApp.proofNote || "No completion note provided."}"
                    </p>
                  </div>
                  {selectedApp.proofLink && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Attached Deliverables</p>
                      <a href={selectedApp.proofLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white p-4 rounded-xl border border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition-colors">
                        <Globe className="h-5 w-5" /> View Submitted Work Link
                      </a>
                    </div>
                  )}
                  <div className="pt-4 border-t border-amber-200">
                    <Button onClick={() => handleVerifyTask(selectedApp)} disabled={isVerifying} className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg shadow-lg">
                      <CheckCircle className="mr-2 h-5 w-5" /> VERIFY COMPLETION & RELEASE POINTS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={`shadow-md rounded-2xl ${isCoreCrewApp ? 'border-orange-200 bg-orange-50/30' : 'border-[#043E52]/20 bg-[#043E52]/5'}`}>
              <CardHeader className={`pb-2 border-b ${isCoreCrewApp ? 'border-orange-100/50' : 'border-[#043E52]/10'}`}>
                <CardTitle className="text-lg text-[#043E52] flex items-center gap-2">
                  <Mail className={`h-5 w-5 ${isCoreCrewApp ? 'text-[#E16A3D]' : 'text-[#043E52]'}`} /> 
                  {isCoreCrewApp ? 'Membership Application Letter' : 'Original Cover Letter'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className={`bg-white p-5 rounded-xl border shadow-sm ${isCoreCrewApp ? 'border-orange-100' : 'border-[#043E52]/20'}`}>
                  <p className="text-slate-700 italic text-sm leading-relaxed">"{selectedApp.coverLetter}"</p>
                </div>
                <div className="flex gap-4 pt-2">
                  {selectedApp.status === 'pending' ? (
                    <>
                      <Button onClick={() => handleUpdateStatus(selectedApp, 'accepted')} className="flex-1 h-12 bg-[#043E52] hover:bg-[#033040] text-white text-base font-bold shadow-md"><CheckCircle className="mr-2 h-5 w-5" /> Accept Application</Button>
                      <Button onClick={() => handleUpdateStatus(selectedApp, 'rejected')} variant="outline" className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 text-base font-bold"><X className="mr-2 h-5 w-5" /> Decline</Button>
                    </>
                  ) : (
                    <div className="w-full text-center text-slate-500 font-medium py-3 border border-slate-200 rounded-xl bg-white">This application's status is currently: <strong className="uppercase text-[#043E52]">{selectedApp.status.replace('_', ' ')}</strong>.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-lg text-[#043E52] flex items-center gap-2"><User className="h-5 w-5 text-[#043E52]" /> About Volunteer</CardTitle></CardHeader>
              <CardContent><p className="text-slate-600 text-sm leading-relaxed">{vol.bio}</p></CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-4"><CardTitle className="text-lg text-[#043E52] flex items-center gap-2"><Briefcase className="h-5 w-5 text-[#043E52]" /> Volunteer Experience</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {vol.experiences?.length > 0 ? vol.experiences.map((exp: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200"><Briefcase size={20} /></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{String(exp?.title || '')}</h4>
                      <p className="text-xs font-bold text-[#043E52] mb-1">{String(exp?.organization || '')}</p>
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
          </div>

          <div className="space-y-6">
            <Card className="border-red-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="bg-[#e63946] text-white px-5 py-3 flex items-center gap-2 font-bold text-sm"><AlertCircle size={18} /> Emergency Details</div>
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
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base text-[#043E52] flex items-center gap-2"><CheckCircle className="h-5 w-5 text-[#043E52]" /> Verified Skills</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {vol.skills?.length > 0 ? vol.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-[#043E52]/20 text-[#043E52] bg-white text-xs px-2 py-1">{String(skill)}</Badge>
                  )) : <span className="text-xs text-slate-400">No skills listed</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Applications list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] text-2xl font-bold">Applications & Verifications</h1>
          <p className="text-slate-500 mt-1">Review volunteer applications and verify completed work to award points.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50"><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-[#E16A3D] shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500 uppercase tracking-widest">New Applicants</p><p className="text-[#E16A3D] text-3xl font-black mt-2">{pendingCount}</p></div><div className="bg-[#E16A3D]/10 p-3 rounded-xl"><Clock className="h-6 w-6 text-[#E16A3D]" /></div></div></CardContent></Card>
        
        <Card className="border-t-4 border-t-amber-500 shadow-md bg-amber-50/30"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-amber-700 uppercase tracking-widest">Verify Work</p><p className="text-amber-600 text-3xl font-black mt-2">{verificationsCount}</p></div><div className="bg-amber-100 p-3 rounded-xl"><Activity className="h-6 w-6 text-amber-600 animate-pulse" /></div></div></CardContent></Card>
        
        <Card className="border-t-4 border-t-[#043E52] shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Roster</p><p className="text-[#043E52] text-3xl font-black mt-2">{acceptedCount}</p></div><div className="bg-[#043E52]/10 p-3 rounded-xl"><CheckCircle className="h-6 w-6 text-[#043E52]" /></div></div></CardContent></Card>
        <Card className="border-t-4 border-t-slate-800 shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Rejected</p><p className="text-slate-800 text-3xl font-black mt-2">{rejectedCount}</p></div><div className="bg-slate-100 p-3 rounded-xl"><X className="h-6 w-6 text-slate-600" /></div></div></CardContent></Card>
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

      <Tabs defaultValue="verifications" className="w-full">
        <TabsList className="bg-slate-100 text-slate-500 p-1 rounded-xl h-12">
          
          <TabsTrigger value="verifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm font-bold flex gap-2">
            Action Required 
            {verificationsCount > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{verificationsCount}</span>}
          </TabsTrigger>

          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E16A3D] data-[state=active]:shadow-sm font-bold flex gap-2">
            New Apps
            {pendingCount > 0 && <span className="bg-[#E16A3D] text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </TabsTrigger>
          
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm font-bold">Active Roster</TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm font-bold">Rejected</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm font-bold">All History</TabsTrigger>
        </TabsList>

        {['verifications', 'pending', 'accepted', 'rejected', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="space-y-4">
              
              {/* Verifications tab */}
              {tab === 'verifications' && verificationsList.length === 0 && <p className="text-center text-slate-500 italic p-10 bg-white rounded-xl border border-slate-200">No verifications pending at this time.</p>}
              {tab === 'verifications' && verificationsList.map((app) => (
                <Card key={app.id} className="border-2 border-amber-200 bg-amber-50/10 shadow-sm hover:border-amber-400 transition-all">
                  <div className={`px-6 py-2 border-b flex items-center gap-2 font-bold text-sm ${app.type === 'crisis' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    {app.type === 'crisis' ? <AlertCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    {app.type === 'crisis' ? 'Emergency Deployment Verification' : 'Standard Mission Verification'}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <Avatar className="w-16 h-16 border-2 border-slate-100">
                        <AvatarImage src={app.volunteer?.avatar} />
                        <AvatarFallback className="bg-[#043E52] text-white font-bold text-xl">{String(app.volunteer?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-[#043E52]">{app.volunteer?.name}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Mission: <span className="text-[#043E52]">{app.opportunity}</span></p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1">NEEDS VERIFICATION</Badge>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Briefcase className="h-3 w-3"/> Volunteer's Note</p>
                           <p className="text-sm text-slate-700 italic">"{app.proofNote || 'No note provided. Please verify attendance internally.'}"</p>
                           
                           {app.proofLink && (
                             <a href={app.proofLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline">
                               <Globe className="h-4 w-4" /> View Submitted Work Deliverable
                             </a>
                           )}
                        </div>

                        <div className="flex gap-2 pt-2 mt-4 border-t border-amber-100">
                           <Button onClick={() => handleVerifyTask(app)} disabled={isVerifying} className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md">
                             <CheckCircle className="mr-2 h-4 w-4" /> Verify & Release Points
                           </Button>
                           <Button onClick={() => setSelectedApp(app)} variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold">
                             <Eye className="mr-2 h-4 w-4" /> View Volunteer Details
                           </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Standard applications layout (pending/accepted/rejected/all) */}
              {tab !== 'verifications' && filteredApps.filter(a => tab === 'all' ? true : a.status === tab).length === 0 && <p className="text-center text-slate-500 italic p-10 bg-white rounded-xl border border-slate-200">No applications in this category.</p>}
              {tab !== 'verifications' && filteredApps.filter(a => tab === 'all' ? true : a.status === tab).map((app) => (
                <Card key={app.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-[#E16A3D]/30">
                  <CardContent className="p-6">
                    <div className="flex gap-6 flex-col md:flex-row">
                      <Avatar className="w-16 h-16 border-2 border-slate-100 shrink-0">
                        <AvatarImage src={app.volunteer?.avatar} />
                        <AvatarFallback className="bg-[#043E52] text-white font-bold text-xl">{String(app.volunteer?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-[#043E52]">{app.volunteer?.name}</h3>
                            {app.oppId === 'core_crew' ? (
                              <p className="text-sm text-[#E16A3D] font-bold flex items-center gap-1.5 mt-1"><Shield className="h-4 w-4" /> Core Crew Membership</p>
                            ) : (
                              <p className="text-sm text-[#043E52] font-medium mt-1">Applied for: {app.opportunity}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">{app.appliedDate}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              app.status === 'accepted' ? 'bg-[#043E52]/10 text-[#043E52] border-[#043E52]/20' :
                              app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20'
                            }
                          >
                            {String(app.status || 'pending').toUpperCase()}
                          </Badge>
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
                              <Badge key={index} variant="secondary" className="bg-slate-100 text-[#043E52] border border-slate-200">{String(skill)}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-2 font-medium">Cover Letter Summary</p>
                          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-lg italic line-clamp-2">"{app.coverLetter}"</p>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                          {app.status === 'pending' && (
                            <>
                              <Button onClick={() => handleUpdateStatus(app, 'accepted')} className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm"><CheckCircle className="mr-2 h-4 w-4" /> Accept</Button>
                              <Button onClick={() => handleUpdateStatus(app, 'rejected')} variant="outline" className="border-slate-200 text-[#E16A3D] hover:text-[#c2562d] hover:bg-[#E16A3D]/5 hover:border-[#E16A3D]/20"><X className="mr-2 h-4 w-4" /> Decline</Button>
                            </>
                          )}
                          <Button onClick={() => setSelectedApp(app)} variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50"><Eye className="mr-2 h-4 w-4" /> View Profile</Button>
                        </div>
                      </div>
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