import { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../lib/firebase';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Clock, BookOpen, Award, Play, CheckCircle, PlusCircle, Loader2, Download, ShieldAlert, Lock } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

// --- OFFICIAL COURSE CATALOG ---
const COURSE_CATALOG = [
  {
    id: 'c1',
    title: 'Volunteer Leadership Training',
    description: 'Develop essential leadership skills for effective volunteer coordination in the field.',
    instructor: 'Sarah Johnson, AVR Commander',
    image: 'https://images.unsplash.com/photo-1648254333845-54e0ecba1123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    totalLessons: 10,
    duration: '8 hours',
    category: 'Leadership',
    students: 1240,
    rating: 4.9
  },
  {
    id: 'c2',
    title: 'Community Engagement Fundamentals',
    description: 'Learn best practices for engaging with and supporting local communities during recovery.',
    instructor: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1758599668125-e154250f24bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    totalLessons: 8,
    duration: '10 hours',
    category: 'Community',
    students: 890,
    rating: 4.7
  },
  {
    id: 'c3',
    title: 'Environmental Conservation Basics',
    description: 'Understanding key principles of environmental protection and post-disaster cleanup.',
    instructor: 'Dr. Emily Green',
    image: 'https://images.unsplash.com/photo-1624858194621-92e3efffe22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    totalLessons: 12,
    duration: '6 hours',
    category: 'Environment',
    students: 234,
    rating: 4.8
  },
  {
    id: 'c4',
    title: 'Nonprofit Management Essentials',
    description: 'Core concepts and strategies for effective NGO organization and supply management.',
    instructor: 'James Wilson',
    image: 'https://images.unsplash.com/photo-1518818608552-195ed130cdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    totalLessons: 15,
    duration: '9 hours',
    category: 'Management',
    students: 189,
    rating: 4.9
  },
  {
    id: 'c5',
    title: 'Youth Mentorship Skills',
    description: 'Techniques and trauma-informed approaches for mentoring young people effectively.',
    instructor: 'Amanda Rodriguez',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    totalLessons: 6,
    duration: '5 hours',
    category: 'Education',
    students: 156,
    rating: 4.7
  }
];

export function Courses() {
  const { user } = useUserProfile();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCoursesDb, setUserCoursesDb] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setCurrentUser(authUser);
        const q = query(collection(db, "userCourses"), where("userId", "==", authUser.uid));
        
        const unsubCourses = onSnapshot(q, (snapshot) => {
          const courseMap: Record<string, any> = {};
          snapshot.forEach((doc) => {
            courseMap[doc.data().courseId] = doc.data();
          });
          setUserCoursesDb(courseMap);
          setLoading(false);
        });

        return () => unsubCourses();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleEnroll = async (courseId: string) => {
    if (!currentUser) return alert("Please log in to enroll.");
    setProcessingId(courseId);

    try {
      const docRef = doc(db, "userCourses", `${currentUser.uid}_${courseId}`);
      await setDoc(docRef, {
        userId: currentUser.uid,
        courseId: courseId,
        status: 'enrolled',
        completedLessons: 0,
        progress: 0,
        enrolledAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Enrollment failed:", error);
      alert("Failed to enroll in the course.");
    }
    setProcessingId(null);
  };

  const handleContinueLearning = async (courseId: string, currentCompleted: number, totalLessons: number) => {
    if (!currentUser) return;
    setProcessingId(courseId);

    try {
      const newCompleted = currentCompleted + 1;
      const newProgress = Math.round((newCompleted / totalLessons) * 100);
      const isFinished = newProgress === 100;

      const docRef = doc(db, "userCourses", `${currentUser.uid}_${courseId}`);
      
      const updateData: any = {
        completedLessons: newCompleted,
        progress: newProgress,
      };

      if (isFinished) {
        updateData.status = 'completed';
        updateData.completedAt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }

      await setDoc(docRef, updateData, { merge: true });
      
    } catch (error) {
      console.error("Progress update failed:", error);
    }
    
    setTimeout(() => setProcessingId(null), 400);
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
              <title>Certificate - ${courseTitle}</title>
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
                .course-name { font-family: 'Cinzel', serif; font-size: 36px; font-weight: 700; color: #016A6D; margin: 0; padding: 0 40px; }
                
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
                  <div class="badge">Official<br/><span class="badge-sub">AVR Certified</span></div>
                  <div class="logo">Athar <span>Academy</span></div>
                  <h1 class="title">Certificate of Mastery</h1>
                  <p class="subtitle">Official Volunteer Readiness Program</p>

                  <p class="presented-to">This is proudly presented to</p>
                  <h2 class="name">${userName}</h2>

                  <p class="for-completion">for successfully mastering the curriculum and fulfilling all operational requirements for the training track:</p>
                  <h3 class="course-name">${courseTitle}</h3>

                  <div class="footer">
                    <div class="date-block">
                      <div class="date">${dateAwarded}</div>
                      <div class="title-role">Date of Issuance</div>
                    </div>
                    <div class="signature-block">
                      <div class="signature">Athar Command</div>
                      <div class="title-role">Director of Field Operations</div>
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

  const enrolledCourses = COURSE_CATALOG.filter(c => userCoursesDb[c.id]?.status === 'enrolled').map(c => ({
    ...c,
    completedLessons: userCoursesDb[c.id].completedLessons,
    progress: userCoursesDb[c.id].progress
  }));

  const completedCourses = COURSE_CATALOG.filter(c => userCoursesDb[c.id]?.status === 'completed').map(c => ({
    ...c,
    completedDate: userCoursesDb[c.id].completedAt || new Date().toLocaleDateString(),
    certificate: true
  }));

  const availableCourses = COURSE_CATALOG.filter(c => !userCoursesDb[c.id]);

  const isVerified = user?.verificationStatus === 'verified';

  if (loading) {
    return <div className="p-12 text-center text-role-accent-teal font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Loading Course Catalog...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-slate-900 font-bold text-3xl tracking-tight">Courses & Certification</h1>
        </div>
        <p className="text-slate-500 text-sm font-medium">
          Enhance your skills, earn official certifications, and prepare for field deployment.
        </p>
      </div>

      {!isVerified && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="text-red-800 font-bold text-sm">Identity Verification Required</h4>
              <p className="text-red-600 text-xs font-medium">You must verify your identity in your profile before enrolling in any official Academy courses.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- MY LEARNING SECTION --- */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="h-1.5 w-full bg-brand-cta" />
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-cta" /> My Learning
          </CardTitle>
          <CardDescription className="font-semibold text-xs text-slate-500">Continue where you left off to earn your certificates.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {enrolledCourses.length === 0 ? (
             <div className="text-center py-8">
               <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                 <BookOpen className="h-8 w-8 text-slate-300" />
               </div>
               <p className="text-slate-500 font-bold text-sm">You haven't enrolled in any courses yet.</p>
               <p className="text-slate-400 text-xs mt-1">Explore the catalog below to get started.</p>
             </div>
          ) : (
            <div className="space-y-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="flex flex-col md:flex-row gap-6 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full md:w-48 h-32 object-cover rounded-xl shadow-sm"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <h3 className="text-slate-900 font-black text-lg leading-tight">{course.title}</h3>
                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider">{course.category}</Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-500 mb-4">{course.description}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-role-accent-teal" />
                          <span>{course.completedLessons}/{course.totalLessons} Modules</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-brand-cta" />
                          <span>{course.duration}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-500">Course Progress</span>
                            <span className="text-role-accent-teal">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2.5 bg-slate-200 [&>div]:bg-role-accent-teal" />
                        </div>
                        <Button 
                          onClick={() => handleContinueLearning(course.id, course.completedLessons, course.totalLessons)}
                          disabled={processingId === course.id}
                          className="w-full md:w-auto bg-role-accent-teal hover:bg-role-accent-teal/80 text-white font-bold text-xs uppercase tracking-wider h-10 shadow-sm shrink-0"
                        >
                          {processingId === course.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                          Complete Next Module
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {completedCourses.length > 0 && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <div className="h-1.5 w-full bg-role-volunteer" />
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-role-volunteer" /> Completed Certifications
            </CardTitle>
            <CardDescription className="font-semibold text-xs text-slate-500">Your verified achievements. Download your official PDF certificates below.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {completedCourses.map((course) => (
                <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-role-volunteer/30 bg-role-volunteer/5 rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="bg-role-volunteer p-3 rounded-full shadow-sm shrink-0">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-black text-lg">{course.title}</h4>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Awarded: {course.completedDate}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleDownloadCertificate(course.id, course.title, course.completedDate)}
                    disabled={isGeneratingCert === course.id}
                    className="w-full sm:w-auto bg-white border-2 border-role-volunteer text-role-volunteer hover:bg-role-volunteer/10 hover:text-role-volunteer font-black text-xs uppercase tracking-wider h-11 px-6 shadow-sm"
                  >
                    {isGeneratingCert === course.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isGeneratingCert === course.id ? 'Generating PDF...' : 'Download Certificate'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- AVAILABLE COURSES CATALOG --- */}
      <div>
        <div className="flex items-center gap-2 mb-6 mt-10">
          <h2 className="text-slate-900 font-bold text-2xl tracking-tight">Explore the Catalog</h2>
          <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase tracking-widest">{availableCourses.length} Available</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200 bg-white flex flex-col group">
              <div className="h-48 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className="absolute top-4 right-4 z-20 bg-white/90 text-role-volunteer border-none font-black text-[10px] uppercase tracking-widest backdrop-blur-sm">
                  {course.category}
                </Badge>
              </div>
              <CardHeader className="pb-3 flex-1">
                <CardTitle className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-role-accent-teal transition-colors">{course.title}</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500 line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 shrink-0">
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Instructor: <span className="text-role-volunteer">{course.instructor}</span></p>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-role-accent-teal" />
                      <span>{course.totalLessons} Modules</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-brand-cta" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </div>
                
                {/* Enrollment stays locked until identity verification is complete */}
                {!isVerified ? (
                  <div className="w-full text-center">
                    <Button disabled variant="outline" className="w-full font-bold text-xs uppercase tracking-wider h-11 border-slate-200 bg-slate-100 text-slate-400">
                      <Lock className="mr-2 h-4 w-4" /> Locked
                    </Button>
                    <p className="text-[10px] font-bold text-red-500 mt-2 text-center uppercase tracking-wider">ID Verification Required</p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleEnroll(course.id)}
                    disabled={processingId === course.id}
                    className="w-full bg-role-volunteer hover:bg-role-volunteer-dark text-white font-bold text-xs uppercase tracking-wider h-11 shadow-sm"
                  >
                    {processingId === course.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Enroll in Course
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          
          {availableCourses.length === 0 && (
             <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
               <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
               <p className="text-slate-500 font-bold text-sm">You've enrolled in every available course!</p>
               <p className="text-slate-400 text-xs mt-1">Check back later for new curriculum additions.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}