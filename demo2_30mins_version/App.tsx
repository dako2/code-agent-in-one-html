



import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Chat, Content } from '@google/genai';
import Sidebar from './components/Sidebar';
import EditorPanel from './components/EditorPanel';
import ChatPanel from './components/ChatPanel';
import LogPanel from './components/LogPanel';
import type { FileNode, ChatMessage } from './types';
import { MessageRole } from './types';
import { createChatSession } from './services/geminiService';
import {
  listFilesRecursive,
  readFileByPath,
  createFileByPath,
  updateFileByPath,
  deleteFileByPath
} from './utils/fileSystem';
import { FilesIcon, ChatIcon, PlusIcon, MinusIcon } from './components/Icons';
import BottomNavBar from './components/BottomNavBar';
import { useWindowHeight } from './hooks/useWindowHeight';

// Let TypeScript know that JSZip is available globally
declare var JSZip: any;

const LOCAL_STORAGE_KEY_FILES = 'gemini-ai-code-assistant-files';
const LOCAL_STORAGE_KEY_MESSAGES = 'gemini-ai-code-assistant-messages';

const initialFiles: FileNode[] = [
  {
    name: 'README.md',
    content: `# Welcome to the Gemini AI Code Assistant!

This is an interactive coding environment where you can build and modify web applications with the help of a powerful AI assistant.

## How to Use This Tool

### 1. The Interface

The application is divided into a few key areas:

-   **File Explorer (Left):** This panel shows your project's file and folder structure. You can click on any file to open it in the editor. You can also export your entire project as a \`.zip\` file or reset the workspace to this initial state using the icons at the top.
-   **Editor (Center):** This is where you'll see the content of the currently selected file. You can edit the code directly here.
-   **AI Assistant (Right):** This is your chat interface with the Gemini AI. You can ask it to perform tasks, explain concepts, or generate code. The AI has full context of your project's file structure and the content of the file you currently have open.
-   **Output Panel (Bottom):** This panel shows logs of what the AI is doing behind the scenes. When the AI uses its tools to create, read, or update files, you'll see a log of those actions here. This is also where any errors will be displayed.

### 2. Interacting with the AI

You can give the AI commands in plain English. Here are a few examples to get you started:

**Creating Files:**

> "Create a new file called \`styles.css\` and add some basic styles to make the background dark and the text white."

**Generating Components:**

> "Create a new React component in \`components/Header.tsx\`. It should be a functional component that displays a title: 'My Awesome App'."

**Modifying Existing Code:**

> "Modify the currently open file. Add a new button that, when clicked, shows an alert message saying 'Hello World!'"

**Refactoring Code:**

> "Can you refactor this file to use functional components and hooks instead of class components?"

**Explaining Code:**

> "What does the \`useState\` hook do? Explain it to me like I'm a beginner."

### 3. Getting Started

Try it now! Ask the AI to create a simple "Hello, World!" \`index.html\` file to get started.

Happy coding!
`,
  },
  {
    name: 'hello.py',
    content: `def hello_world():
    """This is a simple python function."""
    print("Hello from Python!")

hello_world()
`,
  },
];

const initialMessages: ChatMessage[] = [
  {
    role: MessageRole.MODEL,
    content: "Welcome! I'm your AI coding partner. I've set up a `README.md` file with a quick tutorial to get you started. Take a look, and then let me know what you'd like to build!",
  },
];

const getLanguageFromPath = (path: string | null): string => {
    if (!path) return 'plaintext';
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'json':
            return 'json';
        case 'css':
            return 'css';
        case 'html':
            return 'html';
        case 'md':
            return 'markdown';
        case 'py':
            return 'python';
        default:
            return 'plaintext';
    }
}

