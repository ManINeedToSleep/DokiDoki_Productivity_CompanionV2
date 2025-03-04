"use client";

import { ReactNode } from 'react';
import ProtectedRoute from '@/components/Common/Auth/ProtectedRoute';
import { useSyncAllData } from '@/lib/stores';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Initialize all data syncing
  useSyncAllData();
  
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
} 