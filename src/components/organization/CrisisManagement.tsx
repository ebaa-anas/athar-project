import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { 
  AlertTriangle, 
  MapPin,
  Users,
  Clock,
  Send,
  XCircle,
  Activity,
  Zap,
  Plus,
  ShieldAlert,
  Megaphone
} from 'lucide-react';

// --- TYPES ---
interface CrisisEvent {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium';
  location: string;
  skillsNeeded: string[];
  volunteersNeeded: number;
  volunteersActivated: number;
  volunteersResponded: number;
  status: 'Active' | 'Completed';
  createdAt: string;
}

// --- MOCK DATA ---
const mockCrisisEvents: CrisisEvent[] = [
  {
    id: '1',
    title: 'Earthquake Response - Kadıköy',
    description: 'Structural damage reported. Immediate medical and search & rescue teams required for sector 4.',
    severity: 'Critical',
    location: 'Kadıköy, Istanbul',
    skillsNeeded: ['Medical Aid', 'Search & Rescue'],
    volunteersNeeded: 15,
    volunteersActivated: 12,
    volunteersResponded: 8,
    status: 'Active',
    createdAt: 'Today, 14:30'
  },
  {
    id: '2',
    title: 'Flash Flood Evacuation',
    description: 'Logistics support needed for setting up temporary shelter and distributing supplies.',
    severity: 'High',
    location: 'Beşiktaş, Istanbul',
    skillsNeeded: ['Logistics', 'Crowd Control'],
    volunteersNeeded: 10,
    volunteersActivated: 10,
    volunteersResponded: 6,
    status: 'Active',
    createdAt: 'Today, 10:15'
  }
];

