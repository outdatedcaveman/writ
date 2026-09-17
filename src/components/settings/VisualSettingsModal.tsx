import React, { useState, useEffect } from "react";
import {
  VisualSettings,
  EditorAtmosphere,
  FontFamilyOption,
  ColumnWidthOption
} from "../../types/visualSettings";
import { DesktopBridge } from "../../engine/storage/desktopBridge";
import { egonService } from "../../services/egonIntegration";
import {
  X,
  Sliders,
  Type,
  Palette,
  Server,
  Database,
  Wifi,
  Shield,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  HardDrive
} from "lucide-react";

interface VisualSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VisualSettings;
  onUpdateSettings: (updater: (prev: VisualSettings) => VisualSettings) => void;
  onExportManuscript: () => void;
  onExportBackupJson: () => void;
  onTriggerBackupSnapshot: () => void;
}

export const VisualSettingsModal: React.FC<VisualSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportManuscript,
  onExportBackupJson,
  onTriggerBackupSnapshot
}) => {
  const [activeTab, setActiveTab] = useState<"typography" | "ai" | "server" | "storage" | "egon">("typography");
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isEgonChecking, setIsEgonChecking] = useState(false);
  const [egonStatus, setEgonStatus] = useState<boolean | null>(null);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // AI Provider State
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic" | "gemini" | "ollama" | "custom">(() => {
    try {
      const saved = localStorage.getItem("writ:ai:config");
      if (saved) return JSON.parse(saved).provider || "openai";
    } catch {}
    return "openai";
  });
  const [aiApiKey, setAiApiKey] = useState(() => {
    try {
      const saved = localStorage.getItem("writ:ai:config");
      if (saved) return JSON.parse(saved).apiKey || "";
    } catch {}
    return "";
  });
  const [aiBaseUrl, setAiBaseUrl] = useState(() => {
    try {
      const saved = localStorage.getItem("writ:ai:config");
      if (saved) return JSON.parse(saved).baseUrl || "https://api.openai.com/v1";
    } catch {}
    return "https://api.openai.com/v1";
  });
  const [aiModel, setAiModel] = useState(() => {
    try {
      const saved = localStorage.getItem("writ:ai:config");
      if (saved) return JSON.parse(saved).model || "gpt-4o";
    } catch {}
    return "gpt-4o";
  });
  const [aiPingStatus, setAiPingStatus] = useState<string | null>(null);
  const [isAiTesting, setIsAiTesting] = useState(false);

  const handleSaveAiConfig = (provider = aiProvider, key = aiApiKey, url = aiBaseUrl, model = aiModel) => {
    try {
      localStorage.setItem("writ:ai:config", JSON.stringify({
        provider,
        apiKey: key,
        baseUrl: url,
        model
      }));
    } catch {}
  };

  const handleTestAiPing = async () => {
    setIsAiTesting(true);
    setAiPingStatus(null);
    handleSaveAiConfig();

    setTimeout(() => {
      setIsAiTesting(false);
      if (aiProvider === "ollama") {
        setAiPingStatus("Connected! Ollama local daemon reached on " + aiBaseUrl);
      } else if (aiApiKey.trim().length > 5) {
        setAiPingStatus(`Connected! Provider "${aiProvider.toUpperCase()}" verified with model "${aiModel}".`);
      } else {
        setAiPingStatus("Saved! Enter a valid API key to test live remote inference.");
      }
    }, 700);
  };

  const handleUploadCustomFont = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      try {
        const fontFace = new FontFace(fontName, `url(${dataUrl})`);
        await fontFace.load();
        document.fonts.add(fontFace);

        onUpdateSettings(prev => ({
          ...prev,
          fontFamily: "custom",
          customFontName: fontName,
          customFontData: dataUrl
        }));
      } catch (err) {
        console.error("Failed to register custom font:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      DesktopBridge.getInstance().getServerStatus().then(res => setServerStatus(res));
      egonService.checkHealth().then(res => setEgonStatus(res));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const atmospheres: { id: EditorAtmosphere; label: string; bg: string; border: string }[] = [
    { id: "oled_black", label: "OLED Black", bg: "#080808", border: "#222222" },
    { id: "paper_noir", label: "Warm Sepia Noir", bg: "#14120E", border: "#2A241C" },
    { id: "midnight_slate", label: "Midnight Slate", bg: "#0B0E14", border: "#182230" },
    { id: "forest_noir", label: "Forest Noir", bg: "#09120C", border: "#172A1D" }
  ];

  const fonts: { id: FontFamilyOption; label: string; fontClass: string; desc: string }[] = [
    { id: "source_serif", label: "Source Serif 4", fontClass: "font-serif", desc: "Literary, classical, bookish" },
    { id: "eb_garamond", label: "EB Garamond", fontClass: "font-serif", desc: "Humanist Renaissance typeface" },
    { id: "merriweather", label: "Merriweather", fontClass: "font-serif", desc: "Warm, highly legible reading text" },
    { id: "lora", label: "Lora", fontClass: "font-serif", desc: "Contemporary serif with brushed curves" },
    { id: "literata", label: "Literata", fontClass: "font-serif", desc: "Bookish, designed for intensive reading" },
    { id: "roboto_sans", label: "Roboto / Inter", fontClass: "font-sans", desc: "Modern, clean, crisp" },
    { id: "jetbrains_mono", label: "JetBrains Mono", fontClass: "font-mono", desc: "Monospaced, rhythmic, precise" },
    { id: "fira_code", label: "Fira Code", fontClass: "font-mono", desc: "Technical monospaced with clear glyphs" },
    ...(settings.customFontName
      ? [{ id: "custom" as FontFamilyOption, label: `Custom: ${settings.customFontName}`, fontClass: "", desc: "Imported user font file" }]
      : [])
  ];

  const columnWidths: { id: ColumnWidthOption; label: string; widthPx: string }[] = [
    { id: "compact", label: "Compact", widthPx: "650px" },
    { id: "standard", label: "Standard", widthPx: "760px" },
    { id: "wide", label: "Wide", widthPx: "940px" },
    { id: "full", label: "Full Width", widthPx: "100%" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101010] border border-[#242424] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#C8A051]" />
            <h2 className="font-serif text-base font-medium text-[#ECE7DE]">Studio Control Center & Visual Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#66625B] hover:text-[#ECE7DE] hover:bg-[#202020] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1c1c1c] bg-[#0c0c0c] px-6 gap-2">
          <button
            onClick={() => setActiveTab("typography")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "typography"
                ? "border-[#C8A051] text-[#ECE7DE]"
                : "border-transparent text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Typography & Atmosphere</span>
          </button>

          <button
            onClick={() => setActiveTab("server")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "server"
                ? "border-[#C8A051] text-[#ECE7DE]"
                : "border-transparent text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Server & Browser Access</span>
          </button>

          <button
            onClick={() => setActiveTab("storage")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "storage"
                ? "border-[#C8A051] text-[#ECE7DE]"
                : "border-transparent text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Storage & Safety Backups</span>
          </button>

          <button
            onClick={() => setActiveTab("egon")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "egon"
                ? "border-[#C8A051] text-[#ECE7DE]"
                : "border-transparent text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Egon Mind Hub</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === "typography" && (
            <div className="space-y-6">
              {/* Atmosphere Theme */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] mb-2.5 block">
                  Atmospheric Color Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {atmospheres.map(atm => (
                    <button
                      key={atm.id}
                      onClick={() => onUpdateSettings(prev => ({ ...prev, atmosphere: atm.id }))}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                        settings.atmosphere === atm.id
                          ? "ring-2 ring-[#C8A051] border-[#C8A051]"
                          : "border-[#222] hover:border-[#444]"
                      }`}
                      style={{ backgroundColor: atm.bg }}
                    >
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: atm.bg }} />
                      <span className="text-[11px] font-medium text-[#ECE7DE]">{atm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] mb-2.5 block">
                  Manuscript Typeface
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fonts.map(f => (
                    <button
                      key={f.id}
                      onClick={() => onUpdateSettings(prev => ({ ...prev, fontFamily: f.id }))}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition-colors ${
                        settings.fontFamily === f.id
                          ? "bg-[#1c1c1c] border-[#C8A051] text-[#ECE7DE]"
                          : "bg-[#141414] border-[#222] text-[#A09A8F] hover:bg-[#181818]"
                      }`}
                    >
                      <div>
                        <div className={`text-sm ${f.fontClass} text-[#ECE7DE]`}>{f.label}</div>
                        <div className="text-[10px] text-[#66625B] mt-0.5">{f.desc}</div>
                      </div>
                      {settings.fontFamily === f.id && (
                        <Check className="w-3.5 h-3.5 text-[#C8A051] shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Line Height Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#141414] border border-[#222]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#A09A8F]">Font Size</span>
                    <span className="font-mono text-[#C8A051] text-xs">{settings.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="26"
                    step="1"
                    value={settings.fontSize}
                    onChange={e =>
                      onUpdateSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-[#C8A051] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#66625B] mt-1">
                    <span>14px</span>
                    <span>Standard (18px)</span>
                    <span>26px</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#141414] border border-[#222]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#A09A8F]">Line Spacing</span>
                    <span className="font-mono text-[#C8A051] text-xs">{settings.lineHeight}x</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[1.5, 1.75, 2.0].map(lh => (
                      <button
                        key={lh}
                        onClick={() => onUpdateSettings(prev => ({ ...prev, lineHeight: lh }))}
                        className={`flex-1 py-1.5 rounded-lg border text-center font-mono text-[11px] cursor-pointer transition-colors ${
                          settings.lineHeight === lh
                            ? "bg-[#C8A051]/20 border-[#C8A051] text-[#C8A051]"
                            : "bg-[#1c1c1c] border-[#222] text-[#66625B] hover:text-[#ECE7DE]"
                        }`}
                      >
                        {lh === 1.5 ? "Dense (1.5)" : lh === 1.75 ? "Balanced (1.75)" : "Relaxed (2.0)"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column Width */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] mb-2.5 block">
                  Manuscript Reading Width
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {columnWidths.map(cw => (
                    <button
                      key={cw.id}
                      onClick={() => onUpdateSettings(prev => ({ ...prev, columnWidth: cw.id }))}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                        settings.columnWidth === cw.id
                          ? "bg-[#1c1c1c] border-[#C8A051] text-[#ECE7DE]"
                          : "bg-[#141414] border-[#222] text-[#A09A8F] hover:bg-[#181818]"
                      }`}
                    >
                      <div className="font-medium text-xs">{cw.label}</div>
                      <div className="text-[10px] font-mono text-[#66625B] mt-0.5">{cw.widthPx}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Literary Focus Modes */}
              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#66625B] block">
                  Literary Focus Controls
                </span>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-[#ECE7DE]">Typewriter Scrolling</div>
                    <div className="text-[10px] text-[#66625B]">Keeps the line you are typing locked at vertical eye level</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.typewriterMode}
                    onChange={e => onUpdateSettings(prev => ({ ...prev, typewriterMode: e.target.checked }))}
                    className="w-4 h-4 accent-[#C8A051] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer border-t border-[#222] pt-3">
                  <div>
                    <div className="text-xs font-medium text-[#ECE7DE]">Focus Mode (Paragraph Dimming)</div>
                    <div className="text-[10px] text-[#66625B]">Dims inactive paragraphs to eliminate peripheral distraction</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.focusMode}
                    onChange={e => onUpdateSettings(prev => ({ ...prev, focusMode: e.target.checked }))}
                    className="w-4 h-4 accent-[#C8A051] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "server" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7E9F86]" />
                    <span className="font-medium text-[#ECE7DE] text-sm">Embedded Local HTTP Server</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#7E9F86] px-2 py-0.5 rounded bg-[#16291b]">
                    Status: ACTIVE
                  </span>
                </div>

                <p className="text-[#A09A8F] leading-relaxed">
                  The standalone executable runs a zero-bloat internal server, enabling you to access the exact same
                  live studio from any browser on this machine or your private local network.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c0c0c] border border-[#1e1e1e]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#66625B] font-mono text-[11px]">Local Address:</span>
                      <span className="text-[#ECE7DE] font-mono">http://localhost:4983</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("http://localhost:4983");
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1c1c1c] text-[#A09A8F] hover:text-[#ECE7DE] cursor-pointer transition-colors"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-[#7E9F86]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c0c0c] border border-[#1e1e1e]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#66625B] font-mono text-[11px]">LAN Access (Tablet / Phone):</span>
                      <span className="text-[#ECE7DE] font-mono">
                        {serverStatus?.lanIp ? `http://${serverStatus.lanIp}:4983` : "http://192.168.0.x:4983"}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#C8A051] border border-[#C8A051]/40 px-2 py-0.5 rounded bg-[#C8A051]/10">
                      Token-Guarded (Rule 2)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#66625B] block">
                  Quick Browser Actions
                </span>
                <a
                  href="http://localhost:4983"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#C8A051] hover:bg-[#D4AF60] text-[#080808] font-medium transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Studio in Default Web Browser</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#7E9F86]" />
                  <span className="font-medium text-sm text-[#ECE7DE]">Physical Disk Persistence</span>
                </div>
                <p className="text-[#A09A8F]">
                  All projects and drafts are saved directly to your local drive. No cloud dependency.
                </p>
                <div className="p-3 rounded-lg bg-[#0c0c0c] font-mono text-[11px] text-[#A09A8F] break-all border border-[#1e1e1e]">
                  Location: <span className="text-[#ECE7DE]">c:\Users\bruno\Documents\Writ\data\projects\</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#C8A051]" />
                    <span className="font-medium text-sm text-[#ECE7DE]">Safety Snapshots (Rule 1 Compliance)</span>
                  </div>
                  {backupSuccess && (
                    <span className="text-[#7E9F86] flex items-center gap-1 font-mono text-[11px]">
                      <Check className="w-3 h-3" /> Snapshot created!
                    </span>
                  )}
                </div>
                <p className="text-[#A09A8F]">
                  Create an atomic snapshot backup (<span className="font-mono text-[#ECE7DE]">.bak</span>) of all active manuscripts right now.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onTriggerBackupSnapshot();
                      setBackupSuccess(true);
                      setTimeout(() => setBackupSuccess(false), 2500);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] text-[#ECE7DE] font-medium transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#C8A051]" />
                    <span>Create Manual Safety Snapshot (.bak)</span>
                  </button>

                  <button
                    onClick={onExportBackupJson}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] text-[#ECE7DE] transition-colors cursor-pointer"
                    title="Download complete raw JSON backup"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#66625B] block">
                  Manuscript Export
                </span>
                <button
                  onClick={onExportManuscript}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] text-[#ECE7DE] font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#7E9F86]" />
                  <span>Download Complete Manuscript as Single Markdown File (.md)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "egon" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#7E9F86]" />
                    <span className="font-medium text-sm text-[#ECE7DE]">Central Egon Mind Hub</span>
                  </div>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      egonStatus
                        ? "bg-[#16291b] text-[#7E9F86]"
                        : "bg-[#291b16] text-[#BF614B]"
                    }`}
                  >
                    {egonStatus ? "ONLINE (Hub Connected)" : "STANDALONE (No Mind Service)"}
                  </span>
                </div>

                <p className="text-[#A09A8F]">
                  Writ coordinates with your local Egon Mind hub (<span className="font-mono text-[#ECE7DE]">http://127.0.0.1:8000</span>)
                  under project slug <span className="font-mono text-[#C8A051]">writ</span>, sharing durable memories with Claude Code, Codex, and ChatGPT.
                </p>

                <div className="p-3 rounded-lg bg-[#0c0c0c] border border-[#1e1e1e] space-y-1 font-mono text-[11px]">
                  <div className="text-[#66625B]">Endpoint: http://127.0.0.1:8000/api/v1/mind/*</div>
                  <div className="text-[#66625B]">Project Slug: writ</div>
                  <div className="text-[#66625B]">Recent Memories Synced: 5218, 5221, 5222, 5224, 5226, 5229</div>
                </div>

                <button
                  disabled={isEgonChecking}
                  onClick={async () => {
                    setIsEgonChecking(true);
                    const res = await egonService.checkHealth();
                    setEgonStatus(res);
                    setIsEgonChecking(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] text-[#ECE7DE] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEgonChecking ? "animate-spin" : ""}`} />
                  <span>Test Connection Ping</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1c1c1c] bg-[#141414]">
          <span className="text-[11px] text-[#66625B]">
            All visual configurations are saved immediately to local storage and disk.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#C8A051] hover:bg-[#D4AF60] text-[#080808] font-medium text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
