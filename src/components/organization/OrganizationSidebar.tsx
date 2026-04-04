import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar, 
  FileText,
  Settings,
  Building2,
  MessageSquare,
  Bell,
  BarChart3,
  AlertTriangle,
  LogOut,
  ChevronRight 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import atharLogo from "../../assets/athar-logo.png";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void; // <--- ADDED THIS
}

interface MenuItem {
  badge: any;
  id: string;
  label: string;
  icon: any;
  verifiedOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'profile', label: 'Organization Profile', icon: Building2, badge: undefined },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: undefined },
  { id: 'crisis-management', label: 'Crisis Management', icon: AlertTriangle, verifiedOnly: true, badge: undefined },
  { id: "messages", label: "Mission Comms", icon: MessageSquare, badge: undefined} , 
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase, badge: undefined },
  { id: 'volunteers', label: 'Volunteers', icon: Users, badge: undefined },
  { id: 'applications', label: 'Applications', icon: FileText, badge: '3' },
  { id: 'events', label: 'Events', icon: Calendar, badge: undefined },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, badge: undefined },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: '5' },
  { id: 'settings', label: 'Settings', icon: Settings, badge: undefined },
];

export function OrganizationSidebar({
  activeSection,
  onSectionChange,
  onLogout // <--- ADDED THIS
}: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 h-screen bg-[#043E52] flex flex-col shadow-2xl z-50 font-sans">
      
      {/* --- FIXED UPPER SECTION (Does not scroll) --- */}
      <div className="flex-none flex flex-col">
        {/* 1. Logo Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-3">
              <img src={atharLogo} alt="Athar" className="w-10 h-10 brightness-0 invert" />
              <div className="flex flex-col justify-center -mt-1">
                <span className="text-xl text-white tracking-wide font-bold leading-none">Athar</span>
                <span className="text-[10px] text-[#1C9290] font-bold tracking-widest uppercase mt-1">Partner Portal</span>
              </div>
          </div>
        </div>

        {/* 2. Profile Card */}
        <div className="px-3 mb-2">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-[#1C9290]/50 transition-colors cursor-default backdrop-blur-sm">
            <Avatar className="w-9 h-9 border border-[#1C9290]/50">
              <AvatarImage src="https://images.unsplash.com/photo-1557683316-973673baf926?w=100&h=100&fit=crop" />
              <AvatarFallback className="bg-[#1C9290] text-white text-xs font-bold">ORG</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-white text-sm font-semibold tracking-tight">Local Food Bank</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1C9290]"></span>
                  </span>
                  <p className="text-[11px] text-slate-300 font-medium">Verified</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </div>

      {/* --- SCROLLABLE MIDDLE SECTION (Hidden scrollbar) --- */}
      <div className="flex-1 overflow-y-auto px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="space-y-1 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isCrisis = item.id === 'crisis-management';

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onSectionChange(item.id)}
                className={`w-full justify-between group h-10 px-3 transition-all duration-200 rounded-lg mb-1 ${
                  isActive
                    ? "bg-[#1C9290] text-white shadow-lg shadow-[#000000]/20 font-medium" 
                    : "text-slate-300 hover:bg-white/5 hover:text-white" 
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-[18px] w-[18px] ${
                    isActive ? "text-white" : isCrisis ? "text-[#E16A3D]" : "text-slate-400 group-hover:text-white"
                  }`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {item.badge && (
                    <Badge className={`px-1.5 h-5 text-[10px] min-w-[20px] justify-center border-none ${
                        isActive 
                        ? "bg-white text-[#1C9290] font-bold" 
                        : "bg-[#E16A3D] text-white font-bold"
                    }`}>
                        {item.badge}
                    </Badge>
                    )}
                    {isActive && <ChevronRight className="h-3 w-3 text-white/50" />}
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* --- FIXED BOTTOM SECTION (Does not scroll) --- */}
      <div className="flex-none p-4 border-t border-white/5 bg-[#033040]/30">
        <Button
          variant="ghost"
          onClick={onLogout} // <--- Connected here
          className="w-full justify-start text-slate-400 hover:bg-[#E16A3D] hover:text-white transition-all rounded-lg h-10 px-3"
        >
          <LogOut className="mr-3 h-[18px] w-[18px]" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}