import { 
  LayoutDashboard, 
  Shield, 
  Users, 
  Settings,
  LogOut,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import atharLogo from "../../assets/athar-logo.png";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
  { id: 'verification', label: 'Verification Requests', icon: Shield, badge: 5 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'moderation', label: 'Content Moderation', icon: AlertCircle, badge: 3 },
  { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ activeSection, onSectionChange, onLogout }: AdminSidebarProps) {
  
  const handleNavigation = (id: string) => {
    onSectionChange(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // 1. FIXED LAYOUT: Pinned to left, full height
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col h-screen text-slate-600 font-medium shadow-sm z-50">
      
      {/* --- FIXED UPPER SECTION (Does not scroll) --- */}
      <div className="flex-none flex flex-col">
        
        {/* Logo Area: Improved Alignment */}
        <div className="p-6 flex items-center gap-3 bg-white border-b border-slate-100">
          <img src={atharLogo} alt="Athar" className="w-10 h-10" />
          <div className="flex flex-col justify-center -mt-1">
            <span className="text-xl text-[#043E52] tracking-wide font-bold leading-none">Athar</span>
            <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-[#E16A3D] hover:bg-[#c2562d] text-white text-[10px] px-1.5 h-4 border-none shadow-sm">Admin</Badge>
            </div>
          </div>
        </div>

        {/* Admin User Profile */}
        <div className="p-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Avatar className="w-10 h-10 border border-slate-300">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
              <AvatarFallback className="bg-[#016A6D] text-white">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[#043E52] text-sm font-bold">Admin User</p>
              <p className="text-xs text-slate-500">System Administrator</p>
            </div>
          </div>
        </div>

        <div className="px-4">
            <Separator className="bg-slate-100" />
        </div>
      </div>

      {/* --- SCROLLABLE MIDDLE SECTION (Hidden Scrollbar) --- */}
      <div className="flex-1 overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start mb-1 transition-all duration-200 h-10 ${
                  isActive 
                    // Active: Nile Blue (#043E52) background
                    ? 'bg-[#043E52] text-white shadow-md hover:bg-[#033040]' 
                    // Inactive: Dark Slate text
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#043E52]'
                }`}
                onClick={() => handleNavigation(item.id)}
              >
                <Icon className={`mr-3 h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-[#043E52]"}`} />
                <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
                
                {item.badge && (
                  <Badge className={`ml-2 text-xs font-bold border-none px-2 ${
                    isActive 
                      ? "bg-white text-[#043E52]" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* --- FIXED BOTTOM SECTION (Logout) --- */}
      <div className="flex-none p-4 border-t border-slate-200 bg-slate-50">
        <Button 
            variant="ghost" 
            onClick={onLogout}
            className="w-full justify-start text-slate-600 hover:text-[#E16A3D] hover:bg-white border border-transparent hover:border-slate-200 transition-all h-10"
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:text-[#E16A3D]" />
          Logout
        </Button>
      </div>
    </aside>
  );
}