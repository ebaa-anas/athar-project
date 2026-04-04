import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; 
import { Calendar, Clock, AlertCircle, CheckCircle2, ShieldAlert, Shield, MapPin, Inbox, Send, FileText, Radio } from 'lucide-react';

import { useUserProfile } from '../hooks/useUserProfile';
import { auth } from '../lib/firebase';

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

// Safe Date Formatter
const formatDate = (timestamp: any) => {
  try {
    if (!timestamp) return 'Ongoing';
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString();
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    return 'Ongoing';
  } catch (e) { return 'Ongoing'; }
};

const getPriorityColor = (priority: any) => {
  const p = String(priority || '').toLowerCase();
  switch (p) {
    case 'critical': case 'high': return 'bg-red-100 text-red-700 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-teal-100 text-teal-700 border-teal-200';
  }
};

export function MyTasks() {
  const { user } = useUserProfile();
  
  const [applications, setApplications] = useState<any[]>([]);
  const [crisisResponses, setCrisisResponses] = useState<any[]>([]);
  const [allCrises, setAllCrises] = useState<any[]>([]);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'actionable' | 'verifying' | 'completed'>('actionable');

  // 🔥 ADDED orgId TO THE PROOF MODAL STATE 🔥
  const [proofModal, setProofModal] = useState<{isOpen: boolean, id: string, type: 'normal'|'crisis', title: string, orgId: string} | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [proofLink, setProofLink] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  useEffect(() => {
    if (!user) return;
    const qApps = query(collection(db, "applications"), where("volunteerId", "==", user.uid));
    const unsubApps = onSnapshot(qApps, (snap) => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qResp = query(collection(db, "crisisResponses"), where("volunteerId", "==", user.uid));
    const unsubResp = onSnapshot(qResp, (snap) => setCrisisResponses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubCrises = onSnapshot(collection(db, "crises"), (snap) => setAllCrises(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOrgs = onSnapshot(collection(db, "organizations"), (snap) => setAllOrgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubApps(); unsubResp(); unsubCrises(); unsubOrgs(); };
  }, [user]);

  const getFilteredNormal = () => applications.filter(a => {
    const stat = String(a.status).toLowerCase();
    if (statusFilter === 'all') return stat !== 'rejected';
    if (statusFilter === 'actionable') return stat === 'accepted';
    if (statusFilter === 'verifying') return stat === 'pending_verification';
    if (statusFilter === 'completed') return stat === 'completed';
    return false;
  }).map(a => ({ ...a, isCompleted: String(a.status).toLowerCase() === 'completed', isVerifying: String(a.status).toLowerCase() === 'pending_verification', displayPriority: a.priority || 'Medium' }));

  const getFilteredCrisis = () => crisisResponses.filter(r => {
    const stat = String(r.status).toLowerCase();
    if (statusFilter === 'all') return stat !== 'rejected';
    if (statusFilter === 'actionable') return stat === 'accepted';
    if (statusFilter === 'verifying') return stat === 'pending_verification';
    if (statusFilter === 'completed') return stat === 'completed';
    return false;
  }).map(r => ({ ...r, crisisData: allCrises.find(c => c.id === r.crisisId) || {}, isCompleted: String(r.status).toLowerCase() === 'completed', isVerifying: String(r.status).toLowerCase() === 'pending_verification', displayPriority: (allCrises.find(c => c.id === r.crisisId) || {}).severity || 'Critical' }));

  const filteredNormal = getFilteredNormal();
  const filteredCrisis = getFilteredCrisis();

  const totalActionable = applications.filter(a => String(a.status).toLowerCase() === 'accepted').length + crisisResponses.filter(r => String(r.status).toLowerCase() === 'accepted').length;
  const totalVerifying = applications.filter(a => String(a.status).toLowerCase() === 'pending_verification').length + crisisResponses.filter(r => String(r.status).toLowerCase() === 'pending_verification').length;
  const totalCompleted = applications.filter(a => String(a.status).toLowerCase() === 'completed').length + crisisResponses.filter(r => String(r.status).toLowerCase() === 'completed').length;

  // --- 3. SUBMIT PROOF & FIRE NOTIFICATION ---
  const handleSubmitVerification = async () => {
    if (!proofModal || !user) return;
    setIsSubmittingProof(true);
    try {
      const collectionName = proofModal.type === 'normal' ? 'applications' : 'crisisResponses';
      
      // 1. Update Application Status
      await updateDoc(doc(db, collectionName, proofModal.id), {
        status: 'pending_verification',
        proofNote: proofNote,
        proofLink: proofLink,
        submittedAt: serverTimestamp()
      });

      // 2. 🔥 SEND REAL-TIME NOTIFICATION TO ORGANIZATION 🔥
      if (proofModal.orgId) {
        await addDoc(collection(db, "notifications"), {
          orgId: proofModal.orgId, 
          title: 'Action Required: Verification Request',
          message: `${user.name || 'A volunteer'} has submitted proof of completion for "${proofModal.title}". Please review it in your Verification Desk.`,
          type: 'alert', // Will show up with the Orange Alert icon
          read: false,
          createdAt: serverTimestamp(),
          link: '/applications' // Points them to the right page
        });
      }

      setProofModal(null);
      setProofNote('');
      setProofLink('');
      setStatusFilter('verifying');
    } catch (e) {
      console.error(e);
      alert("Failed to submit verification request.");
    }
    setIsSubmittingProof(false);
  };

  const renderCard = (task: any, isCrisis: boolean) => {
    const title = isCrisis ? (task.crisisData?.title || 'Emergency Mission') : (task.opportunity || task.oppTitle || task.title || 'Community Mission');
    const matchedOrg = allOrgs.find(org => org.id === task.orgId);
    const org = isCrisis ? (task.crisisData?.organization || 'Command Center') : (matchedOrg?.name || task.orgName || task.organizationName || task.organization || 'Organization Unknown');
    const descriptionSnippet = isCrisis ? task.crisisData?.description : (task.description || `Cover Letter: "${task.coverLetter || 'No cover letter provided.'}"`);
    
    // We need the orgId to send the notification!
    const targetOrgId = isCrisis ? task.crisisData?.orgId : task.orgId;

    if (task.isCompleted) {
      return (
        <div key={task.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
          <div className={`p-2 rounded-lg ${isCrisis ? 'bg-red-100' : 'bg-teal-100'}`}><CheckCircle2 className={`h-5 w-5 ${isCrisis ? 'text-red-600' : 'text-teal-600'}`} /></div>
          <div className="flex-1">
            <h4 className="text-gray-900 font-bold">{title}</h4>
            <div className="flex items-center gap-3 mt-1 text-sm font-medium text-gray-500">
              <span className={isCrisis ? 'text-red-700' : 'text-[#1C9290]'}>{org}</span><span>•</span>
              {/* Fix for the "Ongoing" issue you mentioned earlier */}
              <span>Verified on {formatDate(task.verifiedAt || task.completedAt || task.submittedAt)}</span>
              {isCrisis && <Badge className="bg-red-100 text-red-700 border-none h-5 px-1.5 text-[10px]">AVR</Badge>}
            </div>
          </div>
        </div>
      );
    }

    if (task.isVerifying) {
      return (
        <div key={task.id} className="flex gap-4 p-5 border border-amber-200 bg-amber-50/30 rounded-xl shadow-sm opacity-90">
          <div className="pt-1"><Clock className="h-5 w-5 text-amber-500 animate-pulse" /></div>
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1"><h3 className="text-gray-900 font-bold text-lg">{title}</h3><p className="text-sm text-gray-600 mt-1">Verification submitted on {formatDate(task.submittedAt)}.</p></div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">IN REVIEW</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium"><span className="text-amber-700">{org}</span></div>
            <div className="bg-white p-3 rounded-lg border border-amber-100 text-sm text-slate-500 italic mt-2">Waiting for Organization to review request and release Impact Score.</div>
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} className={`flex gap-4 p-5 border-2 rounded-xl transition-colors shadow-sm bg-white ${isCrisis ? 'border-red-100 hover:border-red-300' : 'border-slate-200 hover:border-[#1C9290]'}`}>
        <div className="pt-1">
          {isCrisis ? <AlertCircle className="h-5 w-5 text-red-500" /> : <div onClick={() => setProofModal({isOpen: true, id: task.id, type: 'normal', title, orgId: targetOrgId})}><Checkbox className="h-5 w-5 border-slate-300 data-[state=checked]:bg-[#1C9290]" /></div>}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1"><h3 className="text-gray-900 font-bold text-lg">{title}</h3><p className="text-sm text-gray-600 mt-1 line-clamp-2">{descriptionSnippet}</p></div>
            <Badge variant="outline" className={getPriorityColor(task.displayPriority)}>{String(task.displayPriority).toUpperCase()}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <span className={isCrisis ? "text-red-700 font-bold" : "text-[#1C9290]"}>{org}</span>
            <div className={`flex items-center gap-1.5 font-bold ${isCrisis ? 'text-red-600' : 'text-orange-600'}`}><Clock className="h-4 w-4" /> <span>Deadline: {isCrisis ? 'IMMEDIATE' : (task.deadline ? formatDate(task.deadline) : 'Ongoing')}</span></div>
            {isCrisis && <div className="flex items-center gap-1 text-gray-500"><MapPin className="h-4 w-4" /> <span>{task.crisisData?.location}</span></div>}
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => setProofModal({isOpen: true, id: task.id, type: isCrisis ? 'crisis' : 'normal', title, orgId: targetOrgId})} className={`font-bold shadow-md ${isCrisis ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#043E52] hover:bg-[#033040] text-white'}`}>
              {isCrisis ? "End Shift & Request Verify" : "Submit for Verification"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedTask(task)} className="border-slate-200 hover:bg-slate-50 font-bold text-slate-600">{isCrisis ? "Mission Briefing" : "Application Details"}</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      <div className="flex items-center justify-between"><div><h1 className="text-gray-900 text-2xl font-bold">My Tasks</h1><p className="text-gray-500 mt-1">Manage active missions and submit completed work for verification.</p></div></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-red-500 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold text-slate-500 uppercase">Action Required</p><p className="text-2xl font-black text-gray-900 mt-1">{totalActionable}</p></CardContent></Card>
        <Card className="border-t-4 border-t-amber-500 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold text-slate-500 uppercase">In Review</p><p className="text-2xl font-black text-gray-900 mt-1">{totalVerifying}</p></CardContent></Card>
        <Card className="border-t-4 border-t-teal-500 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold text-slate-500 uppercase">Verified Total</p><p className="text-2xl font-black text-gray-900 mt-1">{totalCompleted}</p></CardContent></Card>
        <Card className="border-t-4 border-t-purple-500 shadow-sm bg-purple-50/30"><CardContent className="p-5"><p className="text-xs font-bold text-purple-700 uppercase">Impact Score</p><p className="text-2xl font-black text-purple-800 mt-1">{user?.impactScore || 0}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 py-2">
        <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')} className={`rounded-xl h-10 px-6 font-bold transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>All Missions</Button>
        <Button variant={statusFilter === 'actionable' ? 'default' : 'outline'} onClick={() => setStatusFilter('actionable')} className={`rounded-xl h-10 px-6 font-bold transition-all ${statusFilter === 'actionable' ? 'bg-[#E16A3D] text-white shadow-md' : 'text-[#E16A3D] border-orange-200 hover:bg-orange-50'}`}>▶️ Actionable</Button>
        <Button variant={statusFilter === 'verifying' ? 'default' : 'outline'} onClick={() => setStatusFilter('verifying')} className={`rounded-xl h-10 px-6 font-bold transition-all ${statusFilter === 'verifying' ? 'bg-amber-500 text-white shadow-md' : 'text-amber-600 border-amber-200 hover:bg-amber-50'}`}>⏳ In Review</Button>
        <Button variant={statusFilter === 'completed' ? 'default' : 'outline'} onClick={() => setStatusFilter('completed')} className={`rounded-xl h-10 px-6 font-bold transition-all ${statusFilter === 'completed' ? 'bg-[#1C9290] text-white shadow-md' : 'text-[#1C9290] border-teal-200 hover:bg-teal-50'}`}>✅ Verified</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12 mb-6">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white font-bold text-slate-500 data-[state=active]:text-[#043E52]">All Types</TabsTrigger>
          <TabsTrigger value="standard" className="rounded-lg data-[state=active]:bg-white font-bold text-slate-500 data-[state=active]:text-[#1C9290]">Standard Tasks</TabsTrigger>
          <TabsTrigger value="crisis" className="rounded-lg data-[state=active]:bg-white font-bold text-slate-500 data-[state=active]:text-red-600">AVR Deployments</TabsTrigger>
        </TabsList>
        {(() => {
          const renderLists = (showNormal: boolean, showCrisis: boolean) => {
            if ((!showNormal || filteredNormal.length === 0) && (!showCrisis || filteredCrisis.length === 0)) return <EmptyState message={`No missions found for status: ${statusFilter.toUpperCase()}`} />;
            return <div className="space-y-6">{showCrisis && filteredCrisis.map(task => renderCard(task, true))}{showNormal && filteredNormal.map(task => renderCard(task, false))}</div>;
          };
          return (
            <>
              <TabsContent value="all" className="mt-0">{renderLists(true, true)}</TabsContent>
              <TabsContent value="standard" className="mt-0">{renderLists(true, false)}</TabsContent>
              <TabsContent value="crisis" className="mt-0">{renderLists(false, true)}</TabsContent>
            </>
          );
        })()}
      </Tabs>

      {/* --- PROOF MODAL --- */}
      {proofModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <Card className="w-full max-w-lg shadow-2xl border-none rounded-2xl overflow-hidden">
             <CardHeader className="bg-[#043E52] text-white p-6">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-full"><Send className="h-5 w-5" /></div><CardTitle className="text-xl font-bold">Request Verification</CardTitle></div>
                  <Button variant="ghost" onClick={() => setProofModal(null)} className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0">✕</Button>
               </div>
             </CardHeader>
             <CardContent className="p-6 space-y-5 bg-slate-50">
                <div className="bg-white p-4 rounded-xl border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Mission</p><p className="font-bold text-[#043E52]">{proofModal.title}</p></div>
                <div className="space-y-2"><label className="font-bold text-slate-700 block mb-1">Completion Note (Optional)</label><textarea placeholder="e.g. Completed my 4-hour shift today." className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1C9290] resize-none" value={proofNote} onChange={(e) => setProofNote(e.target.value)} /></div>
                {proofModal.type === 'normal' && (
                  <div className="space-y-2"><label className="font-bold text-slate-700 block mb-1">Deliverable Link (If Remote/Online)</label><input placeholder="e.g. Google Drive link..." className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1C9290]" value={proofLink} onChange={(e) => setProofLink(e.target.value)} /><p className="text-[10px] text-slate-500 mt-1">Provide proof of work to expedite verification.</p></div>
                )}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800 text-sm font-medium"><ShieldAlert className="h-5 w-5 shrink-0 text-blue-600" /><p>By submitting this, you certify you have completed the required hours.</p></div>
                <Button onClick={handleSubmitVerification} disabled={isSubmittingProof} className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white font-bold h-12 shadow-md">{isSubmittingProof ? "Submitting..." : "Submit to Organization"}</Button>
             </CardContent>
          </Card>
        </div>
      )}

      {/* --- DETAILS MODAL --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <Card className="w-full max-w-2xl shadow-2xl border-none rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <CardHeader className={`${selectedTask.crisisData ? 'bg-[#E16A3D]' : 'bg-[#043E52]'} text-white p-6 shrink-0`}>
               <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-white/20 text-white border-none mb-2 tracking-widest">{selectedTask.crisisData ? 'DEPLOYMENT ORDER' : 'APPLICATION RECORD'}</Badge>
                    <CardTitle className="text-2xl font-bold">{selectedTask.oppTitle || selectedTask.opportunity || selectedTask.title || selectedTask.crisisData?.title}</CardTitle>
                    <p className="text-white/80 mt-1 font-medium">{selectedTask.crisisData ? (selectedTask.crisisData.organization) : (allOrgs.find(o => o.id === selectedTask.orgId)?.name || selectedTask.orgName || 'Organization')}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedTask(null)} className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0">✕</Button>
               </div>
             </CardHeader>
             <CardContent className="p-0 overflow-y-auto bg-slate-50">
                {selectedTask.crisisData ? (
                  <div className="p-8 space-y-8">
                    <div><h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Situation Report</h4><p className="text-slate-700 leading-relaxed bg-white p-5 rounded-xl border border-slate-200 text-lg">{selectedTask.crisisData.description}</p></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rally Point</p><div className="flex items-center gap-3 text-slate-700 font-bold bg-white p-4 rounded-xl border border-slate-200"><MapPin className="h-5 w-5 text-[#E16A3D]" /><span>{selectedTask.crisisData.location}</span></div></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</p><div className="flex items-center gap-3 text-slate-700 font-bold bg-white p-4 rounded-xl border border-slate-200"><AlertCircle className="h-5 w-5 text-red-500" /><span>{String(selectedTask.crisisData.severity).toUpperCase()}</span></div></div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 space-y-8">
                    <div><h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Mission Overview</h4><p className="text-slate-700 leading-relaxed bg-white p-5 rounded-xl border border-slate-200 text-lg">{selectedTask.description || selectedTask.opportunityDescription || 'No detailed description provided.'}</p></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Location Setup</p><div className="flex items-center gap-3 text-slate-700 font-bold bg-white p-4 rounded-xl border border-slate-200"><MapPin className="h-5 w-5 text-[#1C9290]" /><span>{selectedTask.location || 'Based on Org Instructions'}</span></div></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Project Deadline</p><div className="flex items-center gap-3 text-slate-700 font-bold bg-white p-4 rounded-xl border border-slate-200"><Clock className="h-5 w-5 text-orange-500" /><span className="text-orange-600">{selectedTask.deadline ? formatDate(selectedTask.deadline) : 'Ongoing'}</span></div></div>
                    </div>
                    <div className="pt-6 border-t border-slate-200"><h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText className="h-4 w-4"/> Your Cover Letter</h4><div className="bg-slate-100 p-6 rounded-xl border border-slate-200 text-slate-700 leading-relaxed italic text-lg shadow-inner">"{selectedTask.coverLetter || 'No cover letter submitted.'}"</div></div>
                  </div>
                )}
             </CardContent>
             <div className="p-4 bg-white border-t border-slate-100"><Button onClick={() => setSelectedTask(null)} className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold h-12">Close Briefing</Button></div>
          </Card>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
      <CardContent className="p-16 text-center flex flex-col items-center">
        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-4"><Inbox className="h-8 w-8 text-slate-300" /></div>
        <p className="text-slate-500 font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}