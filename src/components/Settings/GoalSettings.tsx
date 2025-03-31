"use client";

import { useState, useEffect } from 'react';
import { FaFlag } from 'react-icons/fa';
import SettingsSection from './SettingsSection';
import SettingsRow from './SettingsRow';
import Button from '@/components/Common/Button/Button';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument, updateFocusGoals } from '@/lib/firebase/user';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface GoalSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function GoalSettings({ userData, companionId }: GoalSettingsProps) {
  const [dailyGoal, setDailyGoal] = useState(25);
  const [weeklyGoal, setWeeklyGoal] = useState(150);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const colors = getCharacterColors(companionId);
  
  // Initialize values from user data
  useEffect(() => {
    if (userData && userData.goals) {
      setDailyGoal(userData.goals.dailyGoal);
      setWeeklyGoal(userData.goals.weeklyGoal);
    }
  }, [userData]);
  
  // Check for changes
  useEffect(() => {
    if (userData && userData.goals) {
      setHasChanges(
        dailyGoal !== userData.goals.dailyGoal ||
        weeklyGoal !== userData.goals.weeklyGoal
      );
    }
  }, [userData, dailyGoal, weeklyGoal]);
  
  const handleSaveChanges = async () => {
    if (!userData) return;
    
    setIsUpdating(true);
    
    try {
      await updateFocusGoals(userData.base.uid, dailyGoal, weeklyGoal);
      
      // Success
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating goal settings:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Format minutes to hours and minutes
  const formatTimeDisplay = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };
  
  return (
    <SettingsSection
      title="Focus Goals"
      description="Set your daily and weekly focus targets"
      companionId={companionId}
      icon={<FaFlag size={20} />}
    >
      <div className="space-y-1">
        <SettingsRow 
          title="Daily Focus Goal"
          description="Target focus time per day (minutes)"
        >
          <input
            type="number"
            min={15}
            max={240}
            step={15}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(parseInt(e.target.value) || 25)}
            className="w-20 p-2 border rounded-md text-center font-[Halogen]"
            style={{ 
              borderColor: colors.primary, 
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Weekly Focus Goal"
          description="Target focus time per week (minutes)"
        >
          <input
            type="number"
            min={60}
            max={1200}
            step={60}
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 150)}
            className="w-20 p-2 border rounded-md text-center font-[Halogen]"
            style={{ 
              borderColor: colors.primary, 
              color: colors.text,
              backgroundColor: `${colors.primary}10`
            }}
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