import React, { useState, useEffect } from 'react';
import { Domain, DomainItem, Comment, COLOR_MAP } from './types';
import { INITIAL_DOMAINS, INITIAL_ITEMS } from './data';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ZeroState from './components/ZeroState';
import MasonryGrid from './components/MasonryGrid';
import CreateItemModal from './components/CreateItemModal';
import SettingsModal from './components/SettingsModal';
import IdeationDocView from './components/IdeationDocView';
import MultiMediaCanvas from './components/MultiMediaCanvas';
import { Search, Plus, Grid, LayoutGrid, RotateCcw, HelpCircle, Layers, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function App() {
  // 1. Core State
  const [domains, setDomains] = useState<Domain[]>([]);
  const [items, setItems] = useState<DomainItem[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string>('55d810f2-5174-4770-ae38-ca4badd69c3f');
  const [selectedTypeTab, setSelectedTypeTab] = useState<'item' | 'notebook' | 'canvas'>('item');
  const [selectedTechStack, setSelectedTechStack] = useState<string | null>(null);

  // UI state
  const [selectedItem, setSelectedItem] = useState<DomainItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  // 2. Load from backend database or fall back to localStorage/defaults
  const loadIdeasAndCategories = async () => {
    try {
      const resCategories = await fetch('/api/categories');
      let dbCategories: Domain[] = [];
      if (resCategories.ok) {
        const rawCats = await resCategories.json();
        dbCategories = rawCats.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          iconColor: c.iconColor || c.icon_color || '#938ab3'
        }));
      }

      const resIdeas = await fetch('/api/ideas');
      if (resIdeas.ok) {
        const dbItems: DomainItem[] = await resIdeas.json();
        if (dbItems && dbItems.length >= 0) {
          setItems(dbItems);
          
          if (dbCategories.length > 0) {
            setDomains(dbCategories);
            if (!dbCategories.some(d => d.id === activeDomainId)) {
              setActiveDomainId(dbCategories[0].id);
            }
          } else {
            setDomains(prevDomains => {
              const updatedDomains = prevDomains.length > 0 ? [...prevDomains] : [...INITIAL_DOMAINS];
              dbItems.forEach(item => {
                const hasDomain = updatedDomains.some(d => d.id === item.domainId);
                if (!hasDomain && item.domainTag) {
                  updatedDomains.push({
                    id: item.domainId,
                    name: item.domainTag,
                    description: `AI-Ingested Category: ${item.domainTag}`,
                    iconColor: '#938ab3'
                  });
                }
              });
              return updatedDomains;
            });
          }
          return;
        }
      }
    } catch (e) {
      console.warn("Express backend is unavailable or not loaded yet. Reverting to local cache mode.", e);
    }

    // Fallback load
    const savedDomains = localStorage.getItem('s_domains');
    const savedItems = localStorage.getItem('s_items');

    if (savedDomains && savedItems) {
      try {
        setDomains(JSON.parse(savedDomains));
        setItems(JSON.parse(savedItems));
      } catch (e) {
        setDomains(INITIAL_DOMAINS);
        setItems(INITIAL_ITEMS);
      }
    } else {
      setDomains(INITIAL_DOMAINS);
      setItems(INITIAL_ITEMS);
    }
  };

  useEffect(() => {
    loadIdeasAndCategories();

    // Setup polling routine to pick up asynchronously processed ideas automatically when ready
    const timer = setInterval(() => {
      Promise.all([
        fetch('/api/categories').then(r => r.ok ? r.json() : null),
        fetch('/api/ideas').then(r => r.ok ? r.json() : null)
      ]).then(([rawCats, dbItems]) => {
        if (rawCats) {
          const dbCategories = rawCats.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            iconColor: c.iconColor || c.icon_color || '#938ab3'
          }));
          setDomains(dbCategories);
        }
        if (dbItems) {
          setItems(dbItems);
          setSelectedItem((current) => {
            if (!current) return null;
            const updated = dbItems.find((itm: any) => itm.id === current.id);
            return updated || current;
          });
        }
      }).catch(err => console.debug("Sync state passive", err));
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Save to localStorage (fallback option)
  const saveState = (updatedDomains: Domain[], updatedItems: DomainItem[]) => {
    localStorage.setItem('s_domains', JSON.stringify(updatedDomains));
    localStorage.setItem('s_items', JSON.stringify(updatedItems));
  };

  // 3. Domain Action Helpers
  const handleAddDomain = (name: string) => {
    const colors = ['#938ab3', '#6293a3', '#ae8ca2', '#a2938a', '#8ca7a2', '#a78c8c'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newId = generateUUID();

    const newDomain: Domain = {
      id: newId,
      name,
      description: `Collection of code archetypes for ${name}. Click to edit description.`,
      iconColor: randomColor,
    };

    const newDomainsList = [...domains, newDomain];
    setDomains(newDomainsList);
    saveState(newDomainsList, items);
    setActiveDomainId(newId);

    // Save to the dynamic database categories table
    fetch('/api/categories', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newId,
        name,
        description: newDomain.description,
        iconColor: randomColor
      })
    })
    .catch(err => console.error("Error creating category:", err));
  };

  const handleUpdateDomain = (domainId: string, updatedName: string, updatedDesc: string) => {
    const newDomainsList = domains.map((d) =>
      d.id === domainId ? { ...d, name: updatedName, description: updatedDesc } : d
    );
    setDomains(newDomainsList);
    saveState(newDomainsList, items);

    // Sync metadata updates in active category dynamically
    fetch(`/api/categories/${domainId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: updatedName,
        description: updatedDesc
      })
    })
    .catch(err => console.error("Error updating category:", err));
  };

  const handleDeleteDomain = () => {
    const domainToDelete = domains.find((d) => d.id === activeDomainId);
    if (!domainToDelete) return;

    const remainingDomains = domains.filter((d) => d.id !== activeDomainId);
    const remainingItems = items.filter((item) => item.domainId !== activeDomainId);

    setDomains(remainingDomains);
    setItems(remainingItems);
    saveState(remainingDomains, remainingItems);

    // Delete category and execute cascade deletion of items in this category
    fetch(`/api/categories/${activeDomainId}`, {
      method: "DELETE"
    })
    .catch(err => console.error("Error deleting category:", err));

    // Set fallback active domain
    if (remainingDomains.length > 0) {
      setActiveDomainId(remainingDomains[0].id);
    } else {
      // Create emergency fallback if they deleted all domains
      const emergencyDomain: Domain = {
        id: '55d810f2-5174-4770-ae38-ca4badd69c3f',
        name: 'Computer Science',
        description: 'Core architectures, modular analysis, and harmless LLM frameworks.',
        iconColor: '#938ab3',
      };
      setDomains([emergencyDomain]);
      setActiveDomainId('55d810f2-5174-4770-ae38-ca4badd69c3f');
      saveState([emergencyDomain], []);
    }
  };

  // 4. Create Card Item helpers
  const handleInstantCreateCanvas = () => {
    const pastelColors: ('lilac' | 'sky' | 'mint' | 'peach')[] = ['lilac', 'sky', 'mint', 'peach'];
    const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
    
    const newCanvasItem: DomainItem = {
      id: generateUUID(),
      domainId: activeDomainId,
      title: 'New canvas',
      description: 'An empty spatial research workspace canvas. Reposition and resize nodes of any type below.',
      domainTag: currentDomain.name,
      feasibility: 'Micro-MVP',
      status: 'Raw',
      techStacks: [],
      year: '2026',
      type: 'canvas',
      color: randomColor,
      canvasNodes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    const newItemsList = [newCanvasItem, ...items];
    setItems(newItemsList);
    saveState(domains, newItemsList);
    setSelectedItem(newCanvasItem); // Instantly open the canvas workspace for editing and node dropping!

    // Sync to backend persistent store
    fetch('/api/ideas', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCanvasItem)
    })
    .then(r => r.json())
    .then(res => console.log("Persistent canvas created successfully.", res))
    .catch(err => console.error("Error creating canvas online:", err));
  };

   const handleCreateItem = (
    itemData: any
  ) => {
    let newItem: DomainItem;
    const isAlreadyPersisted = !!(itemData && itemData.id);

    if (isAlreadyPersisted) {
      newItem = itemData as DomainItem;
    } else {
      newItem = {
        ...itemData,
        id: generateUUID(),
        domainId: activeDomainId,
        comments: [],
        createdAt: new Date().toISOString(),
      };
    }

    const newItemsList = [newItem, ...items];
    setItems(newItemsList);
    saveState(domains, newItemsList);

    if (!isAlreadyPersisted) {
      // Sync to backend persistent store only if not already saved!
      fetch('/api/ideas', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      })
      .then(r => r.json())
      .then(res => console.log("Persistent manually created item created successfully.", res))
      .catch(err => console.error("Error creating item online:", err));
    }
  };

  // 4b. Delete Card Item helper
  const handleDeleteItem = (itemId: string) => {
    const remainingItems = items.filter((item) => item.id !== itemId);
    setItems(remainingItems);
    saveState(domains, remainingItems);

    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }

    // Sync deletion to backend persistent store
    fetch(`/api/ideas/${itemId}`, {
      method: "DELETE"
    })
    .then(res => {
      if (res.ok) console.log("Persistent item deleted successfully.");
    })
    .catch(err => console.error("Error deleting item from database:", err));
  };

  // 5. Add Live Comment / Annotation
  const handleAddComment = (itemId: string, text: string, author: string) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        const newComment: Comment = {
          id: `comment-${Date.now()}`,
          author,
          text,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        };
        return {
          ...item,
          comments: [...item.comments, newComment],
        };
      }
      return item;
    });

    setItems(updatedItems);
    saveState(domains, updatedItems);
  };

  // Change active category/domain color randomly and save
  const handleChangeActiveCategoryColor = () => {
    const vibrantPastels = [
      '#938ab3', // Lilac Orchid
      '#6293a3', // Turquoise Wind
      '#ae8ca2', // Vintage Pink
      '#a2938a', // Driftwood
      '#8ca7a2', // Soft Sage
      '#a78c8c', // Muted Blush
      '#b29f7e', // Golden Sand
      '#7ca586', // Clover Green
      '#5b8296', // Ocean Slate
      '#9e6e5a', // Earthy Terracotta
      '#865b82', // Berry Silk
    ];
    const currentColor = currentDomain.iconColor;
    const availableColors = vibrantPastels.filter((c) => c !== currentColor);
    const randomColor =
      availableColors[Math.floor(Math.random() * availableColors.length)] ||
      vibrantPastels[0];

    const updatedDomains = domains.map((d) =>
      d.id === activeDomainId ? { ...d, iconColor: randomColor } : d
    );
    setDomains(updatedDomains);
    saveState(updatedDomains, items);
  };

  // Hard Reset to Default state
  const handleResetState = () => {
    setDomains(INITIAL_DOMAINS);
    setItems(INITIAL_ITEMS);
    setActiveDomainId('computer-science');
    setSelectedTypeTab('item');
    setSelectedTechStack(null);
    localStorage.removeItem('s_domains');
    localStorage.removeItem('s_items');
  };

  // 6. Filtering & Processing Items
  const currentDomain = domains.find((d) => d.id === activeDomainId) || {
    id: activeDomainId,
    name: activeDomainId,
    description: 'This category is empty start by importing a item.',
    iconColor: '#9c8eb9',
  };

  // Filter items in active domain, tab (items vs notebook vs canvas), tech stack chip selection, and searchQuery
  const domainSpecificItems = items.filter((item) => item.domainId === activeDomainId);

  const tabFilteredItems = domainSpecificItems.filter((item) => item.type === selectedTypeTab);

  const stackFilteredItems = selectedTechStack
    ? tabFilteredItems.filter((item) => item.techStacks?.includes(selectedTechStack))
    : tabFilteredItems;

  const finalFilteredItems = searchQuery.trim()
    ? stackFilteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stackFilteredItems;

  const hasItemsInActiveTab = tabFilteredItems.length > 0;

  return (
    <div className="min-h-screen bg-[#faf7f4] font-sans antialiased flex p-4 md:p-6 text-stone-800 tracking-normal selection:bg-[#dfd7cc]">
      {/* Absolute high contrast tactile frame styling */}
      <div className="w-full max-w-7xl mx-auto flex bg-[#ede7df] rounded-3xl overflow-hidden shadow-xs border border-[#cfc4b6] min-h-[90vh]">
        
        {/* Left Library Sidebar */}
        <Sidebar
          domains={domains}
          activeDomainId={activeDomainId}
          setActiveDomainId={(id) => {
            setActiveDomainId(id);
            setSelectedTypeTab('item');
            setSelectedTechStack(null);
          }}
          items={items}
          onAddDomain={handleAddDomain}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Interface Window with subtle color gradient from top to down based on active category */}
        <main
          style={{
            background: `linear-gradient(180deg, #fcfaf7 72%, ${currentDomain.iconColor}24 100%)`,
          }}
          className="flex-1 flex flex-col rounded-3xl m-2.5 shadow-inner border border-[#ded5c9] overflow-hidden"
        >
          
          {/* Top Actions Bar (Buttons matching top right of homeaddedpapers.png exactly) */}
          <div className="flex items-center justify-between px-8 pt-6 pb-2 shrink-0">
            {/* Left label locator path */}
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8ca19c] uppercase tracking-wider select-none">
              <span>My Library</span>
              <span className="text-stone-300">/</span>
              {/* Colored Dot representation inside path: customizable via click */}
              <span
                className="w-4.5 h-4.5 rounded-full cursor-pointer hover:scale-115 active:scale-95 transition-all shadow-inner ring-2 ring-white/50 shrink-0"
                style={{ backgroundColor: currentDomain.iconColor }}
                onClick={handleChangeActiveCategoryColor}
                title="Click to randomly cycle category color hue"
              ></span>
              <span className="text-[#645e56]">{currentDomain.name}</span>
            </div>

            {/* Top Right Action Button Circle Row */}
            <div className="flex items-center gap-2.5">
              {/* Search Toggle */}
              <button
                id="btn-toggle-search"
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className={`p-2 rounded-full border transition-all ${
                  isSearchVisible
                    ? 'bg-[#eae3db] border-[#cfc4b6] text-[#3a3530]'
                    : 'bg-[#faf6f0] border-[#e2d6c6] text-[#7e746a] hover:bg-[#eae3db]'
                }`}
                title="Search Blueprints"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Add New Item Button */}
              <button
                id="btn-header-add-item"
                onClick={() => setIsCreateModalOpen(true)}
                className="p-2 rounded-full bg-[#938ab3] hover:bg-[#80769d] border border-[#7c729e] text-white shadow-xs transition-colors"
                title="Add New Archetype"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* View Layout Toggle button */}
              <button
                id="btn-layout-toggle"
                onClick={() => setIsGridView(!isGridView)}
                className={`p-2 rounded-full border transition-all ${
                  !isGridView
                    ? 'bg-[#eae3db] border-[#cfc4b6] text-[#3a3530]'
                    : 'bg-[#faf6f0] border-[#e2d6c6] text-[#7e746a] hover:bg-[#eae3db]'
                }`}
                title="Toggle Grid Alignment"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Search Row */}
          <AnimatePresence>
            {isSearchVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-8 overflow-hidden bg-[#eadecc]/25 border-b border-stone-200/40"
              >
                <div className="py-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter current view by titles or notes content..."
                    className="w-full text-xs bg-white border border-[#cfc0ae] px-4 py-2 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#9c8eb9]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main workspace scrolling sub-panel wrapping layouts */}
          <div className="flex-1 overflow-y-auto px-8 py-5 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header Controller */}
              <Header
                activeDomain={currentDomain}
                items={domainSpecificItems}
                selectedTypeTab={selectedTypeTab}
                setSelectedTypeTab={(tab) => {
                  setSelectedTypeTab(tab);
                  setSelectedTechStack(null);
                }}
                selectedTechStack={selectedTechStack}
                setSelectedTechStack={setSelectedTechStack}
                onUpdateDomain={handleUpdateDomain}
                onPlanCanvas={() => setIsCreateModalOpen(true)}
              />

              {/* State Transition Area */}
              <div>
                {hasItemsInActiveTab ? (
                  /* Active state masonry cards grid */
                  <div className="mt-2 space-y-4">
                    {/* Header Item Count Row */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#cdc5b8]/30 mt-2">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-[#3e3833] font-bold text-sm capitalize">
                          {selectedTypeTab === 'canvas' ? 'Canvases' : selectedTypeTab === 'notebook' ? 'Notebooks' : 'Items'} ({tabFilteredItems.length})
                        </span>
                        
                        <button
                          onClick={() => {
                            if (selectedTypeTab === 'canvas') {
                              handleInstantCreateCanvas();
                            } else if (selectedTypeTab === 'notebook') {
                              alert('Notebooks are planned for a later stage. Refer to our specs roadmap in the category zero-state!');
                            } else {
                              setIsCreateModalOpen(true);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#fbf9f6] hover:bg-white text-stone-700 text-[11px] font-bold rounded-full border border-stone-300 shadow-3xs cursor-pointer transition-colors"
                        >
                          <span className="text-[#a19688] font-bold text-sm leading-none">+</span> Create
                        </button>
                      </div>
                      
                      {/* Sub Order toggle button as shown in screenshot */}
                      <button
                        onClick={() => {
                          // Quick toggle reverse-sort
                          setItems([...items].reverse());
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#eae2da] hover:bg-[#e4d6c4] border border-[#d6c5b2] text-[10px] font-bold text-[#564e43] rounded-full transition-transform cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3 text-[#9c8eb9]" />
                        <span>Recently added</span>
                      </button>
                    </div>

                    {finalFilteredItems.length > 0 ? (
                      <div className={isGridView ? '' : 'max-w-2xl mx-auto'}>
                        <MasonryGrid
                          items={finalFilteredItems}
                          domainName={currentDomain.name}
                          onSelectItem={(itm) => setSelectedItem(itm)}
                          onDeleteItem={handleDeleteItem}
                        />
                      </div>
                    ) : (
                      <div className="py-12 text-center text-stone-400 text-xs italic">
                        No items matching active search or tech filter criteria.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Zero State Spine */
                  <ZeroState
                    activeDomain={currentDomain}
                    selectedTypeTab={selectedTypeTab}
                    onPlanCanvas={() => {
                      setSelectedTypeTab('canvas');
                      handleInstantCreateCanvas();
                    }}
                    onCaptureThought={() => {
                      setSelectedTypeTab('item');
                      setIsCreateModalOpen(true);
                    }}
                    onDeleteDomain={handleDeleteDomain}
                    onChangeColor={handleChangeActiveCategoryColor}
                    onUpdateDomainName={(newName) => {
                      handleUpdateDomain(currentDomain.id, newName, currentDomain.description || '');
                    }}
                  />
                )}
              </div>

            </div>

            {/* Bottom Section Footer */}
            <div className="pt-12 text-[10px] text-[#b3a89a] font-mono text-center flex items-center justify-between select-none">
              <span>System architecture canvas • 2026 Edition</span>
              <span className="flex items-center gap-1 text-[#8c8276] cursor-pointer hover:text-stone-700" onClick={() => setIsSettingsOpen(true)}>
                <Layers className="w-3.5 h-3.5" /> Configure Library Data Engine
              </span>
            </div>

          </div>

        </main>
      </div>

      {/* Creation Slide Modal */}
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        domainId={activeDomainId}
        domainName={currentDomain.name}
        defaultType={selectedTypeTab}
        onSave={handleCreateItem}
      />

      {/* System Settings & Reset Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReset={handleResetState}
      />

      {/* Notion Ideation Document View Overlay */}
      {selectedItem && selectedItem.type !== 'canvas' && (
        <IdeationDocView
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          domainName={currentDomain.name}
          onUpdateItem={(updatedItem) => {
            const updatedItems = items.map((itm) => itm.id === updatedItem.id ? updatedItem : itm);
            setItems(updatedItems);
            setSelectedItem(updatedItem);
            saveState(domains, updatedItems);
            
            // Sync modification directly to modern full-stack backends
            fetch(`/api/ideas/${updatedItem.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedItem)
            })
            .then(res => {
              if (res.ok) console.log("Persistent state synced successfully.");
            })
            .catch(err => console.warn("Failed syncing update online", err));
          }}
        />
      )}

      {/* Multi-Media Reference Canvas Board */}
      {selectedItem && selectedItem.type === 'canvas' && (
        <MultiMediaCanvas
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          canvasItem={selectedItem}
          allLibraryItems={items}
          onUpdateCanvas={(updatedItem) => {
            const updatedItems = items.map((itm) => itm.id === updatedItem.id ? updatedItem : itm);
            setItems(updatedItems);
            setSelectedItem(updatedItem);
            saveState(domains, updatedItems);

            // Sync modification directly to modern full-stack backends
            fetch(`/api/ideas/${updatedItem.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedItem)
            })
            .then(res => {
              if (res.ok) console.log("Persistent state synced successfully.");
            })
            .catch(err => console.warn("Failed syncing update online", err));
          }}
          domainName={currentDomain.name}
        />
      )}
    </div>
  );
}
