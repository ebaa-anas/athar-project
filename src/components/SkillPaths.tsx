import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, onSnapshot, doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Award, Brain, CheckCircle, Heart, Lock, Star, TrendingUp,
  Zap, Trophy, Users, Building2, Clock, BookOpen, ShieldCheck,
  AlertTriangle, Loader2, Download, ShieldAlert
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

// --- OFFICIAL COURSE CATALOG ---
const COURSE_CATALOG = [
  {
    id: '1',
    title: 'Emergency Response Fundamentals',
    category: 'Crisis Management',
    level: 'Beginner',
    totalModules: 8,
    impactPoints: 250,
    estimatedHours: 12,
    icon: AlertTriangle,
    qualifiesForAVR: true,
    description: 'Core protocols for ground-zero emergency response and safety management.'
  },
  {
    id: '4',
    title: 'Medical Assistance Basic',
    category: 'Healthcare',
    level: 'Beginner',
    totalModules: 6,
    impactPoints: 300,
    estimatedHours: 15,
    icon: Heart,
    qualifiesForAVR: true,
    description: 'Ministry-approved basic triage, CPR, and trauma stabilization.'
  },
  {
    id: '2',
    title: 'Psychological First Aid',
    category: 'Mental Health',
    level: 'Intermediate',
    totalModules: 10,
    impactPoints: 400,
    estimatedHours: 20,
    icon: Heart,
    qualifiesForAVR: true,
    prerequisiteId: '1', 
    description: 'Provide immediate mental health support to trauma survivors in crisis zones.'
  },
  {
    id: '6',
    title: 'Crisis Communication Network',
    category: 'Communication',
    level: 'Intermediate',
    totalModules: 10,
    impactPoints: 350,
    estimatedHours: 18,
    icon: Brain,
    qualifiesForAVR: true,
    prerequisiteId: '1', 
    description: 'Operate emergency comms and manage public information flow.'
  },
  {
    id: '5',
    title: 'Logistics & Supply Chain',
    category: 'Crisis Management',
    level: 'Intermediate',
    totalModules: 15,
    impactPoints: 500,
    estimatedHours: 30,
    icon: Building2,
    qualifiesForAVR: false,
    description: 'Manage the distribution of vital resources and relief supplies.'
  },
  {
    id: '3',
    title: 'Incident Command & Coordination',
    category: 'Leadership',
    level: 'Advanced',
    totalModules: 12,
    impactPoints: 600,
    estimatedHours: 25,
    icon: Users,
    qualifiesForAVR: true,
    requiredPoints: 600, 
    prerequisiteId: '1',
    description: 'Lead volunteer battalions and coordinate with state emergency services.'
  }
];

