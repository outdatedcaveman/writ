import React, { useState, useEffect } from "react";
import { Segment, ThreadEntity, ProjectWiki } from "../../types/workspace";
import { VersionDAG, AuthorIdentity } from "../../types/versionControl";
import { computeTextDiff } from "../../engine/vcs/versionTree";
import { analyzeSegmentMetrics, ManuscriptMetrics } from "../../engine/analysis/metrics";
import { renderLatexInText } from "../../engine/analysis/latexFormatter";
import {
  CheckCircle2,
  GitCommit,
  Sparkles,
  Sliders,
  History,
  FileCheck,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Sigma
} from "lucide-react";

interface SegmentEditorProps {
  segment: Segment;
  threads: Record<string, ThreadEntity>;
  wiki?: ProjectWiki;
  versionDag: VersionDAG;
  onUpdateText: (segmentId: string, text: string) => void;
  onCommit: (params: {
    segmentId: string;
    text: string;
    message: string;
    author: AuthorIdentity;
  }) => void;
  onOpenVcsModal: () => void;
}

export const SegmentEditor: React.FC<SegmentEditorProps> = ({
  segment,
  threads,
  wiki,
  versionDag,
  onUpdateText,
  onCommit,
  onOpenVcsModal
}) => {
  const [localText, setLocalText] = useState(segment.textContent || "");
  const [showDiff, setShowDiff] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showLatex, setShowLatex] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [authorType, setAuthorType] = useState<"human" | "ai_copilot">("human");
  const [metrics, setMetrics] = useState<ManuscriptMetrics>(() =>
    analyzeSegmentMetrics(segment, threads, wiki)
  );

  useEffect(() => {
    setLocalText(segment.textContent || "");
  }, [segment.id]);

  useEffect(() => {
    const updated = analyzeSegmentMetrics({ ...segment, textContent: localText }, threads, wiki);
    setMetrics(updated);
  }, [localText, segment, threads, wiki]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalText(val);
    onUpdateText(segment.id, val);
  };

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = commitMessage.trim() || (authorType === "human" ? "Manual edit by Bruno" : "AI revision");
    const author: AuthorIdentity = {
      type: authorType,
      name: authorType === "human" ? "Bruno" : "Writ AI Copilot",
      avatarBadge: authorType === "human" ? "B" : "AI"
    };
    onCommit({
      segmentId: segment.id,
      text: localText,
      message: msg,
      author
    });
    setCommitMessage("");
  };

  // Find last commit snapshot for diff
  const headCommitId = versionDag.branches[versionDag.activeBranch]?.headCommitId;
  const lastSnapshot = headCommitId && versionDag.commits[headCommitId]?.segmentSnapshots[segment.id]
    ? versionDag.commits[headCommitId].segmentSnapshots[segment.id]
    : segment.textContent;

  const diffResult = showDiff ? computeTextDiff(lastSnapshot, localText, "words") : [];
  const renderedLatexHtml = showLatex ? renderLatexInText(localText) : "";

  return (
    <div className="flex flex-col h-full bg-[#080808] text-[#ECE7DE] relative overflow-hidden">
      {/* Top Segment Breadcrumb & Goals Header */}
      <div className="border-b border-[#1c1c1c] bg-[#0c0c0c] px-8 py-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[#7E9F86] font-semibold">
              Section {segment.romanNumeral}
            </span>
            <span className="text-[#444]">·</span>
            <span className="text-[#A09A8F]">{segment.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowLatex(!showLatex);
                if (showDiff) setShowDiff(false);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showLatex
                  ? "bg-[#6B8FA3]/20 border-[#6B8FA3] text-[#6B8FA3]"
                  : "bg-[#141414] border-[#242424] text-[#A09A8F] hover:text-[#ECE7DE]"
              }`}
              title="Render LaTeX formulas ($...$ or $$...$$)"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>{showLatex ? "Raw Text" : "LaTeX Math"}</span>
            </button>

            <button
              onClick={() => {
                setShowDiff(!showDiff);
                if (showLatex) setShowLatex(false);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showDiff
                  ? "bg-[#7E9F86]/20 border-[#7E9F86] text-[#7E9F86]"
                  : "bg-[#141414] border-[#242424] text-[#A09A8F] hover:text-[#ECE7DE]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{showDiff ? "Hide Diff" : "Show Diff"}</span>
            </button>

            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showMetrics
                  ? "bg-[#6B8FA3]/20 border-[#6B8FA3] text-[#6B8FA3]"
                  : "bg-[#141414] border-[#242424] text-[#A09A8F] hover:text-[#ECE7DE]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Diagnostics ({metrics.totalWords} w)</span>
            </button>
          </div>
        </div>

        {/* Goals Checklist strip */}
        {segment.goals.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-[#66625B] pt-2 border-t border-[#161616]">
            <span className="text-[10px] uppercase tracking-wider text-[#A09A8F] shrink-0 font-medium">
              Deliverables:
            </span>
            <div className="flex flex-wrap gap-3">
              {segment.goals.map((goal, idx) => (
                <span key={idx} className="flex items-center gap-1.5 text-[#A09A8F]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7E9F86]" />
                  <span>{goal}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metrics & Diagnostic Collapsible Drawer */}
      {showMetrics && (
        <div className="bg-[#101010] border-b border-[#202020] p-6 shrink-0 transition-all">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-[#141414] p-3 rounded-lg border border-[#202020]">
                <span className="text-[10px] uppercase font-bold text-[#66625B] block">Pacing Cadence</span>
                <span className="font-serif text-sm font-medium text-[#ECE7DE] mt-1 block">
                  {metrics.pacingCadenceLabel}
                </span>
              </div>
              <div className="bg-[#141414] p-3 rounded-lg border border-[#202020]">
                <span className="text-[10px] uppercase font-bold text-[#66625B] block">Avg Sentence</span>
                <span className="font-mono text-sm text-[#ECE7DE] mt-1 block">
                  {metrics.averageSentenceLength} words
                </span>
              </div>
              <div className="bg-[#141414] p-3 rounded-lg border border-[#202020]">
                <span className="text-[10px] uppercase font-bold text-[#66625B] block">Dialogue Ratio</span>
                <span className="font-mono text-sm text-[#ECE7DE] mt-1 block">
                  {metrics.dialogueRatioPercent}%
                </span>
              </div>
              <div className="bg-[#141414] p-3 rounded-lg border border-[#202020]">
                <span className="text-[10px] uppercase font-bold text-[#66625B] block">Lexical Richness</span>
                <span className="font-mono text-sm text-[#ECE7DE] mt-1 block">
                  {metrics.lexicalDiversityScore} / 100
                </span>
              </div>
            </div>

            {/* Qualitative Bullets */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#A09A8F] block">
                Qualitative Literary & Structural Diagnostics
              </span>
              <div className="grid grid-cols-2 gap-3">
                {metrics.qualitativeBullets.map((bullet, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#141414] border border-[#202020] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[#ECE7DE]">{bullet.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        bullet.type === "strength" ? "bg-[#7E9F86]/20 text-[#7E9F86]" : "bg-[#BF614B]/20 text-[#BF614B]"
                      }`}>
                        {bullet.type}
                      </span>
                    </div>
                    <p className="text-[#A09A8F]">{bullet.observation}</p>
                    <p className="text-[#66625B] text-[11px] mt-1 italic">{bullet.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Manuscript Writing Surface */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {showLatex ? (
            <div className="p-5 rounded-xl bg-[#0c0c0c] border border-[#202020] space-y-4">
              <div className="text-xs font-mono text-[#6B8FA3] mb-1">
                LaTeX Math & Typesetting Render
              </div>
              <div
                className="font-serif text-lg leading-[1.8] text-[#ECE7DE] space-y-4 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: renderedLatexHtml }}
              />
            </div>
          ) : showDiff ? (
            <div className="font-serif text-lg leading-relaxed text-[#ECE7DE] space-y-4 p-4 rounded-xl bg-[#0c0c0c] border border-[#202020]">
              <div className="text-xs font-mono text-[#66625B] mb-2">
                Comparing current buffer against commit: {headCommitId || "initial"}
              </div>
              <p>
                {diffResult.map((part, index) => {
                  if (part.added) {
                    return (
                      <span key={index} className="bg-[#7E9F86]/30 text-[#7E9F86] px-0.5 rounded">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return (
                      <span key={index} className="bg-[#BF614B]/30 text-[#BF614B] line-through px-0.5 rounded opacity-60">
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={index}>{part.value}</span>;
                })}
              </p>
            </div>
          ) : (
            <textarea
              aria-label="Manuscript Editor"
              value={localText}
              onChange={handleTextChange}
              spellCheck
              placeholder="Begin writing your manuscript here (supports LaTeX math like $E = mc^2$ or $$\int_0^\infty f(x) dx$$)..."
              className="w-full bg-transparent text-[#ECE7DE] font-serif text-lg leading-[1.8] resize-none focus:outline-none placeholder:text-[#333] selection:bg-[#7E9F86]/30 min-h-[600px]"
            />
          )}
        </div>
      </div>

      {/* Bottom Version Control Commit Bar */}
      <div className="border-t border-[#1c1c1c] bg-[#0c0c0c] px-8 py-3 shrink-0 flex items-center justify-between">
        <form onSubmit={handleCommitSubmit} className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="flex items-center bg-[#141414] p-0.5 rounded-lg border border-[#242424]">
            <button
              type="button"
              onClick={() => setAuthorType("human")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                authorType === "human" ? "bg-[#282828] text-[#ECE7DE]" : "text-[#66625B]"
              }`}
            >
              <User className="w-3 h-3 text-[#7E9F86]" />
              <span>Bruno (Human)</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthorType("ai_copilot")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                authorType === "ai_copilot" ? "bg-[#282828] text-[#ECE7DE]" : "text-[#66625B]"
              }`}
            >
              <Bot className="w-3 h-3 text-[#6B8FA3]" />
              <span>Machine / AI</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="Commit message (e.g. Polished dialogue cadence, closed Section III argument)"
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            className="flex-1 bg-[#121212] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-1.5 rounded-lg focus:outline-none"
          />

          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-medium hover:bg-white transition-colors cursor-pointer shrink-0"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Record Commit</span>
          </button>
        </form>

        <button
          onClick={onOpenVcsModal}
          className="text-xs text-[#66625B] hover:text-[#A09A8F] flex items-center gap-1.5 cursor-pointer ml-4"
        >
          <History className="w-3.5 h-3.5" />
          <span>View Revision Tree</span>
        </button>
      </div>
    </div>
  );
};
