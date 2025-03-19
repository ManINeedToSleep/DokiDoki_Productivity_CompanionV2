"use client";

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';

export default function AuthRefresher() {
  useEffect(() => {
    const refreshToken = async () => {
      if (!auth.currentUser) return;

      try {
        const tokenResult = await auth.currentUser.getIdTokenResult();
        const expTime = new Date(tokenResult.expirationTime);
        const timeUntilExp = expTime.getTime() - Date.now();

        // Force refresh token if it's close to expiring (less than 5 minutes)
        if (timeUntilExp < 5 * 60 * 1000) {
          console.log('⚠️ Token expiring soon, forcing refresh');
          await auth.currentUser.getIdToken(true);
          console.log('✅ Token force-refreshed successfully');
        }
      } catch (error) {
        console.error('❌ Error refreshing auth token:', error);
      }
    };

    // Initial check
    refreshToken();

    // Set up interval to check token every 4 minutes
    const interval = setInterval(refreshToken, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
} 