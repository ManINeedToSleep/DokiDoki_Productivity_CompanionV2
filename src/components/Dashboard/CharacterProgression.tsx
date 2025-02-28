"use client";

import { motion } from "framer-motion";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import { formatTime } from "@/lib/utils/timeFormat";
import type { UserDocument } from "@/lib/firebase/user";
import { checkCompanionAchievements } from '@/lib/firebase/achievements';
import { useEffect } from "react";

interface CharacterProgressionProps {
  userData: UserDocument | null;
}

export default function CharacterProgression({ userData }: CharacterProgressionProps) {
  const selectedCompanion = userData?.settings?.selectedCompanion;
  const companionData = selectedCompanion ? userData?.companions[selectedCompanion] : null;
  const affinityLevel = companionData?.affinityLevel || 0;
  const progress = Math.min((affinityLevel / 100) * 100, 100);

  // Capitalize companion name
  const companionName = selectedCompanion
    ? selectedCompanion.charAt(0).toUpperCase() + selectedCompanion.slice(1)
    : "Unknown";

  useEffect(() => {
    if (userData?.base?.uid && selectedCompanion && affinityLevel) {
      checkCompanionAchievements(userData.base.uid, selectedCompanion, affinityLevel);
    }
  }, [userData?.base?.uid, selectedCompanion, affinityLevel]);

  return (
    <DashboardCard>
      <h2 className="text-2xl font-[Riffic] text-pink-700 mb-4">
        Character Progression - {companionName}
      </h2>

      {companionData ? (
        <div className="space-y-4 font-[Halogen]">
          {/* Level Progress */}
          <div className="flex justify-between items-baseline">
            <span className="text-lg text-pink-800">Level {affinityLevel}</span>
            <span className="text-sm text-pink-600">
              {affinityLevel === 100 ? "MAX" : `${affinityLevel}/100`}
            </span>
          </div>
          <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div className="bg-white/50 p-3 rounded-lg">
              <p className="text-pink-700">Total Time</p>
              <p className="text-pink-900">
                {formatTime((companionData.stats?.totalInteractionTime || 0) * 60)}
              </p>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <p className="text-pink-700">Consecutive Days</p>
              <p className="text-pink-900">{companionData.stats?.consecutiveDays || 0} days</p>
            </div>
          </div>

          {/* Mood Status */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-pink-700">Current Mood:</span>
            <span className="text-pink-900 capitalize">{companionData.mood || "neutral"}</span>
          </div>

          {/* Next Event/Milestone */}
          <div className="flex justify-between items-center">
            <span className="text-pink-700">Next Milestone:</span>
            <span className="text-pink-900">Level {Math.min(affinityLevel + 1, 100)}</span>
          </div>
        </div>
      ) : (
        <p className="text-pink-700">No companion selected.</p>
      )}
    </DashboardCard>
  );
}
