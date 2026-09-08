import React, { useState } from "react";
import { ThreadEntity, Segment } from "../../types/workspace";
import { GitBranch, AlertTriangle, CheckCircle2, Clock, Plus, Filter, Compass } from "lucide-react";

interface ThreadVisualizerProps {
  threads: ThreadEntity[];
  segments: Segment[];
  onAddThread: (name: string, category: ThreadEntity["category"], description: string) => void;
  onUpdateThreadStatus: (threadId: string, status: "open" | "developing" | "closed") => void;
}

export const ThreadVisualizer: React.FC<ThreadVisualizerProps> = ({
  threads,
  segments,
  onAddThread,
  onUpdateThreadStatus
}) => {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<ThreadEntity["category"]>("subplot");

  const activeThreads = threads.filter(t => !t.isArchived);
  const filteredThreads = filterCategory === "all"
    ? activeThreads
    : activeThreads.filter(t => t.category === filterCategory);

  // Loose ends detector: threads that are open or developing, but not touched in the last segment
  const sortedSegments = segments.filter(s => !s.isArchived).sort((a, b) => a.order - b.order);
  const finalSegment = sortedSegments[sortedSegments.length - 1];

  const looseEnds = activeThreads.filter(t => {
    if (t.status === "closed") return false;
    // If the thread is not treated in the final 2 segments or only appeared once
    const appearsInLaterHalf = t.appearances.some(app => {
      const seg = segments.find(s => s.id === app.segmentId);
      return seg && seg.order >= Math.ceil(sortedSegments.length / 2);
    });
    return !appearsInLaterHalf;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddThread(newName.trim(), newCategory, newDesc.trim());
    setNewName("");
    setNewDesc("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ECE7DE] rounded-xl border border-[#202020] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#BF614B]/10 flex items-center justify-center text-[#BF614B]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide">Global Narrative Thread & Argument Visualizer</h2>
            <p className="text-xs text-[#66625B]">
              Lifecycle tracking (`Open` → `Developing` → `Closed`) and automated loose-ends inspection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-[#080808] border border-[#202020] text-xs text-[#A09A8F] px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Categories ({activeThreads.length})</option>
            <option value="main_plot">Main Plot Arcs</option>
            <option value="subplot">Subplots & Friction</option>
            <option value="argument">Dialectical Arguments</option>
            <option value="thematic">Thematic Motifs</option>
          </select>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-medium hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track New Thread</span>
          </button>
        </div>
      </div>

      {/* Loose Ends Watchdog Alert Banner */}
      {looseEnds.length > 0 && (
        <div className="bg-[#BF614B]/10 border-b border-[#BF614B]/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[#BF614B] shrink-0" />
            <div>
              <span className="text-xs font-medium text-[#ECE7DE]">
                Loose-Ends Watchdog: {looseEnds.length} unresolved thread{looseEnds.length > 1 ? "s" : ""} detected
              </span>
              <p className="text-[11px] text-[#A09A8F]">
                {looseEnds.map(t => t.name).join(", ")} {looseEnds.length > 1 ? "were" : "was"} introduced early but {looseEnds.length > 1 ? "remain" : "remains"} untended in later sections.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#BF614B]/20 text-[#BF614B]">
            Action Advised
          </span>
        </div>
      )}

      {/* Main Thread Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Inline Add Modal */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-5 rounded-xl border border-[#7E9F86] bg-[#141414] space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#7E9F86]">
              Initialize Narrative or Argument Thread
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Thread title (e.g. Hospitality to Doubt)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                required
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="bg-[#080808] border border-[#202020] text-xs text-[#A09A8F] px-3 py-2 rounded-lg focus:outline-none"
              >
                <option value="main_plot">Main Plot Arc</option>
                <option value="subplot">Subplot</option>
                <option value="argument">Philosophical Argument</option>
                <option value="thematic">Thematic Motif</option>
              </select>
            </div>
            <textarea
              placeholder="What core question or dramatic tension does this thread explore?"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] p-3 rounded-lg focus:outline-none"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-[#66625B] hover:text-[#A09A8F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#7E9F86] text-[#080808] text-xs font-medium hover:bg-[#8eb397]"
              >
                Save Thread
              </button>
            </div>
          </form>
        )}

        {/* Thread List Cards */}
        {filteredThreads.map(thread => {
          const statusBadge =
            thread.status === "closed"
              ? "bg-[#7E9F86]/10 text-[#7E9F86] border-[#7E9F86]/30"
              : thread.status === "developing"
              ? "bg-[#6B8FA3]/10 text-[#6B8FA3] border-[#6B8FA3]/30"
              : "bg-[#BF614B]/10 text-[#BF614B] border-[#BF614B]/30";

          return (
            <div
              key={thread.id}
              className="p-5 rounded-xl border border-[#202020] bg-[#101010] hover:border-[#303030] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#1c1c1c] text-[#A09A8F]">
                      {thread.category.replace("_", " ")}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusBadge}`}>
                      {thread.status}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-medium text-[#ECE7DE]">{thread.name}</h3>
                  <p className="text-xs text-[#A09A8F] mt-1">{thread.description}</p>
                </div>

                {/* Status Toggle buttons */}
                <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-lg border border-[#202020]">
                  <button
                    onClick={() => onUpdateThreadStatus(thread.id, "open")}
                    className={`px-2 py-1 text-[10px] rounded ${
                      thread.status === "open" ? "bg-[#BF614B]/20 text-[#BF614B]" : "text-[#66625B]"
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => onUpdateThreadStatus(thread.id, "developing")}
                    className={`px-2 py-1 text-[10px] rounded ${
                      thread.status === "developing" ? "bg-[#6B8FA3]/20 text-[#6B8FA3]" : "text-[#66625B]"
                    }`}
                  >
                    Developing
                  </button>
                  <button
                    onClick={() => onUpdateThreadStatus(thread.id, "closed")}
                    className={`px-2 py-1 text-[10px] rounded ${
                      thread.status === "closed" ? "bg-[#7E9F86]/20 text-[#7E9F86]" : "text-[#66625B]"
                    }`}
                  >
                    Closed
                  </button>
                </div>
              </div>

              {/* Lifecycle progression timeline */}
              <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
                <div className="text-[10px] uppercase tracking-wider text-[#66625B] mb-2">
                  Timeline Appearances Across Chapters
                </div>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {sortedSegments.map(seg => {
                    const appearance = thread.appearances.find(a => a.segmentId === seg.id);
                    const isTreated = !!appearance;
                    return (
                      <div
                        key={seg.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                          isTreated
                            ? "bg-[#181818] border-[#7E9F86]/40 text-[#ECE7DE]"
                            : "bg-[#0c0c0c] border-[#1c1c1c] text-[#444] opacity-50"
                        }`}
                      >
                        <span className="font-mono text-[10px] text-[#A09A8F]">
                          {seg.romanNumeral}
                        </span>
                        <span className="text-[11px] truncate max-w-[120px]">
                          {isTreated ? appearance.resolutionState : "Untreated"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
