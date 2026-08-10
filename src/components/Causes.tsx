import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Heart, Users, Target, TrendingUp, X, Search, Award, Clock, Zap, Building2, MapPin } from 'lucide-react'; 
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useUserProfile } from '../hooks/useUserProfile';

// Causes are a fixed catalog rather than a Firestore collection, so the page renders instantly with zero reads.
const GLOBAL_CAUSES = [
  {
    id: "cause_1",
    title: "Disaster Response & Relief",
    category: "Emergency",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop",
    description: "Provide immediate on-the-ground assistance, medical aid, and logistical support during natural disasters.",
    longDescription: "This critical mission focuses on rapid deployment of resources, including food, clean water, medical supplies, and temporary shelter to regions affected by earthquakes, floods, and other natural disasters. Verified organizations actively coordinate field operations to save lives.",
    volunteers: "12.4k",
    funded: 85,
    impact: "High"
  },
  {
    id: "cause_2",
    title: "Youth Education & Mentorship",
    category: "Education",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
    description: "Empower the next generation through tutoring, skill-building, and educational accessibility programs.",
    longDescription: "Education is the foundation of a thriving society. This cause supports initiatives that provide underprivileged youth with access to quality education, tech literacy, and personal mentorship to help them break the cycle of poverty.",
    volunteers: "8.2k",
    funded: 62,
    impact: "Medium"
  },
  {
    id: "cause_3",
    title: "Environmental Conservation",
    category: "Environment",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop",
    description: "Protect wildlife, restore natural habitats, and combat climate change through community action.",
    longDescription: "From organizing massive tree-planting campaigns to executing ocean cleanup drives, this cause unites volunteers dedicated to preserving the planet's ecosystems and promoting sustainable, eco-friendly community practices.",
    volunteers: "15.1k",
    funded: 45,
    impact: "High"
  },
  {
    id: "cause_4",
    title: "Healthcare Access & Clinics",
    category: "Healthcare",
    image: "https://images.unsplash.com/photo-1584515220325-1e4b46188f44?q=80&w=800&auto=format&fit=crop",
    description: "Support mobile clinics, blood donation drives, and medical aid for vulnerable populations.",
    longDescription: "Access to basic healthcare is a fundamental human right. Organizations under this cause deploy medical professionals and volunteers to set up free clinics, distribute essential medicines, and provide health education in remote areas.",
    volunteers: "6.7k",
    funded: 92,
    impact: "Critical"
  },
  {
    id: "cause_5",
    title: "Food Security & Nutrition",
    category: "Community",
    image: "https://images.unsplash.com/photo-1593113565214-0b18f08f86f4?q=80&w=800&auto=format&fit=crop",
    description: "Operate food banks, distribute hot meals, and build sustainable community gardens.",
    longDescription: "Combatting urban and rural hunger by rescuing surplus food, operating local soup kitchens, and educating communities on sustainable agriculture. Join the fight to ensure no family goes to sleep hungry.",
    volunteers: "18.3k",
    funded: 78,
    impact: "High"
  },
  {
    id: "cause_6",
    title: "Clean Water Initiatives",
    category: "Environment",
    image: "https://images.unsplash.com/photo-1538300342682-be168714360c?q=80&w=800&auto=format&fit=crop",
    description: "Build wells and water purification systems for communities lacking access to safe drinking water.",
    longDescription: "Water is life. This mission involves engineering and logistical volunteer work to install deep-water wells, rainwater harvesting systems, and filtration units in communities suffering from severe water scarcity.",
    volunteers: "4.5k",
    funded: 88,
    impact: "Critical"
  },
  {
    id: "cause_7",
    title: "Animal Rescue & Welfare",
    category: "Animal Rights",
    image: "https://images.unsplash.com/photo-1541364983172-e5e2e8b0fb60?q=80&w=800&auto=format&fit=crop",
    description: "Rescue, rehabilitate, and rehome abandoned and stray animals across the country.",
    longDescription: "Supporting no-kill shelters and wildlife rescue centers. Volunteers assist with feeding, medical rehabilitation, facility maintenance, and organizing massive community adoption events.",
    volunteers: "9.8k",
    funded: 55,
    impact: "Medium"
  },
  {
    id: "cause_8",
    title: "Elderly Care & Support",
    category: "Community",
    image: "https://images.unsplash.com/photo-1576765608511-b0e687ee9df0?q=80&w=800&auto=format&fit=crop",
    description: "Provide companionship, medical transport, and daily living assistance to senior citizens.",
    longDescription: "Combatting the epidemic of senior isolation. Volunteers deliver groceries, provide essential transportation to medical appointments, and spend quality time engaging with elderly community members.",
    volunteers: "5.2k",
    funded: 40,
    impact: "High"
  },
  {
    id: "cause_9",
    title: "Technology for Good",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
    description: "Bridge the digital divide by refurbishing computers and teaching coding to marginalized groups.",
    longDescription: "Tech volunteers deploy their specialized skills to build nonprofit software, fix donated hardware for students, and teach digital literacy to help underserved communities thrive in the modern economy.",
    volunteers: "3.1k",
    funded: 70,
    impact: "Medium"
  },
  {
    id: "cause_10",
    title: "Refugee Aid & Resettlement",
    category: "Humanitarian",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",
    description: "Assist displaced families with housing, language translation, and basic necessities.",
    longDescription: "Providing a warm, safe welcome to those fleeing conflict. Volunteers work on language integration, distributing winter clothing, and assisting families in navigating local legal and healthcare systems.",
    volunteers: "11.6k",
    funded: 65,
    impact: "Critical"
  }
];

