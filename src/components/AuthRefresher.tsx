'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signOut, getIdToken } from 'firebase/auth';

// This component helps with authentication token refreshing
// It automatically refreshes the token periodically to avoid permission issues
export default function AuthRefresher() {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  useEffect(() => {
    // Function to refresh the auth token
    const refreshToken = async () => {
      try {
        if (!auth.currentUser) {
          console.log('🔒 AuthRefresher: No current user found for token refresh');
          return;
        }
        
        console.log('🔄 AuthRefresher: Attempting to refresh token for user:', auth.currentUser.uid);
        
        // Get current token expiration time
        const currentToken = await auth.currentUser.getIdTokenResult();
        const expTime = new Date(currentToken.expirationTime);
        const timeUntilExp = expTime.getTime() - Date.now();
        
        console.log(`🔄 AuthRefresher: Current token expires in ${Math.round(timeUntilExp/60000)} minutes`);
        
        // Get a fresh token
        const token = await getIdToken(auth.currentUser, true);
        console.log('✅ AuthRefresher: Token refreshed successfully');
        
        // Get updated expiration time
        const newTokenData = await auth.currentUser.getIdTokenResult();
        const newExpTime = new Date(newTokenData.expirationTime);
        console.log(`🔄 AuthRefresher: New token expires at: ${newExpTime.toLocaleString()}`);
        
        setLastRefresh(new Date());
      } catch (error) {
        console.error('❌ AuthRefresher: Error refreshing auth token:', error);
        
        // If there's an auth error that can't be recovered, sign the user out
        if (error instanceof Error && 
            (error.message.includes('auth/network-request-failed') || 
             error.message.includes('auth/user-token-expired'))) {
          console.warn('⚠️ AuthRefresher: Auth error detected, signing user out for fresh login');
          await signOut(auth);
        }
      }
    };
    
    console.log('🔄 AuthRefresher: Component mounted, setting up refresh cycles');
    
    // Refresh token immediately on mount
    refreshToken();
    
    // Set up interval to refresh token every 30 minutes
    // This helps avoid permission issues with Firestore
    const intervalId = setInterval(() => {
      console.log('⏰ AuthRefresher: Running scheduled token refresh');
      refreshToken();
    }, 30 * 60 * 1000);
    
    // Also refresh after the app wakes up from sleep
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ AuthRefresher: App resumed from background, refreshing auth token');
        refreshToken();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log('🔄 AuthRefresher: Component unmounting, cleaning up listeners');
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
} 