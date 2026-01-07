import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  Bell, 
  Calendar, 
  Users, 
  Briefcase,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Clock,
  Check
} from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'application',
    title: 'New Application Received',
    message: 'Sarah Johnson applied for Food Distribution Assistant position.',
    time: '5 minutes ago',
    read: false,
    icon: Briefcase,
    color: 'text-[#043E52]', // Nile Blue
    bg: 'bg-[#043E52]/10',
    border: 'border-[#043E52]'
  },
  {
    id: 2,
    type: 'volunteer',
    title: 'Volunteer Check-in Reminder',
    message: 'Community Food Drive event starts in 2 hours. 7 volunteers registered.',
    time: '1 hour ago',
    read: false,
    icon: Calendar,
    color: 'text-[#1C9290]', // Sea Green
    bg: 'bg-[#1C9290]/10',
    border: 'border-[#1C9290]'
  },
  {
    id: 3,
    type: 'alert',
    title: 'Low Volunteer Registration',
    message: 'Monthly Food Distribution needs 8 more volunteers.',
    time: '3 hours ago',
    read: false,
    icon: AlertCircle,
    color: 'text-[#E16A3D]', // Sunset Orange
    bg: 'bg-[#E16A3D]/10',
    border: 'border-[#E16A3D]'
  },
  {
    id: 4,
    type: 'message',
    title: 'New Message from Volunteer',
    message: 'Michael Chen sent you a message about the upcoming orientation.',
    time: '5 hours ago',
    read: true,
    icon: MessageSquare,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200'
  },
  {
    id: 5,
    type: 'achievement',
    title: 'Milestone Reached!',
    message: 'Your organization reached 5,000 volunteer hours this year!',
    time: '1 day ago',
    read: true,
    icon: TrendingUp,
    color: 'text-[#1C9290]',
    bg: 'bg-[#1C9290]/10',
    border: 'border-[#1C9290]'
  },
  {
    id: 6,
    type: 'volunteer',
    title: 'Volunteer Completed Training',
    message: 'Emily Davis completed Food Safety Training certification.',
    time: '1 day ago',
    read: true,
    icon: CheckCircle,
    color: 'text-[#1C9290]',
    bg: 'bg-[#1C9290]/10',
    border: 'border-[#1C9290]'
  },
  {
    id: 7,
    type: 'application',
    title: 'Application Deadline Approaching',
    message: 'Volunteer Coordinator position applications close in 3 days.',
    time: '2 days ago',
    read: true,
    icon: Briefcase,
    color: 'text-[#043E52]',
    bg: 'bg-[#043E52]/10',
    border: 'border-[#043E52]'
  },
  {
    id: 8,
    type: 'volunteer',
    title: 'Event Reminder',
    message: 'Volunteer Orientation Session scheduled for tomorrow at 6 PM.',
    time: '2 days ago',
    read: true,
    icon: Calendar,
    color: 'text-[#043E52]',
    bg: 'bg-[#043E52]/10',
    border: 'border-[#043E52]'
  }
];

