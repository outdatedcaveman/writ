import React, { useState } from "react";
import { ThemeCollection } from "../../types/workspace";
import { Plus, BookOpen, Compass, Sparkles, X, Check } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  themes: ThemeCollection[];
  onClose: () => void;
  onCreateProject: (params: {
    title: string;
    logline: string;
    genre: string;
    themeId: string;
    intent: string;
    firstChapterTitle: string;
  }) => void;
}

const GENRE_OPTIONS = [
  { id: "essay", label: "Philosophical Essay", icon: "🖋️", desc: "Dialectic thesis & deep inquiry" },
  { id: "fiction", label: "Literary Fiction", icon: "📖", desc: "Character drama & narrative arcs" },
  { id: "scifi", label: "Speculative / Sci-Fi", icon: "🚀", desc: "Worldbuilding & structural tension" },
  { id: "screenplay", label: "Dramatic Screenplay", icon: "🎬", desc: "Visual storytelling in three acts" },
  { id: "technical", label: "Technical Treatise", icon: "📐", desc: "Rigorous exposition & formal clarity" },
  { id: "memoir", label: "Memoir & Chronicle", icon: "🕯️", desc: "Personal testimony & reflective prose" }
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  themes,
  onClose,
  onCreateProject
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [genre, setGenre] = useState("essay");
  const [themeId, setThemeId] = useState(themes[0]?.id || "");
  const [intent, setIntent] = useState("");
  const [firstChapterTitle, setFirstChapterTitle] = useState("Opening Inquest");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateProject({
      title: title.trim(),
      logline: logline.trim() || "A new creative inquiry.",
      genre,
      themeId: themeId || themes[0]?.id || "theme-default",
      intent: intent.trim() || "Explore and articulate a compelling thesis.",
      firstChapterTitle: firstChapterTitle.trim() || "Opening Inquest"
    });

    setTitle("");
    setLogline("");
    setGenre("essay");
    setIntent("");
    setFirstChapterTitle("Opening Inquest");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#101012] border border-[#27272A] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#202024] flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C8A051]/15 text-[#C8A051] flex items-center justify-center border border-[#C8A051]/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-[#ECE7DE]">Create New Project</h2>
              <p className="text-xs text-[#71717A]">Initialize a dedicated manuscript, wiki bible, and drop vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#ECE7DE] hover:bg-[#1E1E22] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Project Title */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold block mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. The Architecture of Silence"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#18181B] border border-[#2A2A2E] rounded-xl px-4 py-2.5 text-sm text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none transition-colors"
            />
          </div>

          {/* Genre / Format Selector */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold block mb-1.5">
              Work Genre & Modality
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENRE_OPTIONS.map(g => {
                const isSelected = genre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenre(g.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#C8A051]/10 border-[#C8A051] text-[#ECE7DE]"
                        : "bg-[#141416] border-[#222226] text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#ECE7DE]"
                    }`}
                  >
                    <span className="text-base">{g.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{g.label}</div>
                      <div className="text-[10px] text-[#71717A] truncate">{g.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Collection */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold block mb-1.5">
              Collection / Theme
            </label>
            <select
              value={themeId}
              onChange={e => setThemeId(e.target.value)}
              className="w-full bg-[#18181B] border border-[#2A2A2E] rounded-xl px-3 py-2 text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none cursor-pointer"
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Central Inquiry / Logline */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold block mb-1.5">
              Central Inquiry or Logline
            </label>
            <textarea
              rows={2}
              placeholder="What question animates this work? What core tension does it explore?"
              value={logline}
              onChange={e => setLogline(e.target.value)}
              className="w-full bg-[#18181B] border border-[#2A2A2E] rounded-xl px-3 py-2 text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none resize-none"
            />
          </div>

          {/* First Chapter Name */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold block mb-1.5">
              Initial Chapter Title
            </label>
            <input
              type="text"
              placeholder="Opening Inquest"
              value={firstChapterTitle}
              onChange={e => setFirstChapterTitle(e.target.value)}
              className="w-full bg-[#18181B] border border-[#2A2A2E] rounded-xl px-3 py-2 text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#202024]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#71717A] hover:text-[#ECE7DE] hover:bg-[#18181B] transition-colors cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-[#ECE7DE] hover:bg-white text-[#080808] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
