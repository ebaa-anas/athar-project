import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Bell, Calendar, Heart, Award, Users, CheckCircle, AlertCircle } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'event',
    title: 'Event Reminder: Community Food Drive',
    message: 'Your registered event starts tomorrow at 9:00 AM. Don\'t forget to bring your volunteer ID.',
    organization: 'Local Food Bank',
    time: '2 hours ago',
    read: false,
    icon: Calendar,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 2,
    type: 'task',
    title: 'Task Due Soon',
    message: 'Submit volunteer hours for Food Drive is due in 2 days.',
    organization: 'Local Food Bank',
    time: '3 hours ago',
    read: false,
    icon: AlertCircle,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    id: 3,
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You\'ve completed 100 volunteer hours! Keep up the amazing work.',
    organization: 'Athar Platform',
    time: '5 hours ago',
    read: false,
    icon: Award,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  },
  {
    id: 4,
    type: 'opportunity',
    title: 'New Opportunity Match',
    message: 'Youth Tutor position matches your skills and interests.',
    organization: 'Future Leaders Foundation',
    time: '1 day ago',
    read: true,
    icon: Heart,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600'
  },
  {
    id: 5,
    type: 'event',
    title: 'Event Registration Confirmed',
    message: 'You\'re registered for Environmental Cleanup Day on Oct 22.',
    organization: 'Green Earth Initiative',
    time: '1 day ago',
    read: true,
    icon: CheckCircle,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600'
  },
  {
    id: 6,
    type: 'organization',
    title: 'New Message from Organization',
    message: 'Tech for All has sent you a message about upcoming training.',
    organization: 'Tech for All',
    time: '2 days ago',
    read: true,
    icon: Users,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 7,
    type: 'event',
    title: 'Event Cancelled',
    message: 'Community Workshop on Oct 19 has been cancelled due to weather.',
    organization: 'Community Center',
    time: '2 days ago',
    read: true,
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600'
  },
  {
    id: 8,
    type: 'achievement',
    title: 'Course Completed',
    message: 'Congratulations! You\'ve completed Volunteer Leadership Training.',
    organization: 'Athar Platform',
    time: '3 days ago',
    read: true,
    icon: Award,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  }
];

export function Notifications() {
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your volunteer activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-teal-700 border-teal-300">
            {unreadCount} Unread
          </Badge>
          <Button variant="outline" size="sm">
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">All</p>
                <p className="text-gray-900 mt-2">{notifications.length}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Bell className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Events</p>
                <p className="text-gray-900 mt-2">{notifications.filter(n => n.type === 'event').length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Achievements</p>
                <p className="text-gray-900 mt-2">{notifications.filter(n => n.type === 'achievement').length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Opportunities</p>
                <p className="text-gray-900 mt-2">{notifications.filter(n => n.type === 'opportunity').length}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div 
                      key={notification.id} 
                      className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                        notification.read 
                          ? 'border-gray-200 bg-white' 
                          : 'border-teal-200 bg-teal-50'
                      }`}
                    >
                      <div className={`${notification.iconBg} p-3 rounded-lg h-fit`}>
                        <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-teal-600 rounded-full shrink-0 mt-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span>{notification.organization}</span>
                          <span>•</span>
                          <span>{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.filter(n => !n.read).map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div 
                      key={notification.id} 
                      className="flex gap-4 p-4 rounded-lg border border-teal-200 bg-teal-50"
                    >
                      <div className={`${notification.iconBg} p-3 rounded-lg h-fit`}>
                        <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-gray-900">{notification.title}</h3>
                          <div className="w-2 h-2 bg-teal-600 rounded-full shrink-0 mt-2"></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span>{notification.organization}</span>
                          <span>•</span>
                          <span>{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.filter(n => n.type === 'event').map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div 
                      key={notification.id} 
                      className={`flex gap-4 p-4 rounded-lg border ${
                        notification.read 
                          ? 'border-gray-200 bg-white' 
                          : 'border-teal-200 bg-teal-50'
                      }`}
                    >
                      <div className={`${notification.iconBg} p-3 rounded-lg h-fit`}>
                        <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span>{notification.organization}</span>
                          <span>•</span>
                          <span>{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.filter(n => n.type === 'achievement').map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div 
                      key={notification.id} 
                      className={`flex gap-4 p-4 rounded-lg border ${
                        notification.read 
                          ? 'border-gray-200 bg-white' 
                          : 'border-teal-200 bg-teal-50'
                      }`}
                    >
                      <div className={`${notification.iconBg} p-3 rounded-lg h-fit`}>
                        <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span>{notification.organization}</span>
                          <span>•</span>
                          <span>{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
