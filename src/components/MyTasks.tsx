import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const tasks = [
  {
    id: 1,
    title: 'Submit volunteer hours for Food Drive',
    description: 'Log your 5 hours of volunteer work from last Saturday',
    organization: 'Local Food Bank',
    dueDate: 'Oct 18, 2025',
    priority: 'High',
    status: 'pending',
    category: 'Administrative'
  },
  {
    id: 2,
    title: 'Complete safety training module',
    description: 'Finish the online safety certification before the next event',
    organization: 'Green Earth Initiative',
    dueDate: 'Oct 19, 2025',
    priority: 'High',
    status: 'pending',
    category: 'Training'
  },
  {
    id: 3,
    title: 'Confirm attendance for Beach Cleanup',
    description: 'Respond to the event confirmation email',
    organization: 'Green Earth Initiative',
    dueDate: 'Oct 20, 2025',
    priority: 'Medium',
    status: 'pending',
    category: 'Event'
  },
  {
    id: 4,
    title: 'Prepare lesson plan for tutoring session',
    description: 'Create materials for next week\'s math tutoring',
    organization: 'Future Leaders Foundation',
    dueDate: 'Oct 23, 2025',
    priority: 'Medium',
    status: 'pending',
    category: 'Preparation'
  },
  {
    id: 5,
    title: 'Submit volunteer availability for November',
    description: 'Update your calendar availability for next month',
    organization: 'Tech for All',
    dueDate: 'Oct 25, 2025',
    priority: 'Low',
    status: 'pending',
    category: 'Administrative'
  }
];

const completedTasks = [
  {
    id: 1,
    title: 'Complete volunteer orientation',
    organization: 'Local Food Bank',
    completedDate: 'Oct 15, 2025'
  },
  {
    id: 2,
    title: 'Submit background check documents',
    organization: 'Elder Support Network',
    completedDate: 'Oct 14, 2025'
  },
  {
    id: 3,
    title: 'Attend volunteer kickoff meeting',
    organization: 'Green Earth Initiative',
    completedDate: 'Oct 12, 2025'
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Low':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function MyTasks() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">My Tasks</h1>
          <p className="text-gray-500 mt-1">Keep track of your volunteer commitments and actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-red-600 border-red-300">
            {tasks.filter(t => t.priority === 'High').length} Urgent
          </Badge>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-gray-900 mt-2">{tasks.length}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed This Week</p>
                <p className="text-gray-900 mt-2">{completedTasks.length}</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Due This Week</p>
                <p className="text-gray-900 mt-2">{tasks.filter(t => t.priority === 'High').length}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
          <CardDescription>Tasks that need your attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors">
              <div className="pt-1">
                <Checkbox />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-teal-700">{task.organization}</span>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {task.dueDate}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {task.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-teal-700 hover:bg-teal-800">
                    Complete Task
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Completed</CardTitle>
          <CardDescription>Tasks you've finished recently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-teal-700" />
                </div>
                <div className="flex-1">
                  <h4 className="text-gray-900">{task.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{task.organization}</span>
                    <span>•</span>
                    <span>Completed on {task.completedDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
