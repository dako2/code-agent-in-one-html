import React from 'react';
import MonacoEditor from './MonacoEditor';

interface EditorPanelProps {
  isSelected: boolean;
  fileContent: string;
  onContentChange: (newContent: string) => void;
  language: string;
  zoomLevel: number;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ isSelected, fileContent, onContentChange, language, zoomLevel }) => {
  return (
    <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
      {isSelected ? (
        <MonacoEditor
          value={fileContent}
          onChange={onContentChange}
          language={language}
          zoomLevel={zoomLevel}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
            <p>Select a file from the explorer to begin editing.</p>
        </div>
      )}
    </div>
  );
};

export default EditorPanel;
