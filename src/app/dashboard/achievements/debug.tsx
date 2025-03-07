"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { debugAchievementState } from '@/lib/firebase/achievements';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function DebugAchievements() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  // Override console.log for debugging
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);
    const logMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    setLogs(prev => [...prev, logMessage]);
  };

  const handleDebug = async () => {
    if (!user) return;

    try {
      setStatus('loading');
      setMessage('Debugging achievement state...');
      setLogs([]);
      
      await debugAchievementState(user.uid);
      
      setStatus('success');
      setMessage('Achievement debugging complete!');
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Restore original console.log on unmount
  React.useEffect(() => {
    // Reset console.log on cleanup
    return () => {
      console.log = originalConsoleLog;
    };
  }, [originalConsoleLog]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-4 py-10">
        <motion.div 
          className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-[Riffic] mb-4 text-pink-500 text-center">
            Achievement Debugging Tool
          </h1>
          
          <p className="text-gray-600 mb-6 text-center font-[Halogen]">
            This utility will help diagnose issues with your achievements.
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={handleDebug}
              className="bg-pink-500 hover:bg-pink-600 text-white font-[Halogen] py-2 px-4 rounded-lg transition duration-200"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Debugging...' : 'Debug Achievements'}
            </button>
            
            <button
              onClick={() => router.push('/dashboard/achievements/cleanup')}
              className="bg-purple-500 hover:bg-purple-600 text-white font-[Halogen] py-2 px-4 rounded-lg transition duration-200"
            >
              Cleanup Duplicates
            </button>
            
            <button
              onClick={() => router.push('/dashboard/achievements')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-[Halogen] py-2 px-4 rounded-lg transition duration-200"
            >
              Return to Achievements
            </button>
          </div>

          {logs.length > 0 && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap mb-1">
                  {log}
                </div>
              ))}
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 font-[Halogen] mb-4">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-500 font-[Halogen] mb-4">{message}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 