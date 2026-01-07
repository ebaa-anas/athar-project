import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  Settings,
  Shield,
  Users,
  Bell,
  CreditCard,
  Trash2,
  Plus,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';

const teamMembers = [
  {
    id: 1,
    name: 'Jane Smith',
    email: 'jane@localfoodbank.org',
    role: 'Administrator',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    status: 'active'
  },
  {
    id: 2,
    name: 'Mark Johnson',
    email: 'mark@localfoodbank.org',
    role: 'Manager',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    status: 'active'
  },
  {
    id: 3,
    name: 'Emily Brown',
    email: 'emily@localfoodbank.org',
    role: 'Coordinator',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    status: 'active'
  }
];

export function OrganizationSettings() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#043E52] text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your organization settings and preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-100 text-slate-500">
          <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">General</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">Team</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">Notifications</TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm">Billing</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Organization Information</CardTitle>
              <CardDescription>Update your organization's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-slate-700">Organization Name</Label>
                <Input id="org-name" defaultValue="Local Food Bank" className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-email" className="text-slate-700">Contact Email</Label>
                <Input id="org-email" type="email" defaultValue="contact@localfoodbank.org" className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-phone" className="text-slate-700">Phone Number</Label>
                <Input id="org-phone" defaultValue="+1 (555) 123-4567" className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-website" className="text-slate-700">Website</Label>
                <Input id="org-website" defaultValue="www.localfoodbank.org" className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" />
              </div>
              <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Preferences</CardTitle>
              <CardDescription>Customize your organization's preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-approve" className="flex-1 text-slate-700">
                  <span className="text-sm font-medium">Automatically approve verified volunteers</span>
                  <p className="text-xs text-slate-500">Volunteers with high ratings are auto-approved</p>
                </Label>
                <Switch id="auto-approve" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="public-profile" className="flex-1 text-slate-700">
                  <span className="text-sm font-medium">Public organization profile</span>
                  <p className="text-xs text-slate-500">Allow volunteers to find your organization</p>
                </Label>
                <Switch id="public-profile" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-digest" className="flex-1 text-slate-700">
                  <span className="text-sm font-medium">Daily email digest</span>
                  <p className="text-xs text-slate-500">Receive daily summary of activities</p>
                </Label>
                <Switch id="email-digest" defaultChecked />
              </div>
              <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#043E52]">Team Members</CardTitle>
                  <CardDescription>Manage your organization's team members</CardDescription>
                </div>
                <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-[#043E52]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-slate-200">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-[#043E52] text-white">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold text-[#043E52]">{member.name}</h4>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-slate-200 text-slate-600">{member.role}</Badge>
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="border-slate-200 text-[#E16A3D] hover:text-[#c2562d] hover:bg-[#E16A3D]/5">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Roles & Permissions</CardTitle>
              <CardDescription>Define what each role can do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <h4 className="text-sm font-bold text-[#043E52] mb-2">Administrator</h4>
                  <p className="text-xs text-slate-500 mb-3">Full access to all features and settings</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">Manage Team</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">Edit Settings</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">Manage Billing</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">All Permissions</Badge>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <h4 className="text-sm font-bold text-[#043E52] mb-2">Manager</h4>
                  <p className="text-xs text-slate-500 mb-3">Manage volunteers and opportunities</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">Manage Volunteers</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">Post Opportunities</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">View Reports</Badge>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <h4 className="text-sm font-bold text-[#043E52] mb-2">Coordinator</h4>
                  <p className="text-xs text-slate-500 mb-3">Manage events and basic volunteer tasks</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">Manage Events</Badge>
                    <Badge variant="secondary" className="bg-white border border-slate-200 text-xs text-slate-600">Message Volunteers</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-slate-700">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="current-password" 
                    type={showPassword ? "text" : "password"}
                    className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-[#043E52]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-700">New Password</Label>
                <Input id="new-password" type="password" className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700">Confirm New Password</Label>
                <Input id="confirm-password" type="password" className="border-slate-200 focus:border-[#043E52] focus:ring-[#043E52]" />
              </div>
              <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Two-Factor Authentication</h4>
                  <p className="text-xs text-slate-500 mt-1">Secure your account with 2FA</p>
                </div>
                <Badge variant="outline" className="bg-[#E16A3D]/10 text-[#E16A3D] border-[#E16A3D]/20">
                  Not Enabled
                </Badge>
              </div>
              <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
                <Shield className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Current Session</h4>
                  <p className="text-xs text-slate-500 mt-1">Chrome on Windows • New York, USA</p>
                </div>
                <Badge className="bg-[#1C9290] hover:bg-[#157a78] text-white">Active</Badge>
              </div>
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200">
                Sign Out All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Email Notifications</CardTitle>
              <CardDescription>Choose what emails you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-applications" className="flex-1 text-slate-700">
                  <span className="text-sm font-medium">New applications</span>
                  <p className="text-xs text-slate-500">Get notified of new volunteer applications</p>
                </Label>
                <Switch id="email-applications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-events" className="flex-1 text-slate-700">
                  <span className="text-sm font-medium">Event updates</span>
                  <p className="text-xs text-slate-500">Updates about your events</p>
                </Label>
                <Switch id="email-events" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-messages" className="flex-1 text-slate-700">
                  <span className="text-sm font-medium">Messages</span>
                  <p className="text-xs text-slate-500">Messages from volunteers</p>
                </Label>
                <Switch id="email-messages" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-reports" className="flex-1 text-slate-700">
                  <span className="text-sm font-medium">Weekly reports</span>
                  <p className="text-xs text-slate-500">Weekly activity summary</p>
                </Label>
                <Switch id="email-reports" defaultChecked />
              </div>
              <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-sm">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border border-[#043E52]/20 rounded-lg bg-[#043E52]/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[#043E52] font-bold mb-1">Professional Plan</h3>
                    <p className="text-sm text-slate-600">For growing organizations</p>
                  </div>
                  <Badge className="bg-[#043E52] hover:bg-[#033040] text-white">Active</Badge>
                </div>
                <div className="mb-4">
                  <p className="text-[#043E52] text-xl font-bold">$49/month</p>
                  <p className="text-sm text-slate-500">Billed monthly</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-white">Change Plan</Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200">
                    Cancel Subscription
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Plan Features</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Settings className="h-4 w-4 text-[#1C9290]" />
                    <span>Unlimited volunteers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-[#1C9290]" />
                    <span>Team collaboration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Bell className="h-4 w-4 text-[#1C9290]" />
                    <span>Advanced notifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CreditCard className="h-4 w-4 text-[#1C9290]" />
                    <span>Priority support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Payment Method</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700">•••• •••• •••• 4242</h4>
                    <p className="text-xs text-slate-500">Expires 12/2025</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                  Update
                </Button>
              </div>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#043E52]">Billing History</CardTitle>
              <CardDescription>View your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Oct 1, 2025', amount: '$49.00', status: 'Paid' },
                  { date: 'Sep 1, 2025', amount: '$49.00', status: 'Paid' },
                  { date: 'Aug 1, 2025', amount: '$49.00', status: 'Paid' }
                ].map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-[#043E52]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{invoice.date}</p>
                        <p className="text-xs text-slate-500">{invoice.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-[#1C9290]/10 text-[#1C9290] border-[#1C9290]/20">
                        {invoice.status}
                      </Badge>
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-[#043E52] hover:bg-slate-50">
                        <Mail className="mr-2 h-3 w-3" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}