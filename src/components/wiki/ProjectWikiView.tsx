import React, { useState } from "react";
import {
  Project,
  ProjectWiki,
  CharacterEntity,
  ArgumentEntity,
  PlotPointEntity,
  Segment
} from "../../types/workspace";
import {
  BookOpen,
  Users,
  MessageSquare,
  Compass,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers
} from "lucide-react";

interface ProjectWikiViewProps {
  project: Project;
  wiki: ProjectWiki;
  segments: Segment[];
  onUpdateWiki: (updatedWiki: ProjectWiki) => void;
  onSoftDelete: (id: string, entityType: any, name: string) => void;
}

export const ProjectWikiView: React.FC<ProjectWikiViewProps> = ({
  project,
  wiki,
  segments,
  onUpdateWiki,
  onSoftDelete
}) => {
  const [activeTab, setActiveTab] = useState<"theme" | "characters" | "arguments" | "plotPoints" | "structure">("theme");

  // Character Add State
  const [isAddingChar, setIsAddingChar] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState<CharacterEntity["role"]>("protagonist");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [newCharMotivation, setNewCharMotivation] = useState("");

  // Argument Add State
  const [isAddingArg, setIsAddingArg] = useState(false);
  const [newArgClaim, setNewArgClaim] = useState("");
  const [newArgPremise, setNewArgPremise] = useState("");
  const [newArgEvidence, setNewArgEvidence] = useState("");

  // Plot Point Add State
  const [isAddingPlotPoint, setIsAddingPlotPoint] = useState(false);
  const [newPlotTitle, setNewPlotTitle] = useState("");
  const [newPlotAct, setNewPlotAct] = useState<PlotPointEntity["act"]>("Act I");
  const [newPlotBeat, setNewPlotBeat] = useState<PlotPointEntity["beatType"]>("catalyst");
  const [newPlotDesc, setNewPlotDesc] = useState("");

  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    const newChar: CharacterEntity = {
      id: `char-${Date.now().toString(36)}`,
      name: newCharName.trim(),
      role: newCharRole,
      description: newCharDesc.trim(),
      motivation: newCharMotivation.trim(),
      arc: "Developing...",
      relationships: []
    };
    onUpdateWiki({
      ...wiki,
      characters: [...wiki.characters, newChar]
    });
    setNewCharName("");
    setNewCharDesc("");
    setNewCharMotivation("");
    setIsAddingChar(false);
  };

  const handleAddArgument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArgClaim.trim()) return;
    const newArg: ArgumentEntity = {
      id: `arg-${Date.now().toString(36)}`,
      claim: newArgClaim.trim(),
      premise: newArgPremise.trim(),
      evidence: newArgEvidence.trim(),
      counterpoints: "Under active investigation",
      targetSegmentIds: []
    };
    onUpdateWiki({
      ...wiki,
      arguments: [...wiki.arguments, newArg]
    });
    setNewArgClaim("");
    setNewArgPremise("");
    setNewArgEvidence("");
    setIsAddingArg(false);
  };

  const handleAddPlotPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlotTitle.trim()) return;
    const newPoint: PlotPointEntity = {
      id: `pp-${Date.now().toString(36)}`,
      title: newPlotTitle.trim(),
      act: newPlotAct,
      beatType: newPlotBeat,
      description: newPlotDesc.trim(),
      order: wiki.plotPoints.length + 1
    };
    onUpdateWiki({
      ...wiki,
      plotPoints: [...wiki.plotPoints, newPoint]
    });
    setNewPlotTitle("");
    setNewPlotDesc("");
    setIsAddingPlotPoint(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ECE7DE] rounded-xl border border-[#202020] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6B8FA3]/10 flex items-center justify-center text-[#6B8FA3]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide">Project Wiki & Story Bible: {project.title}</h2>
            <p className="text-xs text-[#66625B]">
              Actionable repository of themes, entities, arguments, plot milestones, and macro structure
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-lg border border-[#202020]">
          <button
            onClick={() => setActiveTab("theme")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "theme" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Theme & Premise
          </button>
          <button
            onClick={() => setActiveTab("characters")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "characters" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Characters ({wiki.characters.filter(c => !c.isArchived).length})
          </button>
          <button
            onClick={() => setActiveTab("arguments")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "arguments" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Arguments ({wiki.arguments.filter(a => !a.isArchived).length})
          </button>
          <button
            onClick={() => setActiveTab("plotPoints")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "plotPoints" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Plot Points ({wiki.plotPoints.filter(p => !p.isArchived).length})
          </button>
          <button
            onClick={() => setActiveTab("structure")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "structure" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Macro Structure
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* THEME & PREMISE */}
        {activeTab === "theme" && (
          <div className="max-w-3xl space-y-6">
            <div className="p-5 rounded-xl border border-[#202020] bg-[#101010] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E9F86]">
                Central Inquiry / Core Premise
              </span>
              <textarea
                value={wiki.themeAndPremise.centralInquiry}
                onChange={e =>
                  onUpdateWiki({
                    ...wiki,
                    themeAndPremise: { ...wiki.themeAndPremise, centralInquiry: e.target.value }
                  })
                }
                className="w-full bg-[#080808] border border-[#202020] rounded-lg p-3 text-sm font-serif text-[#ECE7DE] leading-relaxed focus:outline-none"
                rows={3}
              />
            </div>

            <div className="p-5 rounded-xl border border-[#202020] bg-[#101010] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B8FA3]">
                Promise to the Reader
              </span>
              <textarea
                value={wiki.themeAndPremise.readerPromise}
                onChange={e =>
                  onUpdateWiki({
                    ...wiki,
                    themeAndPremise: { ...wiki.themeAndPremise, readerPromise: e.target.value }
                  })
                }
                className="w-full bg-[#080808] border border-[#202020] rounded-lg p-3 text-sm text-[#A09A8F] leading-relaxed focus:outline-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[#202020] bg-[#101010]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-1">
                  Genre
                </span>
                <span className="text-sm font-medium capitalize text-[#ECE7DE]">
                  {wiki.themeAndPremise.genre}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-[#202020] bg-[#101010]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-1">
                  Voice & Tone
                </span>
                <span className="text-sm font-medium text-[#ECE7DE]">
                  {wiki.themeAndPremise.tone}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-[#202020] bg-[#101010]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-1">
                  Target Length
                </span>
                <span className="text-sm font-medium text-[#ECE7DE]">
                  {wiki.themeAndPremise.targetLength}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CHARACTERS & ENTITIES */}
        {activeTab === "characters" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddingChar(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-medium hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Character Entity</span>
              </button>
            </div>

            {isAddingChar && (
              <form onSubmit={handleAddCharacter} className="p-5 rounded-xl border border-[#6B8FA3] bg-[#141414] space-y-3">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B8FA3]">
                  New Dramatis Persona / Archetype
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newCharName}
                    onChange={e => setNewCharName(e.target.value)}
                    className="bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                    required
                  />
                  <select
                    value={newCharRole}
                    onChange={e => setNewCharRole(e.target.value as any)}
                    className="bg-[#080808] border border-[#202020] text-xs text-[#A09A8F] px-3 py-2 rounded-lg focus:outline-none"
                  >
                    <option value="protagonist">Protagonist / Main Voice</option>
                    <option value="antagonist">Antagonist</option>
                    <option value="foil">Foil / Counter-force</option>
                    <option value="supporting">Supporting Entity</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Description & role in the story/essay"
                  value={newCharDesc}
                  onChange={e => setNewCharDesc(e.target.value)}
                  className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Core motivation & inner friction"
                  value={newCharMotivation}
                  onChange={e => setNewCharMotivation(e.target.value)}
                  className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingChar(false)}
                    className="px-3 py-1.5 text-xs text-[#66625B] hover:text-[#A09A8F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#6B8FA3] text-[#080808] text-xs font-medium hover:bg-[#85a8bc]"
                  >
                    Save Character
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 gap-4">
              {wiki.characters.filter(c => !c.isArchived).map(char => (
                <div
                  key={char.id}
                  className="p-5 rounded-xl border border-[#202020] bg-[#101010] flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c1c1c] text-[#A09A8F]">
                        {char.role}
                      </span>
                      <button
                        onClick={() => onSoftDelete(char.id, "character", char.name)}
                        className="text-[#66625B] hover:text-[#BF614B] p-1 rounded transition-colors"
                        title="Archive (Soft Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-serif text-lg font-medium text-[#ECE7DE]">{char.name}</h3>
                    <p className="text-xs text-[#A09A8F] mt-1">{char.description}</p>
                  </div>
                  <div className="pt-3 border-t border-[#1c1c1c] text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#66625B] block mb-1">
                      Motivation:
                    </span>
                    <span className="text-[#ECE7DE]">{char.motivation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ARGUMENTS & CLAIMS */}
        {activeTab === "arguments" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddingArg(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-medium hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Argument Node</span>
              </button>
            </div>

            {isAddingArg && (
              <form onSubmit={handleAddArgument} className="p-5 rounded-xl border border-[#7E9F86] bg-[#141414] space-y-3">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#7E9F86]">
                  New Dialectical Argument / Thesis
                </h4>
                <input
                  type="text"
                  placeholder="Primary Claim (e.g. Surface clarity often conceals fragility)"
                  value={newArgClaim}
                  onChange={e => setNewArgClaim(e.target.value)}
                  className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Philosophical Premise"
                  value={newArgPremise}
                  onChange={e => setNewArgPremise(e.target.value)}
                  className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Concrete Evidentiary Grounding"
                  value={newArgEvidence}
                  onChange={e => setNewArgEvidence(e.target.value)}
                  className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingArg(false)}
                    className="px-3 py-1.5 text-xs text-[#66625B] hover:text-[#A09A8F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#7E9F86] text-[#080808] text-xs font-medium hover:bg-[#8eb397]"
                  >
                    Save Argument
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {wiki.arguments.filter(a => !a.isArchived).map(arg => (
                <div
                  key={arg.id}
                  className="p-5 rounded-xl border border-[#202020] bg-[#101010] flex items-start justify-between"
                >
                  <div className="space-y-2 max-w-2xl">
                    <span className="text-[10px] font-mono text-[#7E9F86] uppercase block">
                      Thesis Claim
                    </span>
                    <h3 className="font-serif text-base font-medium text-[#ECE7DE]">{arg.claim}</h3>
                    <p className="text-xs text-[#A09A8F]">
                      <strong className="text-[#66625B]">Premise:</strong> {arg.premise}
                    </p>
                    <p className="text-xs text-[#A09A8F]">
                      <strong className="text-[#66625B]">Evidence:</strong> {arg.evidence}
                    </p>
                  </div>
                  <button
                    onClick={() => onSoftDelete(arg.id, "argument", arg.claim)}
                    className="text-[#66625B] hover:text-[#BF614B] p-1.5 rounded transition-colors"
                    title="Archive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLOT POINTS & BEATS */}
        {activeTab === "plotPoints" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddingPlotPoint(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-medium hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Beat Milestone</span>
              </button>
            </div>

            {isAddingPlotPoint && (
              <form onSubmit={handleAddPlotPoint} className="p-5 rounded-xl border border-[#C8A051] bg-[#141414] space-y-3">
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#C8A051]">
                  New Narrative Beat
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Beat Title"
                    value={newPlotTitle}
                    onChange={e => setNewPlotTitle(e.target.value)}
                    className="bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none"
                    required
                  />
                  <select
                    value={newPlotAct}
                    onChange={e => setNewPlotAct(e.target.value as any)}
                    className="bg-[#080808] border border-[#202020] text-xs text-[#A09A8F] px-3 py-2 rounded-lg focus:outline-none"
                  >
                    <option value="Act I">Act I</option>
                    <option value="Act II-A">Act II-A</option>
                    <option value="Act II-B">Act II-B</option>
                    <option value="Act III">Act III</option>
                  </select>
                  <select
                    value={newPlotBeat}
                    onChange={e => setNewPlotBeat(e.target.value as any)}
                    className="bg-[#080808] border border-[#202020] text-xs text-[#A09A8F] px-3 py-2 rounded-lg focus:outline-none"
                  >
                    <option value="catalyst">Catalyst</option>
                    <option value="midpoint">Midpoint</option>
                    <option value="all_is_lost">All Is Lost</option>
                    <option value="climax">Climax</option>
                    <option value="resolution">Resolution</option>
                    <option value="argument_advance">Argument Advance</option>
                  </select>
                </div>
                <textarea
                  placeholder="Beat description"
                  value={newPlotDesc}
                  onChange={e => setNewPlotDesc(e.target.value)}
                  className="w-full bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] p-3 rounded-lg focus:outline-none"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingPlotPoint(false)}
                    className="px-3 py-1.5 text-xs text-[#66625B] hover:text-[#A09A8F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#C8A051] text-[#080808] text-xs font-medium hover:bg-[#d6b063]"
                  >
                    Save Beat
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {wiki.plotPoints
                .filter(p => !p.isArchived)
                .sort((a, b) => a.order - b.order)
                .map(point => (
                  <div
                    key={point.id}
                    className="p-5 rounded-xl border border-[#202020] bg-[#101010] flex items-center justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-[#181818] border border-[#282828] flex items-center justify-center font-mono text-xs text-[#ECE7DE]">
                        {point.order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c1c1c] text-[#C8A051]">
                            {point.act} · {point.beatType}
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-medium text-[#ECE7DE]">{point.title}</h4>
                        <p className="text-xs text-[#A09A8F] mt-1">{point.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSoftDelete(point.id, "plotPoint", point.title)}
                      className="text-[#66625B] hover:text-[#BF614B] p-1.5 rounded transition-colors"
                      title="Archive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* MACRO STRUCTURE */}
        {activeTab === "structure" && (
          <div className="max-w-3xl space-y-6">
            <div className="p-4 rounded-xl border border-[#202020] bg-[#101010] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#6B8FA3]">Architectural Framework</span>
                <h3 className="font-serif text-base font-medium text-[#ECE7DE] capitalize mt-0.5">
                  {wiki.macroStructure.framework.replace(/_/g, " ")}
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {wiki.macroStructure.acts.map((act, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-[#202020] bg-[#101010] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-base font-medium text-[#ECE7DE]">{act.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#1c1c1c] text-[#7E9F86]">
                      Target Pacing: {act.targetPacing}
                    </span>
                  </div>
                  <p className="text-xs text-[#A09A8F] leading-relaxed">{act.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
