import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  MapPin,
  Calendar,
  MoreVertical,
  Eye,
  Copy
} from 'lucide-react';

const opportunities = [
  {
    id: 1,
    title: 'Food Distribution Assistant',
    description: 'Help distribute food packages to families in need during our weekly food drive events.',
    type: 'Recurring',
    location: 'Downtown Community Center',
    schedule: 'Saturdays, 9:00 AM - 2:00 PM',
    volunteersNeeded: 10,
    volunteersRegistered: 7,
    applicants: 12,
    status: 'active',
    skills: ['Customer Service', 'Physical Activity'],
    postedDate: 'Oct 1, 2025'
  },
  {
    id: 2,
    title: 'Volunteer Coordinator',
    description: 'Coordinate volunteer teams and manage event logistics for our community programs.',
    type: 'Ongoing',
    location: 'Main Office',
    schedule: 'Flexible',
    volunteersNeeded: 2,
    volunteersRegistered: 1,
    applicants: 8,
    status: 'active',
    skills: ['Leadership', 'Organization', 'Communication'],
    postedDate: 'Sep 25, 2025'
  },
  {
    id: 3,
    title: 'Food Safety Training Helper',
    description: 'Assist in conducting food safety training sessions for new volunteers.',
    type: 'One-time',
    location: 'Training Center',
    schedule: 'Oct 30, 2025 - 2:00 PM - 5:00 PM',
    volunteersNeeded: 3,
    volunteersRegistered: 2,
    applicants: 5,
    status: 'active',
    skills: ['Teaching', 'Food Safety Knowledge'],
    postedDate: 'Oct 10, 2025'
  },
  {
    id: 4,
    title: 'Community Outreach Volunteer',
    description: 'Help spread awareness about our programs and recruit new volunteers.',
    type: 'Ongoing',
    location: 'Various Locations',
    schedule: 'Flexible',
    volunteersNeeded: 5,
    volunteersRegistered: 5,
    applicants: 15,
    status: 'filled',
    skills: ['Marketing', 'Communication', 'Social Media'],
    postedDate: 'Sep 15, 2025'
  },
  {
    id: 5,
    title: 'Summer Food Program Assistant',
    description: 'Support our summer food program for children in underserved communities.',
    type: 'Seasonal',
    location: 'Multiple Schools',
    schedule: 'June - August, Weekdays',
    volunteersNeeded: 20,
    volunteersRegistered: 0,
    applicants: 0,
    status: 'draft',
    skills: ['Child Care', 'Food Service'],
    postedDate: 'Oct 15, 2025'
  }
];

export function ManageOpportunities() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] font-bold text-2xl">Manage Opportunities</h1>
          <p className="text-slate-500 mt-1">Create and manage volunteer opportunities</p>
        </div>
        <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Post New Opportunity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">
                  {opportunities.filter(o => o.status === 'active').length}
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
                <p className="text-sm font-medium text-slate-500">Filled</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">
                  {opportunities.filter(o => o.status === 'filled').length}
                </p>
              </div>
              <div className="bg-[#043E52]/10 p-3 rounded-lg">
                <div className="h-2.5 w-2.5 bg-[#043E52] rounded-full shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Draft</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">
                  {opportunities.filter(o => o.status === 'draft').length}
                </p>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <div className="h-2.5 w-2.5 bg-slate-400 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Applicants</p>
                <p className="text-[#043E52] text-2xl font-bold mt-2">
                  {opportunities.reduce((sum, o) => sum + o.applicants, 0)}
                </p>
              </div>
              <div className="bg-[#E16A3D]/10 p-3 rounded-lg">
                <Users className="h-5 w-5 text-[#E16A3D]" />
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
                placeholder="Search opportunities..." 
                className="pl-10 border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" 
              />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">Filter by Type</Button>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">Filter by Status</Button>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100 text-slate-500">
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">All Opportunities</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm">Active</TabsTrigger>
          <TabsTrigger value="filled" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">Filled</TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-[#1C9290]/30">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[#043E52] font-bold text-lg">{opp.title}</h3>
                            <Badge 
                              variant="outline" 
                              className={
                                opp.status === 'active' ? 'bg-[#1C9290]/10 text-[#1C9290] border-[#1C9290]/20' :
                                opp.status === 'filled' ? 'bg-[#043E52]/10 text-[#043E52] border-[#043E52]/20' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }
                            >
                              {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="text-slate-500 border-slate-200">{opp.type}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-2">{opp.description}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-[#043E52]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="h-4 w-4 text-[#1C9290]" />
                          <span>{opp.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="h-4 w-4 text-[#1C9290]" />
                          <span>{opp.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users className="h-4 w-4 text-[#043E52]" />
                          <span className="font-medium text-[#043E52]">{opp.volunteersRegistered}/{opp.volunteersNeeded} volunteers</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>Posted {opp.postedDate}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {opp.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-slate-50 text-[#043E52] text-xs border border-slate-200 hover:border-[#043E52]/30">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-4">
                        <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                          <Eye className="mr-2 h-3 w-3" />
                          View ({opp.applicants} applicants)
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                          <Copy className="mr-2 h-3 w-3" />
                          Duplicate
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-200 text-[#E16A3D] hover:text-[#c2562d] hover:bg-[#E16A3D]/5 hover:border-[#E16A3D]/20">
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {opportunities.filter(o => o.status === 'active').map((opp) => (
              <Card key={opp.id} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base text-[#043E52]">{opp.title}</CardTitle>
                  <CardDescription>{opp.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="filled" className="mt-6">
          <div className="space-y-4">
            {opportunities.filter(o => o.status === 'filled').map((opp) => (
              <Card key={opp.id} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base text-[#043E52]">{opp.title}</CardTitle>
                  <CardDescription>{opp.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <div className="space-y-4">
            {opportunities.filter(o => o.status === 'draft').map((opp) => (
              <Card key={opp.id} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base text-slate-600">{opp.title}</CardTitle>
                  <CardDescription>{opp.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}