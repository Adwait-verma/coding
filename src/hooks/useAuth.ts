import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUid = localStorage.getItem('codesync_uid');
    if (storedUid) {
      fetchProfile(storedUid);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (uid: string) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
        setUser({ uid });
      } else {
        localStorage.removeItem('codesync_uid');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      localStorage.removeItem('codesync_uid');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (handles: { leetcode?: string; gfg?: string; codeforces?: string }) => {
    setLoading(true);
    const uid = handles.leetcode || handles.gfg || handles.codeforces || `user_${Date.now()}`;
    
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      let currentProfile: UserProfile;

      if (userDoc.exists()) {
        currentProfile = {
          ...(userDoc.data() as UserProfile),
          leetcodeUsername: handles.leetcode || (userDoc.data() as UserProfile).leetcodeUsername,
          gfgUsername: handles.gfg || (userDoc.data() as UserProfile).gfgUsername,
          codeforcesId: handles.codeforces || (userDoc.data() as UserProfile).codeforcesId,
        };
      } else {
        currentProfile = {
          uid,
          displayName: uid,
          email: '',
          leetcodeUsername: handles.leetcode,
          gfgUsername: handles.gfg,
          codeforcesId: handles.codeforces,
          createdAt: new Date().toISOString(),
        };
      }

      await setDoc(userDocRef, currentProfile);
      localStorage.setItem('codesync_uid', uid);
      setProfile(currentProfile);
      setUser({ uid });
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('codesync_uid');
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, login, logout };
}
