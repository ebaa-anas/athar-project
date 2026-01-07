import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, MapPin, Clock, Users, Search, Heart, Filter } from 'lucide-react';

const opportunities = [
  {
    id: 1,
    title: 'Food Distribution Assistant',
    organization: 'Local Food Bank',
    description: 'Help distribute food packages to families in need during our weekly food drive events.',
    image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Community',
    location: 'Downtown Community Center',
    date: 'Oct 20, 2025',
    time: '9:00 AM - 2:00 PM',
    duration: '5 hours',
    volunteersNeeded: 10,
    volunteersRegistered: 7,
    type: 'One-time',
    skills: ['Customer Service', 'Physical Activity'],
    urgent: true
  },
  {
    id: 2,
    title: 'Beach Cleanup Volunteer',
    organization: 'Green Earth Initiative',
    description: 'Join us for a coastal cleanup to protect marine life and keep our beaches pristine.',
    image: 'https://images.unsplash.com/photo-1624858194621-92e3efffe22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Environment',
    location: 'Sunset Beach',
    date: 'Oct 22, 2025',
    time: '8:00 AM - 12:00 PM',
    duration: '4 hours',
    volunteersNeeded: 30,
    volunteersRegistered: 22,
    type: 'One-time',
    skills: ['Physical Activity', 'Outdoor Work'],
    urgent: false
  },
  {
    id: 3,
    title: 'Youth Tutor',
    organization: 'Future Leaders Foundation',
    description: 'Provide academic tutoring and mentorship to middle school students after school.',
    image: 'https://images.unsplash.com/photo-1648254333845-54e0ecba1123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Education',
    location: 'City Education Hub',
    date: 'Ongoing',
    time: '3:00 PM - 5:00 PM',
    duration: '2 hours/week',
    volunteersNeeded: 15,
    volunteersRegistered: 12,
    type: 'Recurring',
    skills: ['Teaching', 'Communication', 'Patience'],
    urgent: false
  },
  {
    id: 4,
    title: 'Senior Companion',
    organization: 'Elder Support Network',
    description: 'Spend quality time with elderly residents through conversations, games, and activities.',
    image: 'https://images.unsplash.com/photo-1758599668125-e154250f24bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Healthcare',
    location: 'Sunrise Senior Living',
    date: 'Ongoing',
    time: 'Flexible',
    duration: '2-3 hours/week',
    volunteersNeeded: 20,
    volunteersRegistered: 15,
    type: 'Recurring',
    skills: ['Empathy', 'Communication', 'Patience'],
    urgent: true
  },
  {
    id: 5,
    title: 'Digital Literacy Instructor',
    organization: 'Tech for All',
    description: 'Teach basic computer skills and internet safety to seniors and adults.',
    image: 'https://images.unsplash.com/photo-1518818608552-195ed130cdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Education',
    location: 'Tech District Community Center',
    date: 'Oct 24, 2025',
    time: '10:00 AM - 12:00 PM',
    duration: '2 hours',
    volunteersNeeded: 5,
    volunteersRegistered: 3,
    type: 'One-time',
    skills: ['Tech Skills', 'Teaching', 'Patience'],
    urgent: false
  },
  {
    id: 6,
    title: 'Community Garden Helper',
    organization: 'Green Earth Initiative',
    description: 'Assist with planting, watering, and maintaining our community garden.',
    image: 'https://images.unsplash.com/photo-1624858194621-92e3efffe22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Environment',
    location: 'Riverside Park',
    date: 'Ongoing',
    time: 'Weekends',
    duration: '3 hours/week',
    volunteersNeeded: 12,
    volunteersRegistered: 8,
    type: 'Recurring',
    skills: ['Gardening', 'Physical Activity'],
    urgent: false
  }
];

export function ExploreOpportunities() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Explore Opportunities</h1>
        <p className="text-gray-500 mt-1">Find volunteer opportunities that match your interests</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search opportunities..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Opportunities</TabsTrigger>
          <TabsTrigger value="one-time">One-time</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={opp.image} 
                    alt={opp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary">{opp.category}</Badge>
                    {opp.urgent && <Badge className="bg-red-500 hover:bg-red-600">Urgent</Badge>}
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="absolute top-3 right-3"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                  <CardDescription className="text-sm text-teal-700">{opp.organization}</CardDescription>
                  <CardDescription className="line-clamp-2">{opp.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{opp.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{opp.time} • {opp.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{opp.volunteersRegistered}/{opp.volunteersNeeded} volunteers registered</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {opp.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-teal-700 hover:bg-teal-800">
                      Apply Now
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="one-time" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {opportunities.filter(opp => opp.type === 'One-time').map((opp) => (
              <Card key={opp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={opp.image} 
                    alt={opp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary">{opp.category}</Badge>
                    {opp.urgent && <Badge className="bg-red-500 hover:bg-red-600">Urgent</Badge>}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                  <CardDescription className="text-sm text-teal-700">{opp.organization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-teal-700 hover:bg-teal-800">Apply Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {opportunities.filter(opp => opp.type === 'Recurring').map((opp) => (
              <Card key={opp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={opp.image} 
                    alt={opp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary">{opp.category}</Badge>
                    {opp.urgent && <Badge className="bg-red-500 hover:bg-red-600">Urgent</Badge>}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                  <CardDescription className="text-sm text-teal-700">{opp.organization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-teal-700 hover:bg-teal-800">Apply Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
