import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Shield,
  CheckCircle,
  Award,
  TrendingUp,
  Zap,
  Target,
  Trophy
} from 'lucide-react';

export function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1995-03-15',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    bio: 'Passionate volunteer dedicated to making a positive impact in the community. Experienced in education, environmental conservation, and community development projects.',
    linkedIn: 'linkedin.com/in/johndoe',
    website: 'johndoe.com'
  });

  const [skills] = useState([
    'Teaching', 'Leadership', 'Communication', 'Project Management',
    'Event Planning', 'Fundraising', 'Social Media', 'Public Speaking'
  ]);

  const [interests] = useState([
    { id: 1, name: 'Education', icon: '📚' },
    { id: 2, name: 'Environment', icon: '🌱' },
    { id: 3, name: 'Healthcare', icon: '🏥' },
    { id: 4, name: 'Community Development', icon: '🏘️' }
  ]);

  const [experiences] = useState([
    {
      id: 1,
      title: 'Lead Volunteer Coordinator',
      organization: 'Local Food Bank',
      location: 'New York, NY',
      startDate: 'Jan 2024',
      endDate: 'Present',
      current: true,
      description: 'Coordinating volunteer teams for weekly food distribution events, managing logistics, and ensuring smooth operations.'
    },
    {
      id: 2,
      title: 'Environmental Volunteer',
      organization: 'Green Earth Initiative',
      location: 'New York, NY',
      startDate: 'Jun 2023',
      endDate: 'Dec 2023',
      current: false,
      description: 'Participated in coastal cleanup programs, tree planting initiatives, and environmental awareness campaigns.'
    },
    {
      id: 3,
      title: 'Youth Tutor',
      organization: 'Future Leaders Foundation',
      location: 'New York, NY',
      startDate: 'Sep 2022',
      endDate: 'May 2023',
      current: false,
      description: 'Provided academic tutoring in mathematics and science to middle school students from underserved communities.'
    }
  ]);

  const [languages] = useState([
    { name: 'English', proficiency: 'Native' },
    { name: 'Spanish', proficiency: 'Intermediate' },
    { name: 'French', proficiency: 'Basic' }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleSave = () => {
    // Here you would save to backend
    setIsEditing(false);
  };

  const verifiedSkills = [
    'Emergency Response Fundamentals',
    'Psychological First Aid',
    'Medical Assistance Basic',
    'Crisis Communication'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Social Impact Portfolio</h1>
          <p className="text-gray-500 mt-1">Your verified skills, achievements, and volunteer CV</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-teal-700 hover:bg-teal-800">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* AVR Status Banner */}
      <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-teal-600 text-white p-3 rounded-full">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2">🛡️ Athar Volunteer Reserve (AVR) Member</h3>
              <p className="text-gray-600 mb-3">
                You have {verifiedSkills.length} verified skills and are eligible for crisis deployment by Verified Partner organizations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-teal-600 text-white p-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verified Skills</p>
                    <p className="text-teal-700">{verifiedSkills.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-green-600 text-white p-2 rounded-lg">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Impact Score</p>
                    <p className="text-green-700">1,450</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <p className="text-blue-700">92%</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Verified Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {verifiedSkills.map((skill, index) => (
                    <Badge key={index} className="bg-teal-700 hover:bg-teal-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button className="bg-teal-700 hover:bg-teal-800">
              <Award className="mr-2 h-4 w-4" />
              View Certificate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button variant="outline" size="sm">
                  Change Photo
                </Button>
              )}
            </div>
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-gray-900">{profileData.fullName}</h2>
                  <p className="text-teal-700 mt-1">Volunteer</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{profileData.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{profileData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(profileData.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{profileData.city}, {profileData.state}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="outline" className="bg-teal-50 text-teal-700">
                      127 Hours Volunteered
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      8 Projects Completed
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Impact Score: 92
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profileData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={profileData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profileData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedIn">LinkedIn</Label>
                      <Input
                        id="linkedIn"
                        value={profileData.linkedIn}
                        onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-500 mb-2">Bio</h4>
                    <p className="text-gray-700">{profileData.bio}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm text-gray-500">Address</h4>
                      <p className="text-gray-700">{profileData.address}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-500">City</h4>
                      <p className="text-gray-700">{profileData.city}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-500">State</h4>
                      <p className="text-gray-700">{profileData.state}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-500">ZIP Code</h4>
                      <p className="text-gray-700">{profileData.zipCode}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-500">Country</h4>
                      <p className="text-gray-700">{profileData.country}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-500">LinkedIn</h4>
                      <p className="text-teal-700">{profileData.linkedIn}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volunteer Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Volunteer Experience</CardTitle>
                  <CardDescription>Your volunteer work history</CardDescription>
                </div>
                {isEditing && (
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Experience
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative">
                  <div className="flex gap-4">
                    <div className="bg-teal-100 p-3 rounded-lg h-fit">
                      <Briefcase className="h-5 w-5 text-teal-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-gray-900">{exp.title}</h3>
                          <p className="text-teal-700">{exp.organization}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{exp.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                          </div>
                        </div>
                        {isEditing && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                    </div>
                  </div>
                  {exp.id !== experiences[experiences.length - 1].id && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skills */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Skills</CardTitle>
                {isEditing && (
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-teal-50 text-teal-700">
                    {skill}
                    {isEditing && (
                      <button className="ml-2">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interests.map((interest) => (
                  <div key={interest.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <span className="text-2xl">{interest.icon}</span>
                    <span className="text-gray-700">{interest.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Languages</CardTitle>
                {isEditing && (
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{lang.name}</span>
                    <Badge variant="outline">{lang.proficiency}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Weekdays</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Weekends</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hours per week</span>
                  <span className="text-gray-700">10-15 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
