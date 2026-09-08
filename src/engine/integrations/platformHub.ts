import { Project, Segment, ProjectWiki } from "../../types/workspace";

export type SupportedPlatform =
  | "substack"
  | "wattpad"
  | "notion"
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
  };
  deliveryStatus: "ready_to_send" | "exported" | "published";
  webhookEndpoint?: string;
}

export class PlatformHub {
  public formatForSubstack(project: Project, segment: Segment): PublishPackage {
    const title = segment.title;
    const subtitle = segment.synopsis;
    const body = `*By Bruno · Written with Writ*\n\n---\n\n${segment.textContent}\n\n---\n\n### The Takeaway\n\nIf we want wiser institutions and truer relationships, we have to change the incentives to favor curiosity over false certainty.\n\n*Subscribe for more longform essays and inquiries.*`;

    return {
      platform: "substack",
      title,
      subtitle,
      formattedBody: body,
      metadata: {
        tags: ["Essays", "Philosophy", "Culture", "Epistemology"],
        description: subtitle
      },
      deliveryStatus: "ready_to_send"
    };
  }

  public formatForWattpad(project: Project, segment: Segment): PublishPackage {
    const title = `${segment.romanNumeral}. ${segment.title}`;
    const body = `[b]${project.title}[/b]\n[i]Part ${segment.romanNumeral}: ${segment.title}[/i]\n\n${segment.textContent}\n\n---\n\n[center]✦ End of Chapter ✦\nVote and comment if you want the next chapter early![/center]`;

    return {
      platform: "wattpad",
      title,
      formattedBody: body,
      metadata: {
        tags: ["philosophical", "thoughtprovoking", "nonfiction", "literary"],
        description: segment.synopsis
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
        callout: { rich_text: [{ type: "text", text: { content: project.logline } }] }
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
      notionBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: seg.textContent } }] }
      });
    });

    return {
      platform: "notion",
      title: project.title,
      formattedBody: JSON.stringify(notionBlocks, null, 2),
      metadata: {
        notionBlocks
      },
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
    tex += `\\author{Bruno \\\\ \\small Writ Desktop Research Studio}\n`;
    tex += `\\date{\\today}\n\n`;
    tex += `\\begin{document}\n\n`;
    tex += `\\maketitle\n\n`;
    tex += `\\begin{abstract}\n${project.logline}\n\\end{abstract}\n\n`;

    segments.forEach(seg => {
      tex += `\\section{${seg.title}}\n`;
      tex += `\\label{sec:${seg.romanNumeral.toLowerCase()}}\n\n`;
      // Convert basic paragraph breaks to LaTeX paragraphs
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

  // Natural Language Prompt Automation: "Describe what you want"
  public synthesizeCustomPublishFormat(
    userPrompt: string,
    project: Project,
    segment: Segment,
    allSegments: Segment[],
    wiki: ProjectWiki
  ): PublishPackage {
    const promptLower = userPrompt.toLowerCase();

    if (promptLower.includes("substack") || promptLower.includes("newsletter")) {
      return this.formatForSubstack(project, segment);
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
    return this.formatForSubstack(project, segment);
  }
}

export const platformHub = new PlatformHub();
