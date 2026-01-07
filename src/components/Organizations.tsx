import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Users, Star, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

const organizations = [
  {
    id: 1,
    name: 'Local Food Bank',
    description: 'Fighting hunger in our community by providing food assistance to families in need.',
    category: 'Community',
    location: 'Downtown',
    volunteers: 234,
    rating: 4.8,
    projects: 12,
    image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    verified: true
  },
  {
    id: 2,
    name: 'Green Earth Initiative',
    description: 'Environmental conservation and sustainability programs for a greener future.',
    category: 'Environment',
    location: 'Riverside',
    volunteers: 456,
    rating: 4.9,
    projects: 18,
    image: 'https://images.unsplash.com/photo-1624858194621-92e3efffe22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    verified: true
  },
  {
    id: 3,
    name: 'Future Leaders Foundation',
    description: 'Empowering youth through mentorship, education, and leadership development.',
    category: 'Education',
    location: 'City Center',
    volunteers: 189,
    rating: 4.7,
    projects: 8,
    image: 'https://images.unsplash.com/photo-1648254333845-54e0ecba1123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    verified: true
  },
  {
    id: 4,
    name: 'Elder Support Network',
    description: 'Providing care, companionship, and support services to senior citizens.',
    category: 'Healthcare',
    location: 'Northside',
    volunteers: 123,
    rating: 4.6,
    projects: 6,
    image: 'https://images.unsplash.com/photo-1758599668125-e154250f24bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    verified: true
  },
  {
    id: 5,
    name: 'Tech for All',
    description: 'Bridging the digital divide through technology education and access.',
    category: 'Education',
    location: 'Tech District',
    volunteers: 312,
    rating: 4.8,
    projects: 15,
    image: 'https://images.unsplash.com/photo-1518818608552-195ed130cdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    verified: true
  },
  {
    id: 6,
    name: 'Community Health Clinic',
    description: 'Free healthcare services and wellness programs for underserved populations.',
    category: 'Healthcare',
    location: 'Westside',
    volunteers: 267,
    rating: 4.9,
    projects: 10,
    image: 'https://images.unsplash.com/photo-1758599668125-e154250f24bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    verified: false
  }
];

const myOrganizations = [
  { id: 1, name: 'Local Food Bank', role: 'Active Volunteer', hours: 45 },
  { id: 2, name: 'Green Earth Initiative', role: 'Active Volunteer', hours: 32 },
  { id: 5, name: 'Tech for All', role: 'Active Volunteer', hours: 18 }
];

export function Organizations() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Organizations</h1>
          <p className="text-gray-500 mt-1">Discover and connect with non-profit organizations</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search organizations..." 
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* My Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>My Organizations</CardTitle>
          <CardDescription>Organizations you're currently volunteering with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myOrganizations.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-teal-100 text-teal-700">
                      {org.name.split(' ').map(w => w[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-gray-900">{org.name}</h4>
                    <p className="text-sm text-gray-500">{org.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-teal-700">{org.hours}h</p>
                  <p className="text-sm text-gray-500">contributed</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Organizations */}
      <div>
        <h2 className="text-gray-900 mb-4">Explore Organizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 overflow-hidden relative">
                <img 
                  src={org.image} 
                  alt={org.name}
                  className="w-full min-h-screen overflow-y-auto object-cover"
                />
                {org.verified && (
                  <Badge className="absolute top-3 right-3 bg-white text-teal-700 border-teal-700">
                    Verified
                  </Badge>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <Badge variant="outline" className="shrink-0">{org.category}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{org.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{org.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{org.volunteers} volunteers • {org.projects} active projects</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{org.rating} rating</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-teal-700 hover:bg-teal-800">
                    Join
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
