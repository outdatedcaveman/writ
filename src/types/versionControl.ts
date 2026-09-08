export type AuthorType = "human" | "ai_daemon" | "ai_copilot";

export interface AuthorIdentity {
  type: AuthorType;
  name: string;
  avatarBadge?: string;
}

export interface DiffChange {
  count?: number;
  added?: boolean;
  removed?: boolean;
  value: string;
}

export interface CommitNode {
  id: string;
  parentId: string | null;
  branch: string;
  timestamp: number;
  author: AuthorIdentity;
  message: string;
  affectedSegmentIds: string[];
  segmentSnapshots: Record<string, string>; // segmentId -> textContent
  wikiSnapshot?: any;
}

export interface Branch {
  name: string;
  headCommitId: string;
  createdAt: number;
}

export interface VersionDAG {
  commits: Record<string, CommitNode>;
  branches: Record<string, Branch>;
  activeBranch: string;
  headCommitId: string;
}
