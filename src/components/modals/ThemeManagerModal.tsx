import React, { useState } from "react";
import { ThemeCollection } from "../../types/workspace";
import { X, Layers, Plus, Trash2, Check, Palette } from "lucide-react";

interface ThemeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themes: ThemeCollection[];
  onAddTheme: (title: string, description: string, color: string) => void;
  onSoftDeleteTheme: (id: string, name: string) => void;
}

export const ThemeManagerModal: React.FC<ThemeManagerModalProps> = ({
  isOpen,
  onClose,
  themes,
  onAddTheme,
  onSoftDeleteTheme
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#C8A051");

  if (!isOpen) return null;

  const colorOptions = [
    "#C8A051", // Gold / amber
    "#7E9F86", // Sage green
    "#BF614B", // Rust terra-cotta
    "#5A82A6", // Denim blue
    "#8B729E", // Muted violet
    "#A09A8F"  // Warm stone
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTheme(newTitle.trim(), newDescription.trim(), newColor);
    setNewTitle("");
    setNewDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101010] border border-[#242424] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#C8A051]" />
            <h2 className="font-serif text-base font-medium text-[#ECE7DE]">Theme Collections Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#66625B] hover:text-[#ECE7DE] hover:bg-[#202020] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* List of Existing Themes */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block mb-2">
              Existing Collections ({themes.length})
            </label>
            <div className="space-y-2">
              {themes.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#202020]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: t.colorBadge || "#C8A051" }}
                    />
                    <div>
                      <div className="font-medium text-[#ECE7DE] text-xs">{t.name}</div>
                      <div className="text-[10px] text-[#66625B]">{t.description || "Collection folder"}</div>
                    </div>
                  </div>

                  {themes.length > 1 && (
                    <button
                      onClick={() => onSoftDeleteTheme(t.id, t.name)}
                      className="text-[#66625B] hover:text-[#BF614B] p-1 rounded transition-colors cursor-pointer"
                      title="Move collection to Safety Archive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Create New Theme */}
          <form onSubmit={handleCreate} className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#C8A051] block">
              + New Theme Collection
            </span>

            <div>
              <input
                type="text"
                placeholder="Collection Title (e.g. Science & Society, Poetry)..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Short description or purpose..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#66625B] block mb-1.5">Collection Accent Color</label>
              <div className="flex gap-2">
                {colorOptions.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-transform cursor-pointer ${
                      newColor === c ? "ring-2 ring-white scale-110" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {newColor === c && <Check className="w-3 h-3 text-black" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#C8A051] hover:bg-[#D4AF60] text-[#080808] font-medium transition-colors cursor-pointer mt-2"
            >
              Add Collection
            </button>
          </form>
        </div>

        <div className="flex justify-end p-4 border-t border-[#1c1c1c] bg-[#141414]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] text-[#ECE7DE] text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
