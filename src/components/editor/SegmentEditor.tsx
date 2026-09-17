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

  const [showGoals, setShowGoals] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  // Dynamic Typography & Column styling
  const getFontFamilyStyle = () => {
    switch (visualSettings.fontFamily) {
      case "source_serif":
        return "'Source Serif 4', Georgia, serif";
      case "eb_garamond":
        return "'EB Garamond', Garamond, Georgia, serif";
      case "merriweather":
        return "'Merriweather', Georgia, serif";
      case "lora":
        return "'Lora', Georgia, serif";
      case "literata":
        return "'Literata', Georgia, serif";
      case "roboto_sans":
        return "'Roboto', -apple-system, sans-serif";
      case "inter":
        return "'Inter', -apple-system, sans-serif";
      case "jetbrains_mono":
        return "'JetBrains Mono', monospace";
      case "fira_code":
        return "'Fira Code', monospace";
      case "custom":
        return visualSettings.customFontName ? `'${visualSettings.customFontName}', sans-serif` : "inherit";
      default:
        return "'Source Serif 4', Georgia, serif";
    }
  };

  const fontClass =
    visualSettings.fontFamily === "jetbrains_mono" || visualSettings.fontFamily === "fira_code"
      ? "font-mono"
      : visualSettings.fontFamily === "roboto_sans" || visualSettings.fontFamily === "inter"
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
      className="flex flex-col h-full rounded-xl border border-[#18181A] overflow-hidden transition-colors"
      style={{ backgroundColor: atmosphereBg }}
    >
      {/* Visual Formatting Toolbar (Sleek, Compact, Visual-First) */}
      <VisualFormattingToolbar
        onInsertMarkdown={handleInsertMarkdown}
        isMathPreview={showLatex}
        onToggleMathPreview={() => setShowLatex(!showLatex)}
      />

      {/* Literary Cadence Diagnostics Drawer */}
      {showMetrics && (
        <div className="bg-[#0D0D0F] border-b border-[#1E1E22] p-5 shrink-0 transition-all">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="bg-[#141416] p-2.5 rounded-lg border border-[#222226]">
                <span className="text-[10px] uppercase font-bold text-[#71717A] block">Pacing Cadence</span>
                <span className="font-serif text-xs font-medium text-[#ECE7DE] mt-1 block">
                  {metrics.pacingCadenceLabel}
                </span>
              </div>
              <div className="bg-[#141416] p-2.5 rounded-lg border border-[#222226]">
                <span className="text-[10px] uppercase font-bold text-[#71717A] block">Avg Sentence</span>
                <span className="font-mono text-xs text-[#ECE7DE] mt-1 block">
                  {metrics.averageSentenceLength} words
                </span>
              </div>
              <div className="bg-[#141416] p-2.5 rounded-lg border border-[#222226]">
                <span className="text-[10px] uppercase font-bold text-[#71717A] block">Dialogue Ratio</span>
                <span className="font-mono text-xs text-[#ECE7DE] mt-1 block">
                  {metrics.dialogueRatioPercent}%
                </span>
              </div>
              <div className="bg-[#141416] p-2.5 rounded-lg border border-[#222226]">
                <span className="text-[10px] uppercase font-bold text-[#71717A] block">Lexical Richness</span>
                <span className="font-mono text-xs text-[#ECE7DE] mt-1 block">
                  {metrics.lexicalDiversityScore} / 100
                </span>
              </div>
            </div>

            {/* Qualitative Cadence Feedback */}
            <div className="bg-[#141416] p-3.5 rounded-lg border border-[#222226] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A1A1AA]">
                <Sparkles className="w-3.5 h-3.5 text-[#C8A051]" />
                <span>Cadence & Voice Observations</span>
              </div>
              <ul className="text-xs text-[#A1A1AA] space-y-1 pl-4 list-disc">
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

      {/* Main Manuscript Canvas */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className={`${columnWidthClass} mx-auto transition-all`}>
          {/* Document Header (Integrated Directly into the Manuscript Sheet) */}
          <div className="mb-6 pb-4 border-b border-[#18181A]/60">
            <div className="flex items-center justify-between text-xs text-[#71717A] font-sans tracking-widest uppercase mb-2">
              <span className="font-mono font-medium text-[#7E9F86]">Section {segment.romanNumeral}</span>

              {/* Action Toolbar on Document */}
              <div className="flex items-center gap-2">
                {segment.goals.length > 0 && (
                  <button
                    onClick={() => setShowGoals(!showGoals)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#141416] border border-[#222226] text-[11px] text-[#A1A1AA] hover:text-[#ECE7DE] cursor-pointer transition-colors"
                    title="Toggle Chapter Deliverables"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#7E9F86]" />
                    <span>{segment.goals.length} Goals</span>
                  </button>
                )}

                {onOpenSegmentProperties && (
                  <button
                    onClick={onOpenSegmentProperties}
                    className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
                    title="Edit Chapter Beat & Deliverables"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    showDiff ? "bg-[#7E9F86]/15 text-[#7E9F86]" : "hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE]"
                  }`}
                  title={showDiff ? "Hide Git Diff" : "Show Git Diff vs Last Commit"}
                >
                  <History className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowMetrics(!showMetrics)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    showMetrics ? "bg-[#C8A051]/15 text-[#C8A051]" : "hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE]"
                  }`}
                  title="Toggle Literary Cadence Diagnostics"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Elegant Document Title */}
            <h1
              className="text-2xl md:text-3xl font-medium tracking-tight text-[#ECE7DE]"
              style={{ fontFamily: getFontFamilyStyle() }}
            >
              {segment.title}
            </h1>

            {/* Collapsible Goals Box */}
            {showGoals && segment.goals.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-[#141416] border border-[#222226] text-xs text-[#A1A1AA] space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold block">
                  Chapter Goals & Deliverables
                </span>
                {segment.goals.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#7E9F86] shrink-0" />
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manuscript Text Surface */}
          {showLatex ? (
            <div className="p-5 rounded-xl bg-[#0c0c0c]/90 border border-[#202020] space-y-4">
              <div className="text-xs font-mono text-[#6B8FA3] mb-1">
                LaTeX Math & Typesetting Render
              </div>
              <div
                className={`${fontClass} leading-[${visualSettings.lineHeight}] text-[#ECE7DE] space-y-4 whitespace-pre-wrap`}
                style={{
                  fontSize: `${visualSettings.fontSize}px`,
                  lineHeight: visualSettings.lineHeight,
                  fontFamily: getFontFamilyStyle()
                }}
                dangerouslySetInnerHTML={{ __html: renderedLatexHtml }}
              />
            </div>
          ) : showDiff ? (
            <div
              className={`${fontClass} text-[#ECE7DE] space-y-4 p-4 rounded-xl bg-[#0c0c0c]/90 border border-[#202020]`}
              style={{
                fontSize: `${visualSettings.fontSize}px`,
                lineHeight: visualSettings.lineHeight,
                fontFamily: getFontFamilyStyle()
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
              placeholder="Begin writing your manuscript here..."
              style={{
                fontSize: `${visualSettings.fontSize}px`,
                lineHeight: visualSettings.lineHeight,
                fontFamily: getFontFamilyStyle()
              }}
              className={`w-full bg-transparent text-[#ECE7DE] ${fontClass} resize-none focus:outline-none placeholder:text-[#2A2A2E] selection:bg-[#7E9F86]/30 min-h-[600px]`}
            />
          )}
        </div>
      </div>

      {/* Quiet, Distraction-Free Bottom Status Bar */}
      <div className="h-9 border-t border-[#18181A] bg-[#0A0A0C] px-6 shrink-0 flex items-center justify-between text-xs text-[#71717A] select-none font-sans">
        {/* Left Metrics & Save Status */}
        <div className="flex items-center gap-3">
          <span className="text-[#A1A1AA] font-medium">{metrics.totalWords.toLocaleString()} words</span>
          <span>·</span>
          <span>~{metrics.readingTimeMinutes} min read</span>
          <span>·</span>
          <span className="text-[#52525B]">Cadence: {metrics.pacingCadenceLabel}</span>
        </div>

        {/* Right Version Control & Author Actions */}
        <div className="flex items-center gap-3">
          {/* Author Badge (Click to toggle) */}
          <button
            onClick={() => setAuthorType(authorType === "human" ? "ai_copilot" : "human")}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Click to toggle Human / AI author attribution"
          >
            {authorType === "human" ? (
              <>
                <User className="w-3 h-3 text-[#7E9F86]" />
                <span>Bruno</span>
              </>
            ) : (
              <>
                <Bot className="w-3 h-3 text-[#6B8FA3]" />
                <span>Machine / AI</span>
              </>
            )}
          </button>

          <span>·</span>

          {/* Branch link */}
          <button
            onClick={onOpenVcsModal}
            className="flex items-center gap-1 text-[11px] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Open Version Control DAG Tree"
          >
            <History className="w-3 h-3 text-[#C8A051]" />
            <span>{versionDag.activeBranch} ({Object.keys(versionDag?.commits || {}).length} commits)</span>
          </button>

          {/* Quick Commit Trigger Button */}
          <button
            onClick={() => setIsCommitModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#ECE7DE] hover:text-white text-[11px] font-medium cursor-pointer transition-colors ml-1"
            title="Record Version Control Snapshot (Ctrl+S / Commit)"
          >
            <GitCommit className="w-3 h-3 text-[#7E9F86]" />
            <span>Commit</span>
          </button>
        </div>
      </div>

      {/* Modal / Dialog for Commit Snapshot */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-serif text-sm font-semibold text-[#ECE7DE]">
                <GitCommit className="w-4 h-4 text-[#7E9F86]" />
                <span>Record Version Snapshot</span>
              </div>
              <button
                onClick={() => setIsCommitModalOpen(false)}
                className="text-[#71717A] hover:text-[#ECE7DE] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                handleCommitSubmit(e);
                setIsCommitModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold block mb-1">
                  Commit Note / Intention
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Polished dialogue cadence, closed Section III argument"
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  className="w-full bg-[#18181A] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-[#71717A]">
                  <span>Author:</span>
                  <span className="text-[#ECE7DE] font-medium capitalize">
                    {authorType === "human" ? "Bruno (Human)" : "AI Copilot"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCommitModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#71717A] hover:text-[#ECE7DE] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#ECE7DE] text-[#080808] text-xs font-semibold hover:bg-white cursor-pointer transition-colors"
                  >
                    Save Snapshot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
