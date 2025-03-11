"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import SceneBackground from '@/components/Companion/SceneBackground';
import EnhancedCompanionDisplay from '@/components/Companion/EnhancedCompanionDisplay';
import DialogueBox from '@/components/Companion/DialogueBox';
import Button from '@/components/Common/Button/Button';
import { Topic } from '@/components/Companion/TopicMenu';
import DialogueOptions, { DialogueOption } from '@/components/Companion/DialogueOptions';

// Sample topics for the prototype
const sampleTopics: Topic[] = [
  { id: 'how-are-you', title: 'How are you today?', category: 'general', affinityRequired: 0 },
  { id: 'what-do-you-like', title: 'What do you like to do?', category: 'personal', affinityRequired: 50 },
  { id: 'tell-me-about-yourself', title: 'Tell me about yourself', category: 'personal', affinityRequired: 0 },
  { id: 'favorite-books', title: 'Favorite books?', category: 'personal', affinityRequired: 100, isNew: true },
  { id: 'play-game', title: 'Play a game', category: 'game', affinityRequired: 200 },
  { id: 'writing-tips', title: 'Writing tips', category: 'special', affinityRequired: 150 },
];

// Quick dialogue options for the right sidebar
const quickDialogueOptions = [
  { id: 'unseen', text: 'Unseen' },
  { id: 'hey', text: 'Hey, {name}...' },
  { id: 'repeat', text: 'Repeat conversation' },
  { id: 'love', text: 'I love you!' },
  { id: 'feel', text: 'I feel...' },
  { id: 'goodbye', text: 'Goodbye' },
  { id: 'nevermind', text: 'Nevermind' },
];

// Topic categories
const topicCategories = [
  { id: 'general', text: 'General' },
  { id: 'personal', text: 'Personal' },
  { id: 'game', text: 'Activities' },
  { id: 'special', text: 'Special' },
  { id: 'back', text: 'Nevermind' }
];

// Sample dialogue options
const dialogueFlows: Record<string, {
  dialogue: string;
  options: DialogueOption[];
  responses: Record<string, string>;
}> = {
  'how-are-you': {
    dialogue: "I'm doing well today, thank you for asking! It's nice to have someone to talk to. How about you?",
    options: [
      { id: 'good', text: "I'm doing great too!", effect: 'positive', affinity: 5, responseId: 'good' },
      { id: 'ok', text: "I'm okay, just a bit tired.", effect: 'neutral', responseId: 'ok' },
      { id: 'bad', text: "Actually, I'm having a rough day...", effect: 'negative', responseId: 'bad' }
    ],
    responses: {
      'good': "That's wonderful to hear! Positive energy is so important for productivity.",
      'ok': "Maybe some focused work will help energize you. Or perhaps you should consider a short break?",
      'bad': "I'm sorry to hear that. Remember that it's okay to have difficult days. Would you like to talk about it more?"
    }
  },
  'what-do-you-like': {
    dialogue: "I enjoy reading books, particularly those with deeper meanings and elegant prose. Poetry is also quite fascinating to me. What about you?",
    options: [
      { id: 'reading', text: "I enjoy reading too!", effect: 'positive', affinity: 10, responseId: 'reading' },
      { id: 'games', text: "I prefer playing games.", effect: 'neutral', responseId: 'games' },
      { id: 'productivity', text: "I'm focused on being productive, like using this app.", effect: 'positive', affinity: 5, responseId: 'productivity' }
    ],
    responses: {
      'reading': "It's wonderful to meet a fellow book enthusiast! Perhaps we could discuss literature sometime.",
      'games': "Games can be a great way to relax and engage your mind. What kinds do you enjoy?",
      'productivity': "That's admirable. Having tools that help you stay focused is important. I hope I can assist you in your productivity journey."
    }
  },
  'tell-me-about-yourself': {
    dialogue: "Well... I enjoy quiet activities like reading and writing. I tend to be introspective and thoughtful. How would you describe yourself?",
    options: [
      { id: 'similar', text: "We're actually quite similar!", effect: 'positive', affinity: 15, responseId: 'similar' },
      { id: 'outgoing', text: "I'm more outgoing and energetic.", effect: 'neutral', responseId: 'outgoing' },
      { id: 'curious', text: "I'm curious to learn more about you.", effect: 'positive', affinity: 5, responseId: 'curious' }
    ],
    responses: {
      'similar': "Really? That's... quite nice to hear. It's comforting to know we share similar temperaments.",
      'outgoing': "I've always admired people with that kind of energy. Perhaps we balance each other well.",
      'curious': "I'm flattered by your interest. There's much I could share, though I tend to be private by nature."
    }
  },
  'favorite-books': {
    dialogue: "I gravitate toward psychological literature and poetry. Portrait of Markov is fascinating, though quite dark. Do you enjoy reading?",
    options: [
      { id: 'yes-books', text: "Yes, I love books too!", effect: 'positive', affinity: 10, responseId: 'yes-books' },
      { id: 'sometimes', text: "Sometimes, when I have time.", effect: 'neutral', responseId: 'sometimes' },
      { id: 'ask-recommend', text: "Could you recommend something?", effect: 'positive', affinity: 5, responseId: 'ask-recommend' }
    ],
    responses: {
      'yes-books': "That's wonderful. Books offer a special kind of companionship, don't they?",
      'sometimes': "Finding time can be challenging. Even a few minutes with a good book can be worthwhile though.",
      'ask-recommend': "For someone just starting, I might suggest 'The Book of Secrets' – it's engaging without being overwhelming."
    }
  }
};

export default function CompanionPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // UI States
  const [currentDialogue, setCurrentDialogue] = useState<string>('');
  const [currentBackground, setCurrentBackground] = useState<string>('classroom');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('afternoon');
  
  // Dialogue flow states
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [currentOptions, setCurrentOptions] = useState<DialogueOption[]>([]);
  const [dialogueComplete, setDialogueComplete] = useState<boolean>(false);
  
  // Navigation states
  const [showTopicCategories, setShowTopicCategories] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      const fetchUserData = async () => {
        setIsLoadingData(true);
        try {
          const data = await getUserDocument(user.uid);
          setUserData(data);
          
          // Set welcome message
          const selectedCompanion = data?.settings?.selectedCompanion || 'sayori';
          const greeting = getCompanionGreeting(selectedCompanion);
          setCurrentDialogue(greeting);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchUserData();
    }
  }, [isLoading, user, router]);
  
  // Helper functions
  const getCompanionName = (id: string) => {
    switch(id) {
      case 'sayori': return 'Sayori';
      case 'natsuki': return 'Natsuki';
      case 'yuri': return 'Yuri';
      case 'monika': return 'Monika';
      default: return 'Character';
    }
  };
  
  const getCompanionGreeting = (id: string) => {
    switch(id) {
      case 'sayori': return "Hi there! I'm so happy to see you today! What should we talk about?";
      case 'natsuki': return "Oh, it's you. What do you want to talk about? Don't waste my time!";
      case 'yuri': return "Hello... It's nice to see you. Did you want to discuss something?";
      case 'monika': return "Hi there! It's just the two of us now. What would you like to talk about?";
      default: return "Hello! How can I help you today?";
    }
  };
  
  const showOptionsAfterDelay = (delay: number) => {
    if (activeTopic && !dialogueComplete && !showOptions) {
      setTimeout(() => {
        setShowOptions(true);
      }, delay);
    }
  };
  
  const handleDialogueComplete = () => {
    if (activeTopic && !dialogueComplete && !showOptions) {
      setShowOptions(true);
    }
  };
  
  const handleTopicSelect = (topicId: string) => {
    // Find the topic
    const topic = sampleTopics.find(t => t.id === topicId);
    if (!topic) return;
    
    // Get the dialogue flow for this topic
    const flow = dialogueFlows[topic.id];
    if (flow) {
      setActiveTopic(topic.id);
      setCurrentDialogue(flow.dialogue);
      setCurrentOptions(flow.options);
      setShowOptions(false);
      setDialogueComplete(false);
      
      // Reset navigation state
      setShowTopicCategories(false);
      setSelectedCategory(null);
      
      // Show options after dialogue complete (use new function)
      showOptionsAfterDelay(flow.dialogue.length * 30 + 500);
    } else {
      // Fallback for topics without defined flows
      setCurrentDialogue(`You want to talk about "${topic.title}"? I'd love to discuss that!`);
      setActiveTopic(null);
      setCurrentOptions([]);
      setShowOptions(false);
      
      // Reset navigation state
      setShowTopicCategories(false);
      setSelectedCategory(null);
    }
  };
  
  const handleOptionSelect = (option: DialogueOption) => {
    if (!activeTopic || !option.responseId) return;
    
    const flow = dialogueFlows[activeTopic];
    if (flow && flow.responses[option.responseId]) {
      setCurrentDialogue(flow.responses[option.responseId]);
      setShowOptions(false);
      setDialogueComplete(true);
      
      // TODO: Update affinity based on option.affinity
      console.log(`Affinity change: ${option.affinity || 0}`);
    }
  };
  
  // Add a function to toggle background and time settings
  const changeSceneSettings = () => {
    // Cycle through backgrounds
    const backgrounds = ['classroom', 'clubroom', 'hallway', 'kitchen', 'library', 'store'];
    const currentBgIndex = backgrounds.indexOf(currentBackground);
    const nextBgIndex = (currentBgIndex + 1) % backgrounds.length;
    setCurrentBackground(backgrounds[nextBgIndex]);
    
    // Cycle through times of day
    const times: Array<'morning' | 'afternoon' | 'evening' | 'night'> = ['morning', 'afternoon', 'evening', 'night'];
    const currentTimeIndex = times.indexOf(timeOfDay);
    const nextTimeIndex = (currentTimeIndex + 1) % times.length;
    setTimeOfDay(times[nextTimeIndex]);
  };
  
  const handleQuickDialogue = (option: { id: string, text: string }) => {
    const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
    const localCompanionName = getCompanionName(selectedCompanion);
    const currentAffinity = userData?.companions?.[selectedCompanion]?.affinityLevel || 0;
    
    // Handle Talk option specially
    if (option.id === 'talk') {
      setShowTopicCategories(true);
      return;
    }
    
    switch(option.id) {
      case 'unseen':
        setCurrentDialogue("You haven't unlocked any new content yet. Keep interacting to increase affinity!");
        break;
      case 'hey':
        setCurrentDialogue(`Yes? What can I do for you, ${localCompanionName} is listening.`);
        break;
      case 'repeat':
        // Just keep the current dialogue
        break;
      case 'love':
        setCurrentDialogue(`I... I'm flattered. Thank you for your feelings.`);
        break;
      case 'feel':
        setCurrentDialogue(`How are you feeling today? I'm here to listen.`);
        break;
      case 'goodbye':
        setCurrentDialogue(`Goodbye! I hope to see you again soon.`);
        break;
      case 'nevermind':
        setCurrentDialogue(`Oh, alright then. Is there something else you'd like to talk about?`);
        break;
      case 'back':
        // Switch back to main options
        setShowTopicCategories(false);
        setSelectedCategory(null);
        break;
      case 'extra':
        setCurrentDialogue(`I'm ${localCompanionName}. Your current affinity with me is ${currentAffinity} points. Let me tell you a bit about myself...`);
        // Change the scene when clicking Extra
        changeSceneSettings();
        break;
      case 'music':
        setCurrentDialogue("Would you like to play some music? What kind do you enjoy?");
        break;
      case 'play':
        setCurrentDialogue("Would you like to play a game together? I'd enjoy that.");
        break;
      default:
        // Handle topic category selection
        if (option.id === 'general' || option.id === 'personal' || option.id === 'game' || option.id === 'special') {
          setSelectedCategory(option.id);
        } else {
          setCurrentDialogue(`${localCompanionName} says: You selected ${option.text}`);
        }
    }
    
    setActiveTopic(null);
    setShowOptions(false);
  };
  
  const handleTopicCategorySelect = (categoryId: string) => {
    if (categoryId === 'back') {
      // Go back to main options
      setShowTopicCategories(false);
      setSelectedCategory(null);
    } else {
      // Set the selected category
      setSelectedCategory(categoryId);
    }
  };
  
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading companion data...</p>
        </div>
      </div>
    );
  }
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  const companionName = getCompanionName(selectedCompanion);
  
  // Get filtered topics if a category is selected
  const filteredTopics = selectedCategory 
    ? sampleTopics.filter(topic => topic.category === selectedCategory)
    : [];
  
  return (
    <div className="h-screen w-full overflow-hidden bg-black flex flex-col companion-page">
      {/* Main content area */}
      <div className="flex-grow relative">
        {/* Scene with background and character */}
        <SceneBackground
          backgroundId={currentBackground}
          timeOfDay={timeOfDay}
        >
          {/* Character Display - properly centered */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="relative" style={{ height: '80vh' }}>
              <EnhancedCompanionDisplay
                companionId={selectedCompanion}
                mood={userData?.companions?.[selectedCompanion]?.mood || 'happy'}
                position="center"
                size="large"
              />
            </div>
          </div>
          
          {/* Left Side Buttons - aligned with right side */}
          <div className="absolute top-1/3 left-10 z-20 w-40 space-y-4">
            <Button 
              label="Talk" 
              onClick={() => handleQuickDialogue({ id: 'talk', text: 'Talk' })} 
              companionId={selectedCompanion}
              className="w-full py-3"
            />
            <Button 
              label="Extra" 
              onClick={() => handleQuickDialogue({ id: 'extra', text: 'Extra' })} 
              companionId={selectedCompanion}
              className="w-full py-3"
            />
            <Button 
              label="Music" 
              onClick={() => handleQuickDialogue({ id: 'music', text: 'Music' })} 
              companionId={selectedCompanion}
              className="w-full py-3"
            />
            <Button 
              label="Play" 
              onClick={() => handleQuickDialogue({ id: 'play', text: 'Play' })} 
              companionId={selectedCompanion}
              className="w-full py-3"
            />
          </div>
          
          {/* Right Side Options - aligned with left side */}
          <div className="absolute top-1/3 right-10 z-20 w-72 space-y-2">
            {showTopicCategories ? (
              // Show topic categories or filtered topics
              selectedCategory ? (
                // Show topics in the selected category
                <>
                  {filteredTopics.map(topic => (
                    <Button
                      key={topic.id}
                      label={topic.title}
                      companionId={selectedCompanion}
                      className="w-full text-center py-3 bg-pink-100/90"
                      onClick={() => handleTopicSelect(topic.id)}
                    />
                  ))}
                  <Button
                    label="Back"
                    companionId={selectedCompanion}
                    className="w-full text-center py-3 bg-pink-100/90"
                    onClick={() => handleTopicCategorySelect('back')}
                  />
                </>
              ) : (
                // Show topic categories
                topicCategories.map(category => (
                  <Button
                    key={category.id}
                    label={category.text}
                    companionId={selectedCompanion}
                    className="w-full text-center py-3 bg-pink-100/90"
                    onClick={() => handleTopicCategorySelect(category.id)}
                  />
                ))
              )
            ) : (
              // Show quick dialogue options
              quickDialogueOptions.map(option => (
                <Button
                  key={option.id}
                  label={option.text.replace('{name}', companionName)}
                  companionId={selectedCompanion}
                  className="w-full text-center py-3 bg-pink-100/90"
                  onClick={() => handleQuickDialogue(option)}
                />
              ))
            )}
          </div>
          
          {/* Dialogue Box (moved up from bottom) */}
          <div className="absolute bottom-16 left-0 right-0 px-4 z-20">
            <DialogueBox
              text={currentDialogue}
              speakerName={companionName}
              companionId={selectedCompanion}
              typingSpeed={30}
              onComplete={handleDialogueComplete}
            />
            
            {/* Dialogue Options (below dialogue box) */}
            {showOptions && (
              <div className="mt-4 max-h-[150px] overflow-y-auto">
                <DialogueOptions
                  options={currentOptions}
                  companionId={selectedCompanion}
                  onSelectOption={handleOptionSelect}
                  isVisible={showOptions}
                />
              </div>
            )}
          </div>
        </SceneBackground>
      </div>
    </div>
  );
}
