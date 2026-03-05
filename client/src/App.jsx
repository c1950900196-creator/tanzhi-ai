import { useState, useEffect } from 'react';
import { api } from './api';
import AuthScreen from './components/auth/AuthScreen';
import Onboarding from './components/onboarding/Onboarding';
import CardFeed from './components/feed/CardFeed';
import ChatScreen from './components/chat/ChatScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import TabBar from './components/layout/TabBar';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [mainTab, setMainTab] = useState('feed');
  const [userProfile, setUserProfile] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('tanzhi_token');
    if (!token) { setCurrentScreen('auth'); return; }
    api.getProfile().then(profile => {
      setUsername(profile.username);
      if (profile.role && profile.tags) {
        setUserProfile({ role: profile.role, tags: profile.tags });
        setCurrentScreen('main');
      } else {
        setCurrentScreen('onboarding');
      }
    }).catch(() => {
      localStorage.removeItem('tanzhi_token');
      setCurrentScreen('auth');
    });
  }, []);

  const handleAuthSuccess = (token, user) => {
    setUsername(user.username);
    if (user.role && user.tags) {
      setUserProfile({ role: user.role, tags: user.tags });
      setCurrentScreen('main');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingComplete = async (profile) => {
    setUserProfile(profile);
    setCurrentScreen('main');
    try { await api.updateProfile(profile.role, profile.tags); } catch {}
  };

  const handleOpenChat = (card) => { setActiveCard(card); setCurrentScreen('chat'); };
  const handleCloseChat = () => { setActiveCard(null); setCurrentScreen('main'); };

  const handleLogout = () => {
    localStorage.removeItem('tanzhi_token');
    setUserProfile(null);
    setUsername('');
    setCurrentScreen('auth');
  };

  if (currentScreen === 'loading') {
    return (
      <div className="w-full h-screen mx-auto bg-slate-100 sm:max-w-md md:border-x md:border-slate-300 shadow-2xl flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="探知" style={{ height: '48px', objectFit: 'contain', margin: '0 auto 12px' }} />
          <div className="text-slate-400 text-sm">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen mx-auto bg-slate-100 sm:max-w-md md:border-x md:border-slate-300 shadow-2xl relative">
      {currentScreen === 'auth' && <AuthScreen onAuthSuccess={handleAuthSuccess} />}
      {currentScreen === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}

      {currentScreen === 'main' && (
        <div className="h-full w-full relative">
          {mainTab === 'feed' && <CardFeed userProfile={userProfile} onOpenChat={handleOpenChat} />}
          {mainTab === 'profile' && <ProfileScreen userProfile={userProfile} username={username} onLogout={handleLogout} />}
          <TabBar activeTab={mainTab} onTabChange={setMainTab} onNewChat={() => handleOpenChat(null)} />
        </div>
      )}

      {currentScreen === 'chat' && <ChatScreen card={activeCard} onBack={handleCloseChat} />}
    </div>
  );
}
