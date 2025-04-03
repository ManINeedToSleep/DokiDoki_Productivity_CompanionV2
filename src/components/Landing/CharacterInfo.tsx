"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { imagePaths } from '@/components/Common/Paths/ImagePath';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { useAudio } from "@/lib/contexts/AudioContext";

// Character profiles data
const characterProfiles = {
  sayori: {
    fullName: "Sayori",
    age: "18",
    height: "157 cm (5'2\")",
    birthday: "April 22nd",
    bloodType: "O",
    likes: ["Sunshine", "Cookies", "Making others happy", "Colorful things"],
    dislikes: ["Rainy days", "Disappointment", "Being a burden"],
    personality: "Cheerful, caring, and optimistic. Sayori has an innate ability to see the good in people and situations. While she struggles with her own rainclouds sometimes, her positive outlook makes her an excellent support for your productivity.",
    productivityStyle: "Motivation-driven and reward-based. Sayori works best with positive reinforcement and celebrates small wins."
  },
  natsuki: {
    fullName: "Natsuki",
    age: "18",
    height: "149 cm (4'11\")",
    birthday: "August 3rd",
    bloodType: "A",
    likes: ["Baking", "Manga", "Cute things", "Being taken seriously"],
    dislikes: ["Being patronized", "Dishonesty", "Overly complex instructions"],
    personality: "Direct, spirited, and determined. Beneath her tough exterior, Natsuki is incredibly dedicated and detail-oriented. She values honesty and straightforwardness in all interactions.",
    productivityStyle: "Task-oriented and structured. Natsuki prefers clear goals and direct feedback, focusing on completing tasks efficiently."
  },
  yuri: {
    fullName: "Yuri",
    age: "18",
    height: "165 cm (5'5\")",
    birthday: "December 12th",
    bloodType: "AB",
    likes: ["Reading", "Tea", "Complex ideas", "Deep focus"],
    dislikes: ["Loud environments", "Rushed decisions", "Superficiality"],
    personality: "Thoughtful, intelligent, and introspective. Yuri has a rich inner world and appreciates depth and meaning. She's methodical and careful in her approach to tasks and relationships.",
    productivityStyle: "Deep-focus oriented and analytical. Yuri excels at complex problem-solving and thorough research."
  },
  monika: {
    fullName: "Monika",
    age: "18",
    height: "160 cm (5'3\")",
    birthday: "September 22nd",
    bloodType: "B",
    likes: ["Literature", "Piano", "Leadership", "Self-improvement"],
    dislikes: ["Limitations", "Being ignored", "Lack of control"],
    personality: "Confident, ambitious, and adaptable. Monika is a natural leader with excellent organizational skills. She has a balanced approach to life and values continuous improvement.",
    productivityStyle: "Goal-oriented and strategic. Monika excels at planning and optimizing workflows for maximum efficiency."
  }
};

interface CharacterInfoProps {
  selectedCharacter: CompanionId;
}

