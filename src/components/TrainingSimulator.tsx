import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Award,
  Clock,
  Target,
  AlertCircle,
  Send,
  RotateCcw,
  CheckCircle,
  XCircle,
  Zap,
  Trophy,
  Activity
} from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: number;
  skillPath: string;
  description: string;
  icon: any;
  completed: boolean;
  score?: number;
}

const scenarios: Scenario[] = [
  {
    id: '1',
    title: 'Crisis Text Line - Distressed Caller',
    category: 'Psychological First Aid',
    difficulty: 'Medium',
    estimatedTime: 15,
    skillPath: 'Psychological First Aid',
    description: 'Practice responding to a person experiencing acute emotional distress',
    icon: MessageSquare,
    completed: true,
    score: 85
  },
  {
    id: '2',
    title: 'Emergency Coordination',
    category: 'Crisis Management',
    difficulty: 'Hard',
    estimatedTime: 20,
    skillPath: 'Emergency Response Fundamentals',
    description: 'Coordinate multiple volunteers during a simulated earthquake response',
    icon: AlertCircle,
    completed: false
  },
  {
    id: '3',
    title: 'Community Conflict Resolution',
    category: 'Communication',
    difficulty: 'Medium',
    estimatedTime: 12,
    skillPath: 'Crisis Communication',
    description: 'Mediate a conflict between community members at a relief center',
    icon: MessageSquare,
    completed: true,
    score: 92
  },
  {
    id: '4',
    title: 'Medical Triage Basics',
    category: 'Healthcare',
    difficulty: 'Easy',
    estimatedTime: 10,
    skillPath: 'Medical Assistance Basic',
    description: 'Assess and prioritize patients in a mass casualty scenario',
    icon: Activity,
    completed: false
  }
];

