"use client";

import { useState, useEffect } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import Image from 'next/image';
import SettingsSection from './SettingsSection';
import Button from '@/components/Common/Button/Button';
import { CompanionId } from '@/lib/firebase/companion';
import { getCompanionChibiPath } from '@/components/Common/Paths/ImagePath';
import { UserDocument, updateSelectedCompanion } from '@/lib/firebase/user';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { useChatStore } from '@/lib/stores/chatStore';

interface CompanionSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function CompanionSettings({ userData, companionId }: CompanionSettingsProps) {
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>(companionId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Get the sync function from the chat store
  const { syncWithFirebase } = useChatStore();
  
  // Check for changes when selected companion changes
  useEffect(() => {
    setHasChanges(selectedCompanion !== companionId);
  }, [selectedCompanion, companionId]);
  
  const handleSaveChanges = async () => {
    if (!userData || !hasChanges) return;
    
    setIsUpdating(true);
    
    try {
      // First, update the selected companion in the database
      await updateSelectedCompanion(userData.base.uid, selectedCompanion);
      
      // Then, make sure any unsaved chat data is synced with Firebase
      await syncWithFirebase(userData.base.uid, true);
      
      // After syncing, clear the chat store from localStorage
      localStorage.removeItem('chatStore');
      
      // Navigate to the chat page to load new companion's chat
      window.location.href = '/dashboard/chat';
    } catch (error) {
      console.error('Error updating selected companion:', error);
      setIsUpdating(false);
    }
  };
  
  const companions: CompanionId[] = ['sayori', 'natsuki', 'yuri', 'monika'];
  
  return (
    <SettingsSection
      title="Companion Selection"
      description="Choose your productivity companion"
      companionId={companionId}
      icon={<FaUserFriends size={20} />}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {companions.map((id) => {
          const isSelected = selectedCompanion === id;
          const colors = getCharacterColors(id);
          const name = id.charAt(0).toUpperCase() + id.slice(1);
          
          return (
            <div 
              key={id}
              className={`
                relative rounded-lg p-4 cursor-pointer transition-all duration-200
                flex flex-col items-center justify-center
                border-2 shadow-sm
                ${isSelected ? 'transform scale-105' : 'hover:scale-105 hover:bg-opacity-80'}
              `}
              style={{ 
                borderColor: isSelected ? colors.primary : 'transparent',
                backgroundColor: isSelected ? `${colors.primary}15` : 'rgba(255, 255, 255, 0.5)',
              }}
              onClick={() => setSelectedCompanion(id)}
            >
              <div 
                className={`
                  w-20 h-20 mb-2 rounded-full overflow-hidden
                  border-2 ${isSelected ? 'shadow-md' : ''}
                  transition-all duration-200
                `}
                style={{ 
                  borderColor: colors.primary 
                }}
              >
                <Image
                  src={getCompanionChibiPath(id)}
                  alt={name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 
                className="font-[Riffic] text-center text-lg"
                style={{ color: isSelected ? colors.heading : 'gray' }}
              >
                {name}
              </h3>
              
              {userData.companions[id] && (
                <p className="text-sm text-gray-600 mt-1 font-[Halogen]">
                  Level {Math.floor((userData.companions[id].affinityLevel || 0) / 100) + 1}
                </p>
              )}
              
              {isSelected && (
                <div 
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
                  style={{ color: colors.primary }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end">
        <Button
          label="Save Selection"
          onClick={handleSaveChanges}
          disabled={isUpdating || !hasChanges}
          companionId={companionId}
        />
      </div>
    </SettingsSection>
  );
} 