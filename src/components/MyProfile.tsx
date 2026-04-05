import { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, 
  Edit, Save, X, Plus, Trash2, CheckCircle, Pencil,
  Heart, AlertTriangle, Droplet, Car, PhoneCall, Clock, CalendarRange, Laptop,
  Camera, Loader2, Download, Award, Zap, ShieldAlert, ShieldCheck, Lock
} from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { updateVolunteerProfile } from '../lib/authService';

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

// --- CATALOG MAPS ---
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

// --- DATA INTERFACES ---
interface Experience { id: string; title: string; organization: string; location: string; startDate: string; endDate: string; current: boolean; description: string; }
interface Education { id: string; level: string; fieldOfStudy: string; institution: string; gradYear: string; current: boolean; }
interface Language { name: string; proficiency: string; }
interface Certificate { id: string; title: string; type: string; category: string; impactPoints: number; dateString: string; timestamp: number; }

const AVAILABLE_INTERESTS = [
  "Disaster Relief", "Youth Education", "Environment", "Healthcare", 
  "Tech for Good", "Food Security", "Animal Welfare", "Elderly Care"
];

const EDUCATION_LEVELS = [
  "High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate (PhD)", "Diploma/Certificate"
];

const formatNiceDate = (dateStr: string) => {
  if (!dateStr) return '';
  if (/^\d{4}$/.test(dateStr)) return dateStr; 
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return dateStr;
};

