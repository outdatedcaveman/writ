/**
 * Autonomous Prose Dictation Polisher & Literary Normalizer
 * 
 * Transforms messy raw spoken dictation into professional literary prose:
 * - Strips verbal fillers ("ehh", "um", "uh", "you know", "like, like", "tipo assim")
 * - Deduplicates stuttered words and repeated phrases
 * - Restores punctuation, cadence, em-dashes, and capitalization
 * - Formats narrative dialogue with quotation marks and line breaks
 * - Groups sentences into balanced, aesthetically pleasing paragraphs
 */

export type PolishMode = "literary" | "fiction" | "academic" | "raw_clean";

export interface PolishOptions {
  mode?: PolishMode;
  stripFillers?: boolean;
  deduplicateStutters?: boolean;
  restorePunctuation?: boolean;
  formatDialogue?: boolean;
  paragraphBreaks?: boolean;
  emDashesForPauses?: boolean;
  sentencesPerParagraph?: number;
}

export const defaultPolishOptions: PolishOptions = {
  mode: "literary",
  stripFillers: true,
  deduplicateStutters: true,
  restorePunctuation: true,
  formatDialogue: true,
  paragraphBreaks: true,
  emDashesForPauses: true,
  sentencesPerParagraph: 3
};

export class ProsePolisher {
  // Multilingual verbal fillers pattern
  private static readonly FILLERS_PATTERN = [
    // English vocal hesitations
    "\\b(u+m+|u+h+|e+h+|e+r+|a+h+|h+m+m*)\\b",
    // English conversational fillers
    "\\b(you know what I mean|you know|so basically|sort of|kind of|basically|actually|I mean|as it were)\\b",
    // Repeated "like" fillers
    "\\b(like\\s*,?\\s*like)\\b",
    // Portuguese vocal hesitations
    "\\b(é{2,}|h+u+m+|h+ã+|ã{2,})\\b",
    // Portuguese conversational fillers
    "\\b(tipo assim|tipo\\s*,?\\s*tipo|sabe como é|então assim|né\\??)\\b"
  ].join("|");

  // Common stuttering word duplicates (e.g. "the the", "I I", "and and")
  private static readonly STUTTER_REGEX = /\b([a-zA-ZÀ-ÿ]+)(?:\s*,\s*|\s+)\1\b/gi;

  // Question structure starters (English & Portuguese)
  private static readonly QUESTION_STARTERS_EN = /^(who|what|where|when|why|how|is|are|was|were|do|does|did|can|could|would|should|will|haven't|hasn't|didn't|won't)\b/i;
  private static readonly QUESTION_STARTERS_PT = /^(quem|o que|onde|quando|por que|por quê|como|será que|qual|quais|quanto|quantos)\b/i;

  // Introductory transitional clauses that benefit from commas
  private static readonly INTRO_CLAUSES = [
    // English
    "However", "Furthermore", "Moreover", "Therefore", "In fact", "Naturally",
    "Of course", "Consequently", "Meanwhile", "At the same time", "First of all",
    "Indeed", "In contrast", "Nevertheless", "To begin with",
    // Portuguese
    "No entanto", "Além disso", "Portanto", "De fato", "Naturalmente",
    "Por conseguinte", "Enquanto isso", "Ao mesmo tempo", "Primeiramente",
    "Com efeito", "Em contrapartida", "Todavia"
  ];

