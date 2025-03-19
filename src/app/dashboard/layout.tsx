"use client";

import { ReactNode } from 'react';
import ProtectedRoute from '@/components/Common/Auth/ProtectedRoute';
import { useSyncAllData } from '@/lib/stores';
import Navbar from '@/components/Common/Navbar/Navbar';
import AuthRefresher from '@/components/Common/Auth/AuthRefresher';

// Add styles for scrollbar hiding
const scrollbarHidingStyles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Initialize all data syncing
  useSyncAllData();
  
  return (
    <ProtectedRoute>
      {/* Add AuthRefresher to manage Firebase token refreshing */}
      <AuthRefresher />
      
      {/* Add style tag for scrollbar hiding */}
      <style jsx global>{scrollbarHidingStyles}</style>
      
      {/* Layout container - full height with flex column */}
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Fixed navbar */}
        <div className="flex-none z-10">
          <Navbar />
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
} 