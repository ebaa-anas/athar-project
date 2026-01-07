import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Users,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Heart,
  Shield,
  Navigation,
  Phone,
  AlertCircle,
  Activity
} from 'lucide-react';

interface CrisisAlert {
  id: string;
  title: string;
  organization: string;
  organizationVerified: boolean;
  severity: 'Critical' | 'High' | 'Medium';
  location: string;
  distance: string;
  skillsNeeded: string[];
  volunteersNeeded: number;
  volunteersActivated: number;
  postedTime: string;
  reportedBy: string;
  description: string;
  status: 'active' | 'accepted' | 'completed';
  matchScore?: number;
}

const crisisAlerts: CrisisAlert[] = [
  {
    id: '1',
    title: 'Earthquake Response - Medical Aid Needed',
    organization: 'AFAD',
    organizationVerified: true,
    severity: 'Critical',
    location: 'Kadıköy, Istanbul',
    distance: '2.3 km',
    skillsNeeded: ['Medical Assistance Basic', 'Psychological First Aid', 'Emergency Response'],
    volunteersNeeded: 15,
    volunteersActivated: 8,
    postedTime: '12 minutes ago',
    reportedBy: 'AFAD Emergency Coordinator',
    description: 'Major earthquake in Kadıköy district. Multiple buildings affected. Need immediate medical assistance and psychological support for affected residents. Emergency coordination center established at Kadıköy Municipality.',
    status: 'active',
    matchScore: 95
  },
  {
    id: '2',
    title: 'Flood Relief - Community Support',
    organization: 'Kızılay',
    organizationVerified: true,
    severity: 'High',
    location: 'Beşiktaş, Istanbul',
    distance: '5.7 km',
    skillsNeeded: ['Community Coordination', 'Crisis Communication'],
    volunteersNeeded: 10,
    volunteersActivated: 6,
    postedTime: '45 minutes ago',
    reportedBy: 'Kızılay Regional Director',
    description: 'Flash flooding in Beşiktaş area. Need volunteers to help coordinate relief efforts and communicate with affected families. Distribution center at Beşiktaş Community Center.',
    status: 'accepted',
    matchScore: 88
  },
  {
    id: '3',
    title: 'Refugee Crisis - Translation Services',
    organization: 'Turkish Red Crescent',
    organizationVerified: true,
    severity: 'Medium',
    location: 'Şişli, Istanbul',
    distance: '8.2 km',
    skillsNeeded: ['Crisis Communication', 'Community Coordination'],
    volunteersNeeded: 5,
    volunteersActivated: 5,
    postedTime: '2 hours ago',
    reportedBy: 'Red Crescent Field Coordinator',
    description: 'Increased refugee arrivals. Need volunteers with communication skills to help with registration and coordination. Meeting point at Şişli Refugee Center.',
    status: 'completed',
    matchScore: 72
  }
];

