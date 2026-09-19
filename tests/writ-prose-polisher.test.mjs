import test from "node:test";
import assert from "node:assert/strict";

// Import ProsePolisher directly from compiled/source TS via node loader or simple import
import { ProsePolisher } from "../src/engine/analysis/prosePolisher.ts";

test("1. Filler Word Stripping: removes English and Portuguese hesitations and vocal ticks", () => {
  const rawEnglish = "Ehh so basically um the problem was, you know, that we didn't have uh enough time.";
  const resultEn = ProsePolisher.polish(rawEnglish, { stripFillers: true });

  assert.ok(resultEn.removedFillersCount >= 3);
  assert.equal(resultEn.polished.includes("ehh"), false);
  assert.equal(resultEn.polished.includes("um"), false);
  assert.equal(resultEn.polished.includes("uh"), false);
  assert.equal(resultEn.polished.includes("you know"), false);
  assert.equal(resultEn.polished.includes("basically"), false);

  const rawPortuguese = "Ééé nós estávamos tipo assim tentando entender, né, como aquilo humm funcionava.";
  const resultPt = ProsePolisher.polish(rawPortuguese, { stripFillers: true });

  assert.ok(resultPt.removedFillersCount >= 2);
  assert.equal(resultPt.polished.includes("ééé"), false);
  assert.equal(resultPt.polished.includes("tipo assim"), false);
  assert.equal(resultPt.polished.includes("humm"), false);
});

test("2. Stutter De-duplication: eliminates repeated false starts and stuttered words", () => {
  const rawStutter = "We we wanted to go to the the station, but I I couldn't.";
  const result = ProsePolisher.polish(rawStutter, { deduplicateStutters: true });

  assert.equal(result.polished.includes("We we"), false);
  assert.equal(result.polished.includes("the the"), false);
  assert.equal(result.polished.includes("I I"), false);
  assert.ok(result.polished.includes("We wanted"));
  assert.ok(result.polished.includes("to the station"));
});

test("3. Sentence Boundary & Interrogative Punctuation Restoration: capitalizes and adds terminal marks", () => {
  // Unpunctuated statement
  const rawStatement = "the inquiry must begin where certainty ends";
  const res1 = ProsePolisher.polish(rawStatement, { restorePunctuation: true });
  assert.equal(res1.polished, "The inquiry must begin where certainty ends.");

  // English question structure
  const rawQuestionEn = "how did the committee arrive at this conclusion";
  const res2 = ProsePolisher.polish(rawQuestionEn, { restorePunctuation: true });
  assert.equal(res2.polished, "How did the committee arrive at this conclusion?");

  // Portuguese question structure
  const rawQuestionPt = "por que ninguém contestou os números apresentados";
  const res3 = ProsePolisher.polish(rawQuestionPt, { restorePunctuation: true });
  assert.equal(res3.polished, "Por que ninguém contestou os números apresentados?");
});

test("4. Introductory Clause Cadence: inserts commas after transitional clauses", () => {
  const rawText = "however the evidence told a completely different story. furthermore nobody questioned the results.";
  const result = ProsePolisher.polish(rawText, { restorePunctuation: true });

  assert.ok(result.polished.includes("However, the evidence"));
  assert.ok(result.polished.includes("Furthermore, nobody"));
});

test("5. Dialogue Quotation Formatting: detects attribution and formats spoken speech", () => {
  const rawDialogue = "We cannot afford another delay he said. She whispered that the vault was empty.";
  const result = ProsePolisher.polish(rawDialogue, { formatDialogue: true, mode: "fiction" });

  // Utterances should be enclosed in quotes
  assert.ok(result.polished.includes("“We cannot afford another delay,” he said."));
  assert.ok(result.polished.includes("She whispered, “The vault was empty.”"));
});

test("6. Multi-Paragraph Structuring: groups continuous dictation into balanced paragraphs", () => {
  const streamOfSentences = 
    "The first phase began in silence. " +
    "Nobody dared to raise their voice during the proceedings. " +
    "The archive was locked after hours. " +
    "A second investigator arrived at dawn. " +
    "He found the ledgers open on the wooden desk. " +
    "The ink was still fresh on the margins. " +
    "Outside the rain drummed steadily on the asphalt.";

  const result = ProsePolisher.polish(streamOfSentences, {
    paragraphBreaks: true,
    sentencesPerParagraph: 3
  });

  const paragraphs = result.polished.split("\n\n");
  assert.ok(paragraphs.length >= 2, `Expected at least 2 paragraphs, got ${paragraphs.length}`);
  assert.equal(result.paragraphsCount, paragraphs.length);
});

test("7. End-to-End Dictation Polish: transforms real-world messy dictation into literary prose", () => {
  const realDictation =
    "ehh so basically what McPhee demonstrated in his structural breakdowns, you know, " +
    "was that the keystone chapter holds the entire inquiry together. " +
    "um without that anchor the argument simply drifts into isolated fragments. " +
    "how can an author construct such a keystone without rigorous outline cards";

  const result = ProsePolisher.polish(realDictation, {
    mode: "literary",
    stripFillers: true,
    restorePunctuation: true
  });

  // Verify fillers are gone
  assert.equal(result.polished.includes("ehh"), false);
  assert.equal(/\bum\b/i.test(result.polished), false);
  assert.equal(result.polished.includes("you know"), false);
  assert.equal(result.polished.includes("basically"), false);

  // Verify proper capitalization
  assert.ok(result.polished.startsWith("What McPhee demonstrated"));

  // Verify terminal question mark
  assert.ok(result.polished.endsWith("cards?"));
});
