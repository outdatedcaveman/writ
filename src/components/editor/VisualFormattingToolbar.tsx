import React from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Minus,
  MessageSquare,
  Sigma,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Mic
} from "lucide-react";

interface VisualFormattingToolbarProps {
  onInsertMarkdown: (before: string, after?: string, defaultText?: string) => void;
  isMathPreview: boolean;
  onToggleMathPreview: () => void;
  onOpenDictation?: () => void;
}

export const VisualFormattingToolbar: React.FC<VisualFormattingToolbarProps> = ({
  onInsertMarkdown,
  isMathPreview,
  onToggleMathPreview,
  onOpenDictation
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-1.5 border-b border-[#18181A] bg-[#0A0A0C]/95 backdrop-blur select-none shrink-0 text-xs">
      <div className="flex items-center gap-1">
        {/* Headings Group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-[#1E1E22]">
          <button
            onClick={() => onInsertMarkdown("# ", "", "Section Title")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("## ", "", "Subheading")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("### ", "", "Minor Heading")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Styling */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#1E1E22]">
          <button
            onClick={() => onInsertMarkdown("**", "**", "bold text")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("*", "*", "italic text")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("~~", "~~", "strikethrough text")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("`", "`", "code")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quotes & Literary Breaks */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#1E1E22]">
          <button
            onClick={() => onInsertMarkdown("> ", "", "Reflective excerpt or quotation...")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Blockquote (> quote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("\n\n✦ ✦ ✦\n\n", "")}
            className="p-1 rounded hover:bg-[#18181B] text-[#C8A051] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Literary Scene Break (✦ ✦ ✦)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown('“', '”', 'Dialogue')}
            className="p-1 rounded hover:bg-[#18181B] text-[#7E9F86] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Dialogue Quotes (“text”)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Tasks */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#1E1E22]">
          <button
            onClick={() => onInsertMarkdown("- ", "", "List item")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Bullet List (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("1. ", "", "First point")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Numbered List (1. item)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onInsertMarkdown("- [ ] ", "", "Deliverable / milestone")}
            className="p-1 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors"
            title="Task Item (- [ ])"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#7E9F86]" />
          </button>
        </div>

        {/* Math & Formulas */}
        <div className="flex items-center gap-1 pl-2">
          <button
            onClick={() => onInsertMarkdown("$", "$", "\\Delta x \\ge \\frac{\\hbar}{2}")}
            className="px-1.5 py-0.5 rounded hover:bg-[#18181B] text-[#71717A] hover:text-[#ECE7DE] cursor-pointer transition-colors font-mono text-[11px]"
            title="Inline Math ($formula$)"
          >
            $x$
          </button>
          <button
            onClick={() => onInsertMarkdown("\n\n$$\n", "\n$$\n", "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}")}
            className="px-1.5 py-0.5 rounded hover:bg-[#18181B] text-[#C8A051] hover:text-[#ECE7DE] cursor-pointer transition-colors font-mono text-[11px]"
            title="Display Block Math ($$block$$)"
          >
            $$
          </button>
        </div>
      </div>

      {/* Right: Dictate & Math Render Toggles */}
      <div className="flex items-center gap-2">
        {onOpenDictation && (
          <button
            onClick={onOpenDictation}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-[#C8A051]/10 border border-[#C8A051]/30 text-[#C8A051] hover:bg-[#C8A051]/20 transition-colors cursor-pointer font-sans"
            title="Speech-to-Text Dictation & Prose Polisher (Ctrl+Alt+V)"
          >
            <Mic className="w-3 h-3" />
            <span>Voice Dictate</span>
          </button>
        )}

        <button
          onClick={onToggleMathPreview}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer font-sans ${
            isMathPreview
              ? "bg-[#C8A051]/15 text-[#C8A051] font-medium"
              : "text-[#71717A] hover:text-[#ECE7DE]"
          }`}
          title="Toggle live LaTeX rendering preview"
        >
          <Sigma className="w-3 h-3" />
          <span>KaTeX {isMathPreview ? "On" : "Off"}</span>
        </button>
      </div>
    </div>
  );
};
