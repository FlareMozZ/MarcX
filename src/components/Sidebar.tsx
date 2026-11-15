import React, { useState } from 'react';
import { Domain, DomainItem } from '../types';
import { Plus, Settings, FolderClosed, Trash2, Edit2, Check, X, Layers, Compass, Headphones, Sparkles, BookOpen } from 'lucide-react';

interface SidebarProps {
  domains: Domain[];
  activeDomainId: string;
  setActiveDomainId: (id: string) => void;
  items: DomainItem[];
  onAddDomain: (name: string) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  domains,
  activeDomainId,
  setActiveDomainId,
  items,
  onAddDomain,
  onOpenSettings,
}: SidebarProps) {

  const getItemCount = (domainId: string) => {
    return items.filter((item) => item.domainId === domainId).length;
  };

  const handleAddNewCategoryAuto = () => {
    let baseName = 'New category';
    let count = 0;
    let name = baseName;

    // Check existing names to guarantee unique and coherent sequential naming
    while (domains.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      count++;
      name = `${baseName} ${count}`;
    }

    onAddDomain(name);
  };

  return (
    <aside className="w-64 flex flex-col justify-between py-6 px-5 select-none text-[#564f48] shrink-0">
      <div className="flex flex-col gap-6">
        {/* Top Header Label */}
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="w-4 h-4 text-[#9c8eb9]" />
          <span className="font-serif font-semibold tracking-wide text-md text-[#3a3530]">
            System Library
          </span>
        </div>

        {/* Standard Library Menu */}
        <nav className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm hover:hover:bg-[#eadecc]/30 transition-colors text-left font-medium w-full cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            Recent
          </button>
          <button className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm hover:hover:bg-[#eadecc]/30 transition-colors text-left font-medium w-full cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            Reading list
          </button>
          <button className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm hover:hover:bg-[#eadecc]/30 transition-colors text-left font-medium w-full cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            Discover
          </button>
          <button className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm hover:hover:bg-[#eadecc]/30 transition-colors text-left font-medium w-full cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            Listen
          </button>
        </nav>

        {/* My Library Categories Section */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold tracking-wider text-[#938b80] uppercase px-2 py-1">
            My library
          </div>

          <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto pr-1">
            {domains.map((domain) => {
              const isActive = domain.id === activeDomainId;
              const count = getItemCount(domain.id);

              return (
                <button
                  key={domain.id}
                  id={`domain-tab-${domain.id}`}
                  onClick={() => setActiveDomainId(domain.id)}
                  className={`group flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#eae3db] text-[#3a3530] font-semibold shadow-xs'
                      : 'hover:bg-[#eedfcb]/50 text-[#6d645b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Circle Indicator matching native screenshots */}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: domain.iconColor }}
                    ></span>
                    <span className="truncate pr-1">{domain.name}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs tabular-nums text-[#9d9285] bg-stone-200/55 px-1.5 py-0.5 rounded-md font-medium">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Category Creation Pill - Click automatically creates and navigates */}
          <button
            id="btn-add-domain"
            onClick={handleAddNewCategoryAuto}
            className="group flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-[#8e8276] hover:text-[#5c5248] hover:bg-[#eadecc]/30 transition-colors w-full text-left mt-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#938b80] stroke-[2.5]" />
            New category +
          </button>
        </div>
      </div>

      {/* Settings Bottom section */}
      <div className="flex flex-col gap-2">
        <hr className="border-t border-[#e2d8cd] my-2" />
        <button
          id="btn-sidebar-settings"
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 px-2.5 py-2.5 text-[#7e7368] hover:text-[#3a3530] hover:bg-[#eadecc]/40 rounded-xl transition-all font-semibold text-sm text-left w-full cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#938b80] spin-slow" />
          Settings
        </button>
      </div>
    </aside>
  );
}
