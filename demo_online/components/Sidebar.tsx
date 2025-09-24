import React, { useState } from 'react';
import type { FileNode } from '../types';
import { TypescriptIcon, FolderIcon, FileIconGeneric, DownloadIcon, ResetIcon, CloseIcon } from './Icons';

interface SidebarProps {
  files: FileNode[];
  activeFile: string | null;
  onFileSelect: (fileName: string) => void;
  onExport: () => void;
  onReset: () => void;
  onToggle: () => void;
}

const FileIcon = ({ iconType }: { iconType?: 'typescript' }) => {
    switch (iconType) {
        case 'typescript':
            return <TypescriptIcon />;
        default:
            return <FileIconGeneric />;
    }
};

const FileTree = ({ nodes, level = 0, activeFile, onFileSelect }: { nodes: FileNode[], level?: number, activeFile: string | null, onFileSelect: (fileName: string) => void }) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ 'components': true });

  const toggleFolder = (name: string) => {
    setOpenFolders(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <ul className="text-sm">
      {nodes.map(node => (
        <li key={node.name} style={{ paddingLeft: `${level * 1}rem` }}>
          {node.children ? (
            <div>
              <div
                className="flex items-center p-1.5 cursor-pointer hover:bg-white/10 rounded-md"
                onClick={() => toggleFolder(node.name)}
              >
                <FolderIcon open={!!openFolders[node.name]} />
                <span>{node.name}</span>
              </div>
              {openFolders[node.name] && (
                <FileTree nodes={node.children} level={level + 1} activeFile={activeFile} onFileSelect={onFileSelect} />
              )}
            </div>
          ) : (
            <div
              className={`flex items-center p-1.5 cursor-pointer rounded-md ${
                activeFile === node.name ? 'bg-blue-500/30' : 'hover:bg-white/10'
              }`}
              onClick={() => onFileSelect(node.name)}
            >
              <FileIcon iconType={node.icon} />
              <span>{node.name}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ files, activeFile, onFileSelect, onExport, onReset, onToggle }) => {
  return (
    <div className="bg-[#252526] text-gray-300 p-2 flex flex-col h-full">
      <div className="flex justify-between items-center p-2 mb-2">
        <h2 className="text-xs font-bold uppercase text-gray-400">Explorer</h2>
        <div className="flex items-center space-x-1">
            <button
                onClick={onReset}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10"
                title="Reset Workspace"
            >
                <ResetIcon />
            </button>
            <button
                onClick={onExport}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10"
                title="Export Project as .zip"
            >
                <DownloadIcon />
            </button>
             <button
                onClick={onToggle}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 lg:hidden"
                title="Hide Sidebar"
            >
                <CloseIcon />
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        <FileTree nodes={files} activeFile={activeFile} onFileSelect={onFileSelect} />
      </div>
    </div>
  );
};

export default Sidebar;