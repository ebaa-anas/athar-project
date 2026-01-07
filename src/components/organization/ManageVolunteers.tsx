import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Search, 
  Mail, 
  Phone, 
  Star, 
  Clock, 
  Award,
  MessageSquare,
  MoreVertical,
  Filter,
  Users
} from 'lucide-react';

const volunteers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    status: 'active',
    rating: 4.9,
    totalHours: 127,
    completedProjects: 8,
    skills: ['Leadership', 'Teaching', 'Event Planning'],
    joinedDate: 'Jan 2024',
    lastActive: '2 hours ago',
    reliability: 98
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    status: 'active',
    rating: 4.8,
    totalHours: 98,
    completedProjects: 6,
    skills: ['Customer Service', 'Communication'],
    joinedDate: 'Mar 2024',
    lastActive: '1 day ago',
    reliability: 95
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'michael.c@example.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    status: 'active',
    rating: 4.7,
    totalHours: 85,
    completedProjects: 5,
    skills: ['Project Management', 'Organization'],
    joinedDate: 'Apr 2024',
    lastActive: '3 days ago',
    reliability: 92
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    status: 'inactive',
    rating: 4.6,
    totalHours: 45,
    completedProjects: 3,
    skills: ['Social Media', 'Marketing'],
    joinedDate: 'Jun 2024',
    lastActive: '2 weeks ago',
    reliability: 88
  },
  {
    id: 5,
    name: 'Robert Wilson',
    email: 'robert.w@example.com',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    status: 'active',
    rating: 4.9,
    totalHours: 112,
    completedProjects: 7,
    skills: ['Physical Activity', 'Logistics'],
    joinedDate: 'Feb 2024',
    lastActive: '5 hours ago',
    reliability: 97
  },
  {
    id: 6,
    name: 'Lisa Anderson',
    email: 'lisa.a@example.com',
    phone: '+1 (555) 678-9012',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    status: 'active',
    rating: 4.8,
    totalHours: 76,
    completedProjects: 4,
    skills: ['Teaching', 'Mentoring'],
    joinedDate: 'May 2024',
    lastActive: '1 day ago',
    reliability: 94
  }
];

export function ManageVolunteers() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] text-2xl font-bold">Manage Volunteers</h1>
          <p className="text-slate-500 mt-1">View and manage your volunteer network</p>
        </div>
        <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
          <Mail className="mr-2 h-4 w-4" />
          Send Message to All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Volunteers</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">{volunteers.length}</p>
              </div>
              <div className="bg-[#043E52]/10 p-3 rounded-lg">
                <Users className="h-5 w-5 text-[#043E52]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="text-[#1C9290] text-2xl font-bold mt-2">
                  {volunteers.filter(v => v.status === 'active').length}
                </p>
              </div>
              <div className="bg-[#1C9290]/10 p-3 rounded-lg">
                <div className="h-2.5 w-2.5 bg-[#1C9290] rounded-full shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg Rating</p>
                <p className="text-[#E16A3D] text-2xl font-bold mt-2">
                  {(volunteers.reduce((sum, v) => sum + v.rating, 0) / volunteers.length).toFixed(1)}
                </p>
              </div>
              <div className="bg-[#E16A3D]/10 p-3 rounded-lg">
                <Star className="h-5 w-5 text-[#E16A3D] fill-[#E16A3D]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Hours</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">
                  {volunteers.reduce((sum, v) => sum + v.totalHours, 0)}
                </p>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <Clock className="h-5 w-5 text-slate-600" />
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
                placeholder="Search volunteers by name, skills, or email..." 
                className="pl-10 border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" 
              />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Volunteers List */}
      <div className="grid grid-cols-1 gap-4">
        {volunteers.map((volunteer) => (
          <Card key={volunteer.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-[#1C9290]/30">
            <CardContent className="p-6">
              <div className="flex gap-6">
                <Avatar className="w-16 h-16 border-2 border-slate-100">
                  <AvatarImage src={volunteer.avatar} />
                  <AvatarFallback className="bg-[#043E52] text-white">{volunteer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-[#043E52] font-bold text-lg">{volunteer.name}</h3>
                        <Badge 
                          variant="outline"
                          className={volunteer.status === 'active' 
                            ? 'bg-[#1C9290]/10 text-[#1C9290] border-[#1C9290]/20' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'}
                        >
                          {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{volunteer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{volunteer.phone}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-[#043E52]">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-2 border-y border-slate-50">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Rating</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-[#E16A3D] text-[#E16A3D]" />
                        <span className="text-sm font-bold text-slate-700">{volunteer.rating}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Hours</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4 text-[#1C9290]" />
                        <span className="text-sm font-bold text-slate-700">{volunteer.totalHours}h</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Projects</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Award className="h-4 w-4 text-[#043E52]" />
                        <span className="text-sm font-bold text-slate-700">{volunteer.completedProjects}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Reliability</p>
                      <span className="text-sm font-bold text-[#1C9290]">{volunteer.reliability}%</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Last Active</p>
                      <span className="text-sm font-medium text-slate-600">{volunteer.lastActive}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {volunteer.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-slate-50 text-[#043E52] border border-slate-200 text-xs font-medium hover:border-[#043E52]/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                      View Profile
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                      <MessageSquare className="mr-2 h-3.5 w-3.5" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                      <Mail className="mr-2 h-3.5 w-3.5" />
                      Invite to Opportunity
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}