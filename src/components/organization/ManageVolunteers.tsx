import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, where, doc, getDoc, addDoc, serverTimestamp, getDocs
} from "firebase/firestore";
import { auth, db } from '../../lib/firebase';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { 
  Search, Mail, Phone, Star, Clock, Award,
  MessageSquare, MoreVertical, Filter, Users, X, Send, 
  MapPin, Briefcase, GraduationCap, AlertTriangle, Target,
  ArrowLeft, Shield
} from 'lucide-react';

export function ManageVolunteers() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [orgMissions, setOrgMissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & view states
  const [viewProfileData, setViewProfileData] = useState<any | null>(null);
  
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<any | null>(null);
  const [messageText, setMessageText] = useState("");
  
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<any | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  
  const [isSending, setIsSending] = useState(false);

  // Fetch the core crew roster
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const qApps = query(collection(db, "applications"), where("orgId", "==", user.uid), where("status", "==", "accepted"));
        const unsubscribeApps = onSnapshot(qApps, async (snapshot) => {

          // Only accepted applications tied to the "core_crew" opportunity count toward the roster
          const coreCrewIds = new Set<string>();
          
          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.volunteerId && data.oppId === 'core_crew') {
                coreCrewIds.add(data.volunteerId);
            }
          });

          const volunteerPromises = Array.from(coreCrewIds).map(async (vId) => {
            const userDoc = await getDoc(doc(db, "users", vId));
            if (userDoc.exists()) {
              const uData = userDoc.data();
              return {
                id: vId,
                ...uData, 
                name: uData.name || 'Unknown Volunteer',
                email: uData.email || 'No email provided',
                phone: uData.phone || 'No phone provided',
                avatar: uData.photoUrl || uData.avatarUrl || '',
                status: 'active',
                isCoreCrew: true,
                rating: Number(uData.rating || 5.0),
                totalHours: Number(uData.totalHours || 0),
                completedProjects: Number(uData.completedProjects || 0),
                skills: Array.isArray(uData.skills) ? uData.skills : [],
                experiences: Array.isArray(uData.experiences) ? uData.experiences : [],
                educations: Array.isArray(uData.educations) ? uData.educations : [],
                crisisInfo: uData.crisisInfo || {},
                joinedDate: 'Recently',
                lastActive: 'Recently',
                reliability: Number(uData.reliability || 100)
              };
            }
            return null;
          });

          const resolvedVolunteers = (await Promise.all(volunteerPromises)).filter(v => v !== null);
          setVolunteers(resolvedVolunteers);
          setLoading(false);
        });

        const qMissions = query(collection(db, "opportunities"), where("orgId", "==", user.uid));
        const missionSnap = await getDocs(qMissions);
        setOrgMissions(missionSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        return () => unsubscribeApps();
      } else {
        setVolunteers([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Message handlers
  const handleSendMessage = async () => {
    if (!messageText.trim()) return alert("Message cannot be empty.");
    setIsSending(true);
    
    try {
      const currentUser = auth.currentUser;
      const orgDoc = await getDoc(doc(db, "organizations", currentUser!.uid));
      const orgData = orgDoc.exists() ? orgDoc.data() : {};
      const orgName = orgData.name || "Organization Command";
      
      const fallbackLogo = `https://api.dicebear.com/7.x/shapes/svg?seed=${orgName}&backgroundColor=043E52`;
      const finalAvatar = orgData.photoUrl || orgData.logoUrl || fallbackLogo;

      if (messageTarget) {
        await addDoc(collection(db, "messages"), {
          missionId: `dm_${currentUser!.uid}_${messageTarget.id}`,
          text: messageText,
          senderId: currentUser!.uid,
          senderName: orgName,
          senderRole: "organization",
          avatar: finalAvatar,
          timestamp: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "messages"), {
          missionId: `group_${currentUser!.uid}`, 
          text: messageText,
          senderId: currentUser!.uid,
          senderName: orgName,
          senderRole: "organization",
          avatar: finalAvatar,
          timestamp: serverTimestamp()
        });
      }

      setMessageText("");
      setMessageModalOpen(false);
      setMessageTarget(null);
      alert(messageTarget ? "Direct message sent!" : "Group message broadcasted to all team members!");
    } catch (e) {
      console.error(e);
      alert("Failed to send message.");
    }
    setIsSending(false);
  };

  const handleSendInvite = async () => {
    if (!selectedMissionId) return alert("Please select a mission.");
    setIsSending(true);

    try {
      const currentUser = auth.currentUser;
      const orgDoc = await getDoc(doc(db, "organizations", currentUser!.uid));
      const orgName = orgDoc.exists() ? orgDoc.data().name : "Organization";
      
      const mission = orgMissions.find(m => m.id === selectedMissionId);

      await addDoc(collection(db, "notifications"), {
        userId: inviteTarget.id,
        orgId: currentUser!.uid,
        title: 'Mission Invitation! 🎯',
        message: `${orgName} has invited you to join their mission: "${mission.title}". Check your explore feed!`,
        type: 'application',
        read: false,
        createdAt: serverTimestamp(),
        link: '/explore'
      });

      setInviteModalOpen(false);
      setInviteTarget(null);
      setSelectedMissionId("");
      alert("Invitation sent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to send invite.");
    }
    setIsSending(false);
  };

  // Filtering
  const filteredVolunteers = volunteers.filter(v => {
    const search = searchTerm.toLowerCase();
    return (v.name.toLowerCase().includes(search) || v.email.toLowerCase().includes(search) || v.skills.some((s: string) => s.toLowerCase().includes(search)));
  });

  const totalVolunteers = volunteers.length;
  const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
  const avgRating = totalVolunteers > 0 ? (volunteers.reduce((sum, v) => sum + v.rating, 0) / totalVolunteers).toFixed(1) : "0.0";
  const totalNetworkHours = volunteers.reduce((sum, v) => sum + v.totalHours, 0);


  // Full-page profile view
  if (viewProfileData) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-right-4 duration-300">
        
        <Button 
          variant="ghost" 
          onClick={() => setViewProfileData(null)} 
          className="text-slate-500 hover:text-role-org hover:bg-slate-100 -ml-2 font-bold mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Core Crew
        </Button>

        <Card className="w-full shadow-sm border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
           <div className="flex-1 overflow-y-auto">
             <div className="bg-white border-b border-slate-200 shadow-sm">
               <div className="h-32 w-full bg-gradient-to-r from-role-org to-role-accent-teal"></div>
               <div className="px-8 pb-8 relative -mt-16">
                 <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
                   <Avatar className="w-28 h-28 border-4 border-white shadow-md bg-white shrink-0">
                     <AvatarImage src={viewProfileData.avatar} className="object-cover" />
                     <AvatarFallback className="bg-slate-100 text-role-org text-3xl font-black">{String(viewProfileData.name).charAt(0).toUpperCase()}</AvatarFallback>
                   </Avatar>
                   <div className="flex-1 pb-2">
                     <div className="flex items-center gap-3">
                       <h1 className="text-2xl font-bold text-gray-900">{viewProfileData.name}</h1>
                       <Badge className="bg-role-org/10 text-role-org border-none font-bold text-[10px] flex items-center gap-1">
                          <Shield className="h-3 w-3" /> CORE CREW
                       </Badge>
                     </div>
                     <div className="flex flex-wrap items-center gap-5 mt-2 text-sm text-gray-500 font-medium">
                       <span className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400" /> {viewProfileData.city || viewProfileData.location || 'Location Not Set'}</span>
                       <span className="flex items-center gap-1.5"><Mail size={16} className="text-slate-400" /> {viewProfileData.email}</span>
                       <span className="flex items-center gap-1.5"><Phone size={16} className="text-slate-400" /> {viewProfileData.phone}</span>
                     </div>
                   </div>
                   <div className="flex gap-3 pb-2">
                      <Button onClick={() => { setMessageTarget(viewProfileData); setMessageModalOpen(true); }} variant="outline" className="border-slate-200 text-slate-700 hover:text-role-org font-bold h-10 px-4">
                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                      </Button>
                      <Button onClick={() => { setInviteTarget(viewProfileData); setInviteModalOpen(true); }} className="bg-role-org hover:bg-role-org-dark text-white font-bold shadow-sm h-10 px-4">
                        <Target className="mr-2 h-4 w-4" /> Invite to Mission
                      </Button>
                   </div>
                 </div>
               </div>
             </div>

             <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Column */}
               <div className="lg:col-span-2 space-y-6">
                 <Card className="border-slate-200 shadow-sm rounded-xl">
                   <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base font-bold uppercase tracking-tight text-slate-900">About</CardTitle></CardHeader>
                   <CardContent className="pt-4"><p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{viewProfileData.bio || 'No bio provided.'}</p></CardContent>
                 </Card>

                 <Card className="border-slate-200 shadow-sm rounded-xl">
                   <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2"><Briefcase className="h-5 w-5 text-role-accent-teal" /> Experience</CardTitle></CardHeader>
                   <CardContent className="pt-4 space-y-5">
                     {viewProfileData.experiences?.length > 0 ? viewProfileData.experiences.map((exp: any, i: number) => (
                       <div key={i} className="border-l-2 border-slate-200 pl-4 pb-4 last:pb-0">
                         <h4 className="font-bold text-slate-800 text-sm">{exp.title}</h4>
                         <p className="text-role-accent-teal text-xs font-bold mt-0.5">{exp.organization}</p>
                         <p className="text-[11px] text-slate-400 mt-1">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                         <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
                       </div>
                     )) : <p className="text-sm text-slate-500 italic">No experience listed.</p>}
                   </CardContent>
                 </Card>

                 <Card className="border-slate-200 shadow-sm rounded-xl">
                   <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-role-accent-teal" /> Education</CardTitle></CardHeader>
                   <CardContent className="pt-4 space-y-4">
                     {viewProfileData.educations?.length > 0 ? viewProfileData.educations.map((edu: any, i: number) => (
                       <div key={i} className="border-l-2 border-slate-200 pl-4 pb-4 last:pb-0">
                         <h4 className="font-bold text-slate-800 text-sm">{edu.level} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</h4>
                         <p className="text-slate-600 text-xs font-medium mt-0.5">{edu.institution}</p>
                         <p className="text-[11px] text-slate-400 mt-1">Class of {edu.gradYear}</p>
                       </div>
                     )) : <p className="text-sm text-slate-500 italic">No education listed.</p>}
                   </CardContent>
                 </Card>
               </div>

               {/* Right Column */}
               <div className="space-y-6">
                 
                 {/* Stats Box */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <Clock className="h-5 w-5 text-role-accent-teal mx-auto mb-2" />
                      <div className="text-2xl font-black text-role-org">{viewProfileData.totalHours}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hours Logged</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <Award className="h-5 w-5 text-role-accent-teal mx-auto mb-2" />
                      <div className="text-2xl font-black text-role-org">{viewProfileData.completedProjects}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Missions</div>
                    </div>
                 </div>

                 <Card className="border-red-200 shadow-sm rounded-xl overflow-hidden">
                   <div className="bg-red-600 text-white p-3 flex items-center gap-2 font-bold text-xs uppercase tracking-wider"><AlertTriangle className="h-4 w-4" /> Emergency Profile</div>
                   <CardContent className="p-5 space-y-4 bg-red-50/30">
                     <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Valid Driver</span><span className="font-bold">{viewProfileData.crisisInfo?.drivingLicense ? 'Yes' : 'No'}</span></div>
                     <Separator className="bg-red-100"/>
                     <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Blood Type</span><span className="font-bold text-red-600 bg-red-100 px-2 rounded text-xs py-0.5">{viewProfileData.crisisInfo?.bloodType || 'N/A'}</span></div>
                   </CardContent>
                 </Card>

                 <Card className="border-slate-200 shadow-sm rounded-xl">
                   <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base font-bold uppercase tracking-tight text-slate-900">Verified Skills</CardTitle></CardHeader>
                   <CardContent className="pt-4">
                     <div className="flex flex-wrap gap-2">
                       {viewProfileData.skills?.length > 0 ? viewProfileData.skills.map((skill: string, i: number) => (
                         <Badge key={i} variant="secondary" className="bg-slate-50 text-role-org border border-slate-200 text-[10px] font-bold uppercase px-3 py-1 tracking-wider">{skill}</Badge>
                       )) : <p className="text-sm text-slate-400">No skills added.</p>}
                     </div>
                   </CardContent>
                 </Card>

                 <Card className="border-slate-200 shadow-sm rounded-xl">
                   <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="text-base font-bold uppercase tracking-tight text-slate-900">Availability</CardTitle></CardHeader>
                   <CardContent className="pt-4 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500 font-medium text-xs">Format</span><span className="font-bold text-slate-800 text-xs">{viewProfileData.availability?.format || 'Flexible'}</span></div>
                      <Separator className="bg-slate-100" />
                      <div className="flex justify-between"><span className="text-slate-500 font-medium text-xs">Hours/Week</span><span className="font-bold text-slate-800 text-xs">{viewProfileData.availability?.hours || 'Not set'}</span></div>
                      <Separator className="bg-slate-100" />
                      <div className="flex gap-2 pt-1">
                        <Badge variant="outline" className={viewProfileData.availability?.weekdays ? 'border-role-accent-teal text-role-accent-teal bg-teal-50 text-[10px] uppercase font-bold' : 'border-slate-200 text-slate-400 text-[10px] uppercase font-bold'}>Weekdays</Badge>
                        <Badge variant="outline" className={viewProfileData.availability?.weekends ? 'border-role-accent-teal text-role-accent-teal bg-teal-50 text-[10px] uppercase font-bold' : 'border-slate-200 text-slate-400 text-[10px] uppercase font-bold'}>Weekends</Badge>
                      </div>
                   </CardContent>
                 </Card>
               </div>
             </div>
           </div>
        </Card>
      </div>
    );
  }

  // Main roster list view
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Manage Core Crew</h1>
          <p className="text-slate-500 mt-1 text-sm font-semibold">View and manage your official core crew members</p>
        </div>
        <Button 
          onClick={() => { setMessageTarget(null); setMessageModalOpen(true); }}
          className="bg-role-org hover:bg-role-org-dark text-white shadow-md font-bold h-10 px-5 text-xs uppercase tracking-wider"
        >
          <Users className="mr-2 h-4 w-4" />
          Message All (Group)
        </Button>
      </div>

      {/* Dynamic Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-role-org shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Crew</p><p className="text-role-org text-2xl font-black mt-1">{totalVolunteers}</p></div><div className="bg-role-org/10 p-3 rounded-xl"><Users className="h-5 w-5 text-role-org" /></div></div></CardContent></Card>
        <Card className="border-t-4 border-t-role-accent-teal shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Status</p><p className="text-role-accent-teal text-2xl font-black mt-1">{activeVolunteers}</p></div><div className="bg-role-accent-teal/10 p-3 rounded-xl"><div className="h-4 w-4 bg-role-accent-teal rounded-full shadow-sm animate-pulse" /></div></div></CardContent></Card>
        <Card className="border-t-4 border-t-role-org shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Rating</p><p className="text-role-org text-2xl font-black mt-1">{avgRating}</p></div><div className="bg-role-org/10 p-3 rounded-xl"><Star className="h-5 w-5 text-role-org fill-role-org" /></div></div></CardContent></Card>
        <Card className="border-t-4 border-t-role-accent-teal shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Crew Hours</p><p className="text-role-accent-teal text-2xl font-black mt-1">{totalNetworkHours}</p></div><div className="bg-teal-50 p-3 rounded-xl"><Clock className="h-5 w-5 text-role-accent-teal" /></div></div></CardContent></Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search crew by name, email, or skills..." className="pl-10 h-11 border-slate-200 focus:border-role-org focus:ring-role-org text-sm rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-role-org hover:bg-slate-50 h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center py-10 font-bold text-slate-500 animate-pulse text-sm">Loading Core Crew...</div>}
      
      {!loading && filteredVolunteers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
           <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
           <h3 className="text-base font-bold text-slate-600">No core crew members found</h3>
           <p className="text-slate-500 text-sm mt-1">Accept Core Crew applications to build your team.</p>
        </div>
      )}

      {/* Volunteers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredVolunteers.map((volunteer) => (
          <Card key={volunteer.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-role-accent-teal/50">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row gap-5">
                
                <Avatar className="w-14 h-14 border border-slate-200 shadow-sm">
                  <AvatarImage src={volunteer.avatar} className="object-cover" />
                  <AvatarFallback className="bg-role-org text-white font-bold text-lg">{String(volunteer.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-slate-900 font-bold text-base">{volunteer.name}</h3>
                        <Badge className="bg-role-org/10 text-role-org hover:bg-role-org/20 border-none font-bold text-[10px] tracking-wider flex items-center gap-1">
                          <Shield className="h-3 w-3" /> CORE CREW
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /><span>{volunteer.email}</span></div>
                        <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /><span>{volunteer.phone}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-3 border-y border-slate-100">
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rating</p><div className="flex items-center gap-1.5 mt-0.5"><Star className="h-3.5 w-3.5 fill-role-org text-role-org" /><span className="text-sm font-bold text-slate-700">{volunteer.rating}</span></div></div>
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hours</p><div className="flex items-center gap-1.5 mt-0.5"><Clock className="h-3.5 w-3.5 text-role-accent-teal" /><span className="text-sm font-bold text-slate-700">{volunteer.totalHours}h</span></div></div>
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Projects</p><div className="flex items-center gap-1.5 mt-0.5"><Award className="h-3.5 w-3.5 text-role-org" /><span className="text-sm font-bold text-slate-700">{volunteer.completedProjects}</span></div></div>
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reliability</p><p className="text-sm font-bold text-role-accent-teal mt-0.5">{volunteer.reliability}%</p></div>
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Active</p><p className="text-xs font-semibold text-slate-600 mt-1">{volunteer.lastActive}</p></div>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Verified Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {volunteer.skills.length > 0 ? volunteer.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-slate-50 text-role-org border border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">{skill}</Badge>
                      )) : <span className="text-xs text-slate-400 italic">No skills listed.</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button onClick={() => setViewProfileData(volunteer)} size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:text-role-org hover:bg-slate-50 font-bold px-4 h-8 text-[10px] uppercase tracking-wider">
                      View Profile
                    </Button>
                    <Button onClick={() => { setMessageTarget(volunteer); setMessageModalOpen(true); }} size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:text-role-org hover:bg-slate-50 font-bold px-4 h-8 text-[10px] uppercase tracking-wider">
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Direct Message
                    </Button>
                    <Button onClick={() => { setInviteTarget(volunteer); setInviteModalOpen(true); }} size="sm" variant="outline" className="border-slate-200 text-role-accent-teal hover:bg-teal-50 font-bold px-4 h-8 text-[10px] uppercase tracking-wider">
                      <Target className="mr-1.5 h-3.5 w-3.5" /> Invite to Mission
                    </Button>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message composer modal */}
      {messageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <Card className="w-full max-w-lg shadow-2xl border-none rounded-2xl overflow-hidden">
             <div className="bg-role-org p-5 flex items-center justify-between text-white">
               <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-2 rounded-full"><Send className="h-4 w-4" /></div>
                 <div>
                   <h3 className="font-bold text-base uppercase tracking-tight leading-none">
                     {messageTarget ? "Direct Message" : "Team Broadcast"}
                   </h3>
                   <p className="text-teal-100 text-[10px] font-semibold mt-1 uppercase tracking-wider">
                     To: {messageTarget ? messageTarget.name : 'All Core Crew'}
                   </p>
                 </div>
               </div>
               <button onClick={() => setMessageModalOpen(false)} className="text-teal-100 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full"><X size={18} /></button>
             </div>
             <CardContent className="p-6 space-y-4 bg-slate-50">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Message Content</Label>
                  <Textarea 
                    placeholder="Type your message here..." 
                    className="min-h-[120px] resize-none border-slate-200 focus:border-role-accent-teal rounded-xl bg-white text-sm"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setMessageModalOpen(false)} className="font-bold text-slate-600 text-xs">Cancel</Button>
                  <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()} className="bg-role-accent-teal hover:bg-role-accent-teal/80 text-white font-bold shadow-md px-6 h-10 text-xs uppercase tracking-wider">
                    {isSending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
             </CardContent>
          </Card>
        </div>
      )}

      {/* Invite to mission modal */}
      {inviteModalOpen && inviteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <Card className="w-full max-w-lg shadow-2xl border-none rounded-2xl overflow-hidden">
             <div className="bg-role-accent-teal p-5 flex items-center justify-between text-white">
               <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-2 rounded-full"><Target className="h-4 w-4" /></div>
                 <div>
                   <h3 className="font-bold text-base uppercase tracking-tight leading-none">Send Mission Invite</h3>
                   <p className="text-teal-100 text-[10px] font-semibold mt-1 uppercase tracking-wider">Inviting: {inviteTarget.name}</p>
                 </div>
               </div>
               <button onClick={() => setInviteModalOpen(false)} className="text-teal-100 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full"><X size={18} /></button>
             </div>
             <CardContent className="p-6 space-y-5 bg-slate-50">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Select an Active Mission</Label>
                  {orgMissions.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
                      You don't have any active missions. Go to "Opportunities" to create one first!
                    </div>
                  ) : (
                    <select 
                      className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-role-accent-teal outline-none"
                      value={selectedMissionId}
                      onChange={(e) => setSelectedMissionId(e.target.value)}
                    >
                      <option value="" disabled>-- Choose a mission --</option>
                      {orgMissions.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setInviteModalOpen(false)} className="font-bold text-slate-600 text-xs">Cancel</Button>
                  <Button onClick={handleSendInvite} disabled={isSending || !selectedMissionId} className="bg-role-org hover:bg-role-org-dark text-white font-bold shadow-md px-6 h-10 text-xs uppercase tracking-wider">
                    {isSending ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}