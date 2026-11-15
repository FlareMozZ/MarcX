import React, { useState, useRef, useEffect } from 'react';
import { DomainItem, CanvasNode, COLOR_MAP } from '../types';
import { 
  X, Maximize2, Minimize2, Plus, Minus, Info, RotateCcw, 
  Video, Image, FileText, ArrowUpRight, HelpCircle, Eye, 
  Trash2, Link2, Move, Type, Check, Play, Upload, ExternalLink,
  Code, Paperclip, ChevronRight, File, Sliders, Layout, Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CANVAS_THEMES: Record<'lilac' | 'sky' | 'mint' | 'peach', {
  bg: string;
  gridColor: string;
  label: string;
  badge: string;
}> = {
  lilac: {
    bg: 'bg-[#eeebf6]', 
    gridColor: '#c3b5eb',
    label: 'Lilac',
    badge: 'bg-[#e4ddf8] text-[#4c4273]',
  },
  sky: {
    bg: 'bg-[#e5f4f8]',
    gridColor: '#acddec',
    label: 'Sky',
    badge: 'bg-[#d2f0f7] text-[#295b68]',
  },
  mint: {
    bg: 'bg-[#edf6ec]',
    gridColor: '#bce4b2',
    label: 'Mint',
    badge: 'bg-[#e1f2dc] text-[#385e30]',
  },
  peach: {
    bg: 'bg-[#fbf1ec]',
    gridColor: '#f1ccbd',
    label: 'Peach',
    badge: 'bg-[#fae2da] text-[#704231]',
  },
};

interface MultiMediaCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  canvasItem: DomainItem;
  allLibraryItems: DomainItem[];
  onUpdateCanvas: (updatedItem: DomainItem) => void;
  domainName: string;
}

