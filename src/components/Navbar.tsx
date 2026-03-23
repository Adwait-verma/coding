import React from 'react';
import { Layout, Trophy, Users, User, LogOut, Code2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export function Navbar({ activeTab, setActiveTab, user }: NavbarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-2 md:relative md:border-t-0 md:border-r md:h-screen md:w-64 md:flex-col md:justify-start z-50">
      <div className="hidden md:flex items-center gap-2 px-4 py-8 mb-8">
        <Code2 className="w-8 h-8 text-emerald-500" />
        <span className="text-xl font-bold text-white tracking-tight">CodeSync</span>
      </div>
      
      <div className="flex justify-around md:flex-col md:gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all md:flex-row md:gap-3 md:px-4 md:py-3",
              activeTab === item.id 
                ? "text-emerald-500 bg-emerald-500/10" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium md:text-sm">{item.label}</span>
          </button>
        ))}
        
        {user && (
          <button
            onClick={() => signOut(auth)}
            className="hidden md:flex items-center gap-3 px-4 py-3 mt-auto text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}
