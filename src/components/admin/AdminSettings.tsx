import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Bell, Shield, Database, Mail, Globe, Lock, Settings, Save, Server, CreditCard, ToggleLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function AdminSettings() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[#043E52] font-bold text-3xl mb-2">Settings</h1>
        <p className="text-slate-500">Manage platform configurations and system preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-6"
          >
            General
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm px-6"
          >
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#E16A3D] data-[state=active]:shadow-sm px-6"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="integrations" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-6"
          >
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* General Settings - Nile Blue Theme */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#043E52] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#043E52]/10 p-2 rounded-lg">
                    <Settings className="h-5 w-5 text-[#043E52]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">Platform Information</CardTitle>
                    <CardDescription>Basic platform settings and branding</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="platform-name" className="text-slate-600">Platform Name</Label>
                    <Input id="platform-name" defaultValue="Athar" className="border-slate-200 focus:border-[#043E52]" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="support-email" className="text-slate-600">Support Email</Label>
                    <Input id="support-email" type="email" defaultValue="support@athar.com" className="border-slate-200 focus:border-[#043E52]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-description" className="text-slate-600">Description</Label>
                <Input id="platform-description" defaultValue="Connecting volunteers with meaningful opportunities" className="border-slate-200 focus:border-[#043E52]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website-url" className="text-slate-600">Website URL</Label>
                <Input id="website-url" defaultValue="https://athar.com" className="border-slate-200 focus:border-[#043E52]" />
              </div>
              <div className="pt-2">
                <Button className="bg-[#043E52] hover:bg-[#033040] text-white gap-2">
                    <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#E16A3D]/10 p-2 rounded-lg">
                    <ToggleLeft className="h-5 w-5 text-[#E16A3D]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">Feature Flags</CardTitle>
                    <CardDescription>Control system-wide features</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[#043E52] font-medium">New User Registration</Label>
                  <p className="text-sm text-slate-500">Allow new users to create accounts</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#1C9290]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[#043E52] font-medium">Organization Verification</Label>
                  <p className="text-sm text-slate-500">Require manual admin verification</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#1C9290]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[#043E52] font-medium">Public Profiles</Label>
                  <p className="text-sm text-slate-500">Allow volunteer profiles to be visible publicly</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#1C9290]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings - Pine Theme */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#016A6D] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#016A6D]/10 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-[#016A6D]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">Access Control</CardTitle>
                    <CardDescription>Manage security and authentication protocols</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-500">Require 2FA for all admin accounts</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Session Timeout</Label>
                  <p className="text-sm text-slate-500">Auto logout after 30 minutes of inactivity</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Login Attempt Limits</Label>
                  <p className="text-sm text-slate-500">Lock account after 5 failed attempts</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#016A6D]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#016A6D]/10 p-2 rounded-lg">
                  <Lock className="h-5 w-5 text-[#016A6D]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">Password Policy</CardTitle>
                    <CardDescription>Enforce password strength requirements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-length">Minimum Password Length</Label>
                <Input id="min-length" type="number" defaultValue="8" className="border-slate-200" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">Require Special Characters</Label>
                <Switch defaultChecked className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">Require Numbers</Label>
                <Switch defaultChecked className="data-[state=checked]:bg-[#016A6D]" />
              </div>
              <Button className="bg-[#016A6D] hover:bg-[#015052] text-white w-full sm:w-auto">Update Security Policy</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings - Sunset Orange Theme */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#E16A3D] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#E16A3D]/10 p-2 rounded-lg">
                  <Bell className="h-5 w-5 text-[#E16A3D]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">System Alerts</CardTitle>
                    <CardDescription>Configure who receives critical system notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Verification Requests</Label>
                  <p className="text-sm text-slate-500">Notify admins when new orgs apply</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#E16A3D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Content Reports</Label>
                  <p className="text-sm text-slate-500">Notify moderators of flagged content</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#E16A3D]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">System Errors</Label>
                  <p className="text-sm text-slate-500">Critical server health alerts</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#E16A3D]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#FFA45D]/10 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-[#E16A3D]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">Email Templates</CardTitle>
                    <CardDescription>Manage automated email content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#E16A3D] hover:border-[#E16A3D]">Welcome Email</Button>
                  <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#E16A3D] hover:border-[#E16A3D]">Org Approval</Button>
                  <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#E16A3D] hover:border-[#E16A3D]">Password Reset</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations - Sea Green Theme */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-slate-200 border-t-4 border-t-[#1C9290] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#1C9290]/10 p-2 rounded-lg">
                  <Globe className="h-5 w-5 text-[#1C9290]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">Third-Party Services</CardTitle>
                    <CardDescription>Manage external API connections</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SendGrid */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded">
                        <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5">
                        <Label className="text-[#043E52] text-base">SendGrid</Label>
                        <p className="text-sm text-slate-500">Email delivery service</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#1C9290] bg-[#1C9290]/10 px-2 py-1 rounded">Connected</span>
                    <Button variant="outline" size="sm" className="text-slate-600">Configure</Button>
                </div>
              </div>
              <Separator />
              
              {/* Google Analytics */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded">
                        <Globe className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5">
                        <Label className="text-[#043E52] text-base">Google Analytics</Label>
                        <p className="text-sm text-slate-500">Traffic analysis</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="text-[#1C9290] border-[#1C9290] hover:bg-[#1C9290]/5">Connect</Button>
              </div>
              <Separator />

              {/* Stripe */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded">
                        <CreditCard className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5">
                        <Label className="text-[#043E52] text-base">Stripe</Label>
                        <p className="text-sm text-slate-500">Donation processing</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="text-[#1C9290] border-[#1C9290] hover:bg-[#1C9290]/5">Connect</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#043E52]/10 p-2 rounded-lg">
                  <Database className="h-5 w-5 text-[#043E52]" />
                </div>
                <div>
                    <CardTitle className="text-[#043E52]">Database & Backup</CardTitle>
                    <CardDescription>Manage data retention policies</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Automatic Backups</Label>
                  <p className="text-sm text-slate-500">Daily dump at 2:00 AM UTC</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-[#043E52]" />
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full text-[#043E52] border-slate-200 hover:bg-slate-50 gap-2">
                    <Server className="h-4 w-4" /> Run Manual Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}