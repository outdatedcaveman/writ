import {
  ThemeCollection,
  Project,
  ProjectWiki,
  Draft,
  Segment,
  ThreadEntity,
  TrashItem,
} from "../../types/workspace";
import { VersionDAG } from "../../types/versionControl";
import { VaultSample, StylisticProfile } from "../../types/profileVault";

const STORAGE_KEY = "writ:desktop:workspace:v1";

export interface WorkspaceState {
  themes: ThemeCollection[];
  projects: Project[];
  wikis: Record<string, ProjectWiki>; // projectId -> Wiki
  drafts: Record<string, Draft>; // draftId -> Draft
  segments: Record<string, Segment>; // segmentId -> Segment
  threads: Record<string, ThreadEntity>; // threadId -> Thread
  versionDAGs: Record<string, VersionDAG>; // projectId -> VersionDAG
  vaultSamples: VaultSample[];
  stylisticProfile: StylisticProfile;
  trash: TrashItem[]; // Safety Trash (Rule 1 compliance)
  activeProjectId: string;
  activeSegmentId: string | null;
}

export const initialStylisticProfile: StylisticProfile = {
  personaSummary: "Exact, reflective, philosophical, and uncompromisingly honest. Avoids corporate buzzwords, self-help clichés, and false certainty. Favors crisp prose with rhythmic cadence.",
  toneDescriptors: ["Reflective", "Exact", "Lucid", "Understated", "Dialectical"],
  lexicalHabits: {
    favoriteFormulations: [
      "organizes access",
      "quiet costs accumulate",
      "demand for certainty",
      "sit with questions",
      "fragility masked as strength"
    ],
    avoidPatterns: [
      "game-changer",
      "supercharge",
      "hacks",
      "synergy",
      "toxic positivity"
    ],
    typicalComplexity: "philosophical"
  },
  rhetoricalCadence: {
    sentencePacing: "Alternate between compact aphoristic statements and compound analytical sentences.",
    paragraphDensity: "3 to 4 tightly linked sentences per paragraph, developing one unified conceptual tension.",
    dialecticPattern: "Observe cultural consensus -> Reveal implicit hidden assumption -> Trace practical consequences -> Offer sustainable alternative."
  },
  thematicConvictions: [
    "Doubt is a form of hospitality to reality.",
    "Premature certainty creates systemic fragility.",
    "Clarity is an ongoing practice, not a permanent achievement."
  ],
  syntheticPromptDirectives: "Write with literary restraint. Measure progress through coherence, placed pieces, and unresolved tensions explored rather than mechanical word counts.",
  lastTrainedAt: Date.now()
};

export const initialVaultSamples: VaultSample[] = [
  {
    id: "sample-1",
    title: "On the Posture of Inquiry",
    author: "self",
    authorName: "Bruno",
    excerpt: "Certainty is rarely neutral. It organizes access, legitimizes some voices, and quiets others. What presents itself as clarity is often a social demand with rules we inherit before we can question them.",
    tags: ["philosophy", "epistemology", "personal-voice"],
    addedAt: Date.now() - 86400000 * 5,
    wordCount: 38
  },
  {
    id: "sample-2",
    title: "The Architecture of Restraint",
    author: "admired_model",
    authorName: "George Orwell & Joan Didion",
    excerpt: "If thought corrupts language, language can also corrupt thought. To write clearly is to think clearly, and to think clearly requires the willingness to be uncomfortable with ambiguity.",
    tags: ["craft", "style-model", "clarity"],
    addedAt: Date.now() - 86400000 * 3,
    wordCount: 34
  }
];

