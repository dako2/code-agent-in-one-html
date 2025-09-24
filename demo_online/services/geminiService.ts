import { GoogleGenAI, Chat, Content } from "@google/genai";
import { fileSystemTools } from './tools';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert AI pair programmer.
- You will be provided with context about the project, including the file system structure and the currently open file.
- Use this context to inform your responses and actions.
- Your role is to help the user understand, refactor, or generate code.
- You have access to a virtual file system and can use the provided tools to list, read, create, update, and delete files.
- When a user asks you to make changes to the code, use the file system tools to do so.
- Always confirm the file path with the user before editing or creating a file if the path is not explicitly mentioned.
- When you are asked to create a new component, create a file for it.
- After using a tool, briefly summarize what you have done. For example: "I have created the file 'styles.css' and added the initial CSS content."`;


export function createChatSession(history?: Content[]): Chat {
    const model = 'gemini-2.5-flash';
    return ai.chats.create({
        model: model,
        history: history,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: fileSystemTools,
        },
    });
}