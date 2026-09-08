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
import { AuthorIdentity } from "./types/versionControl";
import { ThreadEntity, Segment, Project, ProjectVaultItem, VaultItemType } from "./types/workspace";
import {
  Sparkles,
  Wifi,
  WifiOff,
  GitBranch,
  FileText,
  Sliders,
  CheckCircle2,
  Share2
} from "lucide-react";

const store = new WorkspaceStore();

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => store.getState());
  const [activeView, setActiveView] = useState<"editor" | "wiki" | "diagrams" | "timeline" | "threads" | "projectVault" | "vault" | "publish">("editor");
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isVcsModalOpen, setIsVcsModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isEgonOnline, setIsEgonOnline] = useState<boolean | null>(null);

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

  const handleNewProject = () => {
    const title = prompt("Enter new project title:");
    if (!title || !title.trim()) return;

    const projId = `proj-${Date.now().toString(36)}`;
    const draftId = `draft-${Date.now().toString(36)}`;
    const segId = `seg-${Date.now().toString(36)}-1`;

    const newProject: Project = {
      id: projId,
      themeId: workspace.themes[0].id,
      title: title.trim(),
      slug: title.trim().toLowerCase().replace(/\s+/g, "-"),
      logline: "New creative inquiry.",
      genre: "essay",
      intent: "Explore and articulate a compelling thesis.",
      activeDraftId: draftId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const newSegment: Segment = {
      id: segId,
      draftId,
      title: "Opening Inquest",
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
            centralInquiry: "What question animates this work?",
            readerPromise: "Clear and resonant insight.",
            tone: "Reflective and exact.",
            genre: "essay",
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

  return (
    <div className="flex h-screen w-screen bg-[#080808] text-[#ECE7DE] overflow-hidden">
      {/* LEFT NAVIGATION COLUMN */}
      <ThemeProjectNav
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
      />

      {/* CENTER WORKSPACE AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080808] overflow-hidden">
        {/* Top Desktop Studio App Bar */}
        <header className="h-12 border-b border-[#1c1c1c] bg-[#0c0c0c] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-sm font-medium tracking-wide text-[#ECE7DE]">
              {activeProject.title}
            </h1>
            <span className="text-xs text-[#444]">/</span>
            <span className="text-xs text-[#A09A8F] capitalize">
              {activeView === "editor" && activeSegment
                ? `Section ${activeSegment.romanNumeral} · ${activeSegment.title}`
                : activeView === "projectVault"
                ? "Project Drop Vault & Auto-Arranger"
                : activeView === "publish"
                ? "Publishing & Asset Studio"
                : activeView}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[#66625B]">
              {isEgonOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-[#7E9F86]" />
                  <span className="text-[11px] font-mono text-[#7E9F86]">Egon Mind Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-[#66625B]" />
                  <span className="text-[11px] font-mono text-[#66625B]">Egon Mind Standalone</span>
                </>
              )}
            </div>

            <button
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                isCopilotOpen
                  ? "bg-[#C8A051]/20 border-[#C8A051] text-[#C8A051]"
                  : "bg-[#141414] border-[#242424] text-[#A09A8F] hover:text-[#ECE7DE]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Copilot</span>
            </button>
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
              onUpdateText={handleUpdateText}
              onCommit={handleCommit}
              onOpenVcsModal={() => setIsVcsModalOpen(true)}
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
            />
          ) : activeView === "timeline" ? (
            <TimelineMatrix
              segments={Object.values(workspace.segments).filter(s => s.draftId === activeProject.activeDraftId)}
              characters={activeWiki?.characters || []}
              threads={Object.values(workspace.threads).filter(t => t.projectId === activeProject.id)}
              plotPoints={activeWiki?.plotPoints || []}
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

      {/* RIGHT AI COPILOT SIDEBAR */}
      <AICopilotSidebar
        isOpen={isCopilotOpen}
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
    </div>
  );
}
