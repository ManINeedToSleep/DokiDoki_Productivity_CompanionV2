"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthStateListener } from '@/lib/stores/authStore';
import { CompanionId } from '@/lib/firebase/companion';

export function useAuth() {
  // Initialize auth state listener
  useAuthStateListener();
  
  const router = useRouter();
  const { 
    user, 
    isLoading, 
    error, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    logout, 
    clearError 
  } = useAuthStore();

  // Enhanced authentication methods with navigation
  const enhancedSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      if (!useAuthStore.getState().error) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const enhancedSignUp = async (email: string, password: string, companionId: CompanionId) => {
    try {
      await signUpWithEmail(email, password, companionId);
      if (!useAuthStore.getState().error) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Sign up error:', error);
    }
  };

  const enhancedGoogleSignIn = async (companionId: CompanionId) => {
    try {
      await signInWithGoogle(companionId);
      if (!useAuthStore.getState().error) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const enhancedLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Redirect to dashboard if already authenticated
  const redirectIfAuthenticated = (path = '/dashboard') => {
    useEffect(() => {
      if (user && !isLoading) {
        router.push(path);
      }
    }, [user, isLoading, router, path]);
  };

  // Redirect to login if not authenticated
  const requireAuth = (path = '/auth') => {
    useEffect(() => {
      if (!user && !isLoading) {
        router.push(path);
      }
    }, [user, isLoading, router, path]);
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    signIn: enhancedSignIn,
    signUp: enhancedSignUp,
    signInWithGoogle: enhancedGoogleSignIn,
    logout: enhancedLogout,
    clearError,
    redirectIfAuthenticated,
    requireAuth
  };
} 