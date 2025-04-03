"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaDatabase, FaTrash, FaDownload, FaRedo } from 'react-icons/fa';
import SettingsSection from './SettingsSection';
import SettingsRow from './SettingsRow';
import Button from '@/components/Common/Button/Button';
import ConfirmationModal from '@/components/Common/Modals/ConfirmationModal';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';
import { clearChatHistory } from '@/lib/firebase/chat';
import { useTimerStore } from '@/lib/stores/timerStore';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface DataSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function DataSettings({ userData, companionId }: DataSettingsProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'clear_chat' | 'export_data' | 'reset_settings'>('clear_chat');
  const colors = getCharacterColors(companionId);
  
  const handleClearChatHistory = async () => {
    setActionType('clear_chat');
    setShowConfirmModal(true);
  };
  
  const handleExportData = () => {
    setActionType('export_data');
    setShowConfirmModal(true);
  };
  
  const handleResetSettings = () => {
    setActionType('reset_settings');
    setShowConfirmModal(true);
  };
  
  const performConfirmedAction = async () => {
    setShowConfirmModal(false);
    
    if (actionType === 'clear_chat') {
      setIsClearing(true);
      try {
        // Clear chat history for the current companion
        await clearChatHistory(userData.base.uid, companionId);
        alert('Chat history cleared successfully!');
      } catch (error) {
        console.error('Error clearing chat history:', error);
        alert('Error clearing chat history');
      } finally {
        setIsClearing(false);
      }
    } else if (actionType === 'export_data') {
      try {
        // Prepare data for export
        const exportData = {
          userData: {
            ...userData,
            // Remove sensitive data if needed
            base: {
              ...userData.base,
              email: userData.base.email.split('@')[0] + '@...'
            }
          },
          exportDate: new Date().toISOString()
        };
        
        // Create a download link
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `dokidoki_user_data_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data');
      }
    } else if (actionType === 'reset_settings') {
      try {
        // Reset all application settings to default values
        localStorage.clear();
        
        // Reset timer store to defaults
        useTimerStore.getState().resetTimer();
        
        // Force page reload to apply changes
        window.location.reload();
        
        alert('Settings have been reset to default values. The page will reload.');
      } catch (error) {
        console.error('Error resetting settings:', error);
        alert('Error resetting settings');
      }
    }
  };
  
  // Get modal content based on action type
  const getModalContent = () => {
    switch (actionType) {
      case 'clear_chat':
        return {
          title: 'Clear Chat History',
          message: 'Are you sure you want to clear all chat history with your current companion? This action cannot be undone.',
          type: 'danger' as const
        };
      case 'export_data':
        return {
          title: 'Export Your Data',
          message: 'This will download a copy of your app data. Continue?',
          type: 'normal' as const
        };
      case 'reset_settings':
        return {
          title: 'Reset Settings',
          message: 'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
          type: 'warning' as const
        };
    }
  };
  
  const modalContent = getModalContent();
  
  return (
    <>
      <SettingsSection
        title="Data Management"
        description="Manage your application data"
        companionId={companionId}
        icon={<FaDatabase size={20} style={{ color: colors.primary }} />}
      >
        <div className="space-y-4">
          <SettingsRow 
            title="Clear Chat History"
            description="Delete all chat messages with your current companion"
            companionId={companionId}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                label="Clear"
                onClick={handleClearChatHistory}
                disabled={isClearing}
                Icon={FaTrash}
                companionId={companionId}
                className="bg-red-50 border-red-200 text-red-500 shadow-md"
              />
            </motion.div>
          </SettingsRow>
          
          <SettingsRow 
            title="Export Your Data"
            description="Download a copy of your app data"
            companionId={companionId}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                label="Export"
                onClick={handleExportData}
                Icon={FaDownload}
                companionId={companionId}
                className="shadow-md"
              />
            </motion.div>
          </SettingsRow>
          
          <SettingsRow 
            title="Reset Settings"
            description="Restore all settings to default values"
            companionId={companionId}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                label="Reset"
                onClick={handleResetSettings}
                Icon={FaRedo}
                companionId={companionId}
                className="bg-yellow-50 border-yellow-200 text-yellow-600 shadow-md"
              />
            </motion.div>
          </SettingsRow>
        </div>
      </SettingsSection>
      
      {/* Use the new Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={modalContent?.title || ''}
        message={modalContent?.message || ''}
        onConfirm={performConfirmedAction}
        onCancel={() => setShowConfirmModal(false)}
        companionId={companionId}
        type={modalContent?.type || 'normal'}
      />
    </>
  );
} 