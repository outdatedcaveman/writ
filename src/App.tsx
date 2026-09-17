import React, { useState, useEffect, useMemo } from "react";
import { WorkspaceStore, WorkspaceState } from "./engine/storage/fileManager";
import { ThemeProjectNav } from "./components/sidebar/ThemeProjectNav";
import { TrashDrawer } from "./components/sidebar/TrashDrawer";
import { SegmentEditor } from "./components/editor/SegmentEditor";
import { ProjectWikiView } from "./components/wiki/ProjectWikiView";
import { RelationshipGraph } from "./components/visualizers/RelationshipGraph";
import { TimelineMatrix } from "./components/visualizers/TimelineMatrix";
import { ThreadVisualizer } from "./components/visualizers/ThreadVisualizer";
import { ProjectVaultView } from "./components/vault/ProjectVaultView";
import { ProfileVaultView } from "./components/vault/ProfileVaultView";
import { PublishStudioView } from "./components/publish/PublishStudioView";
import { VersionTreeModal } from "./components/vcs/VersionTreeModal";
import { AICopilotSidebar } from "./components/copilot/AICopilotSidebar";
import { createCommitNode, createNewBranch } from "./engine/vcs/versionTree";
import { deconstructManuscript } from "./engine/analysis/deconstructor";
import { analyzeAndSuggestPlacement, extractInsightsFromDrop } from "./engine/analysis/vaultSynthesizer";
import { egonService } from "./services/egonIntegration";
import { DesktopBridge } from "./engine/storage/desktopBridge";
import { AuthorIdentity } from "./types/versionControl";
import { ThreadEntity, Segment, Project, ProjectWiki, ProjectVaultItem, VaultItemType } from "./types/workspace";
import { VisualSettings, defaultVisualSettings } from "./types/visualSettings";
import { VisualSettingsModal } from "./components/settings/VisualSettingsModal";
import { ProjectSettingsModal } from "./components/modals/ProjectSettingsModal";
import { SegmentMetadataModal } from "./components/modals/SegmentMetadataModal";
import { ThemeManagerModal } from "./components/modals/ThemeManagerModal";
import { NewProjectModal } from "./components/modals/NewProjectModal";
import {
  MasterCraftSentinel,
  MasterCraftReport,
  MasterCraftDiagnosis,
  SentinelSettings,
  defaultSentinelSettings
} from "./engine/analysis/masterCraftSentinel";
import { MasterCraftSentinelModal } from "./components/modals/MasterCraftSentinelModal";
import {
  Sparkles,
  Wifi,
  WifiOff,
  GitBranch,
  FileText,
  Sliders,
  CheckCircle2,
  Share2,
  Maximize2,
  Minimize2,
  Settings,
  Layers,
  BookOpen,
  FolderTree,
  Compass,
  Inbox,
  ShieldAlert,
  Bell,
  X
} from "lucide-react";