export function CrisisManagement() {
  const [crisisEvents, setCrisisEvents] = useState<CrisisEvent[]>(mockCrisisEvents);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCrisis, setNewCrisis] = useState({
    title: '',
    description: '',
    severity: 'Critical' as 'Critical' | 'High' | 'Medium',
    location: '',
    volunteersNeeded: 10
  });

  const activeEvents = crisisEvents.filter(e => e.status === 'Active');
  
  // Calculated Stats
  const totalActivated = activeEvents.reduce((acc, e) => acc + e.volunteersActivated, 0);
  const totalResponded = activeEvents.reduce((acc, e) => acc + e.volunteersResponded, 0);

  const handleActivate = () => {
    const newEvent: CrisisEvent = {
        id: Date.now().toString(),
        ...newCrisis,
        skillsNeeded: ['General Support'], 
        volunteersActivated: 0,
        volunteersResponded: 0,
        status: 'Active',
        createdAt: 'Just now'
    };
    setCrisisEvents([newEvent, ...crisisEvents]);
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#043E52] flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[#E16A3D]" /> 
            Crisis Response Center
          </h1>
          <p className="text-slate-500 mt-1">Monitor active emergencies and manage volunteer deployment.</p>
        </div>
        <Button 
          className="bg-[#E16A3D] hover:bg-[#c2562d] text-white shadow-md font-semibold transition-transform active:scale-95"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Declare Emergency
        </Button>
      </div>

      {/* 2. Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
            label="Active Incidents" 
            value={activeEvents.length} 
            icon={Activity} 
            color="text-[#E16A3D]" 
            bg="bg-orange-50"
            border="border-[#E16A3D]" 
        />
        <MetricCard 
            label="Mobilized Volunteers" 
            value={totalActivated} 
            icon={Users} 
            color="text-[#043E52]" 
            bg="bg-slate-50" 
            border="border-[#043E52]"
        />
        <MetricCard 
            label="On-Site Responders" 
            value={totalResponded} 
            icon={MapPin} 
            color="text-[#1C9290]" 
            bg="bg-teal-50" 
            border="border-[#1C9290]"
        />
        <MetricCard 
            label="Avg Response Time" 
            value="12m" 
            icon={Zap} 
            color="text-blue-600" 
            bg="bg-blue-50" 
            border="border-blue-500"
        />
      </div>

      {/* 3. Active Crisis List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#043E52]">Live Operations Feed</h2>
            <Badge variant="outline" className="text-[#1C9290] border-[#1C9290] bg-teal-50">
                Auto-Refreshing
            </Badge>
        </div>
        
        {activeEvents.map((event) => (
            <Card key={event.id} className={`border-l-4 shadow-sm hover:shadow-md transition-all ${
                event.severity === 'Critical' ? 'border-l-[#E16A3D]' : 'border-l-orange-400'
            }`}>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* Left: Incident Details */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-[#043E52]">{event.title}</h3>
                                        <Badge className={`${
                                            event.severity === 'Critical' ? 'bg-[#E16A3D]' : 'bg-orange-500'
                                        } text-white hover:bg-opacity-90 border-none`}>
                                            {event.severity.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Started: {event.createdAt}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-slate-600 text-sm leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {event.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {event.skillsNeeded.map(skill => (
                                    <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Right: Status & Actions */}
                        <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm font-semibold mb-1 text-[#043E52]">
                                        <span>Mobilization</span>
                                        <span>{Math.round((event.volunteersResponded / event.volunteersActivated) * 100)}%</span>
                                    </div>
                                    <Progress value={(event.volunteersResponded / event.volunteersActivated) * 100} className="h-2.5 bg-slate-100" />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                                        <span>{event.volunteersResponded} Responded</span>
                                        <span>{event.volunteersActivated} Notified</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-[#1C9290]/5 p-2 rounded-lg border border-[#1C9290]/10">
                                        <p className="text-xs text-slate-500">Target</p>
                                        <p className="font-bold text-[#1C9290]">{event.volunteersNeeded}</p>
                                    </div>
                                    <div className="bg-[#043E52]/5 p-2 rounded-lg border border-[#043E52]/10">
                                        <p className="text-xs text-slate-500">Shortfall</p>
                                        <p className="font-bold text-[#043E52]">{event.volunteersNeeded - event.volunteersResponded}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button className="flex-1 bg-[#043E52] hover:bg-[#033040] text-white h-9 text-sm">
                                    Manage
                                </Button>
                                <Button variant="outline" className="h-9 px-3 border-slate-200 text-slate-600 hover:text-[#E16A3D] hover:bg-orange-50">
                                    <Megaphone className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* 4. Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <Card className="w-full max-w-lg shadow-xl border-none">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-50 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-[#E16A3D]" />
                            </div>
                            <CardTitle className="text-[#043E52] text-lg">Declare Emergency</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="h-8 w-8 p-0 rounded-full">
                            <XCircle className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Incident Title</Label>
                        <Input 
                            placeholder="e.g. Structural Collapse" 
                            value={newCrisis.title}
                            onChange={(e) => setNewCrisis({...newCrisis, title: e.target.value})}
                            className="border-slate-200 focus:border-[#E16A3D] focus:ring-[#E16A3D]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Severity</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E16A3D] focus:border-transparent"
                                onChange={(e) => setNewCrisis({...newCrisis, severity: e.target.value as any})}
                            >
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Volunteers Needed</Label>
                            <Input 
                                type="number" 
                                defaultValue={10} 
                                className="border-slate-200 focus:border-[#E16A3D] focus:ring-[#E16A3D]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Situation Report</Label>
                        <Textarea 
                            placeholder="Describe the incident details..." 
                            value={newCrisis.description}
                            onChange={(e) => setNewCrisis({...newCrisis, description: e.target.value})}
                            className="min-h-[100px] border-slate-200 focus:border-[#E16A3D] focus:ring-[#E16A3D]"
                        />
                    </div>
                    <Button 
                        className="w-full bg-[#E16A3D] hover:bg-[#c2562d] text-white font-bold h-11 mt-2"
                        onClick={handleActivate}
                    >
                        <Send className="mr-2 h-4 w-4" /> ACTIVATE RESERVE
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENT: Metric Card ---
function MetricCard({ label, value, icon: Icon, color, bg, border }: any) {
    return (
        <Card className={`border-t-4 ${border} shadow-sm`}>
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-full ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
}