export function getInitialWorkspace(): WorkspaceState {
  const themeEssays: ThemeCollection = {
    id: "theme-essays",
    name: "Essays & Philosophical Monographs",
    slug: "essays-and-monographs",
    description: "Longform philosophical essays exploring epistemology, institutional dynamics, and cultural critique.",
    colorBadge: "#7E9F86",
    createdAt: Date.now() - 86400000 * 10
  };

  const themeFiction: ThemeCollection = {
    id: "theme-fiction",
    name: "Fiction & Narrative Works",
    slug: "fiction-and-narratives",
    description: "Novels, short fiction, character studies, and speculative prose.",
    colorBadge: "#6B8FA3",
    createdAt: Date.now() - 86400000 * 8
  };

  const proj1: Project = {
    id: "proj-uncertainty",
    themeId: "theme-essays",
    title: "The Uses of Uncertainty",
    slug: "the-uses-of-uncertainty",
    logline: "An inquiry into how the cultural demand for certainty undermines institutional wisdom, relational intimacy, and genuine thought.",
    genre: "essay",
    intent: "Move from abstract praise of uncertainty to concrete social costs, then offer a livable alternative. Voice should remain reflective, exact, and personal without becoming confessional.",
    activeDraftId: "draft-uncertainty-1",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now()
  };

  const thread1: ThreadEntity = {
    id: "th-social-demand",
    projectId: "proj-uncertainty",
    name: "Certainty as Social Demand",
    category: "main_plot",
    description: "How institutions demand definitive answers to manage risk, filtering out curiosity.",
    status: "developing",
    appearances: [
      { segmentId: "seg-1", beatDescription: "Introduced as initial hypothesis", resolutionState: "introduced" },
      { segmentId: "seg-2", beatDescription: "Historical origins of corporate risk aversion", resolutionState: "developed" },
      { segmentId: "seg-3", beatDescription: "Institutional reward structures and performative confidence", resolutionState: "developed" }
    ]
  };

  const thread2: ThreadEntity = {
    id: "th-personal-cost",
    projectId: "proj-uncertainty",
    name: "The Personal Cost of Certainty",
    category: "argument",
    description: "The psychological boundary drawn around the unknown that stunts ethical judgment and growth.",
    status: "developing",
    appearances: [
      { segmentId: "seg-3", beatDescription: "Examining fear of looking indecisive", resolutionState: "developed" }
    ]
  };

  const thread3: ThreadEntity = {
    id: "th-living-well",
    projectId: "proj-uncertainty",
    name: "Hospitality to Doubt",
    category: "thematic",
    description: "Practices for staying open to unfolding reality without paralysis.",
    status: "open",
    appearances: [
      { segmentId: "seg-4", beatDescription: "Synthesizing a livable ethos of open inquiry", resolutionState: "introduced" }
    ]
  };

  const seg1: Segment = {
    id: "seg-1",
    draftId: "draft-uncertainty-1",
    title: "The posture of uncertainty",
    romanNumeral: "I",
    order: 1,
    synopsis: "Opening philosophical provocation distinguishing passive indecision from active, hospitable doubt.",
    goals: ["Establish that certainty is not neutral", "Introduce the reader to the posture of dwelling with questions"],
    treatedThreadIds: ["th-social-demand"],
    characterIds: ["char-the-speaker"],
    textContent: `Certainty is rarely neutral. It organizes access, legitimizes some voices, and quiets others. What presents itself as clarity is often a social demand with rules we inherit before we can question them.\n\nWe reward definitive answers because they travel well. They fit in headlines, survive meetings, and reduce risk—at least in the short term. But the costs accumulate elsewhere.`,
    status: "done"
  };

  const seg2: Segment = {
    id: "seg-2",
    draftId: "draft-uncertainty-1",
    title: "Where certainty comes from",
    romanNumeral: "II",
    order: 2,
    synopsis: "Traces the modern impulse toward predictability through institutional bureaucracy and metricization.",
    goals: ["Examine why organizations optimize for certainty production over truth-seeking"],
    treatedThreadIds: ["th-social-demand"],
    characterIds: ["char-the-speaker"],
    textContent: `When certainty becomes a requirement, curiosity starts to look like indecision. People hedge their language. They perform confidence to belong. Systems mistake that performance for truth. Over time, the signal we optimize for is no longer truth-seeking but certainty production.`,
    status: "done"
  };

  const seg3: Segment = {
    id: "seg-3",
    draftId: "draft-uncertainty-1",
    title: "Certainty as a social demand",
    romanNumeral: "III",
    order: 3,
    synopsis: "Deep dive into the interpersonal and ethical toll of pretending to know.",
    goals: ["Illustrate the personal dimension of certainty", "Demonstrate how the demand limits moral imagination"],
    treatedThreadIds: ["th-social-demand", "th-personal-cost"],
    characterIds: ["char-the-speaker"],
    textContent: `The demand for certainty also has a personal dimension. It promises relief from the discomfort of not knowing. It draws a boundary around the unknown and dares us to stay within it. But growth, learning, and ethical judgment depend on our ability to sit with questions long enough for better ones to emerge.\n\nIf we want wiser institutions and truer relationships, we have to change the incentives.`,
    status: "active"
  };

  const seg4: Segment = {
    id: "seg-4",
    draftId: "draft-uncertainty-1",
    title: "Living well with uncertainty",
    romanNumeral: "IV",
    order: 4,
    synopsis: "The concluding constructive thesis offering concrete practices for daily intellectual hospitality.",
    goals: ["Present hospitality as the antidote to fear", "Close the loop on institutional incentives"],
    treatedThreadIds: ["th-living-well"],
    characterIds: ["char-the-speaker"],
    textContent: `To live well with uncertainty is not to drift without direction. It is to recognize that our maps are always smaller than the territory. When we leave room for what we do not yet comprehend, we make space for other people, for serendipity, and for wiser judgment.`,
    status: "open"
  };

  const wiki1: ProjectWiki = {
    themeAndPremise: {
      centralInquiry: "How can uncertainty become a fertile condition for thought and relationship, rather than merely an inconvenience to eliminate?",
      readerPromise: "Move from abstract praise of uncertainty to concrete social costs, then offer a livable alternative.",
      tone: "Reflective, exact, personal without becoming confessional.",
      genre: "essay",
      targetLength: "4,000 - 6,000 words"
    },
    characters: [
      {
        id: "char-the-speaker",
        name: "The Inquiring Voice",
        role: "protagonist",
        description: "The essayistic observer speaking from within modern institutions.",
        motivation: "To recover intellectual honesty in environments dominated by posturing.",
        arc: "Moves from complicity in premature certainty toward grounded comfort with not-knowing.",
        relationships: []
      },
      {
        id: "char-the-technocrat",
        name: "The Institutional Steward",
        role: "foil",
        description: "Archetype representing bureaucratic and corporate need for predictable quarterly forecasts.",
        motivation: "Risk minimization, procedural compliance, reputational defense.",
        arc: "Static archetype embodying the structural incentives of modern management.",
        relationships: [
          { targetId: "char-the-speaker", relationType: "opposing", tensionLevel: 7, notes: "Pressures the speaker for unhedged guarantees." }
        ]
      }
    ],
    arguments: [
      {
        id: "arg-1",
        claim: "Certainty is an organizational performance before it is an epistemic truth.",
        premise: "Hierarchies punish acknowledged ignorance faster than they punish confident error.",
        evidence: "Meeting culture, consulting decks, public political speeches, risk models.",
        counterpoints: "Definitive guidance is sometimes necessary in immediate crises.",
        targetSegmentIds: ["seg-1", "seg-2"]
      },
      {
        id: "arg-2",
        claim: "Premature clarity narrows discovery and destroys empathy.",
        premise: "Labeling someone or something definitively prevents asking the next question.",
        evidence: "Interpersonal conflict escalation; research siloing.",
        counterpoints: "Without categories, cognitive load becomes overwhelming.",
        targetSegmentIds: ["seg-3", "seg-4"]
      }
    ],
    plotPoints: [
      {
        id: "pp-1",
        title: "The Illusion of Neutrality",
        act: "Act I",
        beatType: "catalyst",
        description: "The speaker unmasks the hidden value judgment behind calls for 'pure objectivity'.",
        targetSegmentId: "seg-1",
        order: 1
      },
      {
        id: "pp-2",
        title: "The Certainty Trap",
        act: "Act II-A",
        beatType: "midpoint",
        description: "Tracing how hedging is weeded out, leaving only performative confidence.",
        targetSegmentId: "seg-2",
        order: 2
      },
      {
        id: "pp-3",
        title: "The Human Toll",
        act: "Act II-B",
        beatType: "all_is_lost",
        description: "Demonstrating how the need to feel safe stunts ethical development.",
        targetSegmentId: "seg-3",
        order: 3
      },
      {
        id: "pp-4",
        title: "The Hospitable Mind",
        act: "Act III",
        beatType: "resolution",
        description: "Articulating the disciplined practice of staying with unanswered questions.",
        targetSegmentId: "seg-4",
        order: 4
      }
    ],
    macroStructure: {
      framework: "dialectic_thesis_antithesis",
      acts: [
        { name: "Thesis (The Demand)", summary: "How certainty is manufactured and rewarded.", targetPacing: "measured" },
        { name: "Antithesis (The Hidden Cost)", summary: "The systemic and psychological fragility it causes.", targetPacing: "building" },
        { name: "Synthesis (Active Hospitality)", summary: "A disciplined alternative posture for life and work.", targetPacing: "reflective" }
      ]
    }
  };

  const draft1: Draft = {
    id: "draft-uncertainty-1",
    projectId: "proj-uncertainty",
    name: "First Complete Draft",
    segmentIds: ["seg-1", "seg-2", "seg-3", "seg-4"],
    updatedAt: Date.now()
  };

  const rootCommit = {
    id: "c-root-001",
    parentId: null,
    branch: "main",
    timestamp: Date.now() - 86400000 * 2,
    author: { type: "ai_daemon" as const, name: "Writ Ingestion Engine" },
    message: "Initial deconstruction of essay manuscript into 4 segments and Wiki entities",
    affectedSegmentIds: ["seg-1", "seg-2", "seg-3", "seg-4"],
    segmentSnapshots: {
      "seg-1": seg1.textContent,
      "seg-2": seg2.textContent,
      "seg-3": seg3.textContent,
      "seg-4": seg4.textContent
    }
  };

  const humanCommit = {
    id: "c-human-002",
    parentId: "c-root-001",
    branch: "main",
    timestamp: Date.now() - 86400000 * 1,
    author: { type: "human" as const, name: "Bruno" },
    message: "Polished Section III cadence and strengthened social incentive critique",
    affectedSegmentIds: ["seg-3"],
    segmentSnapshots: {
      "seg-3": seg3.textContent
    }
  };

  const vcs1: VersionDAG = {
    commits: {
      "c-root-001": rootCommit,
      "c-human-002": humanCommit
    },
    branches: {
      main: {
        name: "main",
        headCommitId: "c-human-002",
        createdAt: Date.now() - 86400000 * 2
      }
    },
    activeBranch: "main",
    headCommitId: "c-human-002"
  };

  return {
    themes: [themeEssays, themeFiction],
    projects: [proj1],
    wikis: { [proj1.id]: wiki1 },
    drafts: { [draft1.id]: draft1 },
    segments: {
      [seg1.id]: seg1,
      [seg2.id]: seg2,
      [seg3.id]: seg3,
      [seg4.id]: seg4
    },
    threads: {
      [thread1.id]: thread1,
      [thread2.id]: thread2,
      [thread3.id]: thread3
    },
    versionDAGs: { [proj1.id]: vcs1 },
    vaultSamples: initialVaultSamples,
    stylisticProfile: initialStylisticProfile,
    trash: [],
    activeProjectId: proj1.id,
    activeSegmentId: seg3.id
  };
}

