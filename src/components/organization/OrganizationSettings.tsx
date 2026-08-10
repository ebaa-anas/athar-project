import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, updatePassword, signOut } from "firebase/auth";
import { 
  getFirestore, doc, getDoc, updateDoc, collection, 
  onSnapshot, addDoc, deleteDoc, serverTimestamp 
} from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

import { 
  Settings, Shield, Users, Bell, CreditCard, 
  Trash2, Plus, Mail, Eye, EyeOff, Loader2, CheckCircle2,
  Activity, Radio 
} from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';

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

export function OrganizationSettings() {
  const { user } = useUserProfile();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [orgData, setOrgData] = useState({
    name: "", email: "", phone: "", website: ""
  });

  const [preferences, setPreferences] = useState({
    autoApprove: false, publicProfile: true, emailDigest: true,
    notifyApplications: true, notifyEvents: true, notifyMessages: true
  });

  const [securityData, setSecurityData] = useState({
    newPassword: "", confirmPassword: ""
  });

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: "", email: "", role: "Coordinator" });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchOrgData = async () => {
      try {
        const orgRef = doc(db, "organizations", user.uid);
        const orgSnap = await getDoc(orgRef);
        
        if (orgSnap.exists()) {
          const data = orgSnap.data();
          setOrgData({
            name: data.name || "", email: data.email || "",
            phone: data.phone || "", website: data.website || ""
          });
          
          if (data.preferences) {
            setPreferences({
              autoApprove: data.preferences.autoApprove ?? false,
              publicProfile: data.preferences.publicProfile ?? true,
              emailDigest: data.preferences.emailDigest ?? true,
              notifyApplications: data.preferences.notifyApplications ?? true,
              notifyEvents: data.preferences.notifyEvents ?? true,
              notifyMessages: data.preferences.notifyMessages ?? true
            });
          }
        }
      } catch (error) {
        console.error("Error fetching org profile:", error);
      }
    };

    const teamRef = collection(db, "organizations", user.uid, "team");
    const unsubTeam = onSnapshot(teamRef, (snapshot) => {
      const fetchedTeam = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(fetchedTeam);
      setLoading(false);
    });

    fetchOrgData();
    return () => unsubTeam();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      const orgRef = doc(db, "organizations", user.uid);
      await updateDoc(orgRef, {
        name: orgData.name, email: orgData.email, phone: orgData.phone,
        website: orgData.website, preferences: preferences
      });
      alert("Settings and Preferences updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to save settings. Please try again.");
    }
    setIsSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!securityData.newPassword || !securityData.confirmPassword) return alert("Please fill in both password fields.");
    if (securityData.newPassword !== securityData.confirmPassword) return alert("Passwords do not match!");
    if (securityData.newPassword.length < 6) return alert("Password must be at least 6 characters long.");

    setIsSaving(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, securityData.newPassword);
        alert("Password updated securely!");
        setSecurityData({ newPassword: "", confirmPassword: "" });
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert("Security requirement: Please log out and log back in to change your password.");
      } else {
        alert(error.message || "Failed to update password.");
      }
    }
    setIsSaving(false);
  };

  const handleRevokeAccess = async () => {
    if (window.confirm("This will sign you out of this device immediately. Are you sure?")) {
      await signOut(auth);
      window.location.href = "/";
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email) return alert("Name and Email are required.");
    setIsSaving(true);
    try {
      await addDoc(collection(db, "organizations", user!.uid, "team"), {
        name: inviteData.name,
        email: inviteData.email,
        role: inviteData.role,
        status: "pending",
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${inviteData.name}`,
        invitedAt: serverTimestamp()
      });
      setIsInviteModalOpen(false);
      setInviteData({ name: "", email: "", role: "Coordinator" });
    } catch (error) {
      console.error(error);
      alert("Failed to invite staff.");
    }
    setIsSaving(false);
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "organizations", user!.uid, "team", editData.id), {
        role: editData.role
      });
      setIsEditModalOpen(false);
      setEditData(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update role.");
    }
    setIsSaving(false);
  };

  const handleRemoveStaff = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to revoke access for this team member?")) return;
    try {
      await deleteDoc(doc(db, "organizations", user!.uid, "team", memberId));
    } catch (error) {
      console.error(error);
      alert("Failed to remove staff.");
    }
  };

  // Stubbed out: a real implementation would trigger a PDF blob download.
  const handleDownloadInvoice = (invoiceId: string) => {
    alert(`Generating PDF for ${invoiceId}... The download will begin shortly.`);
  };

  if (loading) return <div className="p-12 text-center text-[#043E52] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Loading Configuration...</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-[#043E52] uppercase tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-1 text-sm font-semibold">Manage your organizational configuration and access</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full md:w-auto flex justify-start mb-6">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-5 font-bold text-xs uppercase tracking-wider">General</TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-5 font-bold text-xs uppercase tracking-wider">Team</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-5 font-bold text-xs uppercase tracking-wider">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-5 font-bold text-xs uppercase tracking-wider">Notifications</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-5 font-bold text-xs uppercase tracking-wider">Billing</TabsTrigger>
        </TabsList>

        {/* GENERAL SETTINGS */}
        <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold text-[#043E52] uppercase">Organization Information</CardTitle>
              <CardDescription className="text-xs font-semibold mt-1">Update your organization's public directory data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Organization Name</Label>
                <Input 
                  value={orgData.name} 
                  onChange={e => setOrgData({...orgData, name: e.target.value})} 
                  className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52] h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Contact Email</Label>
                <Input 
                  type="email" 
                  value={orgData.email} 
                  onChange={e => setOrgData({...orgData, email: e.target.value})} 
                  className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52] h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Phone Number</Label>
                <Input 
                  value={orgData.phone} 
                  onChange={e => setOrgData({...orgData, phone: e.target.value})} 
                  className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52] h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Website</Label>
                <Input 
                  value={orgData.website} 
                  onChange={e => setOrgData({...orgData, website: e.target.value})} 
                  className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52] h-11" 
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Button onClick={handleUpdateProfile} disabled={isSaving} className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md font-bold h-11 px-8 text-xs uppercase tracking-wider">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold text-[#043E52] uppercase">System Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="auto-approve" className="flex-1 text-slate-700 cursor-pointer">
                  <span className="text-sm font-bold">Auto-Approve Elite Volunteers</span>
                  <p className="text-xs text-slate-500 mt-1">Volunteers with 4.5+ ratings bypass manual review</p>
                </Label>
                <Switch 
                  id="auto-approve" 
                  checked={preferences.autoApprove}
                  onCheckedChange={(checked) => setPreferences({...preferences, autoApprove: checked})}
                />
              </div>
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="public-profile" className="flex-1 text-slate-700 cursor-pointer">
                  <span className="text-sm font-bold">Public Directory Listing</span>
                  <p className="text-xs text-slate-500 mt-1">Allow volunteers to find your org without an active mission</p>
                </Label>
                <Switch 
                  id="public-profile" 
                  checked={preferences.publicProfile}
                  onCheckedChange={(checked) => setPreferences({...preferences, publicProfile: checked})}
                />
              </div>
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="email-digest" className="flex-1 text-slate-700 cursor-pointer">
                  <span className="text-sm font-bold">Daily Activity Report</span>
                  <p className="text-xs text-slate-500 mt-1">Receive an automated email summary at 08:00 AM</p>
                </Label>
                <Switch 
                  id="email-digest" 
                  checked={preferences.emailDigest}
                  onCheckedChange={(checked) => setPreferences({...preferences, emailDigest: checked})}
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Button onClick={handleUpdateProfile} disabled={isSaving} className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md font-bold h-11 px-8 text-xs uppercase tracking-wider">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#043E52] uppercase">Command Staff</CardTitle>
                  <CardDescription className="text-xs font-semibold mt-1">Manage personnel access levels</CardDescription>
                </div>
                
                {/* Invite modal */}
                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1C9290] hover:bg-[#157a78] text-white shadow-md font-bold h-10 px-5 text-[10px] uppercase tracking-widest">
                      <Plus className="mr-2 h-3.5 w-3.5" /> Invite Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-none rounded-2xl shadow-2xl p-8">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-[#043E52] uppercase tracking-tight">Invite Team Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInviteStaff} className="space-y-5 pt-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Full Name</Label>
                        <Input value={inviteData.name} onChange={e => setInviteData({...inviteData, name: e.target.value})} className="border-slate-200 h-11" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Email Address</Label>
                        <Input type="email" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} className="border-slate-200 h-11" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Access Role</Label>
                        <select value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value})} className="w-full h-11 px-3 border border-slate-200 rounded-md text-sm font-semibold text-[#043E52]">
                          <option>Administrator</option>
                          <option>Manager</option>
                          <option>Coordinator</option>
                        </select>
                      </div>
                      <Button type="submit" disabled={isSaving} className="w-full bg-[#043E52] hover:bg-[#033040] text-white font-bold h-11 uppercase tracking-wider text-xs">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Invitation"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-3">
                {teamMembers.length === 0 ? (
                  <div className="text-center p-4 text-slate-400 text-xs font-semibold">No team members added yet.</div>
                ) : teamMembers.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-slate-200 shadow-sm">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-[#043E52] text-white font-bold">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                           <h4 className="text-sm font-bold text-[#043E52]">{member.name}</h4>
                           {member.status === 'pending' && <Badge className="bg-orange-100 text-orange-800 border-none text-[8px] uppercase tracking-wider px-1.5 py-0">Pending</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px] uppercase tracking-wider">{member.role}</Badge>
                      <div className="flex gap-2 ml-auto sm:ml-0">
                        
                        {/* Edit role modal */}
                        <Dialog open={isEditModalOpen && editData?.id === member.id} onOpenChange={(open) => { setIsEditModalOpen(open); if(open) setEditData(member); else setEditData(null); }}>
                          <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-[#043E52] font-bold h-8 text-[10px] uppercase">Edit</Button>
                          </DialogTrigger>
                          <DialogContent className="border-none rounded-2xl shadow-2xl p-8">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-[#043E52] uppercase tracking-tight">Update Access Role</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEditRole} className="space-y-5 pt-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Access Role for {member.name}</Label>
                                <select value={editData?.role || ''} onChange={e => setEditData({...editData, role: e.target.value})} className="w-full h-11 px-3 border border-slate-200 rounded-md text-sm font-semibold text-[#043E52]">
                                  <option>Administrator</option>
                                  <option>Manager</option>
                                  <option>Coordinator</option>
                                </select>
                              </div>
                              <Button type="submit" disabled={isSaving} className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white font-bold h-11 uppercase tracking-wider text-xs">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Role"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Button onClick={() => handleRemoveStaff(member.id)} variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold text-[#043E52] uppercase">Access Matrices</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 border border-slate-100 rounded-xl bg-slate-50/50">
                  <h4 className="text-sm font-bold text-[#043E52] mb-1.5 uppercase">Administrator</h4>
                  <p className="text-[10px] text-slate-500 mb-4 font-semibold uppercase tracking-wide">Full System Access</p>
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-[10px] text-slate-600 font-bold py-1 w-full justify-center">Manage Team & Billing</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-[10px] text-slate-600 font-bold py-1 w-full justify-center">Declare Crisis (SOS)</Badge>
                  </div>
                </div>
                <div className="p-5 border border-slate-100 rounded-xl bg-slate-50/50">
                  <h4 className="text-sm font-bold text-[#043E52] mb-1.5 uppercase">Manager</h4>
                  <p className="text-[10px] text-slate-500 mb-4 font-semibold uppercase tracking-wide">Operations Focus</p>
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-[10px] text-slate-600 font-bold py-1 w-full justify-center">Post Opportunities</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-[10px] text-slate-600 font-bold py-1 w-full justify-center">Review Volunteers</Badge>
                  </div>
                </div>
                <div className="p-5 border border-slate-100 rounded-xl bg-slate-50/50">
                  <h4 className="text-sm font-bold text-[#043E52] mb-1.5 uppercase">Coordinator</h4>
                  <p className="text-[10px] text-slate-500 mb-4 font-semibold uppercase tracking-wide">Field Focus</p>
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-[10px] text-slate-600 font-bold py-1 w-full justify-center">Manage Live Events</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-[10px] text-slate-600 font-bold py-1 w-full justify-center">Message Network</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold text-[#043E52] uppercase">Credential Management</CardTitle>
              <CardDescription className="text-xs font-semibold mt-1">Securely update your login password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">New Password</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                    className="border-slate-200 focus:border-[#043E52] h-11 pr-10" 
                    placeholder="Must be at least 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#043E52]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Confirm New Password</Label>
                <Input 
                  type="password" 
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                  className="border-slate-200 focus:border-[#043E52] h-11" 
                  placeholder="Retype new password"
                />
              </div>
              <div className="pt-2">
                <Button onClick={handleUpdatePassword} disabled={isSaving} className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md font-bold h-11 px-8 text-xs uppercase tracking-wider">
                   {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />} Update Security
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 shadow-sm overflow-hidden">
             <div className="bg-rose-50 p-5 border-b border-rose-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-rose-800 uppercase tracking-tight">Active Sessions</h4>
                  <p className="text-xs text-rose-600/80 font-medium mt-1">Review where your account is currently logged in</p>
                </div>
                <Button onClick={handleRevokeAccess} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-[10px] uppercase tracking-wider h-9 shadow-sm">
                  Revoke All Access
                </Button>
             </div>
             <CardContent className="p-0">
               <div className="flex items-center justify-between p-5 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-full"><Radio className="h-4 w-4 text-slate-500" /></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700">Current Device (Web)</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">IP Logged • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[9px] font-black uppercase tracking-wider">Active Now</Badge>
               </div>
             </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold text-[#043E52] uppercase">Communication Triggers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <Label htmlFor="email-applications" className="flex-1 cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Incoming Applications</span>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Alert when a volunteer applies for a mission</p>
                </Label>
                <Switch 
                  id="email-applications" 
                  checked={preferences.notifyApplications}
                  onCheckedChange={(checked) => setPreferences({...preferences, notifyApplications: checked})}
                />
              </div>
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <Label htmlFor="email-events" className="flex-1 cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Roster Capacity Warnings</span>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Alert when an event is 48hrs away and understaffed</p>
                </Label>
                <Switch 
                  id="email-events" 
                  checked={preferences.notifyEvents}
                  onCheckedChange={(checked) => setPreferences({...preferences, notifyEvents: checked})}
                />
              </div>
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <Label htmlFor="email-messages" className="flex-1 cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Direct Messages</span>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Alert when a volunteer messages Command Center</p>
                </Label>
                <Switch 
                  id="email-messages" 
                  checked={preferences.notifyMessages}
                  onCheckedChange={(checked) => setPreferences({...preferences, notifyMessages: checked})}
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Button onClick={handleUpdateProfile} disabled={isSaving} className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md font-bold h-11 px-8 text-xs uppercase tracking-wider">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Save Notification Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#043E52] to-[#1C9290] p-8 text-white relative">
               <Shield className="absolute right-8 top-1/2 -translate-y-1/2 h-32 w-32 text-white/10" />
               <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest mb-3">Athar Enterprise</Badge>
               <h3 className="text-3xl font-black mb-1">Professional Tier</h3>
               <p className="text-teal-100 text-sm font-medium max-w-sm">Full operational capacity for large-scale disaster response and volunteer management.</p>
            </div>
            <CardContent className="p-0">
               <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                  <div className="p-5 text-center bg-white"><Settings className="h-5 w-5 text-[#1C9290] mx-auto mb-2" /><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unlimited Missions</p></div>
                  <div className="p-5 text-center bg-white"><Users className="h-5 w-5 text-[#1C9290] mx-auto mb-2" /><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">5 Admin Seats</p></div>
                  <div className="p-5 text-center bg-white"><Activity className="h-5 w-5 text-[#1C9290] mx-auto mb-2" /><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Advanced Analytics</p></div>
                  <div className="p-5 text-center bg-white"><Radio className="h-5 w-5 text-[#E16A3D] mx-auto mb-2" /><p className="text-[10px] font-bold text-[#E16A3D] uppercase tracking-widest">SOS Protocol Enabled</p></div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold text-[#043E52] uppercase">Ledger History</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-3">
                {[
                  { date: 'Oct 1, 2025', amount: '$49.00', invoice: 'INV-2025-10' },
                  { date: 'Sep 1, 2025', amount: '$49.00', invoice: 'INV-2025-09' },
                  { date: 'Aug 1, 2025', amount: '$49.00', invoice: 'INV-2025-08' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-100 p-3 rounded-lg"><CreditCard className="h-4 w-4 text-slate-500" /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.date}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.invoice}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-[#043E52]">{item.amount}</span>
                      
                      <Button onClick={() => handleDownloadInvoice(item.invoice)} variant="ghost" size="sm" className="text-[#1C9290] hover:bg-teal-50 font-bold text-[10px] uppercase h-8 px-3">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}