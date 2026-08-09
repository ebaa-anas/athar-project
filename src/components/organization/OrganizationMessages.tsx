import { useState, useEffect, useRef } from 'react';
import { 
  collection, onSnapshot, query, where, addDoc, doc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Hash, Send, Users,ShieldCheck, MessageSquare, ShieldAlert, Radio, Sparkles, BrainCircuit, CheckCircle2, X, Lock, Search } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Badge } from '../ui/badge';

// 🔥 FIX: db now comes from the single shared Firebase connection instead of
// calling initializeApp() again in this file — the duplicate init throws
// "Firebase App named '[DEFAULT]' already exists" with no error boundary
// around it, which is almost certainly what caused the white screen.
import { db } from '../../lib/firebase';

// 🔥 FIX: key now comes from .env instead of being hardcoded in this file.
// Add this line to your .env file at the project root:
//   VITE_GEMINI_API_KEY=your_key_here
// Then restart your dev server (env files are only read on startup).
// The old key that was here (AIzaSyDiNP9rAwU2fyxz9E1VgkQGnnV_p8LMjgY) was
// exposed in the browser bundle and has since been shared in chat too —
// revoke it in Google AI Studio and generate a new one for this.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Helper for formatting time
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

export function OrganizationMessages() {
  const { user } = useUserProfile();
  
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [channelFilter, setChannelFilter] = useState<'all' | 'crisis' | 'group' | 'standard' | 'dm'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChannelRef = useRef<any | null>(null);
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- 1. FETCH ORG'S MISSIONS & BUILD CHANNELS ---
  useEffect(() => {
    if (!user) return;

    const qOpps = query(collection(db, "opportunities"), where("orgId", "==", user.uid));
    const qCrises = query(collection(db, "crises"), where("orgId", "==", user.uid));
    const qApps = query(collection(db, "applications"), where("orgId", "==", user.uid), where("status", "==", "accepted"));

    
    let unsubCrises = () => {};
    let unsubApps = () => {};

    const unsubOpps = onSnapshot(qOpps, (oppsSnap) => {
        unsubCrises();
        unsubCrises = onSnapshot(qCrises, (crisesSnap) => {
            unsubApps();
            unsubApps = onSnapshot(qApps, (appsSnap) => {
                
                const channelMap = new Map();

                oppsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    channelMap.set(doc.id, {
                        id: doc.id,
                        title: data.title || "Standard Mission",
                        type: 'standard',
                        volunteersResponded: data.volunteersResponded || 0,
                        lastActivity: data.lastActivityAt?.toMillis() || data.createdAt?.toMillis() || Date.now()
                    });
                });

                crisesSnap.docs.forEach(doc => {
                    const data = doc.data();
                    channelMap.set(doc.id, {
                        id: doc.id,
                        title: data.title || "Emergency Mission",
                        type: 'crisis',
                        volunteersResponded: data.volunteersResponded || 0,
                        lastActivity: data.lastActivityAt?.toMillis() || data.createdAt?.toMillis() || Date.now()
                    });
                });

                const uniqueVolunteerIds = new Set();
                appsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    const lastAct = data.appliedAt?.toMillis() || Date.now();
                    
                    if (data.volunteerId) {
                        uniqueVolunteerIds.add(data.volunteerId);
                        
                        const dmId = `dm_${user.uid}_${data.volunteerId}`;
                        if (!channelMap.has(dmId)) {
                            channelMap.set(dmId, {
                                id: dmId,
                                title: `DM: ${data.volunteerName || 'Volunteer'}`,
                                type: 'dm',
                                targetUserId: data.volunteerId,
                                volunteersResponded: 1,
                                lastActivity: lastAct
                            });
                        } else {
                            const ext = channelMap.get(dmId);
                            if (lastAct > ext.lastActivity) { ext.lastActivity = lastAct; channelMap.set(dmId, ext); }
                        }
                    }
                });

                if (uniqueVolunteerIds.size > 0) {
                    const groupId = `group_${user.uid}`;
                    channelMap.set(groupId, {
                        id: groupId,
                        title: "ALL VOLUNTEERS (GROUP)",
                        type: 'group',
                        volunteersResponded: uniqueVolunteerIds.size,
                        lastActivity: Date.now() 
                    });
                }

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

    return () => {
      unsubOpps();
      unsubCrises();
      unsubApps();
    };
  }, [user]);


  // --- 2. FETCH MESSAGES ---
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

  // --- 3. SEND MESSAGE AS ORG ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !user) return;

    const messageText = newMessage.trim();
    setNewMessage(""); 

    try {
      const orgName = user.name || "Command Center";
      const fallbackLogo = `https://api.dicebear.com/7.x/shapes/svg?seed=${orgName}&backgroundColor=043E52`;
      const finalAvatar = user.photoUrl || user.logoUrl || fallbackLogo;

      const messagePayload: any = {
        missionId: activeChannel.id,
        text: messageText,
        senderId: user.uid,
        senderName: orgName,
        senderRole: "organization", 
        avatar: finalAvatar,
        timestamp: serverTimestamp()
      };

      if (activeChannel.type === 'dm') {
          messagePayload.targetUserId = activeChannel.targetUserId;
      }

      await addDoc(collection(db, "messages"), messagePayload);

      if (activeChannel.type === 'crisis' || activeChannel.type === 'standard') {
        const collectionName = activeChannel.type === 'crisis' ? "crises" : "opportunities";
        await updateDoc(doc(db, collectionName, activeChannel.id), {
            lastActivityAt: serverTimestamp()
        });
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'Recently';
  };

  // --- 🤖 4. THE AI TRIAGE ENGINE 🤖 ---
  const runAITriage = async () => {
    if (messages.length === 0) return alert("Not enough data to analyze.");
    setIsAnalyzing(true);
    setAiReport(null);

    try {
      const chatLog = messages.map(m => {
        const time = formatTime(m.timestamp);
        return `[${time}] ${m.senderName} (${m.senderRole}): ${m.text}`;
      }).join('\n');

      const prompt = `
      You are an expert military and disaster response AI. Read the following live radio chatter from deployed volunteers in the field.
      Extract the critical intelligence and generate a concise, highly professional Situation Report (SitRep).
      
      Format the output EXACTLY using these four bulleted sections. Be extremely concise. Do not add introductory or concluding conversational text.
      
      ⚠️ CRITICAL HAZARDS: (List immediate dangers mentioned)
      🚑 CASUALTIES & MEDICAL: (List any injuries or medical needs)
      📦 RESOURCES NEEDED: (List equipment, tools, or supplies requested)
      ✅ RESOLVED ISSUES: (List problems that volunteers have fixed)

      Here is the field chatter to analyze:
      ${chatLog}
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      setAiReport(responseText);

    } catch (error) {
      console.error("AI Triage Failed:", error);
      alert("AI Triage failed. Ensure your Gemini API Key is correct.");
    }
    setIsAnalyzing(false);
  };

  // --- 5. SAVE AI REPORT TO OFFICIAL CRISIS DOC ---
  const saveReportToDatabase = async () => {
    if (!activeChannel || !aiReport) return;
    setIsSavingReport(true);
    try {
      const crisisRef = doc(db, "crises", activeChannel.id);
      await updateDoc(crisisRef, {
        description: aiReport, 
        lastAITriageAt: serverTimestamp()
      });
      alert("Official Crisis Situation Report updated successfully!");
      setAiReport(null); 
    } catch (error) {
      console.error("Failed to save report:", error);
      alert("Failed to save report.");
    }
    setIsSavingReport(false);
  };

  const displayedChannels = channels.filter(c => {
    const matchesFilter = channelFilter === 'all' || c.type === channelFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="p-8 text-center text-[#043E52] font-bold">Syncing Command Hub...</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 pb-6 relative animate-in fade-in duration-300">
      
      <Card className="w-full md:w-[320px] h-full border-slate-200 shadow-sm rounded-2xl flex flex-col bg-white shrink-0 relative z-10 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-[#043E52] text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#1C9290]" /> Comm Channels
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
          <button onClick={() => setChannelFilter('all')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'all' ? 'bg-[#043E52] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>All</button>
          <button onClick={() => setChannelFilter('crisis')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'crisis' ? 'bg-[#E16A3D] text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>Crises</button>
          <button onClick={() => setChannelFilter('group')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'group' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Teams</button>
          <button onClick={() => setChannelFilter('standard')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'standard' ? 'bg-[#1C9290] text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>Missions</button>
          <button onClick={() => setChannelFilter('dm')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${channelFilter === 'dm' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Direct</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {displayedChannels.length === 0 ? (
            <div className="text-center p-6 mt-10 text-slate-400 font-medium">No active operations found.</div>
          ) : (
            displayedChannels.map((channel) => {
              const isActive = activeChannel?.id === channel.id;
              const isCrisis = channel.type === 'crisis';
              const isGroup = channel.type === 'group';
              const isDM = channel.type === 'dm';
              const isStandard = channel.type === 'standard';

              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 relative group
                    ${isActive ? 'bg-slate-100 shadow-sm border border-slate-200' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  {isActive && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${isCrisis ? 'bg-[#E16A3D]' : isGroup ? 'bg-blue-600' : 'bg-[#1C9290]'}`}></div>}

                  <Avatar className={`h-11 w-11 shrink-0 rounded-xl border-2 ${isCrisis ? 'border-orange-100' : isGroup ? 'border-blue-100' : isDM ? 'border-slate-200' : 'border-teal-50'} ${isActive && isCrisis ? 'border-[#E16A3D]/30' : isActive && !isCrisis ? 'border-[#1C9290]/30' : ''}`}>
                    <AvatarFallback className={`rounded-xl text-xs font-black ${isCrisis ? 'bg-orange-50 text-[#E16A3D]' : isGroup ? 'bg-blue-50 text-blue-600' : isDM ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-[#1C9290]'}`}>
                      {isCrisis ? <ShieldAlert className="h-5 w-5" /> : isGroup ? <Users className="h-5 w-5" /> : isDM ? <Lock className="h-4 w-4" /> : <Hash className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-[#043E52]' : 'text-slate-700'}`}>
                        {channel.title}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0 pt-0.5">{timeAgo(channel.lastActivity)}</span>
                    </div>
                    
                    <p className="text-[10px] truncate mt-0.5 font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                       {isCrisis && <span className="text-[#E16A3D]">SOS • </span>}
                       {isGroup && <span className="text-blue-600">GROUP • </span>}
                       {isDM && <span className="text-slate-600">PRIVATE • </span>}
                       {isStandard && <span className="text-[#1C9290]">MISSION • </span>}
                       {channel.volunteersResponded} {isDM ? 'Participant' : 'Volunteers'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card className="flex-1 h-full border-slate-200 shadow-sm rounded-2xl flex flex-col bg-slate-50 relative z-10 overflow-hidden">
        {activeChannel ? (
          <>
            <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${activeChannel.type === 'crisis' ? 'bg-orange-50' : activeChannel.type === 'group' ? 'bg-blue-50' : activeChannel.type === 'dm' ? 'bg-slate-100' : 'bg-teal-50'}`}>
                  {activeChannel.type === 'crisis' ? <ShieldAlert className="h-6 w-6 text-[#E16A3D]" /> : activeChannel.type === 'group' ? <Users className="h-6 w-6 text-blue-600" /> : activeChannel.type === 'dm' ? <Lock className="h-6 w-6 text-slate-600" /> : <Hash className="h-6 w-6 text-[#14b8a6]" />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                    {activeChannel.title}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    {activeChannel.type === 'dm' ? <Lock className="h-3 w-3 text-slate-400" /> : <ShieldCheck className="h-3 w-3 text-[#1C9290]" />}
                    {activeChannel.type === 'dm' ? 'Private Encrypted Channel' : 'Command Center Overview'}
                  </div>
                </div>
              </div>
              
              {activeChannel.type === 'crisis' && (
                <Button 
                  onClick={runAITriage} 
                  disabled={isAnalyzing || messages.length === 0}
                  className="bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold shadow-md transition-all active:scale-95 border-none h-10 text-xs uppercase tracking-wider hidden md:flex"
                >
                  {isAnalyzing ? (
                    <><BrainCircuit className="mr-2 h-4 w-4 animate-spin" /> Scanning Intel...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Run AI Triage</>
                  )}
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="p-5 bg-white rounded-full shadow-sm border border-slate-100">
                    <MessageSquare className={`h-10 w-10 ${activeChannel.type === 'crisis' ? 'text-[#E16A3D]' : 'text-[#1C9290]'}`} />
                  </div>
                  <div className="text-center">
                      <p className="font-bold text-base text-[#043E52]">Secure comms established.</p>
                      <p className="text-sm mt-1 font-medium">Send a message to update the Command Center.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderRole === 'organization';
                  return (
                    <div key={msg.id || idx} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      <Avatar className={`h-9 w-9 shrink-0 shadow-sm border-2 ${isMe ? 'border-[#043E52]' : 'border-[#1C9290]'}`}>
                        <AvatarImage src={msg.avatar} className="object-cover" />
                        <AvatarFallback className={`text-xs font-bold ${isMe ? 'bg-[#043E52] text-white' : 'bg-[#1C9290] text-white'}`}>
                          {/* 🔥 FIX: added ?. and a fallback — this used to throw a
                              TypeError and blank the whole panel if any message
                              document was ever missing senderName. */}
                          {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className={`text-[12px] font-bold ${isMe ? 'text-[#043E52]' : 'text-slate-600'}`}>
                            {isMe ? 'Command (You)' : msg.senderName}
                          </span>
                          {!isMe && <Badge className="text-[8px] h-3.5 bg-teal-100 text-teal-800 border-none font-black tracking-widest">VOLUNTEER</Badge>}
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                        </div>
                        
                        <div className={`px-5 py-3 rounded-2xl text-[14px] shadow-sm leading-relaxed font-medium
                          ${isMe 
                            ? 'bg-[#043E52] text-white rounded-tr-none' 
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

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input 
                  value={newMessage}
                  onChange={(e: any) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeChannel.type === 'dm' ? 'securely' : 'the team'}...`}
                  className="flex-1 h-12 bg-slate-50 border-slate-200 focus:border-[#043E52] rounded-xl px-4 text-[15px] font-medium"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="h-12 w-14 shrink-0 rounded-xl bg-[#043E52] hover:bg-[#033040] text-white p-0 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-sm">
                  <Send className="h-5 w-5 ml-1" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Users className="h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-[#043E52]">Select an Operation</h3>
            <p className="text-sm mt-1 leading-relaxed font-medium">Choose a channel to coordinate with your deployed volunteers.</p>
          </div>
        )}
      </Card>

      {aiReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#016A6D]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
            
            <div className="bg-[#E16A3D] p-6 flex items-start justify-between relative shrink-0">
              <div>
                <Badge className="bg-white/20 text-white border-none mb-2 font-black tracking-widest text-[10px] shadow-none uppercase">AI INTEL</Badge>
                <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                  <BrainCircuit className="h-6 w-6 text-orange-100" /> Auto-Generated SitRep
                </h2>
                <p className="text-orange-50 text-sm mt-1 opacity-90 font-medium">Analysis of live field chatter.</p>
              </div>
              <button onClick={() => setAiReport(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <CardContent className="p-6 bg-slate-50 overflow-y-auto max-h-[60vh]">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                {aiReport}
              </div>
            </CardContent>

            <div className="p-5 bg-white border-t border-slate-200 flex gap-3 justify-end items-center shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-auto flex items-center gap-2">
                 <Sparkles className="h-4 w-4 text-amber-500" /> AI-generated report
              </span>
              <Button variant="ghost" onClick={() => setAiReport(null)} className="font-bold text-slate-500 text-xs uppercase tracking-wider">Discard</Button>
              <Button 
                onClick={saveReportToDatabase}
                disabled={isSavingReport}
                className="bg-[#043E52] hover:bg-[#033040] text-white font-bold shadow-sm text-xs uppercase tracking-wider h-10 px-5"
              >
                {isSavingReport ? "Saving..." : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save as Official SitRep</>}
              </Button>
            </div>

          </Card>
        </div>
      )}

    </div>
  );
}
