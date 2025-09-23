import React from 'react';
import { FilesIcon, CodeBracketIcon, ChatIcon } from './Icons';

interface BottomNavBarProps {
  activeView: 'explorer' | 'editor' | 'chat';
  onViewChange: (view: 'explorer' | 'editor' | 'chat') => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { view: 'explorer', icon: <FilesIcon />, label: 'Explorer' },
    { view: 'editor', icon: <CodeBracketIcon />, label: 'Editor' },
    { view: 'chat', icon: <ChatIcon />, label: 'Chat' },
  ];

  return (
    <div className="flex lg:hidden justify-around items-center bg-[#252526] border-t border-black/30 h-16">
      {navItems.map(item => (
        <button
          key={item.view}
          onClick={() => onViewChange(item.view as 'explorer' | 'editor' | 'chat')}
          className={`flex flex-col items-center justify-center w-full h-full text-xs focus:outline-none transition-colors duration-200 ${
            activeView === item.view ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {React.cloneElement(item.icon, { className: 'w-6 h-6 mb-1' })}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;
