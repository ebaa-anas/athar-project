import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Award, Download, Share2, Calendar, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const certificates = [
  {
    id: 1,
    title: 'Volunteer Leadership Training',
    organization: 'Athar Platform',
    issueDate: 'October 15, 2025',
    credentialId: 'ATH-VLT-2025-0847',
    skills: ['Leadership', 'Team Management', 'Conflict Resolution'],
    verified: true,
    type: 'Course Completion'
  },
  {
    id: 2,
    title: 'Community Engagement Specialist',
    organization: 'Future Leaders Foundation',
    issueDate: 'September 22, 2025',
    credentialId: 'FLF-CES-2025-1234',
    skills: ['Community Building', 'Communication', 'Event Planning'],
    verified: true,
    type: 'Course Completion'
  },
  {
    id: 3,
    title: '100 Hours Volunteer Service',
    organization: 'Athar Platform',
    issueDate: 'September 10, 2025',
    credentialId: 'ATH-100H-2025-0847',
    skills: ['Commitment', 'Dedication'],
    verified: true,
    type: 'Achievement'
  },
  {
    id: 4,
    title: 'Environmental Conservation Certificate',
    organization: 'Green Earth Initiative',
    issueDate: 'August 5, 2025',
    credentialId: 'GEI-ECC-2025-5678',
    skills: ['Environmental Awareness', 'Sustainability', 'Conservation'],
    verified: true,
    type: 'Course Completion'
  },
  {
    id: 5,
    title: 'Food Safety & Handling',
    organization: 'Local Food Bank',
    issueDate: 'July 18, 2025',
    credentialId: 'LFB-FSH-2025-9012',
    skills: ['Food Safety', 'Health & Safety'],
    verified: true,
    type: 'Training'
  }
];

const pendingCertificates = [
  {
    id: 1,
    title: 'Advanced Tutoring Techniques',
    organization: 'Future Leaders Foundation',
    expectedDate: 'November 30, 2025',
    progress: 75,
    requirements: '15/20 lessons completed'
  },
  {
    id: 2,
    title: 'First Aid & CPR Certification',
    organization: 'Red Cross',
    expectedDate: 'December 5, 2025',
    progress: 40,
    requirements: 'Final exam pending'
  }
];

const achievements = [
  {
    id: 1,
    title: 'Early Bird',
    description: 'Completed first volunteer activity within 24 hours of signing up',
    earnedDate: 'June 1, 2025',
    icon: '🐦'
  },
  {
    id: 2,
    title: 'Community Champion',
    description: 'Volunteered with 5 different organizations',
    earnedDate: 'August 15, 2025',
    icon: '🏆'
  },
  {
    id: 3,
    title: 'Dedicated Volunteer',
    description: 'Logged 100+ hours of volunteer service',
    earnedDate: 'September 10, 2025',
    icon: '⭐'
  },
  {
    id: 4,
    title: 'Environmental Hero',
    description: 'Participated in 10+ environmental cleanup events',
    earnedDate: 'October 3, 2025',
    icon: '🌱'
  }
];

export function Certificates() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Certificates & Achievements</h1>
          <p className="text-gray-500 mt-1">View and manage your credentials and accomplishments</p>
        </div>
        <Button className="bg-teal-700 hover:bg-teal-800">
          <Share2 className="mr-2 h-4 w-4" />
          Share All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Certificates</p>
                <p className="text-gray-900 mt-2">{certificates.length}</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <Award className="h-5 w-5 text-teal-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-gray-900 mt-2">{pendingCertificates.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Achievements</p>
                <p className="text-gray-900 mt-2">{achievements.length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-gray-900 mt-2">{certificates.filter(c => c.verified).length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="earned" className="w-full">
        <TabsList>
          <TabsTrigger value="earned">Earned Certificates</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Earned Certificates */}
        <TabsContent value="earned" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-br from-teal-50 to-green-50">
                  <div className="flex items-start justify-between">
                    <div className="bg-white p-3 rounded-lg">
                      <Award className="h-8 w-8 text-teal-700" />
                    </div>
                    {cert.verified && (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4">{cert.title}</CardTitle>
                  <CardDescription className="text-teal-700">{cert.organization}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Issued: {cert.issueDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4" />
                      <span>ID: {cert.credentialId}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cert.type}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Skills Acquired</p>
                    <div className="flex flex-wrap gap-2">
                      {cert.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-teal-50 text-teal-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* In Progress */}
        <TabsContent value="in-progress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingCertificates.map((cert) => (
              <Card key={cert.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{cert.title}</CardTitle>
                      <CardDescription>{cert.organization}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-teal-700">{cert.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${cert.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Expected: {cert.expectedDate}</span>
                  </div>
                  <p className="text-sm text-gray-600">{cert.requirements}</p>
                  <Button className="w-full bg-teal-700 hover:bg-teal-800">
                    Continue
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-4">{achievement.icon}</div>
                  <h3 className="text-gray-900 mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{achievement.earnedDate}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Certificate Preview */}
      <Card className="bg-gradient-to-br from-teal-50 to-green-50">
        <CardHeader>
          <CardTitle>Build Your Credentials</CardTitle>
          <CardDescription>
            Complete courses and volunteer activities to earn more certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Button className="bg-teal-700 hover:bg-teal-800">
              Browse Courses
            </Button>
            <Button variant="outline">
              Explore Opportunities
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
