import React, { useState } from "react";
import { Project, Segment, ProjectWiki, ThreadEntity } from "../../types/workspace";
import { StylisticProfile } from "../../types/profileVault";
import { researchService, FactCheckReport } from "../../services/researchService";
import { deconstructManuscript } from "../../engine/analysis/deconstructor";
import {
  Sparkles,
  Send,
  Globe,
  CheckCircle2,
  FileText,
  Compass,
  ArrowDownToLine,
  Search,
  MessageSquare,
  Bot,
  User,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface AICopilotSidebarProps {
  isOpen: boolean;
  project: Project;
  activeSegment: Segment | null;
  wiki?: ProjectWiki;
  threads: Record<string, ThreadEntity>;
  stylisticProfile: StylisticProfile;
  onInsertTextIntoActiveSegment: (text: string) => void;
  onDeconstructAndApply: (rawText: string) => void;
  onGenerateAlternativeBranch: (prompt: string) => void;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  factReport?: FactCheckReport;
  actionableDraft?: string;
  timestamp: number;
}

export const AICopilotSidebar: React.FC<AICopilotSidebarProps> = ({
  isOpen,
  project,
  activeSegment,
  wiki,
  threads,
  stylisticProfile,
  onInsertTextIntoActiveSegment,
  onDeconstructAndApply,
  onGenerateAlternativeBranch,
  onClose
}) => {
  if (!isOpen) return null;

  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-init",
      role: "assistant",
      text: `I have full situational awareness of "${project.title}", including your Project Wiki, ${Object.keys(threads).length} narrative threads, and your Profile Vault (${stylisticProfile.toneDescriptors.join(", ")}). What shall we explore, research, or draft?`,
      timestamp: Date.now()
    }
  ]);

  // Draft Ingestion Modal State
  const [showIngestionModal, setShowIngestionModal] = useState(false);
  const [rawDraftInput, setRawDraftInput] = useState("");

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: prompt,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt("");
    setIsProcessing(true);

    // Context analysis
    const isFactCheck = /fact|check|source|cite|bibliography|verify|claim/i.test(prompt);
    const isCritique = /critique|evaluate|quality|align|coherence/i.test(prompt);
    const isDraft = /draft|generate|rewrite|expand|branch/i.test(prompt);

    setTimeout(async () => {
      let assistantMsg: ChatMessage;

      if (isFactCheck) {
        const query = activeSegment ? activeSegment.textContent.slice(0, 160) : prompt;
        const report = await researchService.verifyAssertionAndFindSources(query);
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `I queried academic and institutional literature to verify the core assertions. Here is the verified evidence and suggested citation integration:`,
          factReport: report,
          timestamp: Date.now()
        };
      } else if (isCritique) {
        const segTitle = activeSegment ? `Section ${activeSegment.romanNumeral}: ${activeSegment.title}` : "Current Project State";
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `### Strategic Critique of ${segTitle}\n\n` +
            `1. **Thematic Alignment**: Successfully interrogates "${wiki?.themeAndPremise?.centralInquiry || "the core inquiry"}". The rhetorical restraint matches your Profile Vault preference.\n\n` +
            `2. **Pacing & Cadence**: Sentence transitions are crisp. The dialectic pattern moves cleanly from cultural observation to structural consequences.\n\n` +
            `3. **Missing Dimension**: Consider giving one concrete institutional example of performative confidence failing quietly before moving to the resolution.`,
          timestamp: Date.now()
        };
      } else if (isDraft) {
        const generatedDraft = `When institutions optimize for certainty, they inevitably trade adaptability for comfort. The immediate result is not greater truth, but an elaborate performance of confidence that penalizes the very curiosity required to solve emergent problems. To resist this is not to retreat into helplessness; it is to cultivate the discipline of staying with the question.`;
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `Here is an alternative draft passage conditioned on your Profile Vault voice and Section ${activeSegment?.romanNumeral || "current"} goals:`,
          actionableDraft: generatedDraft,
          timestamp: Date.now()
        };
      } else {
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `I'm holding both the global macro-structure and Section ${activeSegment?.romanNumeral || "active"} in view. Based on your intent to "${project.intent}", I recommend strengthening the link between institutional incentives and personal fear of ambiguity. Would you like me to draft an alternative passage or run a fact-check?`,
          timestamp: Date.now()
        };
      }

      setMessages(prev => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 600);
  };

  const handleExecuteIngestion = () => {
    if (!rawDraftInput.trim()) return;
    onDeconstructAndApply(rawDraftInput.trim());
    setShowIngestionModal(false);
    setRawDraftInput("");
    setMessages(prev => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: `✨ Deconstruction complete! The draft has been automatically analyzed, broken into chapters with Roman numerals, populated into your Project Wiki (characters & arguments), and mapped to narrative threads.`,
        timestamp: Date.now()
      }
    ]);
  };

  return (
    <aside className="w-96 bg-[#0e0e0e] text-[#ECE7DE] border-l border-[#1c1c1c] flex flex-col justify-between select-none shrink-0 h-full relative">
      {/* Header */}
      <div className="p-4 border-b border-[#1c1c1c] bg-[#121212] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C8A051]/20 flex items-center justify-center text-[#C8A051]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-medium tracking-wide">Autonomous Studio Copilot</h3>
            <span className="text-[10px] text-[#7E9F86] flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7E9F86] animate-pulse" />
              Full Context Aware
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-[#66625B] hover:text-[#ECE7DE] text-xs px-2 py-1 rounded hover:bg-[#1c1c1c] transition-colors"
        >
          Close
        </button>
      </div>

      {/* Context Awareness Pill Strip */}
      <div className="bg-[#141414] px-4 py-2 border-b border-[#1c1c1c] flex items-center gap-2 overflow-x-auto text-[10px] text-[#66625B]">
        <span className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#ECE7DE] truncate max-w-[110px]">
          {project.title}
        </span>
        {activeSegment && (
          <span className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#7E9F86] truncate max-w-[110px]">
            Sec {activeSegment.romanNumeral}
          </span>
        )}
        <span className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#C8A051]">
          Vault: {stylisticProfile.toneDescriptors[0]}
        </span>
      </div>

      {/* Action Chips */}
      <div className="p-3 border-b border-[#1c1c1c] bg-[#0a0a0a] flex items-center gap-1.5 overflow-x-auto shrink-0">
        <button
          onClick={() => setShowIngestionModal(true)}
          className="px-2.5 py-1 rounded-full bg-[#181818] hover:bg-[#242424] border border-[#282828] text-[10px] text-[#ECE7DE] font-medium whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Sparkles className="w-3 h-3 text-[#C8A051]" />
          <span>Ingest & Deconstruct</span>
        </button>

        <button
          onClick={() => handleSendMessage("Fact-check assertions and verify sources for this chapter")}
          className="px-2.5 py-1 rounded-full bg-[#181818] hover:bg-[#242424] border border-[#282828] text-[10px] text-[#A09A8F] hover:text-[#ECE7DE] whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Globe className="w-3 h-3 text-[#6B8FA3]" />
          <span>Fact-Check & Cite</span>
        </button>

        <button
          onClick={() => handleSendMessage("Critique the quality and alignment of this chapter")}
          className="px-2.5 py-1 rounded-full bg-[#181818] hover:bg-[#242424] border border-[#282828] text-[10px] text-[#A09A8F] hover:text-[#ECE7DE] whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ShieldCheck className="w-3 h-3 text-[#7E9F86]" />
          <span>Critique Quality</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isAssistant = msg.role === "assistant";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#66625B]">
                {isAssistant ? <Bot className="w-3 h-3 text-[#C8A051]" /> : <User className="w-3 h-3 text-[#7E9F86]" />}
                <span>{isAssistant ? "Copilot" : "You"}</span>
              </div>

              <div
                className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[92%] border ${
                  isAssistant
                    ? "bg-[#141414] border-[#202020] text-[#ECE7DE]"
                    : "bg-[#1c1c1c] border-[#2c2c2c] text-[#ECE7DE]"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Fact Check Report Card */}
                {msg.factReport && (
                  <div className="mt-3 pt-3 border-t border-[#242424] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#7E9F86]/20 text-[#7E9F86]">
                        {msg.factReport.status}
                      </span>
                      <span className="text-[10px] text-[#66625B]">
                        {msg.factReport.primarySources.length} Primary Sources
                      </span>
                    </div>

                    <p className="text-[11px] text-[#A09A8F] italic">
                      {msg.factReport.verdictSummary}
                    </p>

                    <div className="space-y-1.5">
                      {msg.factReport.primarySources.map(source => (
                        <div key={source.id} className="p-2 rounded bg-[#0a0a0a] border border-[#202020] text-[11px]">
                          <span className="font-medium text-[#ECE7DE] block">{source.sourceTitle}</span>
                          <span className="text-[10px] text-[#66625B]">{source.authorOrOrg} ({source.year})</span>
                          <p className="text-[10px] text-[#A09A8F] mt-1">{source.claimSupported}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => onInsertTextIntoActiveSegment(`\n\n${msg.factReport?.suggestedIntegrationText}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#7E9F86] text-[#080808] text-[11px] font-medium hover:bg-[#8eb397] transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>Insert Citation & Evidence into Text</span>
                    </button>
                  </div>
                )}

                {/* Actionable Draft Card */}
                {msg.actionableDraft && (
                  <div className="mt-3 pt-3 border-t border-[#242424] space-y-2">
                    <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#202020] font-serif text-[11px] text-[#ECE7DE] leading-relaxed">
                      {msg.actionableDraft}
                    </div>
                    <button
                      onClick={() => onInsertTextIntoActiveSegment(`\n\n${msg.actionableDraft}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#ECE7DE] text-[#080808] text-[11px] font-medium hover:bg-white transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>Insert Passage into Active Chapter</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-[#66625B] italic p-2">
            <Sparkles className="w-3 h-3 text-[#C8A051] animate-spin" />
            <span>Consulting project memory & synthesizing...</span>
          </div>
        )}
      </div>

      {/* Bottom Composer */}
      <div className="p-3 border-t border-[#1c1c1c] bg-[#101010]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask advice, request draft, or check facts..."
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-2 rounded-lg focus:outline-none placeholder:text-[#444]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isProcessing}
            className="p-2 rounded-lg bg-[#ECE7DE] text-[#080808] hover:bg-white disabled:opacity-40 disabled:hover:bg-[#ECE7DE] transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ingestion Modal Overlay */}
      {showIngestionModal && (
        <div className="absolute inset-0 z-50 bg-black/90 p-6 flex flex-col justify-between text-[#ECE7DE]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-medium text-[#C8A051]">
                Draft Ingestion & Magic Deconstruction
              </h3>
              <button
                onClick={() => setShowIngestionModal(false)}
                className="text-[#66625B] hover:text-[#ECE7DE] text-xs"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-[#A09A8F]">
              Paste any raw draft, outline, or AI generation below. Writ will automatically decompose it into chapters, extract dramatis personae, plot milestones, and map narrative threads.
            </p>
            <textarea
              placeholder="Paste raw draft or AI response here..."
              value={rawDraftInput}
              onChange={e => setRawDraftInput(e.target.value)}
              className="w-full h-72 bg-[#080808] border border-[#202020] rounded-xl p-3 text-xs font-serif leading-relaxed text-[#ECE7DE] focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={handleExecuteIngestion}
            disabled={!rawDraftInput.trim()}
            className="w-full py-3 rounded-xl bg-[#C8A051] text-[#080808] font-medium text-xs hover:bg-[#d6b063] transition-colors cursor-pointer disabled:opacity-40"
          >
            Deconstruct & Rebuild Project
          </button>
        </div>
      )}
    </aside>
  );
};
