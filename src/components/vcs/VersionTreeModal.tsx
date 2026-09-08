import React, { useState } from "react";
import { VersionDAG, CommitNode, Branch } from "../../types/versionControl";
import { getCommitHistoryList } from "../../engine/vcs/versionTree";
import {
  GitFork,
  GitCommit,
  GitBranch,
  RotateCcw,
  User,
  Bot,
  X,
  Check,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface VersionTreeModalProps {
  isOpen: boolean;
  versionDag: VersionDAG;
  onClose: () => void;
  onCheckoutCommit: (commitId: string) => void;
  onCreateBranch: (branchName: string) => void;
}

export const VersionTreeModal: React.FC<VersionTreeModalProps> = ({
  isOpen,
  versionDag,
  onClose,
  onCheckoutCommit,
  onCreateBranch
}) => {
  if (!isOpen) return null;

  const commits = getCommitHistoryList(versionDag);
  const [selectedCommitId, setSelectedCommitId] = useState<string>(
    versionDag.headCommitId || commits[0]?.id || ""
  );
  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  const selectedCommit = versionDag.commits[selectedCommitId] || commits[0];

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName.trim());
    setNewBranchName("");
    setIsCreatingBranch(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-8 text-[#ECE7DE]">
      <div className="w-full max-w-5xl h-[85vh] bg-[#101010] border border-[#242424] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7E9F86]/10 flex items-center justify-center text-[#7E9F86]">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium">Version Control Tree & Attribution DAG</h2>
              <p className="text-xs text-[#66625B]">
                Immutable record of manuscript states, author attribution (Human vs AI), and branch points
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreatingBranch(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#282828] text-xs font-medium hover:bg-[#242424] transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#6B8FA3]" />
              <span>Create Branch</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#66625B] hover:text-[#ECE7DE] p-1.5 rounded-lg hover:bg-[#202020] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create Branch inline row */}
        {isCreatingBranch && (
          <form onSubmit={handleCreateBranch} className="bg-[#181818] px-6 py-3 border-b border-[#242424] flex items-center gap-3">
            <GitBranch className="w-4 h-4 text-[#6B8FA3]" />
            <input
              type="text"
              placeholder="Branch name (e.g. experimental-ending, lyrical-rewrite)"
              value={newBranchName}
              onChange={e => setNewBranchName(e.target.value)}
              className="bg-[#0c0c0c] border border-[#282828] text-xs px-3 py-1.5 rounded-lg flex-1 text-[#ECE7DE] focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#6B8FA3] text-[#080808] text-xs font-medium hover:bg-[#82a4b7]"
            >
              Confirm Branch
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingBranch(false)}
              className="px-2 text-xs text-[#66625B] hover:text-[#A09A8F]"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Content Body: Split Tree & Detail Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* Commit List / Tree */}
          <div className="w-1/2 border-r border-[#202020] overflow-y-auto p-6 space-y-3 bg-[#0a0a0a]">
            {commits.map((commit, index) => {
              const isSelected = selectedCommitId === commit.id;
              const isHead = versionDag.headCommitId === commit.id;
              const isHuman = commit.author.type === "human";

              return (
                <div
                  key={commit.id}
                  onClick={() => setSelectedCommitId(commit.id)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#181818] border-[#7E9F86] shadow-lg"
                      : "bg-[#101010] border-[#202020] hover:border-[#303030]"
                  }`}
                >
                  {/* Top metadata line */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 ${
                        isHuman ? "bg-[#7E9F86]/10 text-[#7E9F86] border border-[#7E9F86]/30" : "bg-[#6B8FA3]/10 text-[#6B8FA3] border border-[#6B8FA3]/30"
                      }`}>
                        {isHuman ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span>{commit.author.name}</span>
                      </span>

                      {isHead && (
                        <span className="px-1.5 py-0.5 rounded bg-[#C8A051]/20 text-[#C8A051] text-[10px] font-mono font-bold">
                          HEAD
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-[#66625B]">
                      {new Date(commit.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Message */}
                  <h4 className="text-sm font-medium text-[#ECE7DE] mb-2">{commit.message}</h4>

                  {/* Commit hash & branches */}
                  <div className="flex items-center justify-between text-[11px] text-[#66625B] font-mono">
                    <span>{commit.id}</span>
                    <span>Branch: {commit.branch}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Commit Inspector */}
          <div className="w-1/2 flex flex-col justify-between p-6 bg-[#101010] overflow-y-auto">
            {selectedCommit ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-[#66625B]">{selectedCommit.id}</span>
                    <span className="text-xs text-[#444]">·</span>
                    <span className="text-xs text-[#A09A8F]">Branch {selectedCommit.branch}</span>
                  </div>
                  <h3 className="font-serif text-xl font-medium text-[#ECE7DE]">
                    {selectedCommit.message}
                  </h3>
                </div>

                <div className="bg-[#141414] p-4 rounded-xl border border-[#202020] space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block">
                    Author Attribution
                  </span>
                  <div className="flex items-center gap-2 text-sm text-[#ECE7DE]">
                    {selectedCommit.author.type === "human" ? (
                      <User className="w-4 h-4 text-[#7E9F86]" />
                    ) : (
                      <Bot className="w-4 h-4 text-[#6B8FA3]" />
                    )}
                    <span className="font-medium">{selectedCommit.author.name}</span>
                    <span className="text-xs text-[#66625B]">({selectedCommit.author.type})</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-2">
                    Affected Chapters ({selectedCommit.affectedSegmentIds.length})
                  </span>
                  <div className="space-y-1.5">
                    {selectedCommit.affectedSegmentIds.map(segId => (
                      <div key={segId} className="px-3 py-2 rounded-lg bg-[#141414] border border-[#202020] text-xs font-mono text-[#A09A8F]">
                        {segId}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Snapshot preview */}
                {Object.keys(selectedCommit.segmentSnapshots).length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#66625B] block mb-2">
                      Snapshot Excerpt
                    </span>
                    <div className="p-4 rounded-xl bg-[#0c0c0c] border border-[#202020] font-serif text-xs leading-relaxed text-[#A09A8F] max-h-48 overflow-y-auto">
                      {Object.values(selectedCommit.segmentSnapshots)[0]}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-xs text-[#66625B]">Select a commit to inspect</div>
            )}

            {selectedCommit && (
              <button
                onClick={() => {
                  onCheckoutCommit(selectedCommit.id);
                  onClose();
                }}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ECE7DE] text-[#080808] font-medium text-xs hover:bg-white transition-all cursor-pointer shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Checkout / Rollback to this Snapshot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