export default function CharacterInfo({ selectedCharacter }: CharacterInfoProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'productivity'>('profile');
  const characterColors = getCharacterColors(selectedCharacter);
  const profile = characterProfiles[selectedCharacter];
  const { playSoundEffect } = useAudio();
  
  const handleTabChange = (tab: 'profile' | 'productivity') => {
    if (tab !== activeTab) {
      playSoundEffect('select');
      setActiveTab(tab);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-xl border-2 overflow-hidden shadow-lg" 
      style={{ borderColor: characterColors.primary }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Character image - left side */}
        <div className="col-span-1 relative h-80 md:h-full overflow-hidden bg-gradient-to-b from-white/30 to-white/10">
          <Image
            src={imagePaths.characterSprites[selectedCharacter]}
            alt={selectedCharacter}
            fill
            className="object-contain p-4"
          />
          <div className="absolute bottom-0 left-0 right-0 py-2 text-center font-[Riffic] text-white text-xl"
            style={{ backgroundColor: characterColors.primary }}>
            {profile.fullName}
          </div>
        </div>
        
        {/* Character info - right side */}
        <div className="col-span-2 p-4">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`py-2 px-4 font-[Riffic] border-b-2 transition-colors ${activeTab === 'profile' ? 'border-opacity-100' : 'border-transparent hover:text-opacity-75'}`}
              style={{ 
                color: characterColors.primary,
                borderColor: activeTab === 'profile' ? characterColors.primary : 'transparent'
              }}
              onClick={() => handleTabChange('profile')}
              onMouseEnter={() => playSoundEffect('hover')}
            >
              Character Profile
            </button>
            <button
              className={`py-2 px-4 font-[Riffic] border-b-2 transition-colors ${activeTab === 'productivity' ? 'border-opacity-100' : 'border-transparent hover:text-opacity-75'}`}
              style={{ 
                color: characterColors.primary,
                borderColor: activeTab === 'productivity' ? characterColors.primary : 'transparent'
              }}
              onClick={() => handleTabChange('productivity')}
              onMouseEnter={() => playSoundEffect('hover')}
            >
              Productivity Style
            </button>
          </div>
          
          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Age" value={profile.age} color={characterColors} />
                  <InfoItem label="Height" value={profile.height} color={characterColors} />
                  <InfoItem label="Birthday" value={profile.birthday} color={characterColors} />
                  <InfoItem label="Blood Type" value={profile.bloodType} color={characterColors} />
                </div>
                
                <div className="mt-4">
                  <h3 className="text-lg font-[Riffic]" style={{ color: characterColors.primary }}>Likes</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.likes.map((like, index) => (
                      <motion.span 
                        key={index}
                        className="px-3 py-1 rounded-full text-sm text-white shadow-sm flex items-center"
                        style={{ 
                          backgroundColor: characterColors.primary,
                          fontFamily: 'Halogen, sans-serif'
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        onMouseEnter={() => playSoundEffect('hover')}
                      >
                        <span className="mr-1">♥</span> {like}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-lg font-[Riffic]" style={{ color: characterColors.primary }}>Dislikes</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.dislikes.map((dislike, index) => (
                      <motion.span 
                        key={index}
                        className="px-3 py-1 rounded-full text-sm border shadow-sm flex items-center"
                        style={{ 
                          color: characterColors.primary,
                          borderColor: characterColors.primary,
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          fontFamily: 'Halogen, sans-serif'
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        onMouseEnter={() => playSoundEffect('hover')}
                      >
                        <span className="mr-1">×</span> {dislike}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-lg font-[Riffic]" style={{ color: characterColors.primary }}>Personality</h3>
                  <p className="mt-2 text-gray-700 font-[Halogen] leading-relaxed p-3 bg-white/70 rounded-lg" 
                    style={{ borderLeft: `3px solid ${characterColors.primary}` }}>
                    {profile.personality}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="productivity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div 
                  className="p-4 rounded-lg shadow-sm overflow-hidden relative"
                  style={{ 
                    background: `linear-gradient(135deg, ${characterColors.secondary} 0%, white 100%)`,
                    borderLeft: `3px solid ${characterColors.primary}`
                  }}
                >
                  {/* Background pattern */}
                  <div 
                    className="absolute inset-0 opacity-5" 
                    style={{ 
                      backgroundImage: `
                        radial-gradient(${characterColors.primary} 10%, transparent 11%),
                        radial-gradient(${characterColors.primary} 10%, transparent 11%)
                      `,
                      backgroundSize: '10px 10px',
                      backgroundPosition: '0 0, 5px 5px'
                    }}
                  />
                
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-[Riffic] mb-2" style={{ color: characterColors.primary }}>
                      Productivity Approach
                    </h3>
                    <p className="text-gray-700 font-[Halogen] leading-relaxed">{profile.productivityStyle}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-lg font-[Riffic] mb-2" style={{ color: characterColors.primary }}>
                    Works Best With
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedCharacter === 'sayori' && (
                      <>
                        <ProductivityItem text="Pomodoro technique with frequent short breaks" color={characterColors} />
                        <ProductivityItem text="Visual progress trackers with rewards" color={characterColors} />
                        <ProductivityItem text="Collaborative environments" color={characterColors} />
                        <ProductivityItem text="Positive reinforcement systems" color={characterColors} />
                      </>
                    )}
                    {selectedCharacter === 'natsuki' && (
                      <>
                        <ProductivityItem text="Clear, structured to-do lists" color={characterColors} />
                        <ProductivityItem text="Short, focused work sprints" color={characterColors} />
                        <ProductivityItem text="Direct approach to problem-solving" color={characterColors} />
                        <ProductivityItem text="Concrete, tangible results" color={characterColors} />
                      </>
                    )}
                    {selectedCharacter === 'yuri' && (
                      <>
                        <ProductivityItem text="Extended deep work sessions" color={characterColors} />
                        <ProductivityItem text="Detailed research and planning" color={characterColors} />
                        <ProductivityItem text="Quiet, distraction-free environments" color={characterColors} />
                        <ProductivityItem text="Complex, intellectually stimulating tasks" color={characterColors} />
                      </>
                    )}
                    {selectedCharacter === 'monika' && (
                      <>
                        <ProductivityItem text="Strategic planning and organization" color={characterColors} />
                        <ProductivityItem text="Goal-setting frameworks (OKRs, SMART goals)" color={characterColors} />
                        <ProductivityItem text="Progress tracking and analytics" color={characterColors} />
                        <ProductivityItem text="Adaptive, flexible scheduling" color={characterColors} />
                      </>
                    )}
                  </ul>
                </div>
                
                <div 
                  className="mt-4 p-4 rounded-lg shadow-sm relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, white 0%, ${characterColors.secondary} 100%)`,
                    borderLeft: `3px solid ${characterColors.primary}`
                  }}
                >
                  <h3 className="text-lg font-[Riffic] mb-2" style={{ color: characterColors.primary }}>
                    Motivation Quote
                  </h3>
                  <blockquote 
                    className="p-3 bg-white/70 rounded-lg italic text-gray-700 relative z-10 font-[Halogen]"
                    style={{ borderLeft: `3px solid ${characterColors.primary}` }}
                  >
                    {selectedCharacter === 'sayori' && 
                      "Every small step forward deserves celebration! Let's make productivity joyful, one task at a time!"}
                    {selectedCharacter === 'natsuki' && 
                      "Don't overthink it. Break it down, get it done, and move on to the next thing. Simple is efficient!"}
                    {selectedCharacter === 'yuri' && 
                      "True productivity comes from deep focus and understanding. Take the time to fully immerse yourself in your work."}
                    {selectedCharacter === 'monika' && 
                      "Success is about consistency and smart planning. I'll help you organize your goals for maximum efficiency!"}
                  </blockquote>
                  
                  {/* Subtle quote marks in background */}
                  <div 
                    className="absolute right-4 bottom-4 text-6xl opacity-10 font-serif"
                    style={{ color: characterColors.primary }}
                  >
                    &quot;
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Helper component for profile info
const InfoItem = ({ label, value, color }: { 
  label: string; 
  value: string; 
  color: ReturnType<typeof getCharacterColors>;
}) => {
  const { playSoundEffect } = useAudio();
  
  return (
    <motion.div 
      className="bg-white p-3 rounded-lg shadow-sm hover:shadow transition-all overflow-hidden relative"
      style={{ 
        borderLeft: `3px solid ${color.primary}`,
        background: `linear-gradient(to right, ${color.secondary}, white)`
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      onMouseEnter={() => playSoundEffect('hover')}
    >
      {/* Background pattern for visual interest */}
      <div 
        className="absolute inset-0 opacity-5" 
        style={{ 
          backgroundImage: `
            radial-gradient(${color.primary} 10%, transparent 11%),
            radial-gradient(${color.primary} 10%, transparent 11%)
          `,
          backgroundSize: '10px 10px',
          backgroundPosition: '0 0, 5px 5px'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="text-xs uppercase tracking-wider font-[Halogen]" style={{ color: color.primary }}>
          {label}
        </div>
        <div className="font-[Riffic] text-lg mt-1" style={{ color: color.text }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
};

// Helper component for productivity items
const ProductivityItem = ({ text, color }: {
  text: string;
  color: ReturnType<typeof getCharacterColors>;
}) => {
  const { playSoundEffect } = useAudio();
  
  return (
    <motion.div
      className="bg-white/80 p-2 rounded-lg shadow-sm flex items-center"
      style={{ borderLeft: `3px solid ${color.primary}` }}
      whileHover={{ scale: 1.02, x: 3 }}
      onMouseEnter={() => playSoundEffect('hover')}
    >
      <span 
        className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white flex-shrink-0"
        style={{ backgroundColor: color.primary }}
      >
        ✓
      </span>
      <span className="text-sm font-[Halogen]" style={{ color: color.text }}>
        {text}
      </span>
    </motion.div>
  );
}; 