import React, { useState, useEffect } from 'react';
import { DomainItem, NotionBlock, COLOR_MAP } from '../types';
import { 
  X, Check, Plus, Trash2, Edit2, Sparkles, Bold, Heading as HeadingIcon, 
  ListTodo, List, Code, FileText, Download, Bookmark, Share2, HelpCircle,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IdeationDocViewProps {
  isOpen: boolean;
  onClose: () => void;
  item: DomainItem;
  domainName: string;
  onUpdateItem: (updatedItem: DomainItem) => void;
}

export default function IdeationDocView({
  isOpen,
  onClose,
  item,
  domainName,
  onUpdateItem,
}: IdeationDocViewProps) {
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [editBlockId, setEditBlockId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // States for inline editing of the header parameters (synced back to homepage cards!)
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [editedDomainTag, setEditedDomainTag] = useState(item.domainTag || 'Full-Stack');
  const [isEditingDomainTag, setIsEditingDomainTag] = useState(false);

  const [newTechInput, setNewTechInput] = useState('');
  const [isAddingTech, setIsAddingTech] = useState(false);

  // Sync edits when selected item changes
  useEffect(() => {
    if (item) {
      setEditedTitle(item.title);
      setEditedDomainTag(item.domainTag || 'Full-Stack');
      if (item.notionBlocks && item.notionBlocks.length > 0) {
        setBlocks(item.notionBlocks);
      } else {
        const defaultBlocks: NotionBlock[] = [
          {
            id: 'b-head-1',
            type: 'heading',
            content: 'Abstract Blueprint',
          },
          {
            id: 'b-text-1',
            type: 'paragraph',
            content: item.description || 'This is the foundational specification for the system archetype annotated in our slow-tech repository.',
          },
          {
            id: 'b-head-1.5',
            type: 'heading',
            content: '1. Introduction & Environmental Boundaries',
          },
          {
            id: 'b-text-1.5',
            type: 'paragraph',
            content: 'Static analysis tools are used to flag anomalies in codebases, but they report high rates of false positives. This documentation outlines safe validation techniques utilizing localized state machines.',
          },
          {
            id: 'b-head-2',
            type: 'heading',
            content: '2. Implementation Checklist',
          },
          {
            id: 'b-todo-1',
            type: 'todo',
            content: 'Configure FastAPI local ingestion gateways',
            completed: true,
          },
          {
            id: 'b-todo-2',
            type: 'todo',
            content: 'Execute system integration with offline state cache',
            completed: false,
          },
          {
            id: 'b-todo-3',
            type: 'todo',
            content: 'Benchmark validation latency using token metrics',
            completed: false,
          },
          {
            id: 'b-head-3',
            type: 'heading',
            content: '3. Technical Schema Implementation',
          },
          {
            id: 'b-bullet-1',
            type: 'bullet',
            content: 'Isolation Boundaries: Ensure data cannot leak across local process barriers.',
          },
          {
            id: 'b-bullet-2',
            type: 'bullet',
            content: 'Execution Telemetry: Bind all logging activities directly to local context vectors.',
          },
          {
            id: 'b-code-1',
            type: 'code',
            content: `// Automated Validation Framework\nconst pipeline = async (rawInput: string) => {\n  const sanitized = rawInput.trim();\n  console.log("Validating system state indices...");\n  return sanitizeAndDeploy(sanitized);\n};`,
          }
        ];
        setBlocks(defaultBlocks);
        onUpdateItem({
          ...item,
          notionBlocks: defaultBlocks,
        });
      }
    }
  }, [isOpen, item.id]); // trigger sync when model id shifts

  if (!isOpen) return null;

  // Header param saving handlers
  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle.trim() !== item.title) {
      onUpdateItem({
        ...item,
        title: editedTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDomainTag = () => {
    if (editedDomainTag.trim() && editedDomainTag.trim() !== item.domainTag) {
      onUpdateItem({
        ...item,
        domainTag: editedDomainTag.trim(),
      });
    }
    setIsEditingDomainTag(false);
  };

  const handleAddTechStack = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTechInput.trim()) {
      const tool = newTechInput.trim();
      const current = item.techStacks || [];
      if (!current.includes(tool)) {
        const updated = [...current, tool];
        onUpdateItem({
          ...item,
          techStacks: updated,
        });
      }
      setNewTechInput('');
      setIsAddingTech(false);
    }
  };

  const handleRemoveTechStack = (tool: string) => {
    const updated = (item.techStacks || []).filter(t => t !== tool);
    onUpdateItem({
      ...item,
      techStacks: updated,
    });
  };

  // Toggle todo block
  const handleToggleTodo = (blockId: string) => {
    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        return { ...b, completed: !b.completed };
      }
      return b;
    });
    setBlocks(updated);
    onUpdateItem({
      ...item,
      notionBlocks: updated,
    });
  };

  // Add a new block definition
  const handleAddBlock = (type: 'paragraph' | 'heading' | 'todo' | 'bullet' | 'code' | 'image' | 'video') => {
    let content = '';
    switch (type) {
      case 'heading': content = 'New Chapter Section'; break;
      case 'todo': content = 'New Actionable Item'; break;
      case 'bullet': content = 'Key Architectural Bulletpoint'; break;
      case 'code': content = `// Insert code block here\nconsole.log("Hello Dynamic Playground");`; break;
      case 'image': content = 'https://placekitten.com/640/360'; break;
      case 'video': content = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; break;
      default: content = 'Type your paragraph thoughts here...';
    }

    const newBlock: NotionBlock = {
      id: `b-user-${Date.now()}`,
      type,
      content,
      completed: type === 'todo' ? false : undefined,
    };

    const updated = [...blocks, newBlock];
    setBlocks(updated);
    onUpdateItem({
      ...item,
      notionBlocks: updated,
    });
    setShowAddMenu(false);

    // Automatically trigger rename state
    setEditBlockId(newBlock.id);
    setEditContent(newBlock.content);
  };

  const startEditBlock = (block: NotionBlock) => {
    setEditBlockId(block.id);
    setEditContent(block.content);
  };

  const saveBlockEdit = () => {
    if (editBlockId) {
      const updated = blocks.map((b) => {
        if (b.id === editBlockId) {
          return { ...b, content: editContent };
        }
        return b;
      });
      setBlocks(updated);
      onUpdateItem({
        ...item,
        notionBlocks: updated,
      });
      setEditBlockId(null);
    }
  };

  const deleteBlock = (blockId: string) => {
    const updated = blocks.filter((b) => b.id !== blockId);
    setBlocks(updated);
    onUpdateItem({
      ...item,
      notionBlocks: updated,
    });
  };

  const runAiSpark = () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const generatedList = [
        `**AI Generation regarding "${promptInput}":** We recommend isolated async routines designed to prevent database lock:\n- Wrap updates in transaction units.\n- Store pre-commit hashes in transient storage.\n- Retry logic with exponential backoff on write blockages.`,
        `**System Optimization Advice:** Scale requirements indicate partition keying. Build telemetry counters on indices using memory-mapped local stores.`,
        `**Engineering Blueprint guidelines:** Introduce background daemon threads for indexing the ingested files, parsing text files in chunks of 4KB to save operational bounds.`
      ];
      const resultText = generatedList[Math.floor(Math.random() * generatedList.length)];

      const newBlock: NotionBlock = {
        id: `b-user-ai-${Date.now()}`,
        type: 'paragraph',
        content: resultText,
      };

      const updated = [...blocks, newBlock];
      setBlocks(updated);
      onUpdateItem({
        ...item,
        notionBlocks: updated,
      });
      setPromptInput('');
      setIsGenerating(false);
    }, 1200);
  };

  const paperBgColor = item.color === 'lilac' ? '#e4ddf8' : item.color === 'sky' ? '#d2f0f7' : item.color === 'mint' ? '#e1f2dc' : '#fae2da';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1c1a17]/95 text-stone-100 overflow-hidden">
      
      {/* Header bar styled exactly like openaresearchpaperpdfreader.png */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#2c2824] border-b border-[#3c3630]/90 font-sans text-xs select-none shadow shrink-0">
        <div className="flex items-center gap-1.5 md:gap-3 overflow-hidden text-ellipsis mr-4">
          <span className="text-[#a89c90] hover:text-white transition-colors cursor-pointer" onClick={onClose}>
            Active Category
          </span>
          <span className="text-[#645a50]">/</span>
          <div className="flex items-center gap-1.5 font-medium shrink-0">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color === 'lilac' ? '#938ab3' : item.color === 'sky' ? '#6293a3' : item.color === 'mint' ? '#7ca586' : '#9e6e5a' }}
            ></span>
            <span className="text-[#a89c90] font-semibold">{domainName}</span>
          </div>
          <span className="text-[#645a50] shrink-0">/</span>
          <span className="font-serif font-bold text-stone-200 truncate max-w-[180px] md:max-w-md whitespace-nowrap">
            {item.title}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="p-1.5 rounded-full hover:bg-stone-700/50 text-[#cbbab0] transition-colors" title="Bookmark article">
            <Bookmark className="w-4 h-4" />
          </button>
          
          <button className="p-1.5 rounded-full hover:bg-stone-700/50 text-[#cbbab0] transition-colors" title="Share link">
            <Share2 className="w-4 h-4" />
          </button>

          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700/70 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container: No height bounds on document sheet itself, letting parent scroll wrap everything beautifully */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        
        {/* Centered Document paper page with same color as card! */}
        <div 
          className="w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-800/10 p-6 md:p-12 text-[#2c2824] relative min-h-fit mb-12 flex flex-col justify-start"
          style={{ backgroundColor: paperBgColor }}
        >
          {/* Top research header styling */}
          <div className="border-b border-stone-800/10 pb-6 mb-8 text-center md:text-left shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-mono bg-white/40 px-2.5 py-0.5 rounded font-extrabold text-stone-800">
                  SYSTEM BLUEPRINT DRAFT • {item.year}
                </span>
                <div className="text-[10px] text-stone-600 font-mono mt-1">
                  Created via Quick-Capture Hub
                </div>
              </div>

              <div className="text-right text-[10.5px] font-mono text-stone-600 flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span>Feasibility:</span>
                  <select
                    id="select-doc-feasibility"
                    value={item.feasibility}
                    onChange={(e) => {
                      onUpdateItem({
                        ...item,
                        feasibility: e.target.value,
                      });
                    }}
                    className="font-bold text-stone-800 bg-white/50 border border-stone-850/10 rounded px-1.5 py-0.5 focus:outline-none focus:bg-white text-[10.5px] cursor-pointer font-mono"
                  >
                    <option value="Micro-MVP">Micro-MVP</option>
                    <option value="Medium-Scope">Medium-Scope</option>
                    <option value="Medium Project">Medium Project</option>
                    <option value="Large System">Large System</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Status:</span>
                  <select
                    id="select-doc-status"
                    value={item.status}
                    onChange={(e) => {
                      onUpdateItem({
                        ...item,
                        status: e.target.value,
                      });
                    }}
                    className="text-emerald-800 font-bold bg-white/50 border border-stone-850/10 rounded px-1.5 py-0.5 focus:outline-none focus:bg-white text-[10.5px] cursor-pointer font-mono"
                  >
                    <option value="Inbox">Inbox</option>
                    <option value="Raw">Raw</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Requirement 1: Inline EDITABLE Title Header */}
            {isEditingTitle ? (
              <div className="mt-4 flex gap-2 items-start bg-white/30 p-2.5 rounded-xl border border-[#3c3630]/20">
                <textarea
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-serif text-xl md:text-3xl font-extrabold leading-tight tracking-tight text-[#1a1715] bg-transparent focus:outline-none w-full resize-none"
                  autoFocus
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveTitle();
                    }
                  }}
                  onBlur={handleSaveTitle}
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 px-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-850 shrink-0"
                  title="Save title"
                >
                  Save
                </button>
              </div>
            ) : (
              <div 
                className="group/title flex items-center gap-2.5 mt-4 cursor-pointer hover:bg-stone-900/5 p-1 rounded-lg transition-all"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title inline"
              >
                <h1 className="font-serif text-2xl md:text-3.5xl font-extrabold leading-tight tracking-tight text-[#1a1715] flex-1">
                  {item.title}
                </h1>
                <Edit2 className="w-4 h-4 text-stone-500 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
              </div>
            )}

            {/* Technical category tag and metadata chips (Fully Editable and synced!) */}
            <div className="flex flex-wrap gap-2 mt-5 items-center justify-center md:justify-start">
              
              {/* Category Tag Inline Editor */}
              {isEditingDomainTag ? (
                <div className="flex items-center gap-1.5 bg-white border border-stone-800/10 rounded-full px-2 py-0.5">
                  <input
                    type="text"
                    value={editedDomainTag}
                    onChange={(e) => setEditedDomainTag(e.target.value)}
                    className="text-[10px] text-stone-800 focus:outline-none w-20 px-1 font-bold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDomainTag();
                    }}
                    onBlur={handleSaveDomainTag}
                  />
                  <button onClick={handleSaveDomainTag} className="text-emerald-800 p-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <span 
                  onClick={() => setIsEditingDomainTag(true)}
                  className="group/tag cursor-pointer px-3 py-1 bg-white/60 hover:bg-white border border-stone-800/15 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all text-stone-800 shadow-3xs"
                  title="Click to edit domain category"
                >
                  <span>{item.domainTag || 'Full-Stack'}</span>
                  <Edit2 className="w-2.5 h-2.5 text-stone-500 opacity-0 group-hover/tag:opacity-100" />
                </span>
              )}

              {/* Stack Chips with quick Delete mechanics */}
              {item.techStacks && item.techStacks.map((tech) => (
                <span 
                  key={tech} 
                  className="px-2.5 py-0.8 bg-stone-900/10 hover:bg-red-950/10 hover:text-red-900 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 transition-all group/tech"
                  title="Click red cross to dissociate tool"
                >
                  <span>#{tech}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTechStack(tech);
                    }}
                    className="text-stone-500 hover:text-red-700 font-sans font-extrabold ml-1 p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Inline interactive + addition for Tech Tool Tags */}
              {isAddingTech ? (
                <form onSubmit={handleAddTechStack} className="flex items-center gap-1 bg-white/70 border border-stone-500/30 rounded px-2.5 py-0.5 animate-fadeIn">
                  <input
                    type="text"
                    value={newTechInput}
                    onChange={(e) => setNewTechInput(e.target.value)}
                    placeholder="New stack..."
                    className="text-[10px] font-mono text-stone-800 bg-transparent focus:outline-none w-16"
                    autoFocus
                    onBlur={() => {
                      if (!newTechInput.trim()) setIsAddingTech(false);
                    }}
                  />
                  <button type="submit" className="text-emerald-800 hover:scale-110">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTech(true)}
                  className="px-2 py-0.5 bg-stone-900/5 hover:bg-white/70 rounded text-[9.5px] font-mono font-bold text-stone-600 hover:text-stone-800 transition flex items-center gap-1 border border-stone-800/5"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Stack</span>
                </button>
              )}
            </div>
          </div>

          {/* Notion Block-style list editable surface */}
          <div className="space-y-4 flex-1">
            <AnimatePresence initial={false}>
              {blocks.map((block) => {
                const isEditing = editBlockId === block.id;

                return (
                  <motion.div
                    layout
                    key={block.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative rounded-xl hover:bg-stone-900/5 p-2 transition-all"
                  >
                    {/* Interactive Controls on Hover in top-right */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10">
                      <button
                        onClick={() => {
                          if (isEditing) saveBlockEdit();
                          else startEditBlock(block);
                        }}
                        className="p-1 rounded bg-white/70 hover:bg-white text-stone-700 shadow-2xs hover:shadow-xs transition"
                        title="Edit block"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="p-1 rounded bg-white/70 hover:bg-red-100 text-red-600 shadow-2xs transition"
                        title="Delete block"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Editing state */}
                    {isEditing ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white border border-stone-800/20 rounded-lg p-2.5 text-xs text-stone-800 font-sans focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
                          rows={block.type === 'code' ? 4 : 2}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditBlockId(null)}
                            className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-[10px] font-bold rounded-md text-stone-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveBlockEdit}
                            className="px-3 py-1 bg-[#2c2824] hover:bg-black text-white text-[10px] font-bold rounded-md"
                          >
                            Save Block
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard block content rendering based on type */
                      <div className="pr-12">
                        {block.type === 'heading' && (
                          <h3 className="font-serif text-base md:text-lg font-bold text-stone-850/95 tracking-tight border-b border-stone-900/5 pb-1 select-none">
                            {block.content}
                          </h3>
                        )}

                        {block.type === 'paragraph' && (
                          <p className="text-stone-750 text-xs md:text-sm font-sans leading-relaxed whitespace-pre-line">
                            {block.content}
                          </p>
                        )}

                        {block.type === 'todo' && (
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => handleToggleTodo(block.id)}
                              className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                                block.completed 
                                  ? 'bg-[#2c2824] border-[#2c2824] text-white' 
                                  : 'bg-white/80 border-stone-400 hover:border-stone-600 shadow-3xs'
                              }`}
                            >
                              {block.completed && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                            </button>
                            <span className={`text-[13px] font-medium leading-relaxed ${
                                block.completed ? 'line-through text-stone-400 font-normal' : 'text-stone-800'
                            }`}>
                              {block.content}
                            </span>
                          </div>
                        )}

                        {block.type === 'bullet' && (
                          <div className="flex items-start gap-2">
                            <span className="text-stone-500 mt-1 text-xs select-none">•</span>
                            <p className="text-stone-750 text-xs md:text-sm leading-relaxed">
                              {block.content}
                            </p>
                          </div>
                        )}

                        {block.type === 'code' && (
                          <div className="relative font-mono text-[10.5px] bg-[#221f1c] text-stone-200 rounded-xl p-3.5 border border-stone-900/10 overflow-x-auto whitespace-pre my-1 shadow-xs">
                            <div className="absolute top-2 right-2 text-[8px] font-bold text-stone-400 select-none uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded">
                              SYSTEM SCHEMATIC
                            </div>
                            <code>{block.content}</code>
                          </div>
                        )}
                        {block.type === 'image' && (
                          <div className="my-2 rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                            <img src={block.content} alt={block.content.slice(0, 64)} className="w-full h-auto object-cover" />
                            <p className="px-3 py-2 text-[11px] text-stone-500">Image block</p>
                          </div>
                        )}
                        {block.type === 'video' && (
                          <div className="my-2 rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                            <iframe
                              title={block.id}
                              src={block.content.includes('youtube.com') || block.content.includes('youtu.be')
                                ? block.content.replace('watch?v=', 'embed/')
                                : block.content}
                              className="w-full h-44"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                            <p className="px-3 py-2 text-[11px] text-stone-500">Video block</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Notion Add Block Interface Panel */}
          <div className="mt-8 border-t border-stone-800/10 pt-5 flex flex-col items-center shrink-0">
            {showAddMenu ? (
              <div className="bg-white border border-stone-300 rounded-2xl p-2.5 shadow-md flex flex-wrap gap-1.5 justify-center z-10 animate-fadeIn">
                <button 
                  onClick={() => handleAddBlock('paragraph')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  Paragraph
                </button>
                <button 
                  onClick={() => handleAddBlock('heading')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  <HeadingIcon className="w-3.5 h-3.5 text-blue-500" />
                  Chapter Head
                </button>
                <button 
                  onClick={() => handleAddBlock('todo')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  <ListTodo className="w-3.5 h-3.5 text-emerald-500" />
                  Checklist Task
                </button>
                <button 
                  onClick={() => handleAddBlock('bullet')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  <List className="w-3.5 h-3.5 text-amber-500" />
                  Bullet Point
                </button>
                <button 
                  onClick={() => handleAddBlock('code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  <Code className="w-3.5 h-3.5 text-purple-500" />
                  Code Node
                </button>
                <button 
                  onClick={() => handleAddBlock('image')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                  Image Block
                </button>
                <button 
                  onClick={() => handleAddBlock('video')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  <VideoIcon className="w-3.5 h-3.5 text-fuchsia-500" />
                  Video Block
                </button>
                <button 
                  onClick={() => setShowAddMenu(false)}
                  className="px-2 py-1 text-[10px] font-semibold text-stone-400 hover:text-stone-800"
                >
                  × Close
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddMenu(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/45 hover:bg-white/70 border border-stone-800/10 rounded-full text-xs font-bold text-stone-600 hover:text-stone-800 transition shadow-2xs hover:shadow-xs "
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Notion Block</span>
              </button>
            )}
          </div>

          {/* AI Ideas Spark co-writer section on bottom */}
          <div className="mt-10 bg-white/50 rounded-2xl p-4 md:p-5 border border-stone-800/10 space-y-3.5 shrink-0 shadow-3xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <h4 className="font-serif font-extrabold text-xs text-stone-850">
                Incubate System Expansion (Gemini Co-Writer)
              </h4>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ask co-writer: 'propose retry loops', 'draft security guidelines'..."
                className="flex-1 bg-white border border-stone-800/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-stone-600 text-stone-850"
              />
              <button
                type="button"
                onClick={runAiSpark}
                disabled={isGenerating || !promptInput.trim()}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 disabled:bg-stone-300 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {isGenerating ? 'Drafting...' : 'Ask AI'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
