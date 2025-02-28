"use client";

import { useUserData } from "@/hooks/useUserData";
import Goals from "@/components/Dashboard/Goals";
import Navbar from "@/components/Common/Navbar/Navbar";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import CompanionDisplay from "@/components/Common/CompanionDisplay/CompanionDisplay";

export default function GoalsPage() {
  const { userData } = useUserData();

  return (
    <div className="min-h-screen relative">
      <PolkaDotBackground />
      <div className="relative z-10 h-full">
        <Navbar />
        <div className="flex min-h-screen pt-16">
          {/* Companion Section */}
          <div className="w-1/3 fixed left-0 top-16 bottom-0 flex items-center justify-center">
            <div className="h-[80vh] w-full relative">
              <CompanionDisplay 
                characterId={userData?.settings?.selectedCompanion || 'sayori'}
              />
            </div>
          </div>

          {/* Goals Section */}
          <main className="w-2/3 ml-[33.333%] px-6 py-8">
            <Goals 
              userData={userData} 
              variant="full" 
              allowEditing={true}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
