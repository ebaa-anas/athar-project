import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
// 🔥 NEW: Import Auth modules for the Secondary App Trick
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';

import {
  Search, MoreVertical, UserCheck, Building2, Shield, Clock, Mail, 
  UserPlus, Filter, Loader2, ArrowLeft, ShieldAlert, Activity, MapPin, 
  Globe, Briefcase, FileDigit, CheckCircle2, Lock, X,
  Building, Users, Phone, Calendar
} from 'lucide-react';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDRSETgWx1F3RX3_KAzgceyYBJKfpheRQk",
  authDomain: "athar-project-aa74e.firebaseapp.com",
  projectId: "athar-project-aa74e",
  storageBucket: "athar-project-aa74e.firebasestorage.app",
  messagingSenderId: "715063889584",
  appId: "1:715063889584:web:3443ae48678c91a7f4b575",
};

// 1. Main App (Handles the Admin's current session and Database)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. 🔥 THE SECONDARY APP TRICK 🔥 (Handles creating new users silently)
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

export function UserManagement() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- MODAL & VIEW STATES ---
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'volunteer', status: 'Active'
  });

  // --- 1. FETCH LIVE DATA ---
  useEffect(() => {
    const allRecords = new Map();

    const updateState = () => {
      const vols: any[] = [];
      const orgs: any[] = [];
      const adms: any[] = [];

      Array.from(allRecords.values()).forEach((data) => {
        if (data.role === 'admin' || data.accessLevel) {
          adms.push(data);
        } else if (data.role === 'organization' || data.collectionName === 'organizations') {
          orgs.push(data);
        } else {
          vols.push(data);
        }
      });

      const sortByDate = (a: any, b: any) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      };

      setVolunteers(vols.sort(sortByDate));
      setOrganizations(orgs.sort(sortByDate));
      setAdmins(adms.sort(sortByDate));
      setLoading(false);
    };

    const handleSnapshot = (collectionName: string) => {
      return (snapshot: any) => {
        snapshot.docs.forEach((doc: any) => {
          allRecords.set(doc.id, { id: doc.id, collectionName, ...doc.data() });
        });
        updateState();
      };
    };

    const unsubUsers = onSnapshot(collection(db, "users"), handleSnapshot("users"));
    const unsubOrgs = onSnapshot(collection(db, "organizations"), handleSnapshot("organizations"));

    return () => { unsubUsers(); unsubOrgs(); };
  }, []);

  // --- 2. ACTION HANDLERS ---
  
  const toggleAccountStatus = async (id: string, collectionName: string, currentStatus: string) => {
    const newStatus = (currentStatus?.toLowerCase() === 'suspended' || currentStatus?.toLowerCase() === 'revoked') ? 'Active' : 'Suspended';
    if (!window.confirm(`Are you sure you want to mark this account as ${newStatus}?`)) return;
    
    try {
      await updateDoc(doc(db, collectionName, id), { status: newStatus });
    } catch (e) {
      console.error("Status Update Error:", e);
      alert("Failed to update status.");
    }
  };

  const revokeAdminAccess = async (id: string, collectionName: string) => {
    if (!window.confirm(`CRITICAL ACTION: Are you sure you want to revoke Admin privileges?`)) return;
    try {
      await updateDoc(doc(db, collectionName, id), { role: 'user', status: 'Revoked', accessLevel: null });
    } catch (e) {
      console.error("Revoke Error:", e);
    }
  };

  const handleSendMessage = (email: string) => {
    window.location.href = `mailto:${email}?subject=Athar Platform Administrator Notice`;
  };

  // 🔥 3. THE UPGRADED SECURE USER CREATION ENGINE 🔥
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return alert("Fill all fields.");
    
    setIsSubmittingUser(true);
    try {
      // Step 1: Create the real Auth User using the ghost Secondary App
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      const newUid = userCredential.user.uid;

      // Step 2: Sign out of the ghost app immediately to clear memory
      await signOut(secondaryAuth);

      // Step 3: Link the new Auth UID to a fresh Firestore Database Profile
      const targetCollection = newUser.role === 'organization' ? 'organizations' : 'users';
      
      const payload: any = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'Active',
        createdAt: serverTimestamp()
      };

      if (newUser.role === 'volunteer') {
        payload.totalHours = 0;
        payload.skills = [];
      } else if (newUser.role === 'admin') {
        payload.accessLevel = 'System Administrator';
      } else {
        payload.verificationStatus = 'pending';
      }

      // Use setDoc with the exact UID so the Auth and Database perfectly match
      await setDoc(doc(db, targetCollection, newUid), payload);
      
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'volunteer', status: 'Active' });
      alert(`Success! User account created. They can now log in securely.`);
    } catch (error: any) {
      console.error("Creation Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Failed: An account with this email already exists in Firebase Authentication.");
      } else if (error.code === 'auth/weak-password') {
        alert("Failed: Password must be at least 6 characters.");
      } else {
        alert(`Failed to provision user: ${error.message}`);
      }
    }
    setIsSubmittingUser(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString();
    return 'Recently';
  };

  const filterData = (data: any[]) => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => 
      (item.name && item.name.toLowerCase().includes(lowerSearch)) || 
      (item.email && item.email.toLowerCase().includes(lowerSearch))
    );
  };

  const filteredVolunteers = filterData(volunteers);
  const filteredOrganizations = filterData(organizations);
  const filteredAdmins = filterData(admins);

  const totalUsers = volunteers.length + organizations.length + admins.length;

  if (loading) return <div className="p-12 text-center text-[#043E52] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Fetching Master Database...</div>;


  // ============================================================================
  // 🔥 UNIVERSAL INLINE PROFILE VIEWER 🔥
  // ============================================================================
  if (viewingProfile) {
    const isOrg = viewingProfile.role === 'organization' || viewingProfile.collectionName === 'organizations';
    const isAdmin = viewingProfile.role === 'admin' || viewingProfile.accessLevel;

    return (
      <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Button variant="ghost" onClick={() => setViewingProfile(null)} className="text-slate-500 hover:text-[#043E52] hover:bg-slate-100 -ml-4 h-10 font-bold uppercase tracking-wider text-xs">
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
        </Button>

        <Card className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border-slate-200">
            <div className={`h-32 md:h-48 relative shrink-0 ${isOrg ? 'bg-[#016A6D]' : isAdmin ? 'bg-[#043E52]' : 'bg-[#1C9290]'}`}>
               {viewingProfile.coverUrl && <img src={viewingProfile.coverUrl} className="w-full h-full object-cover opacity-60" />}
            </div>

            <div className="p-6 md:p-8 -mt-16 relative z-10">
               <div className="flex flex-col md:flex-row gap-5 items-start md:items-end mb-8">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-xl bg-white rounded-2xl">
                    <AvatarImage src={viewingProfile.photoUrl || viewingProfile.logoUrl || viewingProfile.image} className="object-cover rounded-xl" />
                    <AvatarFallback className="bg-slate-100 text-[#043E52] text-3xl font-bold rounded-xl">{viewingProfile.name?.substring(0, 2)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 pb-2">
                     <h2 className="text-2xl md:text-3xl font-black text-[#043E52] leading-none mb-2">{viewingProfile.auditData?.legalName || viewingProfile.name}</h2>
                     <p className="text-slate-500 font-bold text-sm mb-3">
                        {isOrg ? (viewingProfile.tagline || 'Organization Profile') : isAdmin ? 'System Administrator' : 'Athar Volunteer'}
                     </p>
                     <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <Badge className={`${viewingProfile.status?.toLowerCase() === 'suspended' ? 'bg-red-600' : 'bg-[#1C9290]'} border-none font-bold text-[10px] px-2 py-1`}>
                          {viewingProfile.status || 'Active'}
                        </Badge>
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md"><Mail className="h-3.5 w-3.5" /> {viewingProfile.email}</span>
                        {isOrg && <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md"><FileDigit className="h-3.5 w-3.5" /> {viewingProfile.registrationId || 'ID Pending'}</span>}
                     </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <Button onClick={() => handleSendMessage(viewingProfile.email)} className="bg-[#043E52] hover:bg-[#033040] text-white font-bold h-11 px-6 shadow-md"><Mail className="mr-2 h-4 w-4"/> Contact</Button>
                    <Button 
                      onClick={() => toggleAccountStatus(viewingProfile.id, viewingProfile.collectionName || 'users', viewingProfile.status)} 
                      variant="outline" 
                      className={`h-11 font-bold px-6 shadow-sm border-2 ${viewingProfile.status?.toLowerCase() === 'suspended' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                    >
                      {viewingProfile.status?.toLowerCase() === 'suspended' ? <CheckCircle2 className="mr-2 h-4 w-4"/> : <ShieldAlert className="mr-2 h-4 w-4"/>}
                      {viewingProfile.status?.toLowerCase() === 'suspended' ? 'Reactivate' : 'Suspend'}
                    </Button>
                  </div>
               </div>

               {/* DYNAMIC CONTENT BASED ON ROLE */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                     <Card className="border border-slate-100 shadow-sm bg-slate-50/50">
                       <CardContent className="p-5 space-y-4">
                         <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Platform Data</h4>
                         <div className="space-y-3 text-sm text-slate-600 font-medium">
                           <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-[#1C9290]"/> <span>Joined: {formatDate(viewingProfile.createdAt || viewingProfile.joinDate)}</span></div>
                           <div className="flex items-center gap-3"><Activity className="h-4 w-4 text-[#1C9290]"/> <span>Last Active: {formatDate(viewingProfile.lastActiveAt || viewingProfile.updatedAt)}</span></div>
                           {viewingProfile.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#1C9290]"/> <span>{viewingProfile.phone}</span></div>}
                           {viewingProfile.city && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#1C9290]"/> <span>{viewingProfile.city}</span></div>}
                         </div>
                       </CardContent>
                     </Card>

                     {!isAdmin && (
                       <Card className={`border border-slate-100 shadow-sm text-white ${isOrg ? 'bg-[#043E52]' : 'bg-[#1C9290]'}`}>
                         <CardContent className="p-5">
                           <h4 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">{isOrg ? 'Impact Summary' : 'Volunteer Hours'}</h4>
                           <p className="text-2xl font-black">{isOrg ? (viewingProfile.impactSummary || 'N/A') : (viewingProfile.totalHours || '0')}</p>
                         </CardContent>
                       </Card>
                     )}
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    {/* Volunteer View */}
                    {!isOrg && !isAdmin && (
                       <Card className="border border-slate-100 shadow-sm h-full">
                         <CardContent className="p-6 space-y-6">
                            <div>
                              <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><UserCheck className="h-4 w-4 text-[#1C9290]" /> Skills & Certifications</h4>
                              <div className="flex flex-wrap gap-2">
                                {viewingProfile.skills?.length > 0 ? viewingProfile.skills.map((s: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="bg-teal-50 text-teal-700">{s}</Badge>
                                )) : <p className="text-sm text-slate-500 italic">No skills listed.</p>}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-[#1C9290]" /> Professional Background</h4>
                              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px]">
                                {viewingProfile.bio || viewingProfile.description || 'No biography provided.'}
                              </p>
                            </div>
                         </CardContent>
                       </Card>
                    )}

                    {/* Organization View */}
                    {isOrg && (
                      <>
                        <Card className="border border-slate-100 shadow-sm">
                          <CardContent className="p-6">
                            <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><Building className="h-4 w-4 text-[#1C9290]" /> Organizational Charter</h4>
                            <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                              {viewingProfile.description || 'No description provided.'}
                            </p>
                          </CardContent>
                        </Card>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="border border-slate-100 shadow-sm">
                              <CardContent className="p-5">
                                <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-[#E16A3D]" /> Board of Directors</h4>
                                <p className="text-sm text-slate-600 bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 leading-relaxed whitespace-pre-wrap">
                                  {viewingProfile.boardMembers || 'Not disclosed.'}
                                </p>
                              </CardContent>
                          </Card>
                          <Card className="border border-slate-100 shadow-sm">
                              <CardContent className="p-5">
                                <h4 className="text-xs font-bold text-[#043E52] uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[#E16A3D]" /> Safeguarding Policy</h4>
                                <p className="text-sm text-slate-600 bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 leading-relaxed whitespace-pre-wrap">
                                  {viewingProfile.safeguardingPolicy || 'Not disclosed.'}
                                </p>
                              </CardContent>
                          </Card>
                        </div>
                      </>
                    )}

                    {/* Admin View */}
                    {isAdmin && (
                      <Card className="border border-slate-100 shadow-sm h-full bg-[#043E52] text-white">
                         <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <Shield className="h-16 w-16 text-[#1C9290] opacity-80" />
                            <h2 className="text-2xl font-black uppercase tracking-widest">System Clearance</h2>
                            <p className="text-teal-100 text-sm max-w-md mx-auto">This user holds administrative privileges. All actions are logged and monitored by the Ministry compliance protocol.</p>
                         </CardContent>
                      </Card>
                    )}

                  </div>
               </div>
            </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // MAIN DIRECTORY UI
  // ============================================================================
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#043E52] font-bold text-2xl mb-1">User Management</h1>
          <p className="text-slate-500 text-sm font-medium">Manage access and permissions across the platform</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-[#043E52] hover:bg-slate-50 gap-2 text-sm font-bold">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button onClick={() => setShowAddUserModal(true)} className="bg-[#1C9290] hover:bg-[#157a78] text-white shadow-md gap-2 text-sm font-bold">
            <UserPlus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Users</p>
                <p className="text-3xl font-black text-[#043E52]">{totalUsers}</p>
              </div>
              <div className="bg-[#043E52]/10 text-[#043E52] p-3 rounded-xl"><UserCheck className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Volunteers</p>
                <p className="text-3xl font-black text-[#1C9290]">{volunteers.length}</p>
              </div>
              <div className="bg-[#1C9290]/10 text-[#1C9290] p-3 rounded-xl"><UserCheck className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Organizations</p>
                <p className="text-3xl font-black text-[#016A6D]">{organizations.length}</p>
              </div>
              <div className="bg-[#016A6D]/10 text-[#016A6D] p-3 rounded-xl"><Building2 className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Admins</p>
                <p className="text-3xl font-black text-[#E16A3D]">{admins.length}</p>
              </div>
              <div className="bg-[#E16A3D]/10 text-[#E16A3D] p-3 rounded-xl"><Shield className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-slate-200 focus:border-[#1C9290] focus:ring-[#1C9290] h-11 bg-white" 
          />
        </div>

        <Tabs defaultValue="volunteers" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit h-auto">
            <TabsTrigger value="volunteers" className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-6 py-2 font-bold text-xs uppercase tracking-wider rounded-lg">Volunteers</TabsTrigger>
            <TabsTrigger value="organizations" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-6 py-2 font-bold text-xs uppercase tracking-wider rounded-lg">Organizations</TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-white data-[state=active]:text-[#E16A3D] data-[state=active]:shadow-sm px-6 py-2 font-bold text-xs uppercase tracking-wider rounded-lg">Admins</TabsTrigger>
          </TabsList>

          {/* VOLUNTEERS TABLE */}
          <TabsContent value="volunteers">
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-100">
                    <TableRow>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider pl-6 h-12">User Name</TableHead>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider h-12">Join Date</TableHead>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider h-12">Activity</TableHead>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider h-12">Status</TableHead>
                      <TableHead className="text-right text-[#043E52] font-bold text-xs uppercase tracking-wider pr-6 h-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No volunteers found.</TableCell></TableRow>
                    ) : filteredVolunteers.map((volunteer) => (
                      <TableRow key={volunteer.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-slate-200">
                              <AvatarImage src={volunteer.photoUrl || volunteer.image} className="object-cover" />
                              <AvatarFallback className="bg-[#1C9290] text-white font-bold">{volunteer.name?.substring(0, 2)?.toUpperCase() || 'VU'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[#043E52] font-bold">{volunteer.name || 'Unnamed User'}</p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5"><Mail className="h-3 w-3" />{volunteer.email || 'No email provided'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium text-sm">{formatDate(volunteer.createdAt || volunteer.joinDate)}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#1C9290]" /><span className="font-bold text-slate-700 text-sm">{volunteer.totalHours || 0} hrs</span></div></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={(volunteer.status?.toLowerCase() === 'suspended') ? 'bg-red-50 text-red-700 border-red-200 font-bold uppercase tracking-wider text-[10px]' : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold uppercase tracking-wider text-[10px]'}>
                            {volunteer.status || 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#043E52] hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 font-medium">
                              <DropdownMenuLabel className="text-xs text-slate-400 uppercase tracking-widest">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingProfile(volunteer)}>View Profile</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendMessage(volunteer.email)}><Mail className="mr-2 h-4 w-4" /> Send Message</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleAccountStatus(volunteer.id, volunteer.collectionName || 'users', volunteer.status)} className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer font-bold">
                                {volunteer.status?.toLowerCase() === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORGANIZATIONS TABLE */}
          <TabsContent value="organizations">
             <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-100">
                    <TableRow>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider pl-6 h-12">Organization</TableHead>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider h-12">Join Date</TableHead>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider h-12">Status</TableHead>
                      <TableHead className="text-right text-[#043E52] font-bold text-xs uppercase tracking-wider pr-6 h-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No organizations found.</TableCell></TableRow>
                    ) : filteredOrganizations.map((org) => (
                      <TableRow key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-slate-200">
                              <AvatarImage src={org.photoUrl || org.logoUrl || org.image} className="object-cover" />
                              <AvatarFallback className="bg-[#043E52] text-white font-bold">{org.name?.substring(0, 2)?.toUpperCase() || 'OR'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[#043E52] font-bold">{org.name || 'Unnamed Org'}</p>
                                {(org.verified || org.verificationStatus === 'verified') && <Badge className="bg-[#1C9290] hover:bg-[#157a78] text-[9px] px-1.5 py-0 h-4 leading-none uppercase tracking-widest">Verified</Badge>}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail className="h-3 w-3" />{org.email || 'No email'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium text-sm">{formatDate(org.createdAt || org.joinDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            org.status?.toLowerCase() === 'suspended' ? 'bg-red-50 text-red-700 border-red-200 font-bold uppercase tracking-wider text-[10px]' :
                            (org.verified || org.verificationStatus === 'verified')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold uppercase tracking-wider text-[10px]' 
                            : 'bg-amber-50 text-amber-700 border-amber-200 font-bold uppercase tracking-wider text-[10px]'
                          }>
                            {org.status?.toLowerCase() === 'suspended' ? 'Suspended' : (org.verificationStatus || org.status || 'Pending')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#043E52] hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 font-medium">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingProfile(org)}>View Profile</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => alert("Verification is handled in the Verification Requests tab.")}>Manage Verification</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendMessage(org.email)}><Mail className="mr-2 h-4 w-4" /> Send Message</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleAccountStatus(org.id, org.collectionName || 'organizations', org.status)} className="text-red-600 hover:bg-red-50 cursor-pointer font-bold">
                                {org.status?.toLowerCase() === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADMINS TABLE */}
          <TabsContent value="admins">
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-100">
                    <TableRow>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider pl-6 h-12">Admin User</TableHead>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider h-12">Role</TableHead>
                      <TableHead className="text-[#043E52] font-bold text-xs uppercase tracking-wider h-12">Last Active</TableHead>
                      <TableHead className="text-right text-[#043E52] font-bold text-xs uppercase tracking-wider pr-6 h-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No admins found.</TableCell></TableRow>
                    ) : filteredAdmins.map((admin) => (
                      <TableRow key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-slate-200">
                              <AvatarImage src={admin.photoUrl || admin.image} className="object-cover" />
                              <AvatarFallback className="bg-[#E16A3D] text-white font-bold">{admin.name?.substring(0, 2)?.toUpperCase() || 'AD'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[#043E52] font-bold">{admin.name || 'Unnamed Admin'}</p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5"><Mail className="h-3 w-3" />{admin.email || 'No email'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge className="bg-[#043E52] hover:bg-[#033040] text-white font-bold uppercase tracking-widest text-[9px] px-2 py-0.5">{admin.accessLevel || 'System Admin'}</Badge></TableCell>
                        <TableCell><div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Clock className="h-4 w-4 text-[#043E52]" />{formatDate(admin.lastActiveAt || admin.updatedAt || admin.createdAt)}</div></TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#043E52] hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 font-medium">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingProfile(admin)}>View Profile</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => alert("Activity Logs feature is scheduled for Phase 3 deployment.")}>View Activity Log</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => revokeAdminAccess(admin.id, admin.collectionName || 'users')} className="text-red-600 hover:bg-red-50 font-bold cursor-pointer">Revoke Access</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ================================================================================= */}
      {/* 🔥 ADD USER MODAL 🔥 */}
      {/* ================================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#043E52]/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-none">
            <div className="p-6 bg-[#043E52] text-white flex justify-between items-start shrink-0">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <Shield className="h-5 w-5 text-[#1C9290]" />
                   <h2 className="font-bold text-lg leading-tight uppercase tracking-tight">Provision New User</h2>
                 </div>
                 <p className="text-teal-200 text-xs font-semibold">Secure Database Injection</p>
               </div>
               <button onClick={() => setShowAddUserModal(false)} className="text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="p-6 bg-slate-50 space-y-4">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</Label>
                    <Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="h-11 bg-white border-slate-200 focus:border-[#1C9290]" placeholder="John Doe" />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</Label>
                    <Input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="h-11 bg-white border-slate-200 focus:border-[#1C9290]" placeholder="john@example.com" />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secure Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="h-11 bg-white pl-10 border-slate-200 focus:border-[#1C9290]" placeholder="••••••••" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Role</Label>
                    <select 
                      value={newUser.role} 
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                      className="w-full h-11 bg-white border border-slate-200 rounded-md px-3 text-sm focus:ring-[#1C9290] outline-none font-medium text-[#043E52]"
                    >
                      <option value="volunteer">Volunteer</option>
                      <option value="organization">Organization</option>
                      <option value="admin">System Administrator</option>
                    </select>
                 </div>
                 
                 <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4">
                   <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Architectural Note</p>
                   <p className="text-[10px] text-amber-700 leading-relaxed">
                     To prevent session logout on the client-side, this form utilizes a secondary Firebase app instance to provision Auth credentials, securely linking them to Firestore.
                   </p>
                 </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                 <Button type="button" variant="outline" className="text-slate-500 font-bold uppercase tracking-wider text-xs h-10" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
                 <Button type="submit" disabled={isSubmittingUser} className="bg-[#1C9290] hover:bg-[#157a78] text-white font-bold px-6 shadow-md h-10 uppercase tracking-wider text-xs">
                    {isSubmittingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Provision Account'}
                 </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}