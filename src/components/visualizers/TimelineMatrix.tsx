import React, { useState, useEffect, useMemo } from "react";
import { Segment, CharacterEntity, ThreadEntity, PlotPointEntity } from "../../types/workspace";
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  X,
  Layers,
  GitCommit,
  GitBranch,
  Sparkles,
  Compass,
  FileText,
  Sliders,
  ChevronRight,
  TrendingUp,
  Bookmark,
  Eye,
  Info
} from "lucide-react";

interface TimelineMatrixProps {
  segments: Segment[];
  characters: CharacterEntity[];
  threads: ThreadEntity[];
  plotPoints: PlotPointEntity[];
  macroStructure?: {
    framework?: string;
    acts?: {
      name: string;
      summary: string;
      targetPacing?: string;
    }[];
  };
  onSelectSegment: (segmentId: string) => void;
}

export const TimelineMatrix: React.FC<TimelineMatrixProps> = ({
  segments,
  characters,
  threads,
  plotPoints,
  macroStructure,
  onSelectSegment
}) => {
  const activeSegments = useMemo(
    () => segments.filter(s => !s.isArchived).sort((a, b) => a.order - b.order),
    [segments]
  );

  const activeThreads = useMemo(
    () => threads.filter(t => !t.isArchived),
    [threads]
  );

  // Inspector is CLOSED by default so the author sees the panoramic timeline first!
  const [inspectedSegmentId, setInspectedSegmentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "matrix" | "combined">("timeline");

  // Selected segment for inspection (if opened)
  const selectedSeg = useMemo(
    () => (inspectedSegmentId ? activeSegments.find(s => s.id === inspectedSegmentId) || null : null),
    [inspectedSegmentId, activeSegments]
  );

  // Close inspector on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inspectedSegmentId) {
        setInspectedSegmentId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectedSegmentId]);

  // Derive Acts ribbon
  const acts = useMemo(() => {
    if (macroStructure?.acts && macroStructure.acts.length > 0) {
      const actCount = macroStructure.acts.length;
      const segsPerAct = Math.max(1, Math.ceil(activeSegments.length / actCount));
      return macroStructure.acts.map((act, idx) => {
        const startIdx = idx * segsPerAct;
        const endIdx = Math.min(activeSegments.length, (idx + 1) * segsPerAct);
        const assignedSegments = activeSegments.slice(startIdx, endIdx);
        return {
          name: act.name,
          summary: act.summary,
          pacing: act.targetPacing || "measured",
          segments: assignedSegments
        };
      });
    }

    // Default 3-act framework if none configured
    const third = Math.max(1, Math.ceil(activeSegments.length / 3));
    return [
      {
        name: "Act I · Setup / Thesis",
        summary: "Introduction of core tension, premise, and inquiry",
        pacing: "measured",
        segments: activeSegments.slice(0, third)
      },
      {
        name: "Act II · Confrontation / Development",
        summary: "Deepening conflict, systemic pressure, and antithesis",
        pacing: "building",
        segments: activeSegments.slice(third, third * 2)
      },
      {
        name: "Act III · Resolution / Synthesis",
        summary: "Climax, unmasking, and transformed philosophical posture",
        pacing: "reflective",
        segments: activeSegments.slice(third * 2)
      }
    ];
  }, [macroStructure, activeSegments]);

  // Compute realistic tension score for each segment
  const tensionCurve = useMemo(() => {
    return activeSegments.map((seg, idx) => {
      const segPlotPoint = plotPoints.find(p => p.targetSegmentId === seg.id);
      const wordCount = (seg.textContent.match(/\b\w+\b/g) || []).length;

      let score = 32 + (idx / Math.max(1, activeSegments.length - 1)) * 25;
      if (segPlotPoint) {
        switch (segPlotPoint.beatType) {
          case "catalyst":
            score += 18;
            break;
          case "midpoint":
            score += 28;
            break;
          case "all_is_lost":
            score += 40;
            break;
          case "climax":
            score += 48;
            break;
          case "resolution":
            score -= 10;
            break;
          case "argument_advance":
            score += 20;
            break;
          default:
            score += 15;
            break;
        }
      }
      if (seg.status === "done") score += 6;
      score += Math.min(12, Math.round(wordCount / 120));
      return {
        segmentId: seg.id,
        romanNumeral: seg.romanNumeral,
        score: Math.min(95, Math.max(20, Math.round(score))),
        beat: segPlotPoint?.title
      };
    });
  }, [activeSegments, plotPoints]);

  const getBeatBadgeStyle = (beatType: string) => {
    switch (beatType) {
      case "catalyst":
        return "bg-[#C8A051]/15 text-[#C8A051] border-[#C8A051]/40";
      case "midpoint":
        return "bg-[#E07A5F]/15 text-[#E07A5F] border-[#E07A5F]/40";
      case "climax":
        return "bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/40";
      case "all_is_lost":
        return "bg-[#BF614B]/15 text-[#BF614B] border-[#BF614B]/40";
      case "resolution":
        return "bg-[#7E9F86]/15 text-[#7E9F86] border-[#7E9F86]/40";
      case "argument_advance":
        return "bg-[#6B8FA3]/15 text-[#6B8FA3] border-[#6B8FA3]/40";
      default:
        return "bg-[#202024] text-[#A09A8F] border-[#303034]";
    }
  };

  const getStatusBadge = (status: Segment["status"]) => {
    switch (status) {
      case "done":
        return { label: "Complete", badge: "border-[#7E9F86]/50 text-[#7E9F86] bg-[#7E9F86]/10", dot: "bg-[#7E9F86]" };
      case "active":
        return { label: "Active", badge: "border-[#C8A051]/50 text-[#C8A051] bg-[#C8A051]/10", dot: "bg-[#C8A051]" };
      default:
        return { label: "Gap", badge: "border-[#383838] text-[#8E8E93] bg-[#181818]", dot: "bg-[#454545]" };
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0a0a0c] text-[#ECE7DE] rounded-xl border border-[#202024] overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-[#202024] bg-[#101012] gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6B8FA3]/15 border border-[#6B8FA3]/30 flex items-center justify-center text-[#6B8FA3]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium tracking-wide text-[#ECE7DE]">
                Timeline & Macro-Progression Matrix
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1b1b1e] border border-[#2c2c30] text-[#8E8E93] font-mono">
                {activeSegments.length} Chapters
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Chronological narrative ribbon, story beats, and dialectical thread continuity
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Status Legends */}
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-[#8E8E93] mr-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7E9F86]" /> Complete
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C8A051]" /> Active Working
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#454545]" /> Open Gap
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-[#151518] p-0.5 rounded-lg border border-[#242428]">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-[#25252b] text-[#ECE7DE] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#ECE7DE]"
              }`}
            >
              Timeline Track
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-[#25252b] text-[#ECE7DE] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#ECE7DE]"
              }`}
            >
              Thread Matrix
            </button>
            <button
              onClick={() => setViewMode("combined")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "combined"
                  ? "bg-[#25252b] text-[#ECE7DE] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#ECE7DE]"
              }`}
            >
              Combined Flow
            </button>
          </div>

          {/* Quick Inspector Toggle Button */}
          {activeSegments.length > 0 && (
            <button
              onClick={() =>
                setInspectedSegmentId(prev => (prev ? null : activeSegments[0].id))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                inspectedSegmentId
                  ? "bg-[#6B8FA3]/20 border-[#6B8FA3]/50 text-[#ECE7DE]"
                  : "bg-[#141416] border-[#25252a] text-[#8E8E93] hover:text-[#ECE7DE] hover:bg-[#1c1c20]"
              }`}
              title={inspectedSegmentId ? "Close Inspector" : "Inspect Selected Chapter"}
            >
              <Info className="w-3.5 h-3.5 text-[#6B8FA3]" />
              <span>{inspectedSegmentId ? "Close Inspector" : "Inspect Chapter"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="p-6 space-y-6 max-w-full">
          {/* ========================================================================= */}
          {/* TRACK 1: MACRO ACTS / PHASES RIBBON                                      */}
          {/* ========================================================================= */}
          {(viewMode === "timeline" || viewMode === "combined") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8E8E93] px-1">
                <span className="font-mono uppercase tracking-wider text-[11px] text-[#A09A8F] flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[#C8A051]" />
                  Macro Narrative Architecture & Acts
                </span>
                <span className="text-[11px]">
                  Pacing Flow: <span className="text-[#C8A051]">Measured</span> → <span className="text-[#BF614B]">Building</span> → <span className="text-[#7E9F86]">Reflective</span>
                </span>
              </div>

              {/* Acts Horizontal Ribbon */}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${acts.length}, minmax(0, 1fr))` }}>
                {acts.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#121215] border border-[#222226] flex flex-col justify-between group hover:border-[#35353c] transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="font-medium text-xs text-[#ECE7DE] truncate">
                          {act.name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c20] text-[#A09A8F] border border-[#2a2a30] shrink-0 uppercase">
                          {act.pacing}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] line-clamp-2 leading-relaxed">
                        {act.summary}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#1c1c20] flex items-center justify-between text-[10px] text-[#66625B]">
                      <span>Coverage</span>
                      <span className="font-mono text-[#A09A8F]">
                        {act.segments.length > 0
                          ? `Sec ${act.segments[0]?.romanNumeral} – ${act.segments[act.segments.length - 1]?.romanNumeral}`
                          : "Empty"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRACK 2: TRUE TIMELINE PROGRESSION SPINE (Interactive Chapter Rail)        */}
          {/* ========================================================================= */}
          {(viewMode === "timeline" || viewMode === "combined") && (
            <div className="p-5 rounded-xl border border-[#202024] bg-[#111114] space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase tracking-wider text-[11px] text-[#A09A8F] flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-[#6B8FA3]" />
                  Sequential Timeline Spine & Chapter Milestones
                </span>
                <span className="text-xs text-[#66625B]">
                  Click any chapter or node below to deeply inspect goals and manuscript metrics
                </span>
              </div>

              {/* Horizontal Scrollable Timeline Track */}
              <div className="overflow-x-auto pb-3 pt-2">
                <div className="min-w-[760px]">
                  {/* The Physical Timeline Line with Connected Beads */}
                  <div className="relative flex items-center justify-between px-8 py-4 mb-2">
                    {/* Background Connecting Rail */}
                    <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#222228] via-[#353540] to-[#222228]" />

                    {activeSegments.map((seg, idx) => {
                      const isInspected = inspectedSegmentId === seg.id;
                      const status = getStatusBadge(seg.status);
                      const hasPlotPoint = plotPoints.some(p => p.targetSegmentId === seg.id);

                      return (
                        <div
                          key={seg.id}
                          onClick={() => setInspectedSegmentId(seg.id)}
                          className="relative z-10 flex flex-col items-center cursor-pointer group"
                        >
                          {/* Roman Numeral Node Circle */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-xs font-bold transition-all ${
                              isInspected
                                ? "bg-[#ECE7DE] text-[#0a0a0c] ring-4 ring-[#6B8FA3]/40 scale-110 shadow-lg"
                                : "bg-[#18181c] text-[#ECE7DE] border border-[#2e2e34] group-hover:border-[#6B8FA3] group-hover:scale-105"
                            }`}
                          >
                            {seg.romanNumeral}
                          </div>

                          {/* Status Bead */}
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                            {hasPlotPoint && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A051]" title="Contains Major Plot Beat" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chapter Cards Aligned Directly Below the Timeline Spine */}
                  <div
                    className="grid gap-3.5"
                    style={{ gridTemplateColumns: `repeat(${activeSegments.length}, minmax(180px, 1fr))` }}
                  >
                    {activeSegments.map((seg, idx) => {
                      const isInspected = inspectedSegmentId === seg.id;
                      const status = getStatusBadge(seg.status);
                      const segPlotPoint = plotPoints.find(p => p.targetSegmentId === seg.id);
                      const wordCount = (seg.textContent.match(/\b\w+\b/g) || []).length;
                      const readTime = Math.max(1, Math.round(wordCount / 220));

                      return (
                        <div
                          key={seg.id}
                          onClick={() => setInspectedSegmentId(seg.id)}
                          className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isInspected
                              ? "bg-[#18181d] border-[#6B8FA3] shadow-lg ring-1 ring-[#6B8FA3]/50 -translate-y-0.5"
                              : "bg-[#131316] border-[#222226] hover:border-[#35353c] hover:bg-[#16161a]"
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-serif font-bold text-xs text-[#ECE7DE]">
                              Section {seg.romanNumeral}
                            </span>
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${status.badge}`}>
                              {status.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-serif text-xs text-[#ECE7DE] line-clamp-2 leading-snug mb-2 font-medium">
                            {seg.title}
                          </h3>

                          {/* Associated Plot Beat */}
                          {segPlotPoint ? (
                            <div className="mb-2.5 px-2 py-1 rounded bg-[#18181c] border border-[#26262c] text-[10px]">
                              <span className={`text-[8px] font-mono uppercase block font-bold tracking-wider mb-0.5 ${getBeatBadgeStyle(segPlotPoint.beatType)} border px-1 py-0.2 rounded w-fit`}>
                                {segPlotPoint.beatType.replace(/_/g, " ")}
                              </span>
                              <span className="text-[#A09A8F] truncate block font-medium">
                                {segPlotPoint.title}
                              </span>
                            </div>
                          ) : (
                            <div className="mb-2.5 px-2 py-1 rounded bg-[#151518]/60 border border-[#202024] text-[10px] text-[#55524d]">
                              <span>Bridging Narrative</span>
                            </div>
                          )}

                          {/* Quick Metrics & Treated Threads count */}
                          <div className="mt-auto pt-2.5 border-t border-[#1e1e22] flex items-center justify-between text-[10px] text-[#8E8E93]">
                            <span>{wordCount} words</span>
                            <span className="font-mono text-[#66625B]">~{readTime}m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRACK 3: DRAMATIC INTENSITY & TENSION ARC                                */}
          {/* ========================================================================= */}
          {(viewMode === "timeline" || viewMode === "combined") && (
            <div className="p-5 rounded-xl border border-[#202024] bg-[#111114] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase tracking-wider text-[11px] text-[#A09A8F] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#7E9F86]" />
                  Narrative & Argumentative Tension Arc
                </span>
                <span className="text-[11px] text-[#66625B]">
                  Calculated from beat weight, word density, and chapter deliverables
                </span>
              </div>

              {/* Dynamic Wave Bars */}
              <div className="h-20 flex items-end gap-3 px-4 pt-3 pb-1 border-b border-[#202024] bg-[#0c0c0e]/60 rounded-lg">
                {tensionCurve.map((point, idx) => {
                  const isInspected = inspectedSegmentId === point.segmentId;
                  return (
                    <div
                      key={point.segmentId}
                      onClick={() => setInspectedSegmentId(point.segmentId)}
                      className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                      title={`Section ${point.romanNumeral}: ${point.score}% Tension intensity ${point.beat ? `(Beat: ${point.beat})` : ""}`}
                    >
                      <span className="text-[9px] font-mono text-[#66625B] opacity-0 group-hover:opacity-100 transition-opacity">
                        {point.score}%
                      </span>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isInspected
                            ? "bg-[#6B8FA3] shadow-md shadow-[#6B8FA3]/20"
                            : "bg-[#25252d] group-hover:bg-[#454555]"
                        }`}
                        style={{ height: `${point.score}%` }}
                      />
                      <span className="text-[10px] font-mono text-[#8E8E93] group-hover:text-[#ECE7DE]">
                        {point.romanNumeral}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRACK 4: THREAD & DIALECTICAL ARGUMENT CONTINUITY MATRIX                  */}
          {/* ========================================================================= */}
          {(viewMode === "matrix" || viewMode === "combined") && (
            <div className="p-5 rounded-xl border border-[#202024] bg-[#111114] space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase tracking-wider text-[11px] text-[#A09A8F] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#BF614B]" />
                  Global Thread & Argument Continuity Matrix
                </span>
                <span className="text-xs text-[#66625B]">
                  Inspect which narrative threads and arguments run across each chapter
                </span>
              </div>

              {activeThreads.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#66625B] border border-dashed border-[#26262a] rounded-xl">
                  No active threads tracked in project wiki. Add threads in the Story Bible or Thread Watchdog.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#222226] text-[#8E8E93]">
                        <th className="py-2.5 px-3 font-medium min-w-[200px]">Thread / Argument</th>
                        <th className="py-2.5 px-2 font-medium w-24">Type</th>
                        {activeSegments.map(seg => (
                          <th key={seg.id} className="py-2.5 px-3 text-center font-mono font-normal">
                            Sec {seg.romanNumeral}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b1b1e]">
                      {activeThreads.map(th => (
                        <tr key={th.id} className="hover:bg-[#16161a] transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-[#ECE7DE] block truncate max-w-[220px]">
                              {th.name}
                            </span>
                            <span className="text-[10px] text-[#66625B] block truncate max-w-[220px]">
                              {th.description || "No synopsis"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a1a1e] text-[#8E8E93] border border-[#2a2a30]">
                              {th.category}
                            </span>
                          </td>
                          {activeSegments.map(seg => {
                            const isTreated = seg.treatedThreadIds.includes(th.id);
                            const appearance = th.appearances.find(a => a.segmentId === seg.id);

                            return (
                              <td
                                key={seg.id}
                                onClick={() => setInspectedSegmentId(seg.id)}
                                className="py-2.5 px-3 text-center cursor-pointer"
                              >
                                {isTreated ? (
                                  <span
                                    className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#6B8FA3]/15 text-[#6B8FA3] border border-[#6B8FA3]/30 font-medium"
                                    title={appearance?.beatDescription || `Treated in Section ${seg.romanNumeral}`}
                                  >
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[#333338] text-sm">·</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SLIDE-OVER INSPECTION DRAWER (Only when a chapter is selected)             */}
        {/* ========================================================================= */}
        {selectedSeg && (
          <div className="absolute inset-y-0 right-0 w-96 max-w-[90vw] bg-[#121215] border-l border-[#26262c] shadow-2xl z-30 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Drawer Header with Prominent Close Button */}
              <div className="flex items-start justify-between pb-4 border-b border-[#202024]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B8FA3] flex items-center gap-1.5 font-medium">
                    <Activity className="w-3.5 h-3.5" />
                    Section {selectedSeg.romanNumeral} · Deep Inspection
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[#ECE7DE] mt-1.5 leading-snug">
                    {selectedSeg.title}
                  </h3>
                </div>
                <button
                  onClick={() => setInspectedSegmentId(null)}
                  className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#ECE7DE] hover:bg-[#1f1f24] transition-colors cursor-pointer"
                  title="Close Inspector (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Associated Plot Beat Details */}
              {(() => {
                const segPlotPoint = plotPoints.find(p => p.targetSegmentId === selectedSeg.id);
                if (!segPlotPoint) return null;
                return (
                  <div className="p-3.5 rounded-xl bg-[#17171c] border border-[#282830] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#A09A8F] uppercase tracking-wider">
                        Attached Plot Beat
                      </span>
                      <span className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getBeatBadgeStyle(segPlotPoint.beatType)}`}>
                        {segPlotPoint.beatType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="font-serif text-xs font-semibold text-[#ECE7DE]">
                      {segPlotPoint.title}
                    </div>
                    <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                      {segPlotPoint.description}
                    </p>
                  </div>
                );
              })()}

              {/* Executive Synopsis */}
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#8E8E93] mb-2 font-mono">
                  Executive Synopsis
                </h4>
                <p className="text-xs text-[#ECE7DE] leading-relaxed bg-[#161619] p-3.5 rounded-lg border border-[#222226]">
                  {selectedSeg.synopsis || "No synopsis entered for this section."}
                </p>
              </div>

              {/* Chapter Goals & Deliverables */}
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#8E8E93] mb-2 font-mono">
                  Chapter Goals & Deliverables
                </h4>
                {selectedSeg.goals && selectedSeg.goals.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSeg.goals.map((goal, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#A09A8F]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#7E9F86] mt-0.5 shrink-0" />
                        <span className="leading-snug">{goal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#66625B] italic">No chapter goals defined.</div>
                )}
              </div>

              {/* Treated Threads in this chapter */}
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#8E8E93] mb-2 font-mono">
                  Treated Threads ({selectedSeg.treatedThreadIds.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeg.treatedThreadIds.length > 0 ? (
                    selectedSeg.treatedThreadIds.map(thId => {
                      const th = threads.find(t => t.id === thId);
                      return (
                        <span
                          key={thId}
                          className="text-[11px] px-2 py-1 rounded bg-[#18181c] text-[#A09A8F] border border-[#26262c] flex items-center gap-1"
                        >
                          <GitBranch className="w-3 h-3 text-[#6B8FA3]" />
                          {th?.name || thId}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-[#66625B] italic">No threads linked.</span>
                  )}
                </div>
              </div>

              {/* Manuscript Health Metrics */}
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#8E8E93] mb-2 font-mono">
                  Manuscript Health
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#161619] p-3 rounded-lg border border-[#222226]">
                    <span className="text-[10px] text-[#8E8E93] block uppercase tracking-wider font-mono">
                      Word Length
                    </span>
                    <span className="font-mono text-sm text-[#ECE7DE] font-semibold mt-0.5 block">
                      {(selectedSeg.textContent.match(/\b\w+\b/g) || []).length} words
                    </span>
                  </div>
                  <div className="bg-[#161619] p-3 rounded-lg border border-[#222226]">
                    <span className="text-[10px] text-[#8E8E93] block uppercase tracking-wider font-mono">
                      Est. Read Time
                    </span>
                    <span className="font-mono text-sm text-[#ECE7DE] font-semibold mt-0.5 block">
                      ~{Math.max(1, Math.round(((selectedSeg.textContent.match(/\b\w+\b/g) || []).length) / 220))} min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[#202024] bg-[#101012]">
              <button
                onClick={() => onSelectSegment(selectedSeg.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#ECE7DE] text-[#0a0a0c] font-medium text-xs hover:bg-white transition-all cursor-pointer shadow"
              >
                <span>Open in Manuscript Editor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
