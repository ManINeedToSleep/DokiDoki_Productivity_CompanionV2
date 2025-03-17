 "use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCompanionPage = pathname === '/dashboard/companion';

  // This layout will override the dashboard layout for the companion page
  return (
    <div className="companion-layout">
      <style jsx global>{`
        /* Hide scrollbar for the companion page */
        body {
          overflow: hidden;
        }
        
        /* Remove padding from layout for fullscreen experience */
        .companion-page {
          margin: 0 !important;
          padding: 0 !important;
          max-height: 100vh !important;
          width: 100vw !important;
          max-width: 100vw !important;
        }
        
        /* Hide the app navbar only on companion page */
        .companion-page + nav,
        .companion-page ~ nav {
          display: none !important;
        }
        
        /* Make content take full height */
        .dashboard-content {
          padding: 0 !important;
          max-height: 100vh !important;
        }
      `}</style>
      {children}
    </div>
  );
} 