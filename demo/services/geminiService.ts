import { useState, useEffect, useCallback } from 'react';

// Gemini AI Service
export interface LogEntry {
    type: 'error' | 'tool' | 'system' | 'info';
    content: string;
}

export interface ChatMessage {
    role: 'user' | 'ai' | 'tool';
    content: string;
    parts?: any[];
}

export interface GeminiResponse {
    responseText: string;
    newHistory: ChatMessage[];
}

export class GeminiService {
    private ai: any = null;
    private apiKey: string;
    private fileSystem: any = null;

    constructor(apiKey?: string, fileSystem?: any) {
        // Use environment variable if no API key provided
        this.apiKey = apiKey || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || "YOUR_API_KEY_HERE";
        this.fileSystem = fileSystem;
    }

    async initialize(): Promise<void> {
        try {
            if (window.GoogleGenAI) {
                const genAI = new (window as any).GoogleGenAI({ apiKey: this.apiKey });
                this.ai = genAI;
            }
        } catch (e) {
            console.error("Error initializing Gemini API. Make sure API key is set.", e);
            throw e;
        }
    }

    async generateContent(
        prompt: string, 
        existingHistory: ChatMessage[], 
        onLog: (log: LogEntry) => void
    ): Promise<GeminiResponse> {
        if (!this.ai) {
            onLog({ type: 'error', content: 'Gemini API not initialized.' });
            return { responseText: "Gemini API not initialized.", newHistory: existingHistory };
        }

        const model = "gemini-2.5-flash";
        const systemInstruction = `You are an expert AI coding assistant.
- You have access to a virtual file system.
- Use the provided tools to interact with the file system to fulfill user requests.
- When asked to create or modify code, use the file system tools.
- Think step-by-step. For example, if asked to create a new component and use it, first create the file, then read the main app file, then update the main app file to import and use the new component.
- Inform the user of the actions you have taken.`;

        const tools = [{
            functionDeclarations: [
                { 
                    name: "list_files", 
                    description: "List files and directories at a given path.", 
                    parameters: { 
                        type: (window as any).GeminiType.OBJECT, 
                        properties: { 
                            path: { 
                                type: (window as any).GeminiType.STRING, 
                                description: "The directory path to list. Use '/' for root." 
                            } 
                        }, 
                        required: ["path"] 
                    } 
                },
                { 
                    name: "read_file", 
                    description: "Read the content of a file.", 
                    parameters: { 
                        type: (window as any).GeminiType.OBJECT, 
                        properties: { 
                            path: { 
                                type: (window as any).GeminiType.STRING, 
                                description: "The path of the file to read." 
                            } 
                        }, 
                        required: ["path"] 
                    } 
                },
                { 
                    name: "create_file", 
                    description: "Create a new file with content.", 
                    parameters: { 
                        type: (window as any).GeminiType.OBJECT, 
                        properties: { 
                            path: { 
                                type: (window as any).GeminiType.STRING, 
                                description: "The full path for the new file (e.g., 'src/components/New.tsx')." 
                            }, 
                            content: { 
                                type: (window as any).GeminiType.STRING, 
                                description: "The content to write into the file." 
                            } 
                        }, 
                        required: ["path", "content"] 
                    } 
                },
                { 
                    name: "update_file", 
                    description: "Update an existing file with new content.", 
                    parameters: { 
                        type: (window as any).GeminiType.OBJECT, 
                        properties: { 
                            path: { 
                                type: (window as any).GeminiType.STRING, 
                                description: "The path of the file to update." 
                            }, 
                            content: { 
                                type: (window as any).GeminiType.STRING, 
                                description: "The new content to overwrite the file with." 
                            } 
                        }, 
                        required: ["path", "content"] 
                    } 
                },
            ]
        }];
        
        const history = [...existingHistory, { role: "user", parts: [{ text: prompt }] }];

        try {
            for (let i = 0; i < 5; i++) { // Safety break after 5 tool calls
                const result = await this.ai.models.generateContent({
                    model,
                    contents: history,
                    config: { systemInstruction, tools }
                });

                if (!result.candidates || result.candidates.length === 0) {
                    onLog({ type: 'error', content: 'No response from AI.' });
                    return { responseText: "Sorry, I couldn't generate a response.", newHistory: history };
                }
                
                const response = result;
                const content = response.candidates[0].content;
                history.push(content);

                const functionCall = content.parts.find((p: any) => p.functionCall)?.functionCall;

                if (!functionCall) {
                    const responseText = response.text || "Completed actions using tools. Check the file system for changes.";
                    return { responseText, newHistory: history };
                }

                onLog({ type: 'tool', content: `Using tool: ${functionCall.name}(${JSON.stringify(functionCall.args)})` });

                let toolResult;
                const { name: functionName, args } = functionCall;

                if (this.fileSystem) {
                    if (functionName === 'list_files') {
                        toolResult = this.fileSystem.list(args.path);
                    } else if (functionName === 'read_file') {
                        toolResult = this.fileSystem.read(args.path);
                    } else if (functionName === 'create_file') {
                        toolResult = this.fileSystem.write(args.path, args.content);
                    } else if (functionName === 'update_file') {
                        toolResult = this.fileSystem.write(args.path, args.content, true);
                    } else {
                        toolResult = { success: false, error: `Unknown tool: ${functionName}`};
                    }
                } else {
                    toolResult = { success: false, error: "File system not available" };
                }
                
                onLog({ type: 'system', content: `Tool Result: ${JSON.stringify(toolResult)}` });
                
                history.push({
                    role: 'tool',
                    parts: [{ functionResponse: { name: functionCall.name, response: toolResult } }]
                });
            }
           
            const responseText = "Reached maximum number of tool calls. Please check the logs and file system for the result of the operations.";
            return { responseText, newHistory: history };

        } catch (error: any) {
            console.error("Error generating content:", error);
            onLog({ type: 'error', content: `An error occurred: ${error.message}` });
            return { responseText: `An error occurred: ${error.message}`, newHistory: existingHistory };
        }
    }
}

// Hook for React components
export const useGemini = (apiKey?: string, fileSystem?: any) => {
    const [geminiService] = useState(() => new GeminiService(apiKey, fileSystem));
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        geminiService.initialize().then(() => {
            setIsInitialized(true);
        }).catch((error) => {
            console.error("Failed to initialize Gemini service:", error);
        });
    }, [geminiService]);

    const generateContent = useCallback(async (
        prompt: string, 
        existingHistory: ChatMessage[], 
        onLog: (log: LogEntry) => void
    ): Promise<GeminiResponse> => {
        return await geminiService.generateContent(prompt, existingHistory, onLog);
    }, [geminiService]);

    return { generateContent, isInitialized };
};