export default function MultiMediaCanvas({
  isOpen,
  onClose,
  canvasItem,
  allLibraryItems,
  onUpdateCanvas,
  domainName,
}: MultiMediaCanvasProps) {
  // Navigation / Pan & Zoom state
  const [scale, setScale] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(-50125.0);
  const [panY, setPanY] = useState<number>(-50100.0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas renaming states
  const [isEditingCanvasTitle, setIsEditingCanvasTitle] = useState(false);
  const [editedCanvasTitle, setEditedCanvasTitle] = useState(canvasItem.title);

  // Media Interactive states (Notion & FigJam style)
  const [playingVideoNodeId, setPlayingVideoNodeId] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setEditedCanvasTitle(canvasItem.title);
    setIsEditingCanvasTitle(false);
  }, [canvasItem.id, canvasItem.title]);

  // Interactive node actions
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [resizedNodeId, setResizedNodeId] = useState<string | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [resizeStartMouse, setResizeStartMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean } | null>(null);

  // Active resource ingestion and file dropper configuration state
  const [activeIngestNodeId, setActiveIngestNodeId] = useState<string | null>(null);

  // Connection/Flowchart State
  const [activeConnectionSource, setActiveConnectionSource] = useState<string | null>(null);
  const [connections, setConnections] = useState<{ from: string; to: string }[]>(() => {
    if (canvasItem.connections) return canvasItem.connections;
    // Deserialize or generate sensible default connections
    const notesStr = canvasItem.description || '';
    if (notesStr.includes('__CONNECTIONS__')) {
      try {
        const parts = notesStr.split('__CONNECTIONS__');
        return JSON.parse(parts[1]);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Keep connections in sync reactively when the selected canvas changes
  useEffect(() => {
    if (canvasItem.connections) {
      setConnections(canvasItem.connections);
    } else {
      const notesStr = canvasItem.description || '';
      if (notesStr.includes('__CONNECTIONS__')) {
        try {
          const parts = notesStr.split('__CONNECTIONS__');
          setConnections(JSON.parse(parts[1]));
        } catch (e) {
          setConnections([]);
        }
      } else {
        setConnections([]);
      }
    }
  }, [canvasItem.id]);

  // Help info state
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // Local copy of nodes (persisted reactively back into canvasItem)
  const nodes: CanvasNode[] = canvasItem.canvasNodes || [
    {
      id: 'node-video-1',
      type: 'video',
      title: 'Fullstack Architectural Tutorial',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      x: -49900,
      y: -50050,
      width: 320,
      height: 240,
    },
    {
      id: 'node-image-1',
      type: 'image',
      title: 'System UI Design Specs',
      content: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=60',
      x: -49550,
      y: -49950,
      width: 300,
      height: 240,
    },
    {
      id: 'node-note-1',
      type: 'note',
      title: 'Implementation Log',
      content: 'Core architecture focuses on offline-first persistence using reactive local hooks, coupled with a secondary asynchronous ingestion daemon powered by Gemini Pro workflows.',
      codeSnippet: 'const app = express();\napp.use(express.static(distPath));',
      x: -49800,
      y: -49750,
      width: 290,
      height: 240,
      files: [{ name: 'setup_manifest.pdf', size: '245 KB', type: 'pdf' }]
    },
    {
      id: 'node-item-1',
      type: 'item',
      title: 'Hitchhikers LLM Analysis',
      itemId: '62b9a117-90f1-4db8-b4b1-9f939eafbef1', // Fallback reference or lets user bind their own
      x: -49500,
      y: -49700,
      width: 280,
      height: 240,
    }
  ];

  // Dropper states for the currently active node overlay config
  const [ingestTitle, setIngestTitle] = useState<string>('');
  const [ingestType, setIngestType] = useState<'note' | 'image' | 'video' | 'item'>('note');
  const [ingestContent, setIngestContent] = useState<string>('');
  const [ingestItemId, setIngestItemId] = useState<string>('');
  const [ingestCodeSnippet, setIngestCodeSnippet] = useState<string>('');
  const [ingestResourceUrl, setIngestResourceUrl] = useState<string>('');
  const [ingestResourceTitle, setIngestResourceTitle] = useState<string>('');
  const [ingestFiles, setIngestFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const [dragActiveInModal, setDragActiveInModal] = useState<boolean>(false);

  // Sync state values when opening the media config dresser
  useEffect(() => {
    if (activeIngestNodeId) {
      const selectedNode = nodes.find((n) => n.id === activeIngestNodeId);
      if (selectedNode) {
        setIngestTitle(selectedNode.title || '');
        setIngestType(selectedNode.type);
        setIngestContent(selectedNode.content || '');
        setIngestItemId(selectedNode.itemId || '');
        setIngestCodeSnippet(selectedNode.codeSnippet || '');
        setIngestResourceUrl(selectedNode.resourceUrl || '');
        setIngestResourceTitle(selectedNode.resourceTitle || '');
        setIngestFiles(selectedNode.files || []);
      }
    }
  }, [activeIngestNodeId, canvasItem]);

  // Sync connections and nodes back into item layout to preserve permanently
  const updateItemAndConnections = (newNodes: CanvasNode[], newConns: { from: string; to: string }[]) => {
    const rawDesc = canvasItem.description?.split('__CONNECTIONS__')[0] || '';
    
    onUpdateCanvas({
      ...canvasItem,
      title: editedCanvasTitle.trim(),
      description: rawDesc,
      connections: newConns,
      canvasNodes: newNodes,
    });
  };

  // Drag Canvas background to Pan
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only pan on left click
    const target = e.target as HTMLElement;
    if (target.closest('.canvas-node-card') || target.closest('.canvas-toolbar') || target.closest('#canvas-context-menu')) {
      return;
    }
    setIsPanning(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    } else if (draggedNodeId) {
      // Calculate scaled coordinate movement
      const currentX = (e.clientX - dragOffset.x - panX) / scale;
      const currentY = (e.clientY - dragOffset.y - panY) / scale;
      
      const roundedX = Math.round(currentX);
      const roundedY = Math.round(currentY);

      const updatedNodes = nodes.map((node) => 
        node.id === draggedNodeId ? { ...node, x: roundedX, y: roundedY } : node
      );
      updateItemAndConnections(updatedNodes, connections);
    } else if (resizedNodeId) {
      const node = nodes.find((n) => n.id === resizedNodeId);
      if (!node) return;

      const deltaX = (e.clientX - resizeStartMouse.x) / scale;
      const deltaY = (e.clientY - resizeStartMouse.y) / scale;

      const newWidth = Math.max(160, Math.round(resizeStartSize.width + deltaX));
      const newHeight = Math.max(120, Math.round(resizeStartSize.height + deltaY));

      const updatedNodes = nodes.map((n) =>
        n.id === resizedNodeId ? { ...n, width: newWidth, height: newHeight } : n
      );
      updateItemAndConnections(updatedNodes, connections);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
    setResizedNodeId(null);
  };

  const handleResizeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setResizedNodeId(nodeId);
    setResizeStartSize({
      width: node.width || 280,
      height: node.height || 240,
    });
    setResizeStartMouse({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Node Header mouse-down for dragging individual card
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggedNodeId(nodeId);
    
    // Calculate page layout space offsets
    const nodeScreenX = node.x * scale + panX;
    const nodeScreenY = node.y * scale + panY;
    
    setDragOffset({
      x: e.clientX - nodeScreenX,
      y: e.clientY - nodeScreenY,
    });
  };

  // Zoom handlers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.4));
  const handleZoomReset = () => {
    setScale(1.0);
    setPanX(-50125.0);
    setPanY(-50100.0);
  };

  // Context Menu handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const boardBounds = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Calculate canvas workspace relative coordinates using current scale & pan
    const rawX = (clientX - boardBounds.left - panX) / scale;
    const rawY = (clientY - boardBounds.top - panY) / scale;

    setContextMenu({
      x: Math.round(rawX),
      y: Math.round(rawY),
      visible: true,
    });
  };

  // Node injection
  const spawnNode = (type: 'note' | 'image' | 'video' | 'item', specificId?: string) => {
    if (!contextMenu) return;

    const titles = {
      note: 'Developer Scratchpad Spec',
      image: 'Layout UI Mockup Design',
      video: 'YouTube Reference Tutorial',
      item: 'Linked Library Concept Document'
    };

    const newNode: CanvasNode = {
      id: `node-${type}-${Date.now()}`,
      type,
      x: contextMenu.x,
      y: contextMenu.y,
      width: type === 'video' ? 320 : type === 'image' ? 300 : type === 'item' ? 280 : 280,
      height: type === 'video' ? 240 : type === 'image' ? 240 : type === 'item' ? 240 : 240,
      title: titles[type],
      content: '',
      itemId: specificId,
      files: []
    };

    const updatedNodes = [...nodes, newNode];
    updateItemAndConnections(updatedNodes, connections);
    setContextMenu(null);
  };

  const deleteNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedConnections = connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
    updateItemAndConnections(updatedNodes, updatedConnections);
  };

  // Arrow connections logic
  const handleConnectClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeConnectionSource) {
      setActiveConnectionSource(nodeId);
    } else {
      if (activeConnectionSource !== nodeId) {
        // Prevent duplicate connections
        const exists = connections.some(c => (c.from === activeConnectionSource && c.to === nodeId));
        if (!exists) {
          const updatedConns = [...connections, { from: activeConnectionSource, to: nodeId }];
          setConnections(updatedConns);
          updateItemAndConnections(nodes, updatedConns);
        }
      }
      setActiveConnectionSource(null);
    }
  };

  const removeAllConnections = () => {
    setConnections([]);
    updateItemAndConnections(nodes, []);
  };

  // Draw lines with direct SVG pointers
  const getCenterOfNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const w = node.width || 280;
    const h = node.height || 240;
    return {
      x: node.x + w / 2,
      y: node.y + h / 2
    };
  };

  // Save specific media dropper modifications
  const handleSaveIngest = () => {
    if (!activeIngestNodeId) return;

    const matchedItem = allLibraryItems.find(i => i.id === ingestItemId);

    const updated = nodes.map((node) => {
      if (node.id === activeIngestNodeId) {
        return {
          ...node,
          title: ingestTitle || node.title,
          type: ingestType,
          content: ingestContent,
          itemId: ingestType === 'item' ? ingestItemId : undefined,
          codeSnippet: ingestCodeSnippet,
          resourceUrl: ingestResourceUrl,
          resourceTitle: ingestResourceTitle,
          files: ingestFiles,
        };
      }
      return node;
    });

    updateItemAndConnections(updated, connections);
    setActiveIngestNodeId(null);
  };

  // Dropzone drag-drop handlers for Simulated/Physical file drops
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveInModal(true);
    } else if (e.type === "dragleave") {
      setDragActiveInModal(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveInModal(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropList: { name: string; size: string; type: string; dataUrl?: string }[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        
        // Humanized Byte Formatter
        let displaySize = '145 KB';
        if (file.size > 1024 * 1024) {
          displaySize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        } else {
          displaySize = `${Math.round(file.size / 1024)} KB`;
        }

        const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase() || 'file';
        const fileObj: { name: string; size: string; type: string; dataUrl?: string } = {
          name: file.name,
          size: displaySize,
          type: ext
        };

        if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            // Upload immediately to bypass PayloadTooLarge and keep base64 out of node columns
            const base64Buffer = dataUrl.split(',')[1];
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: file.name, base64: base64Buffer })
            });
            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json();
              if (uploadJson.success) {
                fileObj.dataUrl = uploadJson.url;
                setIngestContent(uploadJson.url);
              } else {
                fileObj.dataUrl = dataUrl;
                setIngestContent(dataUrl);
              }
            } else {
              fileObj.dataUrl = dataUrl;
              setIngestContent(dataUrl);
            }
          } catch (err) {
            console.error("Failed to read dropped image file", err);
          }
        }

        dropList.push(fileObj);
      }
      setIngestFiles(prev => [...prev, ...dropList]);
    }
  };

  // Native input file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const manualList: { name: string; size: string; type: string; dataUrl?: string }[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const f = e.target.files[i];
        let dsize = `${Math.round(f.size / 1024)} KB`;
        if (f.size > 1024 * 1024) {
          dsize = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
        }
        
        const ext = f.name.substring(f.name.lastIndexOf('.') + 1).toLowerCase() || 'file';
        const fileObj: { name: string; size: string; type: string; dataUrl?: string } = {
          name: f.name,
          size: dsize,
          type: ext
        };

        if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(f);
            });
            
            // Upload immediately to bypass PayloadTooLarge and keep base64 out of node columns
            const base64Buffer = dataUrl.split(',')[1];
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: f.name, base64: base64Buffer })
            });
            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json();
              if (uploadJson.success) {
                fileObj.dataUrl = uploadJson.url;
                setIngestContent(uploadJson.url);
              } else {
                fileObj.dataUrl = dataUrl;
                setIngestContent(dataUrl);
              }
            } else {
              fileObj.dataUrl = dataUrl;
              setIngestContent(dataUrl);
            }
          } catch (err) {
            console.error("Failed to read selected image file", err);
          }
        }

        manualList.push(fileObj);
      }
      setIngestFiles(prev => [...prev, ...manualList]);
    }
  };

  const simulateFileType = (ext: 'pdf' | 'png' | 'ts' | 'mp4') => {
    const mocks = {
      pdf: { name: 'halcyon_architecture_flows.pdf', size: '1.4 MB', type: 'pdf' },
      png: { name: 'dashboard_ui_wireframe_draft.png', size: '420 KB', type: 'png' },
      ts: { name: 'express_gemini_controller.ts', size: '12 KB', type: 'typescript' },
      mp4: { name: 'client_onboarding_demo.mp4', size: '18.4 MB', type: 'video' }
    };

    setIngestFiles(prev => [...prev, mocks[ext]]);
  };

  if (!isOpen) return null;

  // Filter items that aren't already canvas to allow categoric node dropped references
  const linkableItems = allLibraryItems.filter(i => i.type !== 'canvas');

  const currentThemeCol = canvasItem.color || 'lilac';
  const cTheme = CANVAS_THEMES[currentThemeCol as 'lilac' | 'sky' | 'mint' | 'peach'] || CANVAS_THEMES.lilac;

  return (
    <div 
      id="multimedia-canvas-overlay"
      className="fixed inset-0 z-50 bg-[#1e1c19]/65 backdrop-blur-md flex items-center justify-center p-4 transition-all"
      onClick={() => {
        setContextMenu(null);
        setActiveConnectionSource(null);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[94vw] h-[88vh] bg-[#ede7df] rounded-2xl flex flex-col border border-[#c3b7a5] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Title Bar (MacOS styled with correct title and status pills) */}
        <div className="bg-[#2a2927] text-[#eae4da] px-5 py-3.5 flex items-center justify-between shrink-0 select-none border-b border-black/15">
          {/* Path directory header */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="opacity-60">My Library</span>
            <span className="opacity-40">/</span>
            <span className="text-[#a2938a] font-bold">🟣 {domainName}</span>
            <span className="opacity-40">/</span>
            {isEditingCanvasTitle ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editedCanvasTitle}
                  onChange={(e) => setEditedCanvasTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editedCanvasTitle.trim()) {
                        onUpdateCanvas({
                          ...canvasItem,
                          title: editedCanvasTitle.trim(),
                        });
                        setIsEditingCanvasTitle(false);
                      }
                    } else if (e.key === 'Escape') {
                      setEditedCanvasTitle(canvasItem.title);
                      setIsEditingCanvasTitle(false);
                    }
                  }}
                  className="bg-stone-800 text-white text-xs px-2 py-0.5 rounded border border-stone-600 focus:outline-none focus:ring-1 focus:ring-[#beb4e8] font-sans font-bold max-w-[200px]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editedCanvasTitle.trim()) {
                      onUpdateCanvas({
                        ...canvasItem,
                        title: editedCanvasTitle.trim(),
                      });
                      setIsEditingCanvasTitle(false);
                    }
                  }}
                  className="p-0.5 rounded bg-[#a2938a]/10 hover:bg-[#a2938a]/30 text-emerald-400 font-bold hover:scale-105 cursor-pointer transition-all"
                  title="Save Title"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedCanvasTitle(canvasItem.title);
                    setIsEditingCanvasTitle(false);
                  }}
                  className="p-0.5 rounded bg-[#a2938a]/10 hover:bg-[#a2938a]/30 text-red-400 font-bold hover:scale-105 cursor-pointer transition-all"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingCanvasTitle(true);
                }}
                className="font-extrabold text-[#ede7df] underline decoration-[#938ab3] decoration-2 underline-offset-3 cursor-pointer hover:text-white hover:decoration-white transition-all flex items-center gap-1"
                title="Click directly to rename Canvas"
              >
                {canvasItem.title} <span className="opacity-60 text-[9px] font-sans no-underline inline-block bg-stone-800 px-1 py-0.5 rounded ml-1 text-stone-300">rename</span>
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-sans font-bold uppercase tracking-widest text-[#cfc4b6]/75 bg-radial from-white/5 to-transparent px-3 py-0.5 rounded-full">
            <span>Halcyon Space Board</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="p-1 px-2.5 rounded-md hover:bg-white/10 text-stone-350 hover:text-white text-xs flex items-center gap-1 transition-colors border border-stone-800/40 bg-stone-900/15"
              title="Show Quick Reference"
            >
              <HelpCircle className="w-4.5 h-4.5 text-[#beb4e8]" />
              <span className="hidden sm:inline font-mono">Guide</span>
            </button>
            <div className="h-4 w-px bg-stone-700"></div>
            <div className="flex items-center gap-1">
              <button 
                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-stone-300"
                onClick={handleZoomReset} 
                title="Reset View"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button 
                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-stone-300"
                onClick={() => setScale(1.4)} 
                title="Focus View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button 
                id="btn-close-canvas"
                onClick={onClose}
                className="w-5 h-5 rounded bg-red-750 hover:bg-red-700 text-white flex items-center justify-center transition-all cursor-pointer font-bold font-sans text-[10.5px]"
                title="Close Board"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Floating Guide Bar */}
        <AnimatePresence>
          {showInfo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#dfd7cc] border-b border-[#cfc4b6] px-6 py-4 text-xs text-stone-800 leading-relaxed font-sans shadow-inner shrink-0"
            >
              <p className="font-bold flex items-center gap-1 text-stone-900 mb-1">
                <Info className="w-4.5 h-4.5 text-[#4c4273]" /> Multi-Media Reference Board Instructions
              </p>
              <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-stone-700">
                <li><strong>Interactive Ingestion</strong>: Click directly on any node card to launch the <strong>Resource Ingestion Dropper</strong>. You can drag and drop architecture diagrams, select YouTube tutorials, enter screenshots, write markdown snippets, or tie library items from alternative categories.</li>
                <li><strong>Draw Arrows & Flows</strong>: Click the sprout connector widget (<ArrowUpRight className="inline w-3 h-3 text-purple-700" />) on the card header, then tap any other node to establish a styled vector layout tie.</li>
                <li><strong>Move Canvas Node</strong>: Hold left-click on the top header of a card and drag to slide its coordinates. Pan the gray workspace background with standard holds.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Viewport */}
        <div 
          className={`flex-1 overflow-hidden relative ${cTheme.bg} cursor-grab active:cursor-grabbing select-none transition-colors duration-300`}
          onMouseDown={handleBackgroundMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          {/* Reactive Infinite Dot Grid background */}
          <svg className="absolute inset-0 pointer-events-none opacity-50 z-0" width="100%" height="100%">
            <defs>
              <pattern id="canvas-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse" x={panX} y={panY}>
                <circle cx="2" cy="2" r="1.2" fill={cTheme.gridColor} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-dot-grid)" />
          </svg>

          {/* Relationship Connection Arrows */}
          <svg 
            className="absolute inset-0 pointer-events-none z-10"
            style={{ 
              transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: '100000px',
              height: '100000px'
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#867a6d" />
              </marker>
              <marker
                id="arrowhead-highlight"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#938ab3" />
              </marker>
            </defs>

            {/* Connection Lines */}
            {connections.map((conn, idx) => {
              const start = getCenterOfNode(conn.from);
              const end = getCenterOfNode(conn.to);
              
              if ((start.x === 0 && start.y === 0) || (end.x === 0 && end.y === 0)) return null;

              return (
                <g key={idx}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#867a6d"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle cx={start.x} cy={start.y} r="3" fill="#8d7d6f" />
                  <circle cx={end.x} cy={end.y} r="3" fill="#8d7d6f" />
                </g>
              );
            })}
          </svg>

          {/* Draggable Workspace Coordinates */}
          <div 
            id="canvas-nodes-board"
            className="absolute"
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: '100000px',
              height: '100000px',
            }}
          >
            {nodes.map((node) => {
              const { id, type, title, content, x, y, width, height, itemId, files, codeSnippet, resourceUrl } = node;

              const refItem = allLibraryItems.find((itm) => itm.id === itemId);
              const colorStyles = COLOR_MAP[refItem?.color || 'sky'];

              return (
                <div
                  key={id}
                  className="absolute canvas-node-card group/card"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: width ? `${width}px` : '280px',
                    height: height ? `${height}px` : '240px',
                    zIndex: draggedNodeId === id ? 50 : 20,
                  }}
                >
                  <div className={`shadow-md border bg-[#f3ede3]/95 border-[#cdc5b8] rounded-2xl overflow-hidden flex flex-col h-full transition duration-200 hover:shadow-lg ${activeConnectionSource === id ? 'ring-2 ring-[#7b6cb3] ring-offset-1' : ''}`}>
                    
                    {/* Header bar (Drag Handle) */}
                    <div 
                      onMouseDown={(e) => handleNodeMouseDown(id, e)}
                      className="bg-[#eae2da] hover:bg-[#e4d9cc] border-b border-[#dcd2c4] px-4 py-2.5 flex items-center justify-between cursor-move shrink-0 select-none text-[10px] font-mono tracking-wider font-bold text-stone-600 uppercase"
                    >
                      <span className="flex items-center gap-1 bg-[#ede7df] border border-stone-300 px-1.5 py-0.5 rounded text-[8.5px]">
                        {type === 'video' ? <Video className="w-2.5 h-2.5 text-red-700" /> : null}
                        {type === 'image' ? <Image className="w-2.5 h-2.5 text-indigo-700" /> : null}
                        {type === 'note' ? <FileText className="w-2.5 h-2.5 text-emerald-850" /> : null}
                        {type === 'item' ? <Link2 className="w-2.5 h-2.5 text-amber-800" /> : null}
                        {type}
                      </span>

                      <span className="font-bold text-stone-850 text-[10px] px-1 font-sans truncate max-w-[130px]" title="Rename inside config modal">
                        {title}
                      </span>

                      <div className="flex items-center gap-1.5 opacity-65 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`btn-connect-node-${id}`}
                          onClick={(e) => handleConnectClick(id, e)}
                          className={`p-1 rounded text-stone-700 hover:bg-[#e2d6c6] hover:text-[#938ab3] transition-colors`}
                          title="Sprout relation arrow link"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-node-${id}`}
                          onClick={(e) => deleteNode(id, e)}
                          className="p-1 rounded hover:bg-[#ebdcd9] text-stone-500 hover:text-red-700 transition"
                          title="Wipe Card"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Node Body: Clicking launches the drop/media ingest portal */}
                    <div 
                      onClick={() => setActiveIngestNodeId(id)}
                      className="p-3.5 flex-1 flex flex-col justify-between bg-white/45 hover:bg-white/70 transition-colors cursor-pointer overflow-hidden relative group/body"
                      title="Click directly to open resource dropbox/configurer"
                    >
                      <div className="flex-1 flex flex-col justify-start overflow-hidden">
                        
                        {/* 1. PDF / Scratchpad Note card layout */}
                        {type === 'note' && (
                          <div className="text-[11px] leading-relaxed text-stone-700 font-sans text-left flex-1 overflow-hidden font-medium flex flex-col justify-between">
                            <div>
                              {content ? (
                                <p className="line-clamp-3 mb-1.5">{content}</p>
                              ) : (
                                !resourceUrl && <p className="text-stone-400 italic">📝 Flat specification empty. Click directly to drop files or draft notes...</p>
                              )}
                              {codeSnippet && (
                                <div className="font-mono text-[9px] bg-stone-900 text-stone-300 p-1.5 rounded-md my-1 overflow-x-auto select-all leading-normal max-h-[55px]">
                                  {codeSnippet}
                                </div>
                              )}
                            </div>
                            
                            {/* Notion / WhatsApp style rich visual Link Preview */}
                            {resourceUrl && (
                              <div className="mt-2 rounded-lg border border-[#cfc4b6]/85 bg-[#fefdfa] hover:bg-stone-50 overflow-hidden flex flex-row items-stretch select-none text-left transition duration-150 h-[70px] shrink-0">
                                <div className="w-[70px] bg-stone-100 border-r border-[#cfc4b6]/50 shrink-0">
                                  <img 
                                    src={`https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=150&auto=format&fit=crop&q=40`}
                                    alt="Link Preview"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="p-1.5 flex-1 flex flex-col justify-between overflow-hidden text-[8.5px]">
                                  <div className="overflow-hidden">
                                    <h6 className="font-bold text-stone-850 truncate text-[9.5px] leading-snug">
                                      {title || "Scraped Online Reference"}
                                    </h6>
                                    <p className="text-stone-500 line-clamp-1 mt-0.5">
                                      {content || "Review linked integration specs and remote documentation."}
                                    </p>
                                  </div>
                                  <span className="text-[#326976] font-mono font-bold tracking-tight inline-flex items-center gap-1 truncate uppercase text-[8px] mt-0.5">
                                    🌐 {resourceUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. YouTube tutorial wrapper */}
                        {type === 'video' && (
                          <div className="flex-1 flex flex-col justify-center overflow-hidden">
                            {content && content.includes('http') ? (
                              <div className="relative rounded-lg overflow-hidden border border-stone-300 shadow bg-stone-900 aspect-video flex-1 min-h-[110px]">
                                {playingVideoNodeId === id ? (
                                  <iframe
                                    src={content.replace('watch?v=', 'embed/').split('&')[0] + "?autoplay=1"}
                                    className="w-full h-full border-none pointer-events-auto"
                                    title={title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <>
                                    <iframe
                                      src={content.replace('watch?v=', 'embed/').split('&')[0]}
                                      className="w-full h-full border-none pointer-events-none"
                                      title={title}
                                    />
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPlayingVideoNodeId(id);
                                      }}
                                      className="absolute inset-0 bg-black/20 hover:bg-black/5 transition duration-150 flex flex-col items-center justify-center cursor-pointer group/video"
                                    >
                                      <div className="bg-red-700 group-hover/video:bg-red-600 text-white p-2.5 rounded-full shadow-lg scale-100 group-hover/video:scale-110 active:scale-95 transition-all duration-200">
                                        <Play className="w-5 h-5 fill-white shrink-0" />
                                      </div>
                                      <span className="text-[9px] font-bold text-white mt-1 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs font-sans">
                                        Click to Play Video
                                      </span>
                                    </div>
                                    <a 
                                      href={content}
                                      target="_blank"
                                      rel="noopener referrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute top-1.5 right-1.5 p-1 rounded bg-black/65 text-white hover:bg-black/85 hover:scale-105 transition-all z-20"
                                      title="Open original video link in new tab"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="border border-dashed border-stone-400 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-stone-100/50 hover:bg-white/80 transition flex-1">
                                <Video className="w-5 h-5 text-red-600 mb-1" />
                                <span className="text-[10px] font-bold text-stone-800">Select standard tutorial video</span>
                                <span className="text-[8.5px] text-stone-500 mt-0.5">Click to browse or drop specs</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Image design frames */}
                        {type === 'image' && (
                          <div className="flex-1 flex flex-col justify-center overflow-hidden">
                            {(content && (content.startsWith('http') || content.startsWith('data:'))) || (files && files.some(f => (f as any).dataUrl || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(f.type.toLowerCase()))) ? (
                              <div className="relative rounded-lg overflow-hidden border border-stone-300 shadow aspect-video bg-stone-100 flex-1 min-h-[110px] group/imginst">
                                {(() => {
                                  const imgUrl = content && (content.startsWith('http') || content.startsWith('data:')) ? content : (files && (files.find(f => (f as any).dataUrl) as any)?.dataUrl) || `https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60`;
                                  return (
                                    <>
                                      <img
                                        src={imgUrl}
                                        alt={title}
                                        className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition"
                                        referrerPolicy="no-referrer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxImageUrl(imgUrl);
                                        }}
                                      />
                                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded uppercase">
                                        {files && files.length > 0 ? files[0].name.split('.').pop() : 'Specs'}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxImageUrl(imgUrl);
                                        }}
                                        className="absolute top-1.5 right-1.5 p-1 rounded bg-black/65 hover:bg-black/85 text-white opacity-0 group-hover/imginst:opacity-100 transition duration-150 flex items-center justify-center"
                                        title="Expand Fullscreen Image"
                                      >
                                        <Maximize2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="border border-dashed border-stone-400 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-stone-100/50 hover:bg-white/80 transition flex-1">
                                <Image className="w-5 h-5 text-indigo-600 mb-1" />
                                <span className="text-[10px] font-bold text-stone-800">Mockup UI Screenshot</span>
                                <span className="text-[8.5px] text-stone-500 mt-0.5">Click to drop wireframe file</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. Purple Custom Ingest Card (Screenshot aligned) */}
                        {type === 'item' && (
                          <div className="flex-1 flex flex-col justify-center overflow-hidden text-left font-sans text-xs">
                            {refItem ? (
                              <div className={`p-3 rounded-lg relative ${colorStyles.bg} border border-${colorStyles.border} shadow-2xs group-hover/card:shadow flex-1 flex flex-col justify-between overflow-hidden min-h-[110px]`}>
                                <div>
                                  <div className="flex items-center justify-between text-[8px] font-mono tracking-wider text-stone-500 uppercase shrink-0 mb-1">
                                    <span>{refItem.year || '2026'}</span>
                                    <span>{domainName}</span>
                                  </div>
                                  <h6 className={`font-serif text-[11px] font-extrabold tracking-tight leading-snug ${colorStyles.ink} line-clamp-2 font-bold mb-1`}>
                                    {refItem.title}
                                  </h6>
                                  <p className="text-[9px] text-stone-600 font-medium truncate">
                                    {refItem.techStacks && refItem.techStacks.length > 0 ? refItem.techStacks.slice(0, 2).join(', ') : 'No Tech Specs'}
                                  </p>
                                </div>
                                <div className="pt-1.5 border-t border-black/5 mt-1 flex items-center justify-between text-[8px] text-stone-500 leading-none">
                                  <span className="bg-white/60 px-1 rounded text-[7.5px] font-bold text-stone-700">
                                    {refItem.status}
                                  </span>
                                  <span className="opacity-60 font-mono tracking-widest text-[7px] uppercase font-bold text-[#482215]">
                                    🔗 Linked Reference Item
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="border border-dashed border-stone-400 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-stone-100/50 hover:bg-white/80 transition flex-1">
                                <Link2 className="w-5 h-5 text-amber-600 mb-1" />
                                <span className="text-[10px] font-bold text-stone-800">Reference Library Item</span>
                                <span className="text-[8.5px] text-stone-500 mt-0.5">Click to tie Notion style doc</span>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Display files list pinned & external bookmarks at the bottom of card */}
                      <div className="mt-2 text-left shrink-0 border-t border-stone-200/40 pt-1.5 flex flex-col gap-1 z-15">
                        {/* Interactive upload indicator overlay displayed on hover of body */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2a2927]/90 to-[#2a2927]/75 text-[#fdfbf7] p-1 text-center font-sans tracking-wide text-[9px] opacity-0 group-hover/body:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 font-bold rounded-b-xl">
                          <Upload className="w-3 h-3 text-[#beb4e8]" />
                          <span>Configure Node Reference / Drop media</span>
                        </div>

                        {files && files.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-h-[50px] overflow-hidden">
                            {files.map((fl, fIdx) => (
                              <span 
                                key={fIdx} 
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-600/20 text-[#7c4238] font-mono text-[8.5px] font-bold max-w-[190px] truncate"
                                title={`${fl.name} (${fl.size})`}
                              >
                                <Paperclip className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[130px]">{fl.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {resourceUrl && (
                          <span className="inline-flex items-center gap-1 text-[8px] text-[#295b68] font-bold tracking-tight bg-sky-500/10 border border-sky-450/25 rounded px-1.5 py-0.5 max-w-full truncate">
                            <Link className="w-2.5 h-2.5 text-[#295b68] shrink-0" />
                            <span className="truncate">{resourceUrl.replace('https://', '').replace('www.', '')}</span>
                          </span>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Real-time Draggable Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(id, e)}
                    className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end opacity-40 group-hover/card:opacity-100 transition-opacity z-30"
                    title="Drag to resize card"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" className="text-stone-550 hover:text-stone-800">
                      <path d="M10,0 L0,10 M10,4 L4,10 M10,8 L8,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Context Menu */}
        {contextMenu && contextMenu.visible && (
          <div 
            id="canvas-context-menu"
            className="absolute z-50 bg-[#ede4d7] border border-[#cfc4b6] shadow-xl rounded-xl py-2 w-52 text-left font-sans text-xs text-stone-800 border-2"
            style={{ 
              left: `${contextMenu.x * scale + panX}px`, 
              top: `${contextMenu.y * scale + panY}px` 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3.5 py-1 text-[8.5px] font-mono tracking-widest text-[#867c71] border-b border-stone-300 uppercase select-none font-bold">
              Spawn New Node
            </div>
            
            <button 
              id="menu-add-note"
              onClick={() => spawnNode('note')}
              className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-[#e2d6c6] font-bold text-stone-850 transition"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-850" /> Flat Note / Spec
              </span>
              <kbd className="text-[9px] opacity-40">N</kbd>
            </button>

            <button 
              id="menu-add-image"
              onClick={() => spawnNode('image')}
              className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-[#e2d6c6] font-bold text-stone-850 transition"
            >
              <span className="flex items-center gap-1.5">
                <Image className="w-4 h-4 text-indigo-700" /> Image Reference
              </span>
              <kbd className="text-[9px] opacity-40">I</kbd>
            </button>

            <button 
              id="menu-add-video"
              onClick={() => spawnNode('video')}
              className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-[#e2d6c6] font-bold text-stone-850 transition"
            >
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-red-700" /> Tutorial video
              </span>
              <kbd className="text-[9px] opacity-40">V</kbd>
            </button>

            <button 
              id="menu-add-item-placeholder"
              onClick={() => spawnNode('item')}
              className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-[#e2d6c6] font-bold text-stone-850 transition"
            >
              <span className="flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-amber-750" /> Library document
              </span>
              <kbd className="text-[9px] opacity-40">L</kbd>
            </button>

            <div className="px-3.5 py-1 text-[8.5px] font-mono tracking-widest text-[#867c71] border-b border-t border-stone-300 uppercase mt-1.5 select-none font-bold">
              Quick Item Drag
            </div>

            {linkableItems.length > 0 ? (
              <div className="max-h-24 overflow-y-auto py-1">
                {linkableItems.map((itm) => (
                  <button
                    key={itm.id}
                    id={`menu-add-item-${itm.id}`}
                    onClick={() => spawnNode('item', itm.id)}
                    className="w-full text-left px-3.5 py-1.5 hover:bg-[#cbd4c5] text-[10px] text-stone-700 font-sans truncate block transition font-medium"
                    title={itm.title}
                  >
                    🔗 {itm.title}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3.5 py-1.5 text-[9.5px] italic text-[#8c8276]">
                No library documents found.
              </div>
            )}
          </div>
        )}

        {/* Telemetry Footer */}
        <div className="bg-[#dfd7cc] border-t border-[#cfc4b6] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 select-none shrink-0 text-xs font-mono">
          
          <div className="flex items-center gap-1 bg-[#ede7df] border border-[#cfc4b6] px-2 py-1 rounded-full shadow-2xs canvas-toolbar">
            <button
              id="btn-zoom-out"
              onClick={handleZoomOut}
              className="p-1 rounded-full hover:bg-white text-stone-700 hover:text-stone-900 transition-all cursor-pointer"
              title="Zoom out (-)"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-stone-300"></div>
            <button
              id="btn-zoom-reset"
              onClick={handleZoomReset}
              className="px-2 text-[10px] font-bold py-0.5 rounded hover:bg-white text-stone-700 hover:text-stone-900 font-mono transition-colors"
            >
              {(scale * 100).toFixed(0)}%
            </button>
            <div className="h-4 w-px bg-stone-300"></div>
            <button
              id="btn-zoom-in"
              onClick={handleZoomIn}
              className="p-1 rounded-full hover:bg-white text-stone-700 hover:text-stone-900 transition-all cursor-pointer"
              title="Zoom in (+)"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-stone-300"></div>
            <button
              id="btn-go-to-center"
              onClick={handleZoomReset}
              className="px-2.5 py-1 bg-amber-550/10 hover:bg-amber-500/20 text-[10px] text-amber-900 font-bold rounded-full transition-colors font-mono flex items-center gap-1 shadow-3xs cursor-pointer hover:scale-103 active:scale-97"
              title="Go to Center / Recenter canvas viewport"
            >
              <span>🎯 Go to Center</span>
            </button>
            {connections.length > 0 && (
              <>
                <div className="h-4 w-px bg-stone-300"></div>
                <button
                  id="btn-clear-connections"
                  onClick={removeAllConnections}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-[10px] text-red-700 font-bold rounded-full transition-colors font-mono flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Wipe reference flowchart arrows"
                >
                  <RotateCcw className="w-3 h-3 text-red-600" /> Clean Arrows
                </button>
              </>
            )}
            <div className="h-4 w-px bg-stone-300"></div>
            <div className="flex items-center gap-1.5 px-1" title="Select board color theme">
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider mr-1 sm:block hidden">Theme:</span>
              <div id="canvas-theme-selector" className="flex items-center gap-1.5">
                {(['lilac', 'sky', 'mint', 'peach'] as const).map((col) => {
                  const isActive = canvasItem.color === col;
                  const dots = {
                    lilac: 'bg-[#beb4e8] border-[#a293df]',
                    sky: 'bg-[#a3dae8] border-[#65bacc]',
                    mint: 'bg-[#b6dfab] border-[#7ec86f]',
                    peach: 'bg-[#ebb19a] border-[#d88768]',
                  };
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        onUpdateCanvas({
                          ...canvasItem,
                          color: col,
                        });
                      }}
                      className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${dots[col]} hover:scale-115 shrink-0 ${
                        isActive ? 'ring-2 ring-stone-800 scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`Switch board theme to ${col}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-stone-500 text-[10px] hidden lg:block">
            💡 <span className="font-bold underline text-stone-800">Direct Ingest</span>: Drag files and click direct node frames to drop media!
          </div>

          {/* Screenshot telemetry stat block */}
          <div className="bg-[#2a2927] text-[#eae4da] px-3.5 py-1.5 rounded-lg border border-stone-750 text-[9.5px] uppercase font-bold tracking-wider leading-relaxed flex items-center gap-4 shadow-sm font-mono select-none">
            <div className="flex items-center gap-1">
              <span className="text-stone-550">Rendered Nodes</span>
              <span className="text-[#a3dae8]">{nodes.length}</span>
            </div>
            <div className="h-3 w-px bg-stone-750"></div>
            <div className="flex items-center gap-1">
              <span className="text-stone-550">Nodes</span>
              <span>{nodes.length}</span>
            </div>
            <div className="h-3 w-px bg-stone-750"></div>
            <div className="flex items-center gap-1">
              <span className="text-stone-550">Scale</span>
              <span className="text-[#beb4e8]">{scale.toFixed(2)}</span>
            </div>
            <div className="h-3 w-px bg-stone-750"></div>
            <div className="flex items-center gap-1">
              <span className="text-stone-550">X</span>
              <span className="text-amber-300">{panX.toFixed(2)}</span>
            </div>
            <div className="h-3 w-px bg-stone-750"></div>
            <div className="flex items-center gap-1">
              <span className="text-stone-550">Y</span>
              <span className="text-amber-300">{panY.toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* =======================================================
            MULTI-MEDIA COG INGEST AND FILE DROPPER BACKDROP OVERLAY
            ======================================================= */}
        <AnimatePresence>
          {activeIngestNodeId && (
            <div className="absolute inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 select-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                className="w-full max-w-4xl bg-[#f7f2ea] border-2 border-[#cdc4b6] rounded-2xl shadow-2xl flex flex-col max-h-[82vh] overflow-hidden text-left"
              >
                {/* Header */}
                <div className="bg-[#2d2c29] text-[#eae4da] p-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#beb4e8]" />
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#ede7df] leading-none">
                        Canvas Media Ingestion & File Dropper Portal
                      </h4>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5 leading-none">
                        Binding live assets to Card Node Reference ID: <span className="text-amber-300">{activeIngestNodeId}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveIngestNodeId(null)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 rounded-md text-stone-300 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main dual-column layout */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed">
                  
                  {/* Left Column (Dotted Ingestion Drag/Drop Area) */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    <label className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-stone-500 block leading-tight">
                      1. Drag & Drop Resource Guidelines
                    </label>

                    {/* Dotted dropping space */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('ingest-file-picker')?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer min-h-[175px] transition-all relative ${
                        dragActiveInModal 
                          ? 'border-[#7b6cb3] bg-[#eae2d5]' 
                          : 'border-[#cdc4b6] hover:border-stone-500 bg-white/25 hover:bg-white/45'
                      }`}
                    >
                      <input
                        id="ingest-file-picker"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      
                      <div className="p-3 bg-stone-100 rounded-full shadow-3xs text-stone-600 mb-2">
                        <Upload className="w-6 h-6 animate-pulse text-amber-940" />
                      </div>
                      
                      <p className="text-stone-800 font-serif text-xs font-bold leading-snug">
                        Drop architecture diagrams, screenshots, or local spec documents here
                      </p>
                      
                      <p className="text-[9.5px] text-stone-500 mt-1.5 underline decoration-dotted">
                        or click to browse standard local assets
                      </p>

                      {dragActiveInModal && (
                        <div className="absolute inset-0 rounded-xl bg-[#7b6cb3]/10 flex items-center justify-center pointer-events-none">
                          <span className="text-xs font-bold text-indigo-700 animate-bounce">Release to Drop Files!</span>
                        </div>
                      )}
                    </div>

                    {/* Simulation badgify selectors */}
                    <div>
                      <span className="text-[9px] font-mono font-bold text-stone-500 block mb-1">
                        🎯 Developer Simulation Sandbox Helpers:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => simulateFileType('pdf')}
                          className="px-2 py-1 bg-[#ede7df] hover:bg-[#e4d9cc] text-[9px] font-serif border border-stone-400/40 text-[#4c4273] rounded font-bold transition text-left shrink-0 active:scale-95"
                        >
                          + Simulate PDF Doc
                        </button>
                        <button
                          type="button"
                          onClick={() => simulateFileType('png')}
                          className="px-2 py-1 bg-[#ede7df] hover:bg-[#e4d9cc] text-[9px] font-serif border border-stone-400/40 text-[#143d47] rounded font-bold transition text-left shrink-0 active:scale-95"
                        >
                          + Simulate UI .PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => simulateFileType('ts')}
                          className="px-2 py-1 bg-[#ede7df] hover:bg-[#e4d9cc] text-[9px] font-serif border border-stone-400/40 text-[#385e30] rounded font-bold transition text-left shrink-0 active:scale-95"
                        >
                          + Simulate source .TS
                        </button>
                        <button
                          type="button"
                          onClick={() => simulateFileType('mp4')}
                          className="px-2 py-1 bg-[#ede7df] hover:bg-[#e4d9cc] text-[9px] font-serif border border-stone-400/40 text-[#704231] rounded font-bold transition text-left shrink-0 active:scale-95"
                        >
                          + Simulate Voice MP4
                        </button>
                      </div>
                    </div>

                    {/* Dropped files list in config panel */}
                    {ingestFiles.length > 0 && (
                      <div className="flex-1 overflow-y-auto max-h-[140px] bg-white/40 border border-[#cdc4b6] rounded-xl p-3">
                        <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-stone-500 block mb-1.5">
                          Attached Ingested Assets ({ingestFiles.length})
                        </span>
                        <div className="space-y-1">
                          {ingestFiles.map((file, fIdx) => (
                            <div 
                              key={fIdx}
                              className="flex items-center justify-between text-[10.5px] bg-white p-1.5 rounded-lg border border-stone-200"
                            >
                              <span className="truncate max-w-[190px] font-sans font-semibold text-stone-800 flex items-center gap-1.5">
                                <File className="w-3.5 h-3.5 text-[#beb4e8]" />
                                {file.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[8.5px] text-stone-500 font-mono font-bold">
                                  {file.size}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIngestFiles(prev => prev.filter((_, i) => i !== fIdx))}
                                  className="text-stone-400 hover:text-red-700 p-0.5 rounded transition"
                                  title="Remove simulated file"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Column (Unified Selector Configuration panel) */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <label className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-stone-500 block leading-tight">
                      2. Unified Resource Selector Config
                    </label>

                    {/* Convert Node category selector tabs */}
                    <div className="grid grid-cols-4 bg-stone-200/50 rounded-xl p-1 gap-1 border border-[#cdc4b6]/80 text-[10.5px] font-bold font-sans">
                      <button
                        type="button"
                        onClick={() => setIngestType('note')}
                        className={`py-1.5 rounded-lg transition-all flex flex-col items-center gap-1 ${
                          ingestType === 'note' ? 'bg-[#2a2927] text-white shadow' : 'hover:bg-[#eae2da] text-stone-600'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Flat Note</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIngestType('image')}
                        className={`py-1.5 rounded-lg transition-all flex flex-col items-center gap-1 ${
                          ingestType === 'image' ? 'bg-[#2a2927] text-white shadow' : 'hover:bg-[#eae2da] text-stone-600'
                        }`}
                      >
                        <Image className="w-3.5 h-3.5 shrink-0" />
                        <span>Mockup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIngestType('video')}
                        className={`py-1.5 rounded-lg transition-all flex flex-col items-center gap-1 ${
                          ingestType === 'video' ? 'bg-[#2a2927] text-white shadow' : 'hover:bg-[#eae2da] text-stone-600'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5 shrink-0" />
                        <span>Tutorial</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIngestType('item')}
                        className={`py-1.5 rounded-lg transition-all flex flex-col items-center gap-1 ${
                          ingestType === 'item' ? 'bg-[#2a2927] text-white shadow' : 'hover:bg-[#eae2da] text-stone-600'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Library Link</span>
                      </button>
                    </div>

                    {/* Content Fields inputs dependant on type */}
                    <div className="bg-white rounded-xl border border-[#cdc4b6] p-4 flex-1 flex flex-col gap-3">
                      
                      {/* Node Renamer Title Field */}
                      <div>
                        <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                          Node Headline Banner Title
                        </span>
                        <input
                          type="text"
                          value={ingestTitle}
                          onChange={(e) => setIngestTitle(e.target.value)}
                          placeholder="Provide descriptive title of this core mockup..."
                          className="w-full text-xs bg-stone-100 rounded-lg border border-[#cdc4b6] px-3 py-2 focus:ring-1 focus:ring-stone-600 outline-none font-bold"
                        />
                      </div>

                      {/* Tab 1: Note content and code specification block */}
                      {ingestType === 'note' && (
                        <div className="space-y-3 flex-1 flex flex-col">
                          <div className="flex-1 flex flex-col">
                            <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                              Specification markdown notes
                            </span>
                            <textarea
                              value={ingestContent}
                              onChange={(e) => setIngestContent(e.target.value)}
                              placeholder="Describe structural architecture, code implementation specs, or anchor checkpoints..."
                              className="w-full h-24 text-xs bg-stone-100 rounded-lg border border-[#cdc4b6] p-3 focus:ring-1 focus:ring-stone-600 outline-none resize-none flex-1 font-medium text-stone-750"
                            />
                          </div>
                          <div>
                            <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                              Code draft/snippet specification
                            </span>
                            <textarea
                              value={ingestCodeSnippet}
                              onChange={(e) => setIngestCodeSnippet(e.target.value)}
                              placeholder="paste sample Express.js middleware or JSON spec schema... eg: const app = express();"
                              className="w-full h-16 font-mono text-[10px] bg-stone-900 text-stone-300 rounded-lg p-2 focus:outline-none"
                            />
                          </div>

                          {/* Notion/WhatsApp style Reference URL input row */}
                          <div className="grid grid-cols-2 gap-2 mt-1 shrink-0">
                            <div>
                              <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                                Reference Option URL Link
                              </span>
                              <input
                                type="text"
                                value={ingestResourceUrl}
                                onChange={(e) => setIngestResourceUrl(e.target.value)}
                                placeholder="e.g., https://github.com"
                                className="w-full text-xs bg-stone-100 rounded-lg border border-[#cdc4b6]/80 px-3 py-1.5 focus:ring-1 focus:ring-stone-600 outline-none text-stone-800 font-medium"
                              />
                            </div>
                            <div>
                              <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                                Reference link Title
                              </span>
                              <input
                                type="text"
                                value={ingestResourceTitle}
                                onChange={(e) => setIngestResourceTitle(e.target.value)}
                                placeholder="e.g., GitHub Workspace"
                                className="w-full text-xs bg-stone-100 rounded-lg border border-[#cdc4b6]/80 px-3 py-1.5 focus:ring-1 focus:ring-stone-600 outline-none text-stone-800 font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Image Mockup & wireframes URL links */}
                      {ingestType === 'image' && (
                        <div className="space-y-3 flex-1">
                          <div>
                            <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                              Mockup image URL link
                            </span>
                            <input
                              type="text"
                              value={ingestContent}
                              onChange={(e) => setIngestContent(e.target.value)}
                              placeholder="Paste design mockup jpeg, png or raw unsplash flowchart link..."
                              className="w-full text-xs bg-stone-100 rounded-lg border border-[#cdc4b6] px-3 py-2 outline-none font-medium"
                            />
                          </div>

                          <span className="text-[9px] font-mono font-bold text-[#867c71] block mt-1.5">
                            💡 Instant visual suggestions:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIngestContent('https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60')}
                              className="px-2 py-1 bg-[#ede7df] hover:bg-stone-200 border border-stone-300 text-[9px] rounded font-bold transition text-left truncate font-sans text-stone-700"
                            >
                              📁 Abstract Wireframe Design
                            </button>
                            <button
                              type="button"
                              onClick={() => setIngestContent('https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=60')}
                              className="px-2 py-1 bg-[#ede7df] hover:bg-stone-200 border border-stone-300 text-[9px] rounded font-bold transition text-left truncate font-sans text-stone-700"
                            >
                              📁 System Flowchart Spec
                            </button>
                          </div>

                          {ingestContent && ingestContent.startsWith('http') && (
                            <div className="mt-3 relative rounded-lg overflow-hidden border border-stone-300 shadow bg-stone-100 max-h-[110px]">
                              <img
                                src={ingestContent}
                                alt="Spec preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 3: YouTube specs */}
                      {ingestType === 'video' && (
                        <div className="space-y-3 flex-1">
                          <div>
                            <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                              YouTube Video Ingestion Link
                            </span>
                            <input
                              type="text"
                              value={ingestContent}
                              onChange={(e) => setIngestContent(e.target.value)}
                              placeholder="Paste video URL... eg: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                              className="w-full text-xs bg-stone-100 rounded-lg border border-[#cdc4b6] px-3 py-2 outline-none font-medium text-stone-750"
                            />
                          </div>

                          <span className="text-[9px] font-mono font-bold text-[#867c71] block mt-1">
                            📹 Instant testing simulated assets:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIngestContent('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                              className="px-2 py-1 bg-[#ede7df] hover:bg-[#e4d9cc] text-[9.5px] rounded border border-stone-300 font-bold transition text-left text-stone-700"
                            >
                              ▶️ Rickroll Easter Spec
                            </button>
                            <button
                              type="button"
                              onClick={() => setIngestContent('https://www.youtube.com/watch?v=SqcY0GlETPk')}
                              className="px-2 py-1 bg-[#ede7df] hover:bg-[#e4d9cc] text-[9.5px] rounded border border-stone-300 font-bold transition text-left text-stone-700"
                            >
                              ▶️ System Microservices
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tab 4: Notion style document references categorized */}
                      {ingestType === 'item' && (
                        <div className="space-y-3 flex-1">
                          <div>
                            <span className="text-[9.5px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-1">
                              Select Workspace Linked Idea Item Document
                            </span>
                            <select
                              value={ingestItemId}
                              onChange={(e) => {
                                const matchedId = e.target.value;
                                setIngestItemId(matchedId);
                                const selectedObj = allLibraryItems.find(x => x.id === matchedId);
                                if (selectedObj) {
                                  setIngestTitle(selectedObj.title);
                                }
                              }}
                              className="w-full text-xs bg-stone-100 rounded-lg border border-[#cdc4b6] px-3 py-2 outline-none font-bold text-stone-800"
                            >
                              <option value="" disabled>-- Choose a Notion style document --</option>
                              {linkableItems.map((itm) => (
                                <option key={itm.id} value={itm.id}>
                                  🟣 [{itm.domainTag}] - {itm.title} ({itm.year || '2026'})
                                </option>
                              ))}
                            </select>
                            <span className="text-[9px] text-stone-500 block mt-1.5 leading-snug">
                              Selecting an item instantly links this node's visual rendering to its categorized status tag, color settings, and key team year indicators.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Generic Hyperlink Bookmark Anchor */}
                      <div className="border-t border-stone-200/60 pt-2 flex gap-3.5">
                        <div className="flex-1">
                          <span className="text-[9px] font-mono tracking-wider font-bold text-stone-500 uppercase block mb-0.5">
                            Bookmark Resource external link
                          </span>
                          <input
                            type="text"
                            value={ingestResourceUrl}
                            onChange={(e) => setIngestResourceUrl(e.target.value)}
                            placeholder="https://medium.com/engineering/edge-cases"
                            className="w-full text-[11px] bg-stone-100 rounded-md border border-[#cdc4b6] px-2 py-1 outline-none font-medium"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Footer buttons */}
                <div className="bg-[#ede7df] border-t border-[#cdc4b6] px-6 py-4 flex items-center justify-between shrink-0">
                  <span className="text-[9px] text-[#867c71] font-mono leading-relaxed max-w-[340px] uppercase font-bold">
                    🛡️ Changes are persisted safely directly to memory and local database pipelines.
                  </span>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveIngestNodeId(null)}
                      className="px-4 py-2 bg-[#eae2da] hover:bg-[#ded5c6] text-xs font-bold text-stone-800 rounded-lg transition"
                    >
                      Discard changes
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveIngest}
                      className="px-5 py-2 bg-[#2d2c29] hover:bg-black text-[#ede7df] hover:text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                    >
                      Save Node Resource Config
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Full-screen Image Lightbox Overlay (Notion/Figma style) */}
        <AnimatePresence>
          {lightboxImageUrl && (
            <div 
              onClick={() => setLightboxImageUrl(null)}
              className="absolute inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out select-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-[90vw] max-h-[80vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={lightboxImageUrl} 
                  alt="High Resolution Preview" 
                  className="max-w-full max-h-[72vh] rounded-lg border border-stone-800 shadow-2xl object-contain select-auto"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <a 
                    href={lightboxImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-stone-900/80 hover:bg-black text-white hover:scale-105 rounded-full transition-all border border-stone-800 flex items-center justify-center"
                    title="Open pure image in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setLightboxImageUrl(null)}
                    className="p-2 bg-stone-900/80 hover:bg-black text-white hover:scale-105 rounded-full transition-all border border-stone-800 flex items-center justify-center cursor-pointer"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-white/60 font-sans text-[11px] font-bold mt-3.5 bg-stone-950/70 px-3 py-1 rounded-full border border-white/5 select-none text-center">
                  🔍 High Resolution Design Frame • Close or scroll background to dismiss
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