export function SkillPaths() {
  const { user } = useUserProfile();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProgressDb, setUserProgressDb] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setCurrentUser(authUser);
        const q = query(collection(db, "userSkills"), where("userId", "==", authUser.uid));
        
        const unsubSkills = onSnapshot(q, (snapshot) => {
          const progressMap: Record<string, any> = {};
          snapshot.forEach((doc) => {
            progressMap[doc.data().courseId] = doc.data();
          });
          setUserProgressDb(progressMap);
          setLoading(false);
        });

        return () => unsubSkills();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Totaled up front because the lock logic below checks a course's
  // requiredPoints against this running total.
  let totalImpactPoints = 0;
  const completionMap: Record<string, boolean> = {};

  COURSE_CATALOG.forEach(course => {
    const dbRecord = userProgressDb[course.id];
    const progress = dbRecord?.progress || 0;
    completionMap[course.id] = progress === 100;
    
    if (progress === 100) {
      totalImpactPoints += course.impactPoints;
    } else if (progress > 0) {
      totalImpactPoints += Math.floor((course.impactPoints * progress) / 100);
    }
  });

  // Lock checks only run while progress is 0; once a path has been started,
  // it stays unlocked even if requirements would no longer be met.
  const activePaths = COURSE_CATALOG.map(course => {
    const dbRecord = userProgressDb[course.id];
    const completedModules = dbRecord?.completedModules || 0;
    const progress = dbRecord?.progress || 0;
    const completedAt = dbRecord?.completedAt || null;
    const isCompleted = progress === 100;

    let isLocked = false;
    let lockReason = '';

    if (progress === 0) {
      if (course.requiredPoints && totalImpactPoints < course.requiredPoints) {
        isLocked = true;
        lockReason = `Requires ${course.requiredPoints} Impact Points`;
      } else if (course.prerequisiteId && !completionMap[course.prerequisiteId]) {
        isLocked = true;
        const prereqName = COURSE_CATALOG.find(c => c.id === course.prerequisiteId)?.title;
        lockReason = `Requires: ${prereqName}`;
      }
    }
    
    return {
      ...course,
      completedModules,
      progress,
      isCompleted,
      completedAt,
      isLocked,
      lockReason,
      inReserve: course.qualifiesForAVR && isCompleted
    };
  });

  const handleCompleteModule = async (courseId: string) => {
    if (!currentUser) return alert("Please log in to save your training progress.");
    setIsProcessing(courseId);
    
    const course = COURSE_CATALOG.find(c => c.id === courseId);
    if (!course) return;

    const currentCompleted = userProgressDb[courseId]?.completedModules || 0;
    
    if (currentCompleted < course.totalModules) {
      const newCompleted = currentCompleted + 1;
      const newProgress = Math.round((newCompleted / course.totalModules) * 100);
      const isNowFinished = newProgress === 100;

      try {
        const skillDocRef = doc(db, "userSkills", `${currentUser.uid}_${courseId}`);
        const dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const updateData: any = {
          userId: currentUser.uid,
          courseId: courseId,
          completedModules: newCompleted,
          progress: newProgress,
          isCompleted: isNowFinished,
          lastUpdated: serverTimestamp()
        };

        if (isNowFinished) {
          updateData.completedAt = dateString;
        }

        await setDoc(skillDocRef, updateData, { merge: true });

        if (isNowFinished) {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, {
            impactPoints: increment(course.impactPoints),
            verifiedSkills: increment(1)
          });

          // Certificate is stored as its own permanent record, separate from
          // the mutable userSkills progress document.
          const certRef = doc(db, "userCertificates", `${currentUser.uid}_skill_${courseId}`);
          await setDoc(certRef, {
            userId: currentUser.uid,
            sourceId: courseId,
            title: course.title,
            type: 'Skill Path Mastery',
            category: course.category,
            impactPoints: course.impactPoints,
            earnedAt: serverTimestamp(),
            dateString: dateString
          });
        }

      } catch (error) {
        console.error("Error saving progress:", error);
        alert("Failed to save progress to database.");
      }
    }
    setIsProcessing(null);
  };

  // Certificates are generated by writing a full HTML document into a hidden
  // iframe and invoking the browser print dialog, instead of building a PDF client-side.
  const handleDownloadCertificate = (courseId: string, courseTitle: string, dateAwarded: string) => {
    setIsGeneratingCert(courseId);
    
    setTimeout(() => {
      const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Athar Volunteer";

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Skill Mastery - ${courseTitle}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Inter:wght@400;600;800&display=swap');
                
                body {
                  margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
                  width: 11in; height: 8.5in;
                  font-family: 'Inter', sans-serif;
                  background-color: #f8fafc;
                  -webkit-print-color-adjust: exact;
                }
                
                .certificate-container {
                  width: 10.5in; height: 8in;
                  background: white;
                  border: 12px solid #016A6D;
                  outline: 4px solid #1C9290;
                  outline-offset: -20px;
                  padding: 50px;
                  box-sizing: border-box;
                  text-align: center;
                  position: relative;
                  background-image: radial-gradient(#016A6D 0.5px, transparent 0.5px), radial-gradient(#016A6D 0.5px, #ffffff 0.5px);
                  background-size: 20px 20px;
                  background-position: 0 0, 10px 10px;
                  background-color: white;
                }

                .inner-content {
                  background: rgba(255,255,255,0.95);
                  width: 100%; height: 100%;
                  display: flex; flex-direction: column; justify-content: center; align-items: center;
                }

                .logo { font-size: 32px; font-weight: 900; color: #016A6D; letter-spacing: -1px; text-transform: uppercase; margin-top: 20px; margin-bottom: 30px;}
                .logo span { color: #1C9290; }
                
                .title { font-family: 'Cinzel', serif; font-size: 52px; font-weight: 900; color: #016A6D; letter-spacing: 4px; margin: 0; text-transform: uppercase; }
                .subtitle { font-size: 16px; color: #E16A3D; letter-spacing: 3px; font-weight: 800; text-transform: uppercase; margin-top: 10px; margin-bottom: 50px; }
                
                .presented-to { font-size: 18px; color: #64748b; margin-bottom: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;}
                .name { font-family: 'Cinzel', serif; font-size: 56px; font-weight: 700; color: #016A6D; margin: 0; border-bottom: 2px solid #e2e8f0; display: inline-block; padding: 0 50px 10px; min-width: 60%; line-height: 1.2; }
                
                .for-completion { font-size: 16px; color: #64748b; margin-top: 30px; margin-bottom: 15px; max-width: 70%; line-height: 1.6;}
                .course-name { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 700; color: #016A6D; margin: 0; padding: 0 40px; }
                
                .footer { display: flex; justify-content: space-between; align-items: flex-end; position: absolute; bottom: 50px; left: 80px; right: 80px; width: calc(100% - 160px); }
                
                .signature-block, .date-block { text-align: center; }
                .signature, .date { font-family: 'Cinzel', cursive; font-size: 24px; font-weight: 700; color: #016A6D; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 8px; width: 250px; }
                .date { font-family: 'Inter', sans-serif; font-size: 20px;}
                .title-role { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; }
                
                .badge { position: absolute; top: 50px; right: 50px; width: 110px; height: 110px; background: #E16A3D; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; font-weight: 900; text-transform: uppercase; font-size: 14px; text-align: center; box-shadow: 0 10px 25px -5px rgba(225, 106, 61, 0.4); outline: 4px dashed white; outline-offset: -6px;}
                .badge-sub { font-size: 9px; font-weight: 600; letter-spacing: 1px; opacity: 0.9; margin-top: 4px;}

                @media print {
                  @page { size: landscape; margin: 0; }
                  body { background: white; }
                  .certificate-container { border: 12px solid #016A6D !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="certificate-container">
                <div class="inner-content">
                  <div class="badge">Official<br/><span class="badge-sub">Skill Mastery</span></div>
                  <div class="logo">Athar <span>Academy</span></div>
                  <h1 class="title">Skill Path Mastery</h1>
                  <p class="subtitle">Official Volunteer Readiness Program</p>

                  <p class="presented-to">This is proudly presented to</p>
                  <h2 class="name">${userName}</h2>

                  <p class="for-completion">for demonstrating expert proficiency and completing all field training requirements for the curriculum:</p>
                  <h3 class="course-name">${courseTitle}</h3>

                  <div class="footer">
                    <div class="date-block">
                      <div class="date">${dateAwarded}</div>
                      <div class="title-role">Date of Issuance</div>
                    </div>
                    <div class="signature-block">
                      <div class="signature">Athar Command</div>
                      <div class="title-role">Director of Readiness</div>
                    </div>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          setTimeout(() => {
            document.body.removeChild(iframe);
            setIsGeneratingCert(null);
          }, 1000);
        }, 1000); 
      }
    }, 100);
  };

  const completedPaths = activePaths.filter(p => p.isCompleted);
  const reserveSkills = activePaths.filter(path => path.inReserve);

  const isVerified = user?.verificationStatus === 'verified';

  if (loading) {
    return <div className="p-12 text-center text-[#1C9290] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Loading Secure Curriculum...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-7xl mx-auto">
      {/* Header - Refined Typography */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[#016A6D] font-bold text-2xl tracking-tight">Athar Training Academy</h1>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none shadow-sm uppercase tracking-wider text-[10px] font-bold px-2 py-0.5">Gov Approved</Badge>
        </div>
        <p className="text-slate-500 text-sm">
          Build verified skills through official curriculums. Complete modules to secure your clearance in the Athar Volunteer Reserve (AVR).
        </p>
      </div>

      {!isVerified && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="text-red-800 font-bold text-sm">Identity Verification Required</h4>
              <p className="text-red-600 text-xs font-medium">You must verify your identity in your profile before enrolling in any official training paths.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Cleaner, smaller fonts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-[#1C9290]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Impact Points</p>
                <p className="text-2xl font-bold text-[#1C9290]">{totalImpactPoints}</p>
              </div>
              <div className="bg-teal-50 p-2.5 rounded-lg">
                <Star className="h-5 w-5 text-[#1C9290]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Certifications</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {completedPaths.length}<span className="text-base text-slate-400">/{activePaths.length}</span>
                </p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-blue-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">AVR Clearances</p>
                <p className="text-2xl font-bold text-blue-700">{reserveSkills.length}</p>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-[#016A6D]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Clearance Level</p>
                <p className="text-lg font-bold text-[#016A6D] mt-1 leading-none uppercase">Tier 2</p>
                <p className="text-xs text-slate-500 mt-1">Intermediate</p>
              </div>
              <div className="bg-[#016A6D]/10 p-2.5 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[#016A6D]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reserve Status Banner - Sleeker Design */}
      {reserveSkills.length > 0 && (
        <Card className="border border-teal-200 shadow-sm bg-teal-50">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="bg-[#1C9290] text-white p-3 rounded-xl shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#043E52] text-lg font-bold mb-1">Official AVR Status: Active</h3>
                <p className="text-slate-600 text-sm mb-3">
                  You have been cleared for deployment. Verified partners can now activate you for field operations.
                </p>
                <div className="flex flex-wrap gap-2">
                  {reserveSkills.map(skill => (
                    <Badge key={skill.id} className="bg-[#1C9290] text-white hover:bg-[#157a78] border-none px-2.5 py-0.5 font-semibold text-xs">
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      {skill.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Paths Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg w-full md:w-auto flex flex-wrap justify-start mb-6">
          <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-4 py-2 font-bold text-xs">All Paths ({activePaths.length})</TabsTrigger>
          <TabsTrigger value="in-progress" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-4 py-2 font-bold text-xs">In Progress ({activePaths.filter(p => p.progress > 0 && !p.isCompleted).length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-4 py-2 font-bold text-xs">Completed ({completedPaths.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {activePaths.map((path) => (
              <SkillPathCard key={path.id} path={path} onComplete={handleCompleteModule} isProcessing={isProcessing === path.id} onDownloadCert={handleDownloadCertificate} isGeneratingCert={isGeneratingCert === path.id} isVerified={isVerified} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {activePaths.filter(p => p.progress > 0 && !p.isCompleted).map((path) => (
              <SkillPathCard key={path.id} path={path} onComplete={handleCompleteModule} isProcessing={isProcessing === path.id} onDownloadCert={handleDownloadCertificate} isGeneratingCert={isGeneratingCert === path.id} isVerified={isVerified} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {completedPaths.map((path) => (
              <SkillPathCard key={path.id} path={path} onComplete={handleCompleteModule} isProcessing={isProcessing === path.id} onDownloadCert={handleDownloadCertificate} isGeneratingCert={isGeneratingCert === path.id} isVerified={isVerified} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- REFINED CHILD COMPONENT ---
function SkillPathCard({ path, onComplete, isProcessing, onDownloadCert, isGeneratingCert, isVerified }: { path: any, onComplete: (id: string) => void, isProcessing: boolean, onDownloadCert: (id: string, title: string, date: string) => void, isGeneratingCert: boolean, isVerified: boolean }) {
  const Icon = path.icon;
  const isComplete = path.isCompleted;
  
  return (
    <Card className={`overflow-hidden transition-all border ${
        isComplete ? 'border-emerald-200 bg-emerald-50/50' : 
        (path.isLocked || !isVerified) ? 'border-slate-200 bg-slate-50 opacity-80' : 
        'border-slate-200 bg-white hover:border-[#1C9290]/40'
    }`}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch">
          
          <div className={`p-5 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 min-w-[100px] ${
              isComplete ? 'bg-emerald-100/50' :
              (path.isLocked || !isVerified) ? 'bg-slate-200/50' :
              'bg-slate-50'
          }`}>
            {isComplete ? (
              <Trophy className="h-8 w-8 text-emerald-600" />
            ) : (path.isLocked || !isVerified) ? (
              <Lock className="h-8 w-8 text-slate-400" />
            ) : (
              <Icon className="h-8 w-8 text-[#043E52]" />
            )}
          </div>

          <div className="flex-1 p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`font-bold text-lg ${(path.isLocked || !isVerified) && !isComplete ? 'text-slate-500' : 'text-[#043E52]'}`}>{path.title}</h3>
                  {path.qualifiesForAVR && !isComplete && (
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">AVR Eligible</Badge>
                  )}
                  {isComplete && (
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5"><CheckCircle className="h-3 w-3 mr-1" /> Certified</Badge>
                  )}
                </div>
                
                <p className="text-sm text-slate-500 max-w-2xl">{path.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 font-semibold text-[10px] uppercase tracking-wider">{path.category}</Badge>
                  <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 font-semibold text-[10px] uppercase tracking-wider">{path.level}</Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-semibold text-[10px] uppercase tracking-wider">
                    <Star className="h-3 w-3 mr-1" /> {path.impactPoints} points
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-semibold text-[10px] uppercase tracking-wider">
                    <Clock className="h-3 w-3 mr-1" /> {path.estimatedHours}h
                  </Badge>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col items-start md:items-end justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                {(!path.isLocked && !isComplete && isVerified) && (
                  <div className="w-full space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Module {path.completedModules}/{path.totalModules}</span>
                      <span className="text-[#1C9290]">{path.progress}%</span>
                    </div>
                    <Progress value={path.progress} className="h-2 bg-slate-100 [&>div]:bg-[#1C9290]" />
                  </div>
                )}

                {isComplete ? (
                  <Button 
                    variant="outline" 
                    onClick={() => onDownloadCert(path.id, path.title, path.completedAt || new Date().toLocaleDateString())}
                    disabled={isGeneratingCert}
                    className="w-full border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs h-10"
                  >
                    {isGeneratingCert ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isGeneratingCert ? 'Generating PDF...' : 'Download Certificate'}
                  </Button>
                ) : !isVerified ? (
                  <div className="w-full text-center">
                    <Button disabled variant="outline" className="w-full font-bold text-xs h-10 border-slate-200 bg-slate-100 text-slate-400">
                      <Lock className="mr-2 h-3.5 w-3.5" /> Locked
                    </Button>
                    <p className="text-[10px] font-bold text-red-500 mt-2 text-center uppercase tracking-wider">ID Verification Required</p>
                  </div>
                ) : path.isLocked ? (
                  // Locked due to unmet points/prerequisite requirement, as opposed to unverified identity above
                  <div className="w-full text-center">
                    <Button disabled variant="outline" className="w-full font-bold text-xs h-10 border-slate-200 bg-slate-100 text-slate-400">
                      <Lock className="mr-2 h-3.5 w-3.5" /> Locked
                    </Button>
                    <p className="text-[10px] font-bold text-red-500 mt-2 text-center uppercase tracking-wider">{path.lockReason}</p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => onComplete(path.id)}
                    disabled={isProcessing}
                    className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white font-bold text-xs h-10 transition-colors"
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                    {path.progress === 0 ? 'Start Course' : 'Complete Module'}
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}