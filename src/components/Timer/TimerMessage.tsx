import React, { useEffect, useState } from 'react';
import { TimerMessageProps } from './types';
import DialogueNotification from '@/components/Common/Notifications/DialogueNotification';
import { 
  getSessionCompleteDialogue,
  getCompanionDialogue
} from '@/lib/firebase/dialogue';

const TimerMessage: React.FC<TimerMessageProps> = ({ 
  message, 
  timerState,
  companionId,
  mood = 'happy',
  affinity = 50,
  sessionDuration = 0,
  consecutiveDays = 0,
  onClose
}) => {
  const [dialogueMessage, setDialogueMessage] = useState<string>('');
  
  useEffect(() => {
    // If there's already a specific message passed, use that instead
    if (message) {
      console.log("Using provided message:", message);
      setDialogueMessage(message);
      return;
    }
    
    // Otherwise, generate a message based on timer state
    let generatedMessage = '';
    
    try {
      // Log parameters for debugging
      console.log("Generating dialogue for:", {
        timerState,
        companionId,
        mood,
        affinity,
        sessionDuration,
        consecutiveDays
      });
      
      switch (timerState) {
        case 'idle':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            undefined, 
            'encouragement'
          );
          // If we got a default fallback, use a specific message instead
          if (generatedMessage.includes("[Default")) {
            generatedMessage = "Ready to start focusing? I'm here to help you stay on track!";
          }
          console.log("Idle message:", generatedMessage);
          break;
        
        case 'running':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            { focusStats: { currentSessionTime: Math.floor(sessionDuration / 60), dailyFocusTime: 0, breaksTaken: 0 } }, 
            'session.during'
          );
          // If we got a default fallback, use a specific message instead
          if (generatedMessage.includes("[Default")) {
            generatedMessage = "You're doing great! Keep focusing, I believe in you!";
          }
          console.log("Running message:", generatedMessage);
          break;
        
        case 'paused':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            undefined, 
            'encouragement'
          );
          console.log("Paused message:", generatedMessage);
          break;
          
        case 'completed':
          generatedMessage = getSessionCompleteDialogue(
            companionId,
            mood,
            affinity,
            { 
              currentSessionTime: Math.floor(sessionDuration / 60), 
              dailyFocusTime: Math.floor(sessionDuration / 60), 
              breaksTaken: 0, 
              totalSessions: 1 
            }
          );
          console.log("Completed message:", generatedMessage);
          break;
        
        case 'break':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            { isBreakTime: true }, 
            'session.break'
          );
          console.log("Break message:", generatedMessage);
          break;
      }
    } catch (error) {
      console.error("Error generating dialogue message:", error);
      generatedMessage = "Let's focus on your work!";
    }
    
    setDialogueMessage(
      generatedMessage && !generatedMessage.includes("[Default") 
        ? generatedMessage 
        : "Let's do our best today!"
    );
  }, [timerState, message, companionId, mood, affinity, sessionDuration, consecutiveDays]);
  
  if (!dialogueMessage) return null;
  
  return (
    <DialogueNotification
      companionId={companionId}
      message={dialogueMessage}
      onClose={onClose}
      position="bottom-right"
    />
  );
};

export default TimerMessage; 