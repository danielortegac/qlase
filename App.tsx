
import React, { useState, useEffect } from 'react';
import { User, Course } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CourseView from './components/CourseView';
import LanguageHub from './components/LanguageHub';
import Marketplace from './components/Marketplace';
import StudentsManager from './components/StudentsManager';
import ResearchHub from './components/ResearchHub';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView'; 
import Messages from './components/Messages';
import PublicDiplomaView from './components/PublicDiplomaView';
import PublicPublicationView from './components/PublicPublicationView';
import PublicMarketplaceCourseView from './components/PublicMarketplaceCourseView';
import { DatabaseService } from './services/db';
import './services/firebase';

const SUPER_ADMIN_EMAILS = ['deoc29@me.com', 'vaoc93@hotmail.com'];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [targetChatUser, setTargetChatUser] = useState<User | null>(null);

  // DETECCIÓN DE VISTAS PÚBLICAS (RUTA EXTERNA)
  const params = new URLSearchParams(window.location.search);
  const viewType = params.get('view');
  const itemId = params.get('id');

  useEffect(() => {
      DatabaseService.initializeSystem();
  }, []);

  // Si hay un parámetro de vista pública, renderizamos el sitio correspondiente sin pedir Login
  if (viewType === 'marketplace_course' && itemId) {
      return <PublicMarketplaceCourseView id={itemId} />;
  }
  if (viewType === 'diploma' && itemId) {
      return <PublicDiplomaView id={itemId} />;
  }
  if (viewType === 'research' && itemId) {
      return <PublicPublicationView id={itemId} />;
  }

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    setActiveCourse(null);
  };

  const handleSubscribe = async () => {
    if (user) {
      const updatedUser = { ...user, isPremium: true };
      await DatabaseService.updateUserProfile(updatedUser);
      setUser(updatedUser);
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
  };

  const handleCourseSelect = (course: Course) => {
    setActiveCourse(course);
    setCurrentView('course_detail');
  };
  
  const handleNavigateToChat = (targetUser: User) => {
      setTargetChatUser(targetUser);
      setCurrentView('messages');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase().trim());

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} onCourseSelect={handleCourseSelect} />;
      case 'profile':
        return <ProfileView user={user} onUpdateUser={handleUpdateUser} />;
      case 'marketplace':
        return <Marketplace user={user} onUpdateUser={handleUpdateUser} />;
      case 'research':
        return <ResearchHub user={user} />;
      case 'students_manage':
        if (!isSuperAdmin) return <Dashboard user={user} onCourseSelect={handleCourseSelect} />;
        return <StudentsManager onNavigateToChat={handleNavigateToChat}/>;
      case 'languages':
        return <LanguageHub user={user} onSubscribe={handleSubscribe} />;
      case 'messages':
        return <Messages currentUser={user} initialChatUser={targetChatUser} />;
      case 'course_detail':
        if (!activeCourse) return <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4"><p className="text-xl font-bold">Sin curso seleccionado.</p><button onClick={() => setCurrentView('dashboard')} className="px-6 py-2 bg-white text-black rounded-lg font-bold">Volver</button></div>;
        return <CourseView course={activeCourse} user={user} onBack={() => { setActiveCourse(null); setCurrentView('dashboard'); }} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard user={user} onCourseSelect={handleCourseSelect} />;
    }
  };

  return (
    <Layout user={user} currentView={currentView} onChangeView={(view) => { setCurrentView(view); if(view !== 'course_detail') setActiveCourse(null); if(view !== 'messages') setTargetChatUser(null); }} onLogout={handleLogout} onNavigateToCourse={handleCourseSelect}>
      {renderContent()}
    </Layout>
  );
};

export default App;
