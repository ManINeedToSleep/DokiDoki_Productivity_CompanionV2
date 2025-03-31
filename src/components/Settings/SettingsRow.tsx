"use client";

import { ReactNode } from 'react';

interface SettingsRowProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingsRow({
  title,
  description,
  children
}: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 pr-4">
        <h3 className="text-base font-[Halogen] text-gray-800">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 mt-1 font-[Halogen]">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
} 