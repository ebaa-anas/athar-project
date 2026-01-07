import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Award, 
  Brain, 
  CheckCircle, 
  Heart, 
  Lock, 
  Star, 
  TrendingUp,
  Zap,
  Trophy,
  Target,
  Users,
  Building2,
  Clock,
  BookOpen
} from 'lucide-react';

interface SkillPath {
  id: string;
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  totalModules: number;
  completedModules: number;
  impactPoints: number;
  estimatedHours: number;
  icon: any;
  locked: boolean;
  inReserve: boolean;
  description: string;
}

const skillPaths: SkillPath[] = [
  {
    id: '1',
    title: 'Emergency Response Fundamentals',
    category: 'Crisis Management',
    level: 'Beginner',
    progress: 75,
    totalModules: 8,
    completedModules: 6,
    impactPoints: 250,
    estimatedHours: 12,
    icon: AlertTriangle,
    locked: false,
    inReserve: true,
    description: 'Learn the basics of emergency response and crisis management protocols'
  },
  {
    id: '2',
    title: 'Psychological First Aid',
    category: 'Mental Health',
    level: 'Intermediate',
    progress: 40,
    totalModules: 10,
    completedModules: 4,
    impactPoints: 400,
    estimatedHours: 20,
    icon: Heart,
    locked: false,
    inReserve: true,
    description: 'Provide mental health support and psychological assistance in crisis situations'
  },
  {
    id: '3',
    title: 'Community Coordination',
    category: 'Leadership',
    level: 'Advanced',
    progress: 0,
    totalModules: 12,
    completedModules: 0,
    impactPoints: 600,
    estimatedHours: 25,
    icon: Users,
    locked: true,
    inReserve: false,
    description: 'Lead and coordinate volunteer teams during large-scale operations'
  },
  {
    id: '4',
    title: 'Medical Assistance Basic',
    category: 'Healthcare',
    level: 'Beginner',
    progress: 100,
    totalModules: 6,
    completedModules: 6,
    impactPoints: 300,
    estimatedHours: 15,
    icon: Heart,
    locked: false,
    inReserve: true,
    description: 'Basic medical assistance and first aid techniques'
  },
  {
    id: '5',
    title: 'Disaster Relief Operations',
    category: 'Crisis Management',
    level: 'Intermediate',
    progress: 20,
    totalModules: 15,
    completedModules: 3,
    impactPoints: 500,
    estimatedHours: 30,
    icon: Building2,
    locked: false,
    inReserve: false,
    description: 'Comprehensive training in disaster relief and recovery operations'
  },
  {
    id: '6',
    title: 'Crisis Communication',
    category: 'Communication',
    level: 'Intermediate',
    progress: 60,
    totalModules: 8,
    completedModules: 5,
    impactPoints: 350,
    estimatedHours: 18,
    icon: Brain,
    locked: false,
    inReserve: true,
    description: 'Effective communication strategies during emergencies'
  }
];

function AlertTriangle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  );
}

export function SkillPaths() {
  const totalImpactPoints = skillPaths.reduce((acc, path) => 
    acc + (path.progress === 100 ? path.impactPoints : Math.floor(path.impactPoints * path.progress / 100)), 0
  );

  const reserveSkills = skillPaths.filter(path => path.inReserve);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">Impact-Based Skill Paths</h1>
        <p className="text-gray-600">
          Build verified skills through gamified learning paths. Complete modules to join the Athar Volunteer Reserve (AVR).
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-teal-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Impact Points</p>
                <p className="text-teal-700">{totalImpactPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Paths</p>
                <p className="text-green-700">
                  {skillPaths.filter(p => p.progress === 100).length}/{skillPaths.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reserve Skills</p>
                <p className="text-blue-700">{reserveSkills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Skill Level</p>
                <p className="text-purple-700">Intermediate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reserve Status Banner */}
      {reserveSkills.length > 0 && (
        <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-teal-600 text-white p-3 rounded-full">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">🎯 You're in the Athar Volunteer Reserve!</h3>
                <p className="text-gray-600 mb-3">
                  You have {reserveSkills.length} verified skills. Verified Partner organizations can activate you for crisis response.
                </p>
                <div className="flex flex-wrap gap-2">
                  {reserveSkills.map(skill => (
                    <Badge key={skill.id} className="bg-teal-700 hover:bg-teal-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {skill.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Paths */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Paths ({skillPaths.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({skillPaths.filter(p => p.progress > 0 && p.progress < 100).length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({skillPaths.filter(p => p.progress === 100).length})</TabsTrigger>
          <TabsTrigger value="reserve">AVR Skills ({reserveSkills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {skillPaths.map((path) => (
            <SkillPathCard key={path.id} path={path} />
          ))}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4 mt-6">
          {skillPaths.filter(p => p.progress > 0 && p.progress < 100).map((path) => (
            <SkillPathCard key={path.id} path={path} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {skillPaths.filter(p => p.progress === 100).map((path) => (
            <SkillPathCard key={path.id} path={path} />
          ))}
        </TabsContent>

        <TabsContent value="reserve" className="space-y-4 mt-6">
          {reserveSkills.map((path) => (
            <SkillPathCard key={path.id} path={path} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SkillPathCard({ path }: { path: SkillPath }) {
  const Icon = path.icon;
  
  return (
    <Card className={path.locked ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-lg ${
              path.category === 'Crisis Management' ? 'bg-red-100' :
              path.category === 'Mental Health' ? 'bg-purple-100' :
              path.category === 'Leadership' ? 'bg-blue-100' :
              path.category === 'Healthcare' ? 'bg-green-100' :
              path.category === 'Communication' ? 'bg-yellow-100' :
              'bg-gray-100'
            }`}>
              {path.locked ? (
                <Lock className="h-6 w-6 text-gray-500" />
              ) : (
                <Icon className={`h-6 w-6 ${
                  path.category === 'Crisis Management' ? 'text-red-700' :
                  path.category === 'Mental Health' ? 'text-purple-700' :
                  path.category === 'Leadership' ? 'text-blue-700' :
                  path.category === 'Healthcare' ? 'text-green-700' :
                  path.category === 'Communication' ? 'text-yellow-700' :
                  'text-gray-700'
                }`} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle>{path.title}</CardTitle>
                {path.inReserve && (
                  <Badge className="bg-teal-700 hover:bg-teal-800">
                    <Zap className="h-3 w-3 mr-1" />
                    AVR
                  </Badge>
                )}
                {path.progress === 100 && (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <CardDescription className="mb-3">{path.description}</CardDescription>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{path.category}</Badge>
                <Badge variant="outline">{path.level}</Badge>
                <Badge variant="outline">
                  <Star className="h-3 w-3 mr-1" />
                  {path.impactPoints} points
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {path.estimatedHours}h
                </Badge>
              </div>
              {!path.locked && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress: {path.completedModules}/{path.totalModules} modules</span>
                    <span className="text-teal-700">{path.progress}%</span>
                  </div>
                  <Progress value={path.progress} className="h-2" />
                </div>
              )}
            </div>
          </div>
          <div>
            {path.locked ? (
              <Button disabled variant="outline">
                <Lock className="mr-2 h-4 w-4" />
                Locked
              </Button>
            ) : path.progress === 100 ? (
              <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <Award className="mr-2 h-4 w-4" />
                View Certificate
              </Button>
            ) : (
              <Button className="bg-teal-700 hover:bg-teal-800">
                <BookOpen className="mr-2 h-4 w-4" />
                {path.progress === 0 ? 'Start Path' : 'Continue'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
