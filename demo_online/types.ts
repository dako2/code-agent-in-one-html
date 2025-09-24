export interface FileNode {
  name: string;
  content?: string;
  children?: FileNode[];
  icon?: 'typescript';
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
}
