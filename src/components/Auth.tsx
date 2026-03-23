import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Code2, Github, Chrome, AlertCircle, ExternalLink, User, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const { login } = useAuth();
  const [handles, setHandles] = useState({
    leetcode: '',
    gfg: '',
    codeforces: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handles.leetcode && !handles.gfg && !handles.codeforces) {
      setError("Please enter at least one platform handle to continue.");
      return;
    }

    setLoading(true);
    try {
      await login(handles);
    } catch (err: any) {
      setError("Failed to connect. Please check your handles and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl">
            <Code2 className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">CodeSync</h1>
          <p className="text-zinc-400">Enter your platform handles to sync your progress.</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
              LeetCode Handle
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. adwait_verma"
                value={handles.leetcode}
                onChange={(e) => setHandles(prev => ({ ...prev, leetcode: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
              GeeksforGeeks Handle
            </label>
            <div className="relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. vermaadwait7"
                value={handles.gfg}
                onChange={(e) => setHandles(prev => ({ ...prev, gfg: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
              Codeforces Handle
            </label>
            <div className="relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. tourist"
                value={handles.codeforces}
                onChange={(e) => setHandles(prev => ({ ...prev, codeforces: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all mt-4 shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Connecting...' : 'Start Syncing'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-zinc-500">
          Your data is fetched from public platform APIs.
        </p>
      </motion.div>
    </div>
  );
}
