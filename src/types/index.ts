export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  leetcodeUsername?: string;
  gfgUsername?: string;
  codeforcesId?: string;
  photoURL?: string;
  createdAt: string;
  consistencyDNA?: 'Consistent' | 'Burst coder' | 'Weekend coder' | 'Irregular';
}

export interface DailyStats {
  userId: string;
  date: string; // YYYY-MM-DD
  leetcodeSolved: number;
  gfgSolved: number;
  codeforcesSolved: number;
  totalSolved: number;
  points: number;
  streak: number;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalSolved: number;
  currentStreak: number;
  difficultyScore: number;
}
