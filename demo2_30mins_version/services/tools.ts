import { Type } from "@google/genai";

export const fileSystemTools = [
  {
    functionDeclarations: [
      {
        name: 'listFiles',
        description: 'List all files and directories recursively in the workspace.',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'readFile',
        description: 'Read the content of a file at a given path.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'The full path of the file to read. e.g., "components/Button.tsx"',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'createFile',
        description: 'Create a new file at a given path with optional content.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'The full path where the new file should be created. e.g., "src/components/NewButton.tsx"',
            },
            content: {
              type: Type.STRING,
              description: 'The initial content of the file. Defaults to an empty string.',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'updateFile',
        description: 'Update the content of an existing file at a given path.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'The full path of the file to update.',
            },
            content: {
              type: Type.STRING,
              description: 'The new content to write to the file.',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'deleteFile',
        description: 'Delete a file at a given path.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'The full path of the file to delete.',
            },
          },
          required: ['path'],
        },
      },
    ],
  },
];
