import React from 'react';
import { X, RefreshCw, Layers, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export default function SettingsModal({ isOpen, onClose, onReset }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60"
          ></motion.div>

          {/* Modal box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 210 }}
            className="relative w-full max-w-md bg-[#fcfaf7] border border-[#d3c6b6] shadow-2xl rounded-3xl p-6 overflow-hidden z-10"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#9c8eb9]" />
                <h3 className="font-serif text-lg font-semibold text-[#3a3530]">
                  Workspace Settings
                </h3>
              </div>
              <button
                id="btn-close-settings"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-stone-200/50 text-[#8c8276] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-stone-700 text-xs leading-relaxed">
              <div className="bg-[#f0e8dd] p-4 rounded-2xl border border-[#dfd4c5] space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#3a3530] text-xs">
                  <Sparkles className="w-4 h-4 text-[#938ab3]" />
                  <span>Interactive Real-time Mock</span>
                </div>
                <p>
                  This application simulates the native library experience with smooth transitions between <strong>Zero-State Cold-Starts</strong> and <strong>Active Dashboard Grid Layouts</strong>.
                </p>
                <p>
                  Any domains you add, titles you edit inline, comments you append, or system archetypes you design are preserved dynamically in <strong>localStorage</strong>.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-[#8c8276] uppercase tracking-wider text-[10px]">
                  Database Maintenance
                </h4>
                <p className="text-stone-500">
                  If you wish to purge all custom localStorage configurations and restore the default state (with pre-populated computer science cards and sample code domains), click below:
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-white font-medium py-3 px-4 rounded-xl transition-all cursor-pointer shadow-xs text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restore Default System Archetypes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