export function OrganizationNotifications() {
  const unreadCount = notifications.filter(n => !n.read).length;

  // Custom Stat Card Component for Consistency
  const StatCard = ({ title, value, icon: Icon, color, bg, border }: any) => (
    <Card className={`border-l-4 ${border} shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}>
      <div className={`absolute inset-0 opacity-30 bg-gradient-to-r ${bg} to-transparent`} />
      <CardContent className="p-5 relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-white shadow-sm border border-slate-100`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  // Custom Notification Item Component
  const NotificationItem = ({ notification }: { notification: typeof notifications[0] }) => {
    const Icon = notification.icon;
    return (
      <div className={`group relative flex gap-4 p-5 rounded-xl border transition-all duration-200 
        ${notification.read 
          ? 'bg-white border-slate-100 hover:border-slate-300' 
          : 'bg-[#043E52]/[0.02] border-[#043E52]/20 shadow-sm border-l-4 border-l-[#043E52]'
        }`}
      >
        {/* Icon */}
        <div className={`shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${notification.bg}`}>
          <Icon className={`h-6 w-6 ${notification.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`font-semibold text-base ${notification.read ? 'text-slate-700' : 'text-[#043E52]'}`}>
                {notification.title}
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {notification.message}
              </p>
            </div>
            
            {/* Time & Indicator */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {notification.time}
              </span>
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-[#E16A3D] shadow-sm ring-4 ring-white" />
              )}
            </div>
          </div>

          {/* Actions (Visible on Hover for desktop, always for mobile) */}
          <div className="mt-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            {!notification.read && (
              <Button size="sm" variant="outline" className="h-8 text-xs border-[#043E52]/20 text-[#043E52] hover:bg-[#043E52]/5">
                <Check className="h-3 w-3 mr-1" /> Mark as Read
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-500 hover:text-[#E16A3D]">
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#043E52]">Notifications</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#1C9290]" />
            Stay updated with your organization's activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-[#E16A3D]/10 text-[#E16A3D] px-3 py-1 text-sm">
            {unreadCount} Unread
          </Badge>
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#043E52] shadow-sm">
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* 2. High-Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="All Notifications" 
          value={notifications.length} 
          icon={Bell} 
          color="text-slate-600" 
          bg="from-slate-50" 
          border="border-slate-200" 
        />
        <StatCard 
          title="Applications" 
          value={notifications.filter(n => n.type === 'application').length} 
          icon={Briefcase} 
          color="text-[#043E52]" 
          bg="from-blue-50" 
          border="border-[#043E52]" 
        />
        <StatCard 
          title="Volunteers" 
          value={notifications.filter(n => n.type === 'volunteer').length} 
          icon={Users} 
          color="text-[#1C9290]" 
          bg="from-teal-50" 
          border="border-[#1C9290]" 
        />
        <StatCard 
          title="Alerts" 
          value={notifications.filter(n => n.type === 'alert').length} 
          icon={AlertCircle} 
          color="text-[#E16A3D]" 
          bg="from-orange-50" 
          border="border-[#E16A3D]" 
        />
      </div>

      {/* 3. Main Content Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full md:w-auto flex justify-start mb-6 overflow-x-auto">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-4">All</TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E16A3D] data-[state=active]:shadow-sm px-4">Unread</TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#043E52] data-[state=active]:shadow-sm px-4">Applications</TabsTrigger>
          <TabsTrigger value="volunteers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1C9290] data-[state=active]:shadow-sm px-4">Volunteers</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm px-4">Preferences</TabsTrigger>
        </TabsList>

        {/* List Sections */}
        {['all', 'unread', 'applications', 'volunteers'].map((tab) => (
          <TabsContent key={tab} value={tab} className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {notifications
                    .filter(n => {
                      if (tab === 'all') return true;
                      if (tab === 'unread') return !n.read;
                      return n.type === tab.slice(0, -1); // 'applications' -> 'application'
                    })
                    .map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))}
                    
                    {notifications.filter(n => {
                      if (tab === 'all') return true;
                      if (tab === 'unread') return !n.read;
                      return n.type === tab.slice(0, -1);
                    }).length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No notifications found in this category.</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Settings Tab */}
        <TabsContent value="settings" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-[#043E52]">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              
              {/* Group 1 */}
              <div>
                <h4 className="text-sm font-bold text-[#043E52] uppercase tracking-wide mb-4">Email Alerts</h4>
                <div className="space-y-4">
                  {[
                    { id: 'new-app', label: 'New Applications', desc: 'Get notified when volunteers apply' },
                    { id: 'event-rem', label: 'Event Reminders', desc: 'Alerts 24h before events start' },
                    { id: 'vol-msg', label: 'Volunteer Messages', desc: 'Direct messages from your team' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium text-slate-700 block">{item.label}</span>
                        <span className="text-xs text-slate-500 font-normal">{item.desc}</span>
                      </Label>
                      <Switch id={item.id} defaultChecked />
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 2 */}
              <div>
                <h4 className="text-sm font-bold text-[#E16A3D] uppercase tracking-wide mb-4">Urgent Alerts</h4>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 rounded-lg bg-[#E16A3D]/5 border border-[#E16A3D]/10">
                      <Label htmlFor="low-vol" className="flex-1 cursor-pointer">
                        <span className="text-sm font-bold text-[#E16A3D] block">Low Volunteer Registration</span>
                        <span className="text-xs text-slate-600 font-normal">Notify me when events are understaffed</span>
                      </Label>
                      <Switch id="low-vol" defaultChecked />
                    </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md w-full sm:w-auto">
                  Save Preferences
                </Button>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}