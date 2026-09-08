import React from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Sparkles,
  Sigma,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  MessageSquare,
  BookOpen
} from "lucide-react";

interface VisualFormattingToolbarProps {
  onInsertMarkdown: (before: string, after?: string, defaultText?: string) => void;
  wordCount: number;
  readingTimeMinutes: number;
  isMathPreview: boolean;
  onToggleMathPreview: () => void;
}

export const VisualFormattingToolbar: React.FC<VisualFormattingToolbarProps> = ({
  onInsertMarkdown,
  wordCount,
  readingTimeMinutes,
  isMathPreview,
  onToggleMathPreview
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#1c1c1c] bg-[#0c0c0c] select-none shrink-0 overflow-x-auto gap-3 text-xs">
      {/* Primary Formatting Controls */}
      <div className="flex items-center gap-1">
        {/* Headings */}
        <div className="flex items-center rounded-lg bg-[#141414] border border-[#222] p-0.5">
          <button
            onClick={() => onInsertMarkdown("# ", "", "Section Title")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Heading 1 (Main Section)"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("## ", "", "Subheading")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Heading 2 (Subheading)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("### ", "", "Minor Heading")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Heading 3 (Minor Heading)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Styling */}
        <div className="flex items-center rounded-lg bg-[#141414] border border-[#222] p-0.5">
          <button
            onClick={() => onInsertMarkdown("**", "**", "bold text")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors font-bold"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("*", "*", "italic text")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors italic"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("~~", "~~", "strikethrough text")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quotes & Blocks */}
        <div className="flex items-center rounded-lg bg-[#141414] border border-[#222] p-0.5">
          <button
            onClick={() => onInsertMarkdown("> ", "", "Reflective excerpt or quotation...")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Blockquote (> quote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("\n\n✦ ✦ ✦\n\n", "")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#C8A051] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Literary Scene / Beat Break (✦ ✦ ✦)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown('“', '”', 'Dialogue phrase')}
            className="p-1.5 rounded hover:bg-[#202020] text-[#7E9F86] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Literary Quotation Marks (“Dialogue”)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Math & Formulas */}
        <div className="flex items-center rounded-lg bg-[#141414] border border-[#222] p-0.5">
          <button
            onClick={() => onInsertMarkdown("$", "$", "\\Delta x \\ge \\frac{\\hbar}{2}")}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Inline LaTeX Math ($formula$)"
          >
            <Sigma className="w-3.5 h-3.5 text-[#C8A051]" />
            <span className="font-mono text-[11px]">$math$</span>
          </button>
          <button
            onClick={() => onInsertMarkdown("\n\n$$\n", "\n$$\n", "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}")}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Display Block LaTeX Math ($$formula$$)"
          >
            <span className="font-mono text-[11px] text-[#C8A051]">$$block$$</span>
          </button>
        </div>

        {/* Lists & Deliverables */}
        <div className="flex items-center rounded-lg bg-[#141414] border border-[#222] p-0.5">
          <button
            onClick={() => onInsertMarkdown("- ", "", "List item")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Bullet List (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("1. ", "", "First step")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Numbered List (1. item)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("- [ ] ", "", "Chapter deliverable / goal")}
            className="p-1.5 rounded hover:bg-[#202020] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Task / Checklist Item (- [ ])"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#7E9F86]" />
          </button>
        </div>
      </div>

      {/* Right HUD: Live Word & Pace Count + Math Render Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMathPreview}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-colors cursor-pointer ${
            isMathPreview
              ? "bg-[#C8A051]/20 border-[#C8A051]/60 text-[#C8A051]"
              : "bg-[#141414] border-[#242424] text-[#A09A8F] hover:text-[#ECE7DE]"
          }`}
          title="Toggle live KaTeX Math preview rendering"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>KaTeX Render: {isMathPreview ? "ON" : "OFF"}</span>
        </button>

        <div className="flex items-center gap-2 font-mono text-[11px] text-[#66625B]">
          <span className="text-[#ECE7DE] font-medium">{wordCount.toLocaleString()}</span> words
          <span>·</span>
          <span>~{readingTimeMinutes} min read</span>
        </div>
      </div>
    </div>
  );
};
