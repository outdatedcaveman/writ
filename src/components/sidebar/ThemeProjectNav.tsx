import React, { useState } from "react";
import {
  ThemeCollection,
  Project,
  Segment,
  TrashItem
} from "../../types/workspace";
import { VersionDAG } from "../../types/versionControl";
import {
  BookOpen,
  FolderTree,
  GitFork,
  Trash2,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  Archive,
  Compass,
  Inbox
} from "lucide-react";

interface ThemeProjectNavProps {
  themes: ThemeCollection[];
  projects: Project[];
  activeProjectId: string;
  activeSegmentId: string | null;
  segments: Segment[];
  versionDag: VersionDAG;
  trashCount: number;
  vaultItemCount: number;
  activeView: "editor" | "wiki" | "diagrams" | "timeline" | "threads" | "projectVault" | "vault";
  onSelectProject: (projectId: string) => void;
  onSelectSegment: (segmentId: string) => void;
  onSelectView: (view: "editor" | "wiki" | "diagrams" | "timeline" | "threads" | "projectVault" | "vault") => void;
  onOpenVcsModal: () => void;
  onOpenTrashModal: () => void;
  onNewProject: () => void;
  onNewSegment: () => void;
}

export const ThemeProjectNav: React.FC<ThemeProjectNavProps> = ({
  themes,
  projects,
  activeProjectId,
  activeSegmentId,
  segments,
  versionDag,
  trashCount,
  vaultItemCount,
  activeView,
  onSelectProject,
  onSelectSegment,
  onSelectView,
  onOpenVcsModal,
  onOpenTrashModal,
  onNewProject,
  onNewSegment
}) => {
  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeSegments = segments.filter(s => !s.isArchived).sort((a, b) => a.order - b.order);
  const commitCount = Object.keys(versionDag?.commits || {}).length;

  return (
    <aside className="w-72 bg-[#0a0a0a] text-[#ECE7DE] border-r border-[#1c1c1c] flex flex-col justify-between select-none shrink-0 h-full">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col overflow-y-auto">
        {/* Brand Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1c1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#ECE7DE] text-[#080808] flex items-center justify-center font-serif font-bold text-xs">
              W
            </div>
            <span className="font-serif text-sm font-medium tracking-wider">WRIT STUDIO</span>
          </div>
          <span className="text-[10px] font-mono text-[#66625B] px-1.5 py-0.5 rounded bg-[#161616]">
            v1.0-desktop
          </span>
        </div>

        {/* Project Switcher Bar */}
        <div className="p-3 border-b border-[#1c1c1c]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] px-2 mb-1.5 flex items-center justify-between">
            <span>Active Project</span>
            <button
              onClick={onNewProject}
              className="text-[#A09A8F] hover:text-[#ECE7DE] flex items-center gap-0.5"
              title="New Project"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <select
            value={activeProjectId}
            onChange={e => onSelectProject(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] text-xs text-[#ECE7DE] p-2 rounded-lg font-medium focus:outline-none cursor-pointer"
          >
            {projects.filter(p => !p.isArchived).map(p => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="p-3 border-b border-[#1c1c1c] space-y-1">
          <button
            onClick={() => onSelectView("editor")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === "editor"
                ? "bg-[#1c1c1c] text-[#ECE7DE]"
                : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#7E9F86]" />
            <span>Manuscript Editor</span>
          </button>

          <button
            onClick={() => onSelectView("projectVault")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === "projectVault"
                ? "bg-[#1c1c1c] text-[#ECE7DE]"
                : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="w-3.5 h-3.5 text-[#C8A051]" />
              <span>Project Drop Vault</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#161616] text-[#A09A8F]">
              {vaultItemCount}
            </span>
          </button>

          <button
            onClick={() => onSelectView("wiki")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === "wiki"
                ? "bg-[#1c1c1c] text-[#ECE7DE]"
                : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#6B8FA3]" />
            <span>Project Wiki & Bible</span>
          </button>

          <button
            onClick={() => onSelectView("diagrams")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === "diagrams"
                ? "bg-[#1c1c1c] text-[#ECE7DE]"
                : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-[#C8A051]" />
            <span>Relationship Graph</span>
          </button>

          <button
            onClick={() => onSelectView("timeline")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === "timeline"
                ? "bg-[#1c1c1c] text-[#ECE7DE]"
                : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#7E9F86]" />
            <span>Timeline Matrix</span>
          </button>

          <button
            onClick={() => onSelectView("threads")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === "threads"
                ? "bg-[#1c1c1c] text-[#ECE7DE]"
                : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#BF614B]" />
            <span>Thread Watchdog</span>
          </button>

          <button
            onClick={() => onSelectView("vault")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === "vault"
                ? "bg-[#1c1c1c] text-[#ECE7DE]"
                : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C8A051]" />
            <span>Profile Vault (Voice)</span>
          </button>
        </div>

        {/* Chapters / Segments Tree */}
        <div className="p-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B]">
              Draft Chapters ({activeSegments.length})
            </span>
            <button
              onClick={onNewSegment}
              className="text-[#A09A8F] hover:text-[#ECE7DE] p-1 rounded hover:bg-[#161616] cursor-pointer"
              title="Add Chapter Segment"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {activeSegments.map(seg => {
              const isSelected = activeSegmentId === seg.id && activeView === "editor";
              const statusDot =
                seg.status === "done"
                  ? "bg-[#7E9F86]"
                  : seg.status === "active"
                  ? "bg-[#C8A051]"
                  : "bg-[#444]";

              return (
                <button
                  key={seg.id}
                  onClick={() => {
                    onSelectSegment(seg.id);
                    onSelectView("editor");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#1c1c1c] text-[#ECE7DE] font-medium"
                      : "text-[#A09A8F] hover:bg-[#121212] hover:text-[#ECE7DE]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                  <span className="font-mono text-[11px] text-[#66625B] shrink-0">
                    {seg.romanNumeral}.
                  </span>
                  <span className="truncate flex-1">{seg.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Subsystems Bar (VCS + Safety Trash) */}
      <div className="p-3 border-t border-[#1c1c1c] space-y-1.5 bg-[#090909]">
        {/* Version Control DAG trigger */}
        <button
          onClick={onOpenVcsModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] border border-[#202020] text-xs text-[#ECE7DE] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <GitFork className="w-3.5 h-3.5 text-[#7E9F86]" />
            <span className="font-medium">Version Tree</span>
          </div>
          <span className="text-[10px] font-mono text-[#A09A8F]">
            {commitCount} commits ({versionDag?.activeBranch || "main"})
          </span>
        </button>

        {/* Safety Trash Drawer trigger (Rule 1) */}
        <button
          onClick={onOpenTrashModal}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#66625B] hover:text-[#A09A8F] hover:bg-[#121212] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Safety Archive</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161616]">
            {trashCount} items
          </span>
        </button>
      </div>
    </aside>
  );
};