export function Causes() {
  const { user, loading: authLoading } = useUserProfile();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedCause, setSelectedCause] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const totalHours = user?.supportedCauses?.reduce((acc: number, c: any) => acc + (c.hoursContributed || 0), 0) || 0;
  const avgImpact = user?.supportedCauses?.length > 0 
    ? Math.round(user.supportedCauses.reduce((acc: number, c: any) => acc + (c.impactScore || 0), 0) / user.supportedCauses.length) 
    : 0;

  useEffect(() => {
    const unsubscribeOrgs = onSnapshot(collection(db, "organizations"), (snapshot) => {
        const orgData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrganizations(orgData);
    });

    return () => {
        unsubscribeOrgs();
    };
  }, []);

  const handleToggleSupport = async (cause: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Please log in first!");
    const userRef = doc(db, "users", currentUser.uid);
    const isSupported = user?.supportedCauses?.some((c: any) => c.id === cause.id);

    try {
      if (isSupported) {
        const causeToRemove = user.supportedCauses.find((c: any) => c.id === cause.id);
        await updateDoc(userRef, { supportedCauses: arrayRemove(causeToRemove) });
      } else {
        await updateDoc(userRef, {
          supportedCauses: arrayUnion({
            id: cause.id,
            title: cause.title,
            hoursContributed: 0,
            impactScore: 0
          })
        });
      }
    } catch (error) {
      console.error("Error toggling support:", error);
    }
  };

  const filteredCauses = GLOBAL_CAUSES.filter(cause => 
    cause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cause.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOrganizationsForCause = (cause: any) => {
      if (!cause) return [];
      const lowerTitle = cause.title.toLowerCase();
      const lowerCat = cause.category.toLowerCase();
      
      const searchKeywords = [lowerTitle, lowerCat];
      if (lowerTitle.includes("disaster")) searchKeywords.push("disaster relief");
      if (lowerTitle.includes("education")) searchKeywords.push("education", "youth empowerment");
      if (lowerTitle.includes("environment") || lowerTitle.includes("water")) searchKeywords.push("environment & climate");
      if (lowerTitle.includes("healthcare")) searchKeywords.push("healthcare");
      if (lowerTitle.includes("food")) searchKeywords.push("food security");
      if (lowerTitle.includes("animal")) searchKeywords.push("animal welfare");
      if (lowerTitle.includes("elderly")) searchKeywords.push("elderly care");
      if (lowerTitle.includes("technology")) searchKeywords.push("community development");
      if (lowerTitle.includes("refugee")) searchKeywords.push("refugee support");

      return organizations.filter(org => {
          const orgCausesStr = (org.causes || "").toLowerCase();
          const orgCatStr = (org.category || org.sector || "").toLowerCase();
          const focusAreasStr = Array.isArray(org.focusAreas) ? org.focusAreas.join(",").toLowerCase() : "";
          
          return searchKeywords.some(keyword => 
             orgCausesStr.includes(keyword) || 
             orgCatStr.includes(keyword) || 
             focusAreasStr.includes(keyword)
          );
      });
  };

  if (authLoading) return <div className="p-10 text-center text-[#168181] font-medium tracking-wider">Loading...</div>;

  return (
    <div className="space-y-8 relative pb-10 animate-in fade-in duration-300 font-sans">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b pb-6 border-slate-100">
        <div>
          <h1 className="text-[#0C4A54] text-2xl font-bold">Explore Causes</h1>
          <p className="text-slate-500 font-medium mt-1">Discover and support global initiatives.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter by title or category..." 
              className="pl-10 w-72 border-slate-200 focus:ring-[#168181] focus:border-[#168181] rounded-xl font-medium shadow-sm text-[#0C4A54]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-[#168181] hover:bg-[#11666B] rounded-xl font-semibold px-6 shadow-sm">
            <Heart className="mr-2 h-4 w-4" /> Save Search
          </Button>
        </div>
      </div>

      {/* Analytics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0C4A54] text-white border-none shadow-md rounded-2xl overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10"><Clock className="w-32 h-32" /></div>
          <CardContent className="pt-6 flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl"><Clock className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-[#86A7AC] text-xs font-semibold uppercase tracking-wider">Total Contribution</p>
              <h3 className="text-2xl font-bold">{totalHours} Hours</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-500 text-white border-none shadow-md rounded-2xl overflow-hidden relative">
           <div className="absolute -right-4 -top-4 opacity-10"><Zap className="w-32 h-32" /></div>
          <CardContent className="pt-6 flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-xl"><Zap className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Impact Score</p>
              <h3 className="text-2xl font-bold">{avgImpact}/100</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#168181] text-white border-none shadow-md rounded-2xl overflow-hidden relative">
           <div className="absolute -right-4 -top-4 opacity-10"><Award className="w-32 h-32" /></div>
          <CardContent className="pt-6 flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-xl"><Award className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Volunteer Status</p>
              <h3 className="text-2xl font-bold">{totalHours > 50 ? 'Elite Member' : 'Active Member'}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Active Support */}
      <Card className="bg-slate-50 border-dashed border-2 border-slate-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#0C4A54]">My Supported Causes</CardTitle>
          <CardDescription className="font-medium text-slate-500">Missions you are actively following.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.supportedCauses?.length > 0 ? (
              user.supportedCauses.map((myCause: any) => (
                <div key={myCause.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-l-[#168181] transition-all hover:shadow-md">
                  <div>
                    <h3 className="text-[#0C4A54] font-bold text-sm">{myCause.title}</h3>
                    <p className="text-[10px] text-[#168181] font-semibold uppercase tracking-wider mt-0.5">Verified Action</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-orange-600 hover:bg-orange-50" onClick={() => handleToggleSupport(myCause)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 font-medium col-span-full bg-white p-4 rounded-xl border border-slate-100">No active causes selected. Click 'Support Cause' below to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Causes Grid */}
      <div>
        <h2 className="text-xl font-bold text-[#0C4A54] mb-6 flex items-center gap-3">
          <div className="h-2 w-2 bg-orange-500 rounded-full" />
          Global Mission Pool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCauses.map((cause) => {
            const isSupported = user?.supportedCauses?.some((c: any) => c.id === cause.id);
            return (
              <Card key={cause.id} className="overflow-hidden border-slate-100 shadow-sm group hover:shadow-md transition-all rounded-2xl flex flex-col bg-white">
                <div className="h-56 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C4A54]/80 to-transparent z-10" />
                  <img src={cause.image} alt={cause.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 z-20">
                    <Badge className="bg-white/95 text-[#0C4A54] hover:bg-white border-none py-1.5 px-4 font-semibold text-[10px] uppercase tracking-wider shadow-sm backdrop-blur-sm">
                      <Heart className="h-3 w-3 mr-1.5 text-orange-500 fill-orange-500" />
                      {cause.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-bold text-[#0C4A54] leading-tight">{cause.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col justify-end">
                  <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-4 bg-slate-50/50 rounded-xl px-2">
                    <div className="text-center">
                      <Users className="h-4 w-4 mx-auto text-[#168181] mb-1" />
                      <span className="block text-sm font-bold text-[#0C4A54]">{cause.volunteers}</span>
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Volunteers</p>
                    </div>
                    <div className="text-center border-l border-r border-slate-200">
                      <Target className="h-4 w-4 mx-auto text-[#168181] mb-1" />
                      <span className="block text-sm font-bold text-[#0C4A54]">{cause.funded}%</span>
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Funded</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                      <span className="block text-sm font-bold text-[#0C4A54]">{cause.impact}</span>
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Impact</p>
                    </div>
                  </div>
                  <Progress value={Number(cause.funded)} className="h-2 bg-slate-100 [&>div]:bg-[#168181]" />
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleToggleSupport(cause)} 
                      className={`flex-1 font-bold h-11 text-xs rounded-xl shadow-sm transition-all ${isSupported ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-[#168181] hover:bg-[#11666B] text-white'}`}
                    >
                      {isSupported ? 'Remove Support' : 'Support Cause'}
                    </Button>
                    <Button variant="outline" className="flex-1 h-11 border-slate-200 text-slate-600 hover:bg-[#168181]/10 hover:text-[#0C4A54] hover:border-[#168181]/30 font-bold text-xs rounded-xl shadow-sm" onClick={() => setSelectedCause(cause)}>
                      Explore Deeper
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- DETAILED MODAL --- */}
      {selectedCause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C4A54]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-slate-200 rounded-2xl flex flex-col bg-slate-50 animate-in zoom-in-95">
            
            <button onClick={() => setSelectedCause(null)} className="absolute right-4 top-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors z-50 backdrop-blur-md"><X className="h-5 w-5" /></button>
            
            <div className="h-64 md:h-80 w-full relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C4A54]/90 via-[#0C4A54]/40 to-transparent z-10" />
              <img src={selectedCause.image} alt={selectedCause.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-8 right-8 z-20">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-none px-3 py-1 font-semibold text-[10px] tracking-wider uppercase shadow-sm">Verified Mission Area</Badge>
                  <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">{selectedCause.category}</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{selectedCause.title}</CardTitle>
              </div>
            </div>

            <CardContent className="p-8 space-y-8 flex-1">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-xs text-[#0C4A54] uppercase tracking-wider mb-3 flex items-center gap-2"><div className="h-1.5 w-1.5 bg-[#168181] rounded-full" /> Mission Overview</h4>
                  <p className="text-slate-700 leading-relaxed font-medium bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-sm">{selectedCause.description}</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2"><div className="h-1.5 w-1.5 bg-orange-500 rounded-full" /> Strategic Impact Target</h4>
                  <p className="text-slate-600 leading-relaxed font-medium px-2 text-sm italic">
                    {selectedCause.longDescription || "This project focuses on measurable, long-term impact through strategic resource deployment and local empowerment. Verified organizations below are actively leading field operations in this sector."}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Funding Progress</p>
                  <p className="text-2xl font-bold text-[#0C4A54]">{selectedCause.funded}%</p>
                  <Progress value={selectedCause.funded} className="h-1.5 mt-3 bg-slate-100 [&>div]:bg-[#168181]" />
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Impact Potential</p>
                  <p className="text-2xl font-bold text-orange-500">{selectedCause.impact}</p>
                </div>
              </div>

              <div className="pt-4">
                 <h4 className="font-bold text-xs text-[#0C4A54] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Building2 className="h-4 w-4 text-[#168181]" /> Organizations Driving This Cause
                 </h4>
                 {(() => {
                     const matchedOrgs = getOrganizationsForCause(selectedCause);
                     if (matchedOrgs.length === 0) {
                         return <p className="text-sm text-slate-500 font-medium bg-white p-4 rounded-xl border border-slate-100">No organizations are currently linked to this specific cause.</p>
                     }
                     return (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {matchedOrgs.map(org => (
                                 <div key={org.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-[#168181]/30 transition-colors cursor-default">
                                     <Avatar className="h-12 w-12 border border-slate-100 shadow-sm shrink-0">
                                         <AvatarImage src={org.photoUrl || org.logoUrl || org.avatarUrl} className="object-cover" />
                                         <AvatarFallback className="bg-[#168181]/10 text-[#0C4A54] font-bold text-lg">{String(org.name || 'O').charAt(0).toUpperCase()}</AvatarFallback>
                                     </Avatar>
                                     <div className="min-w-0">
                                         <h4 className="font-bold text-[#0C4A54] text-sm leading-tight truncate">{org.name}</h4>
                                         <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                            <MapPin className="h-3 w-3" /> <span className="truncate">{org.city || org.location || 'Global'}</span>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     );
                 })()}
              </div>

              <div className="pt-6 flex gap-3 sticky bottom-0 bg-slate-50 border-t border-slate-200 mt-6 -mx-8 px-8 pb-4">
                <Button 
                  className={`flex-1 h-12 text-xs font-bold shadow-md transition-all active:scale-95 rounded-xl ${user?.supportedCauses?.some((c: any) => c.id === selectedCause.id) ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200' : 'bg-[#168181] hover:bg-[#11666B] text-white'}`}
                  onClick={() => { handleToggleSupport(selectedCause); setSelectedCause(null); }}
                >
                  {user?.supportedCauses?.some((c: any) => c.id === selectedCause.id) ? 'Remove Support' : 'Commit to Mission'}
                </Button>
                <Button variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600 hover:bg-white hover:text-[#0C4A54] font-bold text-xs rounded-xl shadow-sm" onClick={() => setSelectedCause(null)}>Close Overview</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}