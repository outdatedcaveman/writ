import React, { useState } from "react";
import { Segment, CharacterEntity, ThreadEntity, PlotPointEntity } from "../../types/workspace";
import { Calendar, Activity, CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";

interface TimelineMatrixProps {
  segments: Segment[];
  characters: CharacterEntity[];
  threads: ThreadEntity[];
  plotPoints: PlotPointEntity[];
  onSelectSegment: (segmentId: string) => void;
}

export const TimelineMatrix: React.FC<TimelineMatrixProps> = ({
  segments,
  characters,
  threads,
  plotPoints,
  onSelectSegment
}) => {
  const activeSegments = segments.filter(s => !s.isArchived).sort((a, b) => a.order - b.order);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(activeSegments[0]?.id || null);

  const selectedSeg = activeSegments.find(s => s.id === hoveredSegmentId) || activeSegments[0];

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ECE7DE] rounded-xl border border-[#202020] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6B8FA3]/10 flex items-center justify-center text-[#6B8FA3]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide">Timeline & Macro-Progression Matrix</h2>
            <p className="text-xs text-[#66625B]">
              Chapter-by-chapter evolution of tension, characters, subplots, and narrative beats
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#66625B]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7E9F86]" /> Complete</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C8A051]" /> Active Working</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#383838]" /> Open Gap</span>
        </div>
      </div>

      {/* Main Matrix Grid */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-x-auto p-6">
          <div className="min-w-[720px] space-y-6">
            {/* Timeline track columns */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${activeSegments.length}, minmax(180px, 1fr))` }}>
              {activeSegments.map((seg, idx) => {
                const isSelected = hoveredSegmentId === seg.id;
                const statusColor =
                  seg.status === "done"
                    ? "border-[#7E9F86] text-[#7E9F86]"
                    : seg.status === "active"
                    ? "border-[#C8A051] text-[#C8A051]"
                    : "border-[#383838] text-[#66625B]";

                const segPlotPoint = plotPoints.find(p => p.targetSegmentId === seg.id);

                return (
                  <div
                    key={seg.id}
                    onClick={() => setHoveredSegmentId(seg.id)}
                    className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#181818] border-[#6B8FA3] shadow-lg scale-[1.02]"
                        : "bg-[#101010] border-[#202020] hover:border-[#303030]"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif font-bold text-sm text-[#ECE7DE]">
                        Section {seg.romanNumeral}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                        {seg.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-sm text-[#ECE7DE] line-clamp-2 leading-snug mb-3">
                      {seg.title}
                    </h3>

                    {/* Beat Tag */}
                    {segPlotPoint && (
                      <div className="mb-3 px-2 py-1 rounded bg-[#161616] border border-[#242424] text-[11px] text-[#A09A8F]">
                        <span className="text-[10px] text-[#C8A051] uppercase block font-mono">Beat</span>
                        {segPlotPoint.title}
                      </div>
                    )}

                    {/* Active Threads inside this chapter */}
                    <div className="mt-auto pt-3 border-t border-[#1c1c1c] space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-[#66625B]">Treated Threads</span>
                      <div className="flex flex-wrap gap-1">
                        {seg.treatedThreadIds.map(thId => {
                          const thread = threads.find(t => t.id === thId);
                          return (
                            <span
                              key={thId}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#202020] text-[#A09A8F] truncate max-w-full"
                              title={thread?.name}
                            >
                              {thread?.name || thId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dramatic Tension Progression curve */}
            <div className="p-5 rounded-xl border border-[#202020] bg-[#101010]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-medium tracking-wider text-[#A09A8F]">
                  Narrative / Argumentative Intensity Arc
                </span>
                <span className="text-xs text-[#66625B]">Climax projected at Act III / Section IV</span>
              </div>
              <div className="h-16 flex items-end gap-3 px-4 py-2 border-b border-[#202020]">
                {activeSegments.map((seg, idx) => {
                  const intensityHeight = `${30 + idx * 22}%`;
                  const isSelected = hoveredSegmentId === seg.id;
                  return (
                    <div key={seg.id} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isSelected ? "bg-[#6B8FA3]" : "bg-[#282828] group-hover:bg-[#404040]"
                        }`}
                        style={{ height: intensityHeight }}
                      />
                      <span className="text-[10px] font-mono text-[#66625B]">
                        {seg.romanNumeral}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Detail Pane */}
        {selectedSeg && (
          <div className="w-84 border-l border-[#202020] bg-[#101010] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-[#6B8FA3]">
                  Section {selectedSeg.romanNumeral} · Deep Inspection
                </span>
                <h3 className="font-serif text-xl font-medium text-[#ECE7DE] mt-1">
                  {selectedSeg.title}
                </h3>
              </div>

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-2">
                  Executive Synopsis
                </h4>
                <p className="text-xs text-[#ECE7DE] leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#202020]">
                  {selectedSeg.synopsis}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-2">
                  Chapter Goals & Deliverables
                </h4>
                <div className="space-y-2">
                  {selectedSeg.goals.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#A09A8F]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7E9F86] mt-0.5 shrink-0" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-2">
                  Manuscript Health
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#141414] p-2.5 rounded-lg border border-[#202020]">
                    <span className="text-[10px] text-[#66625B] block uppercase">Length</span>
                    <span className="font-mono text-sm text-[#ECE7DE]">
                      {(selectedSeg.textContent.match(/\b\w+\b/g) || []).length} words
                    </span>
                  </div>
                  <div className="bg-[#141414] p-2.5 rounded-lg border border-[#202020]">
                    <span className="text-[10px] text-[#66625B] block uppercase">Read Time</span>
                    <span className="font-mono text-sm text-[#ECE7DE]">
                      ~{Math.max(1, Math.round(((selectedSeg.textContent.match(/\b\w+\b/g) || []).length) / 220))} min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectSegment(selectedSeg.id)}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ECE7DE] text-[#080808] font-medium text-xs hover:bg-white transition-all cursor-pointer shadow"
            >
              <span>Open in Manuscript Editor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
