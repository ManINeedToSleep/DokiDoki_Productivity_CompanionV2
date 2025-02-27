"use client";

import dynamic from 'next/dynamic';

const NewGame = dynamic(() => import('./NewGame'));
const LoadGame = dynamic(() => import('./LoadGame'));
const Options = dynamic(() => import('./Options'));
const Help = dynamic(() => import('./Help'));
const Extra = dynamic(() => import('./Extra'));

interface MenuContentProps {
  selectedItem: string;
}

export default function MenuContent({ selectedItem }: MenuContentProps) {
  const renderContent = () => {
    switch (selectedItem) {
      case 'new-game':
        return <NewGame />;
      case 'load-game':
        return <LoadGame />;
      case 'options':
        return <Options />;
      case 'help':
        return <Help />;
      case 'extra':
        return <Extra />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {renderContent()}
    </div>
  );
} 