const App: React.FC = () => {
  const [files, setFiles] = useState<FileNode[]>(() => {
    try {
      const savedFiles = localStorage.getItem(LOCAL_STORAGE_KEY_FILES);
      return savedFiles ? JSON.parse(savedFiles) : initialFiles;
    } catch (error) {
      console.error("Error loading files from local storage:", error);
      return initialFiles;
    }
  });
  const [activeFile, setActiveFile] = useState<string | null>('README.md');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY_MESSAGES);
      return savedMessages ? JSON.parse(savedMessages) : initialMessages;
    // FIX: Added a missing opening curly brace to the catch block to fix a syntax error.
    } catch (error) {
      console.error("Error loading messages from local storage:", error);
      return initialMessages;
    }
  });
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] Application initialized.`]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth >= 1024);
  const [isChatVisible, setIsChatVisible] = useState(window.innerWidth >= 1024);
  const [editorLanguage, setEditorLanguage] = useState(getLanguageFromPath(activeFile));
  const [editorZoomLevel, setEditorZoomLevel] = useState(100);
  const chatRef = useRef<Chat | null>(null);
  const windowHeight = useWindowHeight();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeMobileView, setActiveMobileView] = useState<'explorer' | 'editor' | 'chat'>('editor');
  
  const addLog = useCallback((message: string, type: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prevLogs => [...prevLogs, `[${type}] ${timestamp}: ${message}`]);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
        setIsMobile(!e.matches);
    };
    setIsMobile(!mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    return () => mediaQuery.removeEventListener('change', handleMediaQueryChange);
  }, []);

  useEffect(() => {
    const history: Content[] = messages
      .filter(m => m.role === MessageRole.USER || m.role === MessageRole.MODEL)
      .map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));
    
    if (history.length > 0 && history[history.length - 1].role === 'model' && history[history.length-1].parts[0].text === '') {
        history.pop();
    }
      
    chatRef.current = createChatSession(history);
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_FILES, JSON.stringify(files));
      localStorage.setItem(LOCAL_STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (error) {
      addLog(`Error saving state to local storage: ${error}`, 'ERROR');
    }
  }, [files, messages, addLog]);

  const handleFileSelect = useCallback((fileName: string) => {
    const file = findFileByPath(files, fileName.split('/'));
    if (file && file.content !== undefined) {
      setActiveFile(fileName);
      setEditorLanguage(getLanguageFromPath(fileName));
      addLog(`Opened file: ${fileName}`);
    }
  }, [files, addLog]);

  const handleContentChange = useCallback((newContent: string) => {
    if (activeFile) {
      setFiles(prevFiles => updateFileByPath(prevFiles, activeFile, newContent));
    }
  }, [activeFile]);
  
  const handleZoomIn = useCallback(() => {
    setEditorZoomLevel(prev => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setEditorZoomLevel(prev => Math.max(prev - 10, 50));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || !chatRef.current) return;

    addLog(`Sending user request to AI: "${userInput}"`);
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    const fileTree = listFilesRecursive(files).join('\n');
    const currentFileContent = activeFile ? readFileByPath(files, activeFile) ?? '' : '';
    const fileExtension = activeFile?.split('.').pop() || '';

    let situationalContext = `# Project Context\n\n## File System Structure\n\`\`\`\n${fileTree}\n\`\`\`\n\n`;
    if (activeFile) {
        situationalContext += `## Currently Open File: \`${activeFile}\`\n\n### File Content:\n\`\`\`${fileExtension}\n${currentFileContent}\n\`\`\`\n\n`;
    } else {
        situationalContext += `## No file is currently open.\n\n`;
    }
    situationalContext += `# User Request\n${userInput}`;
    
    try {
        let stream = await chatRef.current.sendMessageStream({ message: situationalContext });
        let modelResponse = '';
        let functionCalls: any[] = [];
        let finalMessages = [...messages, userMessage];

        for await (const chunk of stream) {
            if (chunk.text) {
                modelResponse += chunk.text;
                setMessages([...finalMessages, { role: MessageRole.MODEL, content: modelResponse }]);
            } else if (chunk.functionCalls) {
                functionCalls.push(...chunk.functionCalls);
            }
        }
        
        finalMessages.push({ role: MessageRole.MODEL, content: modelResponse });

        if (functionCalls.length > 0) {
            const toolResponseParts = [];
            for (const call of functionCalls) {
                addLog(`AI calling tool: '${call.name}' with args: ${JSON.stringify(call.args)}`);
                let result; let success = true;
                switch (call.name) {
                    case 'listFiles': result = { files: listFilesRecursive(files) }; break;
                    case 'readFile':
                        const content = readFileByPath(files, call.args.path);
                        result = content !== null ? { content } : { error: `File not found: ${call.args.path}` };
                        if (content === null) success = false;
                        break;
                    case 'createFile':
                        setFiles(prev => createFileByPath(prev, call.args.path, call.args.content || ''));
                        result = { success: true, path: call.args.path }; break;
                    case 'updateFile':
                        setFiles(prev => updateFileByPath(prev, call.args.path, call.args.content));
                        result = { success: true, path: call.args.path }; break;
                    case 'deleteFile':
                        setFiles(prev => deleteFileByPath(prev, call.args.path));
                        result = { success: true, path: call.args.path }; break;
                    default: result = { error: `Unknown tool: ${call.name}`}; success = false;
                }
                
                if (success) addLog(`Tool '${call.name}' executed successfully.`, 'SUCCESS');
                else addLog(`Tool '${call.name}' failed. Result: ${JSON.stringify(result)}`, 'ERROR');

                toolResponseParts.push({ functionResponse: { name: call.name, response: result } });
            }

            stream = await chatRef.current.sendMessageStream({ message: toolResponseParts });
            modelResponse = '';
            for await (const chunk of stream) {
                if (chunk.text) {
                    modelResponse += chunk.text;
                    setMessages([...finalMessages, { role: MessageRole.MODEL, content: modelResponse }]);
                }
            }
        }
    } catch (error: unknown) {
        let userFriendlyMessage = "Sorry, an error occurred while processing your request.";
        let logMessage = "";

        if (error instanceof Error) {
            logMessage = `${error.toString()}\n${error.stack || ''}`;
            
            const lowerCaseMessage = error.message.toLowerCase();

            if (lowerCaseMessage.includes('resource_exhausted') || lowerCaseMessage.includes('429')) {
                userFriendlyMessage = "You've exceeded your current API quota. Please check your plan and billing details, or try again later.";
            } else if (lowerCaseMessage.includes('api key not valid')) {
                userFriendlyMessage = "The API key is not valid. Please check your configuration.";
            } else if (lowerCaseMessage.includes('fetch') || lowerCaseMessage.includes('network')) {
                userFriendlyMessage = "A network error occurred. Please check your connection. It's also possible your browser or an extension is blocking the request.";
            }
        } else {
            logMessage = typeof error === 'string' ? error : JSON.stringify(error);
            userFriendlyMessage = "An unexpected error occurred. Check the output log for more details.";
        }

        addLog(`Failed to get response from AI: ${logMessage}`, 'ERROR');
        setMessages(prev => [...prev, { role: MessageRole.MODEL, content: userFriendlyMessage }]);
    } finally {
        setIsLoading(false);
    }
  }, [userInput, files, messages, activeFile, addLog]);

  const findFileByPath = (nodes: FileNode[], pathParts: string[]): FileNode | null => {
      if (!pathParts.length) return null;
      const [currentPart, ...rest] = pathParts;
      const node = nodes.find(n => n.name === currentPart);
      if (!node) return null;
      if (rest.length === 0) return node;
      if (node.children) return findFileByPath(node.children, rest);
      return null;
  }

  const handleExport = () => {
    addLog('Exporting project as zip file...');
    const zip = new JSZip();
    const addFilesToZip = (folder: any, fileNodes: FileNode[]) => {
      fileNodes.forEach(node => {
        if (node.children) {
          const subFolder = folder.folder(node.name);
          addFilesToZip(subFolder, node.children);
        } else if (node.content !== undefined) {
          folder.file(node.name, node.content);
        }
      });
    };
    addFilesToZip(zip, files);
    zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gemini-code-assistant-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog('Project exported successfully.', 'SUCCESS');
    }).catch((err: Error) => {
        addLog(`Failed to export project: ${err.message}`, 'ERROR');
    });
  };

  const handleResetFileSystem = useCallback(() => {
    if (window.confirm("Are you sure you want to reset the entire workspace? This will delete all files and clear the chat history.")) {
        addLog('Resetting workspace...');
        setFiles(initialFiles);
        setMessages(initialMessages);
        setActiveFile('README.md');
        chatRef.current = createChatSession();
        addLog('Workspace has been reset to its initial state.', 'SUCCESS');
    }
  }, [addLog]);
  
  const activeFileContent = activeFile ? readFileByPath(files, activeFile) ?? '' : '';

  if (isMobile) {
    return (
      <div style={{ height: windowHeight }} className="flex flex-col font-sans antialiased">
        <main className="flex-1 overflow-hidden">
          {activeMobileView === 'explorer' && (
            <Sidebar
              files={files}
              activeFile={activeFile}
              onFileSelect={(fileName) => {
                handleFileSelect(fileName);
                setActiveMobileView('editor');
              }}
              onExport={handleExport}
              onReset={handleResetFileSystem}
              onToggle={() => setActiveMobileView('editor')}
            />
          )}
          {activeMobileView === 'editor' && (
            <div className="flex flex-col h-full bg-[#1e1e1e]">
              <div className="bg-[#333333] text-white py-2 px-4 text-sm border-b border-black/30 flex items-center justify-between">
                <span className="truncate min-w-0">{activeFile || 'Select a file'}</span>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <button onClick={handleZoomOut} className="p-1 rounded hover:bg-white/10" title="Zoom Out"><MinusIcon /></button>
                    <span className="text-xs w-10 text-center">{editorZoomLevel}%</span>
                    <button onClick={handleZoomIn} className="p-1 rounded hover:bg-white/10" title="Zoom In"><PlusIcon /></button>
                </div>
              </div>
              <EditorPanel
                isSelected={!!activeFile}
                fileContent={activeFileContent}
                onContentChange={handleContentChange}
                language={editorLanguage}
                zoomLevel={editorZoomLevel}
              />
            </div>
          )}
          {activeMobileView === 'chat' && (
            <ChatPanel
              messages={messages}
              userInput={userInput}
              onUserInput={setUserInput}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onToggle={() => setActiveMobileView('editor')}
            />
          )}
        </main>
        <BottomNavBar activeView={activeMobileView} onViewChange={setActiveMobileView} />
      </div>
    );
  }

  return (
    <div style={{ height: windowHeight }} className="flex flex-col font-sans antialiased">
      <main className="flex-1 flex flex-row overflow-hidden">
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarVisible ? 'w-64' : 'w-0'}`}>
            <div className="w-64 h-full overflow-hidden">
                <Sidebar 
                    files={files} 
                    activeFile={activeFile} 
                    onFileSelect={handleFileSelect} 
                    onExport={handleExport} 
                    onReset={handleResetFileSystem} 
                    onToggle={() => setIsSidebarVisible(false)}
                />
            </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-row overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-[#333333] text-white py-2 px-4 text-sm border-b border-black/30 flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                            {!isSidebarVisible && (
                                <button onClick={() => setIsSidebarVisible(true)} className="mr-2 p-1 rounded hover:bg-white/10 flex-shrink-0" title="Toggle Sidebar">
                                    <FilesIcon />
                                </button>
                            )}
                            <span className="truncate">{activeFile || 'Select a file'}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                            <button onClick={handleZoomOut} className="p-1 rounded hover:bg-white/10" title="Zoom Out"><MinusIcon /></button>
                            <span className="text-xs w-10 text-center">{editorZoomLevel}%</span>
                            <button onClick={handleZoomIn} className="p-1 rounded hover:bg-white/10" title="Zoom In"><PlusIcon /></button>
                            {!isChatVisible && (
                                <button onClick={() => setIsChatVisible(true)} className="p-1 rounded hover:bg-white/10" title="Toggle Chat">
                                    <ChatIcon />
                                </button>
                            )}
                        </div>
                    </div>
                    <EditorPanel
                      isSelected={!!activeFile}
                      fileContent={activeFileContent}
                      onContentChange={handleContentChange}
                      language={editorLanguage}
                      zoomLevel={editorZoomLevel}
                    />
                </div>
                
                <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isChatVisible ? 'w-96' : 'w-0'}`}>
                    <div className="w-96 h-full overflow-hidden">
                        <ChatPanel
                          messages={messages}
                          userInput={userInput}
                          onUserInput={setUserInput}
                          onSendMessage={handleSendMessage}
                          isLoading={isLoading}
                          onToggle={() => setIsChatVisible(false)}
                        />
                    </div>
                </div>
            </div>
            <div className="hidden lg:block">
              <LogPanel logs={logs} />
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;