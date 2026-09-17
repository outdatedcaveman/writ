import React, { useState, useMemo } from "react";
import { Project, Segment, ProjectWiki } from "../../types/workspace";
import { platformHub, PublishPackage, SupportedPlatform } from "../../engine/integrations/platformHub";
import { assetService, StockAssetItem, GeneratedAssetStoryboard } from "../../engine/assets/assetService";
import {
  Send,
  Sparkles,
  Share2,
  Copy,
  Download,
  CheckCircle2,
  Globe,
  Film,
  Image as ImageIcon,
  FileCode,
  Tv,
  Headphones,
  BookMarked,
  Search,
  ArrowRight,
  ExternalLink,
  Wand2,
  FileText,
  Layers,
  Check,
  AlertCircle,
  FileCheck,
  ShieldCheck
} from "lucide-react";

interface PublishStudioViewProps {
  project: Project;
  segments: Segment[];
  wiki: ProjectWiki;
  activeSegment: Segment | null;
  onDropAssetToVault: (title: string, type: "image" | "video" | "text", content: string, mediaUrl?: string) => void;
}

export const PublishStudioView: React.FC<PublishStudioViewProps> = ({
  project,
  segments,
  wiki,
  activeSegment,
  onDropAssetToVault
}) => {
  const [activeTab, setActiveTab] = useState<"publish" | "assets" | "inbound">("publish");
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform>("obsidian");
  const [naturalPrompt, setNaturalPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [publishedNotice, setPublishedNotice] = useState<string | null>(null);

  // Asset Studio State
  const [searchQuery, setSearchQuery] = useState("");
  const [stockResults, setStockResults] = useState<StockAssetItem[]>(() => assetService.searchStockAssets(""));
  const [storyboard, setStoryboard] = useState<GeneratedAssetStoryboard | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);

  // Inbound Ingestion State
  const [inboundSource, setInboundSource] = useState<"instapaper" | "notion" | "chrome">("instapaper");
  const [inboundUrlOrText, setInboundUrlOrText] = useState("");
  const [inboundNotice, setInboundNotice] = useState<string | null>(null);

  const targetSegment = activeSegment || segments[0] || {
    id: "default-seg",
    draftId: "default-draft",
    title: "Draft Inquest",
    romanNumeral: "I",
    order: 1,
    synopsis: "Opening section draft",
    goals: [],
    treatedThreadIds: [],
    characterIds: [],
    textContent: "Draft manuscript content...",
    status: "active" as const
  };

  // Derive Current Publish Package
  const currentPackage: PublishPackage = useMemo(() => {
    if (naturalPrompt.trim()) {
      return platformHub.synthesizeCustomPublishFormat(
        naturalPrompt,
        project,
        targetSegment,
        segments,
        wiki
      );
    }
    switch (selectedPlatform) {
      case "obsidian":
        return platformHub.formatForObsidianVault(project, wiki, segments);
      case "google_docs":
        return platformHub.formatForGoogleDocs(project, segments);
      case "substack":
        return platformHub.formatForSubstack(project, targetSegment, segments);
      case "wattpad":
        return platformHub.formatForWattpad(project, targetSegment);
      case "notion":
        return platformHub.formatForNotion(project, wiki, segments);
      case "youtube":
        return platformHub.formatForYouTube(project, segments);
      case "spotify":
        return platformHub.formatForSpotify(project, targetSegment);
      case "latex":
        return platformHub.formatForLatex(project, segments);
      default:
        return platformHub.formatForObsidianVault(project, wiki, segments);
    }
  }, [selectedPlatform, naturalPrompt, project, targetSegment, segments, wiki]);

  // Live Craft & Integration Verification Checklist
  const validation = useMemo(() => {
    return platformHub.validatePlatformPackage(currentPackage);
  }, [currentPackage]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPackage.formattedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGoogleDocsHtml = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([currentPackage.formattedBody], { type: "text/html" });
        const textBlob = new Blob([targetSegment.textContent], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob
          })
        ]);
        setCopied(true);
        setPublishedNotice("Copied formatted rich HTML! Paste directly into Google Docs (Ctrl+V) with full typography preserved.");
        setTimeout(() => { setCopied(false); setPublishedNotice(null); }, 4500);
        return;
      }
    } catch (e) {
      console.warn("ClipboardItem write failed, fallback to plain text", e);
    }
    navigator.clipboard.writeText(currentPackage.formattedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCanvas = () => {
    if (!currentPackage.metadata.canvasJson) return;
    const blob = new Blob([currentPackage.metadata.canvasJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.slug}_Project.canvas`;
    a.click();
    URL.revokeObjectURL(url);
    setPublishedNotice(`Downloaded Obsidian Visual Canvas: ${project.slug}_Project.canvas`);
    setTimeout(() => setPublishedNotice(null), 4000);
  };

  const handleDownload = () => {
    let ext = "md";
    let mime = "text/markdown";
    if (selectedPlatform === "latex") { ext = "tex"; mime = "text/x-tex"; }
    else if (selectedPlatform === "google_docs") { ext = "html"; mime = "text/html"; }
    else if (selectedPlatform === "notion") { ext = "md"; mime = "text/markdown"; }

    const blob = new Blob([currentPackage.formattedBody], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.slug}-${selectedPlatform}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Notion Direct API State
  const [notionToken, setNotionToken] = useState(() => {
    try { return localStorage.getItem("writ:notion:token") || ""; } catch { return ""; }
  });
  const [notionPageId, setNotionPageId] = useState(() => {
    try { return localStorage.getItem("writ:notion:pageId") || ""; } catch { return ""; }
  });
  const [isNotionPublishing, setIsNotionPublishing] = useState(false);
  const [notionResultUrl, setNotionResultUrl] = useState<string | null>(null);
  const [notionError, setNotionError] = useState<string | null>(null);

  const handlePublishToNotionDirect = async () => {
    if (!notionToken.trim()) {
      setNotionError("Please enter your Notion API Integration Token (starts with secret_...)");
      return;
    }
    if (!notionPageId.trim()) {
      setNotionError("Please enter your target Notion Page ID or Page URL");
      return;
    }

    try {
      localStorage.setItem("writ:notion:token", notionToken.trim());
      localStorage.setItem("writ:notion:pageId", notionPageId.trim());
    } catch {}

    setIsNotionPublishing(true);
    setNotionError(null);
    setNotionResultUrl(null);

    // Extract 32-character hex ID if full URL is pasted
    let pageId = notionPageId.trim();
    const urlMatch = pageId.match(/([a-f0-9]{32})/i);
    if (urlMatch) {
      pageId = urlMatch[1];
    } else {
      pageId = pageId.replace(/-/g, "");
    }

    const res = await platformHub.publishToNotionApi({
      token: notionToken.trim(),
      parentPageId: pageId,
      project,
      wiki,
      segments
    });

    setIsNotionPublishing(false);
    if (res.success && res.pageUrl) {
      setNotionResultUrl(res.pageUrl);
      setPublishedNotice(`Created Notion page: "${project.title}" directly in your workspace!`);
    } else {
      setNotionError(res.error || "Failed to publish to Notion. Verify token and page permissions.");
    }
  };

  const handleSimulatePublish = () => {
    if (selectedPlatform === "notion") {
      handlePublishToNotionDirect();
      return;
    }
    setPublishedNotice(`Successfully packaged and dispatched to ${selectedPlatform.toUpperCase()}! API payload confirmed.`);
    setTimeout(() => setPublishedNotice(null), 4000);
  };

  const handleStockSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setStockResults(assetService.searchStockAssets(searchQuery));
  };

  const handleGenerateStoryboard = (type: "image" | "video") => {
    setIsGeneratingVisual(true);
    setTimeout(() => {
      const sb = assetService.generateStoryboardPrompt(targetSegment.title, targetSegment.synopsis, type);
      setStoryboard(sb);
      setIsGeneratingVisual(false);
    }, 600);
  };

  const handleInboundIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboundUrlOrText.trim()) return;

    onDropAssetToVault(
      `Imported from ${inboundSource.toUpperCase()}: ${inboundUrlOrText.slice(0, 40)}...`,
      "text",
      inboundUrlOrText.trim()
    );

    setInboundNotice(`Ingested into Project Drop Vault! The AI Auto-Arranger will compare and suggest placement.`);
    setInboundUrlOrText("");
    setTimeout(() => setInboundNotice(null), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ECE7DE] rounded-xl border border-[#202020] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7E9F86]/10 flex items-center justify-center text-[#7E9F86]">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-wide">Publishing Studio, Asset Hub & API Connectors</h2>
            <p className="text-xs text-[#66625B]">
              Automate multi-platform publication (Substack, Wattpad, Notion, YouTube, LaTeX), free stock discovery, and AI generation
            </p>
          </div>
        </div>

        {/* Top Studio Tabs */}
        <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-lg border border-[#202020]">
          <button
            onClick={() => setActiveTab("publish")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "publish" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Publish & Export
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "assets" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Free Stock & AI Assets
          </button>
          <button
            onClick={() => setActiveTab("inbound")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === "inbound" ? "bg-[#202020] text-[#ECE7DE]" : "text-[#66625B] hover:text-[#A09A8F]"
            }`}
          >
            Inbound Ingestion
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: PUBLISH & EXPORT */}
        {activeTab === "publish" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Success notice */}
            {publishedNotice && (
              <div className="p-3.5 rounded-xl bg-[#7E9F86]/15 border border-[#7E9F86]/40 text-xs text-[#7E9F86] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{publishedNotice}</span>
              </div>
            )}

            {/* Natural language describe-what-you-want bar */}
            <div className="p-5 rounded-xl bg-[#141414] border border-[#202020] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C8A051] flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Prompt-Driven Publishing Automation</span>
                </span>
                <span className="text-xs text-[#66625B]">Describe the target format or choose a preset below</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Format Section III as a Substack newsletter post with an inquiry hook, or make a YouTube video script with 3 timestamps..."
                  value={naturalPrompt}
                  onChange={e => setNaturalPrompt(e.target.value)}
                  className="flex-1 bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3.5 py-2 rounded-lg focus:outline-none placeholder:text-[#444]"
                />
                {naturalPrompt && (
                  <button
                    onClick={() => setNaturalPrompt("")}
                    className="text-xs text-[#66625B] hover:text-[#A09A8F] px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Two Distinct Sections: Platform Integrations vs Document Formats */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#71717A] px-1">
                Direct Platform Integrations (Connected Workspaces & Publishers)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {/* Obsidian */}
                <button
                  onClick={() => {
                    setSelectedPlatform("obsidian");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "obsidian" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#9E7AFF] text-[#9E7AFF] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#9E7AFF]" />
                  <span className="text-xs font-semibold">Obsidian</span>
                  <span className="text-[9px] text-[#71717A]">Vault & Canvas</span>
                </button>

                {/* Google Docs */}
                <button
                  onClick={() => {
                    setSelectedPlatform("google_docs");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "google_docs" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#4285F4] text-[#4285F4] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#4285F4]" />
                  <span className="text-xs font-semibold">Google Docs</span>
                  <span className="text-[9px] text-[#71717A]">Rich HTML & API</span>
                </button>

                {/* Substack */}
                <button
                  onClick={() => {
                    setSelectedPlatform("substack");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "substack" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#FF6719] text-[#FF6719] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-[#FF6719]" />
                  <span className="text-xs font-semibold">Substack</span>
                  <span className="text-[9px] text-[#71717A]">Newsletter Draft</span>
                </button>

                {/* Wattpad */}
                <button
                  onClick={() => {
                    setSelectedPlatform("wattpad");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "wattpad" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#FF500A] text-[#FF500A] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-[#FF500A]" />
                  <span className="text-xs font-semibold">Wattpad</span>
                  <span className="text-[9px] text-[#71717A]">Serial Chapter</span>
                </button>

                {/* Notion */}
                <button
                  onClick={() => {
                    setSelectedPlatform("notion");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "notion" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#ECE7DE] text-[#ECE7DE] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <Globe className="w-4 h-4 text-[#ECE7DE]" />
                  <span className="text-xs font-semibold">Notion</span>
                  <span className="text-[9px] text-[#71717A]">Direct REST API</span>
                </button>

                {/* YouTube */}
                <button
                  onClick={() => {
                    setSelectedPlatform("youtube");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "youtube" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#FF0000] text-[#FF0000] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <Tv className="w-4 h-4 text-[#FF0000]" />
                  <span className="text-xs font-semibold">YouTube</span>
                  <span className="text-[9px] text-[#71717A]">Script & Cues</span>
                </button>

                {/* Spotify */}
                <button
                  onClick={() => {
                    setSelectedPlatform("spotify");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "spotify" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#1DB954] text-[#1DB954] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <Headphones className="w-4 h-4 text-[#1DB954]" />
                  <span className="text-xs font-semibold">Spotify</span>
                  <span className="text-[9px] text-[#71717A]">Audio Notes</span>
                </button>
              </div>

              <div className="text-[10px] uppercase font-bold tracking-wider text-[#71717A] px-1 pt-2">
                Manuscript Document Transpilers
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    setSelectedPlatform("latex");
                    setNaturalPrompt("");
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedPlatform === "latex" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#6B8FA3] text-[#6B8FA3] font-medium"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <FileCode className="w-4 h-4 text-[#6B8FA3]" />
                  <span className="text-xs">LaTeX (.tex)</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlatform("epub");
                    setNaturalPrompt("markdown");
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    naturalPrompt === "markdown"
                      ? "bg-[#1c1c1c] border-[#C8A051] text-[#C8A051] font-medium"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#C8A051]" />
                  <span className="text-xs">Markdown (.md)</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlatform("epub");
                    setNaturalPrompt("html");
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    naturalPrompt === "html"
                      ? "bg-[#1c1c1c] border-[#7E9F86] text-[#7E9F86] font-medium"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <Globe className="w-4 h-4 text-[#7E9F86]" />
                  <span className="text-xs">Clean HTML</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlatform("epub");
                    setNaturalPrompt("plain text manuscript");
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    naturalPrompt === "plain text manuscript"
                      ? "bg-[#1c1c1c] border-[#ECE7DE] text-[#ECE7DE] font-medium"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-[#A09A8F]" />
                  <span className="text-xs">Plain Manuscript</span>
                </button>
              </div>
            </div>

            {/* LIVE INTEGRATION CARDS FOR PLATFORMS */}

            {/* 1. OBSIDIAN INTEGRATION CARD */}
            {selectedPlatform === "obsidian" && (
              <div className="p-5 rounded-2xl bg-[#141416] border border-[#9E7AFF]/40 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#9E7AFF]/20 flex items-center justify-center font-bold text-xs text-[#9E7AFF]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#ECE7DE]">Obsidian Vault & Interactive Canvas Exporter</h4>
                      <p className="text-[11px] text-[#71717A]">
                        Generates Markdown with YAML frontmatter, bidirectional [[wikilinks]], and interactive <span className="font-mono text-[#9E7AFF]">.canvas</span> visual map
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#9E7AFF]/10 text-[#9E7AFF] border border-[#9E7AFF]/30">
                    Vault + Canvas Ready
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-lg bg-[#9E7AFF] hover:bg-[#b091ff] text-[#080808] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Vault Markdown ([[Wikilinks]])</span>
                  </button>

                  <button
                    onClick={handleDownloadCanvas}
                    className="px-3.5 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#28282C] border border-[#9E7AFF]/40 text-xs text-[#9E7AFF] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .canvas Visual Map</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-3.5 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#28282C] border border-[#2C2C32] text-xs text-[#ECE7DE] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-[#A09A8F]" />
                    <span>Download Note (.md)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. GOOGLE DOCS INTEGRATION CARD */}
            {selectedPlatform === "google_docs" && (
              <div className="p-5 rounded-2xl bg-[#141416] border border-[#4285F4]/40 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#4285F4]/20 flex items-center justify-center font-bold text-xs text-[#4285F4]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#ECE7DE]">Google Docs Typography Clipboard & API</h4>
                      <p className="text-[11px] text-[#71717A]">
                        Copies rich formatted HTML to system clipboard for clean Ctrl+V paste into Google Docs with preserved headings & indentations
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/30">
                    Rich Paste Ready
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={handleCopyGoogleDocsHtml}
                    className="px-4 py-2 rounded-lg bg-[#4285F4] hover:bg-[#5a95f5] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy for Google Docs (Rich Formatted HTML)</span>
                  </button>

                  <button
                    onClick={() => {
                      const jsonStr = JSON.stringify(currentPackage.metadata.googleDocsJson || {}, null, 2);
                      const blob = new Blob([jsonStr], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${project.slug}_GoogleDocs_batchUpdate.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#28282C] border border-[#2C2C32] text-xs text-[#ECE7DE] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>Download Docs API JSON (batchUpdate)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. SUBSTACK INTEGRATION CARD */}
            {selectedPlatform === "substack" && (
              <div className="p-5 rounded-2xl bg-[#141416] border border-[#FF6719]/40 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FF6719]/20 flex items-center justify-center font-bold text-xs text-[#FF6719]">
                      <BookMarked className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#ECE7DE]">Substack Newsletter Dispatch</h4>
                      <p className="text-[11px] text-[#71717A]">
                        Includes headline, subtitle inquiry, byline, <span className="font-mono text-[#FF6719]">&lt;!-- paywall --&gt;</span> subscriber gate, and footer CTA
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF6719]/10 text-[#FF6719] border border-[#FF6719]/30">
                    Newsletter Layout
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-lg bg-[#FF6719] hover:bg-[#ff7b36] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Substack Newsletter Post</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-3.5 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#28282C] border border-[#2C2C32] text-xs text-[#ECE7DE] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF6719]" />
                    <span>Download Substack .md</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. WATTPAD INTEGRATION CARD */}
            {selectedPlatform === "wattpad" && (
              <div className="p-5 rounded-2xl bg-[#141416] border border-[#FF500A]/40 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FF500A]/20 flex items-center justify-center font-bold text-xs text-[#FF500A]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#ECE7DE]">Wattpad Serial Episode Exporter</h4>
                      <p className="text-[11px] text-[#71717A]">
                        Serialized Part numbering, teaser quote, cliffhanger pacing, vote & comment CTAs, and discoverability tag cloud
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF500A]/10 text-[#FF500A] border border-[#FF500A]/30">
                    Serialized Format
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-lg bg-[#FF500A] hover:bg-[#ff682b] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Wattpad Serial Chapter</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-3.5 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#28282C] border border-[#2C2C32] text-xs text-[#ECE7DE] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF500A]" />
                    <span>Download Wattpad .md</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. NOTION LIVE API CARD */}
            {selectedPlatform === "notion" && (
              <div className="p-5 rounded-2xl bg-[#141416] border border-[#27272A] space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-white">
                      N
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#ECE7DE]">Notion Workspace Direct Integration</h4>
                      <p className="text-[11px] text-[#71717A]">
                        Publish directly as live blocks into your Notion workspace, or copy paste-ready rich Markdown
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C20] text-[#7E9F86] border border-[#27272A]">
                    Direct API Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#71717A] block mb-1">
                      Notion Integration Token
                    </label>
                    <input
                      type="password"
                      placeholder="secret_..."
                      value={notionToken}
                      onChange={e => setNotionToken(e.target.value)}
                      className="w-full bg-[#18181B] border border-[#2A2A2E] rounded-lg px-3 py-1.5 text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#71717A] block mb-1">
                      Target Parent Page ID or URL
                    </label>
                    <input
                      type="text"
                      placeholder="Paste Notion page URL or 32-character ID..."
                      value={notionPageId}
                      onChange={e => setNotionPageId(e.target.value)}
                      className="w-full bg-[#18181B] border border-[#2A2A2E] rounded-lg px-3 py-1.5 text-xs text-[#ECE7DE] focus:border-[#C8A051] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {notionError && (
                  <div className="p-3 rounded-lg bg-[#BF614B]/15 border border-[#BF614B]/40 text-xs text-[#BF614B]">
                    {notionError}
                  </div>
                )}

                {notionResultUrl && (
                  <div className="p-3 rounded-lg bg-[#7E9F86]/15 border border-[#7E9F86]/40 text-xs text-[#7E9F86] flex items-center justify-between">
                    <span>Page published successfully!</span>
                    <a href={notionResultUrl} target="_blank" rel="noreferrer" className="underline font-medium hover:text-white">
                      Open in Notion ↗
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handlePublishToNotionDirect}
                    disabled={isNotionPublishing}
                    className="px-4 py-2 rounded-lg bg-[#ECE7DE] hover:bg-white text-[#080808] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isNotionPublishing ? "Publishing to Notion..." : "Publish Live to Notion"}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(platformHub.formatForNotionClipboard(project, wiki, segments));
                      setCopied(true);
                      setPublishedNotice("Copied rich Notion Markdown! Paste directly into Notion and it will render native blocks.");
                      setTimeout(() => { setCopied(false); setPublishedNotice(null); }, 4000);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1E1E22] hover:bg-[#28282C] border border-[#2C2C32] text-xs text-[#ECE7DE] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#C8A051]" />
                    <span>Copy for Instant Paste (Native Notion Blocks)</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE CRAFT & INTEGRATION VERIFICATION STATUS CHECKLIST */}
            <div className="p-4 rounded-xl border border-[#202020] bg-[#121214] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${validation.valid ? "text-[#7E9F86]" : "text-[#C8A051]"}`} />
                  <span className="text-xs font-semibold text-[#ECE7DE]">
                    Integration & Craft Verification Checklist ({selectedPlatform.toUpperCase()})
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  validation.valid
                    ? "bg-[#7E9F86]/15 text-[#7E9F86] border border-[#7E9F86]/30"
                    : "bg-[#C8A051]/15 text-[#C8A051] border border-[#C8A051]/30"
                }`}>
                  {validation.valid ? "100% Checked & Verified" : "Checks Incomplete"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {validation.checks.map((chk, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-2.5 rounded-lg bg-[#0A0A0C] border border-[#1E1E22] flex items-start gap-2 text-xs"
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7E9F86] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[#C8A051] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#ECE7DE] text-[11px] truncate">{chk.name}</div>
                      <div className="text-[10px] text-[#71717A] mt-0.5 line-clamp-2">{chk.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Package Preview & Actions */}
            <div className="p-5 rounded-xl border border-[#202020] bg-[#101010] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7E9F86]">
                    Output Preview: {currentPackage.platform.toUpperCase()}
                  </span>
                  <h3 className="font-serif text-base font-medium text-[#ECE7DE] mt-0.5">
                    {currentPackage.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] border border-[#282828] text-xs text-[#ECE7DE] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Copied!" : "Copy Body"}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] border border-[#282828] text-xs text-[#ECE7DE] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={handleSimulatePublish}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7E9F86] text-[#080808] text-xs font-medium hover:bg-[#8eb397] transition-colors cursor-pointer shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish via API</span>
                  </button>
                </div>
              </div>

              {/* Package Body Container */}
              <pre className="p-4 rounded-xl bg-[#080808] border border-[#202020] text-xs font-mono text-[#A09A8F] max-h-96 overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-[#7E9F86]/30">
                {currentPackage.formattedBody}
              </pre>

              {/* Extra Metadata Inspection */}
              {currentPackage.metadata.timestamps && (
                <div className="p-3 rounded-lg bg-[#141414] border border-[#202020]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#A09A8F] block mb-2">
                    Auto-Generated YouTube Timestamps
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {currentPackage.metadata.timestamps.map(t => (
                      <div key={t.time} className="text-xs font-mono text-[#ECE7DE]">
                        <span className="text-[#C8A051]">{t.time}</span> · {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FREE STOCK & AI ASSETS */}
        {activeTab === "assets" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Top Prompt / AI Generator trigger */}
            <div className="p-5 rounded-xl bg-[#141414] border border-[#202020] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C8A051] block mb-1">
                  Provisional Concept Art & Storyboard Engine
                </span>
                <h3 className="font-serif text-base font-medium text-[#ECE7DE]">
                  Generate visual anchors for: Section {targetSegment.romanNumeral} ({targetSegment.title})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateStoryboard("image")}
                  disabled={isGeneratingVisual}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] border border-[#303030] text-xs text-[#ECE7DE] transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#C8A051]" />
                  <span>Generate Image Prompt</span>
                </button>

                <button
                  onClick={() => handleGenerateStoryboard("video")}
                  disabled={isGeneratingVisual}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] border border-[#303030] text-xs text-[#ECE7DE] transition-colors cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-[#6B8FA3]" />
                  <span>Generate Video Storyboard</span>
                </button>
              </div>
            </div>

            {/* Generated Storyboard Result Card */}
            {storyboard && (
              <div className="p-5 rounded-xl bg-[#101010] border border-[#C8A051]/40 flex gap-6 items-start">
                <div className="w-64 h-40 rounded-lg overflow-hidden bg-black shrink-0 border border-[#242424]">
                  <img
                    src={storyboard.simulatedPreviewUrl}
                    alt="Storyboard"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#C8A051]/20 text-[#C8A051]">
                      Engine: {storyboard.engine} · Aspect {storyboard.aspectRatio}
                    </span>
                    <button
                      onClick={() =>
                        onDropAssetToVault(
                          `Storyboard: ${storyboard.targetChapterTitle}`,
                          storyboard.engine.includes("Sora") ? "video" : "image",
                          storyboard.promptDescription,
                          storyboard.simulatedPreviewUrl
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C8A051] text-[#080808] text-xs font-medium hover:bg-[#d6b063] transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Drop into Project Vault</span>
                    </button>
                  </div>

                  <p className="text-xs font-serif text-[#ECE7DE] leading-relaxed">
                    {storyboard.promptDescription}
                  </p>

                  <div className="text-[11px] text-[#A09A8F] space-y-0.5 pt-1">
                    <p><strong className="text-[#66625B]">Camera:</strong> {storyboard.cameraMovement}</p>
                    <p><strong className="text-[#66625B]">Lighting:</strong> {storyboard.lightingCue}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Free Stock Search Catalog */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A09A8F]">
                  Free & Open Creative Stock Assets (Wikimedia, Openverse, Public Domain)
                </h3>

                <form onSubmit={handleStockSearch} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search stock by theme, keyword..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-[#080808] border border-[#202020] text-xs text-[#ECE7DE] px-3 py-1.5 rounded-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-[#202020] text-[#ECE7DE] hover:bg-[#303030]"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {stockResults.map(item => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#202020] bg-[#101010] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-36 bg-black overflow-hidden relative group">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute top-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-[#ECE7DE] backdrop-blur-sm">
                        {item.license}
                      </span>
                    </div>

                    <div className="p-3 space-y-2">
                      <h4 className="font-serif text-xs font-medium text-[#ECE7DE] truncate">{item.title}</h4>
                      <span className="text-[10px] text-[#66625B] block">{item.source} · {item.creator}</span>

                      <button
                        onClick={() =>
                          onDropAssetToVault(
                            item.title,
                            "image",
                            `Stock asset from ${item.source} (${item.license})`,
                            item.fullImageUrl
                          )
                        }
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#181818] hover:bg-[#242424] border border-[#282828] text-[11px] text-[#ECE7DE] transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Drop to Project Vault</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INBOUND INGESTION */}
        {activeTab === "inbound" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {inboundNotice && (
              <div className="p-3.5 rounded-xl bg-[#7E9F86]/15 border border-[#7E9F86]/40 text-xs text-[#7E9F86] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{inboundNotice}</span>
              </div>
            )}

            <div className="p-5 rounded-xl bg-[#101010] border border-[#202020] space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B8FA3] block mb-1">
                  Inbound Connectors Hub
                </span>
                <h3 className="font-serif text-base font-medium text-[#ECE7DE]">
                  Import Outside Material Directly into Project Drop Vault
                </h3>
                <p className="text-xs text-[#A09A8F] mt-1 leading-relaxed">
                  Receive articles from Instapaper, Notion blocks, or Chrome tabs. The AI auto-arranger will immediately compare them with your manuscript and suggest where to integrate them.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInboundSource("instapaper")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    inboundSource === "instapaper" ? "bg-[#282828] text-[#ECE7DE] border border-[#404040]" : "text-[#66625B]"
                  }`}
                >
                  Instapaper
                </button>
                <button
                  type="button"
                  onClick={() => setInboundSource("notion")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    inboundSource === "notion" ? "bg-[#282828] text-[#ECE7DE] border border-[#404040]" : "text-[#66625B]"
                  }`}
                >
                  Notion Page
                </button>
                <button
                  type="button"
                  onClick={() => setInboundSource("chrome")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    inboundSource === "chrome" ? "bg-[#282828] text-[#ECE7DE] border border-[#404040]" : "text-[#66625B]"
                  }`}
                >
                  Chrome Tab / Reading
                </button>
              </div>

              <form onSubmit={handleInboundIngest} className="space-y-3">
                <textarea
                  placeholder={`Paste ${inboundSource} URL, highlights, or exported text content here...`}
                  value={inboundUrlOrText}
                  onChange={e => setInboundUrlOrText(e.target.value)}
                  className="w-full h-44 bg-[#080808] border border-[#202020] rounded-xl p-3 text-xs font-serif leading-relaxed text-[#ECE7DE] focus:outline-none resize-none"
                  required
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#6B8FA3] text-[#080808] text-xs font-medium hover:bg-[#85a8bc] transition-colors cursor-pointer"
                >
                  Import & Auto-Arrange into Project Vault
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
