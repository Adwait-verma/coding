import React from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Code2, Github, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl">
            <Code2 className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">CodeSync</h1>
        <p className="text-zinc-400 mb-8">Track your coding consistency with friends across platforms.</p>
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-2xl hover:bg-zinc-200 transition-all"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>
          
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-zinc-400 font-semibold py-4 rounded-2xl opacity-50 cursor-not-allowed"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub (Coming Soon)
          </button>
        </div>
        
        <p className="mt-8 text-xs text-zinc-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
