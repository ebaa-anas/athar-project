import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Award, Download, Share2, Calendar, CheckCircle, Clock, 
  ExternalLink, Loader2, Sparkles, Target, Zap
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

// --- CATALOG MAPS (To pull titles and points based on IDs) ---
const COURSE_CATALOG: Record<string, any> = {
  'c1': { title: 'Volunteer Leadership Training', category: 'Leadership', points: 150 },
  'c2': { title: 'Community Engagement Fundamentals', category: 'Community', points: 100 },
  'c3': { title: 'Environmental Conservation Basics', category: 'Environment', points: 120 },
  'c4': { title: 'Nonprofit Management Essentials', category: 'Management', points: 200 },
  'c5': { title: 'Youth Mentorship Skills', category: 'Education', points: 130 }
};

const SKILL_CATALOG: Record<string, any> = {
  '1': { title: 'Emergency Response Fundamentals', category: 'Crisis Management', points: 250 },
  '4': { title: 'Medical Assistance Basic', category: 'Healthcare', points: 300 },
  '2': { title: 'Psychological First Aid', category: 'Mental Health', points: 400 },
  '6': { title: 'Crisis Communication Network', category: 'Communication', points: 350 },
  '5': { title: 'Logistics & Supply Chain', category: 'Crisis Management', points: 500 },
  '3': { title: 'Incident Command & Coordination', category: 'Leadership', points: 600 }
};

// --- STATIC ACHIEVEMENTS ---
const achievements = [
  { id: 1, title: 'Early Bird', description: 'Completed first volunteer activity within 24 hours of signing up', earnedDate: 'Recent', icon: '🚀' },
  { id: 2, title: 'Community Champion', description: 'Consistently engaged with platform training modules', earnedDate: 'Recent', icon: '🏆' }
];

