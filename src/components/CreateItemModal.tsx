import React, { useState, useEffect } from 'react';
import { DomainItem } from '../types';
import { 
  X, Check, Loader2, FileText, UploadCloud, Link as LinkIcon, 
  Settings2, Sparkles, Plus, Image as ImageIcon, Headphones, FileCode 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainId: string;
  domainName: string;
  defaultType: 'item' | 'notebook' | 'canvas';
  onSave: (item: Omit<DomainItem, 'id' | 'domainId' | 'comments' | 'createdAt'>) => void;
}

export default function CreateItemModal({
  isOpen,
  onClose,
  domainId,
  domainName,
  defaultType,
  onSave,
}: CreateItemModalProps) {
  const [inputText, setInputText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [aiSeed, setAiSeed] = useState('');
  const [selectedType] = useState<'item' | 'notebook' | 'canvas'>('item');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; size: string; base64?: string; mimeType?: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Tech stack pills with distinct pastel configurations
  const [availableTags, setAvailableTags] = useState<{ name: string; bg: string; text: string; active: boolean }[]>([
    { name: 'FastAPI', bg: 'bg-[#d2f0f7]', text: 'text-[#143d47]', active: false },
    { name: 'Gemini Pro', bg: 'bg-[#e4ddf8]', text: 'text-[#2a224d]', active: false },
    { name: 'ReactJS', bg: 'bg-[#fae2da]', text: 'text-[#482215]', active: false },
    { name: 'Docker', bg: 'bg-[#e1f2dc]', text: 'text-[#1c3817]', active: false },
    { name: 'Tailwind CSS', bg: 'bg-[#dbeef5]', text: 'text-[#1c4852]', active: false },
    { name: 'PostgreSQL', bg: 'bg-[#e3ecf5]', text: 'text-[#1e3250]', active: false },
  ]);

  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Pipeline loading screen
  const [submittingStep, setSubmittingStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setCustomTitle('');
      setAiSeed('');
      setUploadedFiles([]);
      setSubmittingStep(0);
      setIsSubmitting(false);
      setAvailableTags(prev => prev.map(t => ({ ...t, active: false })));
    }
  }, [isOpen, defaultType]);

  // Handle word recognition to auto-enable tags
  useEffect(() => {
    const textLower = inputText.toLowerCase();
    setAvailableTags((prev) =>
      prev.map((tag) => {
        const keyword = tag.name.toLowerCase();
        if (textLower.includes(keyword)) {
          return { ...tag, active: true };
        }
        return tag;
      })
    );
  }, [inputText]);

  const toggleTagActive = (index: number) => {
    setAvailableTags((prev) =>
      prev.map((t, i) => (i === index ? { ...t, active: !t.active } : t))
    );
  };

  const handleAddNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      // Avoid duplicate tags
      if (availableTags.some(t => t.name.toLowerCase() === newTagInput.trim().toLowerCase())) {
        setNewTagInput('');
        setIsAddingTag(false);
        return;
      }

      // Generate distinct color class
      const pastelOptions = [
        { bg: 'bg-[#e1f2dc]', text: 'text-[#1c3817]' },
        { bg: 'bg-[#d2f0f7]', text: 'text-[#143d47]' },
        { bg: 'bg-[#e4ddf8]', text: 'text-[#2a224d]' },
        { bg: 'bg-[#fae2da]', text: 'text-[#482215]' },
        { bg: 'bg-[#e3ecf5]', text: 'text-[#1e3250]' },
      ];
      const randomPastel = pastelOptions[Math.floor(Math.random() * pastelOptions.length)];

      setAvailableTags((prev) => [
        ...prev,
        {
          name: newTagInput.trim(),
          ...randomPastel,
          active: true,
        },
      ]);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (files: File[]) => {
    const formatted = files.map((f) => ({
      name: f.name,
      type: f.name.split('.').pop() || 'unknown',
      size: (f.size / 1024).toFixed(1) + ' KB',
    }));
    setUploadedFiles((prev) => [...prev, ...formatted]);

    // Read text files or images to ingest actual blueprint contents and visual data
    files.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && ['md', 'txt', 'json', 'js', 'ts', 'py', 'yml', 'yaml', 'css', 'html'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            setInputText((prev) => {
              const divider = prev ? '\n\n' : '';
              return `${prev}${divider}[Imported File Content: ${file.name}]\n${text.slice(0, 8000)}`;
            });
          }
        };
        reader.readAsText(file);
      } else if (ext && ['png', 'jpg', 'jpeg'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            const rawBase64 = dataUrl.split(',')[1];
            // Instantly sync upload to static assets system
            fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: file.name, base64: rawBase64 })
            })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
              if (json && json.success) {
                setUploadedFiles((prev) =>
                  prev.map((uf) =>
                    uf.name === file.name ? { ...uf, url: json.url, mimeType: file.type } : uf
                  )
                );
              } else {
                setUploadedFiles((prev) =>
                  prev.map((uf) =>
                    uf.name === file.name ? { ...uf, base64: rawBase64, mimeType: file.type } : uf
                  )
                );
              }
            })
            .catch(() => {
              setUploadedFiles((prev) =>
                prev.map((uf) =>
                  uf.name === file.name ? { ...uf, base64: rawBase64, mimeType: file.type } : uf
                )
              );
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files);
      processFiles(filesArr as File[]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      processFiles(filesArr as File[]);
    }
  };

  const selectFileTypeSimulate = (extension: string) => {
    const mockFiles: Record<string, { name: string; type: string; size: string }[]> = {
      pdf: [{ name: 'distributed_consensus_guide.pdf', type: 'pdf', size: '1.4 MB' }],
      md: [{ name: 'production_deployment_specs.md', type: 'md', size: '12.4 KB' }],
      txt: [{ name: 'architectural_constraints.txt', type: 'txt', size: '4.1 KB' }],
      png: [{ name: 'system_flow_canvas.png', type: 'png', size: '342.2 KB' }],
      jpeg: [{ name: 'whiteboard_ideation.jpeg', type: 'jpeg', size: '511.9 KB' }],
      mp3: [{ name: 'ambient_telemetry_voiceNote.mp3', type: 'mp3', size: '2.1 MB' }],
      m4a: [{ name: 'system_review_meeting_audio.m4a', type: 'm4a', size: '5.8 MB' }],
    };

    const eligible = mockFiles[extension] || mockFiles.pdf;
    setUploadedFiles((prev) => [...prev, eligible[0]]);
  };

  const handleIngestSubmit = () => {
    if (!inputText.trim() && uploadedFiles.length === 0) {
      alert('Please provide some raw thoughts, web hooks, or drop an inspiration file first.');
      return;
    }

    setIsSubmitting(true);
    setSubmittingStep(1);

    // Filter to collect only present base64 / URL images
    const imagePayloads = uploadedFiles
      .filter(uf => uf.url || uf.base64)
      .map(uf => ({
        url: uf.url,
        data: uf.base64,
        mimeType: uf.mimeType || 'image/png'
      }));

    const activeTagsList = availableTags.filter((t) => t.active).map((t) => t.name);
    const sourceContent = inputText || (uploadedFiles.length > 0 ? `Captured File Attachment: ${uploadedFiles[0].name}` : '');
    const implementationNotes = aiSeed || '';

    // Step indicators
    const step1 = setTimeout(() => setSubmittingStep(2), 1200);
    const step2 = setTimeout(() => setSubmittingStep(3), 2400);

    // Call unified synchronous multimodal ingestion endpoint
    fetch('/api/ideas/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceinput: sourceContent,
        implementationnotes: implementationNotes,
        domainId: domainId,
        domainName: domainName,
        images: imagePayloads,
        type: defaultType
      })
    })
    .then(async (res) => {
      clearTimeout(step1);
      clearTimeout(step2);

      if (res.ok) {
        setSubmittingStep(4);
        const data = await res.json();
        if (data && data.success && data.item) {
          // Fire onSave with the completed fully ingested element
          onSave(data.item);
          setTimeout(() => {
            setIsSubmitting(false);
            onClose();
          }, 800);
        } else {
          throw new Error("Malformatted response from blueprint engine");
        }
      } else {
        const errText = await res.text();
        throw new Error(errText || "Ingestion service failure");
      }
    })
    .catch(err => {
      console.error("Multimodal Ingestion Pipeline failed:", err);
      alert(`Multimodal Ingest failed: ${err.message || err}`);
      setIsSubmitting(false);
    });
  };

  const getFileIcon = (type: string) => {
    const ext = type.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    if (['md', 'txt'].includes(ext)) return <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />;
    if (['png', 'jpg', 'jpeg'].includes(ext)) return <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />;
    if (['mp3', 'm4a'].includes(ext)) return <Headphones className="w-4 h-4 text-indigo-500 shrink-0" />;
    return <FileText className="w-4 h-4 text-stone-500 shrink-0" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1c1a17]/80 backdrop-blur-xs"
          ></motion.div>

          {/* Expanded Modal Content Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="relative w-full max-w-xl bg-[#efece6] border border-[#d2c5b4] shadow-2xl rounded-3xl p-6 md:p-8 overflow-y-auto max-h-[92vh] z-10 flex flex-col justify-between"
          >
            {/* Header section */}
            <div className="flex items-start justify-between mb-5 shrink-0 border-b border-stone-300/40 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#2a2621]">
                  Quick Ingest into {domainName}
                </h3>
                <div className="text-[11.5px] text-[#786e64] mt-1.5 leading-relaxed pr-8">
                  Rapid-capture system components. Fill in the details to generate an ideation document:
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#e6e1d9] border border-[#cfc4b6] flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-[#dcd6ca] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ingestion Loading Pipeline */}
            <AnimatePresence>
              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#efece6]/95 z-50 flex flex-col items-center justify-center p-8 text-center rounded-3xl"
                >
                  <div className="bg-[#ede8df] border border-[#d2c5b4] p-6 rounded-2xl max-w-sm space-y-4 shadow-sm w-full">
                    <Loader2 className="w-8 h-8 text-[#38a169] animate-spin mx-auto" />
                    <h4 className="font-serif font-bold text-stone-800 text-sm">Synthesizing Blueprint Pipeline</h4>
                    <div className="space-y-2 text-left pt-2 font-mono text-[11px] text-stone-600">
                      <div className="flex items-center gap-2">
                        {submittingStep >= 1 ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0"></span>}
                        <span className={submittingStep === 1 ? 'font-bold text-[#2a2621]' : ''}>1. Resolving input stream / buffers...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {submittingStep >= 2 ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0"></span>}
                        <span className={submittingStep === 2 ? 'font-bold text-[#2a2621]' : ''}>2. Transcription & layout decoding...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {submittingStep >= 3 ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0"></span>}
                        <span className={submittingStep === 3 ? 'font-bold text-[#2a2621]' : ''}>3. Processing tech dependency map...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {submittingStep >= 4 ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0"></span>}
                        <span className={submittingStep === 4 ? 'font-bold text-[#2a2621]' : ''}>4. Cataloging blueprint card details...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Core Form Body */}
            <div className="space-y-5 flex-1 pr-1">
              
              {/* Optional Custom Name / Title Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#786e64] uppercase tracking-wider">
                  Descriptive Title (Optional — bypasses auto-generated "Ingested Asset" names)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Type custom name... (Leave empty to let the AI auto-generate it)"
                  className="w-full bg-[#ede8df] border border-[#cfc4b6] rounded-xl px-4 py-2.5 text-xs text-[#2a2621] placeholder-[#9c9185] focus:outline-none focus:ring-1 focus:ring-[#9c8eb9] focus:bg-white transition-all font-bold"
                />
              </div>

              {/* Requirement 1: Optimized Input Textarea for fast typing */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#786e64] uppercase tracking-wider">
                  The Ingestion Input (Thoughts / Links / Hooks)
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste an inspiration hook, paste a social link (Instagram, Twitter, GitHub), or type your raw, unprocessed thoughts here..."
                  className="w-full h-24 bg-[#ede8df] border border-[#cfc4b6] rounded-2xl p-4 text-xs text-[#2a2621] placeholder-[#9c9185] focus:outline-none focus:ring-1 focus:ring-[#9c8eb9] focus:bg-white transition-all resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Requirement 3: Contextual Tech Stacks layout with direct micro pills and + addition */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-bold text-[#786e64] uppercase tracking-wider">
                    Associate Tech Stacks
                  </span>
                  
                  {/* Inline interactive + button */}
                  {!isAddingTag ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(true)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[#8a7f73] hover:text-stone-800 transition"
                    >
                      <Plus className="w-3 h-3" /> Add stack
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5 items-center bg-[#ede8df]/40 p-2.5 rounded-2xl border border-[#cfc4b6]/40">
                  {availableTags.map((tag, idx) => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => toggleTagActive(idx)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150 flex items-center gap-1 ${
                        tag.active
                          ? `${tag.bg} ${tag.text} border-stone-800/35 scale-102 font-extrabold shadow-3xs`
                          : 'bg-white/40 border-stone-400/20 text-stone-500 hover:bg-white/80'
                      }`}
                    >
                      <span>{tag.name}</span>
                      {tag.active && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                    </button>
                  ))}

                  {/* Inline adding input form */}
                  {isAddingTag && (
                    <form onSubmit={handleAddNewTag} className="flex items-center gap-1 animate-fadeIn">
                      <input
                        autoFocus
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Tag name..."
                        className="bg-white border border-[#cfc4b6] px-2 py-0.5 rounded-lg text-[10px] focus:outline-none w-20 text-[#2a2621]"
                        onBlur={() => {
                          if (!newTagInput.trim()) setIsAddingTag(false);
                        }}
                      />
                      <button type="submit" className="text-emerald-700 font-bold text-[11px] p-0.5 hover:scale-110">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setIsAddingTag(false)} className="text-stone-400 text-[11px] p-0.5 hover:scale-110">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Requirement 2: Redesigned Drop Zone showing support for diverse file types */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-[#786e64] uppercase tracking-wider">
                  Visual context & Media drop
                </span>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  className={`border-2 border-dashed cursor-pointer hover:border-stone-850/60 transition-colors relative ${
                    dragActive ? 'border-stone-800 bg-[#e6e1da]' : 'border-[#cfc4b6] bg-[#eae4d9]/25'
                  } rounded-2xl p-5 text-center flex flex-col items-center justify-center`}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-5 h-5 text-[#867c71] mb-1.5" />
                  <p className="text-stone-800 font-serif text-sm font-bold leading-none">
                    Drop files here or click to browse standard files
                  </p>
                  
                  {/* Fine-grain helper illustrating diverse supportive extension frames */}
                  <p className="text-[9.5px] text-[#867c71] mt-1.5 mb-3 leading-relaxed max-w-sm">
                    Accepts text (<span className="font-mono text-[8px] bg-white/40 px-1 py-0.2 rounded font-bold">.md, .txt</span>), 
                    inspiration frames (<span className="font-mono text-[8px] bg-white/40 px-1 py-0.2 rounded font-bold">.png, .jpeg</span>), 
                    voice memos (<span className="font-mono text-[8px] bg-white/40 px-1 py-0.2 rounded font-bold">.mp3, .m4a</span>) or paper PDFs.
                  </p>

                  {/* Immediate file type buttons for simulation */}
                  <div className="flex gap-1.5 flex-wrap justify-center mb-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectFileTypeSimulate('pdf');
                      }}
                      className="px-2 py-1 bg-[#eae4d9] hover:bg-[#ded5c6] text-[8.5px] font-bold text-[#5c534a] rounded active:scale-95 transition-transform"
                    >
                      + Simulate PDF
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectFileTypeSimulate('md');
                      }}
                      className="px-2 py-1 bg-[#eae4d9] hover:bg-[#ded5c6] text-[8.5px] font-bold text-[#3e5f35] rounded active:scale-95 transition-transform"
                    >
                      + Simulate .MD Draft
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectFileTypeSimulate('png');
                      }}
                      className="px-2 py-1 bg-[#eae4d9] hover:bg-[#ded5c6] text-[8.5px] font-bold text-[#2e4c63] rounded active:scale-95 transition-transform"
                    >
                      + Simulate .PNG Image
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectFileTypeSimulate('mp3');
                      }}
                      className="px-2 py-1 bg-[#eae4d9] hover:bg-[#ded5c6] text-[8.5px] font-bold text-[#44386e] rounded active:scale-95 transition-transform"
                    >
                      + Simulate voice .MP3
                    </button>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 w-full flex flex-col gap-1 px-4" onClick={(e) => e.stopPropagation()}>
                      {uploadedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[10px] font-mono font-bold px-3 py-1.5 bg-stone-900/10 text-stone-800 rounded-lg border border-stone-800/10"
                        >
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-[200px]">{file.name}</span>
                            <span className="text-[8px] text-stone-500">({file.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-stone-500 hover:text-red-700 text-xs font-bold font-sans"
                            title="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement 4: AI Seed Box beautifully styled at base */}
              <div className="space-y-1 rounded-2xl bg-purple-950/5 border border-purple-950/10 p-3.5">
                <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#74608c] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-purple-700" />
                  <span>Immediate Implementation Notes: (Optional AI seed)</span>
                </label>
                <textarea
                  value={aiSeed}
                  onChange={(e) => setAiSeed(e.target.value)}
                  placeholder="Insert design constraints, rate-limit settings, security requirements, or backend rules..."
                  className="w-full h-14 bg-white/70 border border-[#cfc4b6] focus:border-purple-600 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none resize-none focus:bg-white transition-all font-mono text-[10.5px]"
                />
              </div>

            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-[#d2c5b4]/40 mt-5 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-[#e6e1d9] text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIngestSubmit}
                className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-2xs hover:shadow-xs cursor-pointer"
              >
                Create Idea
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
