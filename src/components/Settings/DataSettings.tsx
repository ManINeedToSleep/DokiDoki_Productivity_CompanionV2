"use client";

import { useState } from 'react';
import { FaDatabase, FaTrash, FaDownload, FaRedo } from 'react-icons/fa';
import SettingsSection from './SettingsSection';
import SettingsRow from './SettingsRow';
import Button from '@/components/Common/Button/Button';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';
import { clearChatHistory } from '@/lib/firebase/chat';

interface DataSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function DataSettings({ userData, companionId }: DataSettingsProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'clear_chat' | 'export_data' | 'reset_settings'>('clear_chat');
  
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
      // In a real implementation, this would reset settings to defaults
      alert('This feature is not yet implemented');
    }
  };
  
  return (
    <>
      <SettingsSection
        title="Data Management"
        description="Manage your application data"
        companionId={companionId}
        icon={<FaDatabase size={20} />}
      >
        <div className="space-y-4">
          <SettingsRow 
            title="Clear Chat History"
            description="Delete all chat messages with your current companion"
          >
            <Button
              label="Clear"
              onClick={handleClearChatHistory}
              disabled={isClearing}
              Icon={FaTrash}
              companionId={companionId}
              className="bg-red-50 border-red-200 text-red-500"
            />
          </SettingsRow>
          
          <SettingsRow 
            title="Export Your Data"
            description="Download a copy of your app data"
          >
            <Button
              label="Export"
              onClick={handleExportData}
              Icon={FaDownload}
              companionId={companionId}
            />
          </SettingsRow>
          
          <SettingsRow 
            title="Reset Settings"
            description="Restore all settings to default values"
          >
            <Button
              label="Reset"
              onClick={handleResetSettings}
              Icon={FaRedo}
              companionId={companionId}
              className="bg-yellow-50 border-yellow-200 text-yellow-600"
            />
          </SettingsRow>
        </div>
      </SettingsSection>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-[Riffic] mb-3">Confirm Action</h3>
            <p className="text-gray-600 mb-4 font-[Halogen]">
              {actionType === 'clear_chat' && 'Are you sure you want to clear all chat history with your current companion? This action cannot be undone.'}
              {actionType === 'export_data' && 'This will download a copy of your app data. Continue?'}
              {actionType === 'reset_settings' && 'Are you sure you want to reset all settings to their default values? This action cannot be undone.'}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                label="Cancel"
                onClick={() => setShowConfirmModal(false)}
                companionId={companionId}
                className="bg-gray-100 border-gray-200 text-gray-600"
              />
              <Button
                label="Confirm"
                onClick={performConfirmedAction}
                companionId={companionId}
                className={
                  actionType === 'clear_chat' ? 'bg-red-50 border-red-200 text-red-500' :
                  actionType === 'reset_settings' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                  ''
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 