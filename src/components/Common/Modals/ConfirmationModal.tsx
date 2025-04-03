"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Common/Button/Button';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  companionId: CompanionId;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'normal' | 'danger' | 'warning';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  companionId,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'normal'
}: ConfirmationModalProps) {
  const colors = getCharacterColors(companionId);
  
  // Get header colors based on type
  const getHeaderStyles = () => {
    switch (type) {
      case 'danger':
        return {
          background: '#FFE8E8',
          borderColor: colors.primary,
          textColor: '#D14D61'
        };
      case 'warning':
        return {
          background: '#FFF9E8',
          borderColor: colors.primary,
          textColor: '#D1A64D'
        };
      default:
        return {
          background: `${colors.primary}20`,
          borderColor: colors.primary,
          textColor: colors.text
        };
    }
  };
  
  const headerStyles = getHeaderStyles();
  
  // Get confirmation button styles based on type
  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-500';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      default:
        return '';
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-4 border-2"
            style={{ borderColor: headerStyles.borderColor }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div 
              className="px-6 py-4 flex items-center"
              style={{ 
                backgroundColor: headerStyles.background,
                borderBottom: `2px dashed ${headerStyles.borderColor}40`
              }}
            >
              <h3 
                className="text-xl font-[Riffic]"
                style={{ color: headerStyles.textColor }}
              >
                {title}
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p 
                className="text-base mb-8 font-[Halogen]"
                style={{ color: colors.text }}
              >
                {message}
              </p>
              
              <div className="flex justify-end gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    label={cancelLabel}
                    onClick={onCancel}
                    companionId={companionId}
                    className="bg-opacity-10 border-opacity-40"
                  />
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    label={confirmLabel}
                    onClick={onConfirm}
                    companionId={companionId}
                    className={getConfirmButtonClass()}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 