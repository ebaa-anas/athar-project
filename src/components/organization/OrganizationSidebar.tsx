import { useState, useEffect } from 'react';
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
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import atharLogo from "../../assets/athar-logo.png";
import { useUserProfile } from '../../hooks/useUserProfile';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from "../../lib/firebase"; 

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  verifiedOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'profile', label: 'Organization Profile', icon: Building2 },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'crisis-management', label: 'Crisis Management', icon: AlertTriangle, verifiedOnly: true },
  { id: "messages", label: "Mission Comms", icon: MessageSquare }, 
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'volunteers', label: 'Volunteers', icon: Users },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function OrganizationSidebar({
  activeSection,
  onSectionChange,
  onLogout,
  isMobileOpen = false,
  onMobileClose
}: SidebarProps) {
  const { user } = useUserProfile();
  
  const [pendingAppsCount, setPendingAppsCount] = useState<number>(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Pending applications
    const appsRef = collection(db, 'applications');
    const appsQuery = query(
      appsRef, 
      where('organizationId', '==', user.uid), 
      where('status', '==', 'pending')
    );
    
    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      setPendingAppsCount(snapshot.size);
    });

    // Unread notifications
    const notifsRef = collection(db, 'notifications');
    const notifsQuery = query(
      notifsRef, 
      where('organizationId', '==', user.uid), 
      where('read', '==', false)
    );
    
    const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
      setUnreadNotifsCount(snapshot.size);
    });

    return () => {
      unsubscribeApps();
      unsubscribeNotifs();
    };
  }, [user?.uid]);

  // Crisis management is only visible to tier3 orgs
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.id === 'crisis-management') {
      return user?.tier === 'tier3';
    }
    return true; 
  });

  const isVerified = user?.verified === true;

  const handleNavigation = (id: string) => {
    onSectionChange(id);
    onMobileClose?.();
  };

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 h-screen bg-role-org flex flex-col shadow-2xl z-50 font-sans transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

      {/* Fixed upper section */}
      <div className="flex-none flex flex-col">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-3">
              <img src={atharLogo} alt="Athar" className="w-10 h-10 brightness-0 invert" />
              <div className="flex flex-col justify-center -mt-1">
                <span className="text-xl text-white tracking-wide font-bold leading-none">Athar</span>
                <span className="text-[10px] text-role-accent-teal font-bold tracking-widest uppercase mt-1">Partner Portal</span>
              </div>
              <button
                type="button"
                onClick={onMobileClose}
                className="ml-auto p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
          </div>
        </div>

        <div className="px-3 mb-2">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-role-accent-teal/50 transition-colors cursor-default backdrop-blur-sm">
            <Avatar className="w-9 h-9 border border-role-accent-teal/50">
              <AvatarImage src={user?.photoURL || "https://images.unsplash.com/photo-1557683316-973673baf926?w=100&h=100&fit=crop"} />
              <AvatarFallback className="bg-role-accent-teal text-white text-xs font-bold">ORG</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-white text-sm font-semibold tracking-tight">
                {user?.name || user?.orgName || "Organization"}
              </p>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </span>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {isVerified ? 'Verified Active' : 'Audit Pending'}
                  </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </div>

      {/* Scrollable middle section */}
      <div className="flex-1 overflow-y-auto px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="space-y-1 py-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isCrisis = item.id === 'crisis-management';

            let displayBadge = null;
            if (item.id === 'applications' && pendingAppsCount > 0) {
              displayBadge = pendingAppsCount;
            }
            if (item.id === 'notifications' && unreadNotifsCount > 0) {
              displayBadge = unreadNotifsCount;
            }

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleNavigation(item.id)}
                className={`w-full justify-between group h-10 px-3 transition-all duration-200 rounded-lg mb-1 ${
                  isActive
                    ? "bg-role-accent-teal text-white shadow-lg shadow-black/20 font-medium" 
                    : "text-slate-300 hover:bg-white/5 hover:text-white" 
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-[18px] w-[18px] ${
                    isActive ? "text-white" : isCrisis ? "text-brand-cta" : "text-slate-400 group-hover:text-white"
                  }`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {displayBadge !== null && (
                    <Badge className={`px-1.5 h-5 text-[10px] min-w-[20px] justify-center border-none ${
                        isActive 
                        ? "bg-white text-role-accent-teal font-bold" 
                        : "bg-brand-cta text-white font-bold"
                    }`}>
                        {displayBadge}
                    </Badge>
                    )}
                    {isActive && <ChevronRight className="h-3 w-3 text-white/50" />}
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Fixed bottom section */}
      <div className="flex-none p-4 border-t border-white/5 bg-role-org-dark/30">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-slate-400 hover:bg-brand-cta hover:text-white transition-all rounded-lg h-10 px-3"
        >
          <LogOut className="mr-3 h-[18px] w-[18px]" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}