import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/Common/Button/Button';
import { TimerSettingsProps } from './types';

const TimerSettings: React.FC<TimerSettingsProps> = ({
  settings,
  onSettingsChange,
  onSave,
  companionId,
  colors
}) => {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-6 mb-6"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
    >
      <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading || colors.text }}>
        Timer Settings
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
            Focus Duration (minutes)
          </label>
          <input
            type="number"
            value={settings.workDuration / 60}
            onChange={(e) => onSettingsChange('workDuration', parseInt(e.target.value) * 60)}
            min={1}
            max={120}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              borderColor: colors.primary
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
            Short Break Duration (minutes)
          </label>
          <input
            type="number"
            value={settings.breakDuration / 60}
            onChange={(e) => onSettingsChange('breakDuration', parseInt(e.target.value) * 60)}
            min={1}
            max={30}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              borderColor: colors.primary
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
            Long Break Duration (minutes)
          </label>
          <input
            type="number"
            value={settings.longBreakDuration / 60}
            onChange={(e) => onSettingsChange('longBreakDuration', parseInt(e.target.value) * 60)}
            min={1}
            max={60}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              borderColor: colors.primary
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
            Sessions Before Long Break
          </label>
          <input
            type="number"
            value={settings.sessionsBeforeLongBreak}
            onChange={(e) => onSettingsChange('sessionsBeforeLongBreak', parseInt(e.target.value))}
            min={1}
            max={10}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              borderColor: colors.primary
            }}
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            label="Save Settings"
            onClick={onSave}
            companionId={companionId}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default TimerSettings; 