import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Share2,
  Briefcase
} from 'lucide-react';

const stats = [
  { 
    label: 'Total Impact Hours', 
    value: '5,847', 
    change: '+12.5%', 
    trend: 'up',
    icon: Clock,
    color: 'text-[#043E52]',
    borderColor: 'border-[#043E52]',
    bgGradient: 'from-slate-50 to-slate-100'
  },
  { 
    label: 'Active Volunteers', 
    value: '234', 
    change: '+8.3%', 
    trend: 'up',
    icon: Users,
    color: 'text-[#1C9290]',
    borderColor: 'border-[#1C9290]',
    bgGradient: 'from-emerald-50 to-teal-50'
  },
  { 
    label: 'Projects Delivered', 
    value: '48', 
    change: '+15.2%', 
    trend: 'up',
    icon: Award,
    color: 'text-[#E16A3D]',
    borderColor: 'border-[#E16A3D]',
    bgGradient: 'from-orange-50 to-amber-50'
  },
  { 
    label: 'Retention Rate', 
    value: '87%', 
    change: '-2.1%', 
    trend: 'down',
    icon: Target,
    color: 'text-purple-600',
    borderColor: 'border-purple-600',
    bgGradient: 'from-purple-50 to-fuchsia-50'
  }
];

const monthlyData = [
  { month: 'Jan', hours: 420, volunteers: 45, projects: 8 },
  { month: 'Feb', hours: 480, volunteers: 52, projects: 9 },
  { month: 'Mar', hours: 510, volunteers: 58, projects: 10 },
  { month: 'Apr', hours: 490, volunteers: 55, projects: 9 },
  { month: 'May', hours: 550, volunteers: 62, projects: 11 },
  { month: 'Jun', hours: 580, volunteers: 68, projects: 12 },
  { month: 'Jul', hours: 620, volunteers: 72, projects: 13 },
  { month: 'Aug', hours: 610, volunteers: 70, projects: 12 },
  { month: 'Sep', hours: 650, volunteers: 75, projects: 14 },
  { month: 'Oct', hours: 687, volunteers: 82, projects: 15 }
];

const topVolunteers = [
  { name: 'John Doe', hours: 127, projects: 8, rating: 4.9 },
  { name: 'Sarah Johnson', hours: 98, projects: 6, rating: 4.8 },
  { name: 'Michael Chen', hours: 85, projects: 5, rating: 4.7 },
  { name: 'Emily Davis', hours: 76, projects: 4, rating: 4.8 },
  { name: 'Robert Wilson', hours: 72, projects: 5, rating: 4.9 }
];

const opportunityPerformance = [
  { title: 'Food Distribution Assistant', applications: 45, filled: 10, acceptance: 78 },
  { title: 'Volunteer Coordinator', applications: 28, filled: 2, acceptance: 85 },
  { title: 'Community Outreach', applications: 35, filled: 5, acceptance: 72 },
  { title: 'Food Safety Training', applications: 18, filled: 3, acceptance: 90 }
];

const demographics = [
  { category: 'Age 18-25', percentage: 25, count: 59 },
  { category: 'Age 26-35', percentage: 35, count: 82 },
  { category: 'Age 36-50', percentage: 28, count: 66 },
  { category: 'Age 50+', percentage: 12, count: 27 }
];

