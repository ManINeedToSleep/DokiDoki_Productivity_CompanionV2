"use client";

import { NotificationProvider } from '@/components/Common/Notifications';
import NotificationDemo from '@/components/Common/Notifications/NotificationDemo';

export default function NotificationDemoPage() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-pink-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-pink-600 mb-8 text-center font-[Riffic]">
            Doki Doki Focus Notifications
          </h1>
          <p className="text-center text-gray-700 mb-8 max-w-2xl mx-auto">
            This demo showcases the different types of notifications available in Doki Doki Focus.
            Select a companion and try out the different notification types!
          </p>
          
          <NotificationDemo />
        </div>
      </div>
    </NotificationProvider>
  );
} 