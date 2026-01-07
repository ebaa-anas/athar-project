import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Search, MoreVertical, UserCheck, Building2, Shield, Clock, Mail, UserPlus, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function UserManagement() {
  const volunteers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      joinDate: 'Jan 15, 2025',
      hours: 45,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      email: 'ahmed.h@email.com',
      joinDate: 'Jan 10, 2025',
      hours: 78,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      id: 3,
      name: 'Emily Chen',
      email: 'emily.c@email.com',
      joinDate: 'Dec 28, 2024',
      hours: 120,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
    {
      id: 4,
      name: 'Michael Brown',
      email: 'michael.b@email.com',
      joinDate: 'Dec 15, 2024',
      hours: 32,
      status: 'Inactive',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    },
  ];

  const organizations = [
    {
      id: 1,
      name: 'Local Food Bank',
      email: 'contact@localfoodbank.org',
      joinDate: 'Nov 20, 2024',
      volunteers: 45,
      verified: true,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?w=100&h=100&fit=crop',
    },
    {
      id: 2,
      name: 'Hope Foundation',
      email: 'info@hopefoundation.org',
      joinDate: 'Jan 5, 2025',
      volunteers: 28,
      verified: false,
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=100&h=100&fit=crop',
    },
    {
      id: 3,
      name: 'Green Earth Initiative',
      email: 'team@greenearth.org',
      joinDate: 'Dec 10, 2024',
      volunteers: 62,
      verified: true,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop',
    },
  ];

  const admins = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@athar.com',
      role: 'Super Admin',
      lastActive: '5 minutes ago',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@athar.com',
      role: 'Moderator',
      lastActive: '2 hours ago',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#043E52] font-bold text-3xl mb-2">User Management</h1>
          <p className="text-slate-500">Manage access and permissions across the platform</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-[#043E52] hover:bg-slate-50 gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-[#1C9290] hover:bg-[#157a78] text-white shadow-md gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats - Clean & Professional (No heavy borders) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-[#043E52]">15,234</p>
              </div>
              <div className="bg-[#043E52]/10 text-[#043E52] p-3 rounded-xl">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Volunteers</p>
                <p className="text-2xl font-bold text-[#043E52]">10,420</p>
              </div>
              <div className="bg-[#1C9290]/10 text-[#1C9290] p-3 rounded-xl">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Organizations</p>
                <p className="text-2xl font-bold text-[#043E52]">814</p>
              </div>
              <div className="bg-[#016A6D]/10 text-[#016A6D] p-3 rounded-xl">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Admins</p>
                <p className="text-2xl font-bold text-[#043E52]">12</p>
              </div>
              <div className="bg-[#E16A3D]/10 text-[#E16A3D] p-3 rounded-xl">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email, or role..." 
            className="pl-10 border-slate-200 focus:border-[#1C9290] focus:ring-[#1C9290]" 
          />
        </div>

        <Tabs defaultValue="volunteers" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
            <TabsTrigger 
              value="volunteers" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-4"
            >
              Volunteers
            </TabsTrigger>
            <TabsTrigger 
              value="organizations" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-4"
            >
              Organizations
            </TabsTrigger>
            <TabsTrigger 
              value="admins" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm px-4"
            >
              Admins
            </TabsTrigger>
          </TabsList>

          {/* Volunteers Table */}
          <TabsContent value="volunteers">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[#043E52] font-semibold pl-6">User</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Join Date</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Activity</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Status</TableHead>
                      <TableHead className="text-right text-[#043E52] font-semibold pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((volunteer) => (
                      <TableRow key={volunteer.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200">
                              <AvatarImage src={volunteer.image} />
                              <AvatarFallback className="bg-[#1C9290] text-white font-medium">
                                {volunteer.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[#043E52] font-semibold">{volunteer.name}</p>
                              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {volunteer.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{volunteer.joinDate}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                             <Clock className="h-4 w-4 text-[#1C9290]" />
                             <span className="font-medium text-slate-700">{volunteer.hours} hrs</span>
                           </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            volunteer.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                          }>
                            {volunteer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#043E52]">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                Suspend Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Table */}
          <TabsContent value="organizations">
             <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[#043E52] font-semibold pl-6">Organization</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Join Date</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Capacity</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Status</TableHead>
                      <TableHead className="text-right text-[#043E52] font-semibold pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200">
                              <AvatarImage src={org.image} />
                              <AvatarFallback className="bg-[#043E52] text-white font-medium">
                                {org.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-[#043E52] font-semibold">{org.name}</p>
                                {org.verified && (
                                  <Badge className="bg-[#1C9290] hover:bg-[#157a78] text-[10px] px-1.5 py-0 h-4 leading-none">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {org.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{org.joinDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-[#043E52]" />
                            <span className="font-medium text-slate-700">{org.volunteers} vols</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            org.status === 'Active' 
                            ? 'bg-[#043E52]/5 text-[#043E52] border-[#043E52]/20' 
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                          }>
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#043E52]">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>Verify Organization</DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 hover:bg-red-50">Suspend Account</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Table */}
          <TabsContent value="admins">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[#043E52] font-semibold pl-6">Admin User</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Role</TableHead>
                      <TableHead className="text-[#043E52] font-semibold">Last Active</TableHead>
                      <TableHead className="text-right text-[#043E52] font-semibold pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200">
                              <AvatarImage src={admin.image} />
                              <AvatarFallback className="bg-[#016A6D] text-white font-medium">
                                {admin.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[#043E52] font-semibold">{admin.name}</p>
                              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#016A6D] hover:bg-[#015052]">{admin.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="h-4 w-4 text-[#016A6D]" />
                            {admin.lastActive}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#043E52]">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                              <DropdownMenuItem>View Activity Log</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 hover:bg-red-50">Revoke Access</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}