export function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, loading } = useUserProfile();
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 🔥 HIGH SECURITY VERIFICATION STATE 🔥 ---
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);
  const [verifyData, setVerifyData] = useState({
    residencyType: 'citizen', // 'citizen' | 'foreigner'
    legalName: '',
    idNumber: '',
    birthYear: ''
  });

  // --- 1. CORE STATE ---
  const [profileData, setProfileData] = useState({
    fullName: '', email: '', phone: '', dateOfBirth: '',
    address: '', city: '', state: '', zipCode: '', country: '',
    bio: '', linkedIn: '', website: '', photoUrl: '', avatarUrl: '',
    verificationStatus: 'unverified' 
  });

  // --- 2. LISTS & OBJECT STATES ---
  const [skills, setSkills] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]); 
  const [educations, setEducations] = useState<Education[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [earnedCerts, setEarnedCerts] = useState<Certificate[]>([]);
  
  const [availability, setAvailability] = useState({ weekdays: false, weekends: false, hours: '5-10 hours', format: 'Flexible' });
  const [crisisInfo, setCrisisInfo] = useState({ bloodType: '', drivingLicense: false, emergencyName: '', emergencyRelation: '', emergencyPhone: '' });

  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newProficiency, setNewProficiency] = useState("Native");
  
  const [activeExp, setActiveExp] = useState<Experience | null>(null);
  const [activeEdu, setActiveEdu] = useState<Education | null>(null);

  // --- 4. FETCH FROM FIREBASE ---
  useEffect(() => {
    if (user) {
      const userData = user as any;

      setProfileData({
        fullName: userData.name || userData.displayName || '', 
        email: userData.email || '', 
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '', 
        address: userData.address || '', 
        city: userData.city || '',
        state: userData.state || '', 
        zipCode: userData.zipCode || '', 
        country: userData.country || '',
        bio: userData.bio || '', 
        linkedIn: userData.linkedIn || '', 
        website: userData.website || '',
        photoUrl: userData.photoUrl || userData.avatarUrl || '',
        verificationStatus: userData.verificationStatus || 'unverified'
      });
      setSkills(userData.skills || []);
      setExperiences(userData.experiences || []);
      setEducations(userData.educations || []);
      setLanguages(userData.languages || []);
      setInterests(userData.interests || []);
      setAvailability(userData.availability || { weekdays: false, weekends: false, hours: '5-10 hours', format: 'Flexible' });
      setCrisisInfo({
        bloodType: userData.crisisInfo?.bloodType || '', 
        drivingLicense: userData.crisisInfo?.drivingLicense || false,
        emergencyName: userData.crisisInfo?.emergencyName || userData.crisisInfo?.emergencyContact || '',
        emergencyRelation: userData.crisisInfo?.emergencyRelation || '', 
        emergencyPhone: userData.crisisInfo?.emergencyPhone || ''
      });

      const qCourses = query(collection(db, "userCourses"), where("userId", "==", user.uid));
      const unsubCourses = onSnapshot(qCourses, (snapshot) => {
        const coursesList: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const catalogInfo = COURSE_CATALOG[data.courseId];
          if (data.status === 'completed' && catalogInfo) {
            coursesList.push({
              id: doc.id, title: catalogInfo.title, type: 'Course Certification',
              category: catalogInfo.category, impactPoints: catalogInfo.points,
              dateString: data.completedAt || new Date().toLocaleDateString(),
              timestamp: data.enrolledAt?.toMillis() || Date.now()
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
                id: doc.id, title: catalogInfo.title, type: 'Skill Path Mastery',
                category: catalogInfo.category, impactPoints: catalogInfo.points,
                dateString: data.completedAt || new Date().toLocaleDateString(),
                timestamp: data.lastUpdated?.toMillis() || Date.now()
              });
            }
          });

          const combinedCerts = [...coursesList, ...skillsList].sort((a, b) => b.timestamp - a.timestamp);
          setEarnedCerts(combinedCerts);
        });
        return () => unsubSkills();
      });

      return () => unsubCourses();
    }
  }, [user]);

  // --- 5. HANDLERS ---
  const handleInputChange = (field: string, value: string) => setProfileData({ ...profileData, [field]: value });
  const handleCrisisChange = (field: string, value: any) => setCrisisInfo({ ...crisisInfo, [field]: value });
  const handleAvailChange = (field: string, value: any) => setAvailability({ ...availability, [field]: value });
  const handleAddSkill = () => { if (newSkill.trim() && !skills.includes(newSkill.trim())) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } };
  const handleRemoveSkill = (skillToRemove: string) => setSkills(skills.filter(s => s !== skillToRemove));
  const handleAddLanguage = () => { if (newLanguage.trim()) { setLanguages([...languages, { name: newLanguage.trim(), proficiency: newProficiency }]); setNewLanguage(""); } };
  const handleRemoveLanguage = (indexToRemove: number) => setLanguages(languages.filter((_, i) => i !== indexToRemove));
  const toggleInterest = (interest: string) => { interests.includes(interest) ? setInterests(interests.filter(i => i !== interest)) : setInterests([...interests, interest]); };

  const handleSaveExperience = () => {
    if (!activeExp?.title || !activeExp?.organization) return alert("Title and Organization required");
    if (activeExp.id) { setExperiences(experiences.map(e => e.id === activeExp.id ? activeExp : e)); } 
    else { setExperiences([...experiences, { ...activeExp, id: Date.now().toString() }]); }
    setActiveExp(null);
  };
  const handleRemoveExperience = (id: string) => setExperiences(experiences.filter(exp => exp.id !== id));

  const handleSaveEducation = () => {
    if (!activeEdu?.level || !activeEdu?.institution) return alert("Level and Institution required");
    if (activeEdu.id) { setEducations(educations.map(e => e.id === activeEdu.id ? activeEdu : e)); } 
    else { setEducations([...educations, { ...activeEdu, id: Date.now().toString() }]); }
    setActiveEdu(null);
  };
  const handleRemoveEducation = (id: string) => setEducations(educations.filter(edu => edu.id !== id));

  // --- 🔥 HIGH SECURITY GOV VERIFICATION SUBMISSION 🔥 ---
  const submitLegalVerification = async () => {
    if (!user) return;
    if (!verifyData.legalName || !verifyData.idNumber || !verifyData.birthYear) {
      return alert("All official document fields are required for verification.");
    }
    if (verifyData.idNumber.length !== 11) {
      return alert("Identification Number must be exactly 11 digits.");
    }

    setIsSubmittingVerify(true);
    try {
      // Securely store the KYC data in the user's profile under a restricted node
      await updateVolunteerProfile(user.uid, { 
        verificationStatus: 'pending',
        legalIdentity: {
          type: verifyData.residencyType,
          legalName: verifyData.legalName.toUpperCase(),
          idNumber: verifyData.idNumber,
          birthYear: verifyData.birthYear,
          submittedAt: new Date().toISOString()
        }
      });
      
      setProfileData(prev => ({ ...prev, verificationStatus: 'pending' }));
      setShowVerifyModal(false);
    } catch (error) {
      console.error("Verification Submission Failed:", error);
      alert("Secure connection failed. Please try again.");
    }
    setIsSubmittingVerify(false);
  };

  // --- 6. IMAGE UPLOAD ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; 
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const base64String = canvas.toDataURL('image/jpeg', 0.7);

        try {
          setProfileData({ ...profileData, photoUrl: base64String });
          await updateVolunteerProfile(user.uid, { photoUrl: base64String, avatarUrl: base64String });
        } catch (error) {
          console.error("Error saving image:", error);
          alert("Failed to save image. Please try a smaller file.");
        } finally { setIsUploadingPhoto(false); }
      };
    };
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const dataToSave = {
      name: profileData.fullName, phone: profileData.phone, dateOfBirth: profileData.dateOfBirth,
      address: profileData.address, city: profileData.city, state: profileData.state,
      zipCode: profileData.zipCode, country: profileData.country, bio: profileData.bio, linkedIn: profileData.linkedIn,
      skills, experiences, educations, languages, interests, availability, crisisInfo,
      photoUrl: profileData.photoUrl, avatarUrl: profileData.photoUrl
    };
    const success = await updateVolunteerProfile(user.uid, dataToSave);
    if (success) setIsEditing(false);
    setIsSaving(false);
  };

  // --- 7. IMPACT CV GENERATOR ---
  const handleDownloadCV = () => {
    setIsGeneratingCV(true);
    setTimeout(() => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        const expHTML = experiences.length > 0 
          ? experiences.map(exp => `
              <div class="item">
                <div class="item-header">
                  <h4>${exp.title}</h4>
                  <span class="date">${formatNiceDate(exp.startDate)} - ${exp.current ? 'Present' : formatNiceDate(exp.endDate)}</span>
                </div>
                <div class="item-sub">${exp.organization} | ${exp.location}</div>
                <p>${exp.description}</p>
              </div>
            `).join('')
          : '<p class="empty">No experience listed.</p>';

        const eduHTML = educations.length > 0
          ? educations.map(edu => `
              <div class="item">
                <div class="item-header">
                  <h4>${edu.level} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h4>
                  <span class="date">Class of ${edu.gradYear}</span>
                </div>
                <div class="item-sub">${edu.institution}</div>
              </div>
            `).join('')
          : '<p class="empty">No education listed.</p>';

        const skillsHTML = skills.length > 0 
          ? skills.map(s => `<span class="badge">${s}</span>`).join('')
          : 'None';

        const certsHTML = earnedCerts.length > 0
          ? earnedCerts.map(c => `
              <div class="cert-item">
                <strong>${c.title}</strong> - ${c.category} 
                <span class="cert-date">(${c.dateString})</span>
              </div>
            `).join('')
          : '<p class="empty">No verified certifications logged in the platform.</p>';

        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${profileData.fullName} - Impact CV</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                body {
                  font-family: 'Inter', sans-serif;
                  color: #333;
                  line-height: 1.5;
                  margin: 0;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header { border-bottom: 2px solid #016A6D; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
                .name { font-size: 32px; font-weight: 800; color: #016A6D; margin: 0 0 10px 0; letter-spacing: -0.5px;}
                .contact { font-size: 12px; color: #64748b; }
                .logo { font-size: 20px; font-weight: 900; color: #016A6D; text-transform: uppercase; letter-spacing: -0.5px;}
                .logo span { color: #1C9290; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 16px; font-weight: 800; color: #016A6D; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
                .bio { font-size: 14px; color: #475569; margin-bottom: 30px; }
                .item { margin-bottom: 15px; }
                .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;}
                .item h4 { font-size: 14px; font-weight: 800; color: #1e293b; margin: 0; }
                .item .date { font-size: 12px; color: #1C9290; font-weight: 600; }
                .item-sub { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 5px;}
                .item p { font-size: 13px; color: #475569; margin: 0; }
                .badge { display: inline-block; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #475569; margin: 0 4px 4px 0; }
                .empty { font-size: 12px; color: #94a3b8; font-style: italic; }
                .cert-item { font-size: 13px; color: #1e293b; margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #1C9290;}
                .cert-date { color: #94a3b8; font-size: 11px; }
                @media print { @page { size: portrait; margin: 0.5in; } body { padding: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h1 class="name">${profileData.fullName}</h1>
                  <div class="contact">
                    ${profileData.email} | ${profileData.phone || 'No Phone'}<br/>
                    ${profileData.city ? `${profileData.city}, ${profileData.country}` : 'Location Not Set'}
                  </div>
                </div>
                <div class="logo">Athar <span>Impact CV</span></div>
              </div>
              ${profileData.bio ? `<div class="bio">${profileData.bio}</div>` : ''}
              <div class="section"><div class="section-title">Verified Certifications</div>${certsHTML}</div>
              <div class="section"><div class="section-title">Field Experience</div>${expHTML}</div>
              <div class="section"><div class="section-title">Education</div>${eduHTML}</div>
              <div class="section"><div class="section-title">Professional Skills</div><div>${skillsHTML}</div></div>
            </body>
          </html>
        `);
        iframeDoc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => { document.body.removeChild(iframe); setIsGeneratingCV(false); }, 1000);
        }, 500); 
      }
    }, 100);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 text-[#016A6D] animate-spin" /></div>;
  if (!user) return <div className="p-8 text-red-500">Please log in to view your profile.</div>;

  const initials = profileData.fullName ? profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : "U";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* 🔥 THE HIGH-SECURITY VERIFICATION MODAL 🔥 */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-[#016A6D] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Lock className="h-5 w-5 text-white" /></div>
                <h2 className="text-white font-bold text-lg">Official Identity Verification</h2>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-white/70 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  To participate in high-impact field operations or join the AVR, your identity must be verified against official national databases. This connection is securely encrypted.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Residency Status</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setVerifyData({...verifyData, residencyType: 'citizen'})}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${verifyData.residencyType === 'citizen' ? 'border-[#016A6D] bg-[#016A6D]/5' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className={`text-sm font-bold ${verifyData.residencyType === 'citizen' ? 'text-[#016A6D]' : 'text-slate-500'}`}>Turkish Citizen</span>
                  </div>
                  <div 
                    onClick={() => setVerifyData({...verifyData, residencyType: 'foreigner'})}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${verifyData.residencyType === 'foreigner' ? 'border-[#016A6D] bg-[#016A6D]/5' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className={`text-sm font-bold ${verifyData.residencyType === 'foreigner' ? 'text-[#016A6D]' : 'text-slate-500'}`}>Foreign Resident</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {verifyData.residencyType === 'citizen' ? 'T.C. Kimlik Number *' : 'Yabancı Kimlik Number (99...) *'}
                  </Label>
                  <Input 
                    type="number"
                    maxLength={11}
                    className="h-12 font-medium text-lg tracking-widest bg-slate-50" 
                    placeholder="11-Digit ID Number" 
                    value={verifyData.idNumber} 
                    onChange={(e) => setVerifyData({...verifyData, idNumber: e.target.value})} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Legal Name (As on ID) *</Label>
                  <Input 
                    className="h-11 font-medium uppercase bg-slate-50" 
                    placeholder="ENTER FULL NAME" 
                    value={verifyData.legalName} 
                    onChange={(e) => setVerifyData({...verifyData, legalName: e.target.value.toUpperCase()})} 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Birth Year *</Label>
                  <Input 
                    type="number"
                    className="h-11 font-medium bg-slate-50" 
                    placeholder="YYYY (e.g. 1995)" 
                    value={verifyData.birthYear} 
                    onChange={(e) => setVerifyData({...verifyData, birthYear: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setShowVerifyModal(false)} className="font-bold text-xs uppercase tracking-wider text-slate-600">Cancel</Button>
              <Button onClick={submitLegalVerification} disabled={isSubmittingVerify} className="bg-[#016A6D] hover:bg-[#125d56] text-white font-bold text-xs uppercase tracking-wider">
                {isSubmittingVerify ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Submit for Verification
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-[#016A6D] font-black text-2xl tracking-tight">Social Impact Portfolio</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your identity, field experience, and readiness data.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadCV} disabled={isGeneratingCV || isEditing} variant="outline" className="border-[#016A6D] text-[#016A6D] hover:bg-[#016A6D]/10 font-bold uppercase tracking-wider text-xs">
            {isGeneratingCV ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Impact CV
          </Button>

          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-[#016A6D] hover:bg-[#125d56] text-white shadow-md font-bold uppercase tracking-wider text-xs">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold uppercase tracking-wider text-xs">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="border-slate-300 text-slate-600 font-bold uppercase tracking-wider text-xs">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (MAIN CONTENT) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROFILE ID CARD */}
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="h-24 bg-gradient-to-r from-[#016A6D] to-[#1C9290]"></div>
            <CardContent className="px-6 pb-6 relative">
              <div className="flex flex-col md:flex-row gap-5">
                
                {/* UPLOADABLE AVATAR */}
                <div className="relative -mt-12 group inline-block w-28 h-28 shrink-0">
                  <Avatar className="w-28 h-28 border-4 border-white shadow-md bg-white">
                    <AvatarImage src={profileData.photoUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-slate-100 text-[#016A6D] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                  <div onClick={() => fileInputRef.current?.click()} className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isUploadingPhoto ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                  </div>
                </div>

                <div className="flex-1 pt-2 w-full">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                      <div className="space-y-1"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Full Name</Label><Input className="h-10 text-sm font-medium" value={profileData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Phone</Label><Input className="h-10 text-sm font-medium" value={profileData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">City</Label><Input className="h-10 text-sm font-medium" value={profileData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder="e.g. Istanbul" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Country</Label><Input className="h-10 text-sm font-medium" value={profileData.country} onChange={(e) => handleInputChange('country', e.target.value)} placeholder="e.g. Turkey" /></div>
                      <div className="space-y-1 md:col-span-2"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">LinkedIn URL</Label><Input className="h-10 text-sm font-medium" value={profileData.linkedIn} onChange={(e) => handleInputChange('linkedIn', e.target.value)} /></div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-black text-[#016A6D] tracking-tight">{profileData.fullName}</h2>
                          {profileData.verificationStatus === 'verified' && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-sm"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>
                          )}
                          {profileData.verificationStatus === 'pending' && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-sm"><Clock className="h-3 w-3 mr-1" /> Pending Verification</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider"><Mail className="h-4 w-4 text-[#1C9290]" /> {profileData.email}</div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider"><Phone className="h-4 w-4 text-[#1C9290]" /> {profileData.phone || "No phone"}</div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider"><MapPin className="h-4 w-4 text-[#1C9290]" /> {profileData.city ? `${profileData.city}, ${profileData.country}` : "Location not set"}</div>
                        </div>
                      </div>
                      
                      {/* 🔥 TRIGGER FOR HIGH SECURITY MODAL 🔥 */}
                      {profileData.verificationStatus === 'unverified' && (
                        <Button 
                          onClick={() => setShowVerifyModal(true)} 
                          variant="outline" 
                          className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold uppercase tracking-wider text-[10px] h-9 shrink-0 shadow-sm"
                        >
                          <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Verify Identity
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BIO */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-[#016A6D]"><User className="h-5 w-5 text-[#1C9290]" /> About Me</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {isEditing ? (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Professional Bio</Label><Textarea rows={4} className="p-3 text-sm font-medium resize-none" value={profileData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Summarize your experience and passion for volunteering..." /></div>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{profileData.bio || "No bio added yet. Tell organizations why you volunteer!"}</p>
              )}
            </CardContent>
          </Card>

          {/* VERIFIED CREDENTIALS (PULLED FROM COURSES & SKILLS) */}
          <Card className="border-emerald-200 shadow-sm bg-emerald-50/30">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-[#016A6D]"><Award className="h-5 w-5 text-emerald-600" /> Verified Credentials</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {earnedCerts.length === 0 ? (
                <p className="text-sm text-slate-500 italic mt-2">No certificates earned yet. Complete modules in the Training Academy to build your portfolio.</p>
              ) : (
                <div className="space-y-3 mt-2">
                  {earnedCerts.map((cert) => (
                    <div key={cert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-emerald-100 bg-white rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full shrink-0">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="text-[#016A6D] font-bold text-sm leading-tight">{cert.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold text-[9px] uppercase tracking-widest px-1.5 py-0">{cert.type}</Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cert.dateString}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* VOLUNTEER EXPERIENCE */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-[#016A6D]"><Briefcase className="h-5 w-5 text-[#1C9290]" /> Field Experience</CardTitle>
              {isEditing && !activeExp && <Button size="sm" variant="outline" className="text-[#016A6D] border-[#016A6D]/20 hover:bg-[#016A6D]/10 font-bold uppercase tracking-wider text-xs" onClick={() => setActiveExp({ id: '', title: '', organization: '', location: '', startDate: '', endDate: '', current: false, description: '' })}><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button>}
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2 space-y-4">
              
              {activeExp && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Role Title *</Label><Input className="h-10 text-sm font-medium" value={activeExp.title} onChange={(e) => setActiveExp({...activeExp, title: e.target.value})} placeholder="e.g. Project Manager" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Organization *</Label><Input className="h-10 text-sm font-medium" value={activeExp.organization} onChange={(e) => setActiveExp({...activeExp, organization: e.target.value})} placeholder="e.g. Takaful Charity" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Location</Label><Input className="h-10 text-sm font-medium" value={activeExp.location} onChange={(e) => setActiveExp({...activeExp, location: e.target.value})} placeholder="e.g. Istanbul" /></div>
                    <div className="space-y-1.5 flex gap-3">
                      <div className="flex-1"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Start Date</Label><Input className="h-10 text-sm font-medium" type="month" value={activeExp.startDate} onChange={(e) => setActiveExp({...activeExp, startDate: e.target.value})} /></div>
                      <div className="flex-1"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">End Date</Label><Input className="h-10 text-sm font-medium" type="month" value={activeExp.endDate} disabled={activeExp.current} onChange={(e) => setActiveExp({...activeExp, endDate: e.target.value})} /></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="currentExp" checked={activeExp.current} onChange={(e) => setActiveExp({...activeExp, current: e.target.checked, endDate: ''})} className="rounded text-[#016A6D] w-4 h-4 border-slate-300" /><Label htmlFor="currentExp" className="text-sm cursor-pointer font-bold text-slate-600">I currently volunteer here</Label></div>
                  <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Description</Label><Textarea className="p-3 text-sm font-medium resize-none" rows={3} value={activeExp.description} onChange={(e) => setActiveExp({...activeExp, description: e.target.value})} placeholder="What was your impact?" /></div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setActiveExp(null)} className="font-bold text-xs uppercase tracking-wider">Cancel</Button>
                    <Button className="bg-[#016A6D] hover:bg-[#125d56] text-white font-bold text-xs uppercase tracking-wider" onClick={handleSaveExperience}>{activeExp.id ? "Update" : "Save"}</Button>
                  </div>
                </div>
              )}

              {!activeExp && experiences.length === 0 ? <p className="text-slate-500 text-sm italic pt-2">No volunteer experience added yet.</p> : (
                <div className="space-y-5 pt-2">
                  {experiences.map((exp, idx) => (
                    <div key={exp.id}>
                      <div className="flex gap-4 items-start group">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 shrink-0"><Briefcase className="h-5 w-5 text-slate-400" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-black text-base text-[#016A6D]">{exp.title}</h3>
                              <p className="text-[#1C9290] text-sm font-bold mt-0.5">{exp.organization}</p>
                            </div>
                            {isEditing && !activeExp && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" onClick={() => setActiveExp(exp)} className="h-8 w-8"><Pencil className="h-4 w-4 text-slate-400" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleRemoveExperience(exp.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatNiceDate(exp.startDate)} - {exp.current ? 'Present' : formatNiceDate(exp.endDate)}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {exp.location}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                        </div>
                      </div>
                      {idx !== experiences.length - 1 && <Separator className="mt-5 bg-slate-100" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* EDUCATION */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-[#016A6D]"><GraduationCap className="h-5 w-5 text-[#1C9290]" /> Education</CardTitle>
              {isEditing && !activeEdu && <Button size="sm" variant="outline" className="text-[#016A6D] border-[#016A6D]/20 hover:bg-[#016A6D]/10 font-bold uppercase tracking-wider text-xs" onClick={() => setActiveEdu({ id: '', level: '', fieldOfStudy: '', institution: '', gradYear: '', current: true })}><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button>}
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2 space-y-4">
              
              {activeEdu && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Education Level *</Label>
                      <select className="w-full h-10 text-sm font-medium border-slate-300 rounded-md px-3 border bg-white" value={activeEdu.level} onChange={(e) => setActiveEdu({...activeEdu, level: e.target.value})}>
                        <option value="">Select Level...</option>
                        {EDUCATION_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Field of Study</Label><Input className="h-10 text-sm font-medium" value={activeEdu.fieldOfStudy} onChange={(e) => setActiveEdu({...activeEdu, fieldOfStudy: e.target.value})} placeholder="e.g. Software Engineering" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Institution *</Label><Input className="h-10 text-sm font-medium" value={activeEdu.institution} onChange={(e) => setActiveEdu({...activeEdu, institution: e.target.value})} placeholder="e.g. Altınbaş University" /></div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Graduation Year</Label>
                      <Input className="h-10 text-sm font-medium" type="number" value={activeEdu.gradYear} onChange={(e) => setActiveEdu({...activeEdu, gradYear: e.target.value})} placeholder="e.g. 2026" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="currentEdu" checked={activeEdu.current} onChange={(e) => setActiveEdu({...activeEdu, current: e.target.checked})} className="rounded text-[#016A6D] w-4 h-4 border-slate-300" />
                    <Label htmlFor="currentEdu" className="text-sm cursor-pointer text-slate-600 font-bold">Currently studying here</Label>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setActiveEdu(null)} className="font-bold text-xs uppercase tracking-wider">Cancel</Button>
                    <Button className="bg-[#016A6D] hover:bg-[#125d56] text-white font-bold text-xs uppercase tracking-wider" onClick={handleSaveEducation}>{activeEdu.id ? "Update" : "Save"}</Button>
                  </div>
                </div>
              )}

              {!activeEdu && educations.length === 0 ? <p className="text-slate-500 text-sm italic pt-2">No education details added.</p> : (
                <div className="space-y-5 pt-2">
                  {educations.map((edu, idx) => (
                    <div key={edu.id}>
                      <div className="flex gap-4 items-start group">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 shrink-0"><GraduationCap className="h-5 w-5 text-slate-400" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-black text-base text-[#016A6D]">{edu.level} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</h3>
                              <p className="text-[#1C9290] font-bold text-sm mt-0.5">{edu.institution}</p>
                              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1.5">
                                {edu.current ? `Expected Graduation: ${formatNiceDate(edu.gradYear)}` : `Class of ${formatNiceDate(edu.gradYear)}`}
                              </p>
                            </div>
                            {isEditing && !activeEdu && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" onClick={() => setActiveEdu(edu)} className="h-8 w-8"><Pencil className="h-4 w-4 text-slate-400" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleRemoveEducation(edu.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {idx !== educations.length - 1 && <Separator className="mt-5 bg-slate-100" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN (SIDEBAR STATS) */}
        <div className="space-y-6">
          
          {/* EMERGENCY DEPLOYMENT */}
          <Card className="border-rose-200 shadow-sm overflow-hidden">
            <div className="bg-rose-600 text-white p-4 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" /> Emergency Deployment
            </div>
            <CardContent className="p-5 space-y-5 bg-rose-50/30">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" htmlFor="drive">Valid Driving License?</Label>
                    <input type="checkbox" id="drive" checked={crisisInfo.drivingLicense} onChange={(e) => handleCrisisChange('drivingLicense', e.target.checked)} className="rounded text-rose-600 w-4 h-4 border-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Type</Label>
                    <select className="w-full h-10 text-sm font-medium border-slate-300 rounded-md px-3 border bg-white" value={crisisInfo.bloodType} onChange={(e) => handleCrisisChange('bloodType', e.target.value)}>
                      <option value="">Select...</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                    </select>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-sm">
                     <Label className="text-[10px] uppercase tracking-widest text-rose-600 font-bold border-b border-slate-100 pb-2 flex w-full">Emergency Contact</Label>
                     <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</Label><Input className="h-9 text-sm font-medium" value={crisisInfo.emergencyName} onChange={(e) => handleCrisisChange('emergencyName', e.target.value)} placeholder="e.g. Ahmed" /></div>
                     <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Relationship</Label><Input className="h-9 text-sm font-medium" value={crisisInfo.emergencyRelation} onChange={(e) => handleCrisisChange('emergencyRelation', e.target.value)} placeholder="e.g. Brother" /></div>
                     <div className="space-y-1"><Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</Label><Input className="h-9 text-sm font-medium" value={crisisInfo.emergencyPhone} onChange={(e) => handleCrisisChange('emergencyPhone', e.target.value)} placeholder="Phone Number" /></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider"><Car className="h-4 w-4 text-slate-400" /> Driver</span><Badge variant={crisisInfo.drivingLicense ? "default" : "secondary"} className={crisisInfo.drivingLicense ? "bg-emerald-100 text-emerald-800 border-none font-black text-[10px] uppercase tracking-widest" : "bg-slate-100 text-slate-400 border-none font-black text-[10px] uppercase tracking-widest"}>{crisisInfo.drivingLicense ? "Yes" : "No"}</Badge></div>
                  <Separator className="bg-rose-100" />
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider"><Droplet className="h-4 w-4 text-rose-500" /> Blood Type</span><span className="font-black text-sm text-rose-700">{crisisInfo.bloodType || "Unknown"}</span></div>
                  <Separator className="bg-rose-100" />
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"><PhoneCall className="h-4 w-4 text-slate-400" /> Contact</span>
                    {crisisInfo.emergencyName ? (
                      <div className="pl-6 border-l-2 border-rose-200 ml-2 mt-1">
                        <p className="text-[#043E52] font-black text-sm">{crisisInfo.emergencyName} <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">({crisisInfo.emergencyRelation})</span></p>
                        <p className="text-slate-600 font-medium text-sm mt-0.5">{crisisInfo.emergencyPhone}</p>
                      </div>
                    ) : <p className="pl-6 text-sm text-slate-400 italic">Not set</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AVAILABILITY */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2 text-[#016A6D]"><CalendarRange className="h-4 w-4 text-[#1C9290]" /> Availability</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" htmlFor="wkday">Available Weekdays</Label><input type="checkbox" id="wkday" checked={availability.weekdays} onChange={(e) => handleAvailChange('weekdays', e.target.checked)} className="rounded text-[#1C9290] w-4 h-4 border-slate-300" /></div>
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" htmlFor="wkend">Available Weekends</Label><input type="checkbox" id="wkend" checked={availability.weekends} onChange={(e) => handleAvailChange('weekends', e.target.checked)} className="rounded text-[#1C9290] w-4 h-4 border-slate-300" /></div>
                  <Separator className="my-2 bg-slate-100" />
                  <div className="space-y-1.5"><Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Format</Label>
                    <select className="w-full h-10 text-sm font-medium border-slate-300 rounded-md px-3 border bg-white" value={availability.format} onChange={(e) => handleAvailChange('format', e.target.value)}>
                      <option>Flexible (Online & On-site)</option><option>On-site Only</option><option>Remote / Online Only</option>
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hours per week</Label>
                    <select className="w-full h-10 text-sm font-medium border-slate-300 rounded-md px-3 border bg-white" value={availability.hours} onChange={(e) => handleAvailChange('hours', e.target.value)}>
                      <option>1-5 hours</option><option>5-10 hours</option><option>10-20 hours</option><option>20+ hours</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Days</span>
                    <div className="flex gap-2">
                      <Badge className={`h-5 px-2 font-bold text-[9px] uppercase tracking-widest ${availability.weekdays ? 'bg-[#1C9290]/10 text-[#1C9290] border-none' : 'bg-slate-50 text-slate-400 border-none'}`}>Weekdays</Badge>
                      <Badge className={`h-5 px-2 font-bold text-[9px] uppercase tracking-widest ${availability.weekends ? 'bg-[#1C9290]/10 text-[#1C9290] border-none' : 'bg-slate-50 text-slate-400 border-none'}`}>Weekends</Badge>
                    </div>
                  </div>
                  <Separator className="bg-slate-100" />
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider"><Laptop className="h-4 w-4 text-slate-400" /> Format</span><span className="font-black text-xs text-[#016A6D]">{availability.format}</span></div>
                  <Separator className="bg-slate-100" />
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider"><Clock className="h-4 w-4 text-slate-400" /> Hours</span><span className="font-black text-xs text-[#016A6D]">{availability.hours}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CAUSES */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2 text-[#016A6D]"><Heart className="h-4 w-4 text-[#E16A3D]" /> Causes</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {AVAILABLE_INTERESTS.map(interest => (
                    <Badge key={interest} variant="outline" className={`cursor-pointer text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${interests.includes(interest) ? 'bg-[#E16A3D]/10 border-none text-[#E16A3D]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`} onClick={() => toggleInterest(interest)}>
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  {interests.length > 0 ? interests.map(interest => <Badge key={interest} className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-none font-bold text-[10px] uppercase tracking-wider px-3 py-1">{interest}</Badge>) : <p className="text-sm text-slate-500 italic">No causes selected.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SKILLS */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2 text-[#016A6D]"><CheckCircle className="h-4 w-4 text-[#1C9290]" /> Professional Skills</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing && (
                <div className="flex gap-2 mb-4 pt-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="e.g. Data Analysis" className="h-10 text-sm font-medium" onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}/>
                  <Button onClick={handleAddSkill} className="h-10 bg-[#016A6D] hover:bg-[#125d56] text-white shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill, index) => (
                  <Badge key={index} className="bg-[#1C9290]/10 text-[#1C9290] hover:bg-[#1C9290]/20 border-none flex items-center gap-1.5 pl-3 pr-2 py-1 text-[10px] uppercase tracking-wider font-bold">
                    {skill} {isEditing && <button onClick={() => handleRemoveSkill(skill)} className="hover:bg-[#1C9290]/30 rounded-full p-0.5 ml-0.5 transition-colors"><X className="h-3 w-3" /></button>}
                  </Badge>
                ))}
                {skills.length === 0 && !isEditing && <p className="text-sm text-slate-500 italic">No professional skills listed.</p>}
              </div>
            </CardContent>
          </Card>

          {/* LANGUAGES */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2 text-[#016A6D]">Languages</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing && (
                <div className="flex gap-2 mb-4 pt-2">
                  <Input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="e.g. Arabic" className="h-10 flex-1 text-sm font-medium" />
                  <select className="h-10 border border-slate-300 rounded-md text-[10px] font-bold uppercase tracking-wider px-2 bg-white text-slate-600" value={newProficiency} onChange={(e) => setNewProficiency(e.target.value)}>
                    <option>Basic</option><option>Intermediate</option><option>Fluent</option><option>Native</option>
                  </select>
                  <Button onClick={handleAddLanguage} className="h-10 bg-[#016A6D] hover:bg-[#125d56] text-white shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
              )}
              <div className="space-y-3 pt-2">
                {languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-[#043E52] font-black text-sm">{lang.name}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-slate-200 h-6 px-2.5 bg-slate-50">{lang.proficiency}</Badge>
                      {isEditing && <button onClick={() => handleRemoveLanguage(index)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </div>
                ))}
                {languages.length === 0 && !isEditing && <p className="text-sm text-slate-500 italic">No languages listed.</p>}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}