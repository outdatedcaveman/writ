import React, { useState } from "react";
import { Project, ProjectWiki } from "../../types/workspace";
import { X, Sliders, BookOpen, Target, Sparkles, Check } from "lucide-react";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  wiki?: ProjectWiki;
  onSave: (updatedProject: Partial<Project>, updatedWiki?: Partial<ProjectWiki>) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  wiki,
  onSave
}) => {
  const [title, setTitle] = useState(project.title);
  const [genre, setGenre] = useState(project.genre);
  const [targetLength, setTargetLength] = useState(wiki?.themeAndPremise.targetLength || "8,000 words");
  const [centralInquiry, setCentralInquiry] = useState(wiki?.themeAndPremise.centralInquiry || "");
  const [readerPromise, setReaderPromise] = useState(wiki?.themeAndPremise.readerPromise || "");
  const [tone, setTone] = useState(wiki?.themeAndPremise.tone || "Reflective, precise");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      { title, genre },
      wiki
        ? {
            themeAndPremise: {
              ...wiki.themeAndPremise,
              targetLength,
              centralInquiry,
              readerPromise,
              tone
            }
          }
        : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101010] border border-[#242424] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#C8A051]" />
            <h2 className="font-serif text-base font-medium text-[#ECE7DE]">Project & Story Bible Properties</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#66625B] hover:text-[#ECE7DE] hover:bg-[#202020] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
                Genre / Format
              </label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value as any)}
                className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs cursor-pointer capitalize"
              >
                <option value="fiction">Fiction</option>
                <option value="essay">Essay</option>
                <option value="philosophy">Philosophy</option>
                <option value="journalism">Journalism</option>
                <option value="screenplay">Screenplay</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
                Target Word Count / Length
              </label>
              <input
                type="text"
                value={targetLength}
                onChange={e => setTargetLength(e.target.value)}
                className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
              Central Inquiry / Premise Question
            </label>
            <textarea
              rows={2}
              value={centralInquiry}
              onChange={e => setCentralInquiry(e.target.value)}
              placeholder="What core philosophical question or plot question drives this manuscript?"
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
              Reader Promise / Core Thesis
            </label>
            <textarea
              rows={2}
              value={readerPromise}
              onChange={e => setReaderPromise(e.target.value)}
              placeholder="What will the reader understand or experience by the end?"
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
              Tone & Cadence
            </label>
            <input
              type="text"
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1c1c1c]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-[#2c2c2c] text-[#A09A8F] hover:text-[#ECE7DE] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#C8A051] hover:bg-[#D4AF60] text-[#080808] font-medium transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
