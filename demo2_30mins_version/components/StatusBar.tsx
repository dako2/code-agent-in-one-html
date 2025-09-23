
import React from 'react';

const StatusBar: React.FC = () => {
  return (
    <div className="bg-[#007acc] text-white text-xs px-4 py-1 flex justify-between items-center">
      <div>Ready</div>
      <div>
        <span>UTF-8</span>
        <span className="mx-2">|</span>
        <span>TypeScript</span>
      </div>
    </div>
  );
};

export default StatusBar;