export function Reports() {
  return (
    <div className="space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#043E52]">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#1C9290]" />
            Real-time performance metrics and impact tracking
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] shadow-sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-lg shadow-blue-900/20">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`border-slate-200 shadow-sm hover:shadow-md transition-all border-l-4 ${stat.borderColor} relative overflow-hidden group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`bg-white border-0 shadow-sm ${
                      stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color} tracking-tight`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Main Content Area */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full md:w-auto flex justify-start mb-6">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-4">Overview</TabsTrigger>
          <TabsTrigger value="volunteers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-4">Volunteers</TabsTrigger>
          <TabsTrigger value="opportunities" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-4">Opportunities</TabsTrigger>
          <TabsTrigger value="impact" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-4">Impact</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart Card */}
            <Card className="lg:col-span-2 border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#043E52] text-xl">Monthly Activity Trends</CardTitle>
                    <CardDescription>Volunteer hours contributed over time</CardDescription>
                  </div>
                  <div className="p-2 bg-[#043E52]/5 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-[#043E52]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 pt-4">
                  {monthlyData.slice(-6).map((data, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700">{data.month}</span>
                        <div className="flex gap-4 text-xs text-slate-500">
                            <span>{data.volunteers} Vols</span>
                            <span className="font-bold text-[#043E52]">{data.hours} hrs</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#043E52] to-[#1C9290] h-3 rounded-full transition-all duration-1000 ease-out group-hover:scale-[1.01]"
                          style={{ width: `${(data.hours / 700) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Volunteers Sidebar */}
            <Card className="border-slate-200 shadow-sm bg-slate-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#043E52] text-lg">Top Contributors</CardTitle>
                  <Award className="h-5 w-5 text-[#E16A3D]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topVolunteers.map((volunteer, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-[#1C9290]/30 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-slate-100 text-slate-600' :
                          index === 2 ? 'bg-[#E16A3D]/10 text-[#E16A3D]' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#043E52]">{volunteer.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {volunteer.hours} hrs • ⭐ {volunteer.rating}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-xs text-slate-500 hover:text-[#043E52]">View Leaderboard</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VOLUNTEERS TAB */}
        <TabsContent value="volunteers" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Demographics Card (Using PieChart Icon here) */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#043E52]">Demographics</CardTitle>
                  <PieChart className="h-5 w-5 text-[#1C9290]" />
                </div>
                <CardDescription>Volunteer age distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {demographics.map((demo, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-700">{demo.category}</span>
                      <span className="text-slate-500">{demo.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                            index === 0 ? 'bg-[#043E52]' : 
                            index === 1 ? 'bg-[#1C9290]' : 
                            index === 2 ? 'bg-[#E16A3D]' : 'bg-slate-400'
                        }`}
                        style={{ width: `${demo.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Engagement Stats */}
            <div className="grid grid-cols-1 gap-6">
                <Card className="border-slate-200 shadow-sm flex flex-col justify-center text-center p-6 bg-gradient-to-br from-white to-slate-50">
                    <div className="mb-2 mx-auto bg-[#043E52]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                        <Clock className="h-8 w-8 text-[#043E52]" />
                    </div>
                    <p className="text-4xl font-bold text-[#043E52]">8.2</p>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Avg Hours / Volunteer</p>
                </Card>
                <Card className="border-slate-200 shadow-sm flex flex-col justify-center text-center p-6 bg-gradient-to-br from-white to-slate-50">
                    <div className="mb-2 mx-auto bg-[#1C9290]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                        <Users className="h-8 w-8 text-[#1C9290]" />
                    </div>
                    <p className="text-4xl font-bold text-[#1C9290]">87%</p>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Retention Rate</p>
                </Card>
            </div>
          </div>
        </TabsContent>

        {/* OPPORTUNITIES TAB */}
        <TabsContent value="opportunities" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#043E52]">Opportunity Performance</CardTitle>
                  <CardDescription>Application and acceptance metrics</CardDescription>
                </div>
                <Briefcase className="h-5 w-5 text-[#E16A3D]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Opportunity</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applications</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Filled</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acceptance Rate</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {opportunityPerformance.map((opp, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-[#043E52]">{opp.title}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{opp.applications}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{opp.filled}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${opp.acceptance > 80 ? 'bg-[#1C9290]' : 'bg-[#E16A3D]'}`} style={{ width: `${opp.acceptance}%` }}></div>
                                </div>
                                <span>{opp.acceptance}%</span>
                            </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                            <Badge variant="outline" className={opp.acceptance >= 80 ? "bg-[#1C9290]/10 text-[#1C9290] border-[#1C9290]/20" : "bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20"}>
                                {opp.acceptance >= 80 ? 'High Demand' : 'Standard'}
                            </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMPACT TAB */}
        <TabsContent value="impact" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#043E52] text-white border-none shadow-xl">
              <CardContent className="p-8 text-center">
                <p className="text-5xl font-bold mb-2">50k+</p>
                <p className="text-blue-200 font-medium tracking-wide uppercase text-sm">Meals Distributed</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1C9290] text-white border-none shadow-xl">
              <CardContent className="p-8 text-center">
                <p className="text-5xl font-bold mb-2">5,000</p>
                <p className="text-emerald-100 font-medium tracking-wide uppercase text-sm">Families Served</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <p className="text-5xl font-bold mb-2 text-[#E16A3D]">$146k</p>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">Community Value Generated</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-[#043E52]">Impact Coverage</CardTitle>
                <CardDescription>Measuring efficacy across key initiatives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-[#043E52]">Food Distribution</span>
                        <span className="font-bold text-[#043E52]">85% Goal Reached</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4">
                        <div className="bg-[#043E52] h-4 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-[#1C9290]">Community Satisfaction</span>
                        <span className="font-bold text-[#1C9290]">92% Positive</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4">
                        <div className="bg-[#1C9290] h-4 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-[#E16A3D]">Program Efficiency</span>
                        <span className="font-bold text-[#E16A3D]">88% Score</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4">
                        <div className="bg-[#E16A3D] h-4 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}