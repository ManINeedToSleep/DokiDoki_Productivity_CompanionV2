"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function RouteRestorer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Store current path when it changes
    if (pathname && pathname !== '/auth') {
      localStorage.setItem('lastRoute', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Get stored route
        const lastRoute = localStorage.getItem('lastRoute');
        if (lastRoute && pathname === '/dashboard') {
          router.push(lastRoute);
        }
      } else if (pathname !== '/auth') {
        // If not authenticated and not on auth page, redirect to auth
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return null;
} 