import { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where, addDoc, serverTimestamp 
} from "firebase/firestore";

// 🔥 FIXED: Adjusted import paths for a file in the components folder 🔥
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Hash, Send, MessageSquare, ShieldCheck, Users, Search, ShieldAlert, Lock } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile'; 
import { Badge } from './ui/badge';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDRSETgWx1F3RX3_KAzgceyYBJKfpheRQk",
  authDomain: "athar-project-aa74e.firebaseapp.com",
  projectId: "athar-project-aa74e",
  storageBucket: "athar-project-aa74e.firebasestorage.app",
  messagingSenderId: "715063889584",
  appId: "1:715063889584:web:3443ae48678c91a7f4b575",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export function Messages() {
  const { user } = useUserProfile();
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- 1. BULLETPROOF CHANNEL FETCHING ---
  useEffect(() => {
    if (!user) return;

    const qApps = query(collection(db, "applications"), where("volunteerId", "==", user.uid), where("status", "==", "accepted"));
    const qCrisisResp = query(collection(db, "crisisResponses"), where("volunteerId", "==", user.uid), where("status", "==", "accepted"));
    const qAllCrises = query(collection(db, "crises"));
    // Fetch Direct Messages sent to this user
    const qDMs = query(collection(db, "messages"), where("targetUserId", "==", user.uid));

    const unsubApps = onSnapshot(qApps, (appsSnap) => {
        const unsubCrisisResp = onSnapshot(qCrisisResp, (crisisRespSnap) => {
             const unsubAllCrises = onSnapshot(qAllCrises, (allCrisesSnap) => {
                 const unsubDMs = onSnapshot(qDMs, (dmsSnap) => {

                     const channelMap = new Map();

                     // 1. Add standard accepted applications
                     appsSnap.docs.forEach(doc => {
                         const data = doc.data();
                         if (data.oppId && !channelMap.has(data.oppId)) {
                             channelMap.set(data.oppId, {
                                 id: data.oppId,
                                 title: data.oppTitle || 'Organization Mission',
                                 orgName: data.orgName || 'Organization',
                                 isCrisis: data.type === 'emergency' || (data.oppTitle && data.oppTitle.includes('CRISIS')),
                                 isGroup: false,
                                 isDM: false
                             });
                         }

                         // The Organization Group Channel & DM Channel
                         if (data.orgId && data.orgName) {
                             const groupId = `group_${data.orgId}`;
                             if (!channelMap.has(groupId)) {
                                 channelMap.set(groupId, {
                                     id: groupId,
                                     title: `${data.orgName} Team`,
                                     orgName: data.orgName,
                                     isCrisis: false,
                                     isGroup: true,
                                     isDM: false
                                 });
                             }

                             const dmId = `dm_${data.orgId}_${user.uid}`;
                             if (!channelMap.has(dmId)) {
                                 channelMap.set(dmId, {
                                     id: dmId,
                                     title: `Private: ${data.orgName}`,
                                     orgName: data.orgName,
                                     isCrisis: false,
                                     isGroup: false,
                                     isDM: true
                                 });
                             }
                         }
                     });

                     // Parse crises
                     const acceptedCrisisIds = crisisRespSnap.docs.map(doc => doc.data().crisisId);

                     allCrisesSnap.docs.forEach(doc => {
                         if (acceptedCrisisIds.includes(doc.id)) {
                             const crisisData = doc.data();
                             if (!channelMap.has(doc.id)) {
                                 channelMap.set(doc.id, {
                                     id: doc.id,
                                     title: `${crisisData.title}`,
                                     orgName: crisisData.organization || 'Command Center',
                                     isCrisis: true,
                                     isGroup: false,
                                     isDM: false
                                 });
                             } else {
                                 const existing = channelMap.get(doc.id);
                                 existing.isCrisis = true;
                                 channelMap.set(doc.id, existing);
                             }
                         }
                     });

                     // Inject Direct Message Channels
                     dmsSnap.docs.forEach(doc => {
                         const dmData = doc.data();
                         if (dmData.missionId && !channelMap.has(dmData.missionId)) {
                             channelMap.set(dmData.missionId, {
                                 id: dmData.missionId,
                                 title: dmData.channelTitle || 'Direct Message',
                                 orgName: dmData.senderName || 'Organization',
                                 isCrisis: false,
                                 isGroup: false,
                                 isDM: true 
                             });
                         }
                     });

                     const fetchedChannels = Array.from(channelMap.values());
                     
                     // Sort channels: Crises first, then Org Groups, then DMs, then Standard Missions
                     fetchedChannels.sort((a, b) => {
                         if (a.isCrisis && !b.isCrisis) return -1;
                         if (!a.isCrisis && b.isCrisis) return 1;
                         if (a.isGroup && !b.isGroup) return -1;
                         if (!a.isGroup && b.isGroup) return 1;
                         if (a.isDM && !b.isDM) return -1;
                         if (!a.isDM && b.isDM) return 1;
                         return 0;
                     });

                     setChannels(fetchedChannels);

                     if (fetchedChannels.length > 0 && !activeChannel) {
                        setActiveChannel(fetchedChannels[0]);
                     }
                     setLoading(false);
                 });
                 return () => unsubDMs();
             });
             return () => unsubAllCrises();
        });
        return () => unsubCrisisResp();
    });

    return () => unsubApps();
  }, [user]);

  // --- 2. FETCH MESSAGES FOR ACTIVE CHANNEL ---
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

  // --- 3. SEND MESSAGE ---
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
        messagePayload.targetUserId = user.uid; 
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

  if (loading) return <div className="p-8 text-center text-[#043E52] font-bold animate-pulse">Syncing secure channels...</div>;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] pb-6">
      
      <Card className="w-full h-full flex flex-col md:flex-row shadow-xl border-slate-200 rounded-2xl overflow-hidden bg-white">
        
        {/* --- LEFT PANEL: CHANNELS LIST --- */}
        <div className="w-full md:w-[320px] bg-slate-50 flex flex-col border-r border-slate-200 shrink-0">
          
          <div className="p-5 border-b border-slate-200 bg-[#043E52] text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#1C9290]" /> My Operations
            </h2>
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search missions..." className="h-10 pl-9 bg-white/10 border-transparent text-white placeholder:text-teal-100/70 text-sm focus:border-[#1C9290] focus:ring-[#1C9290]/20 rounded-xl" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {channels.length === 0 ? (
              <div className="text-center p-6 mt-10">
                <Hash className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#043E52]">No active missions</p>
                <p className="text-xs text-slate-500 mt-1">Accept an invite or deploy to a crisis to start chatting.</p>
              </div>
            ) : (
              channels.map((channel) => {
                const isActive = activeChannel?.id === channel.id;
                const isCrisis = channel.isCrisis;
                const isGroup = channel.isGroup;
                const isDM = channel.isDM;
                
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
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-[#043E52]' : 'text-slate-700'}`}>
                        {channel.title}
                      </p>
                      <p className="text-[11px] truncate mt-0.5 font-medium text-slate-500 flex items-center gap-1">
                         {isCrisis && <Badge className="px-1 py-0 h-3.5 text-[8px] bg-red-100 text-red-700 border-none">SOS</Badge>}
                         {isGroup && <Badge className="px-1 py-0 h-3.5 text-[8px] bg-blue-100 text-blue-700 border-none">GROUP</Badge>}
                         {isDM && <Badge className="px-1 py-0 h-3.5 text-[8px] bg-slate-100 text-slate-600 border-none">PRIVATE</Badge>}
                         {!isGroup && !isDM && channel.orgName}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* --- RIGHT PANEL: CHAT AREA --- */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {activeChannel ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${activeChannel.isCrisis ? 'bg-orange-50' : activeChannel.isGroup ? 'bg-blue-50' : activeChannel.isDM ? 'bg-slate-100' : 'bg-teal-50'}`}>
                    {activeChannel.isCrisis ? <ShieldAlert className="h-6 w-6 text-[#E16A3D]" /> : activeChannel.isGroup ? <Users className="h-6 w-6 text-blue-600" /> : activeChannel.isDM ? <Lock className="h-6 w-6 text-slate-600" /> : <Hash className="h-6 w-6 text-[#1C9290]" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#043E52] tracking-tight leading-tight">
                      {activeChannel.title}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                      {activeChannel.isDM ? <Lock className="h-3.5 w-3.5 text-slate-400" /> : <ShieldCheck className="h-3.5 w-3.5 text-[#1C9290]" />}
                      {activeChannel.isDM ? 'Private Encrypted Channel' : `Command: ${activeChannel.orgName}`}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-2 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </Badge>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="p-5 bg-white rounded-full shadow-sm border border-slate-100">
                      <MessageSquare className={`h-10 w-10 ${activeChannel.isCrisis ? 'text-[#E16A3D]' : 'text-[#1C9290]'}`} />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-base text-[#043E52]">Secure comms established.</p>
                        <p className="text-sm mt-1">Send a message to update the Command Center.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.uid;
                    const isOrg = msg.senderRole === 'organization';

                    return (
                      <div key={msg.id || idx} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                        <Avatar className={`h-9 w-9 shrink-0 shadow-sm border-2 ${isOrg ? 'border-[#043E52]' : isMe ? 'border-[#1C9290]' : 'border-slate-200'}`}>
                          <AvatarImage src={msg.avatar} className="object-cover" />
                          <AvatarFallback className={`text-xs font-bold ${isOrg ? 'bg-[#043E52] text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-baseline gap-2 mb-1 px-1">
                            <span className={`text-[12px] font-bold ${isOrg ? 'text-[#043E52]' : 'text-slate-600'}`}>
                              {isMe ? 'You' : msg.senderName}
                            </span>
                            {isOrg && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-[#043E52] text-white border-none">COMMAND</Badge>}
                            <span className="text-[10px] text-slate-400 font-medium">{formatTime(msg.timestamp)}</span>
                          </div>
                          
                          <div className={`px-5 py-3 rounded-2xl text-[14px] shadow-sm leading-relaxed font-medium
                            ${isMe 
                              ? 'bg-[#1C9290] text-white rounded-tr-none' 
                              : isOrg 
                                ? 'bg-white border-2 border-[#043E52]/10 text-[#043E52] rounded-tl-none'
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

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input 
                    value={newMessage}
                    onChange={(e: any) => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeChannel.isCrisis ? 'Command Center' : activeChannel.isDM ? 'securely' : 'the team'}...`}
                    className="flex-1 h-12 bg-slate-50 border-slate-200 focus:border-[#1C9290] focus:ring-[#1C9290]/20 rounded-xl px-4 text-[15px] font-medium"
/>
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="h-12 w-14 shrink-0 rounded-xl bg-[#043E52] hover:bg-[#033040] text-white p-0 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
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
              <h3 className="text-xl font-bold text-[#043E52]">Select an Operation</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2 leading-relaxed">Choose an active mission, group chat, or direct message from the sidebar to start chatting.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}