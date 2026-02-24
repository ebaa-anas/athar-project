import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where, doc, getDoc, addDoc, updateDoc, increment, serverTimestamp 
} from "firebase/firestore";

// 👇 FIXED PATHS: Changed from '../ui' to './ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertTriangle, Clock, MapPin, Users, CheckCircle,
  Zap, TrendingUp, Shield, Navigation, Phone, AlertCircle, ShieldAlert
} from 'lucide-react';

// 👇 FIXED PATH: Changed from '../../hooks' to '../hooks'
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

// Helper for formatting time
const timeAgo = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "Just now";
};

export function CrisisResponse() {
  const { user, loading } = useUserProfile();
  const [crises, setCrises] = useState<any[]>([]);
  const [myResponses, setMyResponses] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

  // --- 1. FETCH CRISES & RESPONSES ---
  useEffect(() => {
    if (!user || !user.isAVRMember) return; 

    const unsubscribeCrises = onSnapshot(collection(db, "crises"), (snapshot) => {
      const allCrises = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCrises(allCrises);
    });

    const qResponses = query(collection(db, "crisisResponses"), where("volunteerId", "==", user.uid));
    const unsubscribeResponses = onSnapshot(qResponses, (snapshot) => {
      setMyResponses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeCrises();
      unsubscribeResponses();
    };
  }, [user]);

  // --- 2. CATEGORIZE ALERTS ---
  const activeAlerts = crises.filter(c => 
    c.status === 'Active' && !myResponses.find(r => r.crisisId === c.id)
  );

  const acceptedAlerts = crises.filter(c => 
    c.status === 'Active' && myResponses.find(r => r.crisisId === c.id && r.status === 'accepted')
  );

  const completedAlerts = crises.filter(c => 
    c.status === 'Completed' && myResponses.find(r => r.crisisId === c.id && r.status === 'accepted')
  );

  // --- 3. HANDLE ACCEPT / DECLINE ---
  const handleResponse = async (crisisId: string, status: 'accepted' | 'declined') => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await addDoc(collection(db, "crisisResponses"), {
        crisisId,
        volunteerId: currentUser.uid,
        status,
        respondedAt: serverTimestamp()
      });

      if (status === 'accepted') {
        await updateDoc(doc(db, "crises", crisisId), {
          volunteersResponded: increment(1)
        });
      }
    } catch (error) {
      console.error("Error responding to crisis:", error);
    }
  };

  // --- SECURITY LOCK: AVR MEMBERS ONLY ---
  if (loading) return <div>Loading Secure Data...</div>;
  
  if (!user?.isAVRMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-red-50 p-8 rounded-full border-4 border-red-100 shadow-sm">
          <ShieldAlert className="h-20 w-20 text-[#E16A3D]" />
        </div>
        <div className="max-w-xl space-y-4">
          <h2 className="text-4xl font-black text-[#043E52] uppercase tracking-tight">Restricted Access</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            The Crisis Response Center is exclusively available to certified members of the <strong>Athar Volunteer Reserve (AVR)</strong>. 
            AVR members undergo specialized background checks and skills verification for immediate emergency deployment.
          </p>
        </div>
        
        <Button 
          onClick={async () => await updateDoc(doc(db, "users", user.uid), { isAVRMember: true })}
          className="bg-[#1C9290] hover:bg-[#157a78] h-14 px-10 text-white font-bold rounded-2xl shadow-xl mt-4 transition-all hover:scale-105"
        >
          <Shield className="mr-2 h-5 w-5" /> Enroll in AVR Certification
        </Button>
      </div>
    );
  }

  // --- MAIN AVR DASHBOARD ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#043E52] text-2xl font-bold mb-2">Crisis Response Center</h1>
        <p className="text-slate-500">
          Receive real-time crisis alerts matched to your verified skills. Part of the Athar Volunteer Reserve (AVR).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-red-500 shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="bg-red-50 p-3 rounded-xl"><AlertTriangle className="h-6 w-6 text-red-600" /></div><div><p className="text-sm font-bold text-slate-400 uppercase">Active Alerts</p><p className="text-xl font-black text-[#043E52]">{activeAlerts.length}</p></div></div></CardContent></Card>
        <Card className="border-t-4 border-t-[#1C9290] shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="bg-teal-50 p-3 rounded-xl"><Zap className="h-6 w-6 text-[#1C9290]" /></div><div><p className="text-sm font-bold text-slate-400 uppercase">Responses</p><p className="text-xl font-black text-[#043E52]">{acceptedAlerts.length}</p></div></div></CardContent></Card>
        <Card className="border-t-4 border-t-blue-500 shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="bg-blue-50 p-3 rounded-xl"><CheckCircle className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm font-bold text-slate-400 uppercase">Completed</p><p className="text-xl font-black text-[#043E52]">{completedAlerts.length}</p></div></div></CardContent></Card>
        <Card className="border-t-4 border-t-purple-500 shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="bg-purple-50 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-purple-600" /></div><div><p className="text-sm font-bold text-slate-400 uppercase">Response Rate</p><p className="text-xl font-black text-[#043E52]">92%</p></div></div></CardContent></Card>
      </div>

      <Card className="border-none shadow-md bg-gradient-to-br from-[#043E52] to-[#1C9290] text-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
              <Shield className="h-8 w-8 text-teal-100" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                Athar Volunteer Reserve Status: <Badge className="bg-green-500 text-white border-none ml-2">ACTIVE</Badge>
              </h3>
              <p className="text-teal-50 text-sm mb-4 leading-relaxed max-w-3xl">
                You are part of the elite AVR. Verified Partner organizations can activate you instantly for crisis response. 
                Alerts are matched securely to your verified skills for targeted, efficient deployment.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-teal-100 uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-400" /> Skills Verified</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-400" /> Background Check</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-400" /> Standby Ready</div>
              </div>
            </div>
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white hover:text-[#043E52] font-bold">
              Manage Availability
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-white font-bold text-slate-500 data-[state=active]:text-[#E16A3D]">
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge className="ml-2 bg-[#E16A3D] text-white border-none px-1.5 min-w-[20px] h-5 flex items-center justify-center">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-white font-bold text-slate-500 data-[state=active]:text-[#1C9290]">
            My Responses ({acceptedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white font-bold text-slate-500">
            Completed ({completedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeAlerts.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
              <CardContent className="p-16 text-center flex flex-col items-center">
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-[#043E52] mb-2">No Active Alerts</h3>
                <p className="text-slate-500">You're on standby. We will notify you instantly when an emergency matches your profile.</p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <CrisisAlertCard 
                key={alert.id} 
                alert={alert} 
                onAccept={handleResponse}
                onDecline={handleResponse}
                onViewDetails={setSelectedAlert}
                statusType="active"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4 mt-6">
          {acceptedAlerts.map((alert) => (
            <CrisisAlertCard 
              key={alert.id} 
              alert={alert}
              onViewDetails={setSelectedAlert}
              statusType="accepted"
            />
          ))}
          {acceptedAlerts.length === 0 && <p className="text-center text-slate-500 py-10 font-medium">You haven't responded to any active crises yet.</p>}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedAlerts.map((alert) => (
            <CrisisAlertCard 
              key={alert.id} 
              alert={alert}
              onViewDetails={setSelectedAlert}
              statusType="completed"
            />
          ))}
        </TabsContent>
      </Tabs>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-2xl border-none shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#E16A3D] text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-2 backdrop-blur-md">
                    {selectedAlert.severity.toUpperCase()} PRIORITY
                  </Badge>
                  <CardTitle className="text-2xl font-bold">{selectedAlert.title}</CardTitle>
                  <CardDescription className="text-orange-100 mt-1 text-base flex items-center gap-2">
                    {selectedAlert.organization} {selectedAlert.organizationVerified && <CheckCircle className="h-4 w-4" />}
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setSelectedAlert(null)} className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6 bg-white">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Situation Report</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedAlert.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 bg-white">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Location Data</p>
                  <div className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="p-2 bg-orange-50 rounded-lg"><MapPin className="h-5 w-5 text-[#E16A3D]" /></div>
                    <span>{selectedAlert.location}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Command Center</p>
                  <div className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="p-2 bg-teal-50 rounded-lg"><Phone className="h-5 w-5 text-[#1C9290]" /></div>
                    <span>Secure Comms Channel</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button className="flex-1 bg-[#043E52] hover:bg-[#033040] h-12 text-white font-bold rounded-xl shadow-md">
                  <Navigation className="mr-2 h-5 w-5" /> Secure Directions
                </Button>
                <Button variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600 font-bold rounded-xl">
                  <Phone className="mr-2 h-5 w-5" /> Connect Command
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Crisis Alert Card ---
function CrisisAlertCard({ alert, onAccept, onDecline, onViewDetails, statusType }: any) {
  const timeString = timeAgo(alert.createdAt);
  const distanceMock = "3.2 km (Est.)"; 

  return (
    <Card className={`border-2 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden ${
      alert.severity === 'Critical' && statusType === 'active' ? 'border-[#E16A3D] bg-orange-50/10' :
      statusType === 'accepted' ? 'border-[#1C9290] bg-teal-50/10' :
      'border-slate-200 bg-white'
    }`}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-bold text-[#043E52]">{alert.title}</h3>
              <Badge className={
                alert.severity === 'Critical' ? 'bg-[#E16A3D] hover:bg-[#c2562d]' :
                alert.severity === 'High' ? 'bg-orange-500 hover:bg-orange-600' :
                'bg-yellow-500 hover:bg-yellow-600'
              }>
                {alert.severity.toUpperCase()}
              </Badge>
              {statusType === 'accepted' && (
                <Badge className="bg-[#1C9290] hover:bg-[#157a78]"><CheckCircle className="h-3 w-3 mr-1" /> RESPONDING</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5 text-[#043E52] font-bold">
                <Shield className="h-4 w-4 text-blue-500" />
                {alert.organization}
              </div>
              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {timeString}</div>
              <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {alert.location} • {distanceMock}</div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {alert.description}
            </p>
            
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Required Capabilities</p>
              <div className="flex flex-wrap gap-2">
                {(alert.skillsNeeded || []).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-teal-200 text-teal-700 bg-teal-50/50">
                    <CheckCircle className="h-3 w-3 mr-1 text-teal-500" /> {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
              <Users className="h-4 w-4 text-slate-400" />
              <span>{alert.volunteersResponded} / {alert.volunteersNeeded} Volunteers Activated</span>
            </div>
          </div>
          
          {/* Actions Column */}
          <div className="flex flex-col gap-3 w-full md:w-48 shrink-0 md:pl-6 md:border-l border-slate-100">
            {statusType === 'active' && onAccept && onDecline && (
              <>
                <Button 
                  className="w-full bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold h-12 shadow-md shadow-orange-200"
                  onClick={() => onAccept(alert.id, 'accepted')}
                >
                  <Zap className="mr-2 h-5 w-5" /> Accept Alert
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500 font-bold"
                  onClick={() => onDecline(alert.id, 'declined')}
                >
                  Ignore
                </Button>
              </>
            )}
            
            {statusType === 'accepted' && (
              <>
                <Button className="w-full bg-[#1C9290] hover:bg-[#157a78] font-bold h-12 shadow-md">
                  <Navigation className="mr-2 h-5 w-5" /> Mission Comms
                </Button>
              </>
            )}

            {onViewDetails && (
              <Button 
                variant="ghost"
                className="w-full h-11 text-slate-500 font-bold hover:text-[#043E52] hover:bg-slate-100"
                onClick={() => onViewDetails(alert)}
              >
                Read Full Briefing
              </Button>
            )}
          </div>

        </div>
      </div>
    </Card>
  );
}