import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { MessageRole } from '../types';
import { SendIcon, GeminiIcon, CloseIcon } from './Icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  userInput: string;
  onUserInput: (input: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  onToggle: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, userInput, onUserInput, onSendMessage, isLoading, onToggle }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        onSendMessage();
      }
    }
  };
  
  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === MessageRole.SYSTEM) {
        return <p className="text-xs text-gray-400 italic text-center">{msg.content}</p>;
    }

    return (
       <div className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
        msg.role === MessageRole.USER
          ? 'bg-blue-600 text-white rounded-br-none'
          : 'bg-[#3a3a3a] text-gray-200 rounded-bl-none'
      }`}>
        {msg.role === MessageRole.MODEL && (
          <div className="flex items-center mb-2">
              <GeminiIcon />
              <span className="font-bold ml-2 text-sm">Gemini AI</span>
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap prose prose-invert prose-sm"
          dangerouslySetInnerHTML={{
              __html: msg.content.replace(/```(\w+)?\s*([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
          }}
        />
         {isLoading && msg.role === MessageRole.MODEL && messages[messages.length - 1] === msg && (
          <div className="inline-block h-2 w-2 bg-white rounded-full animate-ping ml-2"></div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#252526] text-gray-300 flex flex-col border-l border-black/30 h-full">
      <div className="flex justify-between items-center p-3 border-b border-black/30">
        <h2 className="text-xs font-bold uppercase text-gray-400">
          AI Assistant
        </h2>
        <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 lg:hidden"
            title="Hide Chat"
        >
            <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${
            msg.role === MessageRole.USER 
                ? 'justify-end' 
                : msg.role === MessageRole.SYSTEM ? 'justify-center' : 'justify-start'
            }`}>
             {renderMessageContent(msg)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-black/30">
        <div className="relative">
          <input
            type="text"
            value={userInput}
            onChange={(e) => onUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the AI anything..."
            className="w-full bg-[#3c3c3c] text-gray-200 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={onSendMessage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-white hover:bg-blue-600 disabled:text-gray-600 disabled:hover:bg-transparent"
            disabled={isLoading || !userInput.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;