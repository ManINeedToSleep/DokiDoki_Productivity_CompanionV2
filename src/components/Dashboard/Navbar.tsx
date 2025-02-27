"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaClock, FaComments, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { label: 'Home', icon: <FaHome size={20} />, path: '/dashboard' },
  { label: 'Timer', icon: <FaClock size={20} />, path: '/dashboard/timer' },
  { label: 'Chat', icon: <FaComments size={20} />, path: '/dashboard/chat' },
  { label: 'Settings', icon: <FaCog size={20} />, path: '/dashboard/settings' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#FFEEF3] border-b-4 border-[#FFB6C1] shadow-lg z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {navItems.map((item) => (
            <Link href={item.path} key={item.path}>
              <motion.div
                className={`
                  px-4 py-2 rounded-md cursor-pointer 
                  flex items-center gap-2 border-4
                  ${pathname === item.path 
                    ? 'border-[#FFB6C1] bg-[#FFB6C1] text-pink-900' 
                    : 'border-[#FFB6C1] bg-[#FFEEF3] text-pink-700 hover:bg-[#FFCCDD]'} 
                  transition-colors
                `}
                whileHover={{ scale: 1.05 }}
              >
                {item.icon}
                <span className="font-[Riffic] text-sm">{item.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>

        <motion.button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-md flex items-center gap-2 border-4
            border-[#FFB6C1] bg-[#FFEEF3] text-pink-700 hover:bg-[#FFCCDD]"
          whileHover={{ scale: 1.05 }}
        >
          <FaSignOutAlt size={20} />
          <span className="font-[Riffic] text-sm">Sign Out</span>
        </motion.button>
      </div>
    </nav>
  );
}
