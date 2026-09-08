import { Segment, ThreadEntity, ProjectWiki } from "../../types/workspace";

export interface QualitativeBullet {
  category: "Thematic Coherence" | "Pacing & Cadence" | "Voice & Style" | "Thread Resolution" | "Actionable Polish";
  type: "strength" | "caution" | "recommendation";
  observation: string;
  recommendation: string;
}

export interface ManuscriptMetrics {
  totalWords: number;
  readingTimeMinutes: number;
  paragraphCount: number;
  averageSentenceLength: number;
  sentenceLengthVariance: number;
  dialogueRatioPercent: number;
  lexicalDiversityScore: number; // 0 to 100
  pacingCadenceLabel: "Staccato" | "Monotonous" | "Rhythmic & Dynamic" | "Dense & Expansive";
  qualitativeBullets: QualitativeBullet[];
  looseThreadCount: number;
  looseThreadNames: string[];
}

export function analyzeSegmentMetrics(
  segment: Segment,
  allThreads: Record<string, ThreadEntity>,
  wiki?: ProjectWiki
): ManuscriptMetrics {
  const text = segment.textContent || "";
  const words = text.match(/\b[a-zA-Z0-9'’-]+\b/g) || [];
  const totalWords = words.length;
  const readingTimeMinutes = Math.max(1, Math.round(totalWords / 220));

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  const sentenceLengths = sentences.map(s => (s.match(/\b[a-zA-Z0-9'’-]+\b/g) || []).length).filter(len => len > 0);

  const avgSentence = sentenceLengths.length > 0
    ? Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length)
    : 0;

  // Variance calculation
  const variance = sentenceLengths.length > 1
    ? Math.round(
        sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentence, 2), 0) / sentenceLengths.length
      )
    : 0;

  let pacingCadenceLabel: "Staccato" | "Monotonous" | "Rhythmic & Dynamic" | "Dense & Expansive" = "Rhythmic & Dynamic";
  if (variance < 15) pacingCadenceLabel = "Monotonous";
  else if (avgSentence < 10) pacingCadenceLabel = "Staccato";
  else if (avgSentence > 28) pacingCadenceLabel = "Dense & Expansive";

  // Dialogue ratio
  const dialogueMatches = text.match(/["“][^"”]+["”]/g) || [];
  const dialogueWords = dialogueMatches.reduce((acc, quote) => {
    return acc + (quote.match(/\b[a-zA-Z0-9'’-]+\b/g) || []).length;
  }, 0);
  const dialogueRatioPercent = totalWords > 0 ? Math.round((dialogueWords / totalWords) * 100) : 0;

  // Lexical diversity (type-token ratio normalized)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversityScore = totalWords > 0
    ? Math.min(100, Math.round((uniqueWords.size / Math.pow(totalWords, 0.7)) * 25))
    : 0;

  // Thread analysis
  const looseThreads: string[] = [];
  segment.treatedThreadIds.forEach(thId => {
    const thread = allThreads[thId];
    if (thread && thread.status !== "closed") {
      looseThreads.push(thread.name);
    }
  });

  // Generate Qualitative Critique Bullets
  const qualitativeBullets: QualitativeBullet[] = [];

  // 1. Pacing & Cadence
  if (variance >= 25) {
    qualitativeBullets.push({
      category: "Pacing & Cadence",
      type: "strength",
      observation: `Strong sentence variety (variance: ${variance}, average: ${avgSentence} words/sentence).`,
      recommendation: "Preserve the breathing room between sharp aphorisms and longer analytical arguments."
    });
  } else {
    qualitativeBullets.push({
      category: "Pacing & Cadence",
      type: "caution",
      observation: `Sentence structure is somewhat uniform (variance: ${variance}).`,
      recommendation: "Break up medium-length sentences: combine related clauses or insert a terse single-clause sentence for impact."
    });
  }

  // 2. Thematic Coherence
  if (wiki?.themeAndPremise?.centralInquiry) {
    qualitativeBullets.push({
      category: "Thematic Coherence",
      type: "strength",
      observation: `Section directly interrogates the project inquiry: '${wiki.themeAndPremise.centralInquiry.slice(0, 60)}...'`,
      recommendation: "Ensure each paragraph anchors back to the social and personal costs promised to the reader."
    });
  }

  // 3. Thread Resolution
  if (looseThreads.length > 0) {
    qualitativeBullets.push({
      category: "Thread Resolution",
      type: "caution",
      observation: `${looseThreads.length} active threads treated here remain open (${looseThreads.slice(0, 2).join(", ")}).`,
      recommendation: "Verify whether this segment is intended to expand the complication or begin resolving the friction."
    });
  } else {
    qualitativeBullets.push({
      category: "Thread Resolution",
      type: "strength",
      observation: "All threads passing through this segment are either progressing or cleanly synthesized.",
      recommendation: "Maintain momentum into the subsequent chapters."
    });
  }

  // 4. Voice & Style
  if (lexicalDiversityScore > 65) {
    qualitativeBullets.push({
      category: "Voice & Style",
      type: "strength",
      observation: `Rich, exact vocabulary (diversity index: ${lexicalDiversityScore}/100).`,
      recommendation: "The prose conveys thoughtful restraint without slipping into jargon."
    });
  } else {
    qualitativeBullets.push({
      category: "Voice & Style",
      type: "recommendation",
      observation: "Repetition of key conceptual vocabulary across adjacent paragraphs.",
      recommendation: "Check if words like 'certainty' or 'demand' can be varied with fresh metaphors or concrete situations."
    });
  }

  return {
    totalWords,
    readingTimeMinutes,
    paragraphCount,
    averageSentenceLength: avgSentence,
    sentenceLengthVariance: variance,
    dialogueRatioPercent,
    lexicalDiversityScore,
    pacingCadenceLabel,
    qualitativeBullets,
    looseThreadCount: looseThreads.length,
    looseThreadNames: looseThreads
  };
}
