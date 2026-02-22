import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Heart, Users, Target, TrendingUp, X, Search, Award, Clock, Zap, Building2 } from 'lucide-react'; 
import { Progress } from './ui/progress';
import { Input } from './ui/input';

// DATABASE CONNECTION
import { db, auth } from '../lib/firebase'; 
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useUserProfile } from '../hooks/useUserProfile'; 

export function Causes() {
  const { user, loading: authLoading } = useUserProfile();
  const [causes, setCauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCause, setSelectedCause] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const totalHours = user?.supportedCauses?.reduce((acc: number, c: any) => acc + (c.hoursContributed || 0), 0) || 0;
  const avgImpact = user?.supportedCauses?.length > 0 
    ? Math.round(user.supportedCauses.reduce((acc: number, c: any) => acc + (c.impactScore || 0), 0) / user.supportedCauses.length) 
    : 0;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "causes"), (snapshot) => {
      const dbData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCauses(dbData);
      setLoading(false);
    });
    return () => unsubscribe();
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

  const filteredCauses = causes.filter(cause => 
    cause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cause.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) return <div className="p-10 text-center text-teal-700 font-bold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="space-y-8 relative pb-10">
      
      {/* SECTION 1: HEADER & SEARCH (TEAL ACCENTS) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b pb-6 border-orange-100">
        <div>
          <h1 className="text-teal-900 text-3xl font-black uppercase tracking-tight">Explore Causes</h1>
          <p className="text-orange-800 font-bold opacity-80">Discover and support global initiatives.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
            <Input 
              placeholder="Filter by title or category..." 
              className="pl-10 w-72 border-orange-200 focus:ring-teal-600 rounded-md font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-teal-700 hover:bg-teal-800 rounded-md font-bold px-6">
            <Heart className="mr-2 h-4 w-4" /> Save Search
          </Button>
        </div>
      </div>

      {/* SECTION 2: THEMED ANALYTICS BAR (TEAL, ORANGE, TERRACOTTA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-teal-700 text-white border-none shadow-md">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg"><Clock className="h-6 w-6" /></div>
            <div>
              <p className="text-teal-100 text-xs font-bold uppercase tracking-widest">Total Contribution</p>
              <h3 className="text-2xl font-black">{totalHours} Hours</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-600 text-white border-none shadow-md">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg"><Zap className="h-6 w-6" /></div>
            <div>
              <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Impact Score</p>
              <h3 className="text-2xl font-black">{avgImpact}/100</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#bc4a3c] text-white border-none shadow-md"> {/* TERRACOTTA */}
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg"><Award className="h-6 w-6" /></div>
            <div>
              <p className="text-orange-50 text-xs font-bold uppercase tracking-widest">Volunteer Status</p>
              <h3 className="text-2xl font-black">{totalHours > 50 ? 'Elite Member' : 'Active Member'}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: MY ACTIVE SUPPORT (TERRACOTTA ACCENTS) */}
      <Card className="bg-orange-50/30 border-dashed border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold uppercase tracking-wide text-orange-900">My Active Support</CardTitle>
          <CardDescription className="font-bold text-orange-700 opacity-60">Your current missions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.supportedCauses?.length > 0 ? (
              user.supportedCauses.map((myCause: any) => (
                <div key={myCause.id} className="p-4 bg-white border border-orange-100 rounded-lg shadow-sm flex justify-between items-center border-l-4 border-l-[#bc4a3c]">
                  <div>
                    <h3 className="text-gray-900 font-black text-sm">{myCause.title}</h3>
                    <p className="text-[10px] text-[#bc4a3c] font-bold uppercase tracking-tighter">Verified Action</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-300 hover:text-red-600" onClick={() => handleToggleSupport(myCause)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-orange-400 font-bold">No active causes selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: GLOBAL CAUSES GRID */}
      <div>
        <h2 className="text-xl font-black text-teal-900 mb-6 flex items-center gap-3 uppercase tracking-tight">
          <div className="h-1 w-12 bg-[#bc4a3c] rounded-full" />
          Global Mission Pool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCauses.map((cause) => {
            const isSupported = user?.supportedCauses?.some((c: any) => c.id === cause.id);
            return (
              <Card key={cause.id} className="overflow-hidden border-none shadow-lg group hover:ring-2 hover:ring-orange-500/20 transition-all">
                <div className="h-60 overflow-hidden relative">
                  <img src={cause.image} alt={cause.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/95 text-[#bc4a3c] border-none py-1.5 px-4 font-bold shadow-md">
                      <Building2 className="h-3.5 w-3.5 mr-2" />
                      {cause.organization || "Independent"}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl font-black text-gray-900 uppercase tracking-tight leading-tight">{cause.title}</CardTitle>
                    <Badge className="bg-orange-50 text-orange-700 border border-orange-100 font-black px-3 py-1 uppercase text-[10px] tracking-widest">{cause.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4 border-y border-orange-50 py-4">
                    <div className="text-center">
                      <Users className="h-4 w-4 mx-auto text-teal-700 mb-1" />
                      <span className="block text-sm font-black text-gray-900">{cause.volunteers}</span>
                      <p className="text-[9px] font-bold text-orange-800 uppercase tracking-tighter">Volunteers</p>
                    </div>
                    <div className="text-center">
                      <Target className="h-4 w-4 mx-auto text-teal-700 mb-1" />
                      <span className="block text-sm font-black text-gray-900">{cause.funded}%</span>
                      <p className="text-[9px] font-bold text-orange-800 uppercase tracking-tighter">Funded</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-4 w-4 mx-auto text-teal-700 mb-1" />
                      <span className="block text-sm font-black text-gray-900">{cause.impact}</span>
                      <p className="text-[9px] font-bold text-orange-800 uppercase tracking-tighter">Impact</p>
                    </div>
                  </div>
                  <Progress value={Number(cause.funded)} className="h-1.5 bg-orange-50" />
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => handleToggleSupport(cause)} 
                      className={`flex-1 font-black h-12 uppercase tracking-widest text-xs ${isSupported ? 'bg-orange-50 text-orange-400 hover:text-red-600' : 'bg-teal-700 hover:bg-teal-800 text-white shadow-md'}`}
                    >
                      {isSupported ? 'Unsupport' : 'Support Cause'}
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 border-orange-200 text-orange-800 font-black uppercase tracking-widest text-xs hover:bg-orange-50" onClick={() => setSelectedCause(cause)}>
                      Read More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- DETAILED MODAL (TRUE THEME) --- */}
      {selectedCause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-900/40 backdrop-blur-sm">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border-none rounded-none">
            <button onClick={() => setSelectedCause(null)} className="absolute right-4 top-4 p-2 rounded-full bg-white hover:bg-orange-50 transition-colors z-10 shadow-lg"><X className="h-6 w-6 text-orange-400" /></button>
            <div className="h-72 w-full relative">
              <img src={selectedCause.image} alt={selectedCause.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#bc4a3c]/80 to-transparent" />
            </div>
            <CardHeader className="bg-white pt-8">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-teal-700 text-white border-none px-4 py-1 font-black text-[10px] tracking-widest uppercase">Verified Mission</Badge>
                <span className="text-xs font-black text-orange-800 uppercase tracking-widest opacity-60">{selectedCause.category}</span>
              </div>
              <CardTitle className="text-3xl font-black text-gray-900 uppercase tracking-tight">{selectedCause.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pb-10">
              <div className="space-y-6">
                <div>
                  <h4 className="font-black text-[11px] text-teal-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><div className="h-0.5 w-4 bg-[#bc4a3c]" /> Mission Overview</h4>
                  <p className="text-gray-600 leading-relaxed font-bold bg-orange-50/50 p-6 border-l-4 border-l-[#bc4a3c]">{selectedCause.description}</p>
                </div>
                <div>
                  <h4 className="font-black text-[11px] text-[#bc4a3c] uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><div className="h-0.5 w-4 bg-teal-700" /> Strategic Impact</h4>
                  <p className="text-gray-700 leading-relaxed font-bold px-4">
                    {selectedCause.longDescription || "This project focuses on measurable, long-term impact through strategic resource deployment and local empowerment."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 border border-orange-100 shadow-sm">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Funding Progress</p>
                  <p className="text-2xl font-black text-teal-700">{selectedCause.funded}%</p>
                  <Progress value={selectedCause.funded} className="h-1 mt-3 bg-orange-50" />
                </div>
                <div className="bg-white p-6 border border-orange-100 shadow-sm">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Impact Potential</p>
                  <p className="text-2xl font-black text-[#bc4a3c]">{selectedCause.impact}</p>
                </div>
              </div>
              <div className="pt-8 flex gap-4 border-t border-orange-100 sticky bottom-0 bg-white">
                <Button 
                  className={`flex-1 h-14 text-xs font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${user?.supportedCauses?.some((c: any) => c.id === selectedCause.id) ? 'bg-[#bc4a3c] hover:bg-[#a33f33] text-white' : 'bg-teal-700 hover:bg-teal-800 text-white'}`}
                  onClick={() => { handleToggleSupport(selectedCause); setSelectedCause(null); }}
                >
                  {user?.supportedCauses?.some((c: any) => c.id === selectedCause.id) ? 'Remove Support' : 'Commit to Mission'}
                </Button>
                <Button variant="outline" className="h-14 px-10 border-orange-200 text-orange-800 font-black uppercase tracking-[0.2em] text-xs" onClick={() => setSelectedCause(null)}>Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}