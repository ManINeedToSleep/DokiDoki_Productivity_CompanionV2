"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCaretDown, FaLock } from 'react-icons/fa';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

export interface Topic {
  id: string;
  title: string;
  category: 'general' | 'personal' | 'game' | 'special';
  affinityRequired: number;
  isNew?: boolean;
}

interface TopicCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface TopicMenuProps {
  topics: Topic[];
  companionId: CompanionId;
  currentAffinity: number;
  onSelectTopic: (topic: Topic) => void;
  isVisible?: boolean;
}

const TopicMenu: React.FC<TopicMenuProps> = ({
  topics,
  companionId,
  currentAffinity,
  onSelectTopic,
  isVisible = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const colors = getCharacterColors(companionId);
  
  const categories: TopicCategory[] = [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'personal', name: 'Personal', icon: '💭' },
    { id: 'game', name: 'Activities', icon: '🎮' },
    { id: 'special', name: 'Special', icon: '✨' }
  ];
  
  // Filter topics by selected category
  const filteredTopics = selectedCategory
    ? topics.filter(topic => topic.category === selectedCategory)
    : [];
  
  const handleTopicClick = (topic: Topic) => {
    if (topic.affinityRequired <= currentAffinity) {
      onSelectTopic(topic);
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                     bg-white/90 backdrop-blur-sm rounded-lg border-2 shadow-xl 
                     p-5 w-full max-w-2xl z-30"
          style={{ borderColor: colors.primary }}
        >
          <h2 className="text-xl font-[Riffic] mb-4 text-center" style={{ color: colors.text }}>
            Choose a Topic
          </h2>
          
          {/* Category selector */}
          <div className="flex justify-center space-x-4 mb-5">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
                className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2
                          ${selectedCategory === category.id ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
                style={{
                  backgroundColor: selectedCategory === category.id ? colors.primary : 'white',
                  color: selectedCategory === category.id ? 'white' : colors.text,
                  borderWidth: 1,
                  borderColor: colors.primary
                }}
              >
                <span>{category.icon}</span>
                <span className="font-[Halogen]">{category.name}</span>
                <FaCaretDown className={selectedCategory === category.id ? 'transform rotate-180' : ''} />
              </button>
            ))}
          </div>
          
          {/* Topics list */}
          <AnimatePresence>
            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                  {filteredTopics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicClick(topic)}
                      disabled={topic.affinityRequired > currentAffinity}
                      className={`p-3 text-left rounded-md transition-all duration-200 ${
                        topic.affinityRequired <= currentAffinity
                          ? 'hover:bg-gray-100'
                          : 'opacity-60 cursor-not-allowed'
                      } ${topic.isNew ? 'border-2 border-yellow-400' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-[Halogen]">{topic.title}</span>
                        {topic.affinityRequired > currentAffinity && (
                          <div className="flex items-center text-gray-500">
                            <FaLock className="text-xs mr-1" />
                            <span className="text-xs">Lv.{Math.ceil(topic.affinityRequired / 100)}</span>
                          </div>
                        )}
                        {topic.isNew && <span className="text-xs bg-yellow-400 text-yellow-900 px-1 rounded">NEW</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {selectedCategory && filteredTopics.length === 0 && (
            <p className="text-center text-gray-500 font-[Halogen] my-4">
              No topics available in this category yet.
            </p>
          )}
          
          <div className="mt-4 text-center">
            <button
              className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-[Halogen]"
              onClick={() => onSelectTopic({ id: 'close', title: 'Close', category: 'general', affinityRequired: 0 })}
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TopicMenu; 