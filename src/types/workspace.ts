export interface ThemeCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  colorBadge: string;
  createdAt: number;
}

export interface CharacterRelation {
  targetId: string;
  relationType: "ally" | "rival" | "mentor" | "dependent" | "conflicted" | "opposing";
  tensionLevel: number; // 1 to 10
  notes?: string;
}

export interface CharacterEntity {
  id: string;
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "foil" | "mentor";
  description: string;
  motivation: string;
  arc: string;
  relationships: CharacterRelation[];
  isArchived?: boolean;
}

export interface ArgumentEntity {
  id: string;
  claim: string;
  premise: string;
  evidence: string;
  counterpoints: string;
  targetSegmentIds: string[];
  isArchived?: boolean;
}

export interface PlotPointEntity {
  id: string;
  title: string;
  act: "Act I" | "Act II-A" | "Act II-B" | "Act III" | "Prologue" | "Epilogue";
  beatType: "catalyst" | "debate" | "break_into_two" | "midpoint" | "all_is_lost" | "climax" | "resolution" | "argument_advance";
  description: string;
  targetSegmentId?: string;
  order: number;
  isArchived?: boolean;
}

export interface ProjectWiki {
  themeAndPremise: {
    centralInquiry: string;
    readerPromise: string;
    tone: string;
    genre: "fiction" | "essay" | "philosophy" | "journalism" | "screenplay";
    targetLength: string;
  };
  characters: CharacterEntity[];
  arguments: ArgumentEntity[];
  plotPoints: PlotPointEntity[];
  macroStructure: {
    framework: "three_act" | "hero_journey" | "dialectic_thesis_antithesis" | "thematic_exploration";
    acts: {
      name: string;
      summary: string;
      targetPacing: "measured" | "building" | "urgent" | "reflective";
    }[];
  };
}

export interface ThreadAppearance {
  segmentId: string;
  beatDescription: string;
  resolutionState: "introduced" | "developed" | "resolved";
}

export interface ThreadEntity {
  id: string;
  projectId: string;
  name: string;
  category: "main_plot" | "subplot" | "character_arc" | "argument" | "thematic";
  description: string;
  status: "open" | "developing" | "closed";
  appearances: ThreadAppearance[];
  isArchived?: boolean;
}

export interface Segment {
  id: string;
  draftId: string;
  title: string;
  romanNumeral: string;
  order: number;
  synopsis: string;
  goals: string[];
  treatedThreadIds: string[];
  characterIds: string[];
  textContent: string;
  status: "open" | "active" | "done";
  isArchived?: boolean;
}

export interface Draft {
  id: string;
  projectId: string;
  name: string;
  segmentIds: string[];
  updatedAt: number;
}

export interface Project {
  id: string;
  themeId: string;
  title: string;
  slug: string;
  logline: string;
  genre: "fiction" | "essay" | "philosophy" | "journalism" | "screenplay";
  intent: string;
  activeDraftId: string;
  createdAt: number;
  updatedAt: number;
  isArchived?: boolean;
}

export interface TrashItem {
  id: string;
  entityType: "theme" | "project" | "draft" | "segment" | "character" | "argument" | "plotPoint" | "thread";
  entityName: string;
  deletedAt: number;
  projectId?: string;
  payload: any;
}
