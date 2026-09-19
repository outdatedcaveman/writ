import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  X,
  RefreshCw,
  Sliders,
  Volume2,
  FileText,
  Inbox,
  CornerDownLeft,
  Wand2
} from "lucide-react";
import { SpeechToTextEngine, AudioVisualizerData } from "../../engine/audio/speechToTextEngine";
import { ProsePolisher, PolishMode, PolishOptions, defaultPolishOptions } from "../../engine/analysis/prosePolisher";

interface DictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertAtCursor: (text: string) => void;
  onAppendToSegment?: (text: string) => void;
  onDropToVault?: (title: string, content: string) => void;
  activeSegmentTitle?: string;
}

export const DictationModal: React.FC<DictationModalProps> = ({
  isOpen,
  onClose,
  onInsertAtCursor,
  onAppendToSegment,
  onDropToVault,
  activeSegmentTitle
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [rawTranscript, setRawTranscript] = useState("");
  const [polishedTranscript, setPolishedTranscript] = useState("");
  const [mode, setMode] = useState<PolishMode>("literary");
  const [language, setLanguage] = useState("en-US");
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(16).fill(10));
  const [removedFillersCount, setRemovedFillersCount] = useState(0);
  const [stats, setStats] = useState({ sentencesCount: 0, paragraphsCount: 0 });
  const [copied, setCopied] = useState(false);
  const [isAiPolishing, setIsAiPolishing] = useState(false);
  const [options, setOptions] = useState<PolishOptions>(defaultPolishOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const engineRef = useRef<SpeechToTextEngine | null>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize STT Engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SpeechToTextEngine(language);
    }

    engineRef.current.language = language;
    engineRef.current.onTranscript = (evt) => {
      setRawTranscript(prev => {
        const next = evt.isFinal ? `${prev} ${evt.text}`.trim() : `${prev} ${evt.text}`.trim();
        return next;
      });
    };

    engineRef.current.onVisualizer = (data: AudioVisualizerData) => {
      setVisualizerBars(data.frequencyBars);
    };

    return () => {
      if (engineRef.current && isRecording) {
        engineRef.current.stop();
      }
    };
  }, [language]);

  // Re-run polish whenever raw transcript or options change
  useEffect(() => {
    if (!rawTranscript) {
      setPolishedTranscript("");
      setRemovedFillersCount(0);
      return;
    }

    const res = ProsePolisher.polish(rawTranscript, {
      ...options,
      mode
    });

    setPolishedTranscript(res.polished);
    setRemovedFillersCount(res.removedFillersCount);
    setStats({
      sentencesCount: res.sentencesCount,
      paragraphsCount: res.paragraphsCount
    });
  }, [rawTranscript, mode, options]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  if (!isOpen) return null;

  const handleToggleRecording = async () => {
    if (!engineRef.current) return;

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      const audioBlob = await engineRef.current.stop();

      // If Web Speech didn't capture text or empty, attempt Whisper local backend
      if ((!rawTranscript || rawTranscript.trim().length === 0) && audioBlob) {
        const whisperRes = await engineRef.current.transcribeWithWhisperServer(audioBlob);
        if (whisperRes.success && whisperRes.transcript) {
          setRawTranscript(whisperRes.transcript);
        }
      }
    } else {
      // Start recording
      setRecordingSeconds(0);
      const started = await engineRef.current.start();
      if (started) {
        setIsRecording(true);
      }
    }
  };

  const handleAiPolish = async () => {
    if (!rawTranscript.trim()) return;
    setIsAiPolishing(true);
    const result = await ProsePolisher.polishWithAI(rawTranscript, mode);
    setPolishedTranscript(result);
    setIsAiPolishing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(polishedTranscript || rawTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101012] border border-[#26262B] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E22] bg-[#141416]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isRecording ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-[#C8A051]/10 text-[#C8A051]"
            }`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-sm font-medium text-[#ECE7DE]">Voice Dictation Studio & Literary Polisher</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C20] text-[#7E9F86] border border-[#28382C]">
                  Free & OSS
                </span>
              </div>
              <p className="text-[11px] text-[#71717A]">
                Speak naturally. Automatically strips verbal fillers ("ehh", "um") and restores professional literary punctuation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#ECE7DE] hover:bg-[#202024] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Workspace Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Waveform Visualizer & Recording Bar */}
          <div className="p-4 rounded-xl bg-[#141418] border border-[#27272E] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={handleToggleRecording}
                className={`px-5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                    : "bg-[#C8A051] hover:bg-[#D9B262] text-[#0A0A0C]"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Start Dictation</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-[#52525B]"}`} />
                <span className="text-[#ECE7DE] font-semibold">{formatTimer(recordingSeconds)}</span>
                {isRecording && <span className="text-[#A1A1AA] text-[11px]">(Listening...)</span>}
              </div>
            </div>

            {/* Soundwave Frequency Bars */}
            <div className="flex items-center gap-1.5 h-8 px-4 py-1 rounded-lg bg-[#0C0C0E] border border-[#1E1E22] w-full md:w-48 justify-center">
              {visualizerBars.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    isRecording ? "bg-[#C8A051]" : "bg-[#27272A]"
                  }`}
                  style={{
                    height: isRecording ? `${Math.max(12, val)}%` : "20%"
                  }}
                />
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[#71717A] text-[11px]">Language:</span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-[#18181C] border border-[#2B2B32] rounded-lg px-2.5 py-1 text-[#ECE7DE] text-xs focus:outline-none focus:border-[#C8A051]"
              >
                <option value="en-US">English (US)</option>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="es-ES">Español</option>
                <option value="fr-FR">Français</option>
                <option value="de-DE">Deutsch</option>
              </select>
            </div>
          </div>

          {/* Polishing Mode Selector & Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 bg-[#141416] p-1 rounded-lg border border-[#242428]">
              <button
                type="button"
                onClick={() => setMode("literary")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  mode === "literary" ? "bg-[#24242C] text-[#C8A051]" : "text-[#71717A] hover:text-[#ECE7DE]"
                }`}
              >
                Literary Essay (McPhee)
              </button>
              <button
                type="button"
                onClick={() => setMode("fiction")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  mode === "fiction" ? "bg-[#24242C] text-[#C8A051]" : "text-[#71717A] hover:text-[#ECE7DE]"
                }`}
              >
                Fiction & Dialogue
              </button>
              <button
                type="button"
                onClick={() => setMode("raw_clean")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  mode === "raw_clean" ? "bg-[#24242C] text-[#C8A051]" : "text-[#71717A] hover:text-[#ECE7DE]"
                }`}
              >
                Raw Cleaned
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAiPolish}
                disabled={isAiPolishing || !rawTranscript.trim()}
                className={`px-3 py-1 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isAiPolishing
                    ? "bg-[#C8A051]/10 border-[#C8A051]/40 text-[#C8A051] cursor-wait"
                    : !rawTranscript.trim()
                    ? "bg-[#18181A] border-[#222226] text-[#52525B] cursor-not-allowed"
                    : "bg-[#1C1C20] hover:bg-[#25252A] border-[#2A2A32] text-[#ECE7DE] hover:text-[#C8A051]"
                }`}
                title="Use local Ollama or configured AI to refine vocabulary and literary rhythm"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isAiPolishing ? "animate-spin text-[#C8A051]" : "text-[#C8A051]"}`} />
                <span>{isAiPolishing ? "Polishing with AI..." : "AI Literary Polish"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="p-1.5 rounded-lg bg-[#18181C] hover:bg-[#222226] border border-[#27272E] text-[#A1A1AA] hover:text-[#ECE7DE] transition-colors cursor-pointer"
                title="Toggle Prose Polisher Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Advanced Polish Checkboxes */}
          {showAdvanced && (
            <div className="p-3.5 rounded-xl bg-[#141418] border border-[#27272E] grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-[#A1A1AA]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.stripFillers}
                  onChange={e => setOptions({ ...options, stripFillers: e.target.checked })}
                  className="rounded border-[#3F3F46] bg-[#1E1E22] text-[#C8A051]"
                />
                <span>Remove Fillers ("ehh", "um")</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.deduplicateStutters}
                  onChange={e => setOptions({ ...options, deduplicateStutters: e.target.checked })}
                  className="rounded border-[#3F3F46] bg-[#1E1E22] text-[#C8A051]"
                />
                <span>Deduplicate Stutters</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.formatDialogue}
                  onChange={e => setOptions({ ...options, formatDialogue: e.target.checked })}
                  className="rounded border-[#3F3F46] bg-[#1E1E22] text-[#C8A051]"
                />
                <span>Format Dialogue Quotes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.paragraphBreaks}
                  onChange={e => setOptions({ ...options, paragraphBreaks: e.target.checked })}
                  className="rounded border-[#3F3F46] bg-[#1E1E22] text-[#C8A051]"
                />
                <span>Structure Paragraphs</span>
              </label>
            </div>
          )}

          {/* Side-by-Side: Polished Prose vs Raw Transcript */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Polished Prose Preview */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#C8A051] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Polished Literary Prose</span>
                </label>
                {removedFillersCount > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C241E] text-[#7E9F86] border border-[#2B4031]">
                    Stripped {removedFillersCount} filler words
                  </span>
                )}
              </div>
              <textarea
                value={polishedTranscript}
                onChange={e => setPolishedTranscript(e.target.value)}
                placeholder="Your polished prose will appear here automatically with professional punctuation and paragraphs..."
                className="w-full h-56 bg-[#131316] border border-[#27272E] rounded-xl p-3.5 text-[#ECE7DE] font-serif text-sm leading-relaxed resize-none focus:outline-none focus:border-[#C8A051]"
              />
              <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span>
                  {polishedTranscript.split(/\s+/).filter(Boolean).length} words · {stats.paragraphsCount} paragraphs
                </span>
                <button
                  onClick={handleCopy}
                  className="hover:text-[#ECE7DE] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-[#7E9F86]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Raw Spoken Transcription */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#71717A] flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Raw Spoken Dictation</span>
                </label>
                <button
                  onClick={() => setRawTranscript("")}
                  className="text-[10px] text-[#71717A] hover:text-[#ECE7DE] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={rawTranscript}
                onChange={e => setRawTranscript(e.target.value)}
                placeholder="Raw voice transcript will stream here live as you speak..."
                className="w-full h-56 bg-[#0E0E10] border border-[#222226] rounded-xl p-3.5 text-[#8E8E93] font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-[#444]"
              />
              <div className="text-[11px] text-[#52525B]">
                {rawTranscript.split(/\s+/).filter(Boolean).length} raw spoken words
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#1E1E22] bg-[#141416] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-[#71717A]">
            {activeSegmentTitle ? `Active Chapter: ${activeSegmentTitle}` : "Ready to insert"}
          </div>

          <div className="flex items-center gap-2">
            {onDropToVault && (
              <button
                type="button"
                disabled={!polishedTranscript.trim()}
                onClick={() => {
                  onDropToVault(
                    `Voice Dictation ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                    polishedTranscript.trim()
                  );
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !polishedTranscript.trim()
                    ? "bg-[#18181A] border-[#222226] text-[#52525B] cursor-not-allowed"
                    : "bg-[#1C1C20] hover:bg-[#25252A] border-[#2C2C32] text-[#ECE7DE]"
                }`}
                title="Save polished transcript as a new raw asset in the Project Drop Vault"
              >
                <Inbox className="w-3.5 h-3.5 text-[#C8A051]" />
                <span>Drop to Vault</span>
              </button>
            )}

            {onAppendToSegment && (
              <button
                type="button"
                disabled={!polishedTranscript.trim()}
                onClick={() => {
                  onAppendToSegment(polishedTranscript.trim());
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !polishedTranscript.trim()
                    ? "bg-[#18181A] border-[#222226] text-[#52525B] cursor-not-allowed"
                    : "bg-[#1C1C20] hover:bg-[#25252A] border-[#2C2C32] text-[#ECE7DE]"
                }`}
                title="Append to end of the current active chapter"
              >
                <CornerDownLeft className="w-3.5 h-3.5 text-[#7E9F86]" />
                <span>Append to Chapter</span>
              </button>
            )}

            <button
              type="button"
              disabled={!polishedTranscript.trim()}
              onClick={() => {
                onInsertAtCursor(polishedTranscript.trim());
                onClose();
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                !polishedTranscript.trim()
                  ? "bg-[#27272A] text-[#52525B] cursor-not-allowed"
                  : "bg-[#C8A051] text-[#0A0A0C] hover:bg-[#D9B262]"
              }`}
              title="Insert polished text at current cursor location in the editor"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Insert at Cursor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
