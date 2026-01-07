import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CheckCircle, XCircle, Eye, ExternalLink, MapPin, Users, Clock, Building2, FileText, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function VerificationRequests() {
  const pendingRequests = [
    {
      id: 1,
      name: 'Hope Foundation',
      type: 'Education',
      location: 'Istanbul, Turkey',
      members: 250,
      founded: '2020',
      description: 'Providing educational opportunities to underprivileged children.',
      documents: 3,
      submittedDate: '2 days ago',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=100&h=100&fit=crop',
    },
    {
      id: 2,
      name: 'Green Earth Initiative',
      type: 'Environment',
      location: 'Ankara, Turkey',
      members: 180,
      founded: '2019',
      description: 'Environmental conservation and sustainability programs.',
      documents: 4,
      submittedDate: '3 days ago',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop',
    },
    {
      id: 3,
      name: 'Community Health Center',
      type: 'Health',
      location: 'Izmir, Turkey',
      members: 320,
      founded: '2018',
      description: 'Free healthcare services for low-income communities.',
      documents: 5,
      submittedDate: '5 days ago',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&h=100&fit=crop',
    },
  ];

  const verifiedOrgs = [
    {
      id: 4,
      name: 'Local Food Bank',
      type: 'Food Security',
      location: 'Istanbul, Turkey',
      verifiedDate: '1 week ago',
      image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?w=100&h=100&fit=crop',
    },
    {
      id: 5,
      name: 'Animal Rescue Center',
      type: 'Animal Welfare',
      location: 'Bursa, Turkey',
      verifiedDate: '2 weeks ago',
      image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=100&h=100&fit=crop',
    },
  ];

  const rejectedRequests = [
    {
      id: 6,
      name: 'Incomplete Organization',
      type: 'Education',
      reason: 'Missing required documents',
      rejectedDate: '3 days ago',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] font-bold text-3xl mb-2">Verification Requests</h1>
          <p className="text-slate-500">Validate organization credentials to maintain platform trust</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200 text-[#043E52]">
                <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button className="bg-[#043E52] hover:bg-[#016A6D] text-white">
                Download Report
            </Button>
        </div>
      </div>

      {/* 1. VIBRANT STATS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending - Sunset Orange */}
        <Card className="bg-gradient-to-br from-[#E16A3D] to-[#c2562d] text-white border-none shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText className="h-24 w-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Pending Approval</p>
                <p className="text-4xl font-bold">3</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-orange-100 bg-black/10 w-fit px-3 py-1 rounded-full">
              Avg Wait: 1.2 Days
            </div>
          </CardContent>
        </Card>

        {/* Verified - Sea Green */}
        <Card className="bg-gradient-to-br from-[#1C9290] to-[#157a78] text-white border-none shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="h-24 w-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">Verified Organizations</p>
                <p className="text-4xl font-bold">814</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-teal-100 bg-black/10 w-fit px-3 py-1 rounded-full">
              +12 this week
            </div>
          </CardContent>
        </Card>

        {/* Total - Nile Blue */}
        <Card className="bg-gradient-to-br from-[#043E52] to-[#033040] text-white border-none shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="h-24 w-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium mb-1">Total Applications</p>
                <p className="text-4xl font-bold">892</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-slate-300 bg-white/5 w-fit px-3 py-1 rounded-full">
              91% Approval Rate
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
          <TabsTrigger 
            value="pending"
            className="data-[state=active]:bg-[#E16A3D] data-[state=active]:text-white rounded-lg px-6 transition-all"
          >
            Pending
            <Badge className="ml-2 bg-white text-[#E16A3D] hover:bg-white/90 shadow-none">{pendingRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="verified"
            className="data-[state=active]:bg-[#1C9290] data-[state=active]:text-white rounded-lg px-6 transition-all"
          >
            Verified
          </TabsTrigger>
          <TabsTrigger 
            value="rejected"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg px-6 transition-all"
          >
            Rejected
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests - Detailed Cards */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="border border-slate-200 hover:shadow-lg transition-all duration-300 group overflow-hidden">
              <div className="flex flex-col md:flex-row">
                
                {/* Left Accent Bar */}
                <div className="w-full md:w-2 bg-[#E16A3D] h-2 md:h-auto"></div>

                <div className="flex-1 p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar & Basic Info */}
                    <div className="flex items-start gap-4 min-w-[200px]">
                      <Avatar className="w-16 h-16 border-2 border-orange-100 shadow-sm">
                        <AvatarImage src={request.image} />
                        <AvatarFallback className="bg-[#043E52] text-white font-bold">{request.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-[#043E52] font-bold text-lg mb-1">{request.name}</h3>
                        <Badge variant="secondary" className="bg-slate-100 text-[#043E52] border-slate-200">{request.type}</Badge>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 border-l border-slate-100 pl-0 md:pl-6">
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase">Location</p>
                            <div className="flex items-center gap-1 text-slate-700 font-medium">
                                <MapPin className="h-4 w-4 text-[#E16A3D]" /> {request.location}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase">Size</p>
                            <div className="flex items-center gap-1 text-slate-700 font-medium">
                                <Users className="h-4 w-4 text-[#016A6D]" /> {request.members}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase">Founded</p>
                            <div className="flex items-center gap-1 text-slate-700 font-medium">
                                <Clock className="h-4 w-4 text-[#016A6D]" /> {request.founded}
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-3 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-sm text-slate-600 italic">"{request.description}"</p>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="w-full md:w-[250px] bg-slate-50 p-6 flex flex-col justify-center gap-3 border-l border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>Submitted:</span>
                        <span className="font-bold text-[#043E52]">{request.submittedDate}</span>
                    </div>
                    <Button className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white shadow-sm gap-2">
                        <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-slate-200 text-[#043E52] hover:bg-white">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="flex-1 border-slate-200 text-[#043E52] hover:bg-white" title="View Documents">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Verified Content */}
        <TabsContent value="verified" className="space-y-4">
          {verifiedOrgs.map((org) => (
            <Card key={org.id} className="border border-slate-200 hover:shadow-sm transition-all group">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-slate-200">
                      <AvatarImage src={org.image} />
                      <AvatarFallback className="bg-[#1C9290] text-white font-bold">{org.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-[#043E52] font-bold text-lg mb-1">{org.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Badge variant="secondary" className="bg-slate-100">{org.type}</Badge>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {org.location}</span>
                      </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400">Verified On</p>
                        <p className="text-sm font-medium text-[#043E52]">{org.verifiedDate}</p>
                    </div>
                    <Badge className="bg-[#1C9290]/10 text-[#1C9290] hover:bg-[#1C9290]/20 border-none px-3 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Rejected Content */}
        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.map((request) => (
            <Card key={request.id} className="border border-red-100 bg-red-50/10">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-slate-700 font-bold text-lg">{request.name}</h3>
                    <p className="text-sm text-slate-500 mb-2">{request.type}</p>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-white">Reason: {request.reason}</Badge>
                    </div>
                </div>
                <div className="text-right">
                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 mb-1">Rejected</Badge>
                    <p className="text-xs text-slate-400">{request.rejectedDate}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}