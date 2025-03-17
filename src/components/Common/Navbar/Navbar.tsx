"use client";

import { usePathname, useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Button from '@/components/Common/Button/Button';
import { useEffect, useState } from 'react';
import { CompanionId } from '@/lib/firebase/companion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const navItems = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Timer', path: '/dashboard/timer' },
  { label: 'Goals', path: '/dashboard/goals' },
  { label: 'Stats', path: '/dashboard/statistics' },
  { label: 'Chat', path: '/chat' },
  { label: 'Achievements', path: '/dashboard/achievements' },
  { label: 'Settings', path: '/dashboard/settings' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>('sayori');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setSelectedCompanion('sayori');
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Listen for user document changes
  useEffect(() => {
    if (!userId) return;
    
    // Setup real-time listener for the user document
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData?.settings?.selectedCompanion) {
          setSelectedCompanion(userData.settings.selectedCompanion);
        }
      }
    }, (error) => {
      console.error('Error listening to user document:', error);
    });
    
    return () => unsubscribe();
  }, [userId]);
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <nav className="bg-white shadow-md py-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Navigation buttons on the left */}
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                label={item.label}
                onClick={() => router.push(item.path)}
                companionId={selectedCompanion}
                className={`px-3 py-1 text-sm ${
                  pathname === item.path ? 'font-semibold' : 'font-normal'
                }`}
              />
            ))}
          </div>
          
          {/* Sign out button on the right */}
          <Button
            label="Sign Out"
            onClick={handleSignOut}
            companionId={selectedCompanion}
            className="px-3 py-1 text-sm"
          />
        </div>
      </div>
    </nav>
  );
}
