"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getUserDocument, UserDocument } from '@/lib/firebase/user';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { useAuthStore } from '@/lib/stores/authStore';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterDotColor, getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import CompanionSettings from '@/components/Settings/CompanionSettings';
import TimerSettings from '@/components/Settings/TimerSettings';
import DataSettings from '@/components/Settings/DataSettings';

export default function SettingsPage() {
  const { user, isLoading } = useAuthStore();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  useEffect(() => {
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
  }, [user]);
  
  if (isLoading || isLoadingData || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkaDotBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  const dotColor = getCharacterDotColor(selectedCompanion as CompanionId);
  const colors = getCharacterColors(selectedCompanion as CompanionId);
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <motion.h1 
          className="text-2xl font-[Riffic] mb-6 text-center md:text-left"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: colors.heading }}
        >
          Settings
        </motion.h1>
        
        <div className="grid grid-cols-1 gap-6">
          <CompanionSettings 
            userData={userData} 
            companionId={selectedCompanion as CompanionId}
          />
          
          <TimerSettings 
            userData={userData} 
            companionId={selectedCompanion as CompanionId}
          />
          
          <DataSettings 
            userData={userData} 
            companionId={selectedCompanion as CompanionId}
          />
        </div>
      </main>
    </div>
  );
}
