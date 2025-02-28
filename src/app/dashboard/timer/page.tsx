"use client";

import { TimerProvider } from "@/components/Timer/TimerProvider";
import { TimerDisplay } from "@/components/Timer/TimerDisplay";
import { TimerControls } from "@/components/Timer/TimerControls";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import CompanionDisplay from "@/components/Common/CompanionDisplay/CompanionDisplay";
import Navbar from "@/components/Common/Navbar/Navbar";
import { useUserData } from "@/hooks/useUserData";
import { CharacterMessage } from "@/components/Timer/CharacterMessage";
import { StudyNotes } from "@/components/Timer/StudyNotes";

export default function TimerPage() {
  const { userData } = useUserData();

  return (
    <TimerProvider>
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

            {/* Timer Section */}
            <main className="w-2/3 ml-[33.333%] px-6 py-8">
              <div className="space-y-6">
                <DashboardCard>
                  <div className="text-center space-y-8">
                    <TimerDisplay />
                    <TimerControls />
                  </div>
                </DashboardCard>

                {/* Charcater Messages and Study Notes */}
                <div className="grid grid-cols-2 gap-6">
                  <CharacterMessage />
                  <StudyNotes />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </TimerProvider>
  );
}
