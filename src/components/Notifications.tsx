import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, where, doc, updateDoc, writeBatch
} from "firebase/firestore";
import { auth, db } from '../lib/firebase';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Bell, Calendar, Heart, Award, Users, CheckCircle, AlertCircle } from 'lucide-react';

// Helper function to format timestamps into "2 hours ago"
const timeAgo = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "Just now";
};

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  // --- Fetch real-time notifications ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, "notifications"), 
          where("userId", "==", user.uid)
        );

        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            
            let icon = Bell;
            let iconBg = 'bg-gray-100';
            let iconColor = 'text-gray-600';
            let mappedType = 'organization';

            if (data.type === 'success') {
              icon = CheckCircle;
              iconBg = 'bg-teal-100';
              iconColor = 'text-teal-600';
              mappedType = 'achievement'; 
            } else if (data.type === 'info') {
              icon = AlertCircle;
              iconBg = 'bg-blue-100';
              iconColor = 'text-blue-600';
              mappedType = 'event';
            }

            return {
              id: docSnap.id,
              title: data.title || 'Platform Update',
              message: data.message || '',
              organization: data.organizationName || 'Athar Platform',
              time: timeAgo(data.createdAt),
              read: data.read || false,
              type: mappedType,
              icon, 
              iconBg, 
              iconColor,
              rawTimestamp: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0
            };
          });

          notifs.sort((a, b) => b.rawTimestamp - a.rawTimestamp);
          setNotifications(notifs);
        });

        return () => unsubscribeData();
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // --- Read/unread handlers ---
  const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return; 
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      console.error("Error marking read", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifs = notifications.filter(n => !n.read);
      
      unreadNotifs.forEach(n => {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      });
      
      await batch.commit(); 
    } catch (e) {
      console.error("Error marking all read", e);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-gray-900 text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your volunteer activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-teal-700 border-teal-300">
            {unreadCount} Unread
          </Badge>
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" disabled={unreadCount === 0}>
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-gray-500 font-medium">All</p><p className="text-gray-900 mt-2 text-2xl font-bold">{notifications.length}</p></div><div className="bg-gray-100 p-3 rounded-lg"><Bell className="h-5 w-5 text-gray-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-gray-500 font-medium">Events</p><p className="text-gray-900 mt-2 text-2xl font-bold">{notifications.filter(n => n.type === 'event').length}</p></div><div className="bg-blue-100 p-3 rounded-lg"><Calendar className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-gray-500 font-medium">Achievements</p><p className="text-gray-900 mt-2 text-2xl font-bold">{notifications.filter(n => n.type === 'achievement').length}</p></div><div className="bg-amber-100 p-3 rounded-lg"><Award className="h-5 w-5 text-amber-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-gray-500 font-medium">Opportunities</p><p className="text-gray-900 mt-2 text-2xl font-bold">{notifications.filter(n => n.type === 'opportunity').length}</p></div><div className="bg-brand-cta/10 p-3 rounded-lg"><Heart className="h-5 w-5 text-brand-cta" /></div></div></CardContent></Card>
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
                {notifications.length === 0 && (
                  <p className="text-center text-gray-500 py-8">You have no notifications yet.</p>
                )}
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div 
                      key={notification.id} 
                      onClick={() => handleMarkAsRead(notification.id, notification.read)}
                      className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                        notification.read 
                          ? 'border-gray-200 bg-white' 
                          : 'border-teal-200 bg-teal-50 cursor-pointer hover:bg-teal-100/50'
                      }`}
                    >
                      <div className={`${notification.iconBg} p-3 rounded-lg h-fit`}>
                        <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>{notification.title}</h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-teal-600 rounded-full shrink-0 mt-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 font-medium">
                          <span className="text-role-accent-teal">{notification.organization}</span>
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
                {notifications.filter(n => !n.read).length === 0 && (
                   <p className="text-center text-gray-500 py-8">You're all caught up!</p>
                )}
                {notifications.filter(n => !n.read).map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div 
                      key={notification.id} 
                      onClick={() => handleMarkAsRead(notification.id, notification.read)}
                      className="flex gap-4 p-4 rounded-lg border border-teal-200 bg-teal-50 cursor-pointer hover:bg-teal-100/50"
                    >
                      <div className={`${notification.iconBg} p-3 rounded-lg h-fit`}>
                        <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-gray-900 font-bold">{notification.title}</h3>
                          <div className="w-2 h-2 bg-teal-600 rounded-full shrink-0 mt-2"></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 font-medium">
                          <span className="text-role-accent-teal">{notification.organization}</span>
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