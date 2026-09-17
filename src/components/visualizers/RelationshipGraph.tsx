import React, { useState, useRef, useEffect, useMemo } from "react";
import { CharacterEntity, ArgumentEntity, Segment } from "../../types/workspace";
import {
  Users,
  Sparkles,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  X,
  Compass
} from "lucide-react";

interface RelationshipGraphProps {
  characters: CharacterEntity[];
  argumentsList: ArgumentEntity[];
  genre: string;
  segments?: Segment[];
  onSelectSegment?: (segmentId: string) => void;
  onAddCharacter?: (char: CharacterEntity) => void;
  onAddArgument?: (arg: ArgumentEntity) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  characters,
  argumentsList,
  genre,
  segments = [],
  onSelectSegment,
  onAddCharacter,
  onAddArgument
}) => {
  const [viewMode, setViewMode] = useState<"characters" | "arguments">(
    genre === "fiction" ? "characters" : "arguments"
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    characters[0]?.id || argumentsList[0]?.id || null
  );

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Draggable Node Positions State
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Creation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState<CharacterEntity["role"]>("supporting");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [newCharMotivation, setNewCharMotivation] = useState("");
  const [newCharArc, setNewCharArc] = useState("");

  const [newArgClaim, setNewArgClaim] = useState("");
  const [newArgPremise, setNewArgPremise] = useState("");
  const [newArgEvidence, setNewArgEvidence] = useState("");
  const [newArgCounter, setNewArgCounter] = useState("");

  const svgRef = useRef<SVGSVGElement>(null);

  const activeCharacters = useMemo(() => characters.filter(c => !c.isArchived), [characters]);
  const activeArguments = useMemo(() => argumentsList.filter(a => !a.isArchived), [argumentsList]);

  // Initialize or maintain positions for nodes
  useEffect(() => {
    const list = viewMode === "characters" ? activeCharacters : activeArguments;
    if (list.length === 0) return;

    setNodePositions(prev => {
      const next = { ...prev };
      const centerX = 420;
      const centerY = 280;
      const radiusX = Math.min(320, 160 + list.length * 25);
      const radiusY = Math.min(220, 120 + list.length * 18);

      list.forEach((item, index) => {
        if (!next[item.id]) {
          const angle = (index / list.length) * 2 * Math.PI - Math.PI / 2;
          next[item.id] = {
            x: Math.round(centerX + Math.cos(angle) * radiusX),
            y: Math.round(centerY + Math.sin(angle) * radiusY)
          };
        }
      });
      return next;
    });
  }, [viewMode, activeCharacters, activeArguments]);

  // Active inspected entity
  const activeChar = useMemo(
    () => (viewMode === "characters" ? activeCharacters.find(c => c.id === selectedNodeId) : null),
    [viewMode, activeCharacters, selectedNodeId]
  );

  const activeArg = useMemo(
    () => (viewMode === "arguments" ? activeArguments.find(a => a.id === selectedNodeId) : null),
    [viewMode, activeArguments, selectedNodeId]
  );

  // Find linked chapters
  const linkedSegments = useMemo(() => {
    if (!selectedNodeId) return [];
    if (viewMode === "characters") {
      const char = activeCharacters.find(c => c.id === selectedNodeId);
      if (!char) return [];
      return segments.filter(
        s => s.characterIds?.includes(char.id) || (s.textContent && s.textContent.toLowerCase().includes(char.name.toLowerCase()))
      );
    } else {
      const arg = activeArguments.find(a => a.id === selectedNodeId);
      if (!arg) return [];
      return segments.filter(s => arg.targetSegmentIds?.includes(s.id));
    }
  }, [selectedNodeId, viewMode, activeCharacters, activeArguments, segments]);

  // Edge calculations for characters
  const characterEdges = useMemo(() => {
    const edges: {
      id: string;
      sourceId: string;
      targetId: string;
      type: string;
      tension: number;
      notes?: string;
    }[] = [];

    activeCharacters.forEach(char => {
      char.relationships?.forEach(rel => {
        const existing = edges.find(
          e => (e.sourceId === char.id && e.targetId === rel.targetId) ||
               (e.sourceId === rel.targetId && e.targetId === char.id)
        );
        if (!existing && rel.targetId) {
          edges.push({
            id: `${char.id}-${rel.targetId}`,
            sourceId: char.id,
            targetId: rel.targetId,
            type: rel.relationType,
            tension: rel.tensionLevel || 5,
            notes: rel.notes
          });
        }
      });
    });

    return edges;
  }, [activeCharacters]);

  // Edge calculations for arguments (shared chapter links or dialectic pairs)
  const argumentEdges = useMemo(() => {
    const edges: { id: string; sourceId: string; targetId: string; label: string }[] = [];
    for (let i = 0; i < activeArguments.length; i++) {
      for (let j = i + 1; j < activeArguments.length; j++) {
        const a1 = activeArguments[i];
        const a2 = activeArguments[j];
        const sharedChapters = a1.targetSegmentIds.filter(id => a2.targetSegmentIds.includes(id));
        if (sharedChapters.length > 0) {
          edges.push({
            id: `${a1.id}-${a2.id}`,
            sourceId: a1.id,
            targetId: a2.id,
            label: `${sharedChapters.length} Shared Sec`
          });
        }
      }
    }
    return edges;
  }, [activeArguments]);

  // Dragging handlers
  const handlePointerDownNode = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);

    const pos = nodePositions[nodeId] || { x: 400, y: 250 };
    setDragOffset({
      x: e.clientX / zoom - pos.x,
      y: e.clientY / zoom - pos.y
    });
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      const newX = Math.round(e.clientX / zoom - dragOffset.x);
      const newY = Math.round(e.clientY / zoom - dragOffset.y);
      setNodePositions(prev => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY }
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handlePointerUpCanvas = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleWheelCanvas = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(z => Math.max(0.4, Math.min(2.5, +(z + delta).toFixed(2))));
    }
  };

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === "characters") {
      if (!newCharName.trim()) return;
      const newChar: CharacterEntity = {
        id: `char-${Date.now().toString(36)}`,
        name: newCharName.trim(),
        role: newCharRole,
        description: newCharDesc.trim() || "Dramatis persona in this narrative inquiry.",
        motivation: newCharMotivation.trim() || "Pursues truth through confrontation.",
        arc: newCharArc.trim() || "Transformation through dialectical trial.",
        relationships: []
      };
      if (onAddCharacter) onAddCharacter(newChar);
      setSelectedNodeId(newChar.id);
      setNewCharName("");
      setNewCharDesc("");
      setNewCharMotivation("");
      setNewCharArc("");
    } else {
      if (!newArgClaim.trim()) return;
      const newArg: ArgumentEntity = {
        id: `arg-${Date.now().toString(36)}`,
        claim: newArgClaim.trim(),
        premise: newArgPremise.trim() || "Foundational premise.",
        evidence: newArgEvidence.trim() || "Empirical & textual observation.",
        counterpoints: newArgCounter.trim() || "Potential dialectical objections.",
        targetSegmentIds: segments[0] ? [segments[0].id] : []
      };
      if (onAddArgument) onAddArgument(newArg);
      setSelectedNodeId(newArg.id);
      setNewArgClaim("");
      setNewArgPremise("");
      setNewArgEvidence("");
      setNewArgCounter("");
    }
    setIsAddModalOpen(false);
  };

  const getRoleColors = (role: string) => {
    switch (role) {
      case "protagonist":
        return { border: "#7E9F86", fill: "rgba(126, 159, 134, 0.15)", text: "#7E9F86", badge: "Protagonist" };
      case "antagonist":
      case "foil":
        return { border: "#BF614B", fill: "rgba(191, 97, 75, 0.15)", text: "#BF614B", badge: role === "antagonist" ? "Antagonist" : "Foil" };
      case "mentor":
        return { border: "#C8A051", fill: "rgba(200, 160, 81, 0.15)", text: "#C8A051", badge: "Mentor" };
      default:
        return { border: "#6B8FA3", fill: "rgba(107, 143, 163, 0.15)", text: "#6B8FA3", badge: "Supporting" };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-[#ECE7DE] rounded-xl border border-[#202024] overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#202024] bg-[#101012] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7E9F86]/15 border border-[#7E9F86]/30 flex items-center justify-center text-[#7E9F86]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-[#ECE7DE]">
              {viewMode === "characters" ? "Character & Relational Dynamic Network" : "Dialectical Argument Topology"}
            </h2>
            <p className="text-[11px] text-[#66625B]">
              Draggable node canvas with real tension links and chapter references
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#080808] p-0.5 rounded-lg border border-[#202024]">
            <button
              onClick={() => setViewMode("characters")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "characters"
                  ? "bg-[#202024] text-[#ECE7DE]"
                  : "text-[#66625B] hover:text-[#A09A8F]"
              }`}
            >
              Characters ({activeCharacters.length})
            </button>
            <button
              onClick={() => setViewMode("arguments")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "arguments"
                  ? "bg-[#202024] text-[#ECE7DE]"
                  : "text-[#66625B] hover:text-[#A09A8F]"
              }`}
            >
              Arguments ({activeArguments.length})
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#080808] rounded-lg border border-[#202024] px-1 py-0.5">
            <button
              onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(2)))}
              className="p-1 hover:text-[#ECE7DE] text-[#66625B] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-[#8E8E93]">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2)))}
              className="p-1 hover:text-[#ECE7DE] text-[#66625B] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 hover:text-[#ECE7DE] text-[#66625B] transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Entity Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C8A051]/20 border border-[#C8A051]/40 text-[#C8A051] hover:bg-[#C8A051]/30 transition-colors text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{viewMode === "characters" ? "Add Character" : "Add Thesis"}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspector Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SVG Interactive Canvas */}
        <div
          className="flex-1 relative bg-[#070708] overflow-hidden select-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDownCanvas}
          onPointerMove={handlePointerMoveCanvas}
          onPointerUp={handlePointerUpCanvas}
          onWheel={handleWheelCanvas}
        >
          {/* Subtle graph background grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#C8A051 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              transform: `translate(${pan.x % 28}px, ${pan.y % 28}px)`
            }}
          />

          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0"
            }}
          >
            {/* Render Links / Edges */}
            {viewMode === "characters" ? (
              <g className="edges">
                {characterEdges.map(edge => {
                  const p1 = nodePositions[edge.sourceId];
                  const p2 = nodePositions[edge.targetId];
                  if (!p1 || !p2) return null;

                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;

                  return (
                    <g key={edge.id} className="group">
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={edge.tension > 6 ? "#BF614B" : "#353540"}
                        strokeWidth={Math.max(1.5, edge.tension / 3)}
                        strokeDasharray={edge.type === "rival" || edge.type === "opposing" ? "4 4" : undefined}
                      />
                      {/* Midpoint Label Badge */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-32"
                          y="-10"
                          width="64"
                          height="20"
                          rx="5"
                          fill="#121215"
                          stroke="#2a2a32"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fill="#8E8E93"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {edge.type} ({edge.tension})
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            ) : (
              <g className="edges">
                {argumentEdges.map(edge => {
                  const p1 = nodePositions[edge.sourceId];
                  const p2 = nodePositions[edge.targetId];
                  if (!p1 || !p2) return null;

                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;

                  return (
                    <g key={edge.id}>
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#2a3830"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-34"
                          y="-9"
                          width="68"
                          height="18"
                          rx="4"
                          fill="#101814"
                          stroke="#223528"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fill="#7E9F86"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {edge.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Render Nodes */}
            {viewMode === "characters" ? (
              <g className="nodes">
                {activeCharacters.map(char => {
                  const pos = nodePositions[char.id] || { x: 400, y: 250 };
                  const isSelected = selectedNodeId === char.id;
                  const colors = getRoleColors(char.role);

                  return (
                    <g
                      key={char.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onPointerDown={e => handlePointerDownNode(e, char.id)}
                      className="cursor-pointer"
                    >
                      {/* Glow selection ring */}
                      {isSelected && (
                        <circle
                          r="34"
                          fill="none"
                          stroke={colors.border}
                          strokeWidth="2"
                          strokeOpacity="0.8"
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Node Bubble */}
                      <circle
                        r="26"
                        fill="#121215"
                        stroke={colors.border}
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                      />

                      {/* Character Initial */}
                      <text
                        textAnchor="middle"
                        y="6"
                        fill={colors.text}
                        fontSize="15"
                        fontWeight="bold"
                        fontFamily="serif"
                      >
                        {char.name.charAt(0).toUpperCase()}
                      </text>

                      {/* Character Name Pill below node */}
                      <g transform="translate(0, 42)">
                        <rect
                          x="-50"
                          y="-10"
                          width="100"
                          height="20"
                          rx="4"
                          fill="#0D0D10"
                          stroke={isSelected ? colors.border : "#222226"}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fill="#ECE7DE"
                          fontSize="10"
                          fontWeight="500"
                        >
                          {char.name.length > 13 ? `${char.name.slice(0, 12)}…` : char.name}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            ) : (
              <g className="nodes">
                {activeArguments.map(arg => {
                  const pos = nodePositions[arg.id] || { x: 400, y: 250 };
                  const isSelected = selectedNodeId === arg.id;

                  return (
                    <g
                      key={arg.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onPointerDown={e => handlePointerDownNode(e, arg.id)}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <rect
                          x="-84"
                          y="-32"
                          width="168"
                          height="64"
                          rx="10"
                          fill="none"
                          stroke="#7E9F86"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                      )}
                      <rect
                        x="-80"
                        y="-28"
                        width="160"
                        height="56"
                        rx="8"
                        fill="#101014"
                        stroke={isSelected ? "#7E9F86" : "#24242e"}
                        strokeWidth={isSelected ? "2" : "1"}
                      />
                      <text
                        textAnchor="middle"
                        y="-10"
                        fill="#7E9F86"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        THESIS NODE
                      </text>
                      <text
                        textAnchor="middle"
                        y="10"
                        fill="#ECE7DE"
                        fontSize="11"
                        fontFamily="serif"
                        fontWeight="500"
                      >
                        {arg.claim.length > 20 ? `${arg.claim.slice(0, 19)}…` : arg.claim}
                      </text>
                      <text
                        textAnchor="middle"
                        y="22"
                        fill="#66625B"
                        fontSize="9"
                      >
                        {arg.targetSegmentIds.length} Linked Chapters
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* Canvas Help Hint */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#101014]/90 border border-[#202026] text-[10px] text-[#66625B] pointer-events-none">
            Drag nodes to rearrange · Drag canvas to pan · Ctrl+Wheel to zoom
          </div>
        </div>

        {/* Right Inspector Panel */}
        <div className="w-84 border-l border-[#202024] bg-[#0d0d10] p-5 overflow-y-auto flex flex-col justify-between shrink-0">
          {viewMode === "characters" && activeChar ? (
            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border"
                    style={{
                      borderColor: getRoleColors(activeChar.role).border,
                      color: getRoleColors(activeChar.role).text,
                      backgroundColor: getRoleColors(activeChar.role).fill
                    }}
                  >
                    {activeChar.role}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-medium text-[#ECE7DE]">{activeChar.name}</h3>
                <p className="text-xs text-[#8E8E93] mt-1.5 leading-relaxed">{activeChar.description}</p>
              </div>

              {/* Motivation */}
              <div className="border-t border-[#1c1c22] pt-3.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#66625B] block mb-1.5">
                  Core Motivation
                </span>
                <p className="text-xs text-[#ECE7DE] bg-[#131317] p-3 rounded-lg border border-[#202026] leading-relaxed">
                  {activeChar.motivation || "No defined motivation recorded."}
                </p>
              </div>

              {/* Transformation Arc */}
              <div className="border-t border-[#1c1c22] pt-3.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#66625B] block mb-1.5">
                  Thematic Arc
                </span>
                <p className="text-xs text-[#ECE7DE] bg-[#131317] p-3 rounded-lg border border-[#202026] leading-relaxed">
                  {activeChar.arc || "No specific arc trajectory assigned."}
                </p>
              </div>

              {/* Linked Chapters (Jump to Manuscript Editor) */}
              <div className="border-t border-[#1c1c22] pt-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#C8A051] flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    Appears in Chapters ({linkedSegments.length})
                  </span>
                </div>
                {linkedSegments.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {linkedSegments.map(seg => (
                      <div
                        key={seg.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#141418] border border-[#222228] hover:border-[#353540] transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-serif text-xs text-[#ECE7DE] block truncate">
                            Section {seg.romanNumeral} · {seg.title}
                          </span>
                        </div>
                        {onSelectSegment && (
                          <button
                            onClick={() => onSelectSegment(seg.id)}
                            className="p-1 rounded bg-[#202026] text-[#A09A8F] hover:text-[#ECE7DE] hover:bg-[#2c2c36] transition-colors shrink-0"
                            title="Open this chapter in Manuscript Editor"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#55524d] italic">
                    Not currently referenced in any chapter text.
                  </p>
                )}
              </div>

              {/* Relationships */}
              {activeChar.relationships?.length > 0 && (
                <div className="border-t border-[#1c1c22] pt-3.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#66625B] block mb-2">
                    Relational Dynamics & Tensions
                  </span>
                  <div className="space-y-2">
                    {activeChar.relationships.map((rel, idx) => {
                      const counterpart = activeCharacters.find(c => c.id === rel.targetId);
                      return (
                        <div
                          key={idx}
                          onClick={() => counterpart && setSelectedNodeId(counterpart.id)}
                          className="p-2.5 rounded-lg bg-[#141418] border border-[#222228] hover:border-[#353540] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[#ECE7DE]">
                              {counterpart?.name || "Counterpart"}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#BF614B]/20 text-[#BF614B]">
                              Tension {rel.tensionLevel}/10
                            </span>
                          </div>
                          <span className="text-[11px] text-[#8E8E93] capitalize">
                            Relation: {rel.relationType}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === "arguments" && activeArg ? (
            <div className="space-y-5">
              {/* Header */}
              <div>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#7E9F86]/15 border border-[#7E9F86]/30 text-[#7E9F86]">
                  Dialectical Thesis
                </span>
                <h3 className="font-serif text-base font-medium text-[#ECE7DE] mt-2 leading-snug">
                  {activeArg.claim}
                </h3>
              </div>

              {/* Premise */}
              <div className="border-t border-[#1c1c22] pt-3.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#66625B] block mb-1.5">
                  Premise & Rationale
                </span>
                <p className="text-xs text-[#ECE7DE] bg-[#131317] p-3 rounded-lg border border-[#202026] leading-relaxed">
                  {activeArg.premise}
                </p>
              </div>

              {/* Evidence */}
              <div className="border-t border-[#1c1c22] pt-3.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#66625B] block mb-1.5">
                  Supporting Evidence
                </span>
                <p className="text-xs text-[#ECE7DE] bg-[#131317] p-3 rounded-lg border border-[#202026] leading-relaxed">
                  {activeArg.evidence}
                </p>
              </div>

              {/* Counterpoints */}
              <div className="border-t border-[#1c1c22] pt-3.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#BF614B] flex items-center gap-1.5 mb-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  Antithesis & Objections
                </span>
                <p className="text-xs text-[#A09A8F] bg-[#131317] p-3 rounded-lg border border-[#202026] leading-relaxed">
                  {activeArg.counterpoints}
                </p>
              </div>

              {/* Linked Chapters */}
              <div className="border-t border-[#1c1c22] pt-3.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#C8A051] flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3 h-3" />
                  Examined in Chapters ({linkedSegments.length})
                </span>
                {linkedSegments.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {linkedSegments.map(seg => (
                      <div
                        key={seg.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#141418] border border-[#222228] hover:border-[#353540] transition-colors"
                      >
                        <span className="font-serif text-xs text-[#ECE7DE] truncate pr-2">
                          Section {seg.romanNumeral} · {seg.title}
                        </span>
                        {onSelectSegment && (
                          <button
                            onClick={() => onSelectSegment(seg.id)}
                            className="p-1 rounded bg-[#202026] text-[#A09A8F] hover:text-[#ECE7DE] hover:bg-[#2c2c36] transition-colors shrink-0"
                            title="Open chapter in editor"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#55524d] italic">
                    Not linked to any chapters yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#66625B] space-y-2">
              <Compass className="w-8 h-8 text-[#33333d]" />
              <p>Click any node on the canvas to inspect its relational dynamics, motivation, and linked chapters</p>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121215] border border-[#222228] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#ECE7DE]">
                {viewMode === "characters" ? "Add Character Entity" : "Add Dialectical Thesis"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#66625B] hover:text-[#ECE7DE] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-4">
              {viewMode === "characters" ? (
                <>
                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Character Name *</label>
                    <input
                      type="text"
                      required
                      value={newCharName}
                      onChange={e => setNewCharName(e.target.value)}
                      placeholder="e.g. Helena Vance"
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Dramatic Role</label>
                    <select
                      value={newCharRole}
                      onChange={e => setNewCharRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    >
                      <option value="protagonist">Protagonist</option>
                      <option value="antagonist">Antagonist</option>
                      <option value="foil">Foil</option>
                      <option value="mentor">Mentor</option>
                      <option value="supporting">Supporting</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newCharDesc}
                      onChange={e => setNewCharDesc(e.target.value)}
                      placeholder="Physical presence and social role..."
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Core Motivation</label>
                    <input
                      type="text"
                      value={newCharMotivation}
                      onChange={e => setNewCharMotivation(e.target.value)}
                      placeholder="What internal or external force drives them?"
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Thesis / Claim *</label>
                    <input
                      type="text"
                      required
                      value={newArgClaim}
                      onChange={e => setNewArgClaim(e.target.value)}
                      placeholder="The central philosophical assertion..."
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Underlying Premise</label>
                    <textarea
                      rows={2}
                      value={newArgPremise}
                      onChange={e => setNewArgPremise(e.target.value)}
                      placeholder="The deductive or inductive reason..."
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Concrete Evidence</label>
                    <input
                      type="text"
                      value={newArgEvidence}
                      onChange={e => setNewArgEvidence(e.target.value)}
                      placeholder="Textual citation or observation..."
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#A09A8F] block mb-1">Potential Counterpoint</label>
                    <input
                      type="text"
                      value={newArgCounter}
                      onChange={e => setNewArgCounter(e.target.value)}
                      placeholder="Antithesis or counter-objection..."
                      className="w-full px-3 py-2 bg-[#0c0c0e] border border-[#222228] rounded-lg text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1c1c22]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs text-[#8E8E93] hover:text-[#ECE7DE] hover:bg-[#18181c] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C8A051] hover:bg-[#D4AF37] text-[#0A0A0C] font-semibold text-xs transition-colors"
                >
                  Create & Place on Graph
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