  /**
   * Main polishing pipeline: cleans, punctuates, formats dialogue, and structures paragraphs.
   */
  public static polish(rawText: string, options: Partial<PolishOptions> = {}): {
    raw: string;
    polished: string;
    removedFillersCount: number;
    sentencesCount: number;
    paragraphsCount: number;
  } {
    if (!rawText || !rawText.trim()) {
      return { raw: "", polished: "", removedFillersCount: 0, sentencesCount: 0, paragraphsCount: 0 };
    }

    const opts: PolishOptions = { ...defaultPolishOptions, ...options };
    let text = rawText.trim();
    let removedFillers = 0;

    // 1. Strip vocal fillers and hesitations
    if (opts.stripFillers) {
      const fillerRegex = new RegExp(this.FILLERS_PATTERN, "gi");
      const matches = text.match(fillerRegex);
      if (matches) {
        removedFillers = matches.length;
      }
      text = text.replace(fillerRegex, "");
      // Clean isolated hesitation "like" (e.g. "it was , like , enormous")
      text = text.replace(/,\s*like\s*,/gi, ",");
      text = text.replace(/\s+,/g, ",");
    }

    // 2. De-duplicate stutter words
    if (opts.deduplicateStutters) {
      // Run twice to catch triple stutters like "the the the"
      text = text.replace(this.STUTTER_REGEX, "$1");
      text = text.replace(this.STUTTER_REGEX, "$1");
    }

    // 3. Normalize spacing & punctuation collisions
    text = text.replace(/\s+/g, " ");
    text = text.replace(/\s+([.,!?;:])/g, "$1");
    text = text.replace(/([.,!?;:])\1+/g, "$1"); // remove duplicated punctuation like ".." -> "."
    text = text.replace(/^[,;:\s]+/, "").trim(); // strip any orphaned leading punctuation or spaces

    // 4. Restore sentence boundaries & capitalization
    if (opts.restorePunctuation) {
      text = this.restoreSentenceCadence(text, opts);
    }

    // 5. Format dialogue if narrative mode
    if (opts.formatDialogue && (opts.mode === "fiction" || opts.mode === "literary")) {
      text = this.formatDialogueQuotes(text);
    }

    // 6. Structure into paragraphs
    let paragraphsCount = 1;
    let sentencesCount = 1;
    if (opts.paragraphBreaks) {
      const paragraphResult = this.structureParagraphs(text, opts.sentencesPerParagraph || 3);
      text = paragraphResult.text;
      paragraphsCount = paragraphResult.paragraphsCount;
      sentencesCount = paragraphResult.sentencesCount;
    }

    return {
      raw: rawText,
      polished: text.trim(),
      removedFillersCount: removedFillers,
      sentencesCount,
      paragraphsCount
    };
  }

  /**
   * Restores capitalization, cadence, commas, question marks, and em-dashes.
   */
  private static restoreSentenceCadence(text: string, opts: PolishOptions): string {
    // If user text has zero punctuation, synthesize natural sentence pauses
    let punctuated = text;

    // Convert long pause verbal markers into em-dashes if requested
    if (opts.emDashesForPauses) {
      punctuated = punctuated.replace(/\s+--\s+|\s+—\s+/g, " — ");
      punctuated = punctuated.replace(/\b(and then|so then)\b/gi, ", and then");
    }

    // Split text into approximate clauses / sentences
    // Matches existing period, exclamation, question mark, or long sentence breaks
    const rawSentences = punctuated
      .split(/(?<=[.?!])\s+/)
      .filter(s => s.trim().length > 0);

    const processedSentences: string[] = [];

    for (let sentence of rawSentences) {
      let s = sentence.trim();
      if (!s) continue;

      // Ensure first character is capitalized
      s = s.charAt(0).toUpperCase() + s.slice(1);

      // Add commas after introductory words
      for (const intro of this.INTRO_CLAUSES) {
        const introRegex = new RegExp(`^(${intro})\\s+(?![,—])`, "i");
        if (introRegex.test(s)) {
          s = s.replace(introRegex, "$1, ");
          break;
        }
      }

      // Check if sentence structure indicates a question
      const hasTerminalPunctuation = /[.?!]$/.test(s);
      if (!hasTerminalPunctuation) {
        const isQuestion = this.QUESTION_STARTERS_EN.test(s) || this.QUESTION_STARTERS_PT.test(s);
        s += isQuestion ? "?" : ".";
      }

      processedSentences.push(s);
    }

    return processedSentences.join(" ");
  }

