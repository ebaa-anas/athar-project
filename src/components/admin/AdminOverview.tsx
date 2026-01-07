import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users, Building2, Clock, TrendingUp, AlertCircle, CheckCircle, UserCheck, Brain, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

export function AdminOverview() {
  
  // 1. VIBRANT STATS GRID
  // Each card gets a unique color from your palette to make them distinct
  const stats = [
    { 
      label: 'Total Users', 
      value: '15,234', 
      change: '+12.5%', 
      icon: Users, 
      color: 'text-[#043E52]',        // Nile Blue
      bgColor: 'bg-[#043E52]/10',
      borderColor: 'border-[#043E52]/20'
    },
    { 
      label: 'Volunteers', 
      value: '10,420', 
      change: '+8.2%', 
      icon: UserCheck, 
      color: 'text-[#1C9290]',        // Sea Green
      bgColor: 'bg-[#1C9290]/10',
      borderColor: 'border-[#1C9290]/20'
    },
    { 
      label: 'Organizations', 
      value: '814', 
      change: '+15.3%', 
      icon: Building2, 
      color: 'text-[#016A6D]',        // Pine
      bgColor: 'bg-[#016A6D]/10',
      borderColor: 'border-[#016A6D]/20'
    },
    { 
      label: 'Total Hours', 
      value: '1.2M', 
      change: '+20.1%', 
      icon: Clock, 
      color: 'text-[#E16A3D]',        // Sunset Orange
      bgColor: 'bg-[#E16A3D]/10',
      borderColor: 'border-[#E16A3D]/20'
    },
  ];

  const pendingActions = [
    { type: 'Verification Request', count: 5, color: 'bg-[#E16A3D]', textColor: 'text-[#E16A3D]' }, // Sunset Orange (High Priority)
    { type: 'Content Reports', count: 3, color: 'bg-[#FFA45D]', textColor: 'text-[#d97706]' },     // Tangerine (Warning)
    { type: 'Support Tickets', count: 12, color: 'bg-[#1C9290]', textColor: 'text-[#1C9290]' },     // Sea Green (Standard)
  ];

  const recentActivities = [
    { action: 'New organization registered', org: 'Hope Foundation', time: '5 minutes ago', status: 'pending' },
    { action: 'Verification approved', org: 'Green Earth Initiative', time: '1 hour ago', status: 'approved' },
    { action: 'Content flagged', org: 'Community Center', time: '2 hours ago', status: 'flagged' },
    { action: 'New volunteer signed up', org: 'Sarah Johnson', time: '3 hours ago', status: 'completed' },
    { action: 'Organization updated profile', org: 'Local Food Bank', time: '5 hours ago', status: 'completed' },
  ];

  const platformHealth = [
    { metric: 'System Uptime', value: 99.8, status: 'excellent' },
    { metric: 'User Satisfaction', value: 94, status: 'excellent' },
    { metric: 'Response Time', value: 87, status: 'good' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[#043E52] font-bold text-3xl mb-2">Platform Overview</h1>
        <p className="text-slate-500">Monitor and manage the entire Athar platform</p>
      </div>

      {/* 2. AI ECOSYSTEM STATUS - VIBRANT & CLEAN */}
      <Card className="border border-[#016A6D]/30 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Main Icon - Pine Gradient */}
            <div className="bg-gradient-to-br from-[#016A6D] to-[#1C9290] text-white p-4 rounded-xl shadow-lg shadow-teal-900/20">
              <Brain className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#043E52] font-bold text-xl mb-2">🤖 AI Ecosystem Feedback Loop Status</h3>
              <p className="text-slate-500 mb-6">
                The self-learning system is actively analyzing crisis data and optimizing volunteer training
              </p>
              
              {/* Vibrant Mini-Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Crisis Events - Sunset Orange */}
                <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white p-1.5 rounded-md shadow-sm">
                      <Zap className="h-4 w-4 text-[#E16A3D]" />
                    </div>
                    <p className="text-sm font-bold text-[#E16A3D]">Crisis Events</p>
                  </div>
                  <p className="text-[#043E52] font-bold text-lg">52 This Month</p>
                  <p className="text-xs text-slate-500 font-medium">Auto-matched</p>
                </div>
                
                {/* Skill Gaps - Tangerine */}
                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="bg-white p-1.5 rounded-md shadow-sm">
                      <Activity className="h-4 w-4 text-[#FFA45D]" />
                    </div>
                    <p className="text-sm font-bold text-[#d97706]">Skill Gaps</p>
                  </div>
                  <p className="text-[#043E52] font-bold text-lg">4 Detected</p>
                  <p className="text-xs text-slate-500 font-medium">AI Analyzed</p>
                </div>
                
                {/* Auto Updates - Sea Green */}
                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="bg-white p-1.5 rounded-md shadow-sm">
                      <Brain className="h-4 w-4 text-[#1C9290]" />
                    </div>
                    <p className="text-sm font-bold text-[#1C9290]">Auto Updates</p>
                  </div>
                  <p className="text-[#043E52] font-bold text-lg">3 Paths</p>
                  <p className="text-xs text-slate-500 font-medium">Promoted</p>
                </div>
                
                {/* AVR Members - Nile Blue */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="bg-white p-1.5 rounded-md shadow-sm">
                      <TrendingUp className="h-4 w-4 text-[#043E52]" />
                    </div>
                    <p className="text-sm font-bold text-[#043E52]">AVR Members</p>
                  </div>
                  <p className="text-[#043E52] font-bold text-lg">3,247</p>
                  <p className="text-xs text-slate-500 font-medium">+15% growth</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. STATS GRID - WITH COLORED BORDERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`border-2 ${stat.borderColor} hover:shadow-lg transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#043E52] mb-1">{stat.value}</p>
                    <p className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">{stat.change}</p>
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

      {/* Pending Actions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#043E52]">Pending Actions</CardTitle>
          <CardDescription>Items requiring your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`${action.color} w-3 h-3 rounded-full shadow-sm`} />
                  <span className="text-slate-700 font-semibold">{action.type}</span>
                </div>
                <Badge variant="secondary" className={`bg-white border border-slate-200 ${action.textColor} font-bold shadow-sm`}>{action.count} pending</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#043E52]">Recent Activities</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className={`mt-1 ${
                    activity.status === 'pending' ? 'text-[#E16A3D]' : // Sunset Orange
                    activity.status === 'approved' ? 'text-[#1C9290]' : // Sea Green
                    activity.status === 'flagged' ? 'text-[#FFA45D]' : // Tangerine
                    'text-slate-400'
                  }`}>
                    {activity.status === 'pending' ? <AlertCircle className="h-5 w-5" /> :
                     activity.status === 'approved' ? <CheckCircle className="h-5 w-5" /> :
                     activity.status === 'flagged' ? <AlertCircle className="h-5 w-5" /> :
                     <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#043E52]">{activity.action}</p>
                    <p className="text-sm text-slate-500">{activity.org}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#043E52]">Platform Health</CardTitle>
            <CardDescription>System performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {platformHealth.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">{item.metric}</span>
                    <span className="text-sm font-bold text-[#043E52]">{item.value}%</span>
                  </div>
                  {/* Progress Bar uses Pine for System Identity */}
                  <Progress value={item.value} className="h-2.5 bg-slate-100 [&>div]:bg-[#016A6D]" />
                </div>
              ))}
              
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-[#1C9290] font-bold bg-[#1C9290]/5 p-2 rounded-lg w-fit">
                  <CheckCircle className="h-4 w-4" />
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}