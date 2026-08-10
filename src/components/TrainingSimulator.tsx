import { useState, useRef, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { 
  Brain, MessageSquare, AlertCircle, Send, RotateCcw, 
  CheckCircle, Zap, Trophy, Activity, Loader2, ShieldCheck, Clock, Target, AlertTriangle, Sparkles, XCircle, Users
} from 'lucide-react';

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

interface Scenario {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: number;
  skillPath: string;
  description: string;
  completed: boolean;
  score?: number;
  systemPrompt: string;
  initialMessage: string;
  isCustom?: boolean;
}

// --- BASE SCENARIO DATABASE ---
const INITIAL_SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: 'Crisis Text Line - Distressed Caller',
    category: 'Psychological First Aid',
    difficulty: 'Intermediate',
    estimatedTime: 15,
    skillPath: 'Psychological First Aid',
    description: 'Practice active listening and de-escalation with a person experiencing acute emotional distress.',
    completed: false,
    score: 0,
    systemPrompt: "You are a distressed individual reaching out to a crisis text line. You feel overwhelmed by a recent natural disaster that destroyed your neighborhood. You are scared and don't know what to do. Keep your responses under 2 sentences. React naturally to the volunteer's empathy. Do NOT break character.",
    initialMessage: "I don't know what to do anymore... everything is gone. I'm so scared."
  },
  {
    id: '2',
    title: 'Emergency Coordination Dispatch',
    category: 'Crisis Management',
    difficulty: 'Advanced',
    estimatedTime: 20,
    skillPath: 'Incident Command & Coordination',
    description: 'Coordinate volunteer deployment during a simulated earthquake response.',
    completed: false,
    score: 0,
    systemPrompt: "You are an automated field dispatch system reporting to a volunteer commander. An earthquake has struck sector 4. You must report changing conditions, blocked roads, and injured counts. Evaluate the commander's resource allocation decisions. Keep responses brief and tactical.",
    initialMessage: "COMMAND ALERT: 6.5 magnitude seismic event detected in Sector 4. High probability of infrastructure collapse. Awaiting your first deployment orders, Commander."
  },
  {
    id: '3',
    title: 'Community Conflict Resolution',
    category: 'Communication',
    difficulty: 'Intermediate',
    estimatedTime: 12,
    skillPath: 'Crisis Communication Network',
    description: 'Mediate a conflict between panicked community members at a relief center over supply distribution.',
    completed: false,
    score: 0,
    systemPrompt: "You are a frustrated civilian at a relief camp. You have been waiting in line for water for 3 hours, and someone just cut in front of you. You are angry and yelling at the volunteer. You need to be calmed down. Keep responses short and agitated initially.",
    initialMessage: "This is completely unacceptable! I've been standing in this heat for three hours and you're letting people cut the line?!"
  }
];

async function callGemini(
  model: string,
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  message: string
): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, history, message }),
  });

  if (!response.ok) {
    throw new Error("Gemini proxy request failed");
  }

  const data = await response.json();
  return data.text;
}

