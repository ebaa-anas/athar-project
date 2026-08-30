import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../../lib/firebase';

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  AlertTriangle, Eye, CheckCircle, XCircle, Flag, MessageSquare, 
  Clock, Filter, ShieldAlert, Zap, ThumbsUp, Loader2, ShieldCheck, Bug,
  Building, Users
} from 'lucide-react';

export function ContentModeration() {
  const [flaggedContent, setFlaggedContent] = useState<any[]>([]);
  const [reviewedContent, setReviewedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch live reports
  useEffect(() => {
    const q = collection(db, "reports");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pending: any[] = [];
      const reviewed: any[] = [];

      snapshot.docs.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        
        // Default to 'pending' when status is missing, and normalize case for comparison
        const currentStatus = (data.status || 'pending').toLowerCase();

        if (currentStatus === 'pending') {
          pending.push(data);
        } else if (currentStatus === 'reviewed') {
          reviewed.push(data);
        }
      });

      // Firestore timestamps need .toDate() before they can be compared numerically
      pending.sort((a, b) => {
        const timeA = a.reportDate?.toDate ? a.reportDate.toDate().getTime() : 0;
        const timeB = b.reportDate?.toDate ? b.reportDate.toDate().getTime() : 0;
        return timeB - timeA;
      });

      reviewed.sort((a, b) => {
        const timeA = a.reviewedDate?.toDate ? a.reviewedDate.toDate().getTime() : 0;
        const timeB = b.reviewedDate?.toDate ? b.reviewedDate.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setFlaggedContent(pending);
      setReviewedContent(reviewed);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Action handlers
  const handleModerationAction = async (id: string, actionResult: 'Approved' | 'Removed') => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, "reports", id), {
        status: 'reviewed',
        action: actionResult,
        reviewedDate: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Failed to process moderation action.");
    }
    setProcessingId(null);
  };

  const handleMessage = () => {
    alert("Communication module initialized. Connecting to user's registered email...");
  };

  const handleViewContent = () => {
    alert("Navigating to flagged content in read-only sandbox mode...");
  };

  // Demo utility that seeds a fake report, used to showcase the moderation flow live
  const injectSimulatedReport = async () => {
    const types = ['Opportunity Post', 'Comment', 'Organization Profile'];
    const severities = ['high', 'medium', 'low'];
    const reasons = ['Inappropriate content', 'Misleading information', 'Spam/Bot Activity', 'Harassment'];
    
    const randomSelect = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    try {
      await addDoc(collection(db, "reports"), {
        type: randomSelect(types),
        title: `Simulated Flagged Content #${Math.floor(Math.random() * 1000)}`,
        organization: 'Field Unit Beta',
        reportedBy: 'System Monitor',
        reason: randomSelect(reasons),
        reportDate: serverTimestamp(),
        status: 'pending',
        severity: randomSelect(severities),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return { cardBorder: 'border-l-4 border-l-red-500', badge: 'bg-red-600 text-white border-none', bg: 'bg-red-50/50' };
      case 'medium':
        return { cardBorder: 'border-l-4 border-l-amber-500', badge: 'bg-amber-500 text-white border-none', bg: 'bg-amber-50/50' };
      case 'low':
        return { cardBorder: 'border-l-4 border-l-blue-500', badge: 'bg-blue-500 text-white border-none', bg: 'bg-blue-50/50' };
      default:
        return { cardBorder: 'border-l-4 border-l-slate-300', badge: 'bg-slate-500 text-white', bg: 'bg-white' };
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-700 font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Syncing Moderation Queue...</div>;

  const today = new Date().setHours(0,0,0,0);
  const reviewedToday = reviewedContent.filter(item => {
    const d = item.reviewedDate?.toDate ? item.reviewedDate.toDate().getTime() : 0;
    return d >= today;
  }).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 font-bold text-3xl mb-2">Content Moderation</h1>
          <p className="text-slate-500">Review flagged content to keep the community safe</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={injectSimulatedReport} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 border-2 font-bold shadow-sm">
                <Bug className="mr-2 h-4 w-4" /> Simulate Live Report
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-700 font-bold">
                <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button className="bg-role-admin-accent hover:bg-role-admin-accent-dark text-slate-900 font-bold">
                Bulk Actions
            </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Pending Review</p>
                <p className="text-4xl font-black">{flaggedContent.length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-100 bg-black/10 w-fit px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                <Clock className="h-3 w-3" /> Live Queue
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Reviewed Today</p>
                <p className="text-4xl font-black">{reviewedToday}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <ThumbsUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-100 bg-black/10 w-fit px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                <Zap className="h-3 w-3" /> On track
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium mb-1">Total Reports</p>
                <p className="text-4xl font-black">{flaggedContent.length + reviewedContent.length}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <Flag className="h-6 w-6 text-white" />
              </div>
            </div>
             <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 bg-white/5 w-fit px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                Lifetime Log
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-role-admin-accent to-role-admin-accent-dark text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-50 text-sm font-medium mb-1">Auto-Moderated</p>
                <p className="text-4xl font-black">45</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-50 bg-black/10 w-fit px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                AI Filter Active
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flagged" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
          <TabsTrigger
            value="flagged"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all font-bold text-sm uppercase tracking-wider"
          >
            Flagged Content
            <Badge className="ml-2 bg-white text-amber-600 hover:bg-white/90 shadow-none font-black">{flaggedContent.length}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="reviewed"
            className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all font-bold text-sm uppercase tracking-wider"
          >
            Reviewed History
          </TabsTrigger>
        </TabsList>

        {/* Flagged Content List */}
        <TabsContent value="flagged" className="space-y-4">
          {flaggedContent.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <ShieldCheck className="h-16 w-16 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-700">Zero Inbox</h3>
              <p className="text-slate-500 mt-2">The community is safe. No pending reports to review.</p>
              <p className="text-xs text-slate-400 mt-6">(Use the "Simulate Live Report" button above to test the system)</p>
            </div>
          ) : flaggedContent.map((item) => {
            const styles = getSeverityStyles(item.severity);
            return (
              <Card key={item.id} className={`border border-slate-200 shadow-sm hover:shadow-md transition-all ${styles.cardBorder} ${styles.bg}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    
                    {/* Left: Content Info */}
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">{item.type}</Badge>
                          <Badge className={`${styles.badge} uppercase text-[10px] tracking-wider font-bold`}>
                            {item.severity} Severity
                          </Badge>
                        </div>
                        <h3 className="text-slate-900 font-black text-xl leading-tight">{item.title}</h3>
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                           {item.organization && <span className="flex items-center gap-1.5"><Building className="h-4 w-4 text-slate-400" /> {item.organization}</span>}
                           {item.user && <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-slate-400" /> {item.user}</span>}
                        </div>
                      </div>

                      {/* The Report Box */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm mt-2">
                        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-tight">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Reason: {item.reason}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                <Clock className="h-3 w-3" /> {formatTimeAgo(item.reportDate)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Flag className="h-3.5 w-3.5 text-slate-500" />
                            Reported by: <span className="font-bold text-slate-700">{item.reportedBy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 p-6 min-w-[240px] bg-white/50">
                        <Button 
                          onClick={() => handleModerationAction(item.id, 'Approved')} 
                          disabled={processingId === item.id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold uppercase tracking-wider text-xs h-11"
                        >
                            {processingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4" /> Ignore Report</>}
                        </Button>
                        <Button 
                          onClick={() => handleModerationAction(item.id, 'Removed')} 
                          disabled={processingId === item.id}
                          variant="outline" 
                          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold uppercase tracking-wider text-xs h-11"
                        >
                            {processingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="mr-2 h-4 w-4" /> Remove Content</>}
                        </Button>
                        <div className="flex gap-2">
                            <Button onClick={handleViewContent} variant="outline" className="flex-1 text-slate-700 border-slate-200 hover:bg-white h-10">
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleMessage} variant="outline" className="flex-1 text-slate-700 border-slate-200 hover:bg-white h-10">
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Reviewed Content List */}
        <TabsContent value="reviewed" className="space-y-4">
          {reviewedContent.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No content has been reviewed yet.</div>
          ) : reviewedContent.map((item) => (
            <Card key={item.id} className="border-slate-200 bg-white hover:shadow-sm transition-all">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h4 className="text-slate-900 font-bold text-lg mb-1">{item.title}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.type} • {item.organization || item.user || item.reportedBy}</p>
                </div>
                <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 w-full md:w-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-1 md:flex-none text-left md:text-right">{formatTimeAgo(item.reviewedDate)}</span>
                    <Badge className={
                        item.action === 'Approved' 
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold uppercase tracking-wider px-3 py-1' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200 border-none font-bold uppercase tracking-wider px-3 py-1'
                    }>
                        {item.action === 'Approved' ? 'Content Kept' : 'Content Removed'}
                    </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}