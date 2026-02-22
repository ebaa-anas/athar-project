import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Clock, CheckCircle, Calendar, MapPin, Users, ArrowRight, Shield, Zap, TrendingUp, Brain } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

const stats = [
  { 
    id: 1, 
    label: 'Total Hours', 
    value: '127', 
    icon: Clock, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  { 
    id: 2, 
    label: 'Completed Projects', 
    value: '8', 
    icon: CheckCircle, 
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },
  { 
    id: 3, 
    label: 'Active Tasks', 
    value: '3', 
    icon: Calendar, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  { 
    id: 4, 
    label: 'Impact Score', 
    value: '92', 
    icon: Users, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Community Food Drive',
    organization: 'Local Food Bank',
    date: 'Oct 20, 2025',
    time: '9:00 AM - 2:00 PM',
    location: 'Downtown Community Center',
    volunteers: 12,
    image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Community'
  },
  {
    id: 2,
    title: 'Environmental Cleanup Day',
    organization: 'Green Earth Initiative',
    date: 'Oct 22, 2025',
    time: '8:00 AM - 12:00 PM',
    location: 'Riverside Park',
    volunteers: 25,
    image: 'https://images.unsplash.com/photo-1624858194621-92e3efffe22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Environment'
  },
  {
    id: 3,
    title: 'Youth Mentorship Workshop',
    organization: 'Future Leaders Foundation',
    date: 'Oct 25, 2025',
    time: '3:00 PM - 6:00 PM',
    location: 'City Education Hub',
    volunteers: 8,
    image: 'https://images.unsplash.com/photo-1648254333845-54e0ecba1123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Education'
  }
];

const ongoingProjects = [
  {
    id: 1,
    title: 'Senior Care Program',
    organization: 'Elder Support Network',
    progress: 65,
    hoursContributed: 24,
    totalHours: 40,
    dueDate: 'Nov 15, 2025'
  },
  {
    id: 2,
    title: 'Digital Literacy Classes',
    organization: 'Tech for All',
    progress: 45,
    hoursContributed: 18,
    totalHours: 40,
    dueDate: 'Nov 30, 2025'
  }
];

export function OverviewDashboard() {
  const { user } = useUserProfile();
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-gray-900">Welcome back, {user ? user.name : "Volunteer"}!</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your volunteer activities</p>
      </div>

      {/* AVR Status Banner */}
      <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-teal-600 text-white p-3 rounded-full">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2">🛡️ You're in the Athar Volunteer Reserve!</h3>
              <p className="text-gray-600 mb-3">
                You have 4 verified skills and can be activated for crisis response by Verified Partner organizations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-teal-600 text-white p-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verified Skills</p>
                    <p className="text-teal-700">4</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-purple-600 text-white p-2 rounded-lg">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Simulations</p>
                    <p className="text-purple-700">2/4</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-green-600 text-white p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Impact Points</p>
                    <p className="text-green-700">1,450</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <p className="text-blue-700">92%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events you've registered for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-gray-900 truncate">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{event.organization}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{event.category}</Badge>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{event.volunteers} volunteers registered</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ongoing Projects */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ongoing Projects</CardTitle>
              <CardDescription>Your active commitments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ongoingProjects.map((project) => (
                <div key={project.id} className="space-y-3">
                  <div>
                    <h4 className="text-gray-900">{project.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{project.organization}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-teal-700">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{project.hoursContributed}/{project.totalHours} hours</span>
                    <span>Due: {project.dueDate}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
