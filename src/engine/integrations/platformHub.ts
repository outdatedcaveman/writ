import { Project, Segment, ProjectWiki } from "../../types/workspace";

export type SupportedPlatform =
  | "substack"
  | "wattpad"
  | "notion"
  | "obsidian"
  | "google_docs"
  | "youtube"
  | "spotify"
  | "latex"
  | "instapaper"
  | "epub";

export interface PublishPackage {
  platform: SupportedPlatform;
  title: string;
  subtitle?: string;
  formattedBody: string;
  metadata: {
    tags?: string[];
    description?: string;
    timestamps?: { time: string; title: string }[];
    notionBlocks?: any[];
    latexSource?: string;
    brollSuggestions?: string[];
    canvasJson?: string;
    googleDocsJson?: any;
    paywallBreakIndex?: number;
    cliffhangerSnippet?: string;
    validationChecks?: { name: string; passed: boolean; message: string }[];
  };
  deliveryStatus: "ready_to_send" | "exported" | "published";
  webhookEndpoint?: string;
}

export class PlatformHub {
  public formatForSubstack(project: Project, segment: Segment, allSegments?: Segment[]): PublishPackage {
    const title = segment.title;
    const subtitle = segment.synopsis || project.logline;
    
    // Split paragraphs to position the paywall break after the opening argument / scene
    const paragraphs = segment.textContent.split(/\n\s*\n/).filter(Boolean);
    const teaser = paragraphs.slice(0, 2).join("\n\n");
    const remainder = paragraphs.slice(2).join("\n\n");

    const body = `# ${title}\n\n` +
      `*${subtitle}*\n\n` +
      `**By Bruno** · *Writ Literary Studio Dispatch*\n\n` +
      `---\n\n` +
      `${teaser || segment.textContent}\n\n` +
      `<!-- paywall -->\n\n` +
      `> 🔒 *This essay continues below for paid members of the studio inquiry.* \n\n` +
      `---\n\n` +
      `${remainder ? remainder + "\n\n" : ""}` +
      `### The Synthesis\n\n` +
      `Inquiry requires enduring the discomfort of not yet having an answer. True craft lives in the tension between what is known and what is yet to be revealed.\n\n` +
      `*Subscribe to receive new chapters, structural breakdowns, and craft sentinels directly in your inbox.*`;

    return {
      platform: "substack",
      title,
      subtitle,
      formattedBody: body,
      metadata: {
        tags: ["Essays", "Literary Nonfiction", "Culture", "Writing Craft"],
        description: subtitle,
        paywallBreakIndex: teaser.length
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForWattpad(project: Project, segment: Segment): PublishPackage {
    const title = `${segment.romanNumeral}. ${segment.title}`;
    const wordCount = segment.textContent.split(/\s+/).filter(Boolean).length;
    const body = `[b]${project.title.toUpperCase()}[/b]\n` +
      `[i]Part ${segment.romanNumeral}: ${segment.title}[/i]\n\n` +
      `[quote]${segment.synopsis || project.logline}[/quote]\n\n` +
      `${segment.textContent}\n\n` +
      `---\n\n` +
      `[center]✦ End of Part ${segment.romanNumeral} ✦[/center]\n\n` +
      `[b]Author's Note:[/b] Thank you for reading! If you enjoyed this chapter, hit that [b]★ Vote[/b] button and comment your predictions for what happens next!\n` +
      `[i]Written and structured with Writ Studio.[/i]`;

    return {
      platform: "wattpad",
      title,
      formattedBody: body,
      metadata: {
        tags: ["philosophical", "thoughtprovoking", "literary", "drama", "psychological", "deepcut", "writerscommunity"],
        description: segment.synopsis,
        cliffhangerSnippet: segment.textContent.slice(-180).trim()
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForObsidianVault(project: Project, wiki?: ProjectWiki, segments: Segment[] = []): PublishPackage {
    const totalWords = segments.reduce(
      (acc, s) => acc + s.textContent.split(/\s+/).filter(Boolean).length,
      0
    );

    // 1. Generate Obsidian Markdown with YAML Frontmatter & [[Wikilinks]]
    let obsidianMd = `---\n` +
      `title: "${project.title.replace(/"/g, '\\"')}"\n` +
      `slug: "${project.slug}"\n` +
      `genre: "${project.genre}"\n` +
      `logline: "${(project.logline || "").replace(/"/g, '\\"')}"\n` +
      `total_words: ${totalWords}\n` +
      `total_chapters: ${segments.length}\n` +
      `created: "${new Date(project.createdAt).toISOString()}"\n` +
      `updated: "${new Date(project.updatedAt).toISOString()}"\n` +
      `tags:\n` +
      `  - writ/manuscript\n` +
      `  - genre/${project.genre}\n` +
      `  - draft/active\n` +
      `status: in-progress\n` +
      `---\n\n` +
      `# ${project.title}\n\n` +
      `> [!abstract] Central Inquiry\n` +
      `> ${project.logline || "No central inquiry defined."}\n\n` +
      `## Narrative Overview\n\n` +
      `- **Genre**: ${project.genre}\n` +
      `- **Framework**: ${wiki?.macroStructure?.framework || "Three-Act Arc"}\n` +
      `- **Chapters**: ${segments.length} sections (${totalWords.toLocaleString()} words)\n\n` +
      `---\n\n`;

    // Process chapters with [[wikilinks]] for known characters and argument themes
    segments.forEach(seg => {
      let chapterText = seg.textContent;
      if (wiki?.characters && wiki.characters.length > 0) {
        for (const char of wiki.characters) {
          if (char.name && char.name.trim().length >= 3) {
            const escaped = char.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const reg = new RegExp(`\\b(${escaped})\\b`, "g");
            chapterText = chapterText.replace(reg, `[[$1]]`);
          }
        }
      }

      obsidianMd += `## [[Section ${seg.romanNumeral} - ${seg.title}]]\n\n` +
        `> [!info] Synopsis\n` +
        `> ${seg.synopsis || "Chapter draft"}\n\n` +
        `${chapterText}\n\n` +
        `---\n\n`;
    });

    // 2. Generate Interactive Obsidian Canvas (.canvas file format)
    const canvasNodes: any[] = [
      {
        id: "node-project-root",
        type: "text",
        text: `# ${project.title}\n\n${project.logline || "Central Manuscript"}`,
        x: 0,
        y: 0,
        width: 340,
        height: 180,
        color: "1" // Red/Accent in Obsidian
      }
    ];

    const canvasEdges: any[] = [];

    // Lay out chapters horizontally
    segments.forEach((seg, idx) => {
      const nodeId = `node-chapter-${seg.id}`;
      canvasNodes.push({
        id: nodeId,
        type: "text",
        text: `### Section ${seg.romanNumeral}: ${seg.title}\n\n${seg.synopsis || ""}\n\n*Words: ${seg.textContent.split(/\s+/).filter(Boolean).length}*`,
        x: (idx + 1) * 380,
        y: 0,
        width: 320,
        height: 200,
        color: "3" // Yellow/Gold in Obsidian
      });

      // Edge from previous node
      const fromNode = idx === 0 ? "node-project-root" : `node-chapter-${segments[idx - 1].id}`;
      canvasEdges.push({
        id: `edge-flow-${idx}`,
        fromNode,
        fromSide: "right",
        toNode: nodeId,
        toSide: "left",
        label: `Next →`
      });
    });

    // Lay out characters below chapters
    if (wiki?.characters) {
      wiki.characters.forEach((char, cIdx) => {
        const charNodeId = `node-char-${char.id}`;
        canvasNodes.push({
          id: charNodeId,
          type: "text",
          text: `#### ${char.name} (${char.role})\n\n**Motivation:** ${char.motivation || "Not specified"}\n**Arc:** ${char.arc || "Developing"}`,
          x: cIdx * 300,
          y: 280,
          width: 260,
          height: 160,
          color: "4" // Green in Obsidian
        });
      });
    }

    const canvasJson = JSON.stringify({ nodes: canvasNodes, edges: canvasEdges }, null, 2);

    return {
      platform: "obsidian",
      title: `${project.slug}-obsidian-vault.md`,
      formattedBody: obsidianMd,
      metadata: {
        description: "Obsidian Vault Export with YAML frontmatter, [[wikilinks]], and interactive .canvas map.",
        tags: ["writ", "obsidian", "canvas", project.genre],
        canvasJson
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForGoogleDocs(project: Project, segments: Segment[]): PublishPackage {
    const totalWords = segments.reduce(
      (acc, s) => acc + s.textContent.split(/\s+/).filter(Boolean).length,
      0
    );

    // 1. Rich HTML formatted for Google Docs native paste
    let html = `<div style="font-family: 'Merriweather', 'Times New Roman', Georgia, serif; font-size: 11pt; line-height: 1.85; color: #111827; max-width: 650px; margin: 0 auto; padding: 20px;">\n`;
    html += `  <h1 style="font-family: 'Merriweather', Georgia, serif; font-size: 26pt; font-weight: 700; color: #0F172A; margin-bottom: 8pt; line-height: 1.2;">${project.title}</h1>\n`;
    if (project.logline) {
      html += `  <p style="font-size: 12.5pt; font-style: italic; color: #4B5563; margin-top: 0; margin-bottom: 20pt; border-left: 3px solid #C8A051; padding-left: 12pt;">${project.logline}</p>\n`;
    }
    html += `  <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 24pt 0;" />\n`;

    segments.forEach(seg => {
      html += `  <h2 style="font-family: 'Merriweather', Georgia, serif; font-size: 17pt; font-weight: 600; color: #1E293B; margin-top: 32pt; margin-bottom: 8pt; border-bottom: 1px solid #F1F5F9; padding-bottom: 4pt;">Section ${seg.romanNumeral}: ${seg.title}</h2>\n`;
      if (seg.synopsis) {
        html += `  <p style="font-size: 10pt; color: #6B7280; font-style: italic; margin-bottom: 14pt;">${seg.synopsis}</p>\n`;
      }
      const paras = seg.textContent.split(/\n\s*\n/).filter(Boolean);
      paras.forEach(p => {
        html += `  <p style="margin: 0 0 12pt 0; text-indent: 1.5em; text-align: justify;">${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>\n`;
      });
    });

    html += `</div>`;

    // 2. Structured Google Docs API JSON payload (batchUpdate requests)
    const googleDocsJson = {
      title: project.title,
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: `${project.title}\n${project.logline || ""}\n\n`
          }
        },
        ...segments.map((seg, idx) => ({
          insertText: {
            endOfSegmentLocation: {},
            text: `Section ${seg.romanNumeral}: ${seg.title}\n\n${seg.textContent}\n\n`
          }
        }))
      ]
    };

    return {
      platform: "google_docs",
      title: `${project.title} (Google Docs Edition)`,
      formattedBody: html,
      metadata: {
        description: "Formatted rich HTML ready for native Google Docs paste + batchUpdate API schema.",
        tags: ["google-docs", "formatted-html", "gdocs"],
        googleDocsJson
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForYouTube(project: Project, segments: Segment[]): PublishPackage {
    const title = `${project.title}: Why We Pretend to Know Everything`;
    let script = `# VIDEO SCRIPT: ${title}\n\n[VISUAL: Slow tracking shot of bustling city, cold ambient lighting]\n[NARRATOR ON CAMERA]:\n`;

    const timestamps: { time: string; title: string }[] = [];
    let currentMinute = 0;

    segments.forEach((seg, idx) => {
      const timeStr = `0${currentMinute}:00`.slice(-5);
      timestamps.push({ time: timeStr, title: `Section ${seg.romanNumeral}: ${seg.title}` });

      script += `\n\n--- [CHAPTER ${seg.romanNumeral}: ${seg.title.toUpperCase()}] ---\n`;
      script += `[B-ROLL CUE: Archival footage of executive meetings, news ticker headlines, stock market tickers]\n`;
      script += `[VOICEOVER]:\n${seg.textContent.slice(0, 400)}...\n`;

      currentMinute += 2;
    });

    const description = `${project.logline}\n\nTIMESTAMPS:\n` +
      timestamps.map(t => `${t.time} - ${t.title}`).join("\n") +
      `\n\nProduced with Writ Desktop Studio.`;

    return {
      platform: "youtube",
      title,
      formattedBody: script,
      metadata: {
        description,
        timestamps,
        brollSuggestions: [
          "Fast-paced news ticker overlays",
          "Glass office buildings and empty meeting rooms",
          "Rain falling on an empty bus stop shelter",
          "Abstract geometric wave diagrams representing uncertainty"
        ]
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForSpotify(project: Project, segment: Segment): PublishPackage {
    const title = `Ep. 1: ${segment.title} (${project.title})`;
    const script = `[INTRO THEME MUSIC - FADE IN 10s]\n\n` +
      `HOST: Welcome back to the inquiry. Today, we're dissecting a question that sits at the center of institutional life:\n\n` +
      `"${segment.synopsis}"\n\n` +
      `[MUSIC FADES DOWN UNDER VOICE]\n\n` +
      `${segment.textContent}\n\n` +
      `[OUTRO MUSIC - FADE OUT]`;

    return {
      platform: "spotify",
      title,
      formattedBody: script,
      metadata: {
        description: `Show Notes: ${segment.synopsis}\n\nKey Inquiry: How certainty production replaces truth-seeking.\n\nCreated with Writ Studio.`
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForNotion(project: Project, wiki: ProjectWiki, segments: Segment[]): PublishPackage {
    const notionBlocks: any[] = [
      {
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: project.title } }] }
      },
      {
        object: "block",
        type: "callout",
        callout: { rich_text: [{ type: "text", text: { content: project.logline } }], icon: { emoji: "📖" } }
      },
      {
        object: "block",
        type: "divider",
        divider: {}
      }
    ];

    segments.forEach(seg => {
      notionBlocks.push({
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: `Section ${seg.romanNumeral}: ${seg.title}` } }] }
      });
      const paragraphs = seg.textContent.split(/\n\s*\n/).filter(Boolean);
      paragraphs.forEach(p => {
        notionBlocks.push({
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ type: "text", text: { content: p.trim() } }] }
        });
      });
    });

    const pasteableMarkdown = this.formatForNotionClipboard(project, wiki, segments);

    return {
      platform: "notion",
      title: project.title,
      formattedBody: pasteableMarkdown,
      metadata: {
        notionBlocks,
        description: "Paste directly into Notion, or click 'Publish via Notion API' to auto-create the page in your workspace."
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForNotionClipboard(project: Project, wiki?: ProjectWiki, segments: Segment[] = []): string {
    let md = `# ${project.title}\n\n> 💡 **Inquiry**: ${project.logline}\n\n---\n\n`;
    segments.forEach(seg => {
      md += `## Section ${seg.romanNumeral}: ${seg.title}\n\n`;
      md += `${seg.textContent}\n\n`;
    });
    return md;
  }

  public async publishToNotionApi(params: {
    token: string;
    parentPageId: string;
    project: Project;
    wiki?: ProjectWiki;
    segments: Segment[];
  }): Promise<{ success: boolean; pageUrl?: string; error?: string }> {
    try {
      const cleanParentId = params.parentPageId.replace(/-/g, "").trim();
      const notionBlocks: any[] = [
        {
          object: "block",
          type: "callout",
          callout: {
            rich_text: [{ type: "text", text: { content: params.project.logline || "Published from Writ Literary Studio" } }],
            icon: { emoji: "📖" }
          }
        },
        {
          object: "block",
          type: "divider",
          divider: {}
        }
      ];

      params.segments.forEach(seg => {
        notionBlocks.push({
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: `Section ${seg.romanNumeral}: ${seg.title}` } }] }
        });

        const paragraphs = seg.textContent.split(/\n\s*\n/).filter(Boolean);
        paragraphs.forEach(p => {
          notionBlocks.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: [{ type: "text", text: { content: p.trim() } }] }
          });
        });
      });

      const firstChunk = notionBlocks.slice(0, 95);

      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${params.token.trim()}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          parent: { page_id: cleanParentId },
          properties: {
            title: [
              {
                text: { content: params.project.title }
              }
            ]
          },
          children: firstChunk
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || `Notion API response: ${res.status}` };
      }

