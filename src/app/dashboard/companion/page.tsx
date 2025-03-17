"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { CompanionId, CompanionData, getCompanionData, getCompanionGreeting } from '@/lib/firebase/companion';
import { getUserDocument } from '@/lib/firebase/user';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaHeart, FaClock, FaCalendarAlt, FaTrophy, FaArrowLeft, FaCog } from 'react-icons/fa';

// Visual Novel style background component with pattern overlay
const VisualNovelBackground = ({ companionId }: { companionId: CompanionId }) => {
  // Each character has their signature background and colors
  const backgroundMap = {
    'sayori': '/images/backgrounds/classroom-morning.jpg',
    'natsuki': '/images/backgrounds/kitchen.jpg', 
    'yuri': '/images/backgrounds/library.jpg',
    'monika': '/images/backgrounds/classroom-afternoon.jpg'
  };
  
  // Each character gets their own pattern color
  const patternColorMap = {
    'sayori': 'rgba(255, 192, 203, 0.3)', // Pink
    'natsuki': 'rgba(255, 182, 193, 0.3)', // Light pink
    'yuri': 'rgba(209, 207, 255, 0.3)', // Light purple
    'monika': 'rgba(197, 232, 209, 0.3)' // Light green
  };
  
  const background = backgroundMap[companionId] || backgroundMap.sayori;
  const patternColor = patternColorMap[companionId] || patternColorMap.sayori;
  
  return (
    <div className="fixed inset-0 z-0">
      {/* Base background image */}
      <Image 
        src={background}
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/30" />
      
      {/* Pattern overlay - hearts or other patterns using CSS */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundImage: `
            radial-gradient(${patternColor} 10%, transparent 10%),
            radial-gradient(${patternColor} 10%, transparent 10%)
          `,
          backgroundPosition: '0 0, 30px 30px',
          backgroundSize: '60px 60px',
          opacity: 0.6
        }}
      />
      
      {/* Additional overlay for better contrast with text */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
};

// Stats card component for companion
const CompanionStatsCard = ({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string 
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3">
      <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-600 font-[Halogen]">{title}</p>
        <p className="font-[Halogen] font-bold" style={{ color }}>{value}</p>
      </div>
    </div>
  );
};

// Styled button for visual novel UI
const VNButton = ({ 
  children, 
  onClick, 
  color, 
  className = '' 
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  color: string,
  className?: string 
}) => {
  return (
    <motion.button
      className={`${className} py-2 px-4 bg-white/80 backdrop-blur-sm rounded-md shadow-md flex items-center justify-center hover:brightness-105 active:brightness-95 transition-all`}
      style={{ color, border: `2px solid ${color}` }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

// Dialogue option component
const DialogueOption = ({ 
  text, 
  onClick, 
  color 
}: { 
  text: string, 
  onClick: () => void, 
  color: string 
}) => {
  return (
    <motion.button
      className="w-full p-3 text-left mb-2 rounded-md bg-white/80 backdrop-blur-sm border-2 shadow-md"
      style={{ borderColor: color }}
      whileHover={{ scale: 1.02, x: 5, backgroundColor: `rgba(255, 255, 255, 0.9)` }}
      onClick={onClick}
    >
      <p className="font-[Halogen]" style={{ color }}>
        {text}
      </p>
    </motion.button>
  );
};

// Function to get friendship title based on affinity level
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

export default function CompanionDashboard() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [companionData, setCompanionData] = useState<CompanionData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [greeting, setGreeting] = useState<string>("");
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  
  // Generic dialogue options - these would ideally come from a dialogue system
  const [dialogueOptions] = useState<{text: string, response: string}[]>([
    { text: "How are you today?", response: "I'm doing great! Thanks for asking. How about you?" },
    { text: "Tell me about yourself.", response: "I'd love to! What would you like to know?" },
    { text: "Let's focus together!", response: "That sounds perfect! I'm ready when you are." }
  ]);
  
  // State to track selected dialogue option
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  
  // Set initial companionId to handle loading state
  const [companionId, setCompanionId] = useState<CompanionId>('sayori');
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          // Get user data
          const userDoc = await getUserDocument(user.uid);
          
          if (userDoc?.settings?.selectedCompanion) {
            const selectedId = userDoc.settings.selectedCompanion;
            setCompanionId(selectedId);
            
            // Get companion data
            const companion = await getCompanionData(user.uid, selectedId);
            setCompanionData(companion);
            
            // Get greeting
            const greetingText = await getCompanionGreeting(user.uid, selectedId);
            setGreeting(greetingText);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchData();
    }
  }, [user, isLoading, router]);
  
  // Handle dialogue option click
  const handleDialogueOptionClick = (response: string) => {
    setSelectedResponse(response);
    
    // In a real implementation, you might want to:
    // 1. Update affinity level
    // 2. Progress the dialogue tree
    // 3. Update companion mood
    // 4. Unlock special events
  };
  
  // Handle the back button click
  const handleBackClick = () => {
    router.push('/dashboard');
  };
  
  // Calculate affinity level and progress
  const affinityLevel = companionData?.affinityLevel 
    ? Math.min(10, Math.floor(companionData.affinityLevel / 100) + 1) 
    : 1;
  const affinityProgress = companionData?.affinityLevel 
    ? (companionData.affinityLevel % 100) 
    : 0;
  const friendshipStatus = getFriendshipStatus(affinityLevel);
  
  // Get character colors
  const colors = getCharacterColors(companionId);
  
  // Format stats for display
  const focusMinutes = companionData?.stats?.totalInteractionTime 
    ? Math.floor(companionData.stats.totalInteractionTime / 60) 
    : 0;
  const sessionsCompleted = companionData?.stats?.sessionsCompleted || 0;
  const goalsCompleted = companionData?.stats?.goalsCompleted || 0;
  const consecutiveDays = companionData?.stats?.consecutiveDays || 0;
  
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading companion data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Visual Novel Background */}
      <VisualNovelBackground companionId={companionId} />
      
      <div className="container mx-auto pt-4 px-4 flex flex-col flex-grow z-10 relative">
        {/* Top navigation bar */}
        <div className="flex justify-between items-center mb-6">
          {/* Back button - styled like the first reference */}
          <motion.div
            className="flex items-center justify-center w-14 h-14 bg-blue-400 text-white rounded-md shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackClick}
          >
            <FaArrowLeft size={24} />
          </motion.div>
          
          {/* Character name - like in the first reference */}
          <div className="flex-grow mx-4">
            <h1 
              className="text-4xl font-bold text-left"
              style={{ 
                color: colors.primary,
                textShadow: '2px 2px 4px rgba(255, 255, 255, 0.7)',
                fontFamily: 'Riffic, sans-serif'
              }}
            >
              {companionId.toUpperCase()}
            </h1>
          </div>
          
          {/* Settings button - like the first reference */}
          <motion.div
            className="flex items-center justify-center w-14 h-14 bg-green-400 text-white rounded-md shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard/settings')}
          >
            <FaCog size={24} />
          </motion.div>
        </div>
        
        {/* Main content area */}
        <div className="flex-grow flex flex-col">
          {/* Character display - centered and larger */}
          <motion.div 
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative h-[450px] w-full max-w-md">
              <Image
                src={`/images/characters/sprites/${companionId}-happy.png`}
                alt={companionId}
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
          
          {/* Friendship status badge - displayed over character */}
          <div className="flex justify-center -mt-4 mb-2">
            <div 
              className="px-4 py-1 rounded-full text-white text-sm shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              {friendshipStatus} • Level {affinityLevel}
            </div>
          </div>
          
          {/* Stats toggle button */}
          <div className="flex justify-center mb-2">
            <button
              className="text-sm px-3 py-1 rounded-full bg-white/60 shadow-sm"
              style={{ color: colors.text }}
              onClick={() => setShowStatsPanel(!showStatsPanel)}
            >
              {showStatsPanel ? 'Hide Stats' : 'Show Stats'}
            </button>
          </div>
          
          {/* Stats panel - collapsible */}
          {showStatsPanel && (
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md">
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span style={{ color: colors.text }}>Affinity</span>
                    <span style={{ color: colors.text }}>
                      {affinityLevel < 10 ? `${affinityProgress}/100 to Level ${affinityLevel + 1}` : 'Max Level!'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full"
                      style={{ 
                        width: `${affinityProgress}%`,
                        backgroundColor: colors.primary
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <CompanionStatsCard 
                    title="Focus Minutes" 
                    value={focusMinutes}
                    icon={<FaClock />}
                    color={colors.text}
                  />
                  <CompanionStatsCard 
                    title="Sessions" 
                    value={sessionsCompleted}
                    icon={<FaCalendarAlt />}
                    color={colors.text}
                  />
                  <CompanionStatsCard 
                    title="Goals Completed" 
                    value={goalsCompleted}
                    icon={<FaTrophy />}
                    color={colors.text}
                  />
                  <CompanionStatsCard 
                    title="Streak Days" 
                    value={consecutiveDays}
                    icon={<FaHeart />}
                    color={colors.text}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Dialogue section - more like visual novel style at bottom */}
        <div className="mt-auto pb-4">
          {/* Main dialogue box */}
          <div 
            className="relative bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-md mb-3 border-2"
            style={{ 
              borderColor: colors.primary,
              minHeight: '100px'
            }}
          >
            {/* Character name tag */}
            <div 
              className="absolute -top-4 left-5 px-4 py-1 rounded-md font-bold text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {companionId.charAt(0).toUpperCase() + companionId.slice(1)}
            </div>
            
            {/* Dialogue text */}
            <p 
              className="text-lg mt-2"
              style={{ color: colors.text, fontFamily: 'Halogen, sans-serif' }}
            >
              {selectedResponse || greeting}
            </p>
            
            {/* Dialogue controls (like in 2nd reference) */}
            <div className="flex justify-end space-x-2 mt-3 text-xs">
              <span className="text-gray-500">History</span>
              <span className="text-gray-500">Skip</span>
              <span className="text-gray-500">Auto</span>
              <span className="text-gray-500">Save</span>
              <span className="text-gray-500">Load</span>
              
              {/* Continue indicator */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="ml-2"
              >
                <span style={{ color: colors.primary }}>▼</span>
              </motion.div>
            </div>
          </div>
          
          {/* Dialogue options */}
          {!selectedResponse && (
            <div className="space-y-2">
              {dialogueOptions.map((option, index) => (
                <DialogueOption 
                  key={index} 
                  text={option.text} 
                  color={colors.primary} 
                  onClick={() => handleDialogueOptionClick(option.response)}
                />
              ))}
            </div>
          )}
          
          {/* Action buttons */}
          {selectedResponse && (
            <div className="flex justify-center space-x-4 mt-4">
              <VNButton 
                color={colors.primary}
                onClick={() => setSelectedResponse(null)}
              >
                Continue
              </VNButton>
              <VNButton 
                color={colors.primary}
                onClick={() => router.push('/dashboard/timer')}
              >
                Focus Together
              </VNButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
