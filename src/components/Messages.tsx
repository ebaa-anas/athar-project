import { useState, useEffect, useRef } from 'react';
import { 
  collection, onSnapshot, query, where, addDoc, serverTimestamp 
} from "firebase/firestore";

import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Hash, Send, MessageSquare, ShieldCheck, Users, Search, ShieldAlert, Lock, Clock } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile'; 
import { Badge } from './ui/badge';

// db comes from the shared Firebase connection in lib/firebase rather than
// calling initializeApp() again here. A second initializeApp() call throws
// "Firebase App named '[DEFAULT]' already exists", an uncaught error with no
// boundary around it, which renders as a blank white screen.
import { db } from '../lib/firebase';

const timeAgo = (timestamp: number) => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return "Now";
};

export function Messages() {
  const { user } = useUserProfile();
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [channelFilter, setChannelFilter] = useState<'all' | 'crisis' | 'group' | 'mission' | 'dm'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Mirrors activeChannel so the channel-fetching effect below can read the
  // latest selection without listing it as a dependency, which would tear
  // down and re-subscribe all the Firestore listeners on every switch.
  const activeChannelRef = useRef<any | null>(null);
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Merges accepted applications, crisis responses, all crises, and incoming
  // DMs into a single channel list keyed by channel id.
  useEffect(() => {
    if (!user) return;

    const qApps = query(collection(db, "applications"), where("volunteerId", "==", user.uid), where("status", "==", "accepted"));
    const qCrisisResp = query(collection(db, "crisisResponses"), where("volunteerId", "==", user.uid), where("status", "==", "accepted"));
    const qAllCrises = query(collection(db, "crises"));
    const qDMs = query(collection(db, "messages"), where("targetUserId", "==", user.uid));

    // Each inner listener is explicitly torn down before its replacement is
    // created. Without this, a new listener was created every time the outer
    // one fired without ever unsubscribing the previous copy, so the number
    // of live Firestore listeners only grew for the life of the session.
    let unsubCrisisResp = () => {};
    let unsubAllCrises = () => {};
    let unsubDMs = () => {};

    const unsubApps = onSnapshot(qApps, (appsSnap) => {
      unsubCrisisResp();
      unsubCrisisResp = onSnapshot(qCrisisResp, (crisisRespSnap) => {
        unsubAllCrises();
        unsubAllCrises = onSnapshot(qAllCrises, (allCrisesSnap) => {
          unsubDMs();
          unsubDMs = onSnapshot(qDMs, (dmsSnap) => {

            const channelMap = new Map();
            
            const crisisTimes = new Map();
            crisisRespSnap.docs.forEach(d => {
              crisisTimes.set(d.data().crisisId, d.data().respondedAt?.toMillis() || Date.now());
            });

            // 1. Standard accepted applications
            appsSnap.docs.forEach(doc => {
                const data = doc.data();
                const lastAct = data.appliedAt?.toMillis() || Date.now();

                if (data.oppId && !channelMap.has(data.oppId)) {
                    channelMap.set(data.oppId, {
                        id: data.oppId,
                        title: data.oppTitle || 'Organization Mission',
                        orgName: data.orgName || 'Organization',
                        isCrisis: data.type === 'emergency' || (data.oppTitle && data.oppTitle.includes('CRISIS')),
                        isGroup: false,
                        isDM: false,
                        type: 'mission',
                        lastActivity: lastAct
                    });
                }

                // The Organization Group Channel & DM Channel
                if (data.orgId && data.orgName) {
                    const groupId = `group_${data.orgId}`;
                    if (!channelMap.has(groupId)) {
                        channelMap.set(groupId, {
                            id: groupId, title: `${data.orgName} Team`, orgName: data.orgName,
                            isCrisis: false, isGroup: true, isDM: false, type: 'group',
                            lastActivity: lastAct
                        });
                    } else {
                      const ext = channelMap.get(groupId);
                      if (lastAct > ext.lastActivity) { ext.lastActivity = lastAct; channelMap.set(groupId, ext); }
                    }

                    const dmId = `dm_${data.orgId}_${user.uid}`;
                    if (!channelMap.has(dmId)) {
                        channelMap.set(dmId, {
                            // orgId is stored on the channel so handleSendMessage has
                            // a valid target for targetUserId when replying.
                            id: dmId, title: `Private: ${data.orgName}`, orgName: data.orgName, orgId: data.orgId,
                            isCrisis: false, isGroup: false, isDM: true, type: 'dm',
                            lastActivity: lastAct
                        });
                    } else {
                      const ext = channelMap.get(dmId);
                      if (lastAct > ext.lastActivity) { ext.lastActivity = lastAct; channelMap.set(dmId, ext); }
                    }
                }
            });

            // 2. Parse crises
            allCrisesSnap.docs.forEach(doc => {
                if (crisisTimes.has(doc.id)) {
                    const crisisData = doc.data();
                    const lastAct = crisisTimes.get(doc.id);
                    if (!channelMap.has(doc.id)) {
                        channelMap.set(doc.id, {
                            id: doc.id, title: `${crisisData.title}`, orgName: crisisData.organization || 'Command Center',
                            isCrisis: true, isGroup: false, isDM: false, type: 'crisis',
                            lastActivity: lastAct
                        });
                    } else {
                        const existing = channelMap.get(doc.id);
                        existing.isCrisis = true;
                        existing.type = 'crisis';
                        if (lastAct > existing.lastActivity) existing.lastActivity = lastAct;
                        channelMap.set(doc.id, existing);
                    }
                }
            });

            // 3. Direct Message Channels from messages collection
            dmsSnap.docs.forEach(doc => {
                const dmData = doc.data();
                const lastAct = dmData.timestamp?.toMillis() || Date.now();
                if (dmData.missionId) {
                    if (!channelMap.has(dmData.missionId)) {
                        channelMap.set(dmData.missionId, {
                            // orgId is captured from the incoming message's senderId so a
                            // reply from this screen has a valid target.
                            id: dmData.missionId, title: dmData.channelTitle || 'Direct Message', orgName: dmData.senderName || 'Organization', orgId: dmData.senderId,
                            isCrisis: false, isGroup: false, isDM: true, type: 'dm',
                            lastActivity: lastAct 
                        });
                    } else {
                      const existing = channelMap.get(dmData.missionId);
                      if (lastAct > existing.lastActivity) { existing.lastActivity = lastAct; channelMap.set(dmData.missionId, existing); }
                    }
                }
            });

            const fetchedChannels = Array.from(channelMap.values());
            fetchedChannels.sort((a, b) => b.lastActivity - a.lastActivity);
            setChannels(fetchedChannels);

            if (fetchedChannels.length > 0 && !activeChannelRef.current) {
               setActiveChannel(fetchedChannels[0]);
            }
            setLoading(false);
          });
        });
      });
    });

    return () => {
      unsubApps();
      unsubCrisisResp();
      unsubAllCrises();
      unsubDMs();
    };
  }, [user]);

  useEffect(() => {
    if (!activeChannel) return;

    const qMsgs = query(collection(db, "messages"), where("missionId", "==", activeChannel.id));

    const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        let sortTime = Date.now(); 
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          sortTime = data.timestamp.toDate().getTime();
        }
        return { id: doc.id, ...data, sortTime };
      });
      
      msgs.sort((a, b) => a.sortTime - b.sortTime);
      setMessages(msgs);
    });

    return () => unsubMsgs();
  }, [activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !user) return;

    const messageText = newMessage.trim();
    setNewMessage(""); 

    const volName = user.name || user.firstName || "Volunteer";
    const fallbackLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${volName}`;

    const messagePayload: any = {
      missionId: activeChannel.id,
      text: messageText,
      senderId: user.uid,
      senderName: volName,
      senderRole: "volunteer",
      avatar: user.photoUrl || user.avatarUrl || fallbackLogo,
      timestamp: serverTimestamp()
    };

    if (activeChannel.isDM) {
        // Must target the org's uid (captured on the channel object above),
        // not the volunteer's own uid, or a DM "to the org" ends up addressed
        // back to the sender.
        if (activeChannel.orgId) {
          messagePayload.targetUserId = activeChannel.orgId;
        }
    }

    try {
      await addDoc(collection(db, "messages"), messagePayload);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'Recently';
  };

  const displayedChannels = channels.filter(c => {
    const matchesFilter = channelFilter === 'all' || c.type === channelFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.orgName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="p-8 text-center text-[#016A6D] font-bold animate-pulse">Syncing secure channels...</div>;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] pb-6 animate-in fade-in duration-300">
      
      <Card className="w-full h-full flex flex-col md:flex-row shadow-xl border-slate-200 rounded-2xl overflow-hidden bg-white">
        
        <div className="w-full md:w-[340px] bg-slate-50 flex flex-col border-r border-slate-200 shrink-0">
          
          <div className="p-5 border-b border-slate-200 bg-[#016A6D] text-white">
            <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
              <MessageSquare className="h-5 w-5 text-[#1C9290]" /> Operations Comms
            </h2>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-100" />
              <Input 
                placeholder="Search channels..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 bg-white/10 border-transparent text-white placeholder:text-teal-100/70 text-sm focus:border-[#1C9290] focus:ring-[#1C9290]/20 rounded-xl" 
              />
            </div>
          </div>

          <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-200 bg-white hide-scrollbar shrink-0 shadow-sm z-10">
            <button onClick={() => setChannelFilter('all')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'all' ? 'bg-[#016A6D] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>All</button>
            <button onClick={() => setChannelFilter('crisis')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'crisis' ? 'bg-[#E16A3D] text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>Crises</button>
            <button onClick={() => setChannelFilter('group')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'group' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Teams</button>
            <button onClick={() => setChannelFilter('mission')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'mission' ? 'bg-[#1C9290] text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>Missions</button>
            <button onClick={() => setChannelFilter('dm')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'dm' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Direct</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {displayedChannels.length === 0 ? (
              <div className="text-center p-6 mt-10">
                <Hash className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#016A6D]">No channels found</p>
                <p className="text-xs text-slate-500 mt-1">Accept an invite or deploy to a crisis to start chatting.</p>
              </div>
            ) : (
              displayedChannels.map((channel) => {
                const isActive = activeChannel?.id === channel.id;
                const isCrisis = channel.type === 'crisis';
                const isGroup = channel.type === 'group';
                const isDM = channel.type === 'dm';
                const isMission = channel.type === 'mission';
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 relative group
                      ${isActive 
                        ? 'bg-white border border-slate-200 shadow-sm' 
                        : 'hover:bg-slate-100 border border-transparent'}`}
                  >
                    {isActive && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${isCrisis ? 'bg-[#E16A3D]' : isGroup ? 'bg-blue-600' : 'bg-[#1C9290]'}`}></div>}

                    <Avatar className={`h-11 w-11 shrink-0 rounded-xl border-2 ${isCrisis ? 'border-orange-100' : isGroup ? 'border-blue-100' : isDM ? 'border-slate-200' : 'border-teal-50'} ${isActive && isCrisis ? 'border-[#E16A3D]/30' : isActive && !isCrisis ? 'border-[#1C9290]/30' : ''}`}>
                      <AvatarFallback className={`rounded-xl text-xs font-black ${isCrisis ? 'bg-orange-50 text-[#E16A3D]' : isGroup ? 'bg-blue-50 text-blue-600' : isDM ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-[#1C9290]'}`}>
                        {isCrisis ? <ShieldAlert className="h-5 w-5" /> : isGroup ? <Users className="h-5 w-5" /> : isDM ? <Lock className="h-4 w-4" /> : <Hash className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-[#016A6D]' : 'text-slate-700'}`}>
                          {channel.title}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0 pt-0.5">{timeAgo(channel.lastActivity)}</span>
                      </div>
                      
                      <p className="text-[10px] truncate mt-0.5 font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                         {isCrisis && <span className="text-[#E16A3D]">SOS • </span>}
                         {isGroup && <span className="text-blue-600">GROUP • </span>}
                         {isDM && <span className="text-slate-600">PRIVATE • </span>}
                         {isMission && <span className="text-[#1C9290]">MISSION • </span>}
                         {!isGroup && !isDM && channel.orgName}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white min-w-0">
          {activeChannel ? (
            <>
              <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${activeChannel.type === 'crisis' ? 'bg-orange-50' : activeChannel.type === 'group' ? 'bg-blue-50' : activeChannel.type === 'dm' ? 'bg-slate-100' : 'bg-teal-50'}`}>
                    {activeChannel.type === 'crisis' ? <ShieldAlert className="h-6 w-6 text-[#E16A3D]" /> : activeChannel.type === 'group' ? <Users className="h-6 w-6 text-blue-600" /> : activeChannel.type === 'dm' ? <Lock className="h-6 w-6 text-slate-600" /> : <Hash className="h-6 w-6 text-[#1C9290]" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#016A6D] tracking-tight leading-tight">
                      {activeChannel.title}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      {activeChannel.type === 'dm' ? <Lock className="h-3 w-3 text-slate-400" /> : <ShieldCheck className="h-3 w-3 text-[#1C9290]" />}
                      {activeChannel.type === 'dm' ? 'Private Encrypted Channel' : `Command: ${activeChannel.orgName}`}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-2 px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="p-5 bg-white rounded-full shadow-sm border border-slate-100">
                      <MessageSquare className={`h-10 w-10 ${activeChannel.type === 'crisis' ? 'text-[#E16A3D]' : 'text-[#1C9290]'}`} />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-base text-[#016A6D]">Secure comms established.</p>
                        <p className="text-sm mt-1 font-medium">Send a message to update the channel.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.uid;
                    const isOrg = msg.senderRole === 'organization';

                    return (
                      <div key={msg.id || idx} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                        <Avatar className={`h-9 w-9 shrink-0 shadow-sm border-2 ${isOrg ? 'border-[#016A6D]' : isMe ? 'border-[#1C9290]' : 'border-slate-200'}`}>
                          <AvatarImage src={msg.avatar} className="object-cover" />
                          <AvatarFallback className={`text-xs font-bold ${isOrg ? 'bg-[#016A6D] text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-baseline gap-2 mb-1 px-1">
                            <span className={`text-[12px] font-bold ${isOrg ? 'text-[#016A6D]' : 'text-slate-600'}`}>
                              {isMe ? 'You' : msg.senderName}
                            </span>
                            {isOrg && <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 bg-[#016A6D] text-white border-none font-black tracking-widest">COMMAND</Badge>}
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                          </div>
                          
                          <div className={`px-5 py-3 rounded-2xl text-[14px] shadow-sm leading-relaxed font-medium
                            ${isMe 
                              ? 'bg-[#1C9290] text-white rounded-tr-none' 
                              : isOrg 
                                ? 'bg-white border-2 border-[#016A6D]/10 text-[#016A6D] rounded-tl-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input 
                    value={newMessage}
                    onChange={(e: any) => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeChannel.type === 'crisis' ? 'Command Center' : activeChannel.type === 'dm' ? 'securely' : 'the team'}...`}
                    className="flex-1 h-12 bg-slate-50 border-slate-200 focus:border-[#1C9290] focus:ring-[#1C9290]/20 rounded-xl px-4 text-[15px] font-medium"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="h-12 w-14 shrink-0 rounded-xl bg-[#016A6D] hover:bg-[#125d56] text-white p-0 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5 ml-1" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <div className="bg-white p-8 rounded-full shadow-sm border border-slate-100 mb-5">
                <Users className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-[#016A6D]">Select an Operation</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2 leading-relaxed font-medium">Choose an active mission, group chat, or direct message from the sidebar to start chatting.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
