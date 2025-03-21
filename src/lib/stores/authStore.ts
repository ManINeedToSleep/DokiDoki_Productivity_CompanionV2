import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserDocument } from '@/lib/firebase/user';
import { CompanionId } from '@/lib/firebase/companion';
import { useEffect } from 'react';
import Cookies from 'js-cookie';

export type AuthMode = 'signin' | 'signup';

export interface AuthError {
  code: string;
  message: string;
}

export const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Email already in use. Try logging in instead.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'default': 'Something went wrong. Please try again.'
} as const;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, companionId: CompanionId) => Promise<void>;
  signInWithGoogle: (companionId: CompanionId) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const { user } = await signInWithEmailAndPassword(auth, email, password);
          const token = await user.getIdToken();
          Cookies.set('firebase-session', token, { expires: 7 });
          set({ user });
        } catch (error: unknown) {
          const authError = error as AuthError;
          set({ 
            error: AUTH_ERROR_MESSAGES[authError.code as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default 
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      signUpWithEmail: async (email: string, password: string, companionId: CompanionId) => {
        try {
          set({ isLoading: true, error: null });
          const { user } = await createUserWithEmailAndPassword(auth, email, password);
          await createUserDocument(user.uid, user.email!, companionId);
          const token = await user.getIdToken();
          Cookies.set('firebase-session', token, { expires: 7 });
          set({ user });
        } catch (error: unknown) {
          const authError = error as AuthError;
          set({ 
            error: AUTH_ERROR_MESSAGES[authError.code as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default 
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      signInWithGoogle: async (companionId: CompanionId) => {
        try {
          set({ isLoading: true, error: null });
          const provider = new GoogleAuthProvider();
          const { user } = await signInWithPopup(auth, provider);
          await createUserDocument(user.uid, user.email!, companionId);
          const token = await user.getIdToken();
          Cookies.set('firebase-session', token, { expires: 7 });
          set({ user });
        } catch (error: unknown) {
          const authError = error as AuthError;
          set({ 
            error: AUTH_ERROR_MESSAGES[authError.code as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default 
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          await signOut(auth);
          Cookies.remove('firebase-session');
          set({ user: null });
        } catch (error: unknown) {
          const authError = error as AuthError;
          set({ 
            error: AUTH_ERROR_MESSAGES[authError.code as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default 
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Hook to listen for auth state changes
export function useAuthStateListener() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        Cookies.set('firebase-session', token, { expires: 7 });
      } else {
        Cookies.remove('firebase-session');
      }
      useAuthStore.setState({ user });
    });
    
    return () => unsubscribe();
  }, []);
} 