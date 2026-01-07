import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Copy,
  Share2,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const events = [
  {
    id: 1,
    title: 'Community Food Drive',
    description: 'Monthly food distribution event serving families in need across multiple locations.',
    date: 'Oct 20, 2025',
    startTime: '9:00 AM',
    endTime: '2:00 PM',
    location: 'Downtown Community Center',
    address: '123 Main St, New York, NY',
    image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    volunteersNeeded: 10,
    volunteersRegistered: 7,
    status: 'upcoming',
    category: 'Food Distribution',
    recurring: 'Monthly'
  },
  {
    id: 2,
    title: 'Volunteer Orientation Session',
    description: 'Welcome and training session for new volunteers joining our organization.',
    date: 'Oct 24, 2025',
    startTime: '6:00 PM',
    endTime: '8:00 PM',
    location: 'Main Office',
    address: '456 Community Drive, New York, NY',
    image: 'https://images.unsplash.com/photo-1517916358207-1e49f666e851?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    volunteersNeeded: 20,
    volunteersRegistered: 15,
    status: 'upcoming',
    category: 'Training',
    recurring: 'One-time'
  },
  {
    id: 3,
    title: 'Monthly Food Distribution',
    description: 'Large-scale food distribution across multiple community centers.',
    date: 'Oct 28, 2025',
    startTime: '10:00 AM',
    endTime: '4:00 PM',
    location: 'Multiple Locations',
    address: 'Various Community Centers',
    image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    volunteersNeeded: 50,
    volunteersRegistered: 42,
    status: 'upcoming',
    category: 'Food Distribution',
    recurring: 'Monthly'
  },
  {
    id: 4,
    title: 'Holiday Food Basket Assembly',
    description: 'Prepare and assemble holiday food baskets for families in need.',
    date: 'Nov 15, 2025',
    startTime: '8:00 AM',
    endTime: '3:00 PM',
    location: 'Warehouse Facility',
    address: '789 Industrial Pkwy, New York, NY',
    image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    volunteersNeeded: 30,
    volunteersRegistered: 18,
    status: 'upcoming',
    category: 'Special Event',
    recurring: 'Annual'
  },
  {
    id: 5,
    title: 'Community Appreciation Day',
    description: 'Celebration event thanking volunteers and community partners.',
    date: 'Sep 30, 2025',
    startTime: '2:00 PM',
    endTime: '6:00 PM',
    location: 'City Park',
    address: 'Central Park, New York, NY',
    image: 'https://images.unsplash.com/photo-1517916358207-1e49f666e851?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    volunteersNeeded: 15,
    volunteersRegistered: 15,
    status: 'completed',
    category: 'Community',
    recurring: 'Annual'
  }
];

export function Events() {
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const completedEvents = events.filter(e => e.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] text-2xl font-bold">Events</h1>
          <p className="text-slate-500 mt-1">Create and manage your organization's events</p>
        </div>
        <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Create New Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Events</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">{events.length}</p>
              </div>
              <div className="bg-[#043E52]/10 p-3 rounded-lg">
                <Calendar className="h-5 w-5 text-[#043E52]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">{upcomingEvents.length}</p>
              </div>
              <div className="bg-[#043E52]/10 p-3 rounded-lg">
                <Clock className="h-5 w-5 text-[#043E52]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Volunteers</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">
                  {events.reduce((sum, e) => sum + e.volunteersRegistered, 0)}
                </p>
              </div>
              <div className="bg-[#1C9290]/10 p-3 rounded-lg">
                <Users className="h-5 w-5 text-[#1C9290]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">{completedEvents.length}</p>
              </div>
              <div className="bg-[#1C9290]/10 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#1C9290]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search events..." 
                className="pl-10 border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" 
              />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
              <Filter className="mr-2 h-4 w-4" />
              Filter by Category
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
              Filter by Date
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-slate-100 text-slate-500">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">Upcoming ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm">Completed ({completedEvents.length})</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">All Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
                <div className="md:flex">
                  <div className="md:w-1/3 h-48 md:h-auto">
                    <img 
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-[#043E52] font-bold text-lg">{event.title}</h3>
                          <Badge variant="outline" className="border-slate-200 text-slate-600">{event.category}</Badge>
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">{event.recurring}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{event.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-[#043E52]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-4 w-4 text-[#1C9290]" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-4 w-4 text-[#1C9290]" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4 text-[#1C9290]" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">
                          <Users className="inline h-4 w-4 mr-1 text-[#043E52]" />
                          {event.volunteersRegistered}/{event.volunteersNeeded} volunteers registered
                        </span>
                        <span className="text-[#043E52] font-bold">
                          {Math.round((event.volunteersRegistered / event.volunteersNeeded) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(event.volunteersRegistered / event.volunteersNeeded) * 100} 
                        className="h-2 bg-slate-100"
                      />
                    </div>

                    {event.volunteersRegistered < event.volunteersNeeded && (
                      <div className="bg-[#E16A3D]/10 border border-[#E16A3D]/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#E16A3D]">
                          <AlertCircle className="h-4 w-4" />
                          <span>Need {event.volunteersNeeded - event.volunteersRegistered} more volunteers</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
                        Manage Event
                      </Button>
                      <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        <Users className="mr-2 h-4 w-4" />
                        View Volunteers
                      </Button>
                      <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                      <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {completedEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden border-slate-200">
                <div className="md:flex">
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    <img 
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover opacity-75"
                    />
                    <Badge className="absolute top-4 right-4 bg-[#1C9290] hover:bg-[#157a78]">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  </div>
                  <div className="flex-1 p-6">
                    <h3 className="text-[#043E52] font-bold text-lg mb-2">{event.title}</h3>
                    <p className="text-sm text-slate-600 mb-4">{event.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                      <div>Date: {event.date}</div>
                      <div>Volunteers: {event.volunteersRegistered}/{event.volunteersNeeded}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        View Report
                      </Button>
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        <Copy className="mr-2 h-3 w-3" />
                        Create Similar Event
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
                <div className="h-40 overflow-hidden relative">
                  <img 
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge 
                    className={`absolute top-3 right-3 ${
                      event.status === 'completed' 
                        ? 'bg-[#1C9290] hover:bg-[#157a78]' 
                        : 'bg-[#043E52] hover:bg-[#033040]'
                    }`}
                  >
                    {event.status === 'completed' ? 'Completed' : 'Upcoming'}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-base text-[#043E52]">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-[#1C9290]" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-[#1C9290]" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-[#043E52]" />
                    <span>{event.volunteersRegistered}/{event.volunteersNeeded} volunteers</span>
                  </div>
                  <Button className="w-full bg-[#043E52] hover:bg-[#033040] text-white shadow-sm" size="sm">
                    Manage
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}