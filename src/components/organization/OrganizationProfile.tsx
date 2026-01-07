import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Edit,
  Save,
  CheckCircle,
  Shield,
  Award,
  Link as LinkIcon,
  Camera,
  Users,
  Clock,
  Briefcase,
  Calendar,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';

export function OrganizationProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Local Food Bank',
    tagline: 'Fighting hunger in our community',
    category: 'Community Service',
    email: 'contact@localfoodbank.org',
    phone: '+1 (555) 123-4567',
    website: 'www.localfoodbank.org',
    address: '456 Community Drive',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    foundedYear: '2010',
    ein: '12-3456789',
    description: 'We are a non-profit organization dedicated to fighting hunger and providing food assistance to families in need. Our mission is to ensure that no one in our community goes to bed hungry.',
    mission: 'To eliminate hunger in our community by providing food, resources, and support to individuals and families in need.',
    impact: 'Over 50,000 meals distributed annually, serving 5,000+ families in the local community.',
    facebook: 'facebook.com/localfoodbank',
    twitter: 'twitter.com/localfoodbank',
    instagram: 'instagram.com/localfoodbank'
  });

  const isVerified = true;
  const verificationDate = 'January 15, 2024';

  const stats = [
    { label: 'Active Volunteers', value: '234', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Hours', value: '5,847', icon: Clock, color: 'text-[#1C9290]', bg: 'bg-teal-50' },
    { label: 'Active Projects', value: '12', icon: Briefcase, color: 'text-[#E16A3D]', bg: 'bg-orange-50' },
    { label: 'Years Active', value: '15', icon: Calendar, color: 'text-[#043E52]', bg: 'bg-slate-100' }
  ];

  const certifications = [
    { name: '501(c)(3) Non-Profit', verified: true },
    { name: 'BBB Accredited Charity', verified: true },
    { name: 'GuideStar Gold Seal', verified: true }
  ];

  const handleInputChange = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. HERO BANNER SECTION */}
      <div className="relative mb-20">
        {/* Banner Image / Gradient */}
        <div className="h-48 w-full rounded-xl bg-gradient-to-r from-[#043E52] to-[#022a38] relative overflow-hidden shadow-md">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {isEditing && (
                <Button variant="secondary" size="sm" className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                    <Camera className="mr-2 h-4 w-4" /> Change Cover
                </Button>
            )}
        </div>

        {/* Profile Info Floating Card */}
        <div className="absolute -bottom-16 left-6 flex items-end gap-6">
            <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl rounded-2xl bg-white">
                    <AvatarImage src="https://images.unsplash.com/photo-1724167924357-2d5febf3f931?w=200&h=200&fit=crop" className="rounded-xl object-cover" />
                    <AvatarFallback className="rounded-xl bg-[#043E52] text-white text-3xl font-bold">LF</AvatarFallback>
                </Avatar>
                {isEditing && (
                    <Button size="icon" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 shadow-lg bg-[#043E52]">
                        <Camera className="h-4 w-4 text-white" />
                    </Button>
                )}
            </div>
            <div className="mb-2 hidden md:block">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-[#043E52]">{profileData.name}</h1>
                    {isVerified && (
                        <Badge className="bg-[#1C9290] hover:bg-[#157a78] gap-1 px-2 py-0.5">
                            <CheckCircle className="h-3 w-3" /> Verified
                        </Badge>
                    )}
                </div>
                <p className="text-slate-500 font-medium">{profileData.tagline}</p>
            </div>
        </div>

        {/* Action Buttons (Top Right) */}
        <div className="absolute -bottom-12 right-6 hidden md:flex gap-3">
            {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-[#043E52] hover:bg-[#033040] text-white shadow-md">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
            ) : (
                <>
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="bg-white shadow-sm border-slate-200">Cancel</Button>
                    <Button onClick={() => setIsEditing(false)} className="bg-[#1C9290] hover:bg-[#157a78] text-white shadow-md">
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </>
            )}
        </div>
      </div>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden mt-20 px-2 text-center">
         <h1 className="text-2xl font-bold text-[#043E52]">{profileData.name}</h1>
         <p className="text-slate-500">{profileData.tagline}</p>
         <Button onClick={() => setIsEditing(!isEditing)} className="w-full mt-4 bg-[#043E52] text-white">
            {isEditing ? 'Save Changes' : 'Edit Profile'}
         </Button>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
                <Card key={index} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                            <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. LEFT COLUMN: MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* About & Mission */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-[#043E52]">Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={profileData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mission</Label>
                                <Textarea value={profileData.mission} onChange={(e) => handleInputChange('mission', e.target.value)} rows={3} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-sm font-bold text-[#043E52] uppercase tracking-wide mb-2">About Us</h3>
                                <p className="text-slate-600 leading-relaxed">{profileData.description}</p>
                            </div>
                            <Separator />
                            <div className="flex gap-4 items-start">
                                <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                                    <Target className="h-6 w-6 text-[#E16A3D]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#043E52] uppercase tracking-wide mb-1">Our Mission</h3>
                                    <p className="text-slate-600 italic">"{profileData.mission}"</p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Impact Highlights */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-[#043E52]">Impact Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium text-slate-700">Meals Distributed Goal</span>
                                <span className="text-[#1C9290] font-bold">85%</span>
                            </div>
                            <Progress value={85} className="h-3" />
                            <p className="text-xs text-slate-500 mt-2">{profileData.impact}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* 4. RIGHT COLUMN: SIDEBAR */}
        <div className="space-y-6">
            
            {/* Verification Status */}
            <Card className={`border-l-4 shadow-sm ${isVerified ? 'border-l-[#1C9290]' : 'border-l-[#E16A3D]'}`}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Shield className={`h-6 w-6 ${isVerified ? 'text-[#1C9290]' : 'text-[#E16A3D]'}`} />
                        <h3 className="font-bold text-slate-800">Verification Status</h3>
                    </div>
                    {isVerified ? (
                        <>
                            <div className="flex items-center gap-2 text-[#1C9290] bg-teal-50 p-2 rounded-lg mb-2">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-semibold">Verified Organization</span>
                            </div>
                            <p className="text-xs text-slate-500">Verified on {verificationDate}. Your organization has full access to the Athar Volunteer Reserve.</p>
                        </>
                    ) : (
                        <p className="text-sm text-slate-600">Pending. Please submit documents.</p>
                    )}
                </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-[#043E52]">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-[#043E52]" />
                        {isEditing ? <Input value={profileData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="h-8" /> : <span>{profileData.email}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-[#043E52]" />
                        {isEditing ? <Input value={profileData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="h-8" /> : <span>{profileData.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Globe className="h-4 w-4 text-[#043E52]" />
                        {isEditing ? <Input value={profileData.website} onChange={(e) => handleInputChange('website', e.target.value)} className="h-8" /> : <a href="#" className="text-blue-600 hover:underline">{profileData.website}</a>}
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-[#043E52] mt-1" />
                        {isEditing ? <Textarea value={profileData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="text-xs" /> : <span>{profileData.address}<br/>{profileData.city}, {profileData.state} {profileData.zipCode}</span>}
                    </div>
                </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="font-bold text-[#043E52] mb-4 text-sm">Social Presence</h3>
                    <div className="flex justify-around">
                        <Button variant="outline" size="icon" className="rounded-full border-slate-200 text-[#043E52] hover:bg-slate-50">
                            <Facebook className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full border-slate-200 text-[#043E52] hover:bg-slate-50">
                            <Twitter className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full border-slate-200 text-[#043E52] hover:bg-slate-50">
                            <Instagram className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full border-slate-200 text-[#043E52] hover:bg-slate-50">
                            <LinkIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-[#043E52]">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {certifications.map((cert, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-[#E16A3D]" />
                                <span className="text-sm font-medium text-slate-700">{cert.name}</span>
                            </div>
                            {cert.verified && <CheckCircle className="h-4 w-4 text-[#1C9290]" />}
                        </div>
                    ))}
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}

// Missing Icon Component
function Target(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}