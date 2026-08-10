import { useState } from 'react';
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

  const handleUserTypeSelection = (type: UserType) => {
    setUserType(type);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      {userType === 'volunteer' && (
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          onLogout={handleLogout} 
        />
      )}
      {userType === 'organization' && (
        <OrganizationSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          onLogout={handleLogout} 
        />
      )}
      {userType === 'admin' && (
        <AdminSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
            onLogout={handleLogout} 
        />
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto ml-64">
        <div className="min-h-full max-w-7xl mx-auto p-8">
          {userType === 'volunteer' && renderVolunteerContent()}
          {userType === 'organization' && renderOrganizationContent()}
          {userType === 'admin' && renderAdminContent()}
        </div>
      </main>

      <ChatbotWidget userType={userType} />

    </div>
  );
}