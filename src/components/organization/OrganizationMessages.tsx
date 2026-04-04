import { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, where, addDoc, doc, updateDoc, serverTimestamp, getDoc 
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Hash, Send, Users, ShieldAlert, Radio, Sparkles, BrainCircuit, CheckCircle2, X, Lock } from 'lucide-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Badge } from '../ui/badge';

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

// 🔥 INITIALIZE GEMINI AI 🔥
const genAI = new GoogleGenerativeAI("AIzaSyDiNP9rAwU2fyxz9E1VgkQGnnV_p8LMjgY"); 

export function OrganizationMessages() {
  const { user } = useUserProfile();
  
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- AI TRIAGE STATES ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- 1. FETCH ORG'S MISSIONS & BUILD CHANNELS (PARALLEL FETCH) ---
  useEffect(() => {
    if (!user) return;

    const qOpps = query(collection(db, "opportunities"), where("orgId", "==", user.uid));
    const qCrises = query(collection(db, "crises"), where("orgId", "==", user.uid));
    const qApps = query(collection(db, "applications"), where("orgId", "==", user.uid), where("status", "==", "accepted"));

    const unsubOpps = onSnapshot(qOpps, (oppsSnap) => {
        const unsubCrises = onSnapshot(qCrises, (crisesSnap) => {
            const unsubApps = onSnapshot(qApps, (appsSnap) => {
                
                const channelMap = new Map();

                // 1. Add all standard opportunities
                oppsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    channelMap.set(doc.id, {
                        id: doc.id,
                        title: data.title || "Standard Mission",
                        type: 'standard',
                        volunteersResponded: data.volunteersResponded || 0
                    });
                });

                // 2. Add all crises
                crisesSnap.docs.forEach(doc => {
                    const data = doc.data();
                    channelMap.set(doc.id, {
                        id: doc.id,
                        title: data.title || "Emergency Mission",
                        type: 'crisis',
                        volunteersResponded: data.volunteersResponded || 0
                    });
                });

                // 3. Create Group Channel and Direct Message Channels based on accepted applications
                const uniqueVolunteerIds = new Set();
                appsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.volunteerId) {
                        uniqueVolunteerIds.add(data.volunteerId);
                        
                        // Add DM channel for this volunteer
                        const dmId = `dm_${user.uid}_${data.volunteerId}`;
                        if (!channelMap.has(dmId)) {
                            channelMap.set(dmId, {
                                id: dmId,
                                title: `DM: ${data.volunteerName || 'Volunteer'}`,
                                type: 'dm',
                                targetUserId: data.volunteerId,
                                volunteersResponded: 1 // It's just one person
                            });
                        }
                    }
                });

                // Add the main Group Channel if they have any accepted volunteers
                if (uniqueVolunteerIds.size > 0) {
                    const groupId = `group_${user.uid}`;
                    channelMap.set(groupId, {
                        id: groupId,
                        title: "ALL VOLUNTEERS (GROUP)",
                        type: 'group',
                        volunteersResponded: uniqueVolunteerIds.size
                    });
                }

                // Convert map to array and sort
                const fetchedChannels = Array.from(channelMap.values());
                
                fetchedChannels.sort((a, b) => {
                    // Priority: Crises > Group > Standard > DMs
                    const priorityA = a.type === 'crisis' ? 1 : a.type === 'group' ? 2 : a.type === 'standard' ? 3 : 4;
                    const priorityB = b.type === 'crisis' ? 1 : b.type === 'group' ? 2 : b.type === 'standard' ? 3 : 4;
                    return priorityA - priorityB;
                });

                setChannels(fetchedChannels);

                if (fetchedChannels.length > 0 && !activeChannel) {
                    setActiveChannel(fetchedChannels[0]);
                }
                setLoading(false);
            });
            return () => unsubApps();
        });
        return () => unsubCrises();
    });

    return () => unsubOpps();
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

      // Only update standard/crisis docs if they exist
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


  if (loading) return <div className="p-8 text-center text-[#043E52] font-bold">Syncing Command Hub...</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 pb-6 relative">
      
      {/* LEFT PANEL: CHANNELS */}
      <Card className="w-full md:w-[320px] h-full border-slate-200 shadow-sm rounded-2xl flex flex-col bg-white shrink-0 relative z-10">
        <div className="p-5 border-b border-slate-100 bg-[#043E52] text-white rounded-t-2xl">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#1C9290]" /> Comm Channels
          </h2>
          <p className="text-xs text-teal-100 mt-1">Manage deployed teams</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.length === 0 ? (
            <div className="text-center p-6 mt-10 text-slate-400 font-medium">No active operations.</div>
          ) : (
            channels.map((channel) => {
              const isActive = activeChannel?.id === channel.id;
              const isCrisis = channel.type === 'crisis';
              const isGroup = channel.type === 'group';
              const isDM = channel.type === 'dm';

              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 relative
                    ${isActive ? 'bg-slate-100 shadow-sm' : 'hover:bg-slate-50'}`}
                >
                  {isActive && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${isCrisis ? 'bg-[#E16A3D]' : isGroup ? 'bg-blue-600' : 'bg-[#1C9290]'}`}></div>}

                  <Avatar className={`h-10 w-10 shrink-0 rounded-lg border ${isCrisis ? 'border-[#E16A3D]/30' : isGroup ? 'border-blue-100' : isDM ? 'border-slate-200' : 'border-[#1C9290]/30'}`}>
                    <AvatarFallback className={`rounded-lg text-xs font-bold ${isCrisis ? 'bg-orange-50 text-[#E16A3D]' : isGroup ? 'bg-blue-50 text-blue-600' : isDM ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-[#1C9290]'}`}>
                      {isCrisis ? <ShieldAlert className="h-5 w-5" /> : isGroup ? <Users className="h-5 w-5" /> : isDM ? <Lock className="h-4 w-4" /> : <Hash className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="overflow-hidden flex-1">
                    <p className={`text-sm font-bold truncate ${isCrisis ? 'text-[#E16A3D]' : 'text-[#043E52]'}`}>
                      {channel.title}
                    </p>
                    <p className="text-[11px] truncate mt-0.5 font-medium text-slate-500">
                      {channel.volunteersResponded} {isDM ? 'Participant' : 'Volunteers'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* RIGHT PANEL: CHAT */}
      <Card className="flex-1 h-full border-slate-200 shadow-sm rounded-2xl flex flex-col bg-slate-50 relative z-10">
        {activeChannel ? (
          <>
            <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activeChannel.type === 'crisis' ? 'bg-orange-50' : activeChannel.type === 'group' ? 'bg-blue-50' : activeChannel.type === 'dm' ? 'bg-slate-100' : 'bg-teal-50'}`}>
                    {activeChannel.type === 'crisis' ? <ShieldAlert className="h-5 w-5 text-[#E16A3D]" /> : activeChannel.type === 'group' ? <Users className="h-5 w-5 text-blue-600" /> : activeChannel.type === 'dm' ? <Lock className="h-5 w-5 text-slate-600" /> : <Hash className="h-5 w-5 text-[#14b8a6]" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {activeChannel.title}
                    </h2>
                  </div>
              </div>
              
              {/* 🔥 THE ORANGE AI TRIAGE BUTTON 🔥 */}
              {activeChannel.type === 'crisis' && (
                <Button 
                  onClick={runAITriage} 
                  disabled={isAnalyzing || messages.length === 0}
                  className="bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold shadow-md transition-all active:scale-95 border-none h-10"
                >
                  {isAnalyzing ? (
                    <><BrainCircuit className="mr-2 h-4 w-4 animate-spin" /> Scanning Intel...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Run AI Triage</>
                  )}
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderRole === 'organization';
                return (
                  <div key={msg.id || idx} className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 shrink-0 shadow-sm border border-slate-200">
                      <AvatarImage src={msg.avatar} />
                      <AvatarFallback className={isMe ? 'bg-[#043E52] text-white' : 'bg-[#1C9290] text-white'}>
                        {msg.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className={`text-[11px] font-bold ${isMe ? 'text-[#043E52]' : 'text-slate-600'}`}>
                          {isMe ? 'Command (You)' : msg.senderName}
                        </span>
                        {!isMe && <Badge className="text-[8px] h-3.5 bg-teal-100 text-teal-800 border-none">VOLUNTEER</Badge>}
                        <span className="text-[9px] text-slate-400">{formatTime(msg.timestamp)}</span>
                      </div>
                      
                      <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-[#043E52] text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 rounded-b-2xl">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e: any) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeChannel.type === 'dm' ? 'securely' : 'the team'}...`}
                  className="flex-1 h-11 bg-slate-50 border-slate-200 focus:border-[#043E52]"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="h-11 w-11 bg-[#043E52] hover:bg-[#033040] text-white">
                  <Send className="h-4 w-4 ml-0.5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Users className="h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">Select a Operation</h3>
            <p className="text-sm mt-1">Choose a channel to coordinate with your deployed volunteers.</p>
          </div>
        )}
      </Card>

      {/* --- THE ORANGE AI TRIAGE MODAL --- */}
      {aiReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            <div className="bg-[#E16A3D] p-6 flex items-start justify-between relative">
              <div>
                <Badge className="bg-white/20 text-white border-none mb-2 font-bold tracking-widest text-[10px] shadow-none">GEMINI AI INTEL</Badge>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <BrainCircuit className="h-6 w-6 text-orange-100" /> Auto-Generated SitRep
                </h2>
                <p className="text-orange-50 text-sm mt-1 opacity-90">Analysis of live field chatter.</p>
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

            <div className="p-5 bg-white border-t border-slate-200 flex gap-3 justify-end items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-auto flex items-center gap-2">
                 <Sparkles className="h-4 w-4" /> Powered by Google Gemini
              </span>
              <Button variant="ghost" onClick={() => setAiReport(null)} className="font-bold text-slate-500">Discard</Button>
              <Button 
                onClick={saveReportToDatabase}
                disabled={isSavingReport}
                className="bg-[#043E52] hover:bg-[#033040] text-white font-bold shadow-md"
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