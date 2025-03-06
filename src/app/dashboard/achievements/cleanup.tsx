"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { cleanupDuplicateAchievements } from '@/lib/firebase/achievements';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CleanupAchievements() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCleanup = async () => {
    if (!user) return;

    try {
      setStatus('loading');
      setMessage('Cleaning up duplicate achievements...');
      
      await cleanupDuplicateAchievements(user.uid);
      
      setStatus('success');
      setMessage('Successfully cleaned up duplicate achievements! You can now go back to your achievements page.');
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
          className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-[Riffic] mb-4 text-pink-500 text-center">
            Achievements Cleanup Utility
          </h1>
          
          <p className="text-gray-600 mb-6 text-center font-[Halogen]">
            This utility will remove duplicate achievements from your profile.
          </p>

          {status === 'idle' && (
            <button
              onClick={handleCleanup}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-[Halogen] py-2 px-4 rounded-lg transition duration-200"
            >
              Clean Up Duplicate Achievements
            </button>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-[Halogen]">{message}</p>
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
              <button
                onClick={() => router.push('/dashboard/achievements')}
                className="bg-pink-500 hover:bg-pink-600 text-white font-[Halogen] py-2 px-4 rounded-lg transition duration-200"
              >
                Return to Achievements
              </button>
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
              <button
                onClick={handleCleanup}
                className="bg-pink-500 hover:bg-pink-600 text-white font-[Halogen] py-2 px-4 rounded-lg transition duration-200"
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 