export function TrainingSimulator() {
  const [activeSimulation, setActiveSimulation] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user', text: string, feedback?: string }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [simulationPhase, setSimulationPhase] = useState<'intro' | 'active' | 'feedback' | 'complete'>('intro');
  const [score, setScore] = useState(0);

  const completedScenarios = scenarios.filter(s => s.completed);
  const averageScore = completedScenarios.length > 0 
    ? Math.round(completedScenarios.reduce((acc, s) => acc + (s.score || 0), 0) / completedScenarios.length)
    : 0;

  const startSimulation = (scenario: Scenario) => {
    setActiveSimulation(scenario);
    setSimulationPhase('active');
    setMessages([
      {
        sender: 'ai',
        text: scenario.category === 'Psychological First Aid' 
          ? "I'm really struggling right now... I don't know what to do anymore."
          : scenario.category === 'Crisis Management'
          ? "Emergency situation: We have reports of a 6.5 magnitude earthquake in the city center. Multiple buildings damaged. What's your first action?"
          : "Hello, I need help understanding what resources are available at this relief center."
      }
    ]);
    setCurrentInput('');
    setScore(0);
  };

  const sendMessage = () => {
    if (!currentInput.trim() || !activeSimulation) return;

    const userMessage = { sender: 'user' as const, text: currentInput };
    setMessages([...messages, userMessage]);

    // Simulate AI response with feedback
    setTimeout(() => {
      const feedback = analyzeResponse(currentInput);
      const aiResponse = generateAIResponse(currentInput, activeSimulation.category);
      
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: currentInput, feedback },
        { sender: 'ai', text: aiResponse }
      ]);
      
      // Update score based on feedback quality
      const points = feedback.includes('Excellent') ? 20 : feedback.includes('Good') ? 15 : 10;
      setScore(prev => Math.min(100, prev + points));
    }, 1000);

    setCurrentInput('');
  };

  const analyzeResponse = (response: string): string => {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('feel') || lowerResponse.includes('understand') || lowerResponse.includes('here for you')) {
      return '✅ Excellent empathy and active listening';
    } else if (lowerResponse.includes('help') || lowerResponse.includes('support')) {
      return '👍 Good supportive language';
    } else if (lowerResponse.length > 50) {
      return '💡 Good detail, consider being more empathetic';
    } else {
      return '💭 Try using more empathetic and supportive language';
    }
  };

  const generateAIResponse = (userInput: string, category: string): string => {
    if (category === 'Psychological First Aid') {
      return "Thank you for listening... It helps to know someone cares. Can you tell me what I should do next?";
    } else if (category === 'Crisis Management') {
      return "Understood. Emergency services are on standby. What's the next priority?";
    } else {
      return "I appreciate your help. Can you provide more details about the process?";
    }
  };

  const completeSimulation = () => {
    setSimulationPhase('complete');
  };

  const resetSimulation = () => {
    setActiveSimulation(null);
    setMessages([]);
    setSimulationPhase('intro');
    setScore(0);
  };

  if (activeSimulation) {
    return (
      <div className="space-y-6">
        {/* Simulation Header */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-purple-600 text-white p-3 rounded-full">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-gray-900 mb-1">Active Simulation: {activeSimulation.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge>{activeSimulation.category}</Badge>
                    <Badge variant="outline">{activeSimulation.difficulty}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Performance Score</p>
                <p className="text-purple-700">{score}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Simulation Chat</CardTitle>
                <CardDescription>Practice your response in this realistic scenario</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={completeSimulation}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete
                </Button>
                <Button variant="outline" size="sm" onClick={resetSimulation}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Exit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="space-y-4 mb-6 h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
              {messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        {message.sender === 'ai' ? (
                          <AvatarFallback className="bg-purple-100 text-purple-700">AI</AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-teal-100 text-teal-700">You</AvatarFallback>
                        )}
                      </Avatar>
                      <div className={`rounded-lg p-3 ${
                        message.sender === 'user' ? 'bg-teal-700 text-white' : 'bg-white border border-gray-200'
                      }`}>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  </div>
                  {message.feedback && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-50 border border-blue-200 rounded-lg p-2 mr-11">
                        <p className="text-xs text-blue-700">{message.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your response..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="min-h-[80px]"
              />
              <Button onClick={sendMessage} className="bg-teal-700 hover:bg-teal-800">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: The AI will provide real-time feedback on your responses to help you improve
            </p>
          </CardContent>
        </Card>

        {simulationPhase === 'complete' && (
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-green-600 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="h-8 w-8" />
                </div>
                <h3 className="text-gray-900 mb-2">Simulation Complete!</h3>
                <p className="text-gray-600 mb-4">
                  Final Score: <span className="text-green-700">{score}/100</span>
                </p>
                <div className="flex gap-2 justify-center">
                  <Button className="bg-teal-700 hover:bg-teal-800" onClick={resetSimulation}>
                    Return to Scenarios
                  </Button>
                  <Button variant="outline" onClick={() => setSimulationPhase('active')}>
                    Review Conversation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">AI Training Simulator</h1>
        <p className="text-gray-600">
          Practice high-stakes scenarios with AI. Powered by conversational AI to provide real-time feedback and skill development.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Brain className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Simulations</p>
                <p className="text-purple-700">{completedScenarios.length}/{scenarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-green-700">{averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Practiced</p>
                <p className="text-blue-700">2.5h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-orange-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Skill Level</p>
                <p className="text-orange-700">Intermediate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-purple-600 text-white p-3 rounded-full">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-gray-900 mb-2">🤖 AI-Powered Learning</h3>
              <p className="text-gray-600">
                Our training simulator uses conversational AI (inspired by Crisis Text Line) to create realistic, 
                high-stakes scenarios. Practice your skills, receive instant feedback, and improve your response capabilities 
                before real-world deployment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Scenarios ({scenarios.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({scenarios.filter(s => !s.completed).length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedScenarios.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onStart={startSimulation} />
          ))}
        </TabsContent>

        <TabsContent value="available" className="space-y-4 mt-6">
          {scenarios.filter(s => !s.completed).map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onStart={startSimulation} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedScenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onStart={startSimulation} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScenarioCard({ scenario, onStart }: { scenario: Scenario; onStart: (s: Scenario) => void }) {
  const Icon = scenario.icon;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-lg ${
              scenario.category === 'Psychological First Aid' ? 'bg-purple-100' :
              scenario.category === 'Crisis Management' ? 'bg-red-100' :
              scenario.category === 'Communication' ? 'bg-blue-100' :
              scenario.category === 'Healthcare' ? 'bg-green-100' :
              'bg-gray-100'
            }`}>
              <Icon className={`h-6 w-6 ${
                scenario.category === 'Psychological First Aid' ? 'text-purple-700' :
                scenario.category === 'Crisis Management' ? 'text-red-700' :
                scenario.category === 'Communication' ? 'text-blue-700' :
                scenario.category === 'Healthcare' ? 'text-green-700' :
                'text-gray-700'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle>{scenario.title}</CardTitle>
                {scenario.completed && (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <CardDescription className="mb-3">{scenario.description}</CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{scenario.category}</Badge>
                <Badge variant="outline" className={
                  scenario.difficulty === 'Easy' ? 'border-green-300 text-green-700' :
                  scenario.difficulty === 'Medium' ? 'border-yellow-300 text-yellow-700' :
                  'border-red-300 text-red-700'
                }>
                  {scenario.difficulty}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{scenario.estimatedTime} min
                </Badge>
                <Badge variant="outline">
                  <Target className="h-3 w-3 mr-1" />
                  {scenario.skillPath}
                </Badge>
              </div>
              {scenario.completed && scenario.score && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Your Score</span>
                    <span className="text-green-700">{scenario.score}%</span>
                  </div>
                  <Progress value={scenario.score} className="h-2" />
                </div>
              )}
            </div>
          </div>
          <div>
            <Button 
              className={scenario.completed ? 'bg-gray-700 hover:bg-gray-800' : 'bg-purple-700 hover:bg-purple-800'}
              onClick={() => onStart(scenario)}
            >
              <Brain className="mr-2 h-4 w-4" />
              {scenario.completed ? 'Practice Again' : 'Start Simulation'}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
