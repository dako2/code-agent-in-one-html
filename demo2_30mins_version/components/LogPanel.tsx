import React, { useState, useEffect, useRef } from 'react';

const TABS = ['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL'];

interface LogPanelProps {
    logs: string[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
    const [activeTab, setActiveTab] = useState('OUTPUT');
    const outputEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (activeTab === 'OUTPUT') {
            outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'OUTPUT':
                return (
                    <div className="text-xs text-gray-400 font-mono p-2">
                        {logs.map((log, index) => {
                            let textColor = 'text-gray-400';
                            if (log.startsWith('[SUCCESS]')) textColor = 'text-green-400';
                            if (log.startsWith('[ERROR]')) textColor = 'text-red-400';
                            if (log.startsWith('[INFO]')) textColor = 'text-blue-400';
                            
                            return <div key={index} className={`whitespace-pre-wrap ${textColor}`}>{log}</div>
                        })}
                        <div ref={outputEndRef} />
                    </div>
                );
            case 'PROBLEMS':
                return <div className="p-2 text-sm text-gray-500">No problems have been detected.</div>;
            case 'DEBUG CONSOLE':
                return <div className="p-2 text-sm text-gray-500">Debug console is empty.</div>;
            case 'TERMINAL':
                return <div className="p-2 text-sm text-gray-500">Terminal is inactive.</div>;
            default:
                return null;
        }
    };

    return (
        <div className="h-48 flex flex-col bg-[#252526] border-t border-black/30">
            <div className="flex items-center border-b border-black/30 px-2">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-3 text-xs focus:outline-none ${
                            activeTab === tab 
                            ? 'text-white border-b-2 border-blue-500' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default LogPanel;