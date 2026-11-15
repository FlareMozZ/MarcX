import React, { useState } from 'react';
import { DomainItem, COLOR_MAP } from '../types';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MasonryGridProps {
  items: DomainItem[];
  domainName: string;
  onSelectItem: (item: DomainItem) => void;
  onDeleteItem: (id: string, e: React.MouseEvent) => void;
}

export default function MasonryGrid({ items, domainName, onSelectItem, onDeleteItem }: MasonryGridProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    /* Equal height CSS Grid grid-cols-1 md:grid-cols-2 gap-6 */
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence>
        {items.map((item, index) => {
          const colorStyles = COLOR_MAP[item.color] || COLOR_MAP.lilac;
          const isConfirming = confirmDeleteId === item.id;
          
          let displayedAuthors = item.techStacks && item.techStacks.length > 0 
            ? item.techStacks.join(', ') 
            : 'Lead Architect, Core Compiler';

          if (item.id === '62b9a117-90f1-4db8-b4b1-9f939eafbef1') {
            displayedAuthors = 'Haonan Li, Tianyang Zhou, Manu Sridharan, Hang Zhang, Zhiyun Qian';
          } else if (item.id === 'f9a1fec0-e374-4b5c-a212-be2069eeb7d2') {
            displayedAuthors = 'Peter Fettke, Wolfgang Reisig';
          }

          // Count completed checklist items
          const completedCount = item.notionBlocks 
            ? item.notionBlocks.filter(b => b.type === 'todo' && b.completed).length 
            : 1;

          return (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
              onClick={() => onSelectItem(item)}
              /* Uniform size cards: exact fixed height 'h-[250px]' for matching deck shape */
              className={`relative cursor-pointer flex flex-col justify-between ${colorStyles.bg} border-2 ${colorStyles.border} rounded-3xl p-6 shadow-2xs select-none hover:shadow-md transition-all active:scale-[0.99] duration-300 group h-[250px] overflow-hidden`}
            >
              <div className="overflow-hidden flex-1 flex flex-col">
                {/* Meta Badge Row with stopPropagation Delete button */}
                <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold tracking-wide uppercase mb-3 text-stone-500 opacity-80 font-sans shrink-0">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="bg-white/80 text-stone-700 px-1.5 py-0.5 rounded-md text-[9px] shrink-0">NEW</span>
                    <span>•</span>
                    <span className="shrink-0">{item.year || '2026'}</span>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{domainName}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {isConfirming && (
                      <span className="text-[9px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded-sm font-semibold motion-preset-fade">
                        Confirm?
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConfirming) {
                          onDeleteItem(item.id, e);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(item.id);
                          // Auto reset after 3 seconds if not clicked again
                          setTimeout(() => {
                            setConfirmDeleteId(current => current === item.id ? null : current);
                          }, 3000);
                        }
                      }}
                      className={`p-1.5 rounded-full transition-all cursor-pointer z-10 shrink-0 ${
                        isConfirming 
                          ? 'bg-red-600 text-white hover:bg-red-700 scale-105 shadow-xs' 
                          : 'text-stone-500 hover:text-red-700 hover:bg-white/90 opacity-80 group-hover:opacity-100 font-bold'
                      }`}
                      title={isConfirming ? "Click again to confirm delete" : "Delete item"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Title: Clamped to exactly 2 lines maximum so it fits nicely inside h-[250px] */}
                <h4 
                  className={`font-serif text-[16px] md:text-[17px] font-extrabold leading-tight tracking-tight ${colorStyles.ink} line-clamp-2 break-words overflow-hidden text-ellipsis`}
                  title={item.title}
                >
                  {item.title}
                </h4>

                {/* Subtitle / Author list: Clamped to 1 line maximum to ensure perfect vertical spacing */}
                <p className="text-stone-500/90 text-[11px] mt-2.5 leading-normal font-sans font-medium truncate max-w-full text-ellipsis overflow-hidden shrink-0">
                  {displayedAuthors}
                </p>
              </div>

              {/* Card Footer Status section */}
              <div className="pt-3 border-t border-[#000000]/05 mt-4 flex items-center justify-between text-stone-500 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600">
                  <FileText className="w-3.5 h-3.5 opacity-60 text-stone-700 shrink-0" />
                  <span>{completedCount} Blueprint Tasks</span>
                </div>

                {/* Enter Document reading indicator */}
                <span className="text-[9.5px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-stone-750">
                  <Eye className="w-3 h-3" />
                  <span>Open</span>
                </span>
              </div>

            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
