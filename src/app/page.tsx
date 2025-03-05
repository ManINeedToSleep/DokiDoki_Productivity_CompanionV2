"use client";

import { useState, useCallback } from "react";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import MenuOption from "@/components/Landing/MenuOption";
import CompanionDisplay from "@/components/Common/CompanionDisplay/CompanionDisplay";
import { CompanionId } from "@/lib/firebase/companion";

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  const handleCharacterSelect = useCallback((characterId: string | null) => {
    setSelectedCharacter(characterId);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <PolkaDotBackground />
      <MenuOption onCharacterSelect={handleCharacterSelect} />
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-96 w-64">
        <CompanionDisplay characterId={(selectedCharacter || 'sayori') as CompanionId} />
      </div>
    </main>
  );
}
