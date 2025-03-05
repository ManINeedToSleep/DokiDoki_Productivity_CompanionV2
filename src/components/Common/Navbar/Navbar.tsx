"use client";

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Button from '@/components/Common/Button/Button';
import { useEffect, useState } from 'react';
import { getUserDocument } from '@/lib/firebase/user';
import { CompanionId } from '@/lib/firebase/companion';

const navItems = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Timer', path: '/dashboard/timer' },
  { label: 'Goals', path: '/dashboard/goals' },
  { label: 'Stats', path: '/dashboard/statistics' },
  { label: 'Chat', path: '/dashboard/chat' },
  { label: 'Companion', path: '/dashboard/companion' },
  { label: 'Achievements', path: '/dashboard/achievements' },
  { label: 'Settings', path: '/dashboard/settings' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>('sayori');
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userData = await getUserDocument(user.uid);
          if (userData?.settings?.selectedCompanion) {
            setSelectedCompanion(userData.settings.selectedCompanion);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);
  
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
