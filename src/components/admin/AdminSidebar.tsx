import {
  LayoutDashboard,
  Shield,
  Users,
  Settings,
  LogOut,
  BarChart3,
  AlertCircle,
  X
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
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
  { id: 'verification', label: 'Verification Requests', icon: Shield, badge: 5 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'moderation', label: 'Content Moderation', icon: AlertCircle, badge: 3 },
  { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ activeSection, onSectionChange, onLogout, isMobileOpen = false, onMobileClose }: AdminSidebarProps) {

  const handleNavigation = (id: string) => {
    onSectionChange(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onMobileClose?.();
  };

  return (
    // 1. FIXED LAYOUT: Pinned to left, full height
    <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col h-screen text-slate-600 font-medium shadow-sm z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

      {/* --- FIXED UPPER SECTION (Does not scroll) --- */}
      <div className="flex-none flex flex-col">

        {/* Logo Area: Improved Alignment */}
        <div className="p-6 flex items-center gap-3 bg-white border-b border-slate-100">
          <img src={atharLogo} alt="Athar" className="w-10 h-10" />
          <div className="flex flex-col justify-center -mt-1">
            <span className="text-xl text-slate-800 tracking-wide font-bold leading-none">Athar</span>
            <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-role-admin-accent hover:bg-role-admin-accent-dark text-slate-900 text-[10px] px-1.5 h-4 border-none shadow-sm">Admin</Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin User Profile */}
        <div className="p-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Avatar className="w-10 h-10 border border-slate-300">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
              <AvatarFallback className="bg-role-admin-accent text-slate-900">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-slate-800 text-sm font-bold">Admin User</p>
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
                    // Active: Admin gold accent
                    ? 'bg-role-admin-accent text-slate-900 shadow-md hover:bg-role-admin-accent-dark'
                    // Inactive: Dark Slate text
                    : 'text-slate-600 hover:bg-slate-100 hover:text-role-admin-accent-dark'
                }`}
                onClick={() => handleNavigation(item.id)}
              >
                <Icon className={`mr-3 h-4 w-4 ${isActive ? "text-slate-900" : "text-slate-400 group-hover:text-role-admin-accent-dark"}`} />
                <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>

                {item.badge && (
                  <Badge className={`ml-2 text-xs font-bold border-none px-2 ${
                    isActive
                      ? "bg-white text-role-admin-accent-dark"
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
            className="w-full justify-start text-slate-600 hover:text-role-admin-accent-dark hover:bg-white border border-transparent hover:border-slate-200 transition-all h-10"
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:text-role-admin-accent-dark" />
          Logout
        </Button>
      </div>
    </aside>
  );
}