export class WorkspaceStore {
  private state: WorkspaceState;

  constructor() {
    this.state = this.load();
  }

  public getState(): WorkspaceState {
    return this.state;
  }

  public save(state: WorkspaceState) {
    this.state = state;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  }

  private load(): WorkspaceState {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn("Storage load failed, returning fresh workspace:", e);
    }
    return getInitialWorkspace();
  }

  // RULE 1: Soft-delete only, zero permanent deletion
  public softDelete(item: TrashItem, currentState: WorkspaceState): WorkspaceState {
    const nextTrash = [item, ...currentState.trash];
    const nextState = { ...currentState, trash: nextTrash };

    // Apply soft-deletion flag according to entity type
    if (item.entityType === "segment") {
      const seg = nextState.segments[item.id];
      if (seg) {
        nextState.segments = {
          ...nextState.segments,
          [item.id]: { ...seg, isArchived: true }
        };
      }
    } else if (item.entityType === "project") {
      nextState.projects = nextState.projects.map(p =>
        p.id === item.id ? { ...p, isArchived: true } : p
      );
    } else if (item.entityType === "thread") {
      const th = nextState.threads[item.id];
      if (th) {
        nextState.threads = {
          ...nextState.threads,
          [item.id]: { ...th, isArchived: true }
        };
      }
    } else if (item.entityType === "character") {
      const wiki = nextState.wikis[item.projectId || nextState.activeProjectId];
      if (wiki) {
        nextState.wikis[item.projectId || nextState.activeProjectId] = {
          ...wiki,
          characters: wiki.characters.map(c => c.id === item.id ? { ...c, isArchived: true } : c)
        };
      }
    } else if (item.entityType === "argument") {
      const wiki = nextState.wikis[item.projectId || nextState.activeProjectId];
      if (wiki) {
        nextState.wikis[item.projectId || nextState.activeProjectId] = {
          ...wiki,
          arguments: wiki.arguments.map(a => a.id === item.id ? { ...a, isArchived: true } : a)
        };
      }
    } else if (item.entityType === "plotPoint") {
      const wiki = nextState.wikis[item.projectId || nextState.activeProjectId];
      if (wiki) {
        nextState.wikis[item.projectId || nextState.activeProjectId] = {
          ...wiki,
          plotPoints: wiki.plotPoints.map(p => p.id === item.id ? { ...p, isArchived: true } : p)
        };
      }
    }

    this.save(nextState);
    return nextState;
  }

  // Restore an item from the Safety Trash
  public restoreFromTrash(trashId: string, currentState: WorkspaceState): WorkspaceState {
    const target = currentState.trash.find(t => t.id === trashId);
    if (!target) return currentState;

    const nextTrash = currentState.trash.filter(t => t.id !== trashId);
    const nextState = { ...currentState, trash: nextTrash };

    if (target.entityType === "segment") {
      const seg = nextState.segments[target.id];
      if (seg) {
        nextState.segments = {
          ...nextState.segments,
          [target.id]: { ...seg, isArchived: false }
        };
      }
    } else if (target.entityType === "project") {
      nextState.projects = nextState.projects.map(p =>
        p.id === target.id ? { ...p, isArchived: false } : p
      );
    } else if (target.entityType === "thread") {
      const th = nextState.threads[target.id];
      if (th) {
        nextState.threads = {
          ...nextState.threads,
          [target.id]: { ...th, isArchived: false }
        };
      }
    } else if (target.entityType === "character") {
      const wiki = nextState.wikis[target.projectId || nextState.activeProjectId];
      if (wiki) {
        nextState.wikis[target.projectId || nextState.activeProjectId] = {
          ...wiki,
          characters: wiki.characters.map(c => c.id === target.id ? { ...c, isArchived: false } : c)
        };
      }
    } else if (target.entityType === "argument") {
      const wiki = nextState.wikis[target.projectId || nextState.activeProjectId];
      if (wiki) {
        nextState.wikis[target.projectId || nextState.activeProjectId] = {
          ...wiki,
          arguments: wiki.arguments.map(a => a.id === target.id ? { ...a, isArchived: false } : a)
        };
      }
    } else if (target.entityType === "plotPoint") {
      const wiki = nextState.wikis[target.projectId || nextState.activeProjectId];
      if (wiki) {
        nextState.wikis[target.projectId || nextState.activeProjectId] = {
          ...wiki,
          plotPoints: wiki.plotPoints.map(p => p.id === target.id ? { ...p, isArchived: false } : p)
        };
      }
    }

    this.save(nextState);
    return nextState;
  }
}
