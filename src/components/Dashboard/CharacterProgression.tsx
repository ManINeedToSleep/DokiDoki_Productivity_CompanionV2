"use client";

import { FaArrowRight } from 'react-icons/fa';
import { UserDocument } from '@/lib/firebase/user';
import { CompanionMood } from '@/lib/firebase/companion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCompanionImagePath } from '@/components/Common/Paths/ImagePath';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface CharacterProgressionProps {
  userData: UserDocument | null;
}

export default function CharacterProgression({ userData }: CharacterProgressionProps) {
  const router = useRouter();
  
  if (!userData) return null;
  
  const selectedCompanion = userData.settings.selectedCompanion || 'sayori';
  
  // Get character-specific colors
  const colors = getCharacterColors(selectedCompanion);
  
  // Get companion data - companions is an object with companionId keys, not an array
  const companion = userData.companions?.[selectedCompanion];
  
  // Calculate affinity level (1-10)
  const affinityLevel = companion?.affinityLevel ? Math.min(10, Math.floor(companion.affinityLevel / 100) + 1) : 1;
  
  // Calculate progress to next level (0-100)
  const affinityProgress = companion?.affinityLevel ? (companion.affinityLevel % 100) : 0;
  
  // Get friendship status based on affinity level
  const getFriendshipStatus = (level: number): string => {
    switch(level) {
      case 1: return "Acquaintance";
      case 2: return "Classmate";
      case 3: return "Buddy";
      case 4: return "Good Friend";
      case 5: return "Close Friend";
      case 6: return "Best Friend";
      case 7: return "Trusted Confidant";
      case 8: return "Soul Friend";
      case 9: return "Lifelong Friend";
      case 10: return "Inseparable Friends";
      default: return "Acquaintance";
    }
  };
  
  const friendshipStatus = getFriendshipStatus(affinityLevel);
  
  // Format last interaction time
  const lastInteraction = companion?.lastInteraction?.toDate();
  const formattedLastInteraction = lastInteraction 
    ? new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(lastInteraction)
    : 'Never';
  
  // Get companion mood
  const companionMood = companion?.mood || 'happy';
  
  // Format mood for display
  const formatMood = (mood: CompanionMood): string => {
    return mood.charAt(0).toUpperCase() + mood.slice(1);
  };
  
  // Get character image path
  const characterImagePath = getCompanionImagePath(selectedCompanion);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 
          className="text-lg font-[Riffic]"
          style={{ color: colors.heading }}
        >
          Your Companion
        </h2>
        <button 
          className="text-xs flex items-center gap-1 font-[Halogen]"
          style={{ color: colors.text }}
          onClick={() => router.push('/dashboard/chat')}
        >
          Chat <FaArrowRight size={10} />
        </button>
      </div>
      
      {/* Character display section - now much taller */}
      <div className="flex-grow mb-4 relative min-h-[400px]">
        {/* Direct image display instead of CompanionDisplay */}
        <div className="h-full w-full flex items-center justify-center relative">
          <Image
            src={characterImagePath}
            alt={selectedCompanion}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      {/* Stats section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 
              className="text-base font-[Riffic] capitalize"
              style={{ color: colors.text }}
            >
              {selectedCompanion}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full font-[Halogen]" style={{
              backgroundColor: colors.secondary,
              color: colors.text
            }}>
              Mood: {formatMood(companionMood)}
            </span>
          </div>
          
          {/* Friendship status */}
          <div className="mb-3 text-center">
            <span className="px-3 py-1 rounded-full text-sm font-[Halogen]" style={{
              backgroundColor: colors.primary,
              color: 'white'
            }}>
              {friendshipStatus}
            </span>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-700 font-[Halogen]">Affinity Level {affinityLevel}</span>
              <span className="text-xs text-gray-700 font-[Halogen]">
                {affinityLevel < 10 ? `${affinityProgress}/100 to Level ${affinityLevel + 1}` : 'Max Level!'}
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ 
                  width: `${affinityProgress}%`,
                  backgroundColor: colors.progress
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-700 font-[Halogen]">
            Last interaction: {formattedLastInteraction}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded-lg">
            <div className="text-xs text-gray-700 font-[Halogen]">Sessions Together</div>
            <div 
              className="text-lg font-medium"
              style={{ color: colors.text }}
            >
              {companion?.stats?.sessionsCompleted || 0}
            </div>
          </div>
          <div className="bg-white p-2 rounded-lg">
            <div className="text-xs text-gray-700 font-[Halogen]">Focus Minutes</div>
            <div 
              className="text-lg font-medium"
              style={{ color: colors.text }}
            >
              {companion?.stats?.totalInteractionTime ? Math.floor(companion.stats.totalInteractionTime / 60) : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 