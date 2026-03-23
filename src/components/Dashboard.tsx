import React, { useEffect, useState } from 'react';
import { UserProfile, DailyStats } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, orderBy, limit, updateDoc } from 'firebase/firestore';
import { fetchLeetCodeStats, fetchGFGStats, fetchCodeforcesStats } from '../services/api';
import { formatDate, cn, calculateConsistencyDNA } from '../lib/utils';
import { motion } from 'motion/react';
import { Flame, Target, Trophy, TrendingUp, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  profile: UserProfile;
}

export function Dashboard({ profile }: DashboardProps) {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (!profile.uid) return;

    const q = query(
      collection(db, 'stats', profile.uid, 'daily'),
      orderBy('date', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as DailyStats);
      setStats(data.reverse());
      
      // Calculate streak
      let streak = 0;
      const today = formatDate(new Date());
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      if (sorted.length > 0) {
        if (sorted[0].date === today || sorted[0].date === yesterday) {
          for (let i = 0; i < sorted.length; i++) {
            if (i > 0) {
              const d1 = new Date(sorted[i-1].date);
              const d2 = new Date(sorted[i].date);
              const diff = (d1.getTime() - d2.getTime()) / 86400000;
              if (diff <= 1 && sorted[i].totalSolved > 0) {
                streak++;
              } else {
                break;
              }
            } else if (sorted[i].totalSolved > 0) {
              streak++;
            }
          }
        }
      }
      setCurrentStreak(streak);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile.uid]);

  const updateStats = async () => {
    if (!profile.leetcodeUsername && !profile.gfgUsername && !profile.codeforcesId) return;
    setUpdating(true);
    try {
      let lcData = { totalSolved: 0 };
      let gfgData = { totalSolved: 0 };
      let cfData = { totalSolved: 0 };

      if (profile.leetcodeUsername) {
        lcData = await fetchLeetCodeStats(profile.leetcodeUsername);
      }
      if (profile.gfgUsername) {
        gfgData = await fetchGFGStats(profile.gfgUsername);
      }
      if (profile.codeforcesId) {
        cfData = await fetchCodeforcesStats(profile.codeforcesId);
      }

      const today = formatDate(new Date());
      const totalSolved = (lcData.totalSolved || 0) + (gfgData.totalSolved || 0) + (cfData.totalSolved || 0);
      
      // Points calculation: Easy=1, Medium=2, Hard=3 (Simplified for now)
      const points = totalSolved * 2; 

      const statDoc: DailyStats = {
        userId: profile.uid,
        date: today,
        leetcodeSolved: lcData.totalSolved || 0,
        gfgSolved: gfgData.totalSolved || 0,
        codeforcesSolved: cfData.totalSolved || 0,
        totalSolved,
        points,
        streak: currentStreak,
      };

      await setDoc(doc(db, 'stats', profile.uid, 'daily', today), statDoc);

      // Update Consistency DNA
      const allStats = [...stats, statDoc];
      const dna = calculateConsistencyDNA(allStats);
      if (dna !== profile.consistencyDNA) {
        await updateDoc(doc(db, 'users', profile.uid), { consistencyDNA: dna });
      }
    } catch (error) {
      console.error("Failed to update stats", error);
    } finally {
      setUpdating(false);
    }
  };

  const streakRisk = currentStreak > 0 ? (stats.find(s => s.date === formatDate(new Date()))?.totalSolved ? 'Low' : 'High') : 'None';

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {profile.displayName}</h1>
          <p className="text-zinc-400 text-sm">Track your progress and stay consistent.</p>
        </div>
        <button 
          onClick={updateStats}
          disabled={updating}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-5 h-5 text-emerald-500", updating && "animate-spin")} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Current Streak</p>
              <h2 className="text-3xl font-bold text-white">{currentStreak} Days</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
              streakRisk === 'Low' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            )}>
              {streakRisk} Risk
            </span>
            <span className="text-zinc-500 text-[10px]">Resets at 12:00 AM</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Total Solved</p>
              <h2 className="text-3xl font-bold text-white">
                {stats.length > 0 ? stats[stats.length - 1].totalSolved : 0}
              </h2>
            </div>
          </div>
          <p className="text-zinc-500 text-xs">Across all connected platforms</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <Trophy className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Consistency DNA</p>
              <h2 className="text-3xl font-bold text-white">{profile.consistencyDNA || 'Analyzing...'}</h2>
            </div>
          </div>
          <p className="text-zinc-500 text-xs">Based on your activity patterns</p>
        </motion.div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Activity Trend</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-zinc-400">LeetCode</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span className="text-zinc-400">GFG</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-zinc-400">Codeforces</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="colorLc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={10} 
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis stroke="#71717a" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="leetcodeSolved" stroke="#10b981" fillOpacity={1} fill="url(#colorLc)" />
              <Area type="monotone" dataKey="gfgSolved" stroke="#6366f1" fillOpacity={0.1} fill="#6366f1" />
              <Area type="monotone" dataKey="codeforcesSolved" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-white mb-4">Platform Connections</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <span className="text-orange-500 font-bold">LC</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{profile.leetcodeUsername || 'Not Connected'}</p>
                  <p className="text-[10px] text-zinc-500">LeetCode Profile</p>
                </div>
              </div>
              {profile.leetcodeUsername && (
                <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 text-zinc-500 hover:text-white" />
                </a>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-500 font-bold">GFG</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{profile.gfgUsername || 'Not Connected'}</p>
                  <p className="text-[10px] text-zinc-500">GeeksforGeeks Profile</p>
                </div>
              </div>
              {profile.gfgUsername && (
                <a href={`https://www.geeksforgeeks.org/user/${profile.gfgUsername}/`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 text-zinc-500 hover:text-white" />
                </a>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <span className="text-blue-500 font-bold">CF</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{profile.codeforcesId || 'Not Connected'}</p>
                  <p className="text-[10px] text-zinc-500">Codeforces Profile</p>
                </div>
              </div>
              {profile.codeforcesId && (
                <a href={`https://codeforces.com/profile/${profile.codeforcesId}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 text-zinc-500 hover:text-white" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-white mb-4">Consistency Heatmap</h3>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => {
              const date = formatDate(new Date(Date.now() - (27 - i) * 86400000));
              const dayStat = stats.find(s => s.date === date);
              const solved = dayStat?.totalSolved || 0;
              return (
                <div 
                  key={i}
                  title={`${date}: ${solved} solved`}
                  className={cn(
                    "aspect-square rounded-sm transition-all",
                    solved === 0 ? "bg-zinc-800" :
                    solved < 3 ? "bg-emerald-900" :
                    solved < 6 ? "bg-emerald-700" :
                    "bg-emerald-500"
                  )}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-zinc-500">
            <span>Last 4 weeks</span>
            <div className="flex gap-1 items-center">
              <span>Less</span>
              <div className="w-2 h-2 bg-zinc-800 rounded-sm" />
              <div className="w-2 h-2 bg-emerald-900 rounded-sm" />
              <div className="w-2 h-2 bg-emerald-700 rounded-sm" />
              <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
