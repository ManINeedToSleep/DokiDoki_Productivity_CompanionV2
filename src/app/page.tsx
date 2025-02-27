"use client";

import { useState, useCallback } from "react";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import MenuOption from "@/components/Landing/MenuOption";
import CompanionDisplay from "@/components/Common/CompanionDisplay/CompanionDisplay";

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  const handleCharacterSelect = useCallback((characterId: string | null) => {
    setSelectedCharacter(characterId);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <PolkaDotBackground />
      <MenuOption onCharacterSelect={handleCharacterSelect} />
      <CompanionDisplay characterId={selectedCharacter} />
    </main>
  );
}
