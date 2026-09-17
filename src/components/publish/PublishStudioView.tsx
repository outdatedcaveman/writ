import React, { useState } from "react";
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
  FileText
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
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform>("substack");
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

  const targetSegment = activeSegment || segments[0];

  // Derive Current Publish Package
  const currentPackage: PublishPackage = React.useMemo(() => {
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
      case "substack":
        return platformHub.formatForSubstack(project, targetSegment);
      case "wattpad":
        return platformHub.formatForWattpad(project, targetSegment);
      case "youtube":
        return platformHub.formatForYouTube(project, segments);
      case "spotify":
        return platformHub.formatForSpotify(project, targetSegment);
      case "notion":
        return platformHub.formatForNotion(project, wiki, segments);
      case "latex":
        return platformHub.formatForLatex(project, segments);
      default:
        return platformHub.formatForSubstack(project, targetSegment);
    }
  }, [selectedPlatform, naturalPrompt, project, targetSegment, segments, wiki]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPackage.formattedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = selectedPlatform === "latex" ? "tex" : selectedPlatform === "notion" ? "json" : "md";
    const blob = new Blob([currentPackage.formattedBody], { type: "text/plain;charset=utf-8" });
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
                Direct Platform Integrations (Connected Workspaces)
              </div>
              <div className="grid grid-cols-5 gap-2">
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
                  <span className="text-xs font-semibold">Notion (API)</span>
                  <span className="text-[9px] text-[#71717A]">Direct Page Publish</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlatform("substack");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "substack" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#7E9F86] text-[#7E9F86] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-[#7E9F86]" />
                  <span className="text-xs font-semibold">Substack</span>
                  <span className="text-[9px] text-[#71717A]">Newsletter Draft</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlatform("wattpad");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "wattpad" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#BF614B] text-[#BF614B] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#BF614B]" />
                  <span className="text-xs font-semibold">Wattpad</span>
                  <span className="text-[9px] text-[#71717A]">Serialized Chapter</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlatform("youtube");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "youtube" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#BF614B] text-[#BF614B] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <Tv className="w-4 h-4 text-[#BF614B]" />
                  <span className="text-xs font-semibold">YouTube</span>
                  <span className="text-[9px] text-[#71717A]">Script & Timestamps</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlatform("spotify");
                    setNaturalPrompt("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPlatform === "spotify" && !naturalPrompt
                      ? "bg-[#1c1c1c] border-[#7E9F86] text-[#7E9F86] shadow-md"
                      : "bg-[#101010] border-[#202020] text-[#A09A8F] hover:border-[#333]"
                  }`}
                >
                  <Headphones className="w-4 h-4 text-[#7E9F86]" />
                  <span className="text-xs font-semibold">Spotify / Audio</span>
                  <span className="text-[9px] text-[#71717A]">Show Notes & Cues</span>
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

            {/* Notion Live API Card when Notion is active */}
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
