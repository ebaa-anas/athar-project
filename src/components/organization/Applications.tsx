import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, 
  Filter,
  CheckCircle,
  X,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Briefcase
} from 'lucide-react';

const applications = [
  {
    id: 1,
    volunteer: {
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      rating: 4.8,
      totalHours: 98,
      completedProjects: 6
    },
    opportunity: 'Food Distribution Assistant',
    appliedDate: '2 hours ago',
    coverLetter: 'I am passionate about community service and have experience in food distribution. I would love to contribute to your mission of fighting hunger.',
    skills: ['Customer Service', 'Physical Activity', 'Communication'],
    availability: 'Weekends',
    experience: '2 years volunteer experience',
    status: 'pending'
  },
  {
    id: 2,
    volunteer: {
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      phone: '+1 (555) 345-6789',
      location: 'Brooklyn, NY',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 4.7,
      totalHours: 85,
      completedProjects: 5
    },
    opportunity: 'Volunteer Coordinator',
    appliedDate: '5 hours ago',
    coverLetter: 'With my background in project management and team leadership, I believe I can help coordinate your volunteer programs effectively.',
    skills: ['Leadership', 'Organization', 'Project Management'],
    availability: 'Flexible',
    experience: '3 years in volunteer coordination',
    status: 'pending'
  },
  {
    id: 3,
    volunteer: {
      name: 'Emily Davis',
      email: 'emily.d@example.com',
      phone: '+1 (555) 456-7890',
      location: 'Queens, NY',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      rating: 4.6,
      totalHours: 45,
      completedProjects: 3
    },
    opportunity: 'Food Distribution Assistant',
    appliedDate: '1 day ago',
    coverLetter: 'I am eager to give back to my community and help families in need. I have a flexible schedule and strong work ethic.',
    skills: ['Team Work', 'Communication', 'Time Management'],
    availability: 'Weekdays',
    experience: '1 year volunteer experience',
    status: 'pending'
  },
  {
    id: 4,
    volunteer: {
      name: 'David Martinez',
      email: 'david.m@example.com',
      phone: '+1 (555) 567-8901',
      location: 'Manhattan, NY',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      rating: 4.9,
      totalHours: 156,
      completedProjects: 10
    },
    opportunity: 'Community Outreach Volunteer',
    appliedDate: '2 days ago',
    coverLetter: 'I have extensive experience in marketing and community engagement. I would love to help spread awareness about your programs.',
    skills: ['Marketing', 'Social Media', 'Public Speaking'],
    availability: 'Weekends',
    experience: '4 years in community outreach',
    status: 'accepted'
  },
  {
    id: 5,
    volunteer: {
      name: 'Lisa Anderson',
      email: 'lisa.a@example.com',
      phone: '+1 (555) 678-9012',
      location: 'Bronx, NY',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
      rating: 4.5,
      totalHours: 32,
      completedProjects: 2
    },
    opportunity: 'Food Safety Training Helper',
    appliedDate: '3 days ago',
    coverLetter: 'As a certified food safety professional, I can contribute valuable expertise to your training programs.',
    skills: ['Teaching', 'Food Safety', 'Training'],
    availability: 'Flexible',
    experience: 'Food safety certified',
    status: 'rejected'
  }
];

export function Applications() {
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] text-2xl font-bold">Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage volunteer applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Applications</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">{applications.length}</p>
              </div>
              <div className="bg-[#043E52]/10 p-3 rounded-lg">
                <Briefcase className="h-5 w-5 text-[#043E52]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Review</p>
                <p className="text-[#E16A3D] text-2xl font-bold mt-2">{pendingCount}</p>
              </div>
              <div className="bg-[#E16A3D]/10 p-3 rounded-lg">
                <Clock className="h-5 w-5 text-[#E16A3D]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Accepted</p>
                <p className="text-[#1C9290] text-2xl font-bold mt-2">{acceptedCount}</p>
              </div>
              <div className="bg-[#1C9290]/10 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#1C9290]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Rejected</p>
                <p className="text-slate-700 text-2xl font-bold mt-2">{rejectedCount}</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
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
                placeholder="Search applications..." 
                className="pl-10 border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" 
              />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
              <Filter className="mr-2 h-4 w-4" />
              Filter by Opportunity
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
              Filter by Date
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100 text-slate-500">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-[#E16A3D] data-[state=active]:shadow-sm">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm">Accepted ({acceptedCount})</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">All Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {applications.filter(a => a.status === 'pending').map((app) => (
              <Card key={app.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-[#E16A3D]/30">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Avatar className="w-16 h-16 border-2 border-slate-100">
                      <AvatarImage src={app.volunteer.avatar} />
                      <AvatarFallback className="bg-[#043E52] text-white">{app.volunteer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#043E52]">{app.volunteer.name}</h3>
                          <p className="text-sm text-[#1C9290] font-medium">Applied for: {app.opportunity}</p>
                          <p className="text-xs text-slate-500 mt-1">{app.appliedDate}</p>
                        </div>
                        <Badge variant="outline" className="bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20">
                          Pending Review
                        </Badge>
                      </div>

                      {/* Volunteer Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="h-4 w-4 text-[#043E52]" />
                          <span>{app.volunteer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="h-4 w-4 text-[#043E52]" />
                          <span>{app.volunteer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="h-4 w-4 text-[#043E52]" />
                          <span>{app.volunteer.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Star className="h-4 w-4 fill-[#E16A3D] text-[#E16A3D]" />
                          <span>{app.volunteer.rating} rating</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Hours</p>
                          <p className="font-bold text-slate-700">{app.volunteer.totalHours}h</p>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Projects</p>
                          <p className="font-bold text-slate-700">{app.volunteer.completedProjects}</p>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Experience</p>
                          <p className="font-bold text-slate-700">{app.experience}</p>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Availability</p>
                          <p className="font-bold text-slate-700">{app.availability}</p>
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {app.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-slate-100 text-[#043E52] border border-slate-200 hover:border-[#043E52]/30">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Cover Letter */}
                      <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Cover Letter</p>
                        <p className="text-sm text-slate-600 bg-white border border-slate-100 p-3 rounded-lg italic">
                          "{app.coverLetter}"
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                        <Button className="bg-[#1C9290] hover:bg-[#157a78] text-white shadow-sm">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept Application
                        </Button>
                        <Button variant="outline" className="border-slate-200 text-[#E16A3D] hover:text-[#c2562d] hover:bg-[#E16A3D]/5 hover:border-[#E16A3D]/20">
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                        <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                          <Eye className="mr-2 h-4 w-4" />
                          View Full Profile
                        </Button>
                        <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                          <Mail className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other Tabs (Accepted, Rejected, All) - Simplified View */}
        {['accepted', 'rejected', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="space-y-4">
              {applications
                .filter(a => tab === 'all' ? true : a.status === tab)
                .map((app) => (
                <Card key={app.id} className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-slate-200">
                        <AvatarImage src={app.volunteer.avatar} />
                        <AvatarFallback className="bg-[#043E52] text-white">{app.volunteer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="text-[#043E52] font-bold">{app.volunteer.name}</h4>
                        <p className="text-sm text-slate-500">{app.opportunity}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          app.status === 'accepted' ? 'bg-[#1C9290]/10 text-[#1C9290] border-[#1C9290]/20' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20'
                        }
                      >
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}