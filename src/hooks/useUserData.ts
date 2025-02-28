"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { getUserDocument } from '@/lib/firebase/user';
import type { UserDocument } from '@/lib/firebase/user';
import { User } from 'firebase/auth';

export const useUserData = () => {
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) return;
      const data = await getUserDocument(user.uid);
      setUserData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    const data = await getUserDocument(auth.currentUser.uid);
    setUserData(data);
  };

  return { userData, loading, refreshUserData };
}; 