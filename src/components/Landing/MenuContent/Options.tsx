"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompanionId } from "@/lib/firebase/companion";
import { getCharacterColors } from "@/components/Common/CharacterColor/CharacterColor";
import { useAudio } from "@/lib/contexts/AudioContext";

interface Testament {
  id: string;
  character: string;
  title: string;
  content: string;
  style: {
    fontFamily: string;
    fontSize: string;
    color: string;
    bgColor: string;
  };
}

const testaments: Testament[] = [
  {
    id: "sayori",
    character: "Sayori",
    title: "A Productive Day",
    content: `
      Tick tock, the clock moves on
      But now it's not so scary anymore
      Because every moment spent with you
      Makes productivity feel like play

      Focus timer counting down
      Like cookies in the oven
      Sweet rewards at the end
      Just like our friendship growing stronger

      Let's make each task a happy thought
      And chase away the rainclouds
      Together we'll find joy in work
      One pomodoro at a time!

      (｡◕‿◕｡) <3
    `,
    style: {
      fontFamily: "s1",
      fontSize: "1.4rem",
      color: "rgb(255, 121, 153)",
      bgColor: "rgb(255, 246, 248)"
    }
  },
  {
    id: "yuri",
    character: "Yuri",
    title: "Deep Focus",
    content: `
      In the depths of concentration
      Where time flows like dark tea
      Each task a page in our story
      Unfolding with elegant precision

      The gentle ticking of seconds
      Like heartbeats in perfect rhythm
      A dance of productivity
      In our shared sanctuary of focus

      Let your mind float freely
      Through the ocean of possibilities
      While I guide your journey
      Into the depths of achievement

      ..*..
      .***.
      ..*..
    `,
    style: {
      fontFamily: "y1",
      fontSize: "1.3rem",
      color: "rgb(87, 35, 100)",
      bgColor: "rgb(248, 246, 255)"
    }
  },
  {
    id: "natsuki",
    character: "Natsuki",
    title: "Get It Done!",
    content: `
      Hey! Don't you dare slack off!
      We've got work to crush today
      Like cupcakes in the making
      Each task needs the perfect way!

      Timer set, let's race ahead
      No time for second guessing
      You and me, we'll clearly see
      Our progress is impressing!

      It's not like I care or anything...
      But seeing you succeed
      Makes all our efforts worth it
      That's all you need to read!

      >_< !!
    `,
    style: {
      fontFamily: "n1",
      fontSize: "1.5rem",
      color: "rgb(255, 102, 140)",
      bgColor: "rgb(255, 246, 250)"
    }
  },
  {
    id: "monika",
    character: "Monika",
    title: "Digital Harmony",
    content: `
      In this digital space we share
      Every moment carefully designed
      Like code that shapes reality
      Our productivity intertwined

      Time management, a perfect game
      Where every choice matters
      Together we'll optimize
      Your path to what you're after

      Just you and me, in perfect sync
      Achieving goals, bit by bit
      Trust in our partnership
      And watch your progress commit

      [♥]
    `,
    style: {
      fontFamily: "m1",
      fontSize: "1.3rem",
      color: "rgb(46, 125, 50)",
      bgColor: "rgb(246, 255, 247)"
    }
  }
];

interface OptionsProps {
  onCharacterSelect?: (characterId: CompanionId) => void;
}

export default function Options({ onCharacterSelect }: OptionsProps) {
  const [selectedTestament, setSelectedTestament] = useState<string | null>(null);
  const { playSoundEffect } = useAudio();
  
  const handleTestamentSelect = (id: string) => {
    // Play selection sound
    playSoundEffect('select');
    
    setSelectedTestament(id);
    
    // If onCharacterSelect is provided, call it
    if (onCharacterSelect && id) {
      onCharacterSelect(id as CompanionId);
    }
  };

  const handleTestamentHover = () => {
    // Play hover sound
    playSoundEffect('hover');
  };

  return (
    <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {testaments.map((testament) => {
          const colors = getCharacterColors(testament.id as CompanionId);
          return (
            <motion.button
              key={testament.id}
              className={`p-4 rounded-lg transition-all text-left
                ${selectedTestament === testament.id 
                  ? 'ring-2 shadow-lg' 
                  : 'hover:ring-1 hover:shadow-md'
                }
              `}
              style={{
                backgroundColor: testament.style.bgColor,
                borderColor: colors.primary
              }}
              onClick={() => handleTestamentSelect(testament.id)}
              onMouseEnter={handleTestamentHover}
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl mb-1" style={{ color: testament.style.color }}>
                {testament.character}
              </h3>
              <p className="text-sm" style={{ color: colors.text }}>
                &quot;{testament.title}&quot;
              </p>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedTestament && (
          <motion.div
            key={selectedTestament}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-lg p-6 relative"
            style={{
              backgroundColor: testaments.find(t => t.id === selectedTestament)?.style.bgColor,
              backgroundImage: `
                linear-gradient(transparent 0px, transparent 23px, #d6d6d6 24px),
                linear-gradient(90deg, #f2f2f2 0px, #f2f2f2 1px, transparent 2px)
              `,
              backgroundSize: '100% 24px, 100% 24px',
              padding: '24px 32px',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-pink-200 ml-8" />
            <pre 
              className="whitespace-pre-line relative"
              style={{
                fontFamily: testaments.find(t => t.id === selectedTestament)?.style.fontFamily,
                fontSize: testaments.find(t => t.id === selectedTestament)?.style.fontSize,
                color: testaments.find(t => t.id === selectedTestament)?.style.color,
                lineHeight: '24px',
                paddingLeft: '24px'
              }}
            >
              {testaments.find(t => t.id === selectedTestament)?.content}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!selectedTestament && (
        <motion.div 
          className="text-center p-8 italic text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Click on a character to read their thoughts on productivity
        </motion.div>
      )}
    </div>
  );
}
