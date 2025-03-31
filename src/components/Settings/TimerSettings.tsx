"use client";

import { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';
import SettingsSection from './SettingsSection';
import SettingsRow from './SettingsRow';
import Toggle from '@/components/Common/Toggle/Toggle';
import Button from '@/components/Common/Button/Button';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument, updateTimerSettings } from '@/lib/firebase/user';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { useChatStore } from '@/lib/stores/chatStore';

interface TimerSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function TimerSettings({ userData, companionId }: TimerSettingsProps) {
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Get the sync function from the chat store
  const { syncWithFirebase } = useChatStore();
  const colors = getCharacterColors(companionId);
  
  // Initialize values from user data
  useEffect(() => {
    if (userData && userData.settings.timerSettings) {
      const settings = userData.settings.timerSettings;
      setWorkDuration(settings.workDuration);
      setShortBreakDuration(settings.shortBreakDuration);
      setLongBreakDuration(settings.longBreakDuration);
      setLongBreakInterval(settings.longBreakInterval);
      setAutoStartBreaks(settings.autoStartBreaks);
      setAutoStartPomodoros(settings.autoStartPomodoros);
      setNotifications(settings.notifications);
    }
  }, [userData]);
  
  // Check for changes
  useEffect(() => {
    if (userData && userData.settings.timerSettings) {
      const settings = userData.settings.timerSettings;
      setHasChanges(
        workDuration !== settings.workDuration ||
        shortBreakDuration !== settings.shortBreakDuration ||
        longBreakDuration !== settings.longBreakDuration ||
        longBreakInterval !== settings.longBreakInterval ||
        autoStartBreaks !== settings.autoStartBreaks ||
        autoStartPomodoros !== settings.autoStartPomodoros ||
        notifications !== settings.notifications
      );
    }
  }, [
    userData,
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    longBreakInterval,
    autoStartBreaks,
    autoStartPomodoros,
    notifications
  ]);
  
  const handleSaveChanges = async () => {
    if (!userData) return;
    
    setIsUpdating(true);
    
    try {
      // First update the timer settings in the database
      await updateTimerSettings(userData.base.uid, {
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        longBreakInterval,
        autoStartBreaks,
        autoStartPomodoros,
        notifications
      });
      
      // Success
      setHasChanges(false);
      
      // Make sure any unsaved chat data is synced with Firebase
      await syncWithFirebase(userData.base.uid, true);
      
      // Clear cached timer data from local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('timerStore');
        window.location.href = '/dashboard/timer';
      }
    } catch (error) {
      console.error('Error updating timer settings:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <SettingsSection
      title="Timer Settings"
      description="Customize your productivity timer"
      companionId={companionId}
      icon={<FaClock size={20} />}
    >
      <div className="space-y-1">
        <SettingsRow 
          title="Focus Time"
          description="Duration of each focus session (minutes)"
        >
          <input
            type="number"
            min={5}
            max={60}
            step={5}
            value={workDuration}
            onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
            className="w-20 p-2 border rounded-md text-center font-[Halogen]"
            style={{ 
              borderColor: colors.primary, 
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Short Break"
          description="Duration of short breaks (minutes)"
        >
          <input
            type="number"
            min={1}
            max={15}
            step={1}
            value={shortBreakDuration}
            onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 5)}
            className="w-20 p-2 border rounded-md text-center font-[Halogen]"
            style={{ 
              borderColor: colors.primary, 
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Long Break"
          description="Duration of long breaks (minutes)"
        >
          <input
            type="number"
            min={5}
            max={30}
            step={5}
            value={longBreakDuration}
            onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
            className="w-20 p-2 border rounded-md text-center font-[Halogen]"
            style={{ 
              borderColor: colors.primary, 
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Long Break Interval"
          description="Number of sessions before a long break"
        >
          <input
            type="number"
            min={2}
            max={6}
            step={1}
            value={longBreakInterval}
            onChange={(e) => setLongBreakInterval(parseInt(e.target.value) || 4)}
            className="w-20 p-2 border rounded-md text-center font-[Halogen]"
            style={{ 
              borderColor: colors.primary, 
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Auto-Start Breaks"
          description="Automatically start breaks when a session ends"
        >
          <Toggle
            isOn={autoStartBreaks}
            onToggle={setAutoStartBreaks}
            companionId={companionId}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Auto-Start Sessions"
          description="Automatically start next focus session when a break ends"
        >
          <Toggle
            isOn={autoStartPomodoros}
            onToggle={setAutoStartPomodoros}
            companionId={companionId}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Notifications"
          description="Show notifications when sessions start/end"
        >
          <Toggle
            isOn={notifications}
            onToggle={setNotifications}
            companionId={companionId}
          />
        </SettingsRow>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button
          label="Save Changes"
          onClick={handleSaveChanges}
          disabled={isUpdating || !hasChanges}
          companionId={companionId}
        />
      </div>
    </SettingsSection>
  );
} 