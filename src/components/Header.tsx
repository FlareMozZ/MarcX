import React, { useState, useEffect } from 'react';
import { Domain, DomainItem } from '../types';
import { Edit2, Check, X, FileText, Notebook, Layout, Plus, RefreshCw, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  activeDomain: Domain;
  items: DomainItem[];
  selectedTypeTab: 'item' | 'notebook' | 'canvas';
  setSelectedTypeTab: (type: 'item' | 'notebook' | 'canvas') => void;
  selectedTechStack: string | null;
  setSelectedTechStack: (stack: string | null) => void;
  onUpdateDomain: (domainId: string, updatedName: string, updatedDesc: string) => void;
  onPlanCanvas: () => void;
}

export default function Header({
  activeDomain,
  items,
  selectedTypeTab,
  setSelectedTypeTab,
  selectedTechStack,
  setSelectedTechStack,
  onUpdateDomain,
  onPlanCanvas,
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(activeDomain.name);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState(activeDomain.description);

  // Sync edits when activeDomain changes
  useEffect(() => {
    setEditedTitle(activeDomain.name);
    setEditedDesc(activeDomain.description);
    setIsEditingTitle(false);
    setIsEditingDesc(false);
  }, [activeDomain]);

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateDomain(activeDomain.id, editedTitle.trim(), editedDesc.trim());
      setIsEditingTitle(false);
    }
  };

  const handleSaveDesc = () => {
    onUpdateDomain(activeDomain.id, editedTitle.trim(), editedDesc.trim());
    setIsEditingDesc(false);
  };

  // Compute Tech Stack frequencies for the dynamic bubble chips, based on active domain items
  const techStackCounts: { [key: string]: number } = {};
  items.forEach((item) => {
    if (item.techStacks) {
      item.techStacks.forEach((stack) => {
        techStackCounts[stack] = (techStackCounts[stack] || 0) + 1;
      });
    }
  });

  return (
    <div className="space-y-4">
      {/* 2. Top Header Title & Edit */}
      <div className="space-y-1">
        {isEditingTitle ? (
          <div className="flex items-center gap-2 max-w-xl">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="font-serif text-3xl font-semibold text-[#3a3530] bg-[#fcfaf7] border-b-2 border-[#9c8eb9] focus:outline-none w-full"
              autoFocus
              onKeyDown={(e) => {
                 if (e.key === 'Enter') handleSaveTitle();
                 if (e.key === 'Escape') {
                   setEditedTitle(activeDomain.name);
                   setIsEditingTitle(false);
                 }
              }}
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setEditedTitle(activeDomain.name);
                setIsEditingTitle(false);
              }}
              className="p-1 text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 group">
            <h1 className="font-serif text-4xl text-[#3a3530] font-normal tracking-tight">
              {activeDomain.name}
            </h1>
            <button
              id="btn-edit-title"
              onClick={() => {
                setEditedTitle(activeDomain.name);
                setIsEditingTitle(true);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-all"
              title="Edit Domain Name"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic description of the Domain category */}
        {isEditingDesc ? (
          <div className="flex items-center gap-2 max-w-2xl mt-1">
            <input
              type="text"
              value={editedDesc}
              onChange={(e) => setEditedDesc(e.target.value)}
              className="text-xs text-stone-600 bg-white border border-[#cfc0ae] px-2.5 py-1.5 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#9c8eb9]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveDesc();
                if (e.key === 'Escape') {
                  setEditedDesc(activeDomain.description);
                  setIsEditingDesc(false);
                }
              }}
            />
            <button
              onClick={handleSaveDesc}
              className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditedDesc(activeDomain.description);
                setIsEditingDesc(false);
              }}
              className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditedDesc(activeDomain.description);
              setIsEditingDesc(true);
            }}
            className="text-xs text-[#8c8276] hover:text-[#524c44] italic font-sans font-normal block text-left transition-colors max-w-2xl cursor-text"
            title="Click to edit notes"
          >
            {activeDomain.description || 'A description or notes about this domain.'}
          </button>
        )}
      </div>

      {/* 3. Folder/Index styled Tabs as shown in screenshot added papers */}
      <div className="flex items-end gap-1.5 pt-4">
        {/* Items Tab */}
        <button
          onClick={() => {
            setSelectedTypeTab('item');
            setSelectedTechStack(null);
          }}
          className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all duration-200 cursor-pointer ${
            selectedTypeTab === 'item'
              ? 'bg-[#fcfaf7] border-[#cdc5b8] text-[#3a3530]'
              : 'bg-[#beb7ae]/15 border-transparent text-[#7e746a] hover:bg-[#beb7ae]/30 hover:text-[#3a3530] -translate-y-[-2px]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-950/70" />
          Items
        </button>

        {/* Notebooks Tab */}
        <button
          onClick={() => {
            setSelectedTypeTab('notebook');
            setSelectedTechStack(null);
          }}
          className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all duration-200 cursor-pointer ${
            selectedTypeTab === 'notebook'
              ? 'bg-[#fcfaf7] border-[#cdc5b8] text-[#3a3530]'
              : 'bg-[#beb7ae]/15 border-transparent text-[#7e746a] hover:bg-[#beb7ae]/30 hover:text-[#3a3530] -translate-y-[-2px]'
          }`}
        >
          <Notebook className="w-3.5 h-3.5 text-emerald-950/70" />
          Notebooks
        </button>

        {/* Canvases Tab */}
        <button
          onClick={() => {
            setSelectedTypeTab('canvas');
            setSelectedTechStack(null);
          }}
          className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all duration-200 cursor-pointer ${
            selectedTypeTab === 'canvas'
              ? 'bg-[#fcfaf7] border-[#cdc5b8] text-[#3a3530]'
              : 'bg-[#beb7ae]/15 border-transparent text-[#7e746a] hover:bg-[#beb7ae]/30 hover:text-[#3a3530] -translate-y-[-2px]'
          }`}
        >
          <Layout className="w-3.5 h-3.5 text-purple-950/70" />
          Canvases
        </button>
      </div>

      {/* Decorative horizontal separator bar right underneath tabs to anchor them tightly */}
      <div className="h-[1.5px] bg-[#cdc5b8] w-full -mt-[1.5px]"></div>

      {/* 4. Bubble Filter Chips Section based on requested adaptiveness - limit to item tab */}
      {selectedTypeTab === 'item' && (
        <div className="space-y-1.5 pt-3">
          <div className="text-[10px] font-bold text-[#9d9285] uppercase tracking-wider">
            System Tech Stacks & Tools
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Default 'All' Chip */}
            <button
              onClick={() => setSelectedTechStack(null)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all ${
                selectedTechStack === null
                  ? 'bg-[#938ab3] text-white shadow-xs'
                  : 'bg-[#ecdcc7]/60 hover:bg-[#ecdcc7] text-[#6d645b]'
              }`}
            >
              All Tech Stacks
            </button>

            {/* Dynamic frequencies matching homeaddedpapers bubble format */}
            {Object.entries(techStackCounts).length > 0 ? (
              Object.entries(techStackCounts).map(([stack, freq]) => {
                const isSelected = selectedTechStack === stack;
                return (
                  <button
                    key={stack}
                    id={`filter-chip-${stack}`}
                    onClick={() => setSelectedTechStack(isSelected ? null : stack)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all ${
                      isSelected
                        ? 'bg-stone-850 text-white shadow-xs'
                        : 'bg-[#eedfcb]/75 hover:bg-[#ecdcc7] text-[#5c5248]'
                    }`}
                  >
                    <span>{stack}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/30 text-white' : 'bg-stone-200/60 text-[#3e3833]'
                      }`}
                    >
                      {freq}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-[11px] italic text-[#9a8d7e]">
                No system dependencies mapped in this tab.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