      return { success: true, pageUrl: data.url };
    } catch (err: any) {
      return { success: false, error: err.message || "Could not reach Notion API" };
    }
  }

  public formatForMarkdown(project: Project, segments: Segment[]): PublishPackage {
    let md = `# ${project.title}\n\n`;
    if (project.logline) md += `*${project.logline}*\n\n---\n\n`;
    segments.forEach(seg => {
      md += `## Section ${seg.romanNumeral}: ${seg.title}\n\n`;
      md += `${seg.textContent}\n\n`;
    });

    return {
      platform: "epub",
      title: `${project.slug}.md`,
      formattedBody: md,
      metadata: { description: "Standard GitHub Flavored Markdown" },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForHtml(project: Project, segments: Segment[]): PublishPackage {
    let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>${project.title}</title>\n<style>\nbody { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.8; color: #222; }\nh1 { font-size: 2.2em; }\nh2 { font-size: 1.4em; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-top: 36px; }\np { margin: 1.2em 0; }\n</style>\n</head>\n<body>\n<h1>${project.title}</h1>\n<p><em>${project.logline}</em></p>\n<hr>\n`;
    segments.forEach(seg => {
      html += `<h2>Section ${seg.romanNumeral}: ${seg.title}</h2>\n`;
      const paras = seg.textContent.split(/\n\s*\n/).filter(Boolean);
      paras.forEach(p => {
        html += `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>\n`;
      });
    });
    html += `</body>\n</html>`;

    return {
      platform: "epub",
      title: `${project.slug}.html`,
      formattedBody: html,
      metadata: { description: "Clean standalone HTML article" },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForLatex(project: Project, segments: Segment[]): PublishPackage {
    let tex = `\\documentclass[11pt, a4paper]{article}\n`;
    tex += `\\usepackage[utf8]{inputenc}\n`;
    tex += `\\usepackage{amsmath, amssymb, amsthm}\n`;
    tex += `\\usepackage{hyperref}\n`;
    tex += `\\usepackage{booktabs}\n`;
    tex += `\\usepackage{geometry}\n`;
    tex += `\\geometry{margin=1in}\n\n`;
    tex += `\\title{\\textbf{${project.title}}}\n`;
    tex += `\\author{Author \\\\ \\small Writ Literary Studio}\n`;
    tex += `\\date{\\today}\n\n`;
    tex += `\\begin{document}\n\n`;
    tex += `\\maketitle\n\n`;
    tex += `\\begin{abstract}\n${project.logline}\n\\end{abstract}\n\n`;

    segments.forEach(seg => {
      tex += `\\section{${seg.title}}\n`;
      tex += `\\label{sec:${seg.romanNumeral.toLowerCase()}}\n\n`;
      const paras = seg.textContent.split(/\n\s*\n/).filter(Boolean);
      paras.forEach(p => {
        tex += `${p}\n\n`;
      });
    });

    tex += `\\end{document}\n`;

    return {
      platform: "latex",
      title: `${project.slug}.tex`,
      formattedBody: tex,
      metadata: {
        latexSource: tex
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public validatePlatformPackage(pkg: PublishPackage): {
    valid: boolean;
    checks: { name: string; passed: boolean; message: string }[];
  } {
    const checks: { name: string; passed: boolean; message: string }[] = [];

    // General title & body check
    checks.push({
      name: "Title Presence",
      passed: Boolean(pkg.title && pkg.title.trim().length > 0),
      message: pkg.title ? `Title: "${pkg.title}"` : "Missing publication title."
    });

    checks.push({
      name: "Body Content",
      passed: Boolean(pkg.formattedBody && pkg.formattedBody.trim().length > 30),
      message: pkg.formattedBody && pkg.formattedBody.trim().length > 30
        ? `Body rendered (${pkg.formattedBody.length.toLocaleString()} characters).`
        : "Body text is empty or too short."
    });

    switch (pkg.platform) {
      case "notion":
        checks.push({
          name: "Notion Blocks Payload",
          passed: Boolean(pkg.metadata.notionBlocks && pkg.metadata.notionBlocks.length > 0),
          message: pkg.metadata.notionBlocks?.length
            ? `${pkg.metadata.notionBlocks.length} Notion blocks compiled for REST API.`
            : "No Notion blocks generated."
        });
        checks.push({
          name: "Markdown Fallback",
          passed: pkg.formattedBody.includes("# "),
          message: "Markdown clipboard transpile prepared with level-1 headings."
        });
        break;

      case "obsidian":
        const hasFrontmatter = pkg.formattedBody.startsWith("---\n") && pkg.formattedBody.indexOf("\n---\n", 4) > -1;
        checks.push({
          name: "YAML Frontmatter Integrity",
          passed: hasFrontmatter,
          message: hasFrontmatter ? "Standard YAML frontmatter header formatted with metadata." : "YAML frontmatter delimiters missing."
        });
        checks.push({
          name: "Wikilinks Syntax",
          passed: pkg.formattedBody.includes("[[") && pkg.formattedBody.includes("]]"),
          message: "Cross-chapter and character [[wikilinks]] detected."
        });
        let canvasValid = false;
        try {
          if (pkg.metadata.canvasJson) {
            const parsed = JSON.parse(pkg.metadata.canvasJson);
            canvasValid = Boolean(parsed.nodes && parsed.edges);
          }
        } catch {}
        checks.push({
          name: "Obsidian Canvas Structure (.canvas)",
          passed: canvasValid,
          message: canvasValid ? "Interactive Canvas JSON schema compiled with nodes and edges." : "Canvas JSON generation failed."
        });
        break;

      case "google_docs":
        const hasStyledHtml = pkg.formattedBody.includes("<div style=") && pkg.formattedBody.includes("<h1");
        checks.push({
          name: "Google Docs Native HTML Clipboard",
          passed: hasStyledHtml,
          message: hasStyledHtml ? "Rich HTML with Merriweather serif typography formatted for native paste." : "HTML styling missing."
        });
        checks.push({
          name: "BatchUpdate Document Schema",
          passed: Boolean(pkg.metadata.googleDocsJson && pkg.metadata.googleDocsJson.requests?.length > 0),
          message: pkg.metadata.googleDocsJson?.requests?.length
            ? `${pkg.metadata.googleDocsJson.requests.length} batchUpdate requests ready for Docs API.`
            : "Missing batchUpdate requests."
        });
        break;

      case "substack":
        const hasPaywall = pkg.formattedBody.includes("<!-- paywall -->");
        checks.push({
          name: "Substack Paywall Cut",
          passed: hasPaywall,
          message: hasPaywall ? "Paywall break <!-- paywall --> placed after opening hook." : "Paywall break missing."
        });
        checks.push({
          name: "Subscriber Call-to-Action",
          passed: pkg.formattedBody.toLowerCase().includes("subscribe"),
          message: "Subscriber newsletter retention footer included."
        });
        break;

      case "wattpad":
        const hasVotingHook = pkg.formattedBody.includes("Vote") || pkg.formattedBody.includes("vote");
        checks.push({
          name: "Wattpad Serial Reader Engagement",
          passed: hasVotingHook,
          message: "Author note with voting & commenting call-to-action included."
        });
        const tagsOk = Boolean(pkg.metadata.tags && pkg.metadata.tags.length >= 3);
        checks.push({
          name: "Genre Tag Cloud",
          passed: tagsOk,
          message: tagsOk ? `${pkg.metadata.tags?.length} discoverability tags attached.` : "Fewer than 3 tags."
        });
        break;

      case "latex":
        const hasDocClass = pkg.formattedBody.includes("\\documentclass") && pkg.formattedBody.includes("\\end{document}");
        checks.push({
          name: "LaTeX Syntax Integrity",
          passed: hasDocClass,
          message: hasDocClass ? "Valid article class with math packages and abstract." : "LaTeX document environment invalid."
        });
        break;

      default:
        break;
    }

    const valid = checks.every(c => c.passed);
    return { valid, checks };
  }

  // Natural Language Prompt Automation: "Describe what you want"
  public synthesizeCustomPublishFormat(
    userPrompt: string,
    project: Project,
    segment: Segment,
    allSegments: Segment[],
    wiki: ProjectWiki
  ): PublishPackage {
    const promptLower = userPrompt.toLowerCase();

    if (promptLower.includes("obsidian") || promptLower.includes("vault") || promptLower.includes("canvas")) {
      return this.formatForObsidianVault(project, wiki, allSegments);
    }
    if (promptLower.includes("google") || promptLower.includes("docs") || promptLower.includes("gdoc")) {
      return this.formatForGoogleDocs(project, allSegments);
    }
    if (promptLower.includes("substack") || promptLower.includes("newsletter")) {
      return this.formatForSubstack(project, segment, allSegments);
    }
    if (promptLower.includes("wattpad") || promptLower.includes("fiction chapter")) {
      return this.formatForWattpad(project, segment);
    }
    if (promptLower.includes("youtube") || promptLower.includes("script") || promptLower.includes("video")) {
      return this.formatForYouTube(project, allSegments);
    }
    if (promptLower.includes("spotify") || promptLower.includes("podcast") || promptLower.includes("audio")) {
      return this.formatForSpotify(project, segment);
    }
    if (promptLower.includes("notion") || promptLower.includes("block")) {
      return this.formatForNotion(project, wiki, allSegments);
    }
    if (promptLower.includes("latex") || promptLower.includes("academic") || promptLower.includes("paper") || promptLower.includes("pdf")) {
      return this.formatForLatex(project, allSegments);
    }

    // Default to Substack formatted article
    return this.formatForSubstack(project, segment, allSegments);
  }

  // Zero-Attrition Direct 1-Click Openers (Open apps & platforms with primed drafts)

  public async primeSystemClipboard(text: string, htmlContent?: string): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        if (htmlContent && typeof window !== "undefined" && (window as any).ClipboardItem) {
          const textBlob = new Blob([text], { type: "text/plain" });
          const htmlBlob = new Blob([htmlContent], { type: "text/html" });
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({
              "text/plain": textBlob,
              "text/html": htmlBlob
            })
          ]);
          return true;
        }
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn("Clipboard priming fallback:", e);
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch {}
    }
    return false;
  }

  public async openExternalUrl(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window !== "undefined" && (window as any).electronAPI?.openExternal) {
        return await (window as any).electronAPI.openExternal(url);
      }
      // Fallback to server endpoint
      const res = await fetch("/api/open-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (res.ok) return { success: true };
      if (typeof window !== "undefined") {
        window.open(url, "_blank");
        return { success: true };
      }
      return { success: false, error: "Unable to open URL" };
    } catch (err: any) {
      if (typeof window !== "undefined") {
        window.open(url, "_blank");
        return { success: true };
      }
      return { success: false, error: err.message };
    }
  }

  public async writeObsidianFile(
    vaultPath: string,
    filename: string,
    content: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      if (typeof window !== "undefined" && (window as any).electronAPI?.writeObsidianFile) {
        return await (window as any).electronAPI.writeObsidianFile(vaultPath, filename, content);
      }
      const res = await fetch("/api/obsidian/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultPath, filename, content })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async launchObsidianLive(params: {
    vaultName: string;
    vaultPath?: string;
    project: Project;
    wiki?: ProjectWiki;
    segments: Segment[];
  }): Promise<{ success: boolean; uri: string; error?: string }> {
    const { vaultName, vaultPath, project, wiki, segments } = params;
    const pkg = this.formatForObsidianVault(project, wiki, segments);
    const noteFileName = `${project.title}.md`;
    const canvasFileName = `${project.title}.canvas`;

    // If vaultPath is provided, write the files directly into the vault
    if (vaultPath && vaultPath.trim()) {
      await this.writeObsidianFile(vaultPath.trim(), noteFileName, pkg.formattedBody);
      if (pkg.metadata.canvasJson) {
        await this.writeObsidianFile(vaultPath.trim(), canvasFileName, pkg.metadata.canvasJson);
      }
    }

    // Generate Obsidian URI: obsidian://open?vault=<vaultName>&file=<fileName>
    const cleanVault = encodeURIComponent(vaultName.trim());
    const cleanFile = encodeURIComponent(project.title.trim());
    const obsidianUri = `obsidian://open?vault=${cleanVault}&file=${cleanFile}`;

    const openRes = await this.openExternalUrl(obsidianUri);
    return { success: openRes.success, uri: obsidianUri, error: openRes.error };
  }

  public async launchSubstackDraft(
    project: Project,
    segment: Segment,
    publicationDomain?: string
  ): Promise<{ success: boolean; url: string }> {
    const pkg = this.formatForSubstack(project, segment);
    await this.primeSystemClipboard(pkg.formattedBody);

    let targetUrl = "https://substack.com/publish/post";
    if (publicationDomain && publicationDomain.trim()) {
      const domain = publicationDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      targetUrl = `https://${domain}/publish/post`;
    }

    await this.openExternalUrl(targetUrl);
    return { success: true, url: targetUrl };
  }

  public async launchGoogleDocsDraft(
    project: Project,
    segments: Segment[]
  ): Promise<{ success: boolean; url: string }> {
    const pkg = this.formatForGoogleDocs(project, segments);
    const plain = segments.map(s => `${s.title}\n\n${s.textContent}`).join("\n\n---\n\n");
    await this.primeSystemClipboard(plain, pkg.formattedBody);

    const targetUrl = "https://docs.google.com/document/create";
    await this.openExternalUrl(targetUrl);
    return { success: true, url: targetUrl };
  }

  public async launchWattpadDraft(
    project: Project,
    segment: Segment
  ): Promise<{ success: boolean; url: string }> {
    const pkg = this.formatForWattpad(project, segment);
    await this.primeSystemClipboard(pkg.formattedBody);

    const targetUrl = "https://www.wattpad.com/myworks/new";
    await this.openExternalUrl(targetUrl);
    return { success: true, url: targetUrl };
  }

  // =========================================================
  // NOTION WRIT VAULT WATCHER & SYNC CLIENT HELPERS
  // =========================================================

  public extractNotionId(input: string): string {
    if (!input || typeof input !== "string") return "";
    const cleaned = input.trim();
    const noHyphens = cleaned.replace(/-/g, "");
    const match = noHyphens.match(/[0-9a-f]{32}/i);
    if (match) return match[0].toLowerCase();
    const uuidMatch = cleaned.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) return uuidMatch[0].replace(/-/g, "").toLowerCase();
    return cleaned;
  }

  public async getNotionVaultSyncConfig(): Promise<NotionVaultSyncConfig | null> {
    try {
      const res = await fetch("http://localhost:4983/api/notion/vault-sync/config");
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async saveNotionVaultSyncConfig(
    config: Partial<NotionVaultSyncConfig>
  ): Promise<{ success: boolean; config?: NotionVaultSyncConfig; error?: string }> {
    try {
      const res = await fetch("http://localhost:4983/api/notion/vault-sync/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}` };
      return { success: true, config: data.config };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to save Notion sync configuration" };
    }
  }

  public async triggerNotionVaultSync(): Promise<NotionVaultSyncResult> {
    try {
      const res = await fetch("http://localhost:4983/api/notion/vault-sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}` };
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || "Could not reach Notion Vault Sync Service" };
    }
  }

  public async scaffoldNotionProjectSubpages(
    projects?: { id: string; title: string }[]
  ): Promise<NotionScaffoldResult> {
    try {
      const res = await fetch("http://localhost:4983/api/notion/vault-sync/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, createdCount: 0, created: [], existingCount: 0, existing: [], error: data.error };
      return data;
    } catch (err: any) {
      return { success: false, createdCount: 0, created: [], existingCount: 0, existing: [], error: err.message };
    }
  }

  public async testNotionVaultConnection(
    token?: string,
    vaultPageId?: string
  ): Promise<{ success: boolean; message: string; subpagesCount?: number; subpages?: any[]; error?: string }> {
    try {
      const res = await fetch("http://localhost:4983/api/notion/vault-sync/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, vaultPageId })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.error || `HTTP ${res.status}`, error: data.error };
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || "Connection failed", error: err.message };
    }
  }
}

export interface NotionVaultSyncConfig {
  token: string;
  vaultPageId: string;
  vaultPageTitle: string;
  enabled: boolean;
  intervalSeconds: number;
  lastSyncTimestamp: number;
  syncedBlockIds: string[];
  lastStatus?: "idle" | "ok" | "warning" | "error";
  lastMessage?: string;
}

export interface NotionVaultSyncResult {
  success: boolean;
  syncedCount?: number;
  subpagesFound?: number;
  subpages?: Array<{
    subpageId: string;
    subpageTitle: string;
    matchedProject: string | null;
    totalBlocks: number;
    newItemsSynced: number;
  }>;
  message?: string;
  error?: string;
}

export interface NotionScaffoldResult {
  success: boolean;
  createdCount: number;
  created: Array<{ id: string; title: string; url?: string }>;
  existingCount: number;
  existing: Array<{ id: string; title: string }>;
  message?: string;
  error?: string;
}

export const platformHub = new PlatformHub();
