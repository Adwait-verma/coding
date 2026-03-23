import React, { useState, useEffect } from 'react';
import { UserProfile, Group, LeaderboardEntry, DailyStats } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Users, Plus, Search, Copy, CheckCircle2, User, Trophy, Flame, Target } from 'lucide-react';
import { cn } from '../lib/utils';

interface GroupsProps {
  profile: UserProfile;
}

export function Groups({ profile }: GroupsProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupLeaderboard, setGroupLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupId, setJoinGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(collection(db, 'groups'), where('members', 'array-contains', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setGroups(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile.uid]);

  useEffect(() => {
    if (!activeGroup) return;

    const fetchGroupLeaderboard = async () => {
      const leaderboardData: LeaderboardEntry[] = [];
      for (const memberId of activeGroup.members) {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', memberId)));
        if (!userDoc.empty) {
          const user = userDoc.docs[0].data() as UserProfile;
          const statsSnap = await getDocs(
            query(
              collection(db, 'stats', memberId, 'daily'),
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
      }
      setGroupLeaderboard(leaderboardData.sort((a, b) => b.currentStreak - a.currentStreak));
    };

    fetchGroupLeaderboard();
  }, [activeGroup]);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        ownerId: profile.uid,
        members: [profile.uid],
        isPublic: false,
        createdAt: new Date().toISOString(),
      });
      setNewGroupName('');
    } catch (error) {
      console.error("Failed to create group", error);
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinGroupId.trim()) return;
    setJoining(true);
    try {
      const groupRef = doc(db, 'groups', joinGroupId);
      await updateDoc(groupRef, {
        members: arrayUnion(profile.uid)
      });
      setJoinGroupId('');
    } catch (error) {
      console.error("Failed to join group", error);
    } finally {
      setJoining(false);
    }
  };

  const copyId = () => {
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
      <div className="md:col-span-1 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight">Coding Circles</h1>
          <p className="text-zinc-400">Join or create private groups with friends.</p>
        </header>

        <div className="space-y-4">
          <form onSubmit={createGroup} className="space-y-2">
            <div className="relative">
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Create new circle..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={creating || !newGroupName.trim()}
              className="w-full bg-emerald-500 text-black font-bold py-3 rounded-2xl hover:bg-emerald-400 transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Circle'}
            </button>
          </form>

          <div className="h-px bg-zinc-800 my-6" />

          <form onSubmit={joinGroup} className="space-y-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={joinGroupId}
                onChange={(e) => setJoinGroupId(e.target.value)}
                placeholder="Enter Circle ID to join..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={joining || !joinGroupId.trim()}
              className="w-full bg-zinc-800 text-white font-bold py-3 rounded-2xl hover:bg-zinc-700 transition-all disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Circle'}
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-4">Your Circles</h3>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
                activeGroup?.id === group.id ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{group.name}</p>
                  <p className="text-[10px] text-zinc-500">{group.members.length} Members</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        {activeGroup ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-full"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{activeGroup.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-zinc-500 text-xs font-mono">{activeGroup.id}</p>
                  <button onClick={copyId} className="text-zinc-500 hover:text-white transition-all">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Members</p>
                  <p className="text-white font-bold">{activeGroup.members.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Circle Leaderboard
              </h3>
              
              <div className="space-y-2">
                {groupLeaderboard.map((entry, index) => (
                  <div key={entry.uid} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl group hover:bg-zinc-800 transition-all">
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 font-bold w-4">#{index + 1}</span>
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                        {entry.photoURL ? (
                          <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-emerald-500 transition-all">{entry.displayName}</p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {entry.currentStreak}d</span>
                          <span className="flex items-center gap-1"><Target className="w-3 h-3 text-emerald-500" /> {entry.totalSolved} solved</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-500 font-bold">{entry.difficultyScore}</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl">
            <div className="p-6 bg-zinc-900 rounded-3xl mb-6">
              <Users className="w-12 h-12 text-zinc-700" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Select a Circle</h2>
            <p className="text-zinc-500 max-w-xs">Choose a coding circle from the sidebar or create a new one to start competing with friends.</p>
          </div>
        )}
      </div>
    </div>
  );
}
