"use client";

import { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';
import SettingsSection from './SettingsSection';
import SettingsRow from './SettingsRow';
import Toggle from '@/components/Common/Toggle/Toggle';
import Button from '@/components/Common/Button/Button';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { useTimerStore } from '@/lib/stores/timerStore';

interface TimerSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function TimerSettings({ userData, companionId }: TimerSettingsProps) {
  const { settings, syncWithFirebase } = useTimerStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Local state for UI
  const [workMinutes, setWorkMinutes] = useState(Math.floor(settings.workDuration / 60));
  const [shortBreakMinutes, setShortBreakMinutes] = useState(Math.floor(settings.breakDuration / 60));
  const [longBreakMinutes, setLongBreakMinutes] = useState(Math.floor(settings.longBreakDuration / 60));
  const [longBreakInterval, setLongBreakInterval] = useState(settings.sessionsBeforeLongBreak);
  
  // Additional settings for compatibility with Firebase model
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  const colors = getCharacterColors(companionId);
  
  // Initialize values from user data or store
  useEffect(() => {
    if (userData && userData.settings.timerSettings) {
      const dbSettings = userData.settings.timerSettings;
      
      // Update local state
      setWorkMinutes(dbSettings.workDuration);
      setShortBreakMinutes(dbSettings.shortBreakDuration);
      setLongBreakMinutes(dbSettings.longBreakDuration);
      setLongBreakInterval(dbSettings.longBreakInterval);
      setAutoStartBreaks(dbSettings.autoStartBreaks);
      setAutoStartPomodoros(dbSettings.autoStartPomodoros);
      setNotifications(dbSettings.notifications);
      
      // Update store with Firestore values if different from current store
      const storeWorkMinutes = Math.floor(settings.workDuration / 60);
      const storeShortBreakMinutes = Math.floor(settings.breakDuration / 60);
      const storeLongBreakMinutes = Math.floor(settings.longBreakDuration / 60);
      
      if (dbSettings.workDuration !== storeWorkMinutes ||
          dbSettings.shortBreakDuration !== storeShortBreakMinutes ||
          dbSettings.longBreakDuration !== storeLongBreakMinutes ||
          dbSettings.longBreakInterval !== settings.sessionsBeforeLongBreak) {
        
        // Update the timer store
        useTimerStore.setState({
          settings: {
            workDuration: dbSettings.workDuration * 60,
            breakDuration: dbSettings.shortBreakDuration * 60,
            longBreakDuration: dbSettings.longBreakDuration * 60,
            sessionsBeforeLongBreak: dbSettings.longBreakInterval
          },
          userId: userData.base.uid
        });
      }
    }
  }, [userData, settings]);
  
  // Check for changes compared to the current settings in the store
  useEffect(() => {
    const storeWorkMinutes = Math.floor(settings.workDuration / 60);
    const storeShortBreakMinutes = Math.floor(settings.breakDuration / 60);
    const storeLongBreakMinutes = Math.floor(settings.longBreakDuration / 60);
    
    setHasChanges(
      workMinutes !== storeWorkMinutes ||
      shortBreakMinutes !== storeShortBreakMinutes ||
      longBreakMinutes !== storeLongBreakMinutes ||
      longBreakInterval !== settings.sessionsBeforeLongBreak
    );
  }, [
    settings,
    workMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    longBreakInterval
  ]);
  
  const handleSaveChanges = async () => {
    if (!userData) return;
    
    setIsUpdating(true);
    
    try {
      // Update store with new values
      useTimerStore.setState({
        settings: {
          workDuration: workMinutes * 60,
          breakDuration: shortBreakMinutes * 60,
          longBreakDuration: longBreakMinutes * 60,
          sessionsBeforeLongBreak: longBreakInterval
        },
        userId: userData.base.uid
      });
      
      // Sync with Firebase
      await syncWithFirebase(userData.base.uid);
      
      // Update UI state
      setHasChanges(false);
      
      // Show success message or notification
      console.log('Timer settings saved successfully!');
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
            value={workMinutes}
            onChange={(e) => setWorkMinutes(parseInt(e.target.value) || 25)}
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
            value={shortBreakMinutes}
            onChange={(e) => setShortBreakMinutes(parseInt(e.target.value) || 5)}
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
            value={longBreakMinutes}
            onChange={(e) => setLongBreakMinutes(parseInt(e.target.value) || 15)}
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