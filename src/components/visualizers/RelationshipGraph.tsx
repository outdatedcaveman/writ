import React, { useState } from "react";
import { CharacterEntity, ArgumentEntity } from "../../types/workspace";
import { Users, Sparkles, ChevronRight, ShieldAlert } from "lucide-react";

interface RelationshipGraphProps {
  characters: CharacterEntity[];
  argumentsList: ArgumentEntity[];
  genre: string;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  characters,
  argumentsList,
  genre
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    characters[0]?.id || argumentsList[0]?.id || null
  );
  const [viewMode, setViewMode] = useState<"characters" | "arguments">(
    genre === "fiction" ? "characters" : "arguments"
  );

  const activeChar = characters.find(c => c.id === selectedNodeId);
  const activeArg = argumentsList.find(a => a.id === selectedNodeId);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ECE7DE] rounded-xl border border-[#202020] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7E9F86]/10 flex items-center justify-center text-[#7E9F86]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide">
              {viewMode === "characters" ? "Character & Dramatis Personae Dynamics" : "Conceptual Argument Network"}
            </h2>
            <p className="text-xs text-[#66625B]">
              Interactive relational topology, tensions, and structural dependencies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#080808] p-1 rounded-lg border border-[#202020]">
          <button
            onClick={() => setViewMode("characters")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "characters"
                ? "bg-[#202020] text-[#ECE7DE]"
                : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Entities ({characters.filter(c => !c.isArchived).length})
          </button>
          <button
            onClick={() => setViewMode("arguments")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "arguments"
                ? "bg-[#202020] text-[#ECE7DE]"
                : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Arguments ({argumentsList.filter(a => !a.isArchived).length})
          </button>
        </div>
      </div>

      {/* Main interactive diagram area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visual Graph Canvas / Nodes */}
        <div className="flex-1 relative p-8 flex flex-col justify-center items-center bg-[#090909]">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ECE7DE 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }}
          />

          {viewMode === "characters" ? (
            <div className="relative w-full max-w-xl h-80 flex items-center justify-around">
              {/* Central connection line */}
              <div className="absolute top-1/2 left-20 right-20 h-0.5 bg-gradient-to-r from-[#7E9F86]/40 via-[#BF614B]/50 to-[#6B8FA3]/40 -translate-y-1/2" />

              {characters
                .filter(c => !c.isArchived)
                .map((char, index) => {
                  const isSelected = selectedNodeId === char.id;
                  const roleBadgeColor =
                    char.role === "protagonist"
                      ? "border-[#7E9F86] text-[#7E9F86] bg-[#7E9F86]/10"
                      : char.role === "foil" || char.role === "antagonist"
                      ? "border-[#BF614B] text-[#BF614B] bg-[#BF614B]/10"
                      : "border-[#6B8FA3] text-[#6B8FA3] bg-[#6B8FA3]/10";

                  return (
                    <button
                      key={char.id}
                      onClick={() => setSelectedNodeId(char.id)}
                      className={`relative z-10 flex flex-col items-center p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-[#181818] border-[#ECE7DE] shadow-xl scale-105"
                          : "bg-[#101010] border-[#242424] hover:border-[#383838] opacity-85 hover:opacity-100"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-serif text-lg font-bold mb-3 ${roleBadgeColor}`}>
                        {char.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{char.name}</span>
                      <span className="text-[11px] uppercase tracking-wider text-[#66625B] mt-1">
                        {char.role}
                      </span>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="w-full max-w-2xl space-y-4">
              {argumentsList
                .filter(a => !a.isArchived)
                .map(arg => {
                  const isSelected = selectedNodeId === arg.id;
                  return (
                    <button
                      key={arg.id}
                      onClick={() => setSelectedNodeId(arg.id)}
                      className={`w-full text-left p-5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-[#181818] border-[#7E9F86] shadow-lg"
                          : "bg-[#101010] border-[#202020] hover:border-[#303030]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-[#7E9F86]">Thesis Node</span>
                        <span className="text-xs text-[#66625B]">{arg.targetSegmentIds.length} Linked Chapters</span>
                      </div>
                      <h3 className="font-serif text-base text-[#ECE7DE] leading-snug">{arg.claim}</h3>
                      <p className="text-xs text-[#A09A8F] mt-2 line-clamp-2">{arg.premise}</p>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right Detail Inspector Panel */}
        <div className="w-80 border-l border-[#202020] bg-[#101010] p-6 overflow-y-auto">
          {viewMode === "characters" && activeChar ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#202020] text-[#A09A8F]">
                    {activeChar.role}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-medium text-[#ECE7DE]">{activeChar.name}</h3>
                <p className="text-xs text-[#A09A8F] mt-2 leading-relaxed">{activeChar.description}</p>
              </div>

              <div className="border-t border-[#202020] pt-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-2">
                  Core Motivation
                </h4>
                <p className="text-xs text-[#ECE7DE] leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#202020]">
                  {activeChar.motivation}
                </p>
              </div>

              <div className="border-t border-[#202020] pt-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-2">
                  Development Arc
                </h4>
                <p className="text-xs text-[#ECE7DE] leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#202020]">
                  {activeChar.arc}
                </p>
              </div>

              {activeChar.relationships.length > 0 && (
                <div className="border-t border-[#202020] pt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-3">
                    Relational Dynamics & Tension
                  </h4>
                  {activeChar.relationships.map((rel, idx) => {
                    const target = characters.find(c => c.id === rel.targetId);
                    return (
                      <div key={idx} className="bg-[#141414] p-3 rounded-lg border border-[#202020] mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[#ECE7DE]">{target?.name || "Counterpart"}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#BF614B]/20 text-[#BF614B] font-mono">
                            Tension: {rel.tensionLevel}/10
                          </span>
                        </div>
                        <span className="text-[11px] text-[#A09A8F] capitalize">Relationship: {rel.relationType}</span>
                        {rel.notes && <p className="text-[11px] text-[#66625B] mt-1">{rel.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : viewMode === "arguments" && activeArg ? (
            <div className="space-y-6">
              <div>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-[#7E9F86]/10 text-[#7E9F86]">
                  Dialectical Thesis
                </span>
                <h3 className="font-serif text-lg font-medium text-[#ECE7DE] mt-2">{activeArg.claim}</h3>
              </div>

              <div className="border-t border-[#202020] pt-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-2">
                  Philosophical Premise
                </h4>
                <p className="text-xs text-[#ECE7DE] leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#202020]">
                  {activeArg.premise}
                </p>
              </div>

              <div className="border-t border-[#202020] pt-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#66625B] mb-2">
                  Concrete Evidence Base
                </h4>
                <p className="text-xs text-[#ECE7DE] leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#202020]">
                  {activeArg.evidence}
                </p>
              </div>

              <div className="border-t border-[#202020] pt-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#BF614B] mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Potential Counter-Arguments
                </h4>
                <p className="text-xs text-[#A09A8F] leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#202020]">
                  {activeArg.counterpoints}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-[#66625B]">
              Select a node to inspect its structural dynamics
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
