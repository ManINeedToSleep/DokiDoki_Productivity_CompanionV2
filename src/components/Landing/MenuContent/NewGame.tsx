"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/Common/Card/LandingCard";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import Button from "@/components/Common/Button/Button";
import { useRouter } from "next/navigation";
import { CompanionId } from "@/lib/firebase/companion";
import { getCharacterColors } from "@/components/Common/CharacterColor/CharacterColor";
import { playSoundEffect } from "@/components/Common/Music/BackgroundMusic";

interface Character {
  id: string;
  name: string;
  description: string;
  chibiPath: string;
  spritePath: string;
}

const characters: Character[] = [
  {
    id: "sayori",
    name: "Sayori",
    description: "Always ready to encourage you and celebrate your achievements!",
    chibiPath: imagePaths.characterSprites.sayoriChibi,
    spritePath: imagePaths.characterSprites.sayori
  },
  {
    id: "yuri",
    name: "Yuri",
    description: "Helps you maintain deep concentration and mindfulness.",
    chibiPath: imagePaths.characterSprites.yuriChibi,
    spritePath: imagePaths.characterSprites.yuri
  },
  {
    id: "natsuki",
    name: "Natsuki",
    description: "Keeps you motivated with her direct and spirited approach!",
    chibiPath: imagePaths.characterSprites.natsukiChibi,
    spritePath: imagePaths.characterSprites.natsuki
  },
  {
    id: "monika",
    name: "Monika",
    description: "Guides you through your productivity journey with expertise.",
    chibiPath: imagePaths.characterSprites.monikaChibi,
    spritePath: imagePaths.characterSprites.monika
  }
];

interface NewGameProps {
  onCharacterSelect: (characterId: string | null) => void;
}

export default function NewGame({ onCharacterSelect }: NewGameProps) {
  const router = useRouter();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  
  const characterColors = selectedCharacter 
    ? getCharacterColors(selectedCharacter as CompanionId) 
    : getCharacterColors('sayori');

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
    onCharacterSelect(characterId);
    playSoundEffect('click');
  };

  const handleStartJourney = () => {
    if (selectedCharacter) {
      playSoundEffect('click');
      router.push(`/auth?mode=signup&companion=${selectedCharacter}`);
    }
  };

  const menuContent = (
    <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-2" 
      style={{ borderColor: characterColors.primary }}>
      <h2 className="text-2xl font-[Riffic] mb-4 text-center" style={{ color: characterColors.primary }}>
        Choose Your Companion!
      </h2>
      <p className="text-base mb-6 text-center" style={{ color: characterColors.text }}>
        {selectedCharacter 
          ? `Would you like ${characters.find(c => c.id === selectedCharacter)?.name} to be your companion?`
          : "Click on a character to select them as your companion!"}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {characters.map((char) => (
          <motion.div
            key={char.id}
            className={`relative cursor-pointer flex flex-col items-center p-2 rounded-lg transition-all
              ${selectedCharacter === char.id ? 'bg-white/80 shadow-md' : 'hover:bg-white/50'}`}
            style={{ 
              border: selectedCharacter === char.id 
                ? `2px solid ${getCharacterColors(char.id as CompanionId).primary}` 
                : '2px solid transparent',
            }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleCharacterSelect(char.id)}
          >
            <motion.img
              src={char.chibiPath}
              alt={`${char.name} chibi`}
              className="w-24 h-24 object-contain mb-2"
              animate={{
                scale: selectedCharacter === char.id ? 1.1 : 1,
                opacity: selectedCharacter && selectedCharacter !== char.id ? 0.6 : 1
              }}
            />
            <p 
              className="text-xs font-[Riffic] text-center"
              style={{ 
                color: getCharacterColors(char.id as CompanionId).primary 
              }}
            >
              {char.name}
            </p>
          </motion.div>
        ))}
      </div>
      
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center"
        >
          <Button 
            label="Begin Your Journey" 
            onClick={handleStartJourney}
            className="text-lg px-8 py-3 shadow-lg hover:scale-105 transform transition-all"
            companionId={selectedCharacter as CompanionId}
          />
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {menuContent}
    </div>
  );
}
