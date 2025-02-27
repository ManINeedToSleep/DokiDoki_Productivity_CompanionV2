"use client";

import { useState } from "react";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import MenuOption from "@/components/Landing/MenuOption";
import CompanionDisplay from "@/components/Common/CompanionDisplay/CompanionDisplay";

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <PolkaDotBackground />
      <MenuOption onCharacterSelect={setSelectedCharacter} />
      <CompanionDisplay 
        characterId={selectedCharacter} 
        position="left"
      />
    </main>
  );
}
