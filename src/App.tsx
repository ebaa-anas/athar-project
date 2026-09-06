import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { MyProfile } from './components/MyProfile';
import { Messages } from './components/Messages'; 
import { Causes } from './components/Causes';
import { Organizations } from './components/Organizations';
import { Courses } from './components/Courses';
import { Certificates } from './components/Certificates';
import { ExploreOpportunities } from './components/ExploreOpportunities';
import { MyTasks } from './components/MyTasks';
import { Notifications } from './components/Notifications';
import { SkillPaths } from './components/SkillPaths';
import { TrainingSimulator } from './components/TrainingSimulator';
import { CrisisResponse } from './components/CrisisResponse';
import { LoginSignup } from './components/LoginSignup';
import { LandingPage } from './components/LandingPage';
import { OrganizationSidebar } from './components/organization/OrganizationSidebar';
import { OrganizationOverview } from './components/organization/OrganizationOverview';
import { ManageOpportunities } from './components/organization/ManageOpportunities';
import { ManageVolunteers } from './components/organization/ManageVolunteers';
import { OrganizationProfile } from './components/organization/OrganizationProfile';
import { Applications } from './components/organization/Applications';
import { Events } from './components/organization/Events';
import { Reports } from './components/organization/Reports';

import { OrganizationNotifications } from './components/organization/OrganizationNotifications';
import { OrganizationSettings } from './components/organization/OrganizationSettings';
import { CrisisManagement } from './components/organization/CrisisManagement';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminOverview } from './components/admin/AdminOverview';
import VerificationRequests from './components/admin/VerificationRequests';
import { UserManagement } from './components/admin/UserManagement';
import { ContentModeration } from './components/admin/ContentModeration';
import { PlatformAnalytics } from './components/admin/PlatformAnalytics';
import { AdminSettings } from './components/admin/AdminSettings';
import { OrganizationMessages } from './components/organization/OrganizationMessages';

import ChatbotWidget from './chatbot/ChatbotWidget';

type UserType = 'volunteer' | 'organization' | 'admin' | null;

export default function App() {
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // True until Firebase tells us whether a persisted session exists. Without
  // this gate a logged-in user briefly sees the landing page on every refresh.
  const [authChecking, setAuthChecking] = useState(true);

  // Restore a persisted session on load. Firebase keeps the auth session in the
  // browser, but App used to track isLoggedIn/userType in plain useState only,
  // so every refresh dropped the user back to the landing page. This reads the
  // session once on mount; interactive login/logout stays with the handlers
  // below, so a wrong-portal login attempt still shows its error in place.
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe(); // one-shot: only used for the initial session restore
      if (!cancelled && firebaseUser) {
        try {
          const nametag = await getDoc(doc(db, 'users', firebaseUser.uid));
          const role = nametag.exists() ? (nametag.data().role as UserType) : null;
          if (!cancelled && (role === 'volunteer' || role === 'organization' || role === 'admin')) {
            setUserType(role);
            setIsLoggedIn(true);
          }
        } catch (err) {
          console.error('Session restore failed:', err);
        }
      }
      if (!cancelled) setAuthChecking(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleUserTypeSelection = (type: UserType) => {
    setUserType(type);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      // Actually end the Firebase session so it does not come back on refresh.
      // The old handler only reset local state, leaving the session alive.
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
    setIsLoggedIn(false);
    setUserType(null);
    setActiveSection('overview');
  };

  const renderVolunteerContent = () => {
    switch (activeSection) {
      case 'overview': return <OverviewDashboard onNavigate={setActiveSection} />;
      case 'profile': return <MyProfile />;
      case 'messages': return <Messages />;
      case 'skill-paths': return <SkillPaths />;
      case 'training-simulator': return <TrainingSimulator />;
      case 'crisis-response': return <CrisisResponse />;
      case 'causes': return <Causes />;
      case 'organizations': return <Organizations />;
      case 'courses': return <Courses />;
      case 'certificates': return <Certificates />;
      case 'explore': return <ExploreOpportunities />;
      case 'tasks': return <MyTasks />;
      case 'notifications': return <Notifications />;
      default: return <OverviewDashboard />;
    }
  };

  const renderOrganizationContent = () => {
    switch (activeSection) {
      case 'profile': return <OrganizationProfile />;
      case 'overview': return <OrganizationOverview />;
      case 'crisis-management': return <CrisisManagement />;
      case 'messages': return <OrganizationMessages />; 
      case 'opportunities': return <ManageOpportunities />;
      case 'volunteers': return <ManageVolunteers />;
      case 'applications': return <Applications />;
      case 'events': return <Events />;
      case 'reports': return <Reports />;
      case 'notifications': return <OrganizationNotifications />;
      case 'settings': return <OrganizationSettings />;
      default: return <OrganizationOverview />;
    }
  };

  const renderAdminContent = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverview />;
      case 'verification': return <VerificationRequests />;
      case 'users': return <UserManagement />;
      case 'moderation': return <ContentModeration />;
      case 'analytics': return <PlatformAnalytics />;
      case 'settings': return <AdminSettings />;
      default: return <AdminOverview />;
    }
  };

  // Wait for Firebase to report whether a session was restored before deciding
  // what to render, otherwise a logged-in user flashes the landing page on load.
  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  if (!userType) {
    return (
      <>
        <LandingPage onSelectUserType={handleUserTypeSelection} />
        <ChatbotWidget userType={userType} />
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginSignup onLogin={handleLogin} userType={userType} onClose={handleLogout} />
        <ChatbotWidget userType={userType} />
      </>
    );
  }

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const mobileTopBarAccent =
    userType === 'volunteer' ? 'text-role-volunteer' :
    userType === 'organization' ? 'text-role-org' :
    'text-role-admin-accent-dark';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Mobile nav backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {userType === 'volunteer' && (
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
          isMobileOpen={isMobileNavOpen}
          onMobileClose={closeMobileNav}
        />
      )}
      {userType === 'organization' && (
        <OrganizationSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
          isMobileOpen={isMobileNavOpen}
          onMobileClose={closeMobileNav}
        />
      )}
      {userType === 'admin' && (
        <AdminSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onLogout={handleLogout}
            isMobileOpen={isMobileNavOpen}
            onMobileClose={closeMobileNav}
        />
      )}

      {/* Main content. min-w-0 lets this flex child actually shrink instead of
          being widened by wide descendants (tables, fixed-width panes);
          overflow-x-clip is a safety net so nothing can force a horizontal
          page scroll. `clip` (not `hidden`) keeps the sticky top bar working. */}
      <main className="flex-1 min-w-0 overflow-x-clip overflow-y-auto lg:ml-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className={`-ml-1 p-2 rounded-md hover:bg-slate-100 ${mobileTopBarAccent}`}
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-bold text-slate-700">Athar</span>
        </div>

        <div className="min-h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {userType === 'volunteer' && renderVolunteerContent()}
          {userType === 'organization' && renderOrganizationContent()}
          {userType === 'admin' && renderAdminContent()}
        </div>
      </main>

      <ChatbotWidget userType={userType} />

    </div>
  );
}