"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAudio } from "@/lib/contexts/AudioContext";

interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    path: string;
    isExternal?: boolean;
  };
}

const HELP_ITEMS: HelpItem[] = [
  {
    id: 'faq',
    title: "FAQ",
    description: "Have questions? Find quick answers to common questions about DDPC!",
    icon: "❓",
    action: {
      label: "View FAQ",
      path: '/faqs',
      isExternal: false
    }
  },
  {
    id: 'feedback',
    title: "Share Your Thoughts",
    description: "We'd love to hear your feedback! Share your experience, suggestions, or just say hello.",
    icon: "💬",
    action: {
      label: "Send Feedback",
      path: "mailto:bguna0050@launchpadphilly.org?subject=DDPC%20Feedback",
      isExternal: true
    }
  },
  {
    id: 'bugs',
    title: "Found a Bug?",
    description: "Help us improve DDPC by reporting issues or contributing to our open source project!",
    icon: "🐛",
    action: {
      label: "Report Issue",
      path: "https://github.com/ManINeedToSleep/DokiDoki_Productivity_Companion/issues/new",
      isExternal: true
    }
  }
];

export default function Help() {
  const router = useRouter();
  const { playSoundEffect } = useAudio();

  const handleButtonClick = (path: string, isExternal: boolean = false) => {
    // Play sound effect
    playSoundEffect('select');
    
    // Navigate after a small delay
    setTimeout(() => {
      if (isExternal) {
        window.open(path, '_blank');
      } else {
        router.push(path || '#');
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-[Riffic] text-pink-600 mb-4">Help & Support</h3>
      
      <div className="space-y-4">
        {HELP_ITEMS.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex gap-4 p-4 rounded-lg bg-white/60 shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="text-3xl">{item.icon}</div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-pink-600">{item.title}</h4>
              <p className="text-sm text-gray-700 mt-1">{item.description}</p>
              
              {item.action && (
                <button
                  className="mt-2 text-sm font-medium text-pink-500 hover:text-pink-700 transition-colors"
                  onClick={() => {
                    if (item.action) {
                      handleButtonClick(item.action.path, item.action.isExternal);
                    }
                  }}
                  onMouseEnter={() => playSoundEffect('hover')}
                >
                  {item.action.label} →
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-4">
        <p className="text-gray-500 italic text-sm">
          Thank you for helping make DDPC better! 💕
        </p>
      </div>
    </div>
  );
}
