export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface NotionBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'todo' | 'bullet' | 'code' | 'image' | 'video';
  content: string;
  completed?: boolean;
}

export interface CanvasNode {
  id: string;
  type: 'note' | 'image' | 'video' | 'item';
  title?: string;
  content?: string; // Text content for Note, URL/Source for Image or Video
  x: number;
  y: number;
  width?: number;
  height?: number;
  itemId?: string; // Referenced library item ID if type is 'item'
  files?: { name: string; size: string; type: string }[];
  codeSnippet?: string;
  resourceUrl?: string;
  resourceTitle?: string;
}

export interface DomainItem {
  id: string;
  domainId: string;
  title: string;
  description: string;
  domainTag: string;       // e.g., "Full-Stack", "Client-Side", "AI Agent"
  feasibility: string;     // e.g., "Micro-MVP", "Production", "Scale"
  status: string;          // e.g., "Raw", "Scoped", "Active", "Shipped"
  techStacks: string[];    // e.g., ["FastAPI", "Gemini Pro", "ReactJS"]
  year: string;            // e.g., "2026"
  type: 'item' | 'notebook' | 'canvas';
  color: 'lilac' | 'sky' | 'mint' | 'peach';
  comments: Comment[];
  createdAt: string;
  connections?: { from: string; to: string }[];
  notionBlocks?: NotionBlock[];
  canvasNodes?: CanvasNode[];
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  iconColor: string;       // hex or Tailwind color class
}

export const COLOR_MAP = {
  lilac: {
    bg: 'bg-[#e4ddf8]',
    border: 'border-[#cfc6f4]',
    hover: 'hover:bg-[#dad0f6]',
    text: 'text-[#4c4273]',
    accent: 'bg-[#beb4e8]',
    ink: 'text-[#2a224d]',
  },
  sky: {
    bg: 'bg-[#d2f0f7]',
    border: 'border-[#b6e4ef]',
    hover: 'hover:bg-[#c2ebf4]',
    text: 'text-[#295b68]',
    accent: 'bg-[#a3dae8]',
    ink: 'text-[#143d47]',
  },
  mint: {
    bg: 'bg-[#e1f2dc]',
    border: 'border-[#cae8c2]',
    hover: 'hover:bg-[#d4edd1]',
    text: 'text-[#385e30]',
    accent: 'bg-[#b6dfab]',
    ink: 'text-[#1c3817]',
  },
  peach: {
    bg: 'bg-[#fae2da]',
    border: 'border-[#f5cab9]',
    hover: 'hover:bg-[#f8d4c5]',
    text: 'text-[#704231]',
    accent: 'bg-[#ebb19a]',
    ink: 'text-[#482215]',
  },
};
