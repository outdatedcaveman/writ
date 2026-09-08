import React, { useState } from "react";
import {
  ProjectVaultItem,
  VaultItemType,
  Segment,
  ProjectWiki,
  ThreadEntity,
  Project
} from "../../types/workspace";
import {
  Inbox,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Film,
  FileText,
  Link2,
  Filter,
  Layers,
  Wand2
} from "lucide-react";

interface ProjectVaultViewProps {
  project: Project;
  vaultItems: ProjectVaultItem[];
  segments: Segment[];
  wiki: ProjectWiki;
  threads: Record<string, ThreadEntity>;
  onAddItem: (item: {
    type: VaultItemType;
    title: string;
    content: string;
    mediaUrl?: string;
  }) => void;
  onIncorporateItem: (itemId: string, targetType: string, targetId?: string, textToIntegrate?: string) => void;
  onSoftDeleteItem: (itemId: string, title: string) => void;
}

export const ProjectVaultView: React.FC<ProjectVaultViewProps> = ({
  project,
  vaultItems,
  segments,
  wiki,
  threads,
  onAddItem,
  onIncorporateItem,
  onSoftDeleteItem
}) => {
  const [filter, setFilter] = useState<"all" | "inbox" | "placed">("all");
  const [isCapturing, setIsCapturing] = useState(false);
  const [dropType, setDropType] = useState<VaultItemType>("text");
  const [dropTitle, setDropTitle] = useState("");
  const [dropContent, setDropContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const activeItems = vaultItems.filter(i => !i.isArchived);
  const filteredItems = filter === "all"
    ? activeItems
    : filter === "inbox"
    ? activeItems.filter(i => i.status === "inbox")
    : activeItems.filter(i => i.status === "placed");

  const handleCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropContent.trim()) return;

    onAddItem({
      type: dropType,
      title: dropTitle.trim() || `${dropType.toUpperCase()} Drop ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      content: dropContent.trim(),
      mediaUrl: mediaUrl.trim() || undefined
    });

    setDropTitle("");
    setDropContent("");
    setMediaUrl("");
    setIsCapturing(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ECE7DE] rounded-xl border border-[#202020] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C8A051]/10 flex items-center justify-center text-[#C8A051]">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide">Project Drop Vault & Auto-Arranger: {project.title}</h2>
            <p className="text-xs text-[#66625B]">
              Flat global inbox for scattered thoughts, snippets, media, and autonomous structural rearrangement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-lg border border-[#202020]">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === "all" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
              }`}
            >
              All ({activeItems.length})
            </button>
            <button
              onClick={() => setFilter("inbox")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === "inbox" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
              }`}
            >
              Inbox ({activeItems.filter(i => i.status === "inbox").length})
            </button>
            <button
              onClick={() => setFilter("placed")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === "placed" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
              }`}
            >
              Placed ({activeItems.filter(i => i.status === "placed").length})
            </button>
          </div>

          <button
            onClick={() => setIsCapturing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-medium hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Drop Scrap / Media</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Fast Drop Capture Overlay / Form */}
        {isCapturing && (
          <form onSubmit={handleCaptureSubmit} className="p-5 rounded-xl border border-[#C8A051] bg-[#141414] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium uppercase tracking-wider text-[#C8A051] flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Drop Raw Thought, Text, or Media</span>
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDropType("text")}
                  className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 ${
                    dropType === "text" ? "bg-[#C8A051]/20 text-[#C8A051] border border-[#C8A051]/40" : "text-[#66625B]"
                  }`}
                >
                  <FileText className="w-3 h-3" /> Text
                </button>
                <button
                  type="button"
                  onClick={() => setDropType("image")}
                  className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 ${
                    dropType === "image" ? "bg-[#6B8FA3]/20 text-[#6B8FA3] border border-[#6B8FA3]/40" : "text-[#66625B]"
                  }`}
                >
                  <ImageIcon className="w-3 h-3" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => setDropType("video")}
                  className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 ${
                    dropType === "video" ? "bg-[#7E9F86]/20 text-[#7E9F86] border border-[#7E9F86]/40" : "text-[#66625B]"
                  }`}
                >
                  <Film className="w-3 h-3" /> Video
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Title or quick label (e.g. Bus stop conversation about rain)"
              value={dropTitle}
              onChange={e => setDropTitle(e.target.value)}
              className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
            />

            {(dropType === "image" || dropType === "video") && (
              <input
                type="text"
                placeholder="Image/Video URL or local asset path"
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
              />
            )}

            <textarea
              placeholder="Dump scattered thought, quote, dialogue snippet, or description..."
              value={dropContent}
              onChange={e => setDropContent(e.target.value)}
              className="w-full h-32 bg-[#080808] border border-[#202020] rounded-lg p-3 text-xs font-serif leading-relaxed text-[#ECE7DE] focus:outline-none resize-none"
              required
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCapturing(false)}
                className="px-3 py-1.5 text-xs text-[#66625B] hover:text-[#A09A8F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-[#C8A051] text-[#080808] text-xs font-medium hover:bg-[#d6b063]"
              >
                Ingest & Analyze with AI
              </button>
            </div>
          </form>
        )}

        {/* Vault Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#66625B]">
            No items in the project vault matching this filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => {
              const isPlaced = item.status === "placed";
              const suggestion = item.placementSuggestion;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isPlaced
                      ? "bg-[#0a0a0a] border-[#1c1c1c] opacity-75 hover:opacity-100"
                      : "bg-[#101010] border-[#242424] hover:border-[#383838]"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Type & Status bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c1c1c] text-[#A09A8F] flex items-center gap-1">
                          {item.type === "image" ? <ImageIcon className="w-3 h-3" /> : item.type === "video" ? <Film className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          <span>{item.type}</span>
                        </span>

                        {isPlaced ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#7E9F86]/10 text-[#7E9F86] border border-[#7E9F86]/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Placed
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C8A051]/10 text-[#C8A051] border border-[#C8A051]/30">
                            Inbox
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onSoftDeleteItem(item.id, item.title)}
                        className="text-[#66625B] hover:text-[#BF614B] p-1 rounded transition-colors"
                        title="Archive (Soft-delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Media Preview if image */}
                    {item.mediaUrl && item.type === "image" && (
                      <div className="rounded-lg overflow-hidden border border-[#202020] bg-black max-h-48 flex items-center justify-center">
                        <img src={item.mediaUrl} alt={item.title} className="w-full object-cover" />
                      </div>
                    )}

                    <h4 className="font-serif text-base font-medium text-[#ECE7DE]">{item.title}</h4>
                    <p className="font-serif text-xs leading-relaxed text-[#A09A8F] bg-[#090909] p-3 rounded-lg border border-[#1c1c1c]">
                      "{item.content}"
                    </p>

                    {/* Extracted Insights Chips */}
                    {item.extractedInsights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.extractedInsights.map((ins, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#181818] text-[#7E9F86]">
                            #{ins}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Placement Recommendation Box */}
                    {suggestion && (
                      <div className="mt-3 p-3.5 rounded-lg bg-[#141414] border border-[#202020] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#C8A051] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Cohesion Match
                          </span>
                          <span className="text-[10px] font-mono text-[#7E9F86]">
                            {suggestion.confidenceScore}% confidence
                          </span>
                        </div>

                        <div className="text-xs font-medium text-[#ECE7DE]">
                          Suggested Placement: <span className="text-[#6B8FA3]">{suggestion.targetTitle}</span>
                        </div>

                        <p className="text-[11px] text-[#A09A8F] leading-snug">
                          {suggestion.rationale}
                        </p>

                        {!isPlaced && (
                          <button
                            onClick={() =>
                              onIncorporateItem(
                                item.id,
                                suggestion.targetType,
                                suggestion.targetId,
                                suggestion.suggestedTextToIntegrate
                              )
                            }
                            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#C8A051] text-[#080808] text-xs font-medium hover:bg-[#d6b063] transition-colors cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Incorporate & Weave into Project</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
