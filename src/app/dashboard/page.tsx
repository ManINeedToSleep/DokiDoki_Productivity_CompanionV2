"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { getUserDocument } from "@/lib/firebase/user";
import Navbar from "@/components/Common/Navbar/Navbar";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import { User } from "firebase/auth";
import type { UserDocument } from "@/lib/firebase/user";
import CompanionDisplay from "@/components/Common/CompanionDisplay/CompanionDisplay";
import QuickStats from "@/components/Dashboard/DashboardComponents/QuickStats";
import Goals from "@/components/Dashboard/DashboardComponents/Goals";
import CharacterProgression from "@/components/Dashboard/DashboardComponents/CharacterProgression";
import Achievements from "@/components/Dashboard/DashboardComponents/Achievements";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      // Fetch user data
      const data = await getUserDocument(user.uid);
      if (!data) {
        console.error("No user data found");
        return;
      }
      setUserData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkaDotBackground />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-[Riffic] text-pink-700"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen fixed inset-0 bg-[#FFF5F8]">
      <PolkaDotBackground />
      <div className="relative z-10 h-full">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] pt-16">
          <div className="w-1/3 fixed left-0 top-16 bottom-0 flex items-center justify-center">
            <div className="h-[80vh] w-full relative">
              <CompanionDisplay 
                characterId={userData?.settings?.selectedCompanion || 'sayori'}
              />
            </div>
          </div>

          <main className="w-2/3 ml-[33.333%] h-full">
            <div className="max-w-5xl mx-auto px-6 py-8 h-full overflow-y-auto scrollbar-hide">
              <motion.h1 
                className="text-3xl font-[Riffic] text-pink-700 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Welcome back, {userData?.base?.displayName}!
              </motion.h1>

              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                <QuickStats userData={userData} />
                <Goals userData={userData} />
                <CharacterProgression userData={userData} />
                <Achievements userData={userData} />
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
