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
  Share2,
  Globe,
  Check,
  Settings,
  Sliders,
  Inbox,
  Compass
} from "lucide-react";
import { DesktopBridge } from "../../engine/storage/desktopBridge";

interface ThemeProjectNavProps {
  themes: ThemeCollection[];
  projects: Project[];
  activeProjectId: string;
  activeSegmentId: string | null;
  segments: Segment[];
  versionDag: VersionDAG;
  trashCount: number;
  vaultItemCount: number;
  activeView: "editor" | "wiki" | "diagrams" | "timeline" | "threads" | "projectVault" | "vault" | "publish";
  onSelectProject: (projectId: string) => void;
  onSelectSegment: (segmentId: string) => void;
  onSelectView: (view: "editor" | "wiki" | "diagrams" | "timeline" | "threads" | "projectVault" | "vault" | "publish") => void;
  onOpenVcsModal: () => void;
  onOpenTrashModal: () => void;
  onNewProject: () => void;
  onNewSegment: () => void;
  onOpenProjectSettings?: () => void;
  onOpenThemeManager?: () => void;
  onOpenVisualSettings?: () => void;
  width?: number;
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
  onNewSegment,
  onOpenProjectSettings,
  onOpenThemeManager,
  onOpenVisualSettings,
  width
}) => {
  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeSegments = segments.filter(s => !s.isArchived).sort((a, b) => a.order - b.order);
  const commitCount = Object.keys(versionDag?.commits || {}).length;
  const [copiedBrowserUrl, setCopiedBrowserUrl] = useState(false);

  return (
    <aside
      style={{ width: width ? `${width}px` : undefined }}
      className="w-64 bg-[#0A0A0C] text-[#ECE7DE] border-r border-[#18181A] flex flex-col justify-between select-none shrink-0 h-full"
    >
      {/* Top Header & Navigation Items */}
      <div className="flex flex-col overflow-y-auto flex-1">
        {/* Brand Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#18181A]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#ECE7DE] text-[#080808] flex items-center justify-center font-serif font-bold text-[11px] shadow-sm">
              W
            </div>
            <span className="font-serif text-xs font-semibold tracking-wider text-[#ECE7DE]">WRIT STUDIO</span>
          </div>
          <span className="text-[10px] font-mono text-[#52525B] px-1.5 py-0.5 rounded bg-[#121214] border border-[#1E1E22]">
            desktop
          </span>
        </div>

        {/* Project Switcher Bar */}
        <div className="p-3 border-b border-[#18181A]">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#71717A] px-1 mb-1.5 flex items-center justify-between">
            <span>Project</span>
            <div className="flex items-center gap-1">
              {onOpenProjectSettings && (
                <button
                  onClick={onOpenProjectSettings}
                  className="text-[#71717A] hover:text-[#C8A051] p-1 rounded hover:bg-[#18181B] cursor-pointer transition-colors"
                  title="Project & Story Bible Properties (GUI)"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={onNewProject}
                className="text-[#71717A] hover:text-[#ECE7DE] p-1 rounded hover:bg-[#18181B] cursor-pointer transition-colors"
                title="New Project"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          <select
            value={activeProjectId}
            onChange={e => onSelectProject(e.target.value)}
            className="w-full bg-[#121214] border border-[#222226] text-xs text-[#ECE7DE] p-2 rounded-lg font-medium focus:outline-none focus:border-[#C8A051]/60 cursor-pointer"
          >
            {projects.filter(p => !p.isArchived).map(p => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Chapters / Manuscript Tree (Primary Focus) */}
        <div className="p-3 border-b border-[#18181A]">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-[#7E9F86]" />
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#71717A]">
                Manuscript ({activeSegments.length})
              </span>
            </div>
            <button
              onClick={onNewSegment}
              className="text-[#71717A] hover:text-[#ECE7DE] p-1 rounded hover:bg-[#18181B] cursor-pointer transition-colors"
              title="Add Chapter Segment"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {activeSegments.map(seg => {
              const isSelected = activeSegmentId === seg.id && activeView === "editor";
              const statusDot =
                seg.status === "done"
                  ? "bg-[#7E9F86]"
                  : seg.status === "active"
                  ? "bg-[#C8A051]"
                  : "bg-[#52525B]";

              const wordCount = (seg.textContent?.match(/\b\w+\b/g) || []).length;

              return (
                <button
                  key={seg.id}
                  onClick={() => {
                    onSelectSegment(seg.id);
                    onSelectView("editor");
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer group ${
                    isSelected
                      ? "bg-[#18181B] text-[#ECE7DE] font-medium border border-[#27272A]"
                      : "text-[#A1A1AA] hover:bg-[#121214] hover:text-[#ECE7DE] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                    <span className="font-mono text-[10px] text-[#71717A] shrink-0">
                      {seg.romanNumeral}.
                    </span>
                    <span className="truncate">{seg.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#52525B] group-hover:text-[#71717A] shrink-0 ml-1.5">
                    {wordCount > 0 ? `${wordCount}w` : "0w"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Drop Vault (Flat Global Workspace) */}
        <div className="p-3 border-b border-[#18181A]">
          <button
            onClick={() => onSelectView("projectVault")}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeView === "projectVault"
                ? "bg-[#18181B] text-[#ECE7DE] border-[#27272A]"
                : "text-[#A1A1AA] hover:bg-[#121214] hover:text-[#ECE7DE] border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 text-[#C8A051]" />
              <span>Project Drop Vault</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#121214] text-[#A1A1AA] border border-[#1E1E22]">
              {vaultItemCount}
            </span>
          </button>
        </div>

        {/* Studio Views & Tools */}
        <div className="p-3 border-b border-[#18181A] space-y-1">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#71717A] px-1 mb-1.5">
            Studio Views
          </div>

          <button
            onClick={() => onSelectView("publish")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeView === "publish"
                ? "bg-[#18181B] text-[#ECE7DE] border-[#27272A]"
                : "text-[#A1A1AA] hover:bg-[#121214] hover:text-[#ECE7DE] border-transparent"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#7E9F86]" />
            <span>Publish & Export</span>
          </button>

          <button
            onClick={() => onSelectView("wiki")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeView === "wiki"
                ? "bg-[#18181B] text-[#ECE7DE] border-[#27272A]"
                : "text-[#A1A1AA] hover:bg-[#121214] hover:text-[#ECE7DE] border-transparent"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#6B8FA3]" />
            <span>Story Bible & Wiki</span>
          </button>

          <button
            onClick={() => onSelectView("diagrams")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeView === "diagrams"
                ? "bg-[#18181B] text-[#ECE7DE] border-[#27272A]"
                : "text-[#A1A1AA] hover:bg-[#121214] hover:text-[#ECE7DE] border-transparent"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-[#C8A051]" />
            <span>Relationship Graph</span>
          </button>

          <button
            onClick={() => onSelectView("timeline")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeView === "timeline"
                ? "bg-[#18181B] text-[#ECE7DE] border-[#27272A]"
                : "text-[#A1A1AA] hover:bg-[#121214] hover:text-[#ECE7DE] border-transparent"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#7E9F86]" />
            <span>Timeline Matrix</span>
          </button>

          <button
            onClick={() => onSelectView("threads")}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeView === "threads"
                ? "bg-[#18181B] text-[#ECE7DE] border-[#27272A]"
                : "text-[#A1A1AA] hover:bg-[#121214] hover:text-[#ECE7DE] border-transparent"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#BF614B]" />
            <span>Thread Watchdog</span>
          </button>
        </div>

        {/* Collections & Voice Profile */}
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#71717A]">
              Collections ({themes.length})
            </span>
            {onOpenThemeManager && (
              <button
                onClick={onOpenThemeManager}
                className="text-[#71717A] hover:text-[#C8A051] p-0.5 rounded hover:bg-[#18181B] cursor-pointer transition-colors"
                title="Manage Collections & Themes"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {themes.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-[#71717A] hover:bg-[#121214] hover:text-[#ECE7DE] transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.colorBadge || "#C8A051" }} />
                  <span className="truncate">{t.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#52525B]">
                  {projects.filter(p => p.themeId === t.id && !p.isArchived).length}
                </span>
              </div>
            ))}

            <button
              onClick={() => onSelectView("vault")}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer mt-1 ${
                activeView === "vault"
                  ? "bg-[#18181B] text-[#ECE7DE]"
                  : "text-[#71717A] hover:bg-[#121214] hover:text-[#ECE7DE]"
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#C8A051]" />
              <span>Profile Vault (Voice)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Subsystems Bar (VCS + Safety Trash + Visual Settings) */}
      <div className="p-3 border-t border-[#18181A] space-y-1.5 bg-[#0A0A0C] shrink-0">
        {onOpenVisualSettings && (
          <button
            onClick={onOpenVisualSettings}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#121214] hover:bg-[#18181B] border border-[#222226] text-xs text-[#ECE7DE] transition-colors cursor-pointer"
            title="Studio Settings & Visual Controls"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#C8A051]" />
              <span className="font-medium">Studio Controls</span>
            </div>
            <span className="text-[10px] font-mono text-[#71717A]">GUI</span>
          </button>
        )}

        <button
          onClick={onOpenVcsModal}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#121214] hover:bg-[#18181B] border border-[#1E1E22] text-xs text-[#ECE7DE] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <GitFork className="w-3.5 h-3.5 text-[#7E9F86]" />
            <span className="font-medium">Version Tree</span>
          </div>
          <span className="text-[10px] font-mono text-[#71717A]">
            {commitCount} commits
          </span>
        </button>

        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={onOpenTrashModal}
            className="flex-1 flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-[#71717A] hover:text-[#ECE7DE] hover:bg-[#141416] transition-colors cursor-pointer"
            title="Safety Archive"
          >
            <div className="flex items-center gap-1.5">
              <Trash2 className="w-3 h-3 text-[#52525B]" />
              <span>Safety Trash</span>
            </div>
            <span className="text-[10px] font-mono text-[#52525B]">{trashCount}</span>
          </button>

          <button
            onClick={() => {
              const url = DesktopBridge.getInstance().getServerBaseUrl();
              navigator.clipboard.writeText(url);
              setCopiedBrowserUrl(true);
              setTimeout(() => setCopiedBrowserUrl(false), 2000);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[#7E9F86] hover:bg-[#142318] border border-[#1a2e20]/60 bg-[#0d1710]/40 transition-colors cursor-pointer"
            title="Click to copy local browser link"
          >
            <Globe className="w-3 h-3 text-[#7E9F86]" />
            <span className="font-mono text-[10px]">{copiedBrowserUrl ? "Copied" : ":4983"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