export function CrisisResponse() {
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);

  const activeAlerts = crisisAlerts.filter(a => a.status === 'active');
  const acceptedAlerts = crisisAlerts.filter(a => a.status === 'accepted');
  const completedAlerts = crisisAlerts.filter(a => a.status === 'completed');

  const handleAcceptAlert = (alertId: string) => {
    // In a real app, this would call an API
    console.log('Accepted alert:', alertId);
  };

  const handleDeclineAlert = (alertId: string) => {
    // In a real app, this would call an API
    console.log('Declined alert:', alertId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-2">Crisis Response Center</h1>
        <p className="text-gray-600">
          Receive real-time crisis alerts matched to your verified skills. Part of the Athar Volunteer Reserve (AVR).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-red-700">{activeAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Responses</p>
                <p className="text-green-700">{acceptedAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-blue-700">{completedAlerts.length}</p>
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
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-purple-700">92%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AVR Status Banner */}
      <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-teal-600 text-white p-3 rounded-full">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2">🛡️ Athar Volunteer Reserve Status: Active</h3>
              <p className="text-gray-600 mb-3">
                You're part of the AVR! Verified Partner organizations can activate you for crisis response. 
                Alerts are matched using NLP to your verified skills for targeted, efficient deployment.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Skills Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Background Check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Active Status</span>
                </div>
              </div>
            </div>
            <Button variant="outline">Manage Availability</Button>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Alerts */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="relative">
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge className="ml-2 bg-red-500 hover:bg-red-600">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">My Responses ({acceptedAlerts.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 mb-2">No Active Alerts</h3>
                <p className="text-gray-600">
                  You'll receive notifications when crisis alerts match your verified skills
                </p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <CrisisAlertCard 
                key={alert.id} 
                alert={alert} 
                onAccept={handleAcceptAlert}
                onDecline={handleDeclineAlert}
                onViewDetails={setSelectedAlert}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4 mt-6">
          {acceptedAlerts.map((alert) => (
            <CrisisAlertCard 
              key={alert.id} 
              alert={alert}
              onViewDetails={setSelectedAlert}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedAlerts.map((alert) => (
            <CrisisAlertCard 
              key={alert.id} 
              alert={alert}
              onViewDetails={setSelectedAlert}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Alert Details Modal (simplified as inline) */}
      {selectedAlert && (
        <Card className="border-2 border-red-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedAlert.title}</CardTitle>
                <CardDescription>{selectedAlert.organization}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-gray-900 mb-2">Emergency Details</h4>
                <p className="text-gray-600">{selectedAlert.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{selectedAlert.location}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contact</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>+90 555 0123</span>
                  </div>
                </div>
              </div>
              {selectedAlert.status === 'accepted' && (
                <div className="flex gap-2">
                  <Button className="flex-1 bg-teal-700 hover:bg-teal-800">
                    <Navigation className="mr-2 h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Coordinator
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CrisisAlertCard({ 
  alert, 
  onAccept, 
  onDecline,
  onViewDetails 
}: { 
  alert: CrisisAlert; 
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onViewDetails?: (alert: CrisisAlert) => void;
}) {
  return (
    <Card className={`border-2 ${
      alert.severity === 'Critical' ? 'border-red-300 bg-red-50/30' :
      alert.severity === 'High' ? 'border-orange-300 bg-orange-50/30' :
      'border-yellow-300 bg-yellow-50/30'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{alert.title}</CardTitle>
              <Badge className={
                alert.severity === 'Critical' ? 'bg-red-600 hover:bg-red-700' :
                alert.severity === 'High' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }>
                {alert.severity}
              </Badge>
              {alert.matchScore && (
                <Badge className="bg-green-600 hover:bg-green-700">
                  {alert.matchScore}% Match
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{alert.organization}</span>
                {alert.organizationVerified && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{alert.postedTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{alert.location} • {alert.distance}</span>
              </div>
            </div>
            <CardDescription className="mb-3">{alert.description}</CardDescription>
            
            {/* Skills Needed */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Skills Needed:</p>
              <div className="flex flex-wrap gap-2">
                {alert.skillsNeeded.map((skill, index) => (
                  <Badge key={index} variant="outline" className="border-teal-300 text-teal-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Volunteers Status */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {alert.volunteersActivated}/{alert.volunteersNeeded} volunteers activated
                </span>
              </div>
              {alert.status === 'accepted' && (
                <Badge className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  You Accepted
                </Badge>
              )}
              {alert.status === 'completed' && (
                <Badge className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            {alert.status === 'active' && onAccept && onDecline && (
              <>
                <Button 
                  className="bg-teal-700 hover:bg-teal-800"
                  onClick={() => onAccept(alert.id)}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Accept Alert
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onDecline(alert.id)}
                >
                  Decline
                </Button>
              </>
            )}
            {alert.status === 'accepted' && (
              <>
                <Button className="bg-green-700 hover:bg-green-800">
                  <Navigation className="mr-2 h-4 w-4" />
                  Get Directions
                </Button>
                <Button variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact
                </Button>
              </>
            )}
            {onViewDetails && (
              <Button 
                variant="outline"
                onClick={() => onViewDetails(alert)}
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function Building2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  );
}