  /**
   * Detects dialogue attribution verbs and wraps spoken utterances in quotes.
   */
  private static formatDialogueQuotes(text: string): string {
    let formatted = text;

    // Pattern for speech attribution (e.g. He said, "...", or "...", she whispered)
    const attributionPattern = /\b(he said|she said|I said|they said|he asked|she asked|I asked|they asked|he replied|she replied|he whispered|she whispered|disse ele|disse ela|perguntou ele|perguntou ela|respondeu ele|respondeu ela)\b/i;

    // Look for lines that contain dialogue markers and format with quotes if not already quoted
    const sentences = formatted.split(/(?<=[.?!])\s+/);
    const result: string[] = [];

    for (let s of sentences) {
      s = s.trim();
      if (!s) continue;

      if (!s.includes('"') && !s.includes('“') && !s.includes('—')) {
        const match = s.match(attributionPattern);
        if (match && match.index !== undefined) {
          // If attribution is at start: "He said, that we should go"
          if (match.index === 0) {
            let afterAttribution = s.slice(match[0].length).replace(/^[,:\s]+/, "");
            afterAttribution = afterAttribution.replace(/^that\s+/i, "");
            if (afterAttribution) {
              const capAfter = afterAttribution.charAt(0).toUpperCase() + afterAttribution.slice(1);
              s = `${match[0]}, “${capAfter.replace(/[.?!]$/, "")}.”`;
            }
          } else {
            // Attribution is at end: "We should go, he said."
            const beforeAttribution = s.slice(0, match.index).replace(/[,:\s]+$/, "");
            const afterAttribution = s.slice(match.index);
            s = `“${beforeAttribution},” ${afterAttribution}`;
          }
        }
      }

      result.push(s);
    }

    return result.join(" ");
  }

  /**
   * Clusters sentences into readable paragraphs.
   */
  private static structureParagraphs(text: string, sentencesPerParagraph: number = 3): {
    text: string;
    paragraphsCount: number;
    sentencesCount: number;
  } {
    const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
    if (sentences.length <= sentencesPerParagraph) {
      return {
        text,
        paragraphsCount: 1,
        sentencesCount: sentences.length
      };
    }

    const paragraphs: string[] = [];
    let currentBatch: string[] = [];

    sentences.forEach((s, idx) => {
      currentBatch.push(s);

      // If sentence ends a dialogue or reaches batch limit, start a new paragraph
      const isDialogueTurn = s.startsWith("“") || s.startsWith('"');
      const nextSentenceIsDialogue = idx + 1 < sentences.length && (sentences[idx + 1].startsWith("“") || sentences[idx + 1].startsWith('"'));

      if (
        currentBatch.length >= sentencesPerParagraph ||
        isDialogueTurn ||
        nextSentenceIsDialogue
      ) {
        paragraphs.push(currentBatch.join(" "));
        currentBatch = [];
      }
    });

    if (currentBatch.length > 0) {
      paragraphs.push(currentBatch.join(" "));
    }

    return {
      text: paragraphs.join("\n\n"),
      paragraphsCount: paragraphs.length,
      sentencesCount: sentences.length
    };
  }

  /**
   * AI Literary Polisher: Prompts local Ollama or configured AI provider
   * to provide full stylistic cadence and vocabulary refinement.
   */
  public static async polishWithAI(
    rawText: string,
    mode: PolishMode = "literary",
    aiConfig?: { provider?: string; apiKey?: string; baseUrl?: string; model?: string }
  ): Promise<string> {
    // First run the deterministic polisher to remove all basic noise
    const baseCleaned = this.polish(rawText, { mode }).polished;

    // If local Ollama or AI provider is available, refine further
    try {
      const baseUrl = aiConfig?.baseUrl || "http://127.0.0.1:11434";
      const model = aiConfig?.model || "llama3";

      const systemPrompt =
        "You are an expert literary prose editor. Clean up this transcribed spoken voice recording. " +
        "Eliminate any remaining verbal clutter, sharpen sentence cadence and rhythm, fix punctuation, " +
        "format dialogue naturally, and preserve the author's original message, nuances, and vocabulary. " +
        "Return ONLY the polished prose without meta-commentary.";

      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `${systemPrompt}\n\n[RAW TRANSCRIPTION]:\n${baseCleaned}\n\n[POLISHED PROSE]:`,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response && data.response.trim().length > 0) {
          return data.response.trim();
        }
      }
    } catch {
      // Fallback cleanly to deterministic polished text if AI daemon is offline
    }

    return baseCleaned;
  }
}
