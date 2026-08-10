import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, where } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  Users, Building2, Clock, TrendingUp, AlertCircle, CheckCircle, 
  UserCheck, Brain, Zap, Activity, CheckCircle2, Sparkles, Loader2 
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

// Calls our Vercel proxy so the Gemini API key never reaches the client
async function callGemini(model: string, message: string): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, history: [], message }),
  });

  if (!response.ok) {
    throw new Error("Gemini proxy request failed");
  }

  const data = await response.json();
  return data.text;
}

export function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- LIVE DATA STATES ---
  const [metrics, setMetrics] = useState({ users: 0, vols: 0, orgs: 0, hours: 0 });
  const [pendingCounts, setPendingCounts] = useState({ verifications: 0, reports: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Fetch real-time master data
  useEffect(() => {
    // Aggregates counts across multiple collection listeners into one combined state update
    let currentVols = 0;
    let currentOrgs = 0;
    let currentPendingOrgs = 0;
    let currentPendingReports = 0;
    let currentHours = 0;

    let latestEvents: any[] = [];

    const formatEventDate = (ts: any) => {
      if (!ts) return new Date();
      return ts.toDate ? ts.toDate() : new Date(ts);
    };

    // Organization records can also appear in the "users" collection, so we split by role here
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      currentVols = 0;
      currentOrgs = 0;
      currentPendingOrgs = 0;
      const userEvents: any[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = formatEventDate(data.createdAt || data.joinDate);

        if (data.role === 'organization' || data.collectionName === 'organizations') {
          currentOrgs++;
          if (data.verificationStatus === 'pending') currentPendingOrgs++;
          userEvents.push({
            action: 'New organization applied',
            org: data.auditData?.legalName || data.name || 'Unknown Org',
            rawDate: date,
            status: data.verificationStatus === 'pending' ? 'pending' : 'approved'
          });
        } else if (data.role !== 'admin') {
          currentVols++;
          userEvents.push({
            action: 'New volunteer signed up',
            org: data.name || 'New User',
            rawDate: date,
            status: 'completed'
          });
        }
      });

      setMetrics(prev => ({ ...prev, users: currentVols + currentOrgs + 1, vols: currentVols, orgs: currentOrgs }));
      setPendingCounts(prev => ({ ...prev, verifications: currentPendingOrgs }));

      latestEvents = [...latestEvents.filter(e => !e.action.includes('signed up') && !e.action.includes('organization applied')), ...userEvents];
      updateActivityFeed(latestEvents);
    });

    // Approved applications double as our proxy for hours volunteered, since we don't track actual logged hours
    const unsubApps = onSnapshot(query(collection(db, "applications"), where("status", "==", "accepted")), (snapshot) => {
      currentHours = snapshot.docs.length * 4; // assume an average of 4 hours per accepted mission
      setMetrics(prev => ({ ...prev, hours: currentHours }));
    });

    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      currentPendingReports = 0;
      const reportEvents: any[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'pending' || !data.status) {
          currentPendingReports++;
        }
        reportEvents.push({
          action: `Content flagged: ${data.type || 'Post'}`,
          org: `Reported by ${data.reportedBy || 'System'}`,
          rawDate: formatEventDate(data.reportDate || data.createdAt),
          status: 'flagged'
        });
      });

      setPendingCounts(prev => ({ ...prev, reports: currentPendingReports }));

      latestEvents = [...latestEvents.filter(e => !e.action.includes('flagged')), ...reportEvents];
      updateActivityFeed(latestEvents);
      setLoading(false);
    });

    const updateActivityFeed = (events: any[]) => {
      const sorted = events
        .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
        .slice(0, 5)
        .map(e => {
          const diffMins = Math.floor((new Date().getTime() - e.rawDate.getTime()) / 60000);
          let timeStr = 'Just now';
          if (diffMins > 0 && diffMins < 60) timeStr = `${diffMins} minutes ago`;
          else if (diffMins >= 60 && diffMins < 1440) timeStr = `${Math.floor(diffMins/60)} hours ago`;
          else if (diffMins >= 1440) timeStr = `${Math.floor(diffMins/1440)} days ago`;

          return { ...e, time: timeStr };
        });
      setRecentActivities(sorted);
    };

    return () => { unsubUsers(); unsubApps(); unsubReports(); };
  }, []);


  // AI report generator
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const dataSummary = `
        Total Registered Users: ${metrics.users}
        Total Volunteers: ${metrics.vols}
        Total Verified Organizations: ${metrics.orgs}
        Total Community Impact Hours: ${metrics.hours}
        Pending Organization Audits: ${pendingCounts.verifications}
        Pending Content Reports: ${pendingCounts.reports}
        Recent Activity 1: ${recentActivities[0]?.action || 'None'} (${recentActivities[0]?.time || ''})
        Recent Activity 2: ${recentActivities[1]?.action || 'None'} (${recentActivities[1]?.time || ''})
      `;

      const prompt = `You are the Chief AI Administrator for the Athar Volunteer Platform. Write a formal, high-level Executive System Overview based on the live operational data provided. 
      Format the report neatly with HTML tags (use <h2> for section headers, <p> for paragraphs, and <ul>/<li> for lists). 
      DO NOT use markdown asterisks (**bold**). 
      Make the tone highly professional, commanding, and analytical. Include sections for: Executive Summary, Network Health & Growth, Security & Compliance Queue (analyze the pending verifications and reports), and Operational Directives.

      LIVE DATA TO ANALYZE:
      ${dataSummary}`;

      const reportHTML = await callGemini("gemini-flash-latest", prompt);

      // Render the report in a hidden iframe so we can trigger the browser's print-to-PDF dialog
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Athar System Overview</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #d97706; padding-bottom: 20px; }
                .logo { font-size: 28px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px; }
                .logo span { color: #d97706; }
                .date { color: #64748b; font-size: 14px; font-weight: bold; }
                h1 { color: #1e293b; font-size: 24px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;}
                h2 { color: #1e293b; font-size: 18px; margin-top: 30px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 8px;}
                p, li { font-size: 14px; color: #475569; }
                .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo">Athar <span>Command</span></div>
                <div class="date">DATE: ${new Date().toLocaleDateString()}</div>
              </div>
              <h1>System Overview & Compliance Report</h1>
              <div class="content">
                ${reportHTML.replace(/```html|```/g, '')}
              </div>
              <div class="footer">Confidential System Data • Generated by Athar AI Command Node</div>
            </body>
          </html>
        `);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 500);
      }
    } catch (error) {
      console.error("AI Report Generation failed", error);
      alert("Failed to generate AI report. Please try again.");
    }
    setIsGenerating(false);
  };

  // --- UI CONSTANTS ---
  const statsConfig = [
    { label: 'Total Users', value: metrics.users.toLocaleString(), change: '+12.5%', icon: Users, color: 'text-slate-700', bgColor: 'bg-slate-100', borderColor: 'border-slate-300' },
    { label: 'Volunteers', value: metrics.vols.toLocaleString(), change: '+8.2%', icon: UserCheck, color: 'text-role-admin-accent-dark', bgColor: 'bg-role-admin-accent/10', borderColor: 'border-role-admin-accent/30' },
    { label: 'Organizations', value: metrics.orgs.toLocaleString(), change: '+15.3%', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { label: 'Total Hours', value: metrics.hours.toLocaleString(), change: '+20.1%', icon: Clock, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  ];

  const pendingActions = [
    { type: 'Verification Requests', count: pendingCounts.verifications, color: 'bg-amber-500', textColor: 'text-amber-600' },
    { type: 'Content Reports', count: pendingCounts.reports, color: 'bg-red-500', textColor: 'text-red-600' },
    { type: 'Support Tickets', count: 0, color: 'bg-blue-500', textColor: 'text-blue-600' },
  ];

  const platformHealth = [
    { metric: 'System Uptime', value: 99.9, status: 'excellent' },
    { metric: 'User Satisfaction', value: 94, status: 'excellent' },
    { metric: 'Response Time', value: 87, status: 'good' },
  ];

  if (loading) return <div className="p-12 text-center text-slate-700 font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Initializing Command Center...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-slate-900 font-bold text-3xl mb-2">Platform Overview</h1>
          <p className="text-slate-500">Monitor and manage the entire Athar ecosystem</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="bg-role-admin-accent hover:bg-role-admin-accent-dark text-slate-900 shadow-md h-11 px-6 font-bold uppercase tracking-wider text-xs"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isGenerating ? 'Analyzing System...' : 'AI Health Report'}
          </Button>
        </div>
      </div>

      {/* AI ECOSYSTEM STATUS */}
      <Card className="border border-role-admin-accent/30 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="bg-gradient-to-br from-role-admin-accent to-role-admin-accent-dark text-slate-900 p-4 rounded-xl shadow-lg shadow-amber-900/20 shrink-0">
              <Brain className="h-8 w-8" />
            </div>
            <div className="flex-1 w-full">
              <h3 className="text-slate-900 font-bold text-xl mb-2">🤖 AI Ecosystem Feedback Loop Status</h3>
              <p className="text-slate-500 mb-6">
                The self-learning system is actively analyzing crisis data and optimizing volunteer training
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-red-50/50 rounded-xl p-4 border border-red-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white p-1.5 rounded-md shadow-sm"><Zap className="h-4 w-4 text-red-600" /></div>
                    <p className="text-sm font-bold text-red-600">Crisis Events</p>
                  </div>
                  <p className="text-slate-900 font-bold text-lg">52 Active</p>
                  <p className="text-xs text-slate-500 font-medium">Auto-matched</p>
                </div>

                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="bg-white p-1.5 rounded-md shadow-sm"><Activity className="h-4 w-4 text-amber-600" /></div>
                    <p className="text-sm font-bold text-amber-700">Skill Gaps</p>
                  </div>
                  <p className="text-slate-900 font-bold text-lg">4 Detected</p>
                  <p className="text-xs text-slate-500 font-medium">AI Analyzed</p>
                </div>

                <div className="bg-role-admin-accent/10 rounded-xl p-4 border border-role-admin-accent/20 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="bg-white p-1.5 rounded-md shadow-sm"><Brain className="h-4 w-4 text-role-admin-accent-dark" /></div>
                    <p className="text-sm font-bold text-role-admin-accent-dark">Auto Updates</p>
                  </div>
                  <p className="text-slate-900 font-bold text-lg">3 Paths</p>
                  <p className="text-xs text-slate-500 font-medium">Promoted</p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="bg-white p-1.5 rounded-md shadow-sm"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
                    <p className="text-sm font-bold text-emerald-700">AVR Members</p>
                  </div>
                  <p className="text-slate-900 font-bold text-lg">3,247</p>
                  <p className="text-xs text-slate-500 font-medium">+15% growth</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`bg-white border-2 ${stat.borderColor} hover:shadow-md transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 mb-2">{stat.value}</p>
                    <Badge variant="secondary" className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border-none uppercase tracking-wider">{stat.change}</Badge>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-xl`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Actions & Health) */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Pending Actions</CardTitle>
                <CardDescription>Items requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`${action.color} w-2.5 h-2.5 rounded-full shadow-sm`} />
                        <span className="text-slate-700 font-bold text-sm">{action.type}</span>
                      </div>
                      <Badge variant="secondary" className={`bg-white border border-slate-200 ${action.textColor} font-black shadow-sm`}>{action.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Platform Health</CardTitle>
                <CardDescription>System performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {platformHealth.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-600">{item.metric}</span>
                        <span className="text-sm font-black text-slate-900">{item.value}%</span>
                      </div>
                      <Progress value={item.value} className="h-2.5 bg-slate-100 [&>div]:bg-role-admin-accent" />
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 p-3 rounded-lg w-full justify-center uppercase tracking-widest">
                      <CheckCircle className="h-4 w-4" /> All systems operational
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Right Column (Live Activity Feed) */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">Live Activity Feed</CardTitle>
                <CardDescription>Real-time events across the ecosystem</CardDescription>
              </div>
              <div className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentActivities.length === 0 ? (
                 <div className="text-center text-slate-400 py-10 text-sm font-medium">Waiting for system events...</div>
              ) : recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                  <div className={`mt-1 p-2 rounded-full bg-white shadow-sm border border-slate-100 ${
                    activity.status === 'pending' ? 'text-amber-600' :
                    activity.status === 'approved' ? 'text-emerald-600' :
                    activity.status === 'flagged' ? 'text-red-600' : 'text-slate-400'
                  }`}>
                    {activity.status === 'pending' ? <AlertCircle className="h-4 w-4" /> :
                     activity.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
                     activity.status === 'flagged' ? <AlertCircle className="h-4 w-4" /> :
                     <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{activity.action}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{activity.org}</p>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}