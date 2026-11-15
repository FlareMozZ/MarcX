import React, { useState, useEffect } from 'react';
import { Domain } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Edit2, Check, X, FileText, BookOpen, Layers, Sparkles, 
  Plus, Trash2, HelpCircle, Compass, Terminal, FileCode, CheckSquare
} from 'lucide-react';

interface ZeroStateProps {
  activeDomain: Domain;
  selectedTypeTab: 'item' | 'notebook' | 'canvas';
  onPlanCanvas: () => void;
  onCaptureThought: () => void;
  onDeleteDomain: () => void;
  onChangeColor: () => void;
  onUpdateDomainName: (name: string) => void;
}

export default function ZeroState({
  activeDomain,
  selectedTypeTab,
  onPlanCanvas,
  onCaptureThought,
  onDeleteDomain,
  onChangeColor,
  onUpdateDomainName,
}: ZeroStateProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(activeDomain.name);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setEditedName(activeDomain.name);
    setIsEditingName(false);
    setIsConfirmingDelete(false);
  }, [activeDomain]);

  const handleSave = () => {
    if (editedName.trim() && editedName.trim() !== activeDomain.name) {
      onUpdateDomainName(editedName.trim());
      setIsEditingName(false);
    } else {
      setIsEditingName(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 px-4 min-h-[500px] relative z-10"
    >
      {/* Central Category Badge - Editable inline */}
      <div className="flex items-center gap-3 bg-[#eae2da] border border-[#d3c9be] px-6 py-3 rounded-full shadow-xs max-w-md group/pill transition-all duration-200">
        <span
          title="Click to randomly cycle category color hue"
          onClick={(e) => {
            e.stopPropagation();
            onChangeColor();
          }}
          className="w-5 h-5 rounded-full shrink-0 shadow-inner cursor-pointer hover:scale-125 hover:rotate-12 transition-all active:scale-95 duration-200 ring-2 ring-transparent hover:ring-[#b0a294]"
          style={{ backgroundColor: activeDomain.iconColor || '#9c8eb9' }}
        ></span>

        {isEditingName ? (
          <div className="flex items-center gap-1.5 font-serif font-bold text-md text-[#3e3833]">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="bg-white/60 text-[#3e3833] font-serif font-bold text-sm px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-stone-400 max-w-[160px] text-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditedName(activeDomain.name);
                  setIsEditingName(false);
                }
              }}
            />
            <button onClick={handleSave} className="text-emerald-700 hover:bg-stone-300/30 p-0.5 rounded">
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              onClick={() => {
                setEditedName(activeDomain.name);
                setIsEditingName(false);
              }}
              className="text-stone-500 hover:bg-stone-300/30 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsEditingName(true)}
            title="Click to edit category title"
          >
            <span className="font-serif text-[#3e3833] font-bold tracking-wide text-sm select-none">
              {activeDomain.name}
            </span>
            <Edit2 className="w-3.5 h-3.5 text-stone-500 opacity-0 group-hover/pill:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Conditional Illustrations/Badges matching the respective tab */}
      <AnimatePresence mode="wait">
        {selectedTypeTab === 'item' && (
          <motion.div
            key="item-zero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center mt-6 text-center max-w-md"
          >
            <div className="p-4 bg-[#f1ebd9] rounded-2xl border border-[#cdc2b3] shadow-2xs mb-4 text-[#8a7f6e] flex items-center justify-center relative">
              <FileText className="w-10 h-10" />
              <Sparkles className="w-4.5 h-4.5 absolute -top-1.5 -right-1.5 text-[#938ab3]" />
            </div>
            <h4 className="font-serif text-[#3e3833] font-bold text-base mb-1.5">No Notion-Style Documents</h4>
            <p className="text-[#83776a] text-xs leading-relaxed font-sans font-medium px-4">
              This category is empty. Start by drafting a study ideation document or capturing a blueprint reference utilizing standard digital rich text blocks!
            </p>
          </motion.div>
        )}

        {selectedTypeTab === 'notebook' && (
          <motion.div
            key="notebook-zero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center mt-6 text-center max-w-md"
          >
            <div className="p-4 bg-[#f8ebdd] rounded-2xl border border-[#e1ccb9] shadow-2xs mb-4 text-[#9c7857] flex items-center justify-center relative">
              <BookOpen className="w-10 h-10" />
              <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 bg-amber-205 text-[#6c4e33] border border-[#d6a582]/40 rounded-full absolute -top-2 -right-3 rotate-12 shadow-xs bg-[#fdeddd]">
                Later Stage
              </span>
            </div>
            <h4 className="font-serif text-[#3e3833] font-bold text-base mb-1.5">Notebooks coming soon</h4>
            <p className="text-[#83776a] text-xs leading-relaxed font-sans font-medium px-4">
              Notebooks are going to be implemented at a later stage! They will introduce modular code-running cells, dynamic markdown scratchpads, and chronological research logs.
            </p>
          </motion.div>
        )}

        {selectedTypeTab === 'canvas' && (
          <motion.div
            key="canvas-zero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center mt-6 text-center max-w-md"
          >
            <div className="p-4 bg-[#e5e9ea] rounded-2xl border border-[#bbc8cb] shadow-2xs mb-4 text-[#5b878f] flex items-center justify-center relative">
              <Layers className="w-10 h-10 animate-pulse" />
              <Compass className="w-4.5 h-4.5 absolute -bottom-1 -right-1 text-[#5b878f]" />
            </div>
            <h4 className="font-serif text-[#3e3833] font-bold text-base mb-1.5">Interactive Spatialboard Canvas</h4>
            <p className="text-[#83776a] text-xs leading-relaxed font-sans font-medium px-4 font-sans leading-normal">
              No canvases exist in this category. A Canvas is a spacious workspace window where you drop customizable video references, UI mockups, files, code components, and map ties together!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Spine - minimalist fine centered vertical line linking down */}
      <div className="w-[1.5px] h-16 bg-[#cfc3b4] my-4 opacity-70 shrink-0"></div>

      {/* Dynamic CTAs tailored strictly to what tab is open */}
      <div className="flex flex-col gap-2.5 items-center w-full max-w-xs">
        {selectedTypeTab === 'canvas' && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            id="btn-plan-canvas"
            onClick={onPlanCanvas}
            className="w-full max-w-[190px] text-center py-2.5 rounded-full text-xs font-bold tracking-wide text-[#faf6f0] bg-[#618a8f] hover:bg-[#4d7175] border border-[#52797d] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Canvas</span>
          </motion.button>
        )}

        {selectedTypeTab === 'item' && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            id="btn-capture-thought"
            onClick={onCaptureThought}
            className="w-full max-w-[190px] text-center py-2.5 rounded-full text-xs font-bold tracking-wide text-[#faf6f0] bg-[#938ab3] hover:bg-[#80769d] border border-[#7d73a0] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </motion.button>
        )}

        {selectedTypeTab === 'notebook' && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            id="btn-learn-roadmap"
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="w-full max-w-[190px] text-center py-2.5 rounded-full text-xs font-bold tracking-wide text-[#6c4e33] bg-[#f9ebdf] hover:bg-[#edd2b8] border border-[#deb294] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-[#9c7857]" />
            <span>Roadmap Specs</span>
          </motion.button>
        )}

        {/* System & Reset Actions */}
        <div className="flex items-center gap-2 mt-2">
          {/* Change color dot trigger */}
          <button
            type="button"
            onClick={onChangeColor}
            className="px-2.5 py-1.5 bg-[#eae2da] hover:bg-[#e4d6c4] border border-[#d6c5b2] text-[10px] font-bold text-[#564e43] rounded-full transition-transform cursor-pointer shadow-3xs"
            title="Cycle Hue"
          >
            🎨 Style
          </button>

          {/* Delete active category */}
          <button
            id="btn-delete-domain"
            onClick={() => {
              if (isConfirmingDelete) {
                onDeleteDomain();
                setIsConfirmingDelete(false);
              } else {
                setIsConfirmingDelete(true);
                setTimeout(() => {
                  setIsConfirmingDelete(current => current ? false : current);
                }, 4000); // Reset confirmation state after 4 seconds
              }
            }}
            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer shadow-3xs ${
              isConfirmingDelete 
                ? 'bg-red-600 text-white border border-red-700 hover:bg-red-700 animate-pulse' 
                : 'text-[#7a4843] bg-[#eed9d6] hover:bg-[#eacbc7] border border-[#deb6ba]'
            }`}
          >
            {isConfirmingDelete ? '⚠️ Confirm Delete?' : '🗑️ Delete'}
          </button>
        </div>
      </div>

      {/* Notebook Roadmap Slideout Panel */}
      <AnimatePresence>
        {showRoadmap && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mt-6 p-5 bg-white/75 border border-[#deb192]/60 rounded-2xl shadow-md max-w-sm text-left leading-relaxed relative"
          >
            <button
              onClick={() => setShowRoadmap(false)}
              className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-50 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <h5 className="font-serif font-bold text-xs text-[#6e4e32] flex items-center gap-1 mr-6">
              <Terminal className="w-4 h-4 text-[#9c7857]" /> Dynamic Notebooks Architecture
            </h5>
            <p className="text-[11px] text-[#7c6958] mt-1.5 leading-snug">
              The next roadmap release will introduce containerized execution, visual dataframes parsing, and collaborative notebooks integrated alongside your study maps:
            </p>
            <ul className="list-none space-y-2 mt-3 pl-1 font-sans text-[10px] font-medium text-stone-700">
              <li className="flex items-start gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#9c7857] shrink-0 mt-0.5" />
                <span><strong>Executable Cells</strong>: Fire standard script modules, make test Node setups, analyze parameters, and print debug outputs directly.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#9c7857] shrink-0 mt-0.5" />
                <span><strong>Study Milestones Sync</strong>: Build, track, and execute development checklists alongside your specification document notes.</span>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

