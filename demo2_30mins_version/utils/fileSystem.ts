import type { FileNode } from '../types';

export function listFilesRecursive(nodes: FileNode[], prefix = ''): string[] {
  let fileList: string[] = [];
  for (const node of nodes) {
    const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.children) {
      fileList.push(`${currentPath}/`);
      fileList = fileList.concat(listFilesRecursive(node.children, currentPath));
    } else {
      fileList.push(currentPath);
    }
  }
  return fileList;
}

function findFileByPathRecursive(nodes: FileNode[], pathParts: string[]): FileNode | null {
  if (!pathParts.length) return null;
  const [currentPart, ...rest] = pathParts;
  const node = nodes.find(n => n.name === currentPart);
  if (!node) return null;
  if (rest.length === 0 && node.content !== undefined) return node;
  if (node.children) return findFileByPathRecursive(node.children, rest);
  return null;
}

export function readFileByPath(nodes: FileNode[], path: string): string | null {
    const file = findFileByPathRecursive(nodes, path.split('/'));
    return file?.content ?? null;
}

export function updateFileByPath(nodes: FileNode[], path: string, content: string): FileNode[] {
    const pathParts = path.split('/');
    
    return nodes.map(node => {
        if (node.name !== pathParts[0]) return node;
        if (pathParts.length === 1) {
            return { ...node, content };
        }
        if (node.children) {
            return { ...node, children: updateFileByPath(node.children, pathParts.slice(1).join('/'), content) };
        }
        return node;
    });
}

export function createFileByPath(nodes: FileNode[], path: string, content: string): FileNode[] {
    const pathParts = path.split('/');
    const [fileName, ...restReverse] = pathParts.reverse();
    const folderPath = restReverse.reverse();

    let newNodes = [...nodes];
    let currentLevel = newNodes;

    for (const part of folderPath) {
        let folder = currentLevel.find(node => node.name === part && node.children);
        if (!folder) {
            folder = { name: part, children: [] };
            currentLevel.push(folder);
        }
        currentLevel = folder.children!;
    }

    if (!currentLevel.find(node => node.name === fileName)) {
        currentLevel.push({ name: fileName, content, icon: 'typescript' });
    }

    return newNodes;
}

export function deleteFileByPath(nodes: FileNode[], path: string): FileNode[] {
    const pathParts = path.split('/');
    if (pathParts.length === 1) {
        return nodes.filter(node => node.name !== pathParts[0]);
    }

    return nodes.map(node => {
        if (node.name !== pathParts[0] || !node.children) {
            return node;
        }
        return {
            ...node,
            children: deleteFileByPath(node.children, pathParts.slice(1).join('/')),
        };
    });
}
