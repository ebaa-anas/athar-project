import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where,
  doc, addDoc, serverTimestamp, getDocs 
} from "firebase/firestore";

import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  MapPin, Users, Star, Search, ShieldCheck, Mail, Globe, 
  Briefcase, HeartHandshake, CheckCircle2, X, Target, Phone, Clock, Calendar,
  Timer, Activity, Users2, Scale, FileText, ShieldAlert, Lock
} from 'lucide-react';

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

export function Organizations() {
  const { user } = useUserProfile();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals State
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [showJoinModal, setShowJoinModal] = useState<any | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // --- 🔥 GLOBAL VERIFICATION CHECK 🔥 ---
  const isVerified = user?.verificationStatus === 'verified';

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const qOrgs = query(collection(db, "organizations"));
    const unsubOrgs = onSnapshot(qOrgs, (snapshot) => {
      setOrganizations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchApps = async () => {
      if (!user) return;
      const qApps = query(collection(db, "applications"), where("volunteerId", "==", user.uid));
      const snap = await getDocs(qApps);
      setMyApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    
    fetchApps();
    return () => unsubOrgs();
  }, [user]);

  // --- 2. SUBMIT APPLICATION ---
  const handleJoinSubmit = async () => {
    if (!user) return alert("Must be logged in.");
    if (!coverLetter.trim()) return alert("Please provide a brief motivation message.");
    
    setIsApplying(true);
    try {
      const org = showJoinModal;
      await addDoc(collection(db, "applications"), {
        oppId: "core_crew", 
        oppTitle: "Core Volunteer Crew",
        orgId: org.id,
        orgName: org.name,
        volunteerId: user.uid,
        volunteerName: user.name || "Volunteer",
        coverLetter: coverLetter,
        status: "pending",
        type: "normal",
        appliedAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        orgId: org.id,
        title: 'New Crew Member Application!',
        message: `${user.name || 'A volunteer'} wants to join your Core Volunteer Crew.`,
        type: 'volunteer',
        read: false,
        createdAt: serverTimestamp(),
        link: '/applications'
      });

      setMyApplications(prev => [...prev, { orgId: org.id, oppId: 'core_crew', status: 'pending' }]);
      setShowJoinModal(null);
      setCoverLetter("");
      alert("Application sent! The organization will review your profile.");
    } catch (e) {
      console.error(e);
      alert("Failed to submit application.");
    }
    setIsApplying(false);
  };

  // --- 3. FILTERING ---
  const filteredOrgs = organizations.filter(org => 
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    org.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myAcceptedOrgIds = myApplications.filter(a => a.status === 'accepted').map(a => a.orgId);
  const myOrgs = organizations.filter(o => myAcceptedOrgIds.includes(o.id));
  const myPendingCrewOrgIds = myApplications.filter(a => a.status === 'pending' && a.oppId === 'core_crew').map(a => a.orgId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 text-2xl font-bold">Organizations</h1>
          <p className="text-gray-500 mt-1">Discover and connect with non-profit organizations</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search organizations..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 🔥 THE GLOBAL SECURITY BANNER 🔥 */}
      {!isVerified && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="text-red-800 font-bold text-sm">Identity Verification Required</h4>
              <p className="text-red-600 text-xs font-medium">You must verify your identity in your profile before applying to join an organization's core crew.</p>
            </div>
          </div>
        </div>
      )}

      {/* My Organizations */}
      {myOrgs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Organizations</CardTitle>
            <p className="text-sm text-slate-500">Organizations you're currently volunteering with</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-gray-200">
                      <AvatarImage src={org.photoUrl || org.logoUrl || org.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-[#006D5B]/10 text-[#006D5B] font-bold">
                        {String(org.name || 'O').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-gray-900 font-bold">{org.name}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-[#006D5B]" /> Core Volunteer
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrg(org)}>View Hub</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Organizations */}
      <div>
        <h2 className="text-gray-900 mb-4 font-bold text-xl">Explore Organizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => {
            const isPending = myPendingCrewOrgIds.includes(org.id);
            const isAccepted = myAcceptedOrgIds.includes(org.id);

            return (
              <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full bg-white relative">
                
                {/* Fixed Card Banner with dynamic cover image! */}
                <div className="h-20 bg-[#006D5B] w-full border-b border-slate-200 relative overflow-hidden">
                  {org.coverUrl ? (
                    <img src={org.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  )}
                  {org.verified && (
                    <Badge className="absolute top-3 right-3 bg-white text-[#006D5B] border border-[#006D5B] shadow-sm z-10 flex items-center gap-1 px-2 py-0.5">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                
                {/* Pop-out Avatar */}
                <div className="px-5 relative -mt-10 mb-2 z-10">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-sm bg-white rounded-xl">
                    <AvatarImage src={org.photoUrl || org.logoUrl || org.avatarUrl} className="object-cover rounded-xl" />
                    <AvatarFallback className="bg-[#006D5B]/10 text-[#006D5B] text-xl font-black rounded-xl">
                      {String(org.name || 'O').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <CardHeader className="pb-2 pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">{org.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0 bg-white">{org.sector || org.category || 'NGO'}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1.5">
                    {org.tagline || org.mission || org.description || 'Dedicated to creating positive community impact.'}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4 flex flex-col flex-1 pb-5">
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{org.location || org.city || 'Global'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{org.stats?.volunteers || org.volunteers || 0} volunteers • {org.stats?.projects || org.projects || 0} projects</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{org.rating || '5.0'} rating</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-2">
                    {isAccepted ? (
                      <Button disabled className="flex-1 bg-[#006D5B]/10 text-[#006D5B] font-bold opacity-100 border border-[#006D5B]/20">Joined</Button>
                    ) : isPending ? (
                      <Button disabled className="flex-1 bg-gray-100 text-gray-500 font-bold opacity-100">Pending</Button>
                    ) : !isVerified ? (
                      // 🔥 IDENTITY LOCK ON CARD 🔥
                      <Button disabled variant="outline" className="flex-1 border-slate-200 bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <Lock className="mr-1.5 h-3.5 w-3.5" /> ID Required
                      </Button>
                    ) : (
                      <Button onClick={() => setShowJoinModal(org)} className="flex-1 bg-[#006D5B] hover:bg-[#005244] font-bold text-white">Join</Button>
                    )}
                    <Button onClick={() => setSelectedOrg(org)} variant="outline" className="flex-1 font-bold border-gray-200 text-[#006D5B]">View</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- JOIN CREW MODAL --- */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* 🔥 Modal Header Color Fixed 🔥 */}
            <div className="bg-[#006D5B] p-5 flex items-center justify-between text-white shrink-0">
              <div>
                <Badge className="bg-white/20 text-white border-none mb-1 text-[10px] uppercase">Core Crew Application</Badge>
                <h3 className="font-bold text-lg leading-none">Join {showJoinModal.name}</h3>
              </div>
              <button onClick={() => setShowJoinModal(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <label className="block text-sm font-bold text-gray-700 mb-2">Why do you want to join this organization?</label>
              <p className="text-xs text-gray-500 mb-4">Introduce yourself. Tell them why you care about their mission and what skills you can bring to their dedicated team.</p>
              {/* 🔥 Focus Ring Color Fixed 🔥 */}
              <Textarea 
                placeholder="I deeply align with your mission because..."
                className="min-h-[140px] resize-none border-gray-200 focus:border-[#006D5B] focus:ring-[#006D5B]/20 rounded-lg text-sm"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end shrink-0">
              <Button variant="ghost" onClick={() => setShowJoinModal(null)} className="text-gray-600 font-bold">Cancel</Button>
              {/* 🔥 Modal Button Color Fixed 🔥 */}
              <Button onClick={handleJoinSubmit} disabled={isApplying} className="bg-[#006D5B] hover:bg-[#005244] text-white font-bold px-6 shadow-sm">
                {isApplying ? "Sending..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- THE UPGRADED PREMIUM VIEW ORG PROFILE MODAL --- */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <Card className="w-full max-w-6xl shadow-2xl border-none rounded-2xl overflow-hidden flex flex-col max-h-[90vh] bg-slate-50 relative">
             
             <Button variant="ghost" onClick={() => setSelectedOrg(null)} className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8 p-0">
               <X size={16}/>
             </Button>

             <div className="flex-1 overflow-y-auto relative">
                
                <div className="bg-white border-b border-slate-200 shadow-sm relative">
                  <div className="h-32 md:h-48 w-full relative bg-[#006D5B]">
                    {selectedOrg.coverUrl ? (
                      <img src={selectedOrg.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    )}
                  </div>

                  <div className="max-w-5xl mx-auto px-6 pb-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10 md:-mt-12 relative z-10">
                      <Avatar className="w-24 h-24 md:w-28 md:h-28 ring-4 ring-white bg-white shadow-sm rounded-xl shrink-0">
                        <AvatarImage src={selectedOrg.photoUrl || selectedOrg.logoUrl || selectedOrg.avatarUrl} className="object-cover rounded-xl" />
                        <AvatarFallback className="bg-slate-100 text-[#006D5B] text-3xl font-bold rounded-xl">
                          {String(selectedOrg.name || 'O').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 pb-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1 w-full md:w-auto">
                          <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold text-[#006D5B]">{selectedOrg.name || "Unnamed Organization"}</h1>
                            {selectedOrg.verified && <ShieldCheck className="h-5 w-5 text-[#006D5B]" />}
                          </div>
                          <p className="text-slate-500 font-medium text-sm">{selectedOrg.tagline || selectedOrg.category || "Non-Profit Organization"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                       {[
                         { label: 'Hours', val: selectedOrg.stats?.hours || selectedOrg.hours || '0', icon: Timer, color: 'text-[#006D5B]', bg: 'bg-[#006D5B]/10' },
                         { label: 'Projects', val: selectedOrg.stats?.projects || selectedOrg.projects || '0', icon: Activity, color: 'text-[#006D5B]', bg: 'bg-[#006D5B]/10' },
                         { label: 'Volunteers', val: selectedOrg.stats?.volunteers || selectedOrg.volunteers || '0', icon: Users2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                         { label: 'Rank', val: selectedOrg.rating || 'N/A', icon: Scale, color: 'text-slate-600', bg: 'bg-slate-100' }
                       ].map((m, i) => (
                         <Card key={i} className="border border-slate-200 shadow-sm p-3 flex flex-col items-center justify-center text-center bg-white rounded-xl">
                           <div className={`p-2 rounded-lg ${m.bg} mb-1.5`}><m.icon className={`h-4 w-4 ${m.color}`} /></div>
                           <div className="text-xl font-bold text-[#006D5B]">{m.val}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</div>
                         </Card>
                       ))}
                    </div>

                    <Card className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                      <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                         <CardTitle className="text-base font-bold text-[#006D5B] flex items-center gap-2">
                           <FileText className="h-4 w-4 text-[#006D5B]" /> Organizational Charter
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-5">
                         <div className="space-y-1.5">
                           <Label className="font-bold text-[#006D5B] text-xs uppercase tracking-wider">About the Entity</Label>
                           <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedOrg.description || "No description provided yet."}</p>
                         </div>
                         
                         <Separator className="bg-slate-100" />
                         
                         <div className="space-y-1.5">
                           <Label className="font-bold text-[#006D5B] text-xs uppercase tracking-wider">Legal Mission Statement</Label>
                           <blockquote className="border-l-2 border-[#006D5B] pl-3 py-1 text-sm font-medium text-slate-700 italic">
                             {selectedOrg.mission || "Mission statement pending."}
                           </blockquote>
                         </div>
                         
                         <Separator className="bg-slate-100" />
                         
                         <div className="space-y-2">
                            <Label className="font-bold text-[#006D5B] text-xs uppercase tracking-wider flex items-center gap-1.5"><Target className="h-3.5 w-3.5"/> Focus Areas</Label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {(() => {
                                    const causesData = selectedOrg.focusAreas || selectedOrg.causes || selectedOrg.category || ['Community Support'];
                                    const safeCausesArray = Array.isArray(causesData) ? causesData : [causesData];
                                    
                                    return safeCausesArray.map((cause: any, i: number) => (
                                        <Badge key={i} variant="secondary" className="bg-[#006D5B]/10 text-[#006D5B] border border-[#006D5B]/20">
                                          {String(cause)}
                                        </Badge>
                                    ));
                                })()}
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    
                    <Card className={`border shadow-sm rounded-xl overflow-hidden ${selectedOrg.verified ? 'bg-[#006D5B] text-white border-transparent' : 'bg-white border-slate-200'}`}>
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <ShieldCheck className={`h-6 w-6 ${selectedOrg.verified ? 'text-white' : 'text-amber-500'}`} />
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${selectedOrg.verified ? 'text-white border-white/20 bg-white/10' : 'text-amber-700 border-amber-200 bg-amber-50'}`}>
                            {selectedOrg.verified ? 'VERIFIED' : 'UNVERIFIED'}
                          </Badge>
                        </div>
                        
                        {selectedOrg.verified ? (
                          <div className="space-y-1.5">
                             <h3 className="text-lg font-bold">Identity Confirmed</h3>
                             <p className="text-white/80 text-xs leading-relaxed">This entity is legally authorized for public operations under Government Framework v4.0.</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <h3 className="text-lg font-bold text-[#006D5B]">Unverified Entity</h3>
                            <p className="text-xs text-slate-500">This organization has not yet completed the official government audit for verification.</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="border border-slate-200 shadow-sm rounded-xl bg-white p-5 space-y-4">
                       <h4 className="text-xs font-bold text-[#006D5B] uppercase tracking-wider flex items-center gap-2 mb-1 border-b border-slate-100 pb-2">
                         <Globe className="h-4 w-4 text-[#006D5B]" /> Contact Directory
                       </h4>
                       <div className="space-y-3">
                         <div className="flex items-center gap-2.5 text-sm text-slate-600"><Globe className="h-3.5 w-3.5 text-slate-400" /> <a href={selectedOrg.website || "#"} target="_blank" rel="noreferrer" className="hover:underline hover:text-[#006D5B] truncate">{selectedOrg.website || "Not provided"}</a></div>
                         <div className="flex items-center gap-2.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-400" /> <span className="truncate">{selectedOrg.email || "Not provided"}</span></div>
                         <div className="flex items-center gap-2.5 text-sm text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedOrg.phone || "Not provided"}</div>
                         <Separator className="bg-slate-100" />
                         <div className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" /> {selectedOrg.address || selectedOrg.location || selectedOrg.city || "HQ Location Not Logged"}</div>
                       </div>
                    </Card>
                  </div>
                </div>

             </div>
             
             {/* FOOTER: Fixed to bottom */}
             <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <Button variant="ghost" onClick={() => setSelectedOrg(null)} className="text-slate-600 font-bold px-6">Close</Button>
                {myAcceptedOrgIds.includes(selectedOrg.id) ? (
                   <Button disabled className="bg-[#006D5B]/10 text-[#006D5B] border border-[#006D5B]/20 font-bold px-6 shadow-sm">Joined Team</Button>
                ) : myPendingCrewOrgIds.includes(selectedOrg.id) ? (
                   <Button disabled className="bg-slate-100 text-slate-500 font-bold px-6 shadow-sm">Request Pending</Button>
                ) : !isVerified ? (
                  // 🔥 IDENTITY LOCK ON MODAL 🔥
                  <Button disabled className="bg-slate-100 text-slate-400 font-bold px-6 shadow-sm uppercase tracking-wider text-[10px]">
                    <Lock className="mr-1.5 h-3.5 w-3.5" /> ID Required to Apply
                  </Button>
                ) : (
                  <Button onClick={() => { setSelectedOrg(null); setShowJoinModal(selectedOrg); }} className="bg-[#006D5B] hover:bg-[#005244] text-white font-bold px-6 shadow-sm">
                    Apply to Join
                  </Button>
                )}
             </div>
          </Card>
        </div>
      )}

    </div>
  );
}