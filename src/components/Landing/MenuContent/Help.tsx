"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/Common/Button/Button";
import Card from "@/components/Common/Card/Card";

interface HelpSection {
  id: string;
  title: string;
  description: string;
  action: {
    label: string;
    path: string;
    isExternal?: boolean;
  };
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'faq',
    title: "FAQ",
    description: "Have questions? Find quick answers to common questions about DDPC!",
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
    action: {
      label: "Report Issue",
      path: "https://github.com/ManINeedToSleep/DokiDoki_Productivity_Companion/issues/new",
      isExternal: true
    }
  }
];

export default function Help() {
  const router = useRouter();

  return (
    <Card>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-[Riffic] text-pink-700 mb-4">Help & Support</h2>
          <p className="text-pink-500 italic">We&apos;re here to assist you!</p>
        </motion.div>

        <div className="space-y-6">
          {HELP_SECTIONS.map((section, index) => (
            <motion.div
              key={section.id}
              className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-lg shadow-lg border-2 border-pink-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className="text-2xl text-pink-800 mb-4 font-[Riffic]">{section.title}</h3>
              <p className="text-pink-900 mb-6 leading-relaxed">{section.description}</p>
              
              <div className="flex justify-start">
                <Button 
                  label={section.action.label}
                  onClick={() => {
                    if (section.action.isExternal) {
                      window.open(section.action.path, '_blank');
                    } else {
                      router.push(section.action.path);
                    }
                  }}
                  className="text-lg px-8 py-3 shadow-lg hover:scale-105 transform transition-all"
                />
              </div>
            </motion.div>
          ))}

          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-pink-500 italic">
              Thank you for helping make DDPC better! 💕
            </p>
          </motion.div>
        </div>
      </div>
    </Card>
  );
}
