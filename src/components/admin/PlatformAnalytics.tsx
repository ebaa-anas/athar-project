import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, Users, Building2, Clock, Target, Brain, Zap, Activity } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Badge } from '../ui/badge';

export function PlatformAnalytics() {
  const userGrowthData = [
    { month: 'Jul', volunteers: 8200, organizations: 620 },
    { month: 'Aug', volunteers: 8800, organizations: 680 },
    { month: 'Sep', volunteers: 9100, organizations: 720 },
    { month: 'Oct', volunteers: 9600, organizations: 760 },
    { month: 'Nov', volunteers: 10100, organizations: 790 },
    { month: 'Dec', volunteers: 10420, organizations: 814 },
  ];

  const engagementData = [
    { day: 'Mon', opportunities: 45, applications: 120 },
    { day: 'Tue', opportunities: 52, applications: 145 },
    { day: 'Wed', opportunities: 48, applications: 132 },
    { day: 'Thu', opportunities: 61, applications: 168 },
    { day: 'Fri', opportunities: 55, applications: 155 },
    { day: 'Sat', opportunities: 38, applications: 98 },
    { day: 'Sun', opportunities: 35, applications: 87 },
  ];

  // 1. FULL VIBRANT PALETTE
  const COLORS = {
    nile: '#043E52',
    pine: '#016A6D',
    sea: '#1C9290',
    sunset: '#E16A3D',
    tangerine: '#FFA45D',
    slate: '#94a3b8'
  };

  const causeDistribution = [
    { name: 'Education', value: 28, color: COLORS.nile },      // Dark Blue
    { name: 'Health', value: 22, color: COLORS.sea },       // Teal
    { name: 'Environment', value: 18, color: COLORS.pine },    // Deep Green
    { name: 'Animals', value: 12, color: COLORS.tangerine }, // Bright Orange
    { name: 'Community', value: 15, color: COLORS.sunset },    // Burnt Orange
    { name: 'Other', value: 5, color: COLORS.slate },
  ];

  // 2. REGIONAL DATA - MULTI-COLORED BARS
  const regionalData = [
    { region: 'Istanbul', users: 3750, fill: COLORS.nile },
    { region: 'Ankara', users: 2380, fill: COLORS.pine },
    { region: 'Izmir', users: 1940, fill: COLORS.sea },
    { region: 'Bursa', users: 1295, fill: COLORS.sunset },
    { region: 'Antalya', users: 970, fill: COLORS.tangerine },
    { region: 'Other', users: 899, fill: COLORS.slate },
  ];

  const metrics = [
    {
      label: 'Total Volunteer Hours',
      value: '1.2M',
      change: '+20.1%',
      trend: 'up',
      icon: Clock,
      color: 'text-[#E16A3D]', 
      bgColor: 'bg-[#E16A3D]/10',
      borderColor: 'border-[#E16A3D]/20'
    },
    {
      label: 'Active Opportunities',
      value: '342',
      change: '+12.3%',
      trend: 'up',
      icon: Target,
      color: 'text-[#016A6D]', 
      bgColor: 'bg-[#016A6D]/10',
      borderColor: 'border-[#016A6D]/20'
    },
    {
      label: 'Avg. Response Time',
      value: '2.5h',
      change: '-15.2%',
      trend: 'down',
      icon: Clock,
      color: 'text-[#043E52]', 
      bgColor: 'bg-[#043E52]/10',
      borderColor: 'border-[#043E52]/20'
    },
    {
      label: 'Completion Rate',
      value: '87%',
      change: '+5.4%',
      trend: 'up',
      icon: Target,
      color: 'text-[#1C9290]', 
      bgColor: 'bg-[#1C9290]/10',
      borderColor: 'border-[#1C9290]/20'
    },
  ];

  const skillGapAnalysis = [
    { skill: 'Psych First Aid', demandedTimes: 45, trainedVolunteers: 32 },
    { skill: 'Medical Assist', demandedTimes: 38, trainedVolunteers: 40 },
    { skill: 'Crisis Comms', demandedTimes: 30, trainedVolunteers: 25 },
    { skill: 'Emergency Resp', demandedTimes: 52, trainedVolunteers: 48 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[#043E52] font-bold text-3xl mb-2">Platform Analytics</h1>
        <p className="text-slate-500">Comprehensive insights into platform performance and usage</p>
      </div>

      {/* AI Ecosystem Feedback Loop - Vibrant Version */}
      <Card className="border border-[#016A6D]/30 bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-[#016A6D] to-[#1C9290] text-white p-3 rounded-xl shadow-lg shadow-teal-900/20">
              <Brain className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="mb-2 text-[#043E52]">🤖 AI Ecosystem Feedback Loop</CardTitle>
              <CardDescription>
                The core innovation: System learns from crisis mobilization data to automatically improve training recommendations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Crisis Mobilization - Sunset Orange */}
            <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5 text-[#E16A3D]" />
                </div>
                <h4 className="font-bold text-[#E16A3D]">Crisis Mobilization</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">NLP Crisis Engine parses real-time reports</p>
              <div className="flex gap-2">
                <Badge className="bg-[#E16A3D] hover:bg-[#c2562d] shadow-sm">52 Activations</Badge>
                <Badge variant="outline" className="bg-white text-slate-600 border-orange-200">18 min avg</Badge>
              </div>
            </div>

            {/* Data Analysis - Nile Blue */}
            <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5 text-[#043E52]" />
                </div>
                <h4 className="font-bold text-[#043E52]">Data Analysis</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">AI identifies skill gaps from crisis data</p>
              <div className="flex gap-2">
                <Badge className="bg-[#043E52] hover:bg-[#033040] shadow-sm">4 Gaps Found</Badge>
                <Badge variant="outline" className="bg-white text-slate-600 border-slate-300">Auto-Active</Badge>
              </div>
            </div>

            {/* Training Update - Sea Green */}
            <div className="bg-teal-50 rounded-xl p-5 border border-teal-100 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Brain className="h-5 w-5 text-[#1C9290]" />
                </div>
                <h4 className="font-bold text-[#1C9290]">Training Update</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">System auto-promotes needed skill paths</p>
              <div className="flex gap-2">
                <Badge className="bg-[#1C9290] hover:bg-[#157a78] shadow-sm">3 Paths Promoted</Badge>
                <Badge variant="outline" className="bg-white text-slate-600 border-teal-200">Self-Improving</Badge>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h4 className="font-bold text-[#043E52] mb-6">Skill Gap Analysis (AI Learning Data)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={skillGapAnalysis}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="skill" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{ fill: '#f1f5f9' }}
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                {/* Vibrant Contrast: Tangerine vs Nile Blue */}
                <Bar dataKey="demandedTimes" fill={COLORS.tangerine} name="Crisis Demand" radius={[4, 4, 0, 0]} barSize={35} />
                <Bar dataKey="trainedVolunteers" fill={COLORS.nile} name="Trained Supply" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - With Colored Borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={index} className={`border-2 ${metric.borderColor} hover:shadow-md transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-[#043E52] mb-1">{metric.value}</p>
                    <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                      <TrendIcon className="h-4 w-4" />
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <div className={`${metric.bgColor} ${metric.color} p-3 rounded-xl`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth - Uses Sea Green & Tangerine for nice contrast */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#043E52]">User Growth</CardTitle>
            <CardDescription>Monthly user registration trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="volunteers" stroke={COLORS.sea} strokeWidth={3} name="Volunteers" dot={{r: 4, fill: COLORS.sea}} />
                <Line type="monotone" dataKey="organizations" stroke={COLORS.tangerine} strokeWidth={3} name="Organizations" dot={{r: 4, fill: COLORS.tangerine}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement - Multi-Colored Bars */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#043E52]">Weekly Engagement</CardTitle>
            <CardDescription>Opportunities vs Applications</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                {/* Deep Blue vs Bright Orange */}
                <Bar dataKey="opportunities" fill={COLORS.nile} name="Opportunities" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applications" fill={COLORS.sunset} name="Applications" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cause Distribution - THE RAINBOW PIE */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#043E52]">Cause Distribution</CardTitle>
            <CardDescription>Volunteer opportunities by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={causeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {causeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Distribution - WATERFALL COLORS */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-[#043E52]">Regional Distribution</CardTitle>
            <CardDescription>Total Users by region</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="region" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="users" name="Total Users" radius={[0, 4, 4, 0]} barSize={25}>
                  {regionalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats Footer */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-[#043E52]">Platform Summary</CardTitle>
          <CardDescription>Overall performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white border border-teal-100 rounded-xl shadow-sm">
              <Users className="h-8 w-8 text-[#1C9290] mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-1">User Satisfaction</p>
              <p className="text-3xl font-bold text-[#043E52]">94%</p>
            </div>
            <div className="text-center p-6 bg-white border border-blue-100 rounded-xl shadow-sm">
              <Building2 className="h-8 w-8 text-[#043E52] mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-1">Verified Organizations</p>
              <p className="text-3xl font-bold text-[#043E52]">89%</p>
            </div>
            <div className="text-center p-6 bg-white border border-orange-100 rounded-xl shadow-sm">
              <Target className="h-8 w-8 text-[#E16A3D] mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-1">Goal Completion</p>
              <p className="text-3xl font-bold text-[#043E52]">87%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}