import React, { useState, useEffect, useRef } from "react";
import { Segment, ThreadEntity, ProjectWiki } from "../../types/workspace";
import { VersionDAG, AuthorIdentity } from "../../types/versionControl";
import { VisualSettings, defaultVisualSettings } from "../../types/visualSettings";
import { computeTextDiff } from "../../engine/vcs/versionTree";
import { analyzeSegmentMetrics, ManuscriptMetrics } from "../../engine/analysis/metrics";
import { renderLatexInText } from "../../engine/analysis/latexFormatter";
import { VisualFormattingToolbar } from "./VisualFormattingToolbar";
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
  Sigma,
  Edit3,
  Maximize2,
  Minimize2
} from "lucide-react";

interface SegmentEditorProps {
  segment: Segment;
  threads: Record<string, ThreadEntity>;
  wiki?: ProjectWiki;
  versionDag: VersionDAG;
  visualSettings?: VisualSettings;
  onUpdateText: (segmentId: string, text: string) => void;
  onCommit: (params: {
    segmentId: string;
    text: string;
    message: string;
    author: AuthorIdentity;
  }) => void;
  onOpenVcsModal: () => void;
  onOpenSegmentProperties?: () => void;
  onToggleZenMode?: () => void;
  isZenMode?: boolean;
}

export const SegmentEditor: React.FC<SegmentEditorProps> = ({
  segment,
  threads,
  wiki,
  versionDag,
  visualSettings = defaultVisualSettings,
  onUpdateText,
  onCommit,
  onOpenVcsModal,
  onOpenSegmentProperties,
  onToggleZenMode,
  isZenMode = false
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleInsertMarkdown = (before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = localText.substring(start, end) || defaultText;

    const replacement = `${before}${selected}${after}`;
    const newText = localText.substring(0, start) + replacement + localText.substring(end);

    setLocalText(newText);
    onUpdateText(segment.id, newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
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
    : "";

  const diffResult = computeTextDiff(lastSnapshot, localText);
  const renderedLatexHtml = renderLatexInText(localText);

  // Dynamic Typography & Column styling
  const fontClass =
    visualSettings.fontFamily === "jetbrains_mono"
      ? "font-mono"
      : visualSettings.fontFamily === "roboto_sans"
      ? "font-sans"
      : "font-serif";

  const columnWidthClass =
    visualSettings.columnWidth === "compact"
      ? "max-w-xl"
      : visualSettings.columnWidth === "wide"
      ? "max-w-4xl"
      : visualSettings.columnWidth === "full"
      ? "max-w-full px-6"
      : "max-w-2xl";

  const atmosphereBg =
    visualSettings.atmosphere === "paper_noir"
      ? "#14120E"
      : visualSettings.atmosphere === "midnight_slate"
      ? "#0B0E14"
      : visualSettings.atmosphere === "forest_noir"
      ? "#09120C"
      : "#080808";

  return (
    <div
      className="flex flex-col h-full rounded-xl border border-[#1c1c1c] overflow-hidden transition-colors"
      style={{ backgroundColor: atmosphereBg }}
    >
      {/* Top Chapter Metadata & Control Strip */}
      <div className="border-b border-[#1c1c1c] bg-[#0c0c0c]/80 backdrop-blur-sm px-6 py-3 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[#7E9F86] font-semibold text-sm">
              Section {segment.romanNumeral}
            </span>
            <span className="text-[#444]">·</span>
            <span className="text-[#ECE7DE] font-medium text-sm">{segment.title}</span>
            {onOpenSegmentProperties && (
              <button
                onClick={onOpenSegmentProperties}
                className="p-1 text-[#66625B] hover:text-[#C8A051] hover:bg-[#1c1c1c] rounded transition-colors cursor-pointer ml-1"
                title="Edit Chapter Beat & Deliverables (GUI)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleZenMode && (
              <button
                onClick={onToggleZenMode}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isZenMode
                    ? "bg-[#C8A051]/20 border-[#C8A051] text-[#C8A051]"
                    : "bg-[#141414] border-[#242424] text-[#A09A8F] hover:text-[#ECE7DE]"
                }`}
                title={isZenMode ? "Exit Zen Focus Mode" : "Enter Zen Focus Mode (Distraction-Free)"}
              >
                {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

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
          <div className="flex items-center gap-4 text-xs text-[#66625B] pt-1.5 border-t border-[#161616]">
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

      {/* Visual Formatting Toolbar (Visual-First GUI) */}
      <VisualFormattingToolbar
        onInsertMarkdown={handleInsertMarkdown}
        wordCount={metrics.totalWords}
        readingTimeMinutes={metrics.readingTimeMinutes}
        isMathPreview={showLatex}
        onToggleMathPreview={() => setShowLatex(!showLatex)}
      />

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

            {/* Qualitative Feedback Bullets */}
            <div className="bg-[#141414] p-4 rounded-lg border border-[#202020] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A09A8F]">
                <Sparkles className="w-3.5 h-3.5 text-[#C8A051]" />
                <span>Literary Cadence Diagnostics</span>
              </div>
              <ul className="text-xs text-[#A09A8F] space-y-1.5 pl-4 list-disc">
                {metrics.qualitativeBullets.map((bullet, idx) => (
                  <li key={idx}>
                    <strong className="text-[#ECE7DE] font-medium">{bullet.category}:</strong> {bullet.observation} {bullet.recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Manuscript Writing Surface */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className={`${columnWidthClass} mx-auto transition-all`}>
          {showLatex ? (
            <div className="p-5 rounded-xl bg-[#0c0c0c]/90 border border-[#202020] space-y-4">
              <div className="text-xs font-mono text-[#6B8FA3] mb-1">
                LaTeX Math & Typesetting Render
              </div>
              <div
                className={`${fontClass} leading-[${visualSettings.lineHeight}] text-[#ECE7DE] space-y-4 whitespace-pre-wrap`}
                style={{
                  fontSize: `${visualSettings.fontSize}px`,
                  lineHeight: visualSettings.lineHeight
                }}
                dangerouslySetInnerHTML={{ __html: renderedLatexHtml }}
              />
            </div>
          ) : showDiff ? (
            <div
              className={`${fontClass} text-[#ECE7DE] space-y-4 p-4 rounded-xl bg-[#0c0c0c]/90 border border-[#202020]`}
              style={{
                fontSize: `${visualSettings.fontSize}px`,
                lineHeight: visualSettings.lineHeight
              }}
            >
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
              ref={textareaRef}
              aria-label="Manuscript Editor"
              value={localText}
              onChange={handleTextChange}
              spellCheck
              placeholder="Begin writing your manuscript here (supports visual toolbar buttons, markdown, and LaTeX math like $E = mc^2$)..."
              style={{
                fontSize: `${visualSettings.fontSize}px`,
                lineHeight: visualSettings.lineHeight
              }}
              className={`w-full bg-transparent text-[#ECE7DE] ${fontClass} resize-none focus:outline-none placeholder:text-[#333] selection:bg-[#7E9F86]/30 min-h-[600px]`}
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
