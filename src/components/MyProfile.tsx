import { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// 🔥 REMOVED FIREBASE STORAGE IMPORTS - WE DON'T NEED THEM ANYMORE! 🔥

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
  Camera, Loader2
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

// --- DATA INTERFACES ---
interface Experience { id: string; title: string; organization: string; location: string; startDate: string; endDate: string; current: boolean; description: string; }
interface Education { id: string; level: string; fieldOfStudy: string; institution: string; gradYear: string; current: boolean; }
interface Language { name: string; proficiency: string; }

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. CORE STATE ---
  const [profileData, setProfileData] = useState({
    fullName: '', email: '', phone: '', dateOfBirth: '',
    address: '', city: '', state: '', zipCode: '', country: '',
    bio: '', linkedIn: '', website: '', photoUrl: '', avatarUrl: ''
  });

  // --- 2. LISTS & OBJECT STATES ---
  const [skills, setSkills] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]); 
  const [educations, setEducations] = useState<Education[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  
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
      setProfileData({
        fullName: user.name || '', email: user.email || '', phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '', address: user.address || '', city: user.city || '',
        state: user.state || '', zipCode: user.zipCode || '', country: user.country || '',
        bio: user.bio || '', linkedIn: user.linkedIn || '', website: user.website || '',
        photoUrl: user.photoUrl || user.avatarUrl || '' 
      });
      setSkills(user.skills || []);
      setExperiences(user.experiences || []);
      setEducations(user.educations || []);
      setLanguages(user.languages || []);
      setInterests(user.interests || []);
      setAvailability(user.availability || { weekdays: false, weekends: false, hours: '5-10 hours', format: 'Flexible' });
      setCrisisInfo({
        bloodType: user.crisisInfo?.bloodType || '', drivingLicense: user.crisisInfo?.drivingLicense || false,
        emergencyName: user.crisisInfo?.emergencyName || user.crisisInfo?.emergencyContact || '',
        emergencyRelation: user.crisisInfo?.emergencyRelation || '', emergencyPhone: user.crisisInfo?.emergencyPhone || ''
      });
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

  // --- 🔥 6. THE BASE64 NO-STORAGE IMAGE COMPRESSOR 🔥 ---
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
        // Create an invisible canvas to compress the image
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // Shrink to 400px to keep database small
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert the shrunk image to a lightweight text string (JPEG, 70% quality)
        const base64String = canvas.toDataURL('image/jpeg', 0.7);

        try {
          // Update the UI immediately
          setProfileData({ ...profileData, photoUrl: base64String });
          
          // Save directly to Firestore Database! (Bypassing Firebase Storage)
          await updateVolunteerProfile(user.uid, { photoUrl: base64String, avatarUrl: base64String });
        } catch (error) {
          console.error("Error saving image:", error);
          alert("Failed to save image. Please try a smaller file.");
        } finally {
          setIsUploadingPhoto(false);
        }
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
      photoUrl: profileData.photoUrl,
      avatarUrl: profileData.photoUrl
    };
    const success = await updateVolunteerProfile(user.uid, dataToSave);
    if (success) setIsEditing(false);
    setIsSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-teal-600">Loading profile...</div>;
  if (!user) return <div className="p-8 text-red-500">Please log in.</div>;

  const initials = profileData.fullName ? profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : "U";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-slate-900 font-bold text-2xl">Social Impact Portfolio</h1>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-100">
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-100">
              <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" className="border-slate-300">
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (MAIN CONTENT) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROFILE ID CARD */}
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="h-20 bg-gradient-to-r from-teal-600 to-teal-400"></div>
            <CardContent className="px-6 pb-6 relative">
              <div className="flex flex-col md:flex-row gap-5">
                
                {/* 🔥 UPLOADABLE AVATAR 🔥 */}
                <div className="relative -mt-12 group inline-block w-28 h-28">
                  <Avatar className="w-28 h-28 border-4 border-white shadow-md bg-white">
                    <AvatarImage src={profileData.photoUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-slate-100 text-teal-800 font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-opacity 
                      ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 pt-2">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                      <div className="space-y-1"><Label className="text-xs text-slate-500 font-semibold">Full Name</Label><Input className="h-10 text-sm" value={profileData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs text-slate-500 font-semibold">Phone</Label><Input className="h-10 text-sm" value={profileData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs text-slate-500 font-semibold">Date of Birth</Label><Input className="h-10 text-sm" type="date" value={profileData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs text-slate-500 font-semibold">LinkedIn URL</Label><Input className="h-10 text-sm" value={profileData.linkedIn} onChange={(e) => handleInputChange('linkedIn', e.target.value)} /></div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{profileData.fullName}</h2>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-4 w-4 text-slate-400" /> {profileData.email}</div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {profileData.phone || "No phone"}</div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> {profileData.city ? `${profileData.city}, ${profileData.country}` : "Location not set"}</div>
                        {profileData.linkedIn && <div className="flex items-center gap-1.5 text-sm text-teal-600 hover:underline"><Briefcase className="h-4 w-4" /> <a href={profileData.linkedIn} target="_blank" rel="noreferrer">LinkedIn</a></div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BIO */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800"><User className="h-5 w-5 text-teal-600" /> About Me</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing ? (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Professional Bio</Label><Textarea rows={4} className="p-3 text-sm" value={profileData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Summarize your experience..." /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Address</Label><Input className="h-10 text-sm" value={profileData.address} onChange={(e) => handleInputChange('address', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">City</Label><Input className="h-10 text-sm" value={profileData.city} onChange={(e) => handleInputChange('city', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Country</Label><Input className="h-10 text-sm" value={profileData.country} onChange={(e) => handleInputChange('country', e.target.value)} /></div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{profileData.bio || "No bio added yet."}</p>
              )}
            </CardContent>
          </Card>

          {/* EDUCATION */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800"><GraduationCap className="h-5 w-5 text-purple-600" /> Education</CardTitle>
              {isEditing && !activeEdu && <Button size="sm" variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50" onClick={() => setActiveEdu({ id: '', level: '', fieldOfStudy: '', institution: '', gradYear: '', current: true })}><Plus className="mr-1 h-4 w-4" /> Add</Button>}
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2 space-y-4">
              
              {activeEdu && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Education Level *</Label>
                      <select className="w-full h-10 text-sm border-slate-300 rounded-md px-3 border bg-white" value={activeEdu.level} onChange={(e) => setActiveEdu({...activeEdu, level: e.target.value})}>
                        <option value="">Select Level...</option>
                        {EDUCATION_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Field of Study</Label><Input className="h-10 text-sm" value={activeEdu.fieldOfStudy} onChange={(e) => setActiveEdu({...activeEdu, fieldOfStudy: e.target.value})} placeholder="e.g. Software Engineering" /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Institution *</Label><Input className="h-10 text-sm" value={activeEdu.institution} onChange={(e) => setActiveEdu({...activeEdu, institution: e.target.value})} placeholder="e.g. Altınbaş University" /></div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Graduation Year</Label>
                      <Input className="h-10 text-sm" type="number" value={activeEdu.gradYear} onChange={(e) => setActiveEdu({...activeEdu, gradYear: e.target.value})} placeholder="e.g. 2026" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="currentEdu" checked={activeEdu.current} onChange={(e) => setActiveEdu({...activeEdu, current: e.target.checked})} className="rounded text-purple-600 w-4 h-4 border-slate-300" />
                    <Label htmlFor="currentEdu" className="text-sm cursor-pointer text-slate-700 font-medium">Currently studying here</Label>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setActiveEdu(null)}>Cancel</Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSaveEducation}>{activeEdu.id ? "Update Education" : "Save Education"}</Button>
                  </div>
                </div>
              )}

              {!activeEdu && educations.length === 0 ? <p className="text-slate-500 text-sm italic pt-2">No education details added.</p> : (
                <div className="space-y-5 pt-2">
                  {educations.map((edu, idx) => (
                    <div key={edu.id}>
                      <div className="flex gap-4 items-start group">
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 shrink-0"><GraduationCap className="h-6 w-6 text-purple-600" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-base text-slate-900">{edu.level} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</h3>
                              <p className="text-slate-700 font-medium text-sm mt-0.5">{edu.institution}</p>
                              <p className="text-slate-500 text-sm mt-1">
                                {edu.current ? `Expected Graduation: ${formatNiceDate(edu.gradYear)}` : `Class of ${formatNiceDate(edu.gradYear)}`}
                              </p>
                            </div>
                            {isEditing && !activeEdu && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" onClick={() => setActiveEdu(edu)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleRemoveEducation(edu.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {idx !== educations.length - 1 && <Separator className="mt-5" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* VOLUNTEER EXPERIENCE */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800"><Briefcase className="h-5 w-5 text-teal-600" /> Volunteer Experience</CardTitle>
              {isEditing && !activeExp && <Button size="sm" variant="outline" className="text-teal-700 border-teal-200 hover:bg-teal-50" onClick={() => setActiveExp({ id: '', title: '', organization: '', location: '', startDate: '', endDate: '', current: false, description: '' })}><Plus className="mr-1 h-4 w-4" /> Add</Button>}
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2 space-y-4">
              
              {activeExp && (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Role Title *</Label><Input className="h-10 text-sm" value={activeExp.title} onChange={(e) => setActiveExp({...activeExp, title: e.target.value})} placeholder="e.g. Project Manager" /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Organization *</Label><Input className="h-10 text-sm" value={activeExp.organization} onChange={(e) => setActiveExp({...activeExp, organization: e.target.value})} placeholder="e.g. Takaful Charity" /></div>
                    <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Location</Label><Input className="h-10 text-sm" value={activeExp.location} onChange={(e) => setActiveExp({...activeExp, location: e.target.value})} placeholder="e.g. Istanbul" /></div>
                    <div className="space-y-1.5 flex gap-3">
                      <div className="flex-1"><Label className="text-sm font-semibold text-slate-700">Start Date</Label><Input className="h-10 text-sm" type="month" value={activeExp.startDate} onChange={(e) => setActiveExp({...activeExp, startDate: e.target.value})} /></div>
                      <div className="flex-1"><Label className="text-sm font-semibold text-slate-700">End Date</Label><Input className="h-10 text-sm" type="month" value={activeExp.endDate} disabled={activeExp.current} onChange={(e) => setActiveExp({...activeExp, endDate: e.target.value})} /></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="currentExp" checked={activeExp.current} onChange={(e) => setActiveExp({...activeExp, current: e.target.checked, endDate: ''})} className="rounded text-teal-600 w-4 h-4 border-slate-300" /><Label htmlFor="currentExp" className="text-sm cursor-pointer font-medium text-slate-700">I currently volunteer here</Label></div>
                  <div className="space-y-1.5"><Label className="text-sm font-semibold text-slate-700">Description</Label><Textarea className="p-3 text-sm" rows={3} value={activeExp.description} onChange={(e) => setActiveExp({...activeExp, description: e.target.value})} placeholder="What was your impact?" /></div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setActiveExp(null)}>Cancel</Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSaveExperience}>{activeExp.id ? "Update Experience" : "Save Experience"}</Button>
                  </div>
                </div>
              )}

              {!activeExp && experiences.length === 0 ? <p className="text-slate-500 text-sm italic pt-2">No volunteer experience added yet.</p> : (
                <div className="space-y-5 pt-2">
                  {experiences.map((exp, idx) => (
                    <div key={exp.id}>
                      <div className="flex gap-4 items-start group">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0"><Briefcase className="h-6 w-6 text-slate-600" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-base text-slate-900">{exp.title}</h3>
                              <p className="text-teal-700 text-sm font-semibold mt-0.5">{exp.organization}</p>
                            </div>
                            {isEditing && !activeExp && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" onClick={() => setActiveExp(exp)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleRemoveExperience(exp.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatNiceDate(exp.startDate)} - {exp.current ? 'Present' : formatNiceDate(exp.endDate)}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {exp.location}</span>
                          </div>
                          <p className="text-sm text-slate-700 mt-3 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                        </div>
                      </div>
                      {idx !== experiences.length - 1 && <Separator className="mt-5" />}
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
            <div className="bg-rose-600 text-white p-4 flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="h-5 w-5" /> Emergency Deployment
            </div>
            <CardContent className="p-5 space-y-5 bg-rose-50/30">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <Label className="text-sm font-medium text-slate-700 cursor-pointer" htmlFor="drive">Valid Driving License?</Label>
                    <input type="checkbox" id="drive" checked={crisisInfo.drivingLicense} onChange={(e) => handleCrisisChange('drivingLicense', e.target.checked)} className="rounded text-rose-600 w-4 h-4 border-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood Type</Label>
                    <select className="w-full h-10 text-sm border-slate-300 rounded-md px-3 border bg-white" value={crisisInfo.bloodType} onChange={(e) => handleCrisisChange('bloodType', e.target.value)}>
                      <option value="">Select...</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                    </select>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-sm">
                     <Label className="text-xs uppercase tracking-wider text-rose-600 font-bold border-b border-slate-100 pb-2 flex w-full">Emergency Contact</Label>
                     <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-600">Name</Label><Input className="h-9 text-sm" value={crisisInfo.emergencyName} onChange={(e) => handleCrisisChange('emergencyName', e.target.value)} placeholder="e.g. Ahmed" /></div>
                     <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-600">Relationship</Label><Input className="h-9 text-sm" value={crisisInfo.emergencyRelation} onChange={(e) => handleCrisisChange('emergencyRelation', e.target.value)} placeholder="e.g. Brother" /></div>
                     <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-600">Phone</Label><Input className="h-9 text-sm" value={crisisInfo.emergencyPhone} onChange={(e) => handleCrisisChange('emergencyPhone', e.target.value)} placeholder="Phone Number" /></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-700 font-medium"><Car className="h-4 w-4 text-slate-400" /> Driver</span><Badge variant={crisisInfo.drivingLicense ? "default" : "secondary"} className={crisisInfo.drivingLicense ? "bg-emerald-100 text-emerald-800" : ""}>{crisisInfo.drivingLicense ? "Yes" : "No"}</Badge></div>
                  <Separator className="bg-rose-100" />
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-700 font-medium"><Droplet className="h-4 w-4 text-rose-500" /> Blood Type</span><span className="font-bold text-sm text-slate-900">{crisisInfo.bloodType || "Unknown"}</span></div>
                  <Separator className="bg-rose-100" />
                  <div className="text-sm space-y-1.5">
                    <span className="flex items-center gap-2 text-slate-700 font-medium mb-2"><PhoneCall className="h-4 w-4 text-slate-400" /> Contact</span>
                    {crisisInfo.emergencyName ? (
                      <div className="pl-6 border-l-2 border-rose-200 ml-2 mt-1">
                        <p className="text-slate-900 font-bold">{crisisInfo.emergencyName} <span className="text-slate-500 font-normal text-xs">({crisisInfo.emergencyRelation})</span></p>
                        <p className="text-slate-600 mt-0.5">{crisisInfo.emergencyPhone}</p>
                      </div>
                    ) : <p className="pl-6 text-sm text-slate-400 italic">Not set</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AVAILABILITY */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2"><CalendarRange className="h-5 w-5 text-indigo-500" /> Availability</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between"><Label className="text-sm font-medium cursor-pointer" htmlFor="wkday">Available Weekdays</Label><input type="checkbox" id="wkday" checked={availability.weekdays} onChange={(e) => handleAvailChange('weekdays', e.target.checked)} className="rounded text-indigo-600 w-4 h-4 border-slate-300" /></div>
                  <div className="flex items-center justify-between"><Label className="text-sm font-medium cursor-pointer" htmlFor="wkend">Available Weekends</Label><input type="checkbox" id="wkend" checked={availability.weekends} onChange={(e) => handleAvailChange('weekends', e.target.checked)} className="rounded text-indigo-600 w-4 h-4 border-slate-300" /></div>
                  <Separator className="my-2" />
                  <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Format</Label>
                    <select className="w-full h-10 text-sm border-slate-300 rounded-md px-3 border bg-white" value={availability.format} onChange={(e) => handleAvailChange('format', e.target.value)}>
                      <option>Flexible (Online & On-site)</option><option>On-site Only</option><option>Remote / Online Only</option>
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours per week</Label>
                    <select className="w-full h-10 text-sm border-slate-300 rounded-md px-3 border bg-white" value={availability.hours} onChange={(e) => handleAvailChange('hours', e.target.value)}>
                      <option>1-5 hours</option><option>5-10 hours</option><option>10-20 hours</option><option>20+ hours</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-700 font-medium">Days</span>
                    <div className="flex gap-2">
                      <Badge className={`h-6 px-2.5 font-normal ${availability.weekdays ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'} border`}>Weekdays</Badge>
                      <Badge className={`h-6 px-2.5 font-normal ${availability.weekends ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'} border`}>Weekends</Badge>
                    </div>
                  </div>
                  <Separator className="bg-slate-100" />
                  <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-700 font-medium"><Laptop className="h-4 w-4 text-slate-400" /> Format</span><span className="font-semibold text-slate-900">{availability.format}</span></div>
                  <Separator className="bg-slate-100" />
                  <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-700 font-medium"><Clock className="h-4 w-4 text-slate-400" /> Hours</span><span className="font-semibold text-slate-900">{availability.hours}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CAUSES */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2"><Heart className="h-5 w-5 text-rose-400" /> Causes</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {AVAILABLE_INTERESTS.map(interest => (
                    <Badge key={interest} variant="outline" className={`cursor-pointer text-sm font-normal px-3 py-1.5 transition-colors ${interests.includes(interest) ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`} onClick={() => toggleInterest(interest)}>
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  {interests.length > 0 ? interests.map(interest => <Badge key={interest} variant="secondary" className="bg-slate-100 text-slate-800 font-medium text-xs px-3 py-1">{interest}</Badge>) : <p className="text-sm text-slate-500 italic">No causes selected.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SKILLS */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-5 w-5 text-teal-500" /> Verified Skills</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing && (
                <div className="flex gap-2 mb-4 pt-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="e.g. Data Analysis" className="h-10 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}/>
                  <Button onClick={handleAddSkill} className="h-10 bg-slate-800 hover:bg-slate-900 text-white shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill, index) => (
                  <Badge key={index} className="bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 flex items-center gap-1.5 pl-3 pr-2 py-1 text-sm font-medium">
                    {skill} {isEditing && <button onClick={() => handleRemoveSkill(skill)} className="hover:bg-teal-200 rounded-full p-0.5 ml-0.5"><X className="h-3 w-3" /></button>}
                  </Badge>
                ))}
                {skills.length === 0 && !isEditing && <p className="text-sm text-slate-500 italic">No skills listed.</p>}
              </div>
            </CardContent>
          </Card>

          {/* LANGUAGES */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5 text-blue-500 opacity-0" /> Languages</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
              {isEditing && (
                <div className="flex gap-2 mb-4 pt-2">
                  <Input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="e.g. Arabic" className="h-10 flex-1 text-sm" />
                  <select className="h-10 border border-slate-300 rounded-md text-sm px-2 bg-white" value={newProficiency} onChange={(e) => setNewProficiency(e.target.value)}>
                    <option>Basic</option><option>Intermediate</option><option>Fluent</option><option>Native</option>
                  </select>
                  <Button onClick={handleAddLanguage} className="h-10 bg-slate-800 hover:bg-slate-900 text-white shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
              )}
              <div className="space-y-3 pt-2">
                {languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-900 font-medium text-sm">{lang.name}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-normal text-slate-600 border-slate-300 h-6 px-2.5">{lang.proficiency}</Badge>
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