import { CommitNode, VersionDAG, AuthorIdentity, DiffChange } from "../../types/versionControl";
import { diffLines, diffWords } from "diff";

export function generateCommitHash(): string {
  const chars = "abcdef0123456789";
  let hash = "c-";
  for (let i = 0; i < 7; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

export function computeTextDiff(oldText: string, newText: string, mode: "lines" | "words" = "words"): DiffChange[] {
  if (mode === "lines") {
    const raw = diffLines(oldText, newText);
    return raw.map(part => ({
      added: part.added,
      removed: part.removed,
      value: part.value,
      count: part.count
    }));
  }
  const raw = diffWords(oldText, newText);
  return raw.map(part => ({
    added: part.added,
    removed: part.removed,
    value: part.value,
    count: part.count
  }));
}

export function createCommitNode(params: {
  dag: VersionDAG;
  author: AuthorIdentity;
  message: string;
  affectedSegmentIds: string[];
  segmentSnapshots: Record<string, string>;
  wikiSnapshot?: any;
  branchName?: string;
}): { nextDag: VersionDAG; newCommit: CommitNode } {
  const branchName = params.branchName || params.dag.activeBranch || "main";
  const parentId = params.dag.branches[branchName]?.headCommitId || params.dag.headCommitId || null;
  const newId = generateCommitHash();

  const newCommit: CommitNode = {
    id: newId,
    parentId,
    branch: branchName,
    timestamp: Date.now(),
    author: params.author,
    message: params.message,
    affectedSegmentIds: params.affectedSegmentIds,
    segmentSnapshots: params.segmentSnapshots,
    wikiSnapshot: params.wikiSnapshot
  };

  const nextDag: VersionDAG = {
    commits: {
      ...params.dag.commits,
      [newId]: newCommit
    },
    branches: {
      ...params.dag.branches,
      [branchName]: {
        name: branchName,
        headCommitId: newId,
        createdAt: params.dag.branches[branchName]?.createdAt || Date.now()
      }
    },
    activeBranch: branchName,
    headCommitId: newId
  };

  return { nextDag, newCommit };
}

export function createNewBranch(dag: VersionDAG, branchName: string): VersionDAG {
  if (dag.branches[branchName]) {
    return { ...dag, activeBranch: branchName };
  }
  return {
    ...dag,
    branches: {
      ...dag.branches,
      [branchName]: {
        name: branchName,
        headCommitId: dag.headCommitId,
        createdAt: Date.now()
      }
    },
    activeBranch: branchName
  };
}

export function getCommitHistoryList(dag: VersionDAG): CommitNode[] {
  const list = Object.values(dag.commits);
  return list.sort((a, b) => b.timestamp - a.timestamp);
}
