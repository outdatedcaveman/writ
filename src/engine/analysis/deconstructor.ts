import {
  Segment,
  CharacterEntity,
  ArgumentEntity,
  PlotPointEntity,
  ThreadEntity,
  ProjectWiki
} from "../../types/workspace";

export interface DeconstructionResult {
  segments: Segment[];
  characters: CharacterEntity[];
  arguments: ArgumentEntity[];
  plotPoints: PlotPointEntity[];
  threads: ThreadEntity[];
  detectedGenre: "fiction" | "essay" | "philosophy" | "journalism";
  suggestedTitle: string;
  logline: string;
  centralInquiry: string;
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function deconstructManuscript(rawText: string, draftId: string, projectId: string): DeconstructionResult {
  const clean = rawText.trim();
  if (!clean) {
    throw new Error("Draft text cannot be empty.");
  }

  // 1. Detect natural section splits
  // Regex looks for "Chapter X", "Section X", "Act X", "# ...", Roman numerals "I. ...", or double newlines with header-like markers
  const sectionSplitRegex = /(?:^|\n\n+)(?=(?:(?:Chapter|Section|Act|Part)\s+[0-9IVXLCDM]+|[IVXLCDM]+\.|\#{1,3}\s+))/i;
  let rawSections = clean.split(sectionSplitRegex).map(s => s.trim()).filter(Boolean);

  // If no explicit chapter headers exist, split by paragraph blocks (e.g. groups of 3-4 paragraphs)
  if (rawSections.length <= 1) {
    const paragraphs = clean.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length >= 4) {
      rawSections = [];
      const groupSize = Math.max(2, Math.ceil(paragraphs.length / 4));
      for (let i = 0; i < paragraphs.length; i += groupSize) {
        rawSections.push(paragraphs.slice(i, i + groupSize).join("\n\n"));
      }
    } else {
      rawSections = [clean];
    }
  }

  // Detect whether fiction or non-fiction based on dialogue indicators and argumentative words
  const dialogueQuoteCount = (clean.match(/["“][^"”]+["”]/g) || []).length;
  const argumentWordCount = (clean.match(/\b(therefore|because|premise|argument|evidence|institution|systemic|epistemic|inquiry|consequence|furthermore)\b/gi) || []).length;
  const isFiction = dialogueQuoteCount > 8 && dialogueQuoteCount > argumentWordCount;
  const detectedGenre = isFiction ? "fiction" : "essay";

  // Build Segments
  const segments: Segment[] = [];
  const extractedCharacters: CharacterEntity[] = [];
  const extractedArguments: ArgumentEntity[] = [];
  const extractedPlotPoints: PlotPointEntity[] = [];
  const extractedThreads: ThreadEntity[] = [];

  // Default master thread
  const mainThreadId = `th-main-${Date.now().toString(36)}`;
  extractedThreads.push({
    id: mainThreadId,
    projectId,
    name: isFiction ? "Central Dramatic Arc" : "Core Philosophical Inquiry",
    category: "main_plot",
    description: isFiction ? "The protagonist's main pursuit and obstacle resolution." : "The progressive development and proof of the central thesis.",
    status: "developing",
    appearances: []
  });

  const subThreadId = `th-sub-${Date.now().toString(36)}`;
  extractedThreads.push({
    id: subThreadId,
    projectId,
    name: isFiction ? "Interpersonal Friction" : "Practical & Institutional Consequences",
    category: isFiction ? "subplot" : "argument",
    description: isFiction ? "The secondary tension testing character relationships." : "The real-world costs and behavioral compromises.",
    status: "open",
    appearances: []
  });

  rawSections.forEach((sectionContent, index) => {
    const segId = `seg-${Date.now().toString(36)}-${index + 1}`;
    const roman = ROMAN_NUMERALS[index] || `${index + 1}`;

    // Extract title
    const firstLine = sectionContent.split("\n")[0].replace(/^[#\s\dIVXLCDM.:\-]+/, "").trim();
    const title = firstLine.length > 5 && firstLine.length < 60
      ? firstLine
      : isFiction
      ? `Scene ${roman}: The Complication`
      : `Section ${roman}: The Unfolding Inquiry`;

    // Extract synopsis from first paragraph
    const paragraphs = sectionContent.split(/\n\s*\n/).filter(Boolean);
    const synopsis = paragraphs[0] ? (paragraphs[0].slice(0, 180) + (paragraphs[0].length > 180 ? "..." : "")) : "Exploration of the core theme.";

    // Goals based on position
    const goals: string[] = [];
    if (index === 0) {
      goals.push("Establish the core posture and premise", "Engage reader with an immediate friction or tension");
    } else if (index === rawSections.length - 1) {
      goals.push("Deliver resolution / synthesis", "Leave reader with actionable clarity or emotional resonance");
    } else {
      goals.push("Deepen the central conflict / critique", "Demonstrate concrete practical stakes");
    }

    // Link thread appearances
    extractedThreads[0].appearances.push({
      segmentId: segId,
      beatDescription: `Moves the central arc forward in Section ${roman}`,
      resolutionState: index === rawSections.length - 1 ? "resolved" : index === 0 ? "introduced" : "developed"
    });

    if (index > 0) {
      extractedThreads[1].appearances.push({
        segmentId: segId,
        beatDescription: `Develops friction in Section ${roman}`,
        resolutionState: index === rawSections.length - 1 ? "resolved" : "developed"
      });
    }

    // Create Plot Point
    const beatType = index === 0 ? "catalyst" : index === rawSections.length - 1 ? "resolution" : index === Math.floor(rawSections.length / 2) ? "midpoint" : "argument_advance";
    extractedPlotPoints.push({
      id: `pp-${Date.now().toString(36)}-${index}`,
      title: `${title} (Beat)`,
      act: index === 0 ? "Act I" : index === rawSections.length - 1 ? "Act III" : "Act II-A",
      beatType: beatType as any,
      description: synopsis,
      targetSegmentId: segId,
      order: index + 1
    });

    segments.push({
      id: segId,
      draftId,
      title,
      romanNumeral: roman,
      order: index + 1,
      synopsis,
      goals,
      treatedThreadIds: index > 0 ? [mainThreadId, subThreadId] : [mainThreadId],
      characterIds: isFiction ? ["char-protagonist"] : ["char-voice"],
      textContent: sectionContent,
      status: index === 0 ? "done" : index === 1 ? "active" : "open"
    });
  });

  // Characters or Voice entities
  if (isFiction) {
    extractedCharacters.push(
      {
        id: "char-protagonist",
        name: "Protagonist",
        role: "protagonist",
        description: "The primary point-of-view driving the dramatic movement.",
        motivation: "To resolve an unresolved tension or overcome a pivotal threshold.",
        arc: "Shifts from reactive survival to conscious moral choice.",
        relationships: []
      },
      {
        id: "char-foil",
        name: "Antagonist / Foil",
        role: "foil",
        description: "The counter-force embodying opposing values.",
        motivation: "Preservation of current order and status quo.",
        arc: "Unbending certainty that exposes cracks under pressure.",
        relationships: [
          { targetId: "char-protagonist", relationType: "opposing", tensionLevel: 8 }
        ]
      }
    );
  } else {
    extractedCharacters.push(
      {
        id: "char-voice",
        name: "The Inquiring Voice",
        role: "protagonist",
        description: "The disciplined philosophical observer exploring the nuances of the inquiry.",
        motivation: "To unmask unexamined assumptions and seek intellectual honesty.",
        arc: "Moves from diagnosing symptoms to articulating a sustainable ethos.",
        relationships: []
      },
      {
        id: "char-consensus",
        name: "The Conventional Wisdom",
        role: "foil",
        description: "The institutional archetype demanding quick, unreflective certainty.",
        motivation: "Procedural comfort and short-term certainty production.",
        arc: "Static counterpoint against which the thesis is tested.",
        relationships: [
          { targetId: "char-voice", relationType: "opposing", tensionLevel: 7 }
        ]
      }
    );

    extractedArguments.push(
      {
        id: `arg-1-${Date.now().toString(36)}`,
        claim: "Surface clarity often conceals systemic fragility.",
        premise: "Premature definitive statements reduce perceived risk while creating unaddressed debt.",
        evidence: "Social and institutional behaviors observed in the text.",
        counterpoints: "Action often requires decisive commitment even under incomplete knowledge.",
        targetSegmentIds: segments.slice(0, 2).map(s => s.id)
      }
    );
  }

  // Derive suggested title & logline
  const firstParagraph = rawSections[0].split("\n")[0];
  const suggestedTitle = firstParagraph.length > 5 && firstParagraph.length < 50
    ? firstParagraph
    : isFiction ? "The Unfolding Canvas" : "The Architecture of Inquiry";

  const logline = clean.slice(0, 200).replace(/\n+/g, " ") + "...";
  const centralInquiry = isFiction
    ? "How does the pressure of conflicting loyalties reveal the true nature of the characters?"
    : "What are the hidden costs of our unquestioned assumptions, and how can we live more honestly?";

  return {
    segments,
    characters: extractedCharacters,
    arguments: extractedArguments,
    plotPoints: extractedPlotPoints,
    threads: extractedThreads,
    detectedGenre,
    suggestedTitle,
    logline,
    centralInquiry
  };
}
