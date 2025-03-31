"use client";

import { useState, useEffect } from 'react';
import { FaPalette } from 'react-icons/fa';
import SettingsSection from './SettingsSection';
import SettingsRow from './SettingsRow';
import Toggle from '@/components/Common/Toggle/Toggle';
import Button from '@/components/Common/Button/Button';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument, updateThemeSettings } from '@/lib/firebase/user';

interface ThemeSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function ThemeSettings({ userData, companionId }: ThemeSettingsProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState('#FF80AB');
  const [backgroundId, setBackgroundId] = useState('default');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize values from user data
  useEffect(() => {
    if (userData && userData.settings.theme) {
      const theme = userData.settings.theme;
      setDarkMode(theme.darkMode);
      setAccentColor(theme.accentColor);
      setBackgroundId(theme.backgroundId);
    }
  }, [userData]);
  
  // Check for changes
  useEffect(() => {
    if (userData && userData.settings.theme) {
      const theme = userData.settings.theme;
      setHasChanges(
        darkMode !== theme.darkMode ||
        accentColor !== theme.accentColor ||
        backgroundId !== theme.backgroundId
      );
    }
  }, [userData, darkMode, accentColor, backgroundId]);
  
  const handleSaveChanges = async () => {
    if (!userData) return;
    
    setIsUpdating(true);
    
    try {
      await updateThemeSettings(userData.base.uid, {
        darkMode,
        accentColor,
        backgroundId
      });
      
      // Success
      setHasChanges(false);
      
      // If dark mode changed, reload the page to apply the theme
      if (userData.settings.theme.darkMode !== darkMode) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating theme settings:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Available theme colors based on companions
  const themeColors = [
    { name: 'Pink (Sayori)', value: '#FFB6C1' },
    { name: 'Red (Natsuki)', value: '#FF8DA1' },
    { name: 'Purple (Yuri)', value: '#A49EFF' },
    { name: 'Green (Monika)', value: '#85CD9E' },
    { name: 'Blue', value: '#90CAF9' },
    { name: 'Teal', value: '#80CBC4' },
    { name: 'Amber', value: '#FFD54F' },
  ];
  
  // Available backgrounds
  const backgrounds = [
    { id: 'default', name: 'Default Polka Dots' },
    { id: 'gradient', name: 'Gradient' },
    { id: 'solid', name: 'Solid Color' },
    { id: 'minimal', name: 'Minimal' }
  ];
  
  return (
    <SettingsSection
      title="Theme & Appearance"
      description="Customize your app appearance"
      companionId={companionId}
      icon={<FaPalette size={20} />}
    >
      <div className="space-y-1">
        <SettingsRow 
          title="Dark Mode"
          description="Use dark theme for the application"
        >
          <Toggle
            isOn={darkMode}
            onToggle={setDarkMode}
            companionId={companionId}
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Accent Color"
          description="Choose your app highlight color"
        >
          <div className="flex flex-wrap gap-2">
            {themeColors.map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded-full transition-all ${accentColor === color.value ? 'ring-2 ring-gray-400' : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => setAccentColor(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </SettingsRow>
        
        <SettingsRow 
          title="Background Style"
          description="Choose your background style"
        >
          <select
            value={backgroundId}
            onChange={(e) => setBackgroundId(e.target.value)}
            className="border rounded p-2 text-sm font-[Halogen]"
          >
            {backgrounds.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.name}
              </option>
            ))}
          </select>
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