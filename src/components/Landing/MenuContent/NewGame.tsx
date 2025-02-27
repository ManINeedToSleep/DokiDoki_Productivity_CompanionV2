"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/Common/Card/LandingCard";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import Button from "@/components/Common/Button/Button";
import { useRouter } from "next/navigation";

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

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
    onCharacterSelect(characterId);
  };

  const handleStartJourney = () => {
    if (selectedCharacter) {
      router.push(`/auth?mode=signup&companion=${selectedCharacter}`);
    }
  };

  const menuContent = (
    <div className="p-6">
      <h2 className="text-2xl font-[Riffic] text-pink-700 mb-4">Choose Your Companion!</h2>
      <p className="text-base text-pink-900 mb-6">
        {selectedCharacter 
          ? `Would you like ${characters.find(c => c.id === selectedCharacter)?.name} to be your companion?`
          : "Click on a character to select them as your companion!"}
      </p>

      <div className="flex justify-between items-center mb-8">
        {characters.map((char) => (
          <motion.div
            key={char.id}
            className={`relative cursor-pointer flex flex-col items-center
              ${selectedCharacter === char.id ? 'scale-110' : 'hover:scale-105'}`}
            whileHover={{ scale: selectedCharacter === char.id ? 1.1 : 1.05 }}
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
            <p className={`text-xs font-[Riffic] text-center
              ${selectedCharacter === char.id ? 'text-pink-700' : 'text-pink-500'}`}>
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
          />
        </motion.div>
      )}
    </div>
  );

  return <Card>{menuContent}</Card>;
}
