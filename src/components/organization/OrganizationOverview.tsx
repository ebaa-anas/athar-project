import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Shield,
  AlertTriangle,
  Star,
  XCircle
} from 'lucide-react';

const stats = [
  { 
    id: 1, 
    label: 'Active Volunteers', 
    value: '234', 
    icon: Users, 
    // Nile Blue for People/Population
    textColor: 'text-[#043E52]',
    bgColor: 'bg-[#043E52]/10',
    change: '+12%',
    changeColor: 'text-emerald-600'
  },
  { 
    id: 2, 
    label: 'Open Opportunities', 
    value: '12', 
    icon: Briefcase, 
    // Sea Green for Growth/Opportunities
    textColor: 'text-[#1C9290]',
    bgColor: 'bg-[#1C9290]/10',
    change: '+3',
    changeColor: 'text-[#1C9290]'
  },
  { 
    id: 3, 
    label: 'Pending Applications', 
    value: '28', 
    icon: AlertCircle, 
    // Sunset Orange for Alerts/Action Items
    textColor: 'text-[#E16A3D]',
    bgColor: 'bg-[#E16A3D]/10',
    change: '+8',
    changeColor: 'text-[#E16A3D]'
  },
  { 
    id: 4, 
    label: 'Total Impact Hours', 
    value: '5,847', 
    icon: TrendingUp, 
    // Slate/Neutral for Data
    textColor: 'text-slate-700',
    bgColor: 'bg-slate-100',
    change: '+234h',
    changeColor: 'text-emerald-600'
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Community Food Drive',
    date: 'Oct 20, 2025',
    time: '9:00 AM - 2:00 PM',
    location: 'Downtown Community Center',
    volunteersRegistered: 7,
    volunteersNeeded: 10,
    status: 'upcoming'
  },
  {
    id: 2,
    title: 'Volunteer Orientation Session',
    date: 'Oct 24, 2025',
    time: '6:00 PM - 8:00 PM',
    location: 'Main Office',
    volunteersRegistered: 15,
    volunteersNeeded: 20,
    status: 'upcoming'
  },
  {
    id: 3,
    title: 'Monthly Food Distribution',
    date: 'Oct 28, 2025',
    time: '10:00 AM - 4:00 PM',
    location: 'Multiple Locations',
    volunteersRegistered: 42,
    volunteersNeeded: 50,
    status: 'upcoming'
  }
];

const recentApplications = [
  {
    id: 1,
    volunteer: 'Sarah Johnson',
    opportunity: 'Food Distribution Assistant',
    appliedDate: '2 hours ago',
    skills: ['Customer Service', 'Physical Activity'],
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
  },
  {
    id: 2,
    volunteer: 'Michael Chen',
    opportunity: 'Volunteer Coordinator',
    appliedDate: '5 hours ago',
    skills: ['Leadership', 'Organization'],
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  },
  {
    id: 3,
    volunteer: 'Emily Davis',
    opportunity: 'Food Distribution Assistant',
    appliedDate: '1 day ago',
    skills: ['Team Work', 'Communication'],
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
  }
];

const topVolunteers = [
  {
    id: 1,
    name: 'John Doe',
    hours: 127,
    rating: 4.9,
    projects: 8,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
  },
  {
    id: 2,
    name: 'Jane Smith',
    hours: 98,
    rating: 4.8,
    projects: 6,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
  },
  {
    id: 3,
    name: 'Robert Wilson',
    hours: 85,
    rating: 4.7,
    projects: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
  }
];