const store = new WorkspaceStore();

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => store.getState());
  const [activeView, setActiveView] = useState<"editor" | "wiki" | "diagrams" | "timeline" | "threads" | "projectVault" | "vault" | "publish">("editor");
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isVcsModalOpen, setIsVcsModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEgonOnline, setIsEgonOnline] = useState<boolean | null>(null);

  // Responsive / Adaptive Panel Widths (Persisted in localStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("writ:layout:sidebarWidth");
        if (saved) return Math.max(180, Math.min(600, parseInt(saved, 10)));
      }
    } catch {}
    return 260;
  });

  const [copilotWidth, setCopilotWidth] = useState<number>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("writ:layout:copilotWidth");
        if (saved) return Math.max(260, Math.min(800, parseInt(saved, 10)));
      }
    } catch {}
    return 384;
  });

  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingCopilot, setIsDraggingCopilot] = useState(false);

  useEffect(() => {
    if (!isDraggingSidebar && !isDraggingCopilot) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const newWidth = Math.max(180, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
        try {
          window.localStorage.setItem("writ:layout:sidebarWidth", String(newWidth));
        } catch {}
      } else if (isDraggingCopilot) {
        const newWidth = Math.max(260, Math.min(800, window.innerWidth - e.clientX));
        setCopilotWidth(newWidth);
        try {
          window.localStorage.setItem("writ:layout:copilotWidth", String(newWidth));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingCopilot(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingSidebar, isDraggingCopilot]);

  // Visual Customization & Control Center State
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("writ:visual:settings:v1");
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return defaultVisualSettings;
  });

  const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isSegmentSettingsOpen, setIsSegmentSettingsOpen] = useState(false);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Master Craft Sentinel & Proactive Interval Nudge State
  const [isSentinelModalOpen, setIsSentinelModalOpen] = useState(false);
  const [sentinelSettings, setSentinelSettings] = useState<SentinelSettings>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("writ:sentinel:settings:v1");
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return defaultSentinelSettings;
  });
  const [activeNudgeToast, setActiveNudgeToast] = useState<MasterCraftDiagnosis | null>(null);
  const [lastNudgeTimestamp, setLastNudgeTimestamp] = useState<number>(Date.now());

  const handleUpdateVisualSettings = (updater: (prev: VisualSettings) => VisualSettings) => {
    setVisualSettings(prev => {
      const next = updater(prev);
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("writ:visual:settings:v1", JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    egonService.checkHealth().then(online => setIsEgonOnline(online));
  }, []);

  const updateState = (updater: (prev: WorkspaceState) => WorkspaceState) => {
    setWorkspace(prev => {
      const next = updater(prev);
      store.save(next);
      return next;
    });
  };

  const activeProject = useMemo(() => {
    return workspace.projects.find(p => p.id === workspace.activeProjectId) || workspace.projects[0];
  }, [workspace.projects, workspace.activeProjectId]);

  const activeWiki = useMemo(() => {
    return workspace.wikis[activeProject?.id];
  }, [workspace.wikis, activeProject?.id]);

  const activeSegments = useMemo(() => {
    if (!activeProject) return [];
    const draft = workspace.drafts[activeProject.activeDraftId];
    if (!draft) return [];
    return draft.segmentIds
      .map(id => workspace.segments[id])
      .filter(s => s && !s.isArchived)
      .sort((a, b) => a.order - b.order);
  }, [workspace.segments, workspace.drafts, activeProject]);

  const sentinelReport: MasterCraftReport = useMemo(() => {
    if (!activeProject) {
      return MasterCraftSentinel.emptyReport();
    }
    return MasterCraftSentinel.analyzeProject({
      segments: activeSegments,
      wiki: activeWiki,
      threads: workspace.threads,
      plotPoints: activeWiki?.plotPoints
    });
  }, [activeProject, activeSegments, activeWiki, workspace.threads]);

  // Proactive interval alarm effect for Sentinel nudges
  useEffect(() => {
    if (!sentinelSettings.enabled || sentinelSettings.intervalMinutes <= 0) return;

    const intervalMs = sentinelSettings.intervalMinutes * 60 * 1000;
    const intervalTimer = setInterval(() => {
      const now = Date.now();
      if (now - lastNudgeTimestamp >= intervalMs) {
        setLastNudgeTimestamp(now);
        if (sentinelReport.diagnoses.length > 0) {
          const top = sentinelReport.diagnoses.find(d => d.severity === "critical") || sentinelReport.diagnoses[0];
          setActiveNudgeToast(top);
        }
      }
    }, 20000);

    return () => clearInterval(intervalTimer);
  }, [sentinelSettings.enabled, sentinelSettings.intervalMinutes, lastNudgeTimestamp, sentinelReport.diagnoses]);

  const activeSegment = useMemo(() => {
    if (workspace.activeSegmentId && workspace.segments[workspace.activeSegmentId]) {
      return workspace.segments[workspace.activeSegmentId];
    }
    const draft = workspace.drafts[activeProject?.activeDraftId];
    if (draft && draft.segmentIds.length > 0) {
      return workspace.segments[draft.segmentIds[0]];
    }
    return null;
  }, [workspace.segments, workspace.activeSegmentId, workspace.drafts, activeProject?.activeDraftId]);

  const activeVersionDag = useMemo(() => {
    return workspace.versionDAGs[activeProject?.id] || {
      commits: {},
      branches: { main: { name: "main", headCommitId: "", createdAt: Date.now() } },
      activeBranch: "main",
      headCommitId: ""
    };
  }, [workspace.versionDAGs, activeProject?.id]);

  const currentProjectVaultItems = useMemo(() => {
    return workspace.projectVaultItems[activeProject?.id] || [];
  }, [workspace.projectVaultItems, activeProject?.id]);

  const handleSelectProject = (projectId: string) => {
    updateState(prev => ({
      ...prev,
      activeProjectId: projectId,
      activeSegmentId: null
    }));
  };

  const handleSelectSegment = (segmentId: string) => {
    updateState(prev => ({
      ...prev,
      activeSegmentId: segmentId
    }));
  };

  const handleUpdateText = (segmentId: string, text: string) => {
    updateState(prev => {
      const seg = prev.segments[segmentId];
      if (!seg) return prev;
      return {
        ...prev,
        segments: {
          ...prev.segments,
          [segmentId]: { ...seg, textContent: text }
        }
      };
    });
  };

  const handleCommit = (params: {
    segmentId: string;
    text: string;
    message: string;
    author: AuthorIdentity;
  }) => {
    updateState(prev => {
      const currentDag = prev.versionDAGs[activeProject.id];
      const { nextDag, newCommit } = createCommitNode({
        dag: currentDag,
        author: params.author,
        message: params.message,
        affectedSegmentIds: [params.segmentId],
        segmentSnapshots: {
          [params.segmentId]: params.text
        }
      });

      egonService.appendActivity(
        "writ",
        `[VCS] ${params.author.name} committed to ${activeProject.title}: "${params.message}"`,
        { commitId: newCommit.id, author: params.author }
      );

      return {
        ...prev,
        versionDAGs: {
          ...prev.versionDAGs,
          [activeProject.id]: nextDag
        }
      };
    });
  };

  const handleCheckoutCommit = (commitId: string) => {
    const commit = activeVersionDag.commits[commitId];
    if (!commit) return;

    updateState(prev => {
      const nextSegments = { ...prev.segments };
      Object.entries(commit.segmentSnapshots).forEach(([segId, snapshotText]) => {
        if (nextSegments[segId]) {
          nextSegments[segId] = {
            ...nextSegments[segId],
            textContent: snapshotText
          };
        }
      });

      const nextDag = {
        ...activeVersionDag,
        headCommitId: commitId
      };

      return {
        ...prev,
        segments: nextSegments,
        versionDAGs: {
          ...prev.versionDAGs,
          [activeProject.id]: nextDag
        }
      };
    });
  };

  const handleCreateBranch = (branchName: string) => {
    updateState(prev => {
      const nextDag = createNewBranch(activeVersionDag, branchName);
      return {
        ...prev,
        versionDAGs: {
          ...prev.versionDAGs,
          [activeProject.id]: nextDag
        }
      };
    });
  };

  const handleSoftDelete = (id: string, entityType: any, name: string) => {
    updateState(prev => {
      return store.softDelete(
        {
          id,
          entityType,
          entityName: name,
          deletedAt: Date.now(),
          projectId: activeProject.id,
          payload: null
        },
        prev
      );
    });
  };

  const handleRestoreFromTrash = (trashId: string) => {
    updateState(prev => store.restoreFromTrash(trashId, prev));
  };

  const handleAddProjectVaultItem = (item: {
    type: VaultItemType;
    title: string;
    content: string;
    mediaUrl?: string;
  }) => {
    const itemId = `pv-${Date.now().toString(36)}`;
    const extractedInsights = extractInsightsFromDrop(item.content, item.type);

    const projectSegments = Object.values(workspace.segments).filter(
      s => s.draftId === activeProject.activeDraftId
    );

    const suggestion = analyzeAndSuggestPlacement(
      {
        id: itemId,
        projectId: activeProject.id,
        type: item.type,
        title: item.title,
        content: item.content,
        mediaUrl: item.mediaUrl,
        timestamp: Date.now(),
        extractedInsights
      },
      activeProject,
      projectSegments,
      activeWiki,
      workspace.threads
    );

    const newItem: ProjectVaultItem = {
      id: itemId,
      projectId: activeProject.id,
      type: item.type,
      title: item.title,
      content: item.content,
      mediaUrl: item.mediaUrl,
      timestamp: Date.now(),
      extractedInsights,
      placementSuggestion: suggestion,
      status: "inbox"
    };

    updateState(prev => {
      const items = prev.projectVaultItems[activeProject.id] || [];
      return {
        ...prev,
        projectVaultItems: {
          ...prev.projectVaultItems,
          [activeProject.id]: [newItem, ...items]
        }
      };
    });
  };

  const handleIncorporateVaultItem = (
    itemId: string,
    targetType: string,
    targetId?: string,
    textToIntegrate?: string
  ) => {
    updateState(prev => {
      const items = prev.projectVaultItems[activeProject.id] || [];
      const targetItem = items.find(i => i.id === itemId);
      if (!targetItem) return prev;

      let nextSegments = { ...prev.segments };
      let nextWiki = { ...prev.wikis[activeProject.id] };
      let affectedSegmentId = targetId || "";

      if (targetType === "segment" && targetId && nextSegments[targetId]) {
        const seg = nextSegments[targetId];
        const updatedContent = `${seg.textContent}\n\n${textToIntegrate || targetItem.content}`;
        nextSegments[targetId] = {
          ...seg,
          textContent: updatedContent
        };
        affectedSegmentId = targetId;
      } else if (targetType === "wiki_character" && targetId) {
        nextWiki.characters = nextWiki.characters.map(c => {
          if (c.id === targetId) {
            return {
              ...c,
              motivation: `${c.motivation} (Note: ${targetItem.content})`
            };
          }
          return c;
        });
      }

      const nextItems = items.map(it => {
        if (it.id === itemId) {
          return {
            ...it,
            status: "placed" as const,
            placedAt: Date.now(),
            placedLocation: targetItem.placementSuggestion?.targetTitle || "Project Manuscript"
          };
        }
        return it;
      });

      const currentDag = prev.versionDAGs[activeProject.id];
      const { nextDag } = createCommitNode({
        dag: currentDag,
        author: { type: "ai_copilot", name: "Writ Auto-Arranger" },
        message: `Incorporated vault item "${targetItem.title}" into ${targetItem.placementSuggestion?.targetTitle || "Project"}`,
        affectedSegmentIds: affectedSegmentId ? [affectedSegmentId] : [],
        segmentSnapshots: affectedSegmentId && nextSegments[affectedSegmentId]
          ? { [affectedSegmentId]: nextSegments[affectedSegmentId].textContent }
          : {}
      });

      return {
        ...prev,
        segments: nextSegments,
        wikis: {
          ...prev.wikis,
          [activeProject.id]: nextWiki
        },
        projectVaultItems: {
          ...prev.projectVaultItems,
          [activeProject.id]: nextItems
        },
        versionDAGs: {
          ...prev.versionDAGs,
          [activeProject.id]: nextDag
        }
      };
    });
  };

  const handleDeconstructAndApply = (rawText: string) => {
    const draftId = activeProject.activeDraftId;
    const result = deconstructManuscript(rawText, draftId, activeProject.id);

    updateState(prev => {
      const nextSegments = { ...prev.segments };
      const segmentIds: string[] = [];

      result.segments.forEach(seg => {
        nextSegments[seg.id] = seg;
        segmentIds.push(seg.id);
      });

      const nextThreads = { ...prev.threads };
      result.threads.forEach(th => {
        nextThreads[th.id] = th;
      });

      const updatedDraft = {
        ...prev.drafts[draftId],
        segmentIds,
        updatedAt: Date.now()
      };

      const updatedWiki = {
        ...activeWiki,
        themeAndPremise: {
          ...activeWiki.themeAndPremise,
          centralInquiry: result.centralInquiry,
          genre: result.detectedGenre
        },
        characters: [...activeWiki.characters, ...result.characters],
        arguments: [...activeWiki.arguments, ...result.arguments],
        plotPoints: [...activeWiki.plotPoints, ...result.plotPoints]
      };

      const { nextDag } = createCommitNode({
        dag: activeVersionDag,
        author: { type: "ai_daemon", name: "Writ Ingestion Engine" },
        message: `Deconstructed draft into ${result.segments.length} chapters and wiki metadata`,
        affectedSegmentIds: segmentIds,
        segmentSnapshots: Object.fromEntries(result.segments.map(s => [s.id, s.textContent]))
      });

      return {
        ...prev,
        segments: nextSegments,
        threads: nextThreads,
        drafts: {
          ...prev.drafts,
          [draftId]: updatedDraft
        },
        wikis: {
          ...prev.wikis,
          [activeProject.id]: updatedWiki
        },
        versionDAGs: {
          ...prev.versionDAGs,
          [activeProject.id]: nextDag
        },
        activeSegmentId: segmentIds[0] || null
      };
    });
  };

  const handleCreateProjectFromModal = (params: {
    title: string;
    logline: string;
    genre: string;
    themeId: string;
    intent: string;
    firstChapterTitle: string;
  }) => {
    const projId = `proj-${Date.now().toString(36)}`;
    const draftId = `draft-${Date.now().toString(36)}`;
    const segId = `seg-${Date.now().toString(36)}-1`;

    const newProject: Project = {
      id: projId,
      themeId: params.themeId || workspace.themes[0]?.id || "theme-default",
      title: params.title.trim(),
      slug: params.title.trim().toLowerCase().replace(/\s+/g, "-"),
      logline: params.logline.trim() || "New creative inquiry.",
      genre: params.genre as any,
      intent: params.intent.trim() || "Explore and articulate a compelling thesis.",
      activeDraftId: draftId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const newSegment: Segment = {
      id: segId,
      draftId,
      title: params.firstChapterTitle.trim() || "Opening Inquest",
      romanNumeral: "I",
      order: 1,
      synopsis: "The initial provocation.",
      goals: ["Introduce the core subject"],
      treatedThreadIds: [],
      characterIds: [],
      textContent: "Begin typing your thoughts here...",
      status: "active"
    };

    updateState(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
      drafts: {
        ...prev.drafts,
        [draftId]: {
          id: draftId,
          projectId: projId,
          name: "Working Draft",
          segmentIds: [segId],
          updatedAt: Date.now()
        }
      },
      segments: {
        ...prev.segments,
        [segId]: newSegment
      },
      projectVaultItems: {
        ...prev.projectVaultItems,
        [projId]: []
      },
      wikis: {
        ...prev.wikis,
        [projId]: {
          themeAndPremise: {
            centralInquiry: params.logline || "What question animates this work?",
            readerPromise: "Clear and resonant insight.",
            tone: "Reflective and exact.",
            genre: params.genre as any,
            targetLength: "3,000 - 5,000 words"
          },
          characters: [],
          arguments: [],
          plotPoints: [],
          macroStructure: {
            framework: "dialectic_thesis_antithesis",
            acts: [
              { name: "Act I", summary: "Opening setup", targetPacing: "measured" },
              { name: "Act II", summary: "Complication", targetPacing: "building" },
              { name: "Act III", summary: "Resolution", targetPacing: "reflective" }
            ]
          }
        }
      },
      versionDAGs: {
        ...prev.versionDAGs,
        [projId]: {
          commits: {},
          branches: { main: { name: "main", headCommitId: "", createdAt: Date.now() } },
          activeBranch: "main",
          headCommitId: ""
        }
      },
      activeProjectId: projId,
      activeSegmentId: segId
    }));
    setIsNewProjectModalOpen(false);
    setActiveView("editor");
  };

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleNewSegment = () => {
    const draft = workspace.drafts[activeProject.activeDraftId];
    if (!draft) return;

    const count = draft.segmentIds.length + 1;
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const segId = `seg-${Date.now().toString(36)}-${count}`;

    const newSeg: Segment = {
      id: segId,
      draftId: draft.id,
      title: `Chapter ${count}: The Unfolding`,
      romanNumeral: romans[count - 1] || `${count}`,
      order: count,
      synopsis: "Developing chapter continuation.",
      goals: ["Advance the central tension"],
      treatedThreadIds: [],
      characterIds: [],
      textContent: "Draft section content...",
      status: "open"
    };

    updateState(prev => ({
      ...prev,
      segments: {
        ...prev.segments,
        [segId]: newSeg
      },
      drafts: {
        ...prev.drafts,
        [draft.id]: {
          ...draft,
          segmentIds: [...draft.segmentIds, segId],
          updatedAt: Date.now()
        }
      },
      activeSegmentId: segId
    }));
    setActiveView("editor");
  };

  const handleSaveProjectSettings = (updatedProject: Partial<Project>, updatedWiki?: Partial<ProjectWiki>) => {
    updateState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === activeProject.id ? { ...p, ...updatedProject } : p),
      wikis: updatedWiki && prev.wikis[activeProject.id]
        ? {
            ...prev.wikis,
            [activeProject.id]: {
              ...prev.wikis[activeProject.id],
              ...updatedWiki
            }
          }
        : prev.wikis
    }));
  };

  const handleSaveSegmentSettings = (updatedSegment: Partial<Segment>) => {
    if (!activeSegment) return;
    updateState(prev => ({
      ...prev,
      segments: {
        ...prev.segments,
        [activeSegment.id]: {
          ...prev.segments[activeSegment.id],
          ...updatedSegment
        }
      }
    }));
  };

  const handleAddTheme = (title: string, description: string, color: string) => {
    const newTheme = {
      id: `theme-${Date.now().toString(36)}`,
      name: title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description,
      colorBadge: color,
      createdAt: Date.now()
    };
    updateState(prev => ({
      ...prev,
      themes: [...prev.themes, newTheme]
    }));
  };

  const handleSoftDeleteTheme = (id: string, name: string) => {
    handleSoftDelete(id, "theme" as any, name);
    updateState(prev => ({
      ...prev,
      themes: prev.themes.filter(t => t.id !== id)
    }));
  };

  const handleExportManuscript = () => {
    const draft = workspace.drafts[activeProject.activeDraftId];
    if (!draft) return;
    const segs = draft.segmentIds
      .map(id => workspace.segments[id])
      .filter(s => s && !s.isArchived)
      .sort((a, b) => a.order - b.order);

    let md = `# ${activeProject.title}\n\n`;
    if (activeWiki?.themeAndPremise.readerPromise) {
      md += `*${activeWiki.themeAndPremise.readerPromise}*\n\n---\n\n`;
    }
    segs.forEach(s => {
      md += `## Section ${s.romanNumeral}: ${s.title}\n\n${s.textContent}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject.title.replace(/[^a-z0-9]/gi, "_")}_Manuscript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBackupJson = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Writ_Workspace_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerBackupSnapshot = () => {
    DesktopBridge.getInstance().saveProject(activeProject);
  };

  return (
    <div className="flex h-screen w-screen bg-[#080808] text-[#ECE7DE] overflow-hidden">
      {/* LEFT NAVIGATION COLUMN (Hidden in Zen Mode) */}
      {!isZenMode && (
        <>
          <ThemeProjectNav
            width={sidebarWidth}
            themes={workspace.themes}
            projects={workspace.projects}
            activeProjectId={activeProject.id}
            activeSegmentId={activeSegment?.id || null}
            segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
            versionDag={activeVersionDag}
            trashCount={workspace.trash.length}
            vaultItemCount={currentProjectVaultItems.length}
            activeView={activeView}
            onSelectProject={handleSelectProject}
            onSelectSegment={handleSelectSegment}
            onSelectView={setActiveView}
            onOpenVcsModal={() => setIsVcsModalOpen(true)}
            onOpenTrashModal={() => setIsTrashModalOpen(true)}
            onNewProject={handleNewProject}
            onNewSegment={handleNewSegment}
            onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
            onOpenThemeManager={() => setIsThemeManagerOpen(true)}
            onOpenVisualSettings={() => setIsVisualSettingsOpen(true)}
          />
          {/* Draggable Vertical Splitter (Sidebar <-> Main Canvas) */}
          <div
            onMouseDown={e => {
              e.preventDefault();
              setIsDraggingSidebar(true);
            }}
            className={`w-1.5 relative shrink-0 cursor-col-resize select-none transition-colors group z-20 ${
              isDraggingSidebar
                ? "bg-[#C8A051]"
                : "bg-transparent hover:bg-[#C8A051]/60 border-r border-[#18181A]"
            }`}
            title="Drag to resize sidebar width"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        </>
      )}

      {/* CENTER WORKSPACE AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080808] overflow-hidden">
        {/* Top Desktop Studio App Bar */}
        <header className="h-11 border-b border-[#18181A] bg-[#0A0A0C] px-5 flex items-center justify-between shrink-0 select-none">
          {/* Left Breadcrumb - Truncated, Never Wraps */}
          <div className="flex items-center gap-2 min-w-0 mr-4">
            <span className="font-sans text-xs font-semibold tracking-tight text-[#ECE7DE] truncate max-w-[180px]">
              {activeProject.title}
            </span>
            <span className="text-xs text-[#3F3F46]">/</span>
            <span className="text-xs text-[#8E8E93] truncate max-w-[260px]">
              {activeView === "editor" && activeSegment
                ? `Section ${activeSegment.romanNumeral} · ${activeSegment.title}`
                : activeView === "projectVault"
                ? "Project Drop Vault"
                : activeView === "publish"
                ? "Publishing Studio"
                : activeView === "wiki"
                ? "Story Bible & Wiki"
                : activeView === "diagrams"
                ? "Relationship Graph"
                : activeView === "timeline"
                ? "Timeline Matrix"
                : activeView === "threads"
                ? "Thread Watchdog"
                : "Voice Profile Vault"}
            </span>
          </div>

          {/* Right Controls & Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Master Craft Sentinel Button (Four Masters HUD) */}
            <button
              onClick={() => setIsSentinelModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
                sentinelReport.criticalDeficitsCount > 0
                  ? "bg-[#C8A051]/10 border-[#C8A051]/50 text-[#C8A051] hover:bg-[#C8A051]/20"
                  : "bg-[#141416] border-[#222226] text-[#7E9F86] hover:text-[#A7D8B1] hover:bg-[#1A1A1E]"
              }`}
              title={`Master Craft Sentinel: ${sentinelReport.criticalDeficitsCount} critical deficits (McPhee, Nabokov, Gilligan, Nolan)`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">Craft Sentinel:</span>
              <span className="font-semibold">{sentinelReport.criticalDeficitsCount} Critical</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sentinelReport.criticalDeficitsCount > 0 ? "bg-[#C8A051] animate-pulse" : "bg-[#7E9F86]"
                }`}
              />
            </button>

            {/* Visual Studio Controls Button */}
            <button
              onClick={() => setIsVisualSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141416] border border-[#222226] text-[#A1A1AA] hover:text-[#ECE7DE] hover:bg-[#1A1A1E] transition-colors cursor-pointer text-xs"
              title="Studio Settings & Typography Controls"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C8A051]" />
              <span className="hidden sm:inline">Controls</span>
            </button>

            {/* Zen Mode Button */}
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors cursor-pointer text-xs ${
                isZenMode
                  ? "bg-[#C8A051]/15 border-[#C8A051]/60 text-[#C8A051]"
                  : "bg-[#141416] border-[#222226] text-[#A1A1AA] hover:text-[#ECE7DE] hover:bg-[#1A1A1E]"
              }`}
              title={isZenMode ? "Exit Zen Mode" : "Enter Distraction-Free Zen Focus Mode"}
            >
              {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isZenMode ? "Exit Zen" : "Zen"}</span>
            </button>

            {/* Egon Status Dot */}
            <div
              className="flex items-center px-1.5 py-1"
              title={isEgonOnline ? "Egon Mind: Online & Synced" : "Egon Mind: Standalone Mode"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isEgonOnline ? "bg-[#7E9F86]" : "bg-[#3F3F46]"
                }`}
              />
            </div>

            {/* Copilot Toggle Button */}
            {!isZenMode && (
              <button
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors cursor-pointer text-xs ${
                  isCopilotOpen
                    ? "bg-[#C8A051]/15 border-[#C8A051]/60 text-[#C8A051]"
                    : "bg-[#141416] border-[#222226] text-[#A1A1AA] hover:text-[#ECE7DE] hover:bg-[#1A1A1E]"
                }`}
                title="Toggle AI Copilot"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copilot</span>
              </button>
            )}
          </div>
        </header>

        {/* View Switcher Container */}
        <div className="flex-1 overflow-hidden p-4">
          {activeView === "editor" && activeSegment ? (
            <SegmentEditor
              segment={activeSegment}
              threads={workspace.threads}
              wiki={activeWiki}
              versionDag={activeVersionDag}
              visualSettings={visualSettings}
              onUpdateText={handleUpdateText}
              onCommit={handleCommit}
              onOpenVcsModal={() => setIsVcsModalOpen(true)}
              onOpenSegmentProperties={() => setIsSegmentSettingsOpen(true)}
              onToggleZenMode={() => setIsZenMode(!isZenMode)}
              isZenMode={isZenMode}
            />
          ) : activeView === "publish" ? (
            <PublishStudioView
              project={activeProject}
              segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
              wiki={activeWiki}
              activeSegment={activeSegment}
              onDropAssetToVault={(title, type, content, mediaUrl) => {
                handleAddProjectVaultItem({
                  title,
                  type,
                  content,
                  mediaUrl
                });
              }}
            />
          ) : activeView === "projectVault" ? (
            <ProjectVaultView
              project={activeProject}
              vaultItems={currentProjectVaultItems}
              segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
              wiki={activeWiki}
              threads={workspace.threads}
              onAddItem={handleAddProjectVaultItem}
              onIncorporateItem={handleIncorporateVaultItem}
              onSoftDeleteItem={(id, title) => handleSoftDelete(id, "projectVaultItem", title)}
            />
          ) : activeView === "wiki" && activeWiki ? (
            <ProjectWikiView
              project={activeProject}
              wiki={activeWiki}
              segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
              onUpdateWiki={updated =>
                updateState(prev => ({
                  ...prev,
                  wikis: { ...prev.wikis, [activeProject.id]: updated }
                }))
              }
              onSoftDelete={handleSoftDelete}
            />
          ) : activeView === "diagrams" && activeWiki ? (
            <RelationshipGraph
              characters={activeWiki.characters}
              argumentsList={activeWiki.arguments}
              genre={activeProject.genre}
              segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
              onSelectSegment={segId => {
                handleSelectSegment(segId);
                setActiveView("editor");
              }}
              onAddCharacter={char => {
                updateState(prev => {
                  const currentWiki = prev.wikis[activeProject.id];
                  if (!currentWiki) return prev;
                  return {
                    ...prev,
                    wikis: {
                      ...prev.wikis,
                      [activeProject.id]: {
                        ...currentWiki,
                        characters: [...currentWiki.characters, char]
                      }
                    }
                  };
                });
              }}
              onAddArgument={arg => {
                updateState(prev => {
                  const currentWiki = prev.wikis[activeProject.id];
                  if (!currentWiki) return prev;
                  return {
                    ...prev,
                    wikis: {
                      ...prev.wikis,
                      [activeProject.id]: {
                        ...currentWiki,
                        arguments: [...currentWiki.arguments, arg]
                      }
                    }
                  };
                });
              }}
            />
          ) : activeView === "timeline" ? (
            <TimelineMatrix
              segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
              characters={activeWiki?.characters || []}
              threads={Object.values(workspace.threads).filter(t => t.projectId === activeProject.id)}
              plotPoints={activeWiki?.plotPoints || []}
              macroStructure={activeWiki?.macroStructure}
              onSelectSegment={segId => {
                handleSelectSegment(segId);
                setActiveView("editor");
              }}
            />
          ) : activeView === "threads" ? (
            <ThreadVisualizer
              threads={Object.values(workspace.threads).filter(t => t.projectId === activeProject.id)}
              segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
              onAddThread={(name, category, description) => {
                const newId = `th-${Date.now().toString(36)}`;
                updateState(prev => ({
                  ...prev,
                  threads: {
                    ...prev.threads,
                    [newId]: {
                      id: newId,
                      projectId: activeProject.id,
                      name,
                      category,
                      description,
                      status: "open",
                      appearances: []
                    }
                  }
                }));
              }}
              onUpdateThreadStatus={(thId, status) => {
                updateState(prev => {
                  const th = prev.threads[thId];
                  if (!th) return prev;
                  return {
                    ...prev,
                    threads: {
                      ...prev.threads,
                      [thId]: { ...th, status }
                    }
                  };
                });
              }}
            />
          ) : activeView === "vault" ? (
            <ProfileVaultView
              samples={workspace.vaultSamples}
              profile={workspace.stylisticProfile}
              onAddSample={newSample => {
                const id = `sample-${Date.now().toString(36)}`;
                const wordCount = (newSample.excerpt.match(/\b\w+\b/g) || []).length;
                updateState(prev => ({
                  ...prev,
                  vaultSamples: [
                    ...prev.vaultSamples,
                    {
                      ...newSample,
                      id,
                      addedAt: Date.now(),
                      wordCount
                    }
                  ]
                }));
              }}
              onDeleteSample={sampleId => {
                updateState(prev => ({
                  ...prev,
                  vaultSamples: prev.vaultSamples.filter(s => s.id !== sampleId)
                }));
              }}
              onRetrainProfile={() => {
                updateState(prev => ({
                  ...prev,
                  stylisticProfile: {
                    ...prev.stylisticProfile,
                    lastTrainedAt: Date.now()
                  }
                }));
              }}
            />
          ) : null}
        </div>
      </main>

      {/* Draggable Vertical Splitter (Main Canvas <-> Copilot Drawer) */}
      {isCopilotOpen && !isZenMode && (
        <div
          onMouseDown={e => {
            e.preventDefault();
            setIsDraggingCopilot(true);
          }}
          className={`w-1.5 relative shrink-0 cursor-col-resize select-none transition-colors group z-20 ${
            isDraggingCopilot
              ? "bg-[#C8A051]"
              : "bg-transparent hover:bg-[#C8A051]/60 border-l border-[#18181A]"
          }`}
          title="Drag to resize copilot drawer width"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* RIGHT AI COPILOT SIDEBAR */}
      <AICopilotSidebar
        isOpen={isCopilotOpen}
        width={copilotWidth}
        project={activeProject}
        activeSegment={activeSegment}
        wiki={activeWiki}
        threads={workspace.threads}
        stylisticProfile={workspace.stylisticProfile}
        onInsertTextIntoActiveSegment={text => {
          if (activeSegment) {
            handleUpdateText(activeSegment.id, activeSegment.textContent + text);
          }
        }}
        onDeconstructAndApply={handleDeconstructAndApply}
        onGenerateAlternativeBranch={prompt => {
          handleCreateBranch(`ai-${Date.now().toString(36)}`);
        }}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* MODAL: Version Control Tree */}
      <VersionTreeModal
        isOpen={isVcsModalOpen}
        versionDag={activeVersionDag}
        onClose={() => setIsVcsModalOpen(false)}
        onCheckoutCommit={handleCheckoutCommit}
        onCreateBranch={handleCreateBranch}
      />

      {/* MODAL: Safety Trash Drawer (Rule 1 Compliance) */}
      <TrashDrawer
        isOpen={isTrashModalOpen}
        trashItems={workspace.trash}
        onClose={() => setIsTrashModalOpen(false)}
        onRestore={handleRestoreFromTrash}
      />

      {/* MODAL: Studio & Visual Settings (Atmosphere, Typography, Browser Link, Local Backups, Egon) */}
      <VisualSettingsModal
        isOpen={isVisualSettingsOpen}
        onClose={() => setIsVisualSettingsOpen(false)}
        settings={visualSettings}
        onUpdateSettings={setVisualSettings}
        onExportManuscript={handleExportManuscript}
        onExportBackupJson={handleExportBackupJson}
        onTriggerBackupSnapshot={handleTriggerBackupSnapshot}
      />

      {/* MODAL: Project Settings (Title, Genre, Premise, Reader Promise) */}
      <ProjectSettingsModal
        isOpen={isProjectSettingsOpen}
        onClose={() => setIsProjectSettingsOpen(false)}
        project={activeProject}
        wiki={activeWiki}
        onSave={handleSaveProjectSettings}
      />

      {/* MODAL: Chapter / Segment Metadata */}
      {activeSegment && (
        <SegmentMetadataModal
          isOpen={isSegmentSettingsOpen}
          onClose={() => setIsSegmentSettingsOpen(false)}
          segment={activeSegment}
          onSave={handleSaveSegmentSettings}
        />
      )}

      {/* MODAL: Theme Collections Manager */}
      <ThemeManagerModal
        isOpen={isThemeManagerOpen}
        onClose={() => setIsThemeManagerOpen(false)}
        themes={workspace.themes}
        onAddTheme={handleAddTheme}
        onSoftDeleteTheme={handleSoftDeleteTheme}
      />

      {/* MODAL: Visual New Project Dialog */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        themes={workspace.themes}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProjectFromModal}
      />

      {/* MODAL: Master Craft Sentinel (McPhee, Nabokov, Gilligan, Nolan & Proactive Interval Nudges) */}
      <MasterCraftSentinelModal
        isOpen={isSentinelModalOpen}
        onClose={() => setIsSentinelModalOpen(false)}
        report={sentinelReport}
        settings={sentinelSettings}
        onUpdateSettings={(newSettings: SentinelSettings) => {
          setSentinelSettings(newSettings);
          try {
            window.localStorage.setItem("writ:sentinel:settings:v1", JSON.stringify(newSettings));
          } catch {}
        }}
        onFocusSection={(segmentId: string) => {
          handleSelectSegment(segmentId);
          setActiveView("editor");
        }}
        onTriggerTestNudge={() => {
          if (sentinelReport.diagnoses.length > 0) {
            setActiveNudgeToast(sentinelReport.diagnoses[0]);
          }
        }}
      />

      {/* FLOATING GENTLE NUDGE TOAST (Proactive craft interval alarm) */}
      {activeNudgeToast && (
        <div className="fixed bottom-6 right-6 max-w-md p-4 rounded-xl bg-[#141416] border border-[#C8A051]/60 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#C8A051]/20 flex items-center justify-center text-[#C8A051]">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8A051]">
                {activeNudgeToast.schoolLabel}
              </span>
            </div>
            <button
              onClick={() => setActiveNudgeToast(null)}
              className="text-[#71717A] hover:text-[#ECE7DE] cursor-pointer"
              title="Dismiss nudge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-[#ECE7DE] font-semibold">
            Section {activeNudgeToast.segmentRoman}: {activeNudgeToast.segmentTitle}
          </div>
          <div className="mt-1 text-[11px] text-[#A09A8F] leading-relaxed">
            {activeNudgeToast.headline}
          </div>
          <div className="mt-1 text-[10px] text-[#71717A] italic">
            {activeNudgeToast.recommendation}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                handleSelectSegment(activeNudgeToast.segmentId);
                setActiveView("editor");
                setActiveNudgeToast(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#C8A051] text-[#080808] text-xs font-semibold hover:bg-[#d9b161] cursor-pointer transition-colors"
            >
              Focus Section
            </button>
            <button
              onClick={() => {
                setIsSentinelModalOpen(true);
                setActiveNudgeToast(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#1E1E22] text-[#ECE7DE] text-xs border border-[#2C2C32] hover:bg-[#28282C] cursor-pointer transition-colors"
            >
              Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
