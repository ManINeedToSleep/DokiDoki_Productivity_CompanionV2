"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import QuickStats from '@/components/Dashboard/QuickStats';
import Goals from '@/components/Dashboard/Goals';
import CharacterProgression from '@/components/Dashboard/CharacterProgression';
import Achievements from '@/components/Dashboard/Achievements';
import { motion } from 'framer-motion';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { getCharacterDotColor } from '@/components/Common/CharacterColor/CharacterColor';
import ChatStats from '@/components/Chat/ChatStats';

export default function Dashboard() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      const fetchUserData = async () => {
        setIsLoadingData(true);
        try {
          const data = await getUserDocument(user.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchUserData();
    }
  }, [user, isLoading, router]);
  
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkaDotBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  const dotColor = getCharacterDotColor(selectedCompanion);
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      
      <main className="container mx-auto px-4 py-6">
        <motion.h1 
          className="text-2xl font-[Riffic] mb-6 text-center md:text-left"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            color: selectedCompanion === 'sayori' ? '#D76C95' : 
                   selectedCompanion === 'natsuki' ? '#D14D61' : 
                   selectedCompanion === 'yuri' ? '#6A61E0' : 
                   '#4A9B68'
          }}
        >
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <QuickStats userData={userData} />
            <Goals userData={userData} />
            <Achievements userData={userData} />
          </div>
          
          <div className="h-full flex flex-col">
            <div className="flex-grow">
              <CharacterProgression userData={userData} />
            </div>
          </div>
        </div>
        
        {/* Chat Stats for the selected companion */}
        <ChatStats
          companionId={selectedCompanion}
          className="mt-6"
        />
      </main>
    </div>
  );
}
