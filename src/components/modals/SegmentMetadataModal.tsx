import React, { useState, useEffect } from "react";
import { Segment } from "../../types/workspace";
import { X, FileText, Plus, Trash2, Check } from "lucide-react";

interface SegmentMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: Segment;
  projectTitle?: string;
  onSave: (updatedSegment: Partial<Segment>) => void;
}

export const SegmentMetadataModal: React.FC<SegmentMetadataModalProps> = ({
  isOpen,
  onClose,
  segment,
  projectTitle,
  onSave
}) => {
  const [title, setTitle] = useState(segment?.title || "");
  const [romanNumeral, setRomanNumeral] = useState(segment?.romanNumeral || "I");
  const [synopsis, setSynopsis] = useState(segment?.synopsis || "");
  const [status, setStatus] = useState<"open" | "active" | "done">(segment?.status || "open");
  const [goals, setGoals] = useState<string[]>(segment?.goals || []);
  const [newGoal, setNewGoal] = useState("");

  // Re-synchronize local state whenever modal opens or segment changes
  useEffect(() => {
    if (segment) {
      setTitle(segment.title || "");
      setRomanNumeral(segment.romanNumeral || "I");
      setSynopsis(segment.synopsis || "");
      setStatus(segment.status || "open");
      setGoals(segment.goals || []);
      setNewGoal("");
    }
  }, [segment?.id, segment?.title, segment?.romanNumeral, segment?.synopsis, segment?.status, isOpen]);

  if (!isOpen || !segment) return null;

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, newGoal.trim()]);
    setNewGoal("");
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      romanNumeral,
      synopsis,
      status,
      goals
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101010] border border-[#242424] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#C8A051]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-medium text-[#ECE7DE]">Chapter & Beat Properties</h2>
                {projectTitle && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c22] text-[#A09A8F] border border-[#2a2a34]">
                    {projectTitle}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#71717A]">
                Section {segment.romanNumeral} · {segment.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#66625B] hover:text-[#ECE7DE] hover:bg-[#202020] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
                Section #
              </label>
              <input
                type="text"
                value={romanNumeral}
                onChange={e => setRomanNumeral(e.target.value)}
                className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] font-mono text-center focus:border-[#C8A051] focus:outline-none text-xs"
                required
              />
            </div>

            <div className="col-span-3">
              <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
                Chapter Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
              Chapter Status
            </label>
            <div className="flex gap-2">
              {(["open", "active", "done"] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`flex-1 py-1.5 rounded-lg border text-center capitalize cursor-pointer transition-colors ${
                    status === st
                      ? st === "done"
                        ? "bg-[#7E9F86]/20 border-[#7E9F86] text-[#7E9F86]"
                        : st === "active"
                        ? "bg-[#C8A051]/20 border-[#C8A051] text-[#C8A051]"
                        : "bg-[#282828] border-[#444] text-[#ECE7DE]"
                      : "bg-[#141414] border-[#242424] text-[#66625B] hover:text-[#A09A8F]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
              Chapter Synopsis / Dramatic Beat
            </label>
            <textarea
              rows={3}
              value={synopsis}
              onChange={e => setSynopsis(e.target.value)}
              placeholder="What shifts or resolves in this chapter?"
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-1.5">
              Chapter Deliverables & Goals ({goals.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {goals.map((g, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#141414] border border-[#202020]"
                >
                  <span className="text-[#ECE7DE]">{g}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(idx)}
                    className="text-[#66625B] hover:text-[#BF614B] p-1 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddGoal();
                  }
                }}
                placeholder="Add deliverable..."
                className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className="px-3 py-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] text-[#ECE7DE] cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
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
              Save Chapter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
