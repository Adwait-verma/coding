import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { UserProfile, DailyStats, LeaderboardEntry } from '../types';
import { motion } from 'motion/react';
import { Trophy, Flame, Target, Search, User, Medal } from 'lucide-react';
import { cn } from '../lib/utils';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'streak' | 'solved' | 'points'>('streak');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => doc.data() as UserProfile);
        
        const leaderboardData: LeaderboardEntry[] = [];
        
        for (const user of users) {
          const statsSnap = await getDocs(
            query(
              collection(db, 'stats', user.uid, 'daily'),
              orderBy('date', 'desc'),
              limit(1)
            )
          );
          
          if (!statsSnap.empty) {
            const latestStat = statsSnap.docs[0].data() as DailyStats;
            leaderboardData.push({
              uid: user.uid,
              displayName: user.displayName,
              photoURL: user.photoURL,
              totalSolved: latestStat.totalSolved,
              currentStreak: latestStat.streak,
              difficultyScore: latestStat.points,
            });
          }
        }
        
        setEntries(leaderboardData);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const sortedEntries = [...entries]
    .filter(e => e.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'streak') return b.currentStreak - a.currentStreak;
      if (sortBy === 'solved') return b.totalSolved - a.totalSolved;
      return b.difficultyScore - a.difficultyScore;
    });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
          <p className="text-zinc-400">Global rankings among all CodeSync users.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full md:w-64 bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
      </header>

      <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl w-fit">
        {[
          { id: 'streak', label: 'Streak', icon: Flame },
          { id: 'solved', label: 'Solved', icon: Target },
          { id: 'points', label: 'Points', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSortBy(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              sortBy === tab.id ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Streak</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Solved</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sortedEntries.map((entry, index) => (
                <motion.tr 
                  key={entry.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-zinc-800/50 transition-all group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Medal className="w-5 h-5 text-yellow-500" />}
                      {index === 1 && <Medal className="w-5 h-5 text-zinc-400" />}
                      {index === 2 && <Medal className="w-5 h-5 text-orange-600" />}
                      <span className={cn(
                        "font-bold",
                        index < 3 ? "text-white" : "text-zinc-500"
                      )}>
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                        {entry.photoURL ? (
                          <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <span className="font-bold text-white group-hover:text-emerald-500 transition-all">{entry.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-500 font-bold">
                      <Flame className="w-4 h-4" />
                      {entry.currentStreak}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-white">
                    {entry.totalSolved}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">
                      {entry.difficultyScore} pts
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedEntries.length === 0 && !loading && (
          <div className="p-12 text-center">
            <p className="text-zinc-500">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