export function OrganizationOverview() {
  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#043E52]">Welcome back, Local Food Bank!</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your organization today.</p>
        </div>
        <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md transition-all">
          <Briefcase className="mr-2 h-4 w-4" />
          Post New Opportunity
        </Button>
      </div>

      {/* 2. VERIFIED PARTNER & CRISIS HERO CARD */}
      <Card className="border border-[#1C9290]/30 bg-gradient-to-r from-[#1C9290]/5 via-transparent to-transparent shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-5">
            {/* Status Icon */}
            <div className="bg-[#1C9290] text-white p-3 rounded-xl shadow-lg shadow-[#1C9290]/20 shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-[#043E52]">Verified Partner Organization</h3>
                    <CheckCircle className="h-4 w-4 text-[#1C9290]" />
                </div>
                <p className="text-slate-600 max-w-2xl">
                  You are authorized to activate the <span className="font-semibold text-[#043E52]">Athar Volunteer Reserve (AVR)</span> for crisis response using our AI-powered Crisis Matching Engine.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <Button className="bg-[#E16A3D] hover:bg-[#c2562d] text-white border-none shadow-md shadow-orange-500/20 font-semibold">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Activate Crisis Response
                </Button>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm bg-white/60 px-4 py-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Active Crises:</span>
                    <span className="text-[#E16A3D] font-bold bg-[#E16A3D]/10 px-2 py-0.5 rounded text-xs">2</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Volunteers Activated:</span>
                    <span className="text-[#1C9290] font-bold">22</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Response Rate:</span>
                    <span className="text-[#043E52] font-bold">85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    <p className={`text-xs font-semibold mt-1 ${stat.changeColor}`}>{stat.change} this month</p>
                  </div>
                  <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 4. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT APPLICATIONS (Left Col) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-[#043E52]">Recent Applications</CardTitle>
                  <CardDescription>New volunteer applications waiting for review</CardDescription>
                </div>
                <Badge variant="outline" className="bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20 px-3 py-1">
                  {recentApplications.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {recentApplications.map((app) => (
                <div key={app.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-100 rounded-xl hover:border-[#1C9290]/30 hover:bg-[#1C9290]/5 transition-all">
                  <img 
                    src={app.avatar} 
                    alt={app.volunteer}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-slate-900 font-bold">{app.volunteer}</h4>
                        <p className="text-sm text-slate-500">Applied for <span className="text-[#043E52] font-medium">{app.opportunity}</span></p>
                      </div>
                      <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{app.appliedDate}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {app.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] border-none">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="bg-[#1C9290] hover:bg-[#157a78] text-white h-8 px-4">
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 h-8">
                        View Profile
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-500 h-8 w-8 p-0">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-[#043E52] hover:bg-[#043E52]/5 font-medium">
                View All Applications
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (Top Volunteers & Events) */}
        <div className="space-y-6">
          
          {/* TOP VOLUNTEERS */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-[#043E52]">Top Volunteers</CardTitle>
              <CardDescription>Most active this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {topVolunteers.map((volunteer, index) => (
                <div key={volunteer.id} className="flex items-center gap-3 group">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-700'
                  }`}>
                      {index + 1}
                  </div>
                  <img 
                    src={volunteer.avatar} 
                    alt={volunteer.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-[#1C9290] transition-colors">{volunteer.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{volunteer.hours}h</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{volunteer.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-slate-200 text-slate-600">
                View Leaderboard
              </Button>
            </CardContent>
          </Card>

          {/* UPCOMING EVENTS */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-[#043E52]">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                  <h4 className="text-sm font-bold text-[#043E52] mb-2">{event.title}</h4>
                  
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-[#1C9290]" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-[#1C9290]" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Registration</span>
                      <span className="text-[#043E52] font-bold">
                        {Math.round((event.volunteersRegistered / event.volunteersNeeded) * 100)}%
                      </span>
                    </div>
                    {/* Progress Bar with Sea Green */}
                    <Progress 
                      value={(event.volunteersRegistered / event.volunteersNeeded) * 100} 
                      className="h-1.5 bg-slate-200"
                      // Note: You might need to add a custom class or inline style if your Progress component doesn't accept color props nicely.
                      // Assuming standard shadcn/ui where we control the indicator via CSS or a wrapper, 
                      // or if it accepts a class for the indicator:
                    />
                     {/* If Progress component doesn't support color prop, standard CSS override often works or utility class on the indicator if accessible */}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}