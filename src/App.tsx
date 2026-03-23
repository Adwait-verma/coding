import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { Groups } from './components/Groups';
import { Auth } from './components/Auth';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 md:flex">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      
      <main className="flex-1 p-4 pb-24 md:pb-4 md:h-screen md:overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && profile && <Dashboard profile={profile} />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'profile' && profile && <Profile profile={profile} />}
          {activeTab === 'groups' && profile && <Groups profile={profile} />}
        </div>
      </main>
    </div>
  );
}