export function Certificates() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [earnedCerts, setEarnedCerts] = useState<any[]>([]);
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingCert, setIsGeneratingCert] = useState<string | null>(null);

  // --- Real-time Firestore sync ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);

        const qCourses = query(collection(db, "userCourses"), where("userId", "==", user.uid));
        const unsubCourses = onSnapshot(qCourses, (snapshot) => {
          const coursesList: any[] = [];
          const pendingList: any[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const catalogInfo = COURSE_CATALOG[data.courseId];
            
            if (data.status === 'completed' && catalogInfo) {
              coursesList.push({
                id: doc.id,
                title: catalogInfo.title,
                type: 'Course Certification',
                category: catalogInfo.category,
                impactPoints: catalogInfo.points,
                dateString: data.completedAt || new Date().toLocaleDateString(),
                timestamp: data.enrolledAt?.toMillis() || Date.now()
              });
            } else if (data.status === 'enrolled' && catalogInfo) {
              pendingList.push({
                id: doc.id,
                title: catalogInfo.title,
                progress: data.progress,
                ...data
              });
            }
          });

          const qSkills = query(collection(db, "userSkills"), where("userId", "==", user.uid));
          const unsubSkills = onSnapshot(qSkills, (skillSnap) => {
            const skillsList: any[] = [];
            skillSnap.forEach((doc) => {
              const data = doc.data();
              const catalogInfo = SKILL_CATALOG[data.courseId];
              
              if (data.isCompleted && catalogInfo) {
                skillsList.push({
                  id: doc.id,
                  title: catalogInfo.title,
                  type: 'Skill Path Mastery',
                  category: catalogInfo.category,
                  impactPoints: catalogInfo.points,
                  dateString: data.completedAt || new Date().toLocaleDateString(),
                  timestamp: data.lastUpdated?.toMillis() || Date.now()
                });
              }
            });

            const combinedCerts = [...coursesList, ...skillsList].sort((a, b) => b.timestamp - a.timestamp);
            setEarnedCerts(combinedCerts);
            setPendingCourses(pendingList);
            setLoading(false);
          });

          return () => unsubSkills();
        });

        return () => unsubCourses();
      } else {
        setCurrentUser(null);
        setEarnedCerts([]);
        setPendingCourses([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- Certificate PDF generation ---
  const handleDownloadCertificate = (certId: string, title: string, type: string, dateAwarded: string) => {
    setIsGeneratingCert(certId);
    
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
              <title>${type} - ${title}</title>
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
                  <div class="badge">Official<br/><span class="badge-sub">Credential</span></div>
                  <div class="logo">Athar <span>Academy</span></div>
                  <h1 class="title">${type}</h1>
                  <p class="subtitle">Official Volunteer Readiness Program</p>

                  <p class="presented-to">This is proudly presented to</p>
                  <h2 class="name">${userName}</h2>

                  <p class="for-completion">for successfully mastering the curriculum and fulfilling all operational requirements for:</p>
                  <h3 class="course-name">${title}</h3>

                  <div class="footer">
                    <div class="date-block">
                      <div class="date">${dateAwarded}</div>
                      <div class="title-role">Date of Issuance</div>
                    </div>
                    <div class="signature-block">
                      <div class="signature">Athar Command</div>
                      <div class="title-role">Director of Operations</div>
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

  if (loading) {
    return <div className="p-12 text-center text-role-volunteer font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Synchronizing Ledger...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-slate-900 font-bold text-3xl tracking-tight">Credentials & Achievements</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage your verified certifications, skills, and platform milestones.</p>
        </div>
        <Button className="bg-role-volunteer hover:bg-role-volunteer-dark text-white font-bold text-xs uppercase tracking-wider h-10 shadow-sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share Portfolio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Certificates</p>
                <p className="text-2xl font-bold text-emerald-600">{earnedCerts.length}</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg"><Award className="h-5 w-5 text-emerald-500" /></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-brand-cta">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-brand-cta">{pendingCourses.length}</p>
              </div>
              <div className="bg-brand-cta/10 p-2.5 rounded-lg"><Clock className="h-5 w-5 text-brand-cta" /></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Achievements</p>
                <p className="text-2xl font-bold text-amber-600">{achievements.length}</p>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-lg"><Target className="h-5 w-5 text-amber-500" /></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-role-accent-teal">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</p>
                <p className="text-xl font-bold text-role-accent-teal leading-none mt-1">Verified</p>
              </div>
              <div className="bg-teal-50 p-2.5 rounded-lg"><CheckCircle className="h-5 w-5 text-role-accent-teal" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="earned" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg flex flex-wrap w-full md:w-auto justify-start mb-6">
          <TabsTrigger value="earned" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-role-volunteer data-[state=active]:shadow-sm px-5 py-2 font-bold text-xs uppercase tracking-wider">Earned Credentials ({earnedCerts.length})</TabsTrigger>
          <TabsTrigger value="in-progress" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-role-volunteer data-[state=active]:shadow-sm px-5 py-2 font-bold text-xs uppercase tracking-wider">In Progress ({pendingCourses.length})</TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-role-volunteer data-[state=active]:shadow-sm px-5 py-2 font-bold text-xs uppercase tracking-wider">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-6">
          {earnedCerts.length === 0 ? (
             <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
               <Award className="h-16 w-16 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 font-bold text-lg">Your Trophy Room is Empty</p>
               <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">Complete Skill Paths or Academy Courses to earn your first official government-verified certificate.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {earnedCerts.map((cert) => (
                <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200 bg-white group">
                  <CardHeader className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border-b border-slate-100 pb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        <Award className="h-8 w-8 text-role-accent-teal" />
                      </div>
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 shadow-sm">
                        <CheckCircle className="mr-1.5 h-3 w-3" /> Verified
                      </Badge>
                    </div>
                    <CardTitle className="mt-5 text-xl font-black text-role-volunteer leading-tight">{cert.title}</CardTitle>
                    <CardDescription className="text-role-accent-teal font-bold text-xs uppercase tracking-widest">{cert.type}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <Calendar className="h-4 w-4 text-brand-cta" />
                        <span>Issued: {cert.dateString}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>Impact Earned: {cert.impactPoints} pts</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                      <Button 
                        onClick={() => handleDownloadCertificate(cert.id, cert.title, cert.type, cert.dateString)}
                        disabled={isGeneratingCert === cert.id}
                        className="flex-1 bg-role-volunteer hover:bg-role-volunteer-dark text-white font-bold text-xs uppercase tracking-wider h-10 shadow-sm"
                      >
                        {isGeneratingCert === cert.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download
                      </Button>
                      <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider h-10">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          {pendingCourses.length === 0 ? (
             <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
               <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 font-bold text-lg">No Active Training</p>
               <p className="text-slate-400 text-sm mt-2">You don't have any unfinished courses in your queue.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingCourses.map((cert) => (
                <Card key={cert.id} className="border-slate-200 shadow-sm bg-white hover:border-brand-cta/30 transition-colors">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="bg-brand-cta/10 p-3 rounded-xl border border-brand-cta/20">
                        <Clock className="h-6 w-6 text-brand-cta" />
                      </div>
                      <div className="flex-1 pt-1">
                        <CardTitle className="text-base font-bold text-role-volunteer">{cert.title}</CardTitle>
                        <CardDescription className="text-xs font-semibold mt-1">Athar Training Academy</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>Progress</span>
                        <span className="text-brand-cta">{cert.progress}%</span>
                      </div>
                      <Progress value={cert.progress} className="h-2 bg-slate-100 [&>div]:bg-brand-cta" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-bold text-slate-500">
                      <span>Status</span>
                      <span className="text-role-volunteer uppercase tracking-widest">Enrolled</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Milestones / Achievements */}
        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200 bg-white">
                <CardContent className="p-8 text-center flex flex-col items-center">
                  <div className="text-6xl mb-5 drop-shadow-md">{achievement.icon}</div>
                  <h3 className="text-role-volunteer font-black text-lg mb-2">{achievement.title}</h3>
                  <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">{achievement.description}</p>
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 w-full">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>{achievement.earnedDate}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}