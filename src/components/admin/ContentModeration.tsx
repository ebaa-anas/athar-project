import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertTriangle, Eye, CheckCircle, XCircle, Flag, MessageSquare, Clock, Filter, ShieldAlert, Zap, ThumbsUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function ContentModeration() {
  const flaggedContent = [
    {
      id: 1,
      type: 'Opportunity Post',
      title: 'Community Clean-up Event',
      organization: 'Green Earth Initiative',
      reportedBy: 'Sarah Johnson',
      reason: 'Inappropriate content',
      reportDate: '2 hours ago',
      status: 'pending',
      severity: 'high',
    },
    {
      id: 2,
      type: 'Comment',
      title: 'Comment on "Food Drive"',
      user: 'Michael Brown',
      reportedBy: 'Ahmed Hassan',
      reason: 'Spam',
      reportDate: '5 hours ago',
      status: 'pending',
      severity: 'low',
    },
    {
      id: 3,
      type: 'Organization Profile',
      title: 'Hope Foundation',
      organization: 'Hope Foundation',
      reportedBy: 'Emily Chen',
      reason: 'Misleading information',
      reportDate: '1 day ago',
      status: 'pending',
      severity: 'medium',
    },
  ];

  const reviewedContent = [
    {
      id: 4,
      type: 'Opportunity Post',
      title: 'Volunteer Teaching Program',
      organization: 'Education First',
      action: 'Approved',
      reviewedDate: '2 days ago',
    },
    {
      id: 5,
      type: 'Comment',
      title: 'Comment on "Animal Rescue"',
      user: 'John Doe',
      action: 'Removed',
      reviewedDate: '3 days ago',
    },
  ];

  // Dynamic Styles based on Severity
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          cardBorder: 'border-l-4 border-l-[#E16A3D]', // Sunset Orange Border
          badge: 'bg-[#E16A3D] text-white border-none',
          bg: 'bg-orange-50/50'
        };
      case 'medium':
        return {
          cardBorder: 'border-l-4 border-l-[#FFA45D]', // Tangerine Border
          badge: 'bg-[#FFA45D] text-white border-none',
          bg: 'bg-amber-50/50'
        };
      case 'low':
        return {
          cardBorder: 'border-l-4 border-l-[#1C9290]', // Sea Green Border (Low risk)
          badge: 'bg-[#1C9290] text-white border-none',
          bg: 'bg-teal-50/50'
        };
      default:
        return {
          cardBorder: 'border-l-4 border-l-slate-300',
          badge: 'bg-slate-500 text-white',
          bg: 'bg-white'
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] font-bold text-3xl mb-2">Content Moderation</h1>
          <p className="text-slate-500">Review flagged content to keep the community safe</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200 text-[#043E52]">
                <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button className="bg-[#043E52] hover:bg-[#016A6D] text-white">
                Bulk Actions
            </Button>
        </div>
      </div>

      {/* 1. VIBRANT STATS - Solid Colors for Impact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pending Review - Sunset Orange (Action Needed) */}
        <Card className="bg-gradient-to-br from-[#E16A3D] to-[#c2562d] text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Pending Review</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-orange-100 bg-black/10 w-fit px-2 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                Avg wait: 2h
            </div>
          </CardContent>
        </Card>

        {/* Reviewed Today - Sea Green (Success) */}
        <Card className="bg-gradient-to-br from-[#1C9290] to-[#157a78] text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">Reviewed Today</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <ThumbsUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-teal-100 bg-black/10 w-fit px-2 py-1 rounded-full">
                <Zap className="h-3 w-3" />
                On track
            </div>
          </CardContent>
        </Card>

        {/* Total Reports - Nile Blue (Data) */}
        <Card className="bg-gradient-to-br from-[#043E52] to-[#033040] text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium mb-1">Total Reports</p>
                <p className="text-3xl font-bold">87</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <Flag className="h-6 w-6 text-white" />
              </div>
            </div>
             <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 bg-white/5 w-fit px-2 py-1 rounded-full">
                +5% from last week
            </div>
          </CardContent>
        </Card>

        {/* Auto-Moderated - Pine (AI) */}
        <Card className="bg-gradient-to-br from-[#016A6D] to-[#015052] text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">Auto-Moderated</p>
                <p className="text-3xl font-bold">45</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-teal-100 bg-black/10 w-fit px-2 py-1 rounded-full">
                AI Filter Active
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flagged" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
          <TabsTrigger 
            value="flagged" 
            className="data-[state=active]:bg-[#E16A3D] data-[state=active]:text-white rounded-lg px-6 transition-all"
          >
            Flagged Content
            <Badge className="ml-2 bg-white text-[#E16A3D] hover:bg-white/90 shadow-none">{flaggedContent.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="reviewed" 
            className="data-[state=active]:bg-[#043E52] data-[state=active]:text-white rounded-lg px-6 transition-all"
          >
            Reviewed History
          </TabsTrigger>
        </TabsList>

        {/* Flagged Content List */}
        <TabsContent value="flagged" className="space-y-4">
          {flaggedContent.map((item) => {
            const styles = getSeverityStyles(item.severity);
            return (
              <Card key={item.id} className={`border border-slate-200 shadow-sm hover:shadow-md transition-all ${styles.cardBorder} ${styles.bg}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Left: Content Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-white border-slate-200 text-[#043E52] font-semibold">{item.type}</Badge>
                            <Badge className={`${styles.badge} uppercase text-[10px] tracking-wider`}>
                              {item.severity} Severity
                            </Badge>
                          </div>
                          <h3 className="text-[#043E52] font-bold text-lg">{item.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                             {item.organization && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {item.organization}</span>}
                             {item.user && <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> {item.user}</span>}
                          </div>
                        </div>
                      </div>

                      {/* The Report Box */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-[#E16A3D] font-bold text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Report Reason: {item.reason}</span>
                            </div>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {item.reportDate}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Flag className="h-4 w-4 text-[#043E52]" />
                            Reported by: <span className="font-semibold text-[#043E52]">{item.reportedBy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Vertical on Desktop) */}
                    <div className="flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                        <Button className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white shadow-sm gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Approve Content
                        </Button>
                        <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2">
                            <XCircle className="h-4 w-4" />
                            Remove Content
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="flex-1 text-[#043E52] border border-slate-200 hover:bg-white">
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 text-[#043E52] border border-slate-200 hover:bg-white">
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

        {/* Reviewed Content List (Simplified) */}
        <TabsContent value="reviewed" className="space-y-4">
          {reviewedContent.map((item) => (
            <Card key={item.id} className="border-slate-200 bg-slate-50/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <h4 className="text-[#043E52] font-semibold">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.type} • {item.organization || item.user}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">{item.reviewedDate}</span>
                    <Badge className={
                        item.action === 'Approved' 
                        ? 'bg-[#1C9290] text-white hover:bg-[#1C9290]' 
                        : 'bg-red-500 text-white hover:bg-red-500'
                    }>
                        {item.action}
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

// Missing icons import fix
function Building2({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
}
function UserCheck({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
}