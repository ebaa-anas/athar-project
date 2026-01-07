import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Heart, Users, Target, TrendingUp } from 'lucide-react';
import { Progress } from './ui/progress';

const causes = [
  {
    id: 1,
    title: 'Education for All',
    description: 'Providing quality education and learning resources to underprivileged children.',
    image: 'https://images.unsplash.com/photo-1518818608552-195ed130cdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Education',
    volunteers: 234,
    funded: 75,
    goal: 100000,
    raised: 75000,
    impact: 'High',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Clean Environment Initiative',
    description: 'Working towards a cleaner, greener planet through community action.',
    image: 'https://images.unsplash.com/photo-1624858194621-92e3efffe22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Environment',
    volunteers: 456,
    funded: 82,
    goal: 80000,
    raised: 65600,
    impact: 'High',
    color: 'bg-green-500'
  },
  {
    id: 3,
    title: 'Community Healthcare',
    description: 'Bringing essential healthcare services to underserved communities.',
    image: 'https://images.unsplash.com/photo-1758599668125-e154250f24bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Healthcare',
    volunteers: 189,
    funded: 60,
    goal: 120000,
    raised: 72000,
    impact: 'Medium',
    color: 'bg-red-500'
  },
  {
    id: 4,
    title: 'Food Security Program',
    description: 'Eliminating hunger by providing nutritious meals to families in need.',
    image: 'https://images.unsplash.com/photo-1724167924357-2d5febf3f931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    category: 'Community',
    volunteers: 312,
    funded: 45,
    goal: 90000,
    raised: 40500,
    impact: 'High',
    color: 'bg-orange-500'
  },
];

const myCauses = [
  {
    id: 1,
    title: 'Education for All',
    hoursContributed: 45,
    impactScore: 92
  },
  {
    id: 2,
    title: 'Clean Environment Initiative',
    hoursContributed: 32,
    impactScore: 88
  }
];

export function Causes() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Causes</h1>
          <p className="text-gray-500 mt-1">Support causes that matter to you</p>
        </div>
        <Button className="bg-teal-700 hover:bg-teal-800">
          <Heart className="mr-2 h-4 w-4" />
          Browse All Causes
        </Button>
      </div>

      {/* My Causes */}
      <Card>
        <CardHeader>
          <CardTitle>My Causes</CardTitle>
          <CardDescription>Causes you're actively supporting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCauses.map((cause) => (
              <div key={cause.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-gray-900">{cause.title}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Hours Contributed</p>
                    <p className="text-teal-700">{cause.hoursContributed}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Impact Score</p>
                    <p className="text-teal-700">{cause.impactScore}/100</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Causes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {causes.map((cause) => (
          <Card key={cause.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 overflow-hidden">
              <img 
                src={cause.image} 
                alt={cause.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{cause.title}</CardTitle>
                <Badge variant="outline">{cause.category}</Badge>
              </div>
              <CardDescription>{cause.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="text-gray-900">{cause.volunteers}</p>
                  <p className="text-xs text-gray-500">Volunteers</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="text-gray-900">{cause.funded}%</p>
                  <p className="text-xs text-gray-500">Funded</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="text-gray-900">{cause.impact}</p>
                  <p className="text-xs text-gray-500">Impact</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">${cause.raised.toLocaleString()} raised</span>
                  <span className="text-gray-600">of ${cause.goal.toLocaleString()}</span>
                </div>
                <Progress value={cause.funded} className="h-2" />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 bg-teal-700 hover:bg-teal-800">
                  Support This Cause
                </Button>
                <Button variant="outline" className="flex-1">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
