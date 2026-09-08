import {
  ProjectVaultItem,
  VaultPlacementSuggestion,
  Segment,
  ProjectWiki,
  ThreadEntity,
  Project
} from "../../types/workspace";

export function analyzeAndSuggestPlacement(
  item: Omit<ProjectVaultItem, "placementSuggestion" | "status">,
  project: Project,
  segments: Segment[],
  wiki: ProjectWiki,
  threads: Record<string, ThreadEntity>
): VaultPlacementSuggestion {
  const contentLower = item.content.toLowerCase();
  const activeSegments = segments.filter(s => !s.isArchived).sort((a, b) => a.order - b.order);

  // Check matching against arguments / evidence
  const matchingArg = wiki.arguments.find(arg => {
    return contentLower.includes("institution") ||
           contentLower.includes("system") ||
           contentLower.includes("meeting") ||
           contentLower.includes("corporate") ||
           contentLower.includes("cost");
  });

  // Check matching against characters
  const matchingChar = wiki.characters.find(char => {
    return contentLower.includes(char.name.toLowerCase()) ||
           (char.role === "foil" && (contentLower.includes("steward") || contentLower.includes("technocrat") || contentLower.includes("bureaucrat")));
  });

  // Check matching against segments
  let targetSeg = activeSegments[0];
  let rationale = "Serves as an introductory provocation or contextual grounding.";
  let confidenceScore = 80;

  if (contentLower.includes("bus") || contentLower.includes("weather") || contentLower.includes("ordinary") || contentLower.includes("personal") || contentLower.includes("fear")) {
    targetSeg = activeSegments.find(s => s.order === 3) || activeSegments[activeSegments.length - 1];
    rationale = `Matches Section ${targetSeg.romanNumeral}'s focus on the personal and human dimension of certainty, providing concrete grounded texture.`;
    confidenceScore = 92;
  } else if (contentLower.includes("meeting") || contentLower.includes("headline") || contentLower.includes("corporate") || contentLower.includes("forecast") || contentLower.includes("incentive")) {
    targetSeg = activeSegments.find(s => s.order === 2) || activeSegments[1];
    rationale = `Complements Section ${targetSeg.romanNumeral}'s inquiry into institutional incentives and bureaucratic predictability.`;
    confidenceScore = 94;
  } else if (contentLower.includes("living") || contentLower.includes("hospitality") || contentLower.includes("room") || contentLower.includes("future") || contentLower.includes("direction")) {
    targetSeg = activeSegments[activeSegments.length - 1];
    rationale = `Belongs in the concluding resolution (Section ${targetSeg.romanNumeral}) to balance critique with a livable, constructive alternative posture.`;
    confidenceScore = 95;
  }

  // Synthesize integrated text passage
  let suggestedText = "";
  if (item.type === "image") {
    suggestedText = `[Visual Reference: ${item.title} — ${item.content.slice(0, 100)}]`;
  } else {
    suggestedText = `Consider, for instance, ${item.content.replace(/\n+/g, " ").trim()}`;
  }

  // If matched a character foil
  if (matchingChar && (contentLower.includes("character") || contentLower.includes("foil") || contentLower.includes("dialogue"))) {
    return {
      targetType: "wiki_character",
      targetId: matchingChar.id,
      targetTitle: `Character: ${matchingChar.name}`,
      rationale: `Enriches ${matchingChar.name}'s behavioral motivation and distinctive dialogue register.`,
      suggestedTextToIntegrate: item.content,
      confidenceScore: 88
    };
  }

  return {
    targetType: "segment",
    targetId: targetSeg.id,
    targetTitle: `Section ${targetSeg.romanNumeral}: ${targetSeg.title}`,
    rationale,
    suggestedTextToIntegrate: suggestedText,
    confidenceScore
  };
}

export function extractInsightsFromDrop(content: string, type: string): string[] {
  const insights: string[] = [];
  const words = content.toLowerCase();

  if (words.includes("certainty") || words.includes("doubt")) insights.push("Epistemic Posture");
  if (words.includes("institution") || words.includes("work") || words.includes("corporate")) insights.push("Institutional Friction");
  if (words.includes("fear") || words.includes("relief") || words.includes("personal")) insights.push("Psychological Dimension");
  if (words.includes("hospitality") || words.includes("other") || words.includes("open")) insights.push("Ethical Practice");
  if (type === "image") insights.push("Visual Texture / Tone Reference");
  if (type === "video") insights.push("Dynamic Media Anchor");

  if (insights.length === 0) {
    insights.push("Conceptual Raw Scrap", "Exploratory Thought");
  }

  return insights;
}