export function TrainingSimulator() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Chat States
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user', text: string, feedback?: string, points?: number }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [simulationPhase, setSimulationPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [score, setScore] = useState(0);
  
  // Loading States
  const [isTyping, setIsTyping] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<string | null>(null);
  
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. REAL-TIME DB SYNC ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const q = query(collection(db, "userSimulations"), where("userId", "==", user.uid));
        
        onSnapshot(q, (snapshot) => {
          const dbMap: Record<string, any> = {};
          const customScenarios: Scenario[] = [];
          
          snapshot.forEach(doc => {
            const data = doc.data();
            dbMap[data.scenarioId] = data;
            if (data.isCustom) customScenarios.push(data as Scenario);
          });
          
          const mergedBase = INITIAL_SCENARIOS.map(s => ({
            ...s,
            completed: dbMap[s.id]?.completed || false,
            score: dbMap[s.id]?.score || 0
          }));
          
          setScenarios([...customScenarios, ...mergedBase]);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setScenarios(INITIAL_SCENARIOS);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const completedScenarios = scenarios.filter(s => s.completed);
  
  // --- DYNAMIC CALCULATIONS ---
  const averageScore = completedScenarios.length > 0 
    ? Math.round(completedScenarios.reduce((acc, s) => acc + (s.score || 0), 0) / completedScenarios.length)
    : 0;

  const totalMinutesPracticed = completedScenarios.reduce((acc, s) => acc + (s.estimatedTime || 0), 0);
  const timePracticedStr = totalMinutesPracticed >= 60 
    ? `${(totalMinutesPracticed / 60).toFixed(1)}h` 
    : `${totalMinutesPracticed}m`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isConcluding]);

  // --- 2. GENERATE AND SAVE NEW SCENARIO (CRISIS STRICT) ---
  const generateNewScenario = async () => {
    if (!currentUser) return alert("Please log in to save custom scenarios.");
    setIsGeneratingScenario(true);
    
    try {
      const prompt = `
        You are an expert crisis management trainer for the official Athar Volunteer Reserve. Generate a completely new, unique, high-stakes roleplay scenario for a field volunteer or first responder. 
        
        CRITICAL RULE: The scenario MUST be a hands-on disaster response, humanitarian crisis, medical emergency, or psychological first aid situation. Do NOT generate corporate, PR, or business scenarios. The user is a field volunteer, not an executive.
        
        Return ONLY a valid JSON object matching this exact structure. Do NOT wrap it in markdown blockquotes or text.
        {
          "title": "A punchy title for the crisis scenario",
          "category": "Choose one: Crisis Management, Mental Health, Communication, Healthcare, or Leadership",
          "difficulty": "Choose one: Beginner, Intermediate, or Advanced",
          "estimatedTime": Random number between 10 and 25,
          "skillPath": "Name of a relevant field training module",
          "description": "A 2-sentence description of the disaster/crisis the volunteer will face on the ground.",
          "systemPrompt": "Detailed instructions for YOU, the AI, to act out this scenario. Define your persona (e.g., a trapped victim, a panicked civilian, an injured person), the immediate physical danger or emotional problem, and how you should react to the volunteer.",
          "initialMessage": "The very first panicked or urgent message you will say to start the simulation."
        }
      `;

      let rawJson = await callGemini("gemini-2.5-flash", [], prompt);
      rawJson = rawJson.replace(/```json/gi, '').replace(/```/gi, '').trim();
      
      const newScenarioData = JSON.parse(rawJson);
      const scenarioId = Math.random().toString(36).substr(2, 9);
      
      const newScenario = {
        ...newScenarioData,
        id: scenarioId,
        completed: false,
        score: 0,
        isCustom: true
      };

      await setDoc(doc(db, "userSimulations", `${currentUser.uid}_${scenarioId}`), {
        ...newScenario,
        userId: currentUser.uid,
        scenarioId: scenarioId
      });

    } catch (error) {
      console.error("Failed to generate scenario:", error);
      alert("Failed to generate a new scenario. Please try again.");
    }
    setIsGeneratingScenario(false);
  };

  const startSimulation = async (scenario: Scenario) => {
    setActiveSimulation(scenario);
    setSimulationPhase('active');
    setScore(50); 
    setFinalAnalysis(null);
    
    setChatHistory([
      {
        role: "user",
        parts: [{ text: scenario.systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to begin the simulation in character." }],
      },
    ]);
    setMessages([{ sender: 'ai', text: scenario.initialMessage }]);
    setCurrentInput('');
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || !activeSimulation) return;

    const userText = currentInput;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setCurrentInput('');
    setIsTyping(true);

    try {
      const evaluationPrompt = `
        Volunteer says: "${userText}"
        
        Respond strictly using this exact format:
        REPLY: [Your in-character response to the volunteer. Max 2 sentences.]
        FEEDBACK: [1 short sentence of constructive feedback on the volunteer's response quality, empathy, or tactical decision.]
        POINTS: [A number between -15 and +15 depending on how good their response was]
      `;

      const text = await callGemini("gemini-2.5-flash", chatHistory, evaluationPrompt);

      const replyMatch = text.match(/REPLY:\s*(.*)/i);
      const feedbackMatch = text.match(/FEEDBACK:\s*(.*)/i);
      const pointsMatch = text.match(/POINTS:\s*(-?\d+)/i); 

      const aiReply = replyMatch ? replyMatch[1].trim() : text;
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : "Good response, keep going.";
      const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 5;

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].feedback = feedback;
        newMessages[newMessages.length - 1].points = points;
        newMessages.push({ sender: 'ai', text: aiReply });
        return newMessages;
      });

      setScore(prev => Math.min(100, Math.max(0, prev + points)));

      setChatHistory(prev => [
        ...prev,
        { role: "user", parts: [{ text: evaluationPrompt }] },
        { role: "model", parts: [{ text }] },
      ]);

    } catch (error) {
      console.error("Gemini AI Error:", error);
      setMessages(prev => [
        ...prev, 
        { sender: 'ai', text: "System Error: The simulation connection was interrupted. Please try again." }
      ]);
    }

    setIsTyping(false);
  };

  // --- 3. CONCLUDE & SAVE RESULTS ---
  const concludeSimulation = async () => {
    if (!currentUser || !activeSimulation) return;
    setIsConcluding(true);

    const passed = score >= 90; // 90% REQUIREMENT

    try {
      const concludingPrompt = `
        SYSTEM OVERRIDE: END ROLEPLAY. Step out of character immediately and act as an expert crisis instructor.
        The simulation is now over. The volunteer achieved a final score of ${score}/100.
        Based on our conversation history, write ONE professional debrief paragraph (max 3-4 sentences).
        If the score is 90 or above, explicitly praise their flawless actions.
        If the score is below 90, explain what critical mistakes they made and state the correct protocol.
        DO NOT use the REPLY/FEEDBACK/POINTS format. Just write the plain paragraph.
      `;

      let rawText = await callGemini("gemini-2.5-flash", chatHistory, concludingPrompt);
      rawText = rawText.replace(/REPLY:/gi, '').replace(/FEEDBACK:/gi, '').replace(/POINTS:.*\d+/gi, '').trim();
      setFinalAnalysis(rawText);

    } catch (error) {
      console.error("Failed to generate conclusion:", error);
      if (passed) {
         setFinalAnalysis("Mastery Achieved. You demonstrated flawless understanding of crisis protocols. Excellent work!");
      } else {
         setFinalAnalysis("Simulation failed. You must achieve a 90% mastery score to complete this scenario. Please review your feedback and try again.");
      }
    }

    // Save Results to Firestore
    try {
      const docRef = doc(db, "userSimulations", `${currentUser.uid}_${activeSimulation.id}`);
      const highestScore = Math.max(score, activeSimulation.score || 0);
      
      await setDoc(docRef, {
        ...activeSimulation,
        userId: currentUser.uid,
        scenarioId: activeSimulation.id,
        completed: passed ? true : activeSimulation.completed,
        score: highestScore
      }, { merge: true });
    } catch (dbError) {
      console.error("Failed to save to database:", dbError);
    }

    setSimulationPhase('complete');
    setIsConcluding(false);
  };

  const resetSimulation = () => {
    setActiveSimulation(null);
    setMessages([]);
    setSimulationPhase('intro');
    setScore(0);
    setChatHistory([]);
    setFinalAnalysis(null);
  };

  if (loading) {
    return <div className="p-12 text-center text-[#016A6D] font-bold flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mb-4" /> Syncing User Training Data...</div>;
  }

  // --- ACTIVE SIMULATION VIEW ---
  if (activeSimulation && simulationPhase === 'active') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-12">
        <Card className="border-t-4 border-t-[#1C9290] shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#1C9290]/10 text-[#1C9290] p-3 rounded-xl">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Simulation</p>
                  <h3 className="text-[#016A6D] font-black text-xl leading-none mb-2">{activeSimulation.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-bold text-[9px] uppercase tracking-wider">{activeSimulation.category}</Badge>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-bold text-[9px] uppercase tracking-wider">{activeSimulation.difficulty}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[150px]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Performance Score</p>
                <div className="flex items-center gap-3">
                  <Progress value={score} className="h-2 flex-1 bg-slate-200 [&>div]:bg-[#1C9290]" />
                  <p className={`font-black ${score >= 90 ? 'text-emerald-600' : score >= 60 ? 'text-[#1C9290]' : 'text-red-500'}`}>
                    {score}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-md bg-white flex flex-col h-[600px]">
          <CardHeader className="border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#016A6D] text-lg">Communication Terminal</CardTitle>
                <CardDescription className="text-xs font-semibold">Goal: Maintain 90+ Score to Master Scenario</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetSimulation} disabled={isConcluding || isTyping} className="text-slate-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider h-9">
                  <RotateCcw className="mr-2 h-3.5 w-3.5" /> Abort
                </Button>
                <Button size="sm" onClick={concludeSimulation} disabled={isConcluding || isTyping} className="bg-[#1C9290] hover:bg-[#157a78] text-white font-bold text-xs uppercase tracking-wider h-9 shadow-sm">
                  {isConcluding ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-2 h-3.5 w-3.5" />}
                  {isConcluding ? 'Analyzing...' : 'Conclude'}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((message, index) => (
                <div key={index} className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-8 h-8 shadow-sm shrink-0">
                        {message.sender === 'ai' ? (
                          <AvatarFallback className="bg-[#016A6D] text-white text-[10px] font-bold">AI</AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-[#1C9290] text-white text-[10px] font-bold">YOU</AvatarFallback>
                        )}
                      </Avatar>
                      <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.sender === 'user' 
                          ? 'bg-[#016A6D] text-white rounded-br-none' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">{message.text}</p>
                      </div>
                    </div>
                  </div>
                  
                  {message.feedback && (
                    <div className="flex justify-end mt-1 animate-in fade-in duration-500">
                      <div className={`max-w-[70%] border rounded-xl px-3 py-2 mr-11 shadow-sm flex items-start gap-2 ${
                        (message.points ?? 0) >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'
                      }`}>
                        { (message.points ?? 0) >= 0 ? (
                          <Zap className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <p className={`text-xs font-semibold leading-relaxed ${
                          (message.points ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {message.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {(isTyping || isConcluding) && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 max-w-[80%]">
                    <Avatar className="w-8 h-8 shadow-sm">
                      <AvatarFallback className="bg-[#016A6D] text-white text-[10px] font-bold">AI</AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                       <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                         {isConcluding ? 'Generating Debrief...' : 'Analyzing...'}
                       </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your response here..."
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={simulationPhase !== 'active' || isTyping || isConcluding}
                  className="min-h-[60px] resize-none border-slate-200 focus:border-[#1C9290] shadow-sm rounded-xl text-sm"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!currentInput.trim() || isTyping || isConcluding}
                  className="bg-[#1C9290] hover:bg-[#157a78] text-white h-auto aspect-square rounded-xl shadow-sm"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-3 text-center uppercase tracking-widest">
                <Brain className="inline h-3 w-3 mr-1 -mt-0.5" /> 
                Gemini AI evaluates responses in real-time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- COMPLETE SCREEN ---
  if (simulationPhase === 'complete') {
    const passed = score >= 90; 

    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-in zoom-in-95 duration-500 pt-12">
        <Card className={`border-2 shadow-xl overflow-hidden ${passed ? 'border-[#1C9290]/20 bg-white' : 'border-red-200 bg-white'}`}>
          <div className={`h-2 ${passed ? 'bg-gradient-to-r from-[#016A6D] to-[#1C9290]' : 'bg-gradient-to-r from-red-500 to-orange-500'}`} />
          <CardContent className="p-10">
            <div className="text-center">
              <div className={`p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-inner border ${
                passed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
              }`}>
                {passed ? <Trophy className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
              </div>
              <h3 className="text-[#016A6D] font-black text-3xl mb-2">
                {passed ? "Simulation Mastered" : "Simulation Failed"}
              </h3>
              <p className="text-slate-500 font-medium mb-8">
                {passed 
                  ? "Outstanding performance. Your progress has been officially logged to your profile." 
                  : "You must score 90% or higher to master this scenario. Review the debrief and try again."}
              </p>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 inline-block min-w-[250px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Final Evaluation Score</p>
                <p className={`text-5xl font-black ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                  {score}<span className="text-2xl text-slate-300">/100</span>
                </p>
              </div>

              {finalAnalysis && (
                <div className={`text-left p-6 rounded-xl border mb-8 ${
                  passed ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100'
                }`}>
                  <h4 className={`text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${
                    passed ? 'text-[#1C9290]' : 'text-red-600'
                  }`}>
                    <Brain className="h-4 w-4" /> Instructor Debrief
                  </h4>
                  <p className={`text-sm font-medium leading-relaxed ${passed ? 'text-teal-900' : 'text-red-900'}`}>
                    {finalAnalysis}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="bg-[#016A6D] hover:bg-[#125d56] text-white font-bold h-12 px-8 uppercase tracking-wider text-xs shadow-md" onClick={resetSimulation}>
                  Return to Academy Hub
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[#016A6D] font-bold text-2xl tracking-tight">AI Training Simulator</h1>
          <Badge className="bg-[#1C9290]/10 text-[#1C9290] border-none shadow-sm uppercase tracking-wider text-[10px] font-bold px-2 py-0.5">Gemini Powered</Badge>
        </div>
        <p className="text-slate-500 text-sm">
          Practice high-stakes crisis scenarios with conversational AI. Receive real-time feedback to develop your operational readiness. Minimum 90% required to pass.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-[#016A6D]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Simulations</p>
                <p className="text-2xl font-bold text-[#016A6D]">{completedScenarios.length}<span className="text-base text-slate-300">/{scenarios.length}</span></p>
              </div>
              <div className="bg-[#016A6D]/10 p-2.5 rounded-lg"><Brain className="h-5 w-5 text-[#016A6D]" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Avg Score</p>
                <p className="text-2xl font-bold text-emerald-600">{averageScore}%</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg"><Trophy className="h-5 w-5 text-emerald-500" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-[#1C9290]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Time Practiced</p>
                <p className="text-2xl font-bold text-[#1C9290]">{timePracticedStr}</p>
              </div>
              <div className="bg-[#1C9290]/10 p-2.5 rounded-lg"><Clock className="h-5 w-5 text-[#1C9290]" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-[#E16A3D]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Skill Level</p>
                <p className="text-lg font-bold text-[#E16A3D] mt-1 uppercase leading-none">Advanced</p>
                <p className="text-xs text-slate-400 mt-1">Tier 3 Clear</p>
              </div>
              <div className="bg-[#E16A3D]/10 p-2.5 rounded-lg"><Activity className="h-5 w-5 text-[#E16A3D]" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-[#016A6D] text-white shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Brain className="w-64 h-64" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-4 rounded-2xl shadow-lg shrink-0">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-white text-2xl font-black mb-2 tracking-tight">Adaptive AI Engine Online</h3>
              <p className="text-teal-100 text-sm font-medium max-w-3xl leading-relaxed">
                The training simulator uses Google's advanced conversational AI to generate unique, unpredictable crisis scenarios. 
                Your decisions alter the outcome of the simulation in real-time. Do not break protocol.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <TabsList className="bg-slate-100 p-1 rounded-lg flex flex-wrap">
              <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm px-4 py-2 font-bold text-xs uppercase tracking-wider">All Scenarios ({scenarios.length})</TabsTrigger>
              <TabsTrigger value="available" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm px-4 py-2 font-bold text-xs uppercase tracking-wider">Available ({scenarios.filter(s => !s.completed).length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#016A6D] data-[state=active]:shadow-sm px-4 py-2 font-bold text-xs uppercase tracking-wider">Completed ({completedScenarios.length})</TabsTrigger>
            </TabsList>
            
            {/* 🔥 SUNSET ORANGE GENERATE BUTTON 🔥 */}
            <Button 
              onClick={generateNewScenario} 
              disabled={isGeneratingScenario}
              className="bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold text-xs uppercase tracking-wider h-10 shadow-md shrink-0 transition-colors"
            >
              {isGeneratingScenario ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isGeneratingScenario ? 'Generating...' : 'Generate AI Scenario'}
            </Button>
          </div>

          <TabsContent value="all" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 gap-4">
              {scenarios.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} onStart={startSimulation} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="available" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 gap-4">
              {scenarios.filter(s => !s.completed).map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} onStart={startSimulation} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 gap-4">
              {completedScenarios.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} onStart={startSimulation} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --- CHILD COMPONENT ---
function ScenarioCard({ scenario, onStart }: { scenario: Scenario; onStart: (s: Scenario) => void }) {
  const Icon = MessageSquare; 
  
  return (
    <Card className="border border-slate-200 bg-white hover:border-[#1C9290]/40 transition-colors shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch">
          
          <div className="p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 min-w-[100px] bg-slate-50">
            {scenario.completed ? (
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            ) : (
              <Brain className="h-8 w-8 text-[#016A6D]" />
            )}
          </div>

          <div className="flex-1 p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-lg text-[#016A6D]">{scenario.title}</h3>
                  {scenario.completed && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">
                      <CheckCircle className="h-3 w-3 mr-1" /> Mastered
                    </Badge>
                  )}
                  {scenario.isCustom && (
                    <Badge className="bg-[#E16A3D]/10 text-[#E16A3D] border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">
                      AI Generated
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-slate-500 max-w-2xl">{scenario.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 font-semibold text-[10px] uppercase tracking-wider">{scenario.category}</Badge>
                  <Badge variant="outline" className={`bg-white font-semibold text-[10px] uppercase tracking-wider ${
                    scenario.difficulty === 'Beginner' ? 'text-emerald-600 border-emerald-200' :
                    scenario.difficulty === 'Intermediate' ? 'text-amber-600 border-amber-200' :
                    'text-red-600 border-red-200'
                  }`}>
                    {scenario.difficulty}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-semibold text-[10px] uppercase tracking-wider">
                    <Clock className="h-3 w-3 mr-1" /> ~{scenario.estimatedTime} min
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                {scenario.score !== undefined && scenario.score > 0 ? (
                  <div className="w-full text-center space-y-3">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Highest Score</p>
                     <p className={`text-2xl font-black ${scenario.score >= 90 ? 'text-emerald-600' : scenario.score >= 60 ? 'text-[#1C9290]' : 'text-red-500'}`}>
                        {scenario.score}<span className="text-base text-slate-300">/100</span>
                     </p>
                     <Button variant="outline" onClick={() => onStart(scenario)} className="w-full border-slate-200 text-slate-600 font-bold text-xs h-9 hover:bg-slate-50 uppercase tracking-wider">
                       <RotateCcw className="mr-2 h-3.5 w-3.5" /> {scenario.completed ? 'Practice Again' : 'Retry'}
                     </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => onStart(scenario)}
                    className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white font-bold text-xs h-11 uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <Brain className="mr-2 h-4 w-4" /> Enter Simulation
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}