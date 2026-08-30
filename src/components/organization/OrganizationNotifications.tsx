import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, orderBy
} from "firebase/firestore";
import { auth, db } from '../../lib/firebase';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  Bell, Calendar, Users, Briefcase, AlertCircle, 
  CheckCircle, MessageSquare, TrendingUp, Clock, Check, Trash2, Info
} from 'lucide-react';

// Helper to turn dates into "5 mins ago" format
function timeAgo(dateInput: any) {
  if (!dateInput) return 'Recently';
  const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

// Helper to map DB 'type' to UI Colors & Icons
function getNotificationStyling(type: string) {
  switch (type?.toLowerCase()) {
    case 'application': return { icon: Briefcase, color: 'text-role-org', bg: 'bg-role-org/10', border: 'border-role-org' };
    case 'volunteer': return { icon: Users, color: 'text-role-accent-teal', bg: 'bg-role-accent-teal/10', border: 'border-role-accent-teal' };
    case 'alert': return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500' };
    case 'success': return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500' };
    case 'info': return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-500' };
    default: return { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' };
  }
}

export function OrganizationNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Organizations are queried by 'orgId'; volunteers query the same collection by 'userId'
        const q = query(collection(db, "notifications"), where("orgId", "==", user.uid));
        
        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const fetchedNotifs = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            const styling = getNotificationStyling(data.type);
            return {
              id: docSnap.id,
              title: data.title || 'New Notification',
              message: data.message || '',
              type: data.type || 'info',
              time: timeAgo(data.createdAt),
              rawDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              read: data.read || false,
              ...styling
            };
          });
          
          // Sort newest first
          fetchedNotifs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
          setNotifications(fetchedNotifs);
        });

        return () => unsubscribeData();
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const markAsRead = async (id: string) => {
    try { await updateDoc(doc(db, "notifications", id), { read: true }); } 
    catch (error) { console.error("Error updating notification:", error); }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    unread.forEach(async (n) => {
      try { await updateDoc(doc(db, "notifications", n.id), { read: true }); } 
      catch (e) { console.error(e); }
    });
  };

  const deleteNotification = async (id: string) => {
    try { await deleteDoc(doc(db, "notifications", id)); } 
    catch (error) { console.error("Error deleting notification:", error); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Custom Stat Card Component
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
          : 'bg-role-org/[0.02] border-role-org/20 shadow-sm border-l-4 border-l-role-org'
        }`}
      >
        <div className={`shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${notification.bg}`}>
          <Icon className={`h-6 w-6 ${notification.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`font-semibold text-base ${notification.read ? 'text-slate-700' : 'text-role-org'}`}>
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
                <span className="h-2 w-2 rounded-full bg-brand-cta shadow-sm ring-4 ring-white" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            {!notification.read && (
              <Button onClick={() => markAsRead(notification.id)} size="sm" variant="outline" className="h-8 text-xs border-role-org/20 text-role-org hover:bg-role-org/5">
                <Check className="h-3 w-3 mr-1" /> Mark as Read
              </Button>
            )}
            <Button onClick={() => deleteNotification(notification.id)} size="sm" variant="ghost" className="h-8 text-xs text-slate-500 hover:text-brand-cta">
              <Trash2 className="h-3 w-3 mr-1"/> Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-role-accent-teal" />
            Stay updated with your organization's activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-brand-cta/10 text-brand-cta px-3 py-1 text-sm font-bold">
              {unreadCount} Unread
            </Badge>
          )}
          <Button onClick={markAllAsRead} disabled={unreadCount === 0} variant="outline" className="border-slate-200 text-slate-600 hover:text-role-org shadow-sm font-bold">
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Stats */}
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
          color="text-role-org" 
          bg="from-blue-50" 
          border="border-role-org" 
        />
        <StatCard 
          title="Volunteers" 
          value={notifications.filter(n => n.type === 'volunteer').length} 
          icon={Users} 
          color="text-role-accent-teal" 
          bg="from-teal-50" 
          border="border-role-accent-teal" 
        />
        <StatCard
          title="Alerts"
          value={notifications.filter(n => n.type === 'alert').length}
          icon={AlertCircle}
          color="text-red-600"
          bg="from-red-50"
          border="border-red-500"
        />
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full md:w-auto flex justify-start mb-6 overflow-x-auto">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-role-org data-[state=active]:shadow-sm px-4 font-bold">All</TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-cta data-[state=active]:shadow-sm px-4 font-bold">Unread</TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-role-org data-[state=active]:shadow-sm px-4 font-bold">Applications</TabsTrigger>
          <TabsTrigger value="volunteers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-role-accent-teal data-[state=active]:shadow-sm px-4 font-bold">Volunteers</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm px-4 font-bold">Preferences</TabsTrigger>
        </TabsList>

        {/* List sections */}
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
                      <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                           <Bell className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No notifications found in this category.</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Settings tab */}
        <TabsContent value="settings" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-slate-900">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Email Alerts</h4>
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

              <div>
                <h4 className="text-sm font-bold text-brand-cta uppercase tracking-wide mb-4">Urgent Alerts</h4>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 rounded-lg bg-brand-cta/5 border border-brand-cta/10">
                      <Label htmlFor="low-vol" className="flex-1 cursor-pointer">
                        <span className="text-sm font-bold text-brand-cta block">Low Volunteer Registration</span>
                        <span className="text-xs text-slate-600 font-normal">Notify me when events are understaffed</span>
                      </Label>
                      <Switch id="low-vol" defaultChecked />
                    </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button className="bg-role-org hover:bg-role-org-dark text-white shadow-md w-full sm:w-auto font-bold h-11 px-8">
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