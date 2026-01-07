import {
  LayoutDashboard,
  Heart,
  Building2,
  GraduationCap,
  Search,
  CheckSquare,
  Bell,
  LogOut,
  User,
  Award,
  TrendingUp,
  Brain,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import atharLogo from "../assets/athar-logo.png";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void; // <--- ADDED THIS
}

const menuItems = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "crisis-response", label: "Crisis Response", icon: AlertTriangle, badge: 2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "skill-paths", label: "Skill Paths", icon: TrendingUp },
  { id: "training-simulator", label: "Training Simulator", icon: Brain },
  { id: "tasks", label: "My Tasks", icon: CheckSquare },
  { id: "causes", label: "Causes", icon: Heart },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "explore", label: "Explore Opportunities", icon: Search },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "certificates", label: "Certificates", icon: Award },
];

export function Sidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) { // <--- ADDED onLogout
  return (
    <aside className="fixed inset-y-0 left-0 w-64 h-screen bg-[#0f766e] flex flex-col shadow-2xl z-50 font-sans border-r border-[#115e59]">
      
      {/* --- FIXED UPPER SECTION (Header & Profile) --- */}
      <div className="flex-none flex flex-col">
        {/* 1. Header: Fixed Alignment */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <img src={atharLogo} alt="Athar" className="w-10 h-10 brightness-0 invert" />
            <div className="flex flex-col justify-center -mt-1">
              <span className="text-xl text-white tracking-wide font-bold leading-none">Athar</span>
              <span className="text-[10px] text-[#ccfbf1] font-bold tracking-widest uppercase mt-1">Volunteer Hub</span>
            </div>
          </div>
        </div>

        {/* 2. Glass Profile Card */}
        <div className="px-3 mb-2">
          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 hover:border-[#14b8a6]/50 transition-colors cursor-default backdrop-blur-sm">
            <Avatar className="w-9 h-9 border border-[#14b8a6]/50">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" />
              <AvatarFallback className="bg-[#14b8a6] text-white text-xs font-bold">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-white text-sm font-semibold tracking-tight">John Doe</p>
              <p className="text-[11px] text-teal-100 font-medium opacity-80">Development Hub</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
      </div>

      {/* --- SCROLLABLE MIDDLE SECTION (Hidden Scrollbar) --- */}
      <div className="flex-1 overflow-y-auto px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="space-y-1 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isCrisis = item.id === "crisis-response";

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onSectionChange(item.id)}
                className={`w-full justify-between group h-10 px-3 transition-all duration-200 rounded-lg mb-1 ${
                  isActive
                    ? "bg-[#14b8a6] text-white shadow-lg shadow-black/10 font-semibold"
                    : "text-teal-100 hover:bg-white/10 hover:text-white font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-[18px] w-[18px] transition-colors ${
                    isActive ? "text-white" : isCrisis ? "text-red-300" : "text-teal-200 group-hover:text-white"
                  }`} />
                  <span className="text-sm tracking-tight">{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className={`px-1.5 h-5 text-[10px] min-w-[20px] flex items-center justify-center rounded-full font-bold ${
                        isActive 
                        ? "bg-white text-[#0f766e]" 
                        : "bg-red-500 text-white"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3 w-3 text-white/70" />}
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* --- FIXED BOTTOM SECTION (Logout) --- */}
      <div className="flex-none p-4 border-t border-white/10 bg-[#0f766e]">
        <Button
          variant="ghost"
          onClick={onLogout} // <--- Connected here
          className="w-full justify-start text-teal-100 hover:bg-[#115e59] hover:text-white transition-all rounded-lg h-10 px-3 font-medium"
        >
          <LogOut className="mr-3 h-[18px] w-[18px]" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </aside>
  );
}