import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Clock, CheckCircle, Calendar, MapPin, Shield, 
  Zap, Brain, Rocket, ChevronRight, BarChart3, Lock, ShieldAlert, Activity, BookOpen
} from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';

export function OverviewDashboard({ onNavigate }: { onNavigate?: (section: string) => void }) {

  const { user } = useUserProfile();
  const [liveStats, setLiveStats] = useState({ hours: 0, completed: 0, active: 0, points: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [suggestedPaths, setSuggestedPaths] = useState<any[]>([]);

  // Readiness fields below correspond to the four AVR steps shown on the Crisis Response page.
  const isAvrReady = user?.isAVRMember === true;

  // Step 1
  const isVerified = user?.verificationStatus === 'verified';
  // Step 2 (placeholder field until protocol certification is tracked properly in Firestore)
  const isProtocolCertified = user?.protocolCertified === true;
  // Step 3 (placeholder field until simulator scores are tracked properly in Firestore)
  const simulationsMastered = user?.simulationsMastered || 0;
  const hasPassedSims = simulationsMastered >= 2;
  // Step 4
  const currentImpactPoints = user?.impactPoints || 0;
  const hasImpactPoints = currentImpactPoints >= 500;

  useEffect(() => {
    if (!user?.uid) return;

    const qApps = query(collection(db, "applications"), where("volunteerId", "==", user.uid));
    const unsubApps = onSnapshot(qApps, (snap) => {
      const docs = snap.docs.map(d => d.data());
      setLiveStats({
        hours: docs.reduce((acc, curr) => acc + (curr.hoursContributed || 0), 0),
        completed: docs.filter(d => d.status === 'completed').length,
        active: docs.filter(d => d.status === 'accepted').length,
        points: user.impactPoints || 0
      });
    });

    const qMissions = query(
      collection(db, "applications"), 
      where("volunteerId", "==", user.uid), 
      where("status", "==", "accepted"),
      limit(3)
    );
    const unsubMissions = onSnapshot(qMissions, (snap) => {
      setUpcomingEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const allPossibleSkills = [
      { id: '1', title: 'Crisis Management', category: 'Emergency' },
      { id: '2', title: 'First Aid Basic', category: 'Medical' },
      { id: '3', title: 'Logistics Control', category: 'Operations' }
    ];
    const filtered = allPossibleSkills.filter(s => !user?.skills?.includes(s.title));
    setSuggestedPaths(filtered);

    return () => { unsubApps(); unsubMissions(); };
  }, [user]);

  const chartData = [
    { name: 'Mon', impact: 20 }, { name: 'Tue', impact: 45 }, { name: 'Wed', impact: 30 },
    { name: 'Thu', impact: 70 }, { name: 'Fri', impact: 40 }, { name: 'Sat', impact: 85 }, { name: 'Sun', impact: 60 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marhaba, {user?.name?.split(' ')[0] || "Volunteer"}</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Volunteer Ecosystem Status:
            <span className={`font-bold ml-1 ${isAvrReady ? 'text-role-accent-teal' : 'text-slate-400'}`}>
              {isAvrReady ? 'STANDBY READY' : 'ONBOARDING'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-brand-cta/10 px-4 py-2 rounded-2xl border border-brand-cta/20 shadow-sm self-start sm:self-auto">
            <Zap size={16} className="text-brand-cta fill-brand-cta" />
            <span className="text-brand-cta-dark font-black text-xs uppercase tracking-widest">Impact: {liveStats.points}</span>
        </div>
      </div>

      {/* --- CONDITIONAL AVR BANNER --- */}
      {isAvrReady ? (
        // ACTIVE AVR STATE (The Elite Green Banner)
        <Card className="border-none shadow-xl shadow-role-accent-teal/10 bg-role-accent-teal text-white overflow-hidden relative rounded-[2rem]">
          <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4"><Shield size={320} /></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md border border-white/30">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                  <h3 className="text-xl font-black tracking-tight uppercase">Athar Volunteer Reserve Status</h3>
                  <Badge className="bg-emerald-400 text-white border-none font-bold text-[10px]">ACTIVE</Badge>
                </div>
                <p className="text-teal-50 text-sm font-medium leading-relaxed max-w-2xl opacity-90">
                  Identity verified via MERNIS. You are cleared for rapid deployment. Your tactical skill set is visible to government and NGO partners for emergency activation.
                </p>
              </div>
              <div className="flex gap-4 w-full lg:w-auto">
                <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-sm flex-1 text-center">
                  <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">Skills</p>
                  <p className="text-2xl font-black">{user?.skills?.length || 0}</p>
                </div>
                <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-sm flex-1 text-center">
                  <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">Readiness</p>
                  <p className="text-2xl font-black">Tier 1</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Locked AVR state: unlock CTA plus the four real readiness requirements
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50 relative rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 shrink-0">
                  <Lock className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-role-volunteer-dark uppercase mb-1">Athar Volunteer Reserve (AVR)</h3>
                  <p className="text-slate-500 text-sm font-medium">
                    The AVR is our elite emergency deployment unit. Complete your clearance requirements to access live crisis comms and field deployments.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onNavigate?.('crisis-response')}
                className="shrink-0 bg-role-volunteer-dark hover:bg-role-accent-teal text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-6 h-12 transition-colors"
              >
                View Requirements <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
            
            {/* Mirrors the four AVR readiness steps from the Crisis Response page */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/60">
              {/* Step 1: KYC */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {isVerified ? <CheckCircle className="h-4 w-4 text-role-accent-teal" /> : <ShieldAlert className="h-4 w-4 text-warning" />}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isVerified ? 'text-role-accent-teal' : 'text-slate-500'}`}>
                    1. KYC Verification
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 ml-6">
                  {user?.verificationStatus === 'pending' ? '(Pending Review)' : isVerified ? 'Identity Verified' : 'Incomplete'}
                </span>
              </div>

              {/* Step 2: Protocol */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {isProtocolCertified ? <CheckCircle className="h-4 w-4 text-role-accent-teal" /> : <BookOpen className="h-4 w-4 text-slate-300" />}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isProtocolCertified ? 'text-role-accent-teal' : 'text-slate-500'}`}>
                    2. Core Protocol
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 ml-6">
                  {isProtocolCertified ? 'Certified' : 'Incomplete'}
                </span>
              </div>

              {/* Step 3: Simulator */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {hasPassedSims ? <CheckCircle className="h-4 w-4 text-role-accent-teal" /> : <Activity className="h-4 w-4 text-slate-300" />}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${hasPassedSims ? 'text-role-accent-teal' : 'text-slate-500'}`}>
                    3. AI Stress Testing
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 ml-6">
                  {simulationsMastered} / 2 Mastered
                </span>
              </div>

              {/* Step 4: Impact Points */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {hasImpactPoints ? <CheckCircle className="h-4 w-4 text-role-accent-teal" /> : <Zap className="h-4 w-4 text-slate-300" />}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${hasImpactPoints ? 'text-role-accent-teal' : 'text-slate-500'}`}>
                    4. Field Impact
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 ml-6">
                  {currentImpactPoints} / 500 Points
                </span>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* --- ANALYTICS & STATS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Impact Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-0 px-8 pt-8">
            <div>
                <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Impact Analytics</CardTitle>
                <p className="text-2xl font-black text-slate-900 mt-1">Volunteer Velocity</p>
            </div>
            <BarChart3 className="text-role-accent-teal h-6 w-6" />
          </CardHeader>
          <CardContent className="p-0 h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1C9290" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1C9290" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip />
                <Area type="monotone" dataKey="impact" stroke="#1C9290" strokeWidth={4} fillOpacity={1} fill="url(#colorImpact)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vertical Stats Column */}
        <div className="space-y-4">
          {[
            { label: 'Cumulative Hours', val: liveStats.hours, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Completed Missions', val: liveStats.completed, icon: CheckCircle, color: 'text-role-accent-teal', bg: 'bg-teal-50' },
            { label: 'Current Deployments', val: liveStats.active, icon: Zap, color: 'text-brand-cta', bg: 'bg-brand-cta/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl flex items-center justify-between shadow-sm border border-slate-50 group hover:border-role-accent-teal/20 transition-all">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-2xl font-black text-slate-900">{stat.val}</p>
               </div>
               <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:rotate-12 transition-transform`}>
                 <stat.icon size={22} />
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MISSIONS & SUGGESTIONS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Missions from DB */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight ml-2">Active Assignments</h3>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-50 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-role-accent-teal border border-slate-100">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-none">{event.oppTitle}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <MapPin size={10} className="text-role-accent-teal" /> {event.location || "Online Deployment"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" className="text-slate-300 group-hover:text-role-accent-teal group-hover:translate-x-1 transition-all">
                  <ChevronRight size={20} />
                </Button>
              </div>
            )) : (
              <p className="text-slate-400 text-sm italic ml-2">No active missions. Visit 'Explore Opportunities' to deploy.</p>
            )}
          </div>
        </div>

        {/* Smart Suggestion Engine */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Adaptive Learning</h3>
          <Card className="border-none shadow-xl shadow-role-accent-teal/5 rounded-[2rem] bg-white overflow-hidden">
            <div className="bg-role-accent-teal/5 p-6 border-b border-role-accent-teal/10 flex items-center gap-3">
               <Brain className="text-role-accent-teal" size={20} />
               <span className="text-[10px] font-black text-role-accent-teal uppercase tracking-widest">Recommended Skill Paths</span>
            </div>
            <CardContent className="p-6 space-y-6">
              {suggestedPaths.map((path, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="space-y-1">
                    <h5 className="font-black text-slate-800 text-xs">{path.title}</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{path.category} Certification</p>
                  </div>
                  <div className="bg-slate-50 text-slate-300 group-hover:bg-role-accent-teal group-hover:text-white p-2 rounded-lg transition-all">
                    <Rocket size={14} />
                  </div>
                </div>
              ))}
              <Button className="w-full h-12 bg-role-accent-teal hover:bg-role-accent-teal/80 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-role-accent-teal/20 mt-2">
                Open Training Simulator
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}