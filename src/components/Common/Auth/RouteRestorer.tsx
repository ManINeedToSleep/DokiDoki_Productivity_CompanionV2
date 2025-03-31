"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/auth'];

export default function RouteRestorer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Store current path when it changes
    if (pathname && !publicRoutes.includes(pathname)) {
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
      } else if (!publicRoutes.includes(pathname)) {
        // If not authenticated and not on a public page, redirect to auth
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return null;
} 