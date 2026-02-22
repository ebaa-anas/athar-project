import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { 
  Users, Briefcase, TrendingUp, Calendar, Clock, MapPin, 
  AlertCircle, CheckCircle, ArrowRight, Shield, AlertTriangle, 
  Star, XCircle, Image as ImageIcon, Globe, Heart, Building2
} from 'lucide-react';

// --- CONSTANT DATA ---
const stats = [
  { id: 1, label: 'Active Volunteers', value: '234', icon: Users, textColor: 'text-[#043E52]', bgColor: 'bg-[#043E52]/10', change: '+12%', changeColor: 'text-emerald-600' },
  { id: 2, label: 'Open Opportunities', value: '12', icon: Briefcase, textColor: 'text-[#1C9290]', bgColor: 'bg-[#1C9290]/10', change: '+3', changeColor: 'text-[#1C9290]' },
  { id: 3, label: 'Pending Applications', value: '28', icon: AlertCircle, textColor: 'text-[#E16A3D]', bgColor: 'bg-[#E16A3D]/10', change: '+8', changeColor: 'text-[#E16A3D]' },
  { id: 4, label: 'Total Impact Hours', value: '5,847', icon: TrendingUp, textColor: 'text-slate-700', bgColor: 'bg-slate-100', change: '+234h', changeColor: 'text-emerald-600' },
];

const recentApplications = [
  { id: 1, volunteer: 'Sarah Johnson', opportunity: 'Food Distribution Assistant', appliedDate: '2 hours ago', skills: ['Customer Service', 'Physical Activity'], avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: 2, volunteer: 'Michael Chen', opportunity: 'Volunteer Coordinator', appliedDate: '5 hours ago', skills: ['Leadership', 'Organization'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: 3, volunteer: 'Emily Davis', opportunity: 'Food Distribution Assistant', appliedDate: '1 day ago', skills: ['Team Work', 'Communication'], avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' }
];

const upcomingEvents = [
  { id: 1, title: 'Community Food Drive', date: 'Oct 20, 2025', volunteersRegistered: 7, volunteersNeeded: 10, location: 'Downtown Center' },
  { id: 2, title: 'Volunteer Orientation', date: 'Oct 24, 2025', volunteersRegistered: 15, volunteersNeeded: 20, location: 'Main Office' }
];

const topVolunteers = [
  { id: 1, name: 'John Doe', hours: 127, rating: 4.9, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
  { id: 2, name: 'Jane Smith', hours: 98, rating: 4.8, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' }
];



export function OrganizationOverview() {
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isCauseModalOpen, setIsCauseModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. HEADER & DUAL ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#043E52] uppercase tracking-tight">Organization Command</h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 font-bold text-sm">
            <Building2 className="h-4 w-4 text-[#1C9290]" />
            <span>Local Food Bank (Verified Partner)</span>
          </div>
        </div>

        <div className="flex gap-3">
         

          {/* POST OPPORTUNITY MODAL (DETAILED) */}
          <Dialog open={isOppModalOpen} onOpenChange={setIsOppModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#043E52] hover:bg-[#033040] text-white shadow-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]">
                <Briefcase className="mr-2 h-4 w-4" />
                Post Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-none rounded-2xl shadow-2xl p-8">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#1C9290] text-white uppercase text-[10px] font-black">Deployment Feed</Badge>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Now: {new Date().toLocaleDateString()}</span>
                </div>
                <DialogTitle className="text-3xl font-black text-[#043E52] uppercase tracking-tight">New Opportunity Specs</DialogTitle>
              </DialogHeader>
              
              <form className="space-y-6 pt-6 border-t border-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Opportunity Title</Label>
                      <Input placeholder="e.g. Saturday Meal Sorting" className="border-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Supporting Cause</Label>
                      <select className="w-full h-10 px-3 border border-slate-100 rounded-md text-sm font-bold text-[#E16A3D]">
                        <option>End Hunger 2026</option>
                        <option>Flood Relief Taskforce</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Environment Type</Label>
                      <select className="w-full h-10 px-3 border border-slate-100 rounded-md text-sm font-bold">
                        <option>On-Site (Physical)</option>
                        <option>Online (Remote)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Location / Meeting Link</Label>
                      <Input placeholder="123 Charity Way, NY" className="border-slate-100" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Skills Required</Label>
                    <Input placeholder="Logistics, Packing" className="border-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Volunteers Needed</Label>
                    <Input type="number" className="border-slate-100" placeholder="15" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Shift Time</Label>
                    <Input type="datetime-local" className="border-slate-100" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Full Description</Label>
                  <Textarea placeholder="Detail specific tasks and goals..." className="min-h-[120px]" />
                </div>

                <Button className="w-full bg-[#1C9290] hover:bg-[#157a78] text-white font-black h-14 uppercase tracking-[0.2em] text-xs shadow-xl">Deploy Opportunity</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. CRISIS HUB CARD */}
      <Card className="border border-[#1C9290]/30 bg-[#1C9290]/5 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#1C9290]" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 text-[#043E52]">
              <div className="bg-[#1C9290] text-white p-3 rounded-xl shadow-lg shadow-[#1C9290]/20"><Shield className="h-6 w-6" /></div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Verified Partner Hub</h3>
                <p className="text-slate-600 text-sm font-medium">Authorized to activate the <span className="font-bold">Athar Volunteer Reserve (AVR)</span> for crisis response.</p>
              </div>
            </div>
            <Button className="bg-[#E16A3D] hover:bg-[#c2562d] text-white font-black uppercase tracking-widest text-[10px] px-8 h-12 shadow-lg shadow-orange-500/20">
              <AlertTriangle className="mr-2 h-4 w-4" /> Activate Crisis Response
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.id} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                <p className={`text-[10px] font-bold mt-1 ${stat.changeColor}`}>{stat.change} this month</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}><stat.icon className={`h-5 w-5 ${stat.textColor}`} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT APPLICATIONS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
              <div>
                <CardTitle className="text-lg font-black text-[#043E52] uppercase">Pending Talent</CardTitle>
                <CardDescription className="font-bold">Review volunteers ready to join.</CardDescription>
              </div>
              <Badge className="bg-[#E16A3D] text-white font-black">{recentApplications.length} New</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {recentApplications.map((app) => (
                <div key={app.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-50 rounded-2xl hover:bg-[#1C9290]/5 transition-colors">
                  <img src={app.avatar} className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-900 uppercase text-sm">{app.volunteer}</h4>
                      <span className="text-[10px] font-bold text-slate-400">{app.appliedDate}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mb-2 truncate">Applied for <span className="text-[#043E52]">{app.opportunity}</span></p>
                    <div className="flex flex-wrap gap-2">
                      {app.skills.map((s, i) => <Badge key={i} variant="outline" className="text-[9px] font-black border-slate-100 uppercase">{s}</Badge>)}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button className="h-9 bg-[#1C9290] hover:bg-[#157a78] text-white font-black uppercase text-[10px] tracking-widest px-6 shadow-md shadow-emerald-900/10">Approve</Button>
                      <Button variant="ghost" className="h-9 text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase">Reject</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR: TOP VOLUNTEERS & TIMELINE */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-50"><CardTitle className="text-lg font-black text-[#043E52] uppercase">Top Impactors</CardTitle></CardHeader>
            <CardContent className="pt-6 space-y-4">
              {topVolunteers.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1C9290]/10 flex items-center justify-center text-[#1C9290] font-black text-xs">#{i+1}</div>
                  <img src={v.avatar} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-900 truncate">{v.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{v.hours} Hours</p></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-[#043E52] text-white">
            <CardHeader><CardTitle className="text-lg font-black uppercase">Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="p-3 bg-white/10 rounded-xl border border-white/5">
                  <p className="text-xs font-black uppercase text-[#1C9290] mb-1">{event.date}</p>
                  <p className="text-sm font-bold mb-3">{event.title}</p>
                  <div className="flex justify-between items-center text-[10px] font-black mb-1 uppercase"><span>Registration</span><span>{event.volunteersRegistered}/{event.volunteersNeeded}</span></div>
                  <Progress value={(event.volunteersRegistered/event.volunteersNeeded)*100} className="h-1.5 bg-white/10" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}