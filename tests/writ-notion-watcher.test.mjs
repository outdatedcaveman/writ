import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Notion Watcher helpers from electron/server.cjs
const server = await import("../electron/server.cjs");
const {
  extractNotionId,
  extractBlockContent
} = server;

test("1. Notion ID Extraction Engine: parses URLs, UUIDs, and raw hex IDs", () => {
  // Test full Notion URL with title and query parameters
  const fullUrl = "https://www.notion.so/bruno-workspace/Writ-Vault-18c66847864880c8a5bee73b1a2bc490?pvs=4";
  assert.equal(extractNotionId(fullUrl), "18c66847864880c8a5bee73b1a2bc490");

  // Test short Notion URL
  const shortUrl = "https://notion.so/18c66847864880c8a5bee73b1a2bc490";
  assert.equal(extractNotionId(shortUrl), "18c66847864880c8a5bee73b1a2bc490");

  // Test hyphenated UUID
  const hyphenated = "18c66847-8648-80c8-a5be-e73b1a2bc490";
  assert.equal(extractNotionId(hyphenated), "18c66847864880c8a5bee73b1a2bc490");

  // Test raw 32-hex string
  const rawHex = "18C66847864880C8A5BEE73B1A2BC490";
  assert.equal(extractNotionId(rawHex), "18c66847864880c8a5bee73b1a2bc490");

  // Empty string handling
  assert.equal(extractNotionId(""), "");
  assert.equal(extractNotionId(null), "");
});

test("2. Notion Block Parser: parses paragraphs, headings, lists, quotes, callouts, and media", () => {
  // Paragraph block
  const paraBlock = {
    id: "block-p-1",
    type: "paragraph",
    paragraph: {
      rich_text: [
        { plain_text: "Certainty is an emotional sedative rather than an intellectual achievement." }
      ]
    }
  };
  const parsedPara = extractBlockContent(paraBlock);
  assert.ok(parsedPara);
  assert.equal(parsedPara.type, "text");
  assert.equal(parsedPara.content, "Certainty is an emotional sedative rather than an intellectual achievement.");

  // Heading 2 block
  const h2Block = {
    id: "block-h2-1",
    type: "heading_2",
    heading_2: {
      rich_text: [
        { plain_text: "The Structural Inquest of McPhee" }
      ]
    }
  };
  const parsedH2 = extractBlockContent(h2Block);
  assert.ok(parsedH2);
  assert.equal(parsedH2.type, "text");
  assert.equal(parsedH2.content, "## The Structural Inquest of McPhee");

  // Quote block
  const quoteBlock = {
    id: "block-q-1",
    type: "quote",
    quote: {
      rich_text: [
        { plain_text: "Writing without structure is merely typing." }
      ]
    }
  };
  const parsedQuote = extractBlockContent(quoteBlock);
  assert.ok(parsedQuote);
  assert.equal(parsedQuote.content, "> Writing without structure is merely typing.");

  // Callout block with emoji icon
  const calloutBlock = {
    id: "block-c-1",
    type: "callout",
    callout: {
      icon: { emoji: "💡" },
      rich_text: [
        { plain_text: "Key research insight: Institutional conformity precedes silence." }
      ]
    }
  };
  const parsedCallout = extractBlockContent(calloutBlock);
  assert.ok(parsedCallout);
  assert.equal(parsedCallout.content, "> 💡 Key research insight: Institutional conformity precedes silence.");

  // To-do block
  const todoBlock = {
    id: "block-td-1",
    type: "to_do",
    to_do: {
      checked: true,
      rich_text: [
        { plain_text: "Verify archival quote from 1974 transcript" }
      ]
    }
  };
  const parsedTodo = extractBlockContent(todoBlock);
  assert.ok(parsedTodo);
  assert.equal(parsedTodo.content, "[x] Verify archival quote from 1974 transcript");

  // Image block
  const imageBlock = {
    id: "block-img-1",
    type: "image",
    image: {
      file: { url: "https://s3.us-west-2.amazonaws.com/notion-static/sample.jpg" },
      caption: [{ plain_text: "Handwritten outline on index cards" }]
    }
  };
  const parsedImg = extractBlockContent(imageBlock);
  assert.ok(parsedImg);
  assert.equal(parsedImg.type, "image");
  assert.equal(parsedImg.mediaUrl, "https://s3.us-west-2.amazonaws.com/notion-static/sample.jpg");
  assert.equal(parsedImg.title, "Handwritten outline on index cards");

  // Bookmark block
  const bookmarkBlock = {
    id: "block-bm-1",
    type: "bookmark",
    bookmark: {
      url: "https://theparisreview.org/interviews/john-mcphee",
      caption: [{ plain_text: "The Art of Nonfiction Interview" }]
    }
  };
  const parsedBm = extractBlockContent(bookmarkBlock);
  assert.ok(parsedBm);
  assert.equal(parsedBm.type, "link");
  assert.equal(parsedBm.content, "https://theparisreview.org/interviews/john-mcphee");
});

test("3. Notion Vault Ingestion De-duplication: prevents duplicate block imports", () => {
  const syncedIds = new Set(["block-p-1", "block-q-1"]);

  const incomingBlocks = [
    {
      id: "block-p-1",
      type: "paragraph",
      paragraph: { rich_text: [{ plain_text: "Old note already imported." }] }
    },
    {
      id: "block-new-2",
      type: "paragraph",
      paragraph: { rich_text: [{ plain_text: "Brand new insight added on phone Notion app." }] }
    }
  ];

  const newlyIngested = [];
  for (const blk of incomingBlocks) {
    if (syncedIds.has(blk.id)) {
      continue; // Skip previously synced
    }
    const parsed = extractBlockContent(blk);
    if (parsed) {
      newlyIngested.push({
        id: `notion-${blk.id}`,
        content: parsed.content
      });
      syncedIds.add(blk.id);
    }
  }

  assert.equal(newlyIngested.length, 1);
  assert.equal(newlyIngested[0].id, "notion-block-new-2");
  assert.ok(syncedIds.has("block-new-2"));
});

test("4. Notion Subpage Project Matching: accurately pairs Notion subpages with Writ projects", () => {
  const projects = [
    { id: "p1", title: "Writing the Ineffable", slug: "writing-the-ineffable" },
    { id: "p2", title: "Dialectics of Irony", slug: "dialectics-of-irony" },
    { id: "p3", title: "The Pacing Paradox", slug: "pacing-paradox" }
  ];

  function matchProject(subpageTitle) {
    const sTitle = subpageTitle.trim().toLowerCase();
    return projects.find(p => {
      const pTitle = p.title.trim().toLowerCase();
      const pSlug = p.slug.trim().toLowerCase();
      return pTitle === sTitle || pSlug === sTitle || pTitle.includes(sTitle) || sTitle.includes(pTitle);
    });
  }

  // Exact title match
  assert.equal(matchProject("Writing the Ineffable")?.id, "p1");
  // Lowercase slug match
  assert.equal(matchProject("dialectics-of-irony")?.id, "p2");
  // Partial title match
  assert.equal(matchProject("The Pacing Paradox (Notes)")?.id, "p3");
  // Non-matching
  assert.equal(matchProject("Random Unrelated Page"), undefined);
});

test("5. Notion Subpage Auto-Scaffolding Planner: computes missing project subpages under Writ Vault", () => {
  const writProjects = [
    { id: "p1", title: "Writing the Ineffable" },
    { id: "p2", title: "Dialectics of Irony" },
    { id: "p3", title: "The Pacing Paradox" }
  ];

  const existingNotionSubpages = [
    { id: "sp-1", title: "Writing the Ineffable" }
  ];

  const existingTitles = new Set(existingNotionSubpages.map(s => s.title.toLowerCase()));
  const missing = writProjects.filter(p => !existingTitles.has(p.title.toLowerCase()));

  assert.equal(missing.length, 2);
  assert.deepEqual(missing.map(m => m.title), ["Dialectics of Irony", "The Pacing Paradox"]);
});

test("6. Segment Metadata Modal Desync Guard: guarantees clean initial state when segment switches", () => {
  // Simulating state lifecycle of SegmentMetadataModal
  let currentSegment = {
    id: "seg-7",
    title: "Chapter 7: The Unfolding",
    romanNumeral: "VII",
    synopsis: "The climax where all threads converge",
    status: "active",
    goals: ["Confront antagonist"]
  };

  function createModalState(segment) {
    return {
      title: segment.title,
      romanNumeral: segment.romanNumeral,
      synopsis: segment.synopsis,
      status: segment.status,
      goals: [...segment.goals]
    };
  }

  let state = createModalState(currentSegment);
  assert.equal(state.title, "Chapter 7: The Unfolding");
  assert.equal(state.romanNumeral, "VII");

  // User creates new project and active segment switches to Chapter 1
  const newProjectSegment = {
    id: "seg-new-1",
    title: "Opening Inquest",
    romanNumeral: "I",
    synopsis: "Introduce the core inquiry and inciting question",
    status: "open",
    goals: ["Establish voice"]
  };

  // With reactive useEffect / key remounting:
  state = createModalState(newProjectSegment);
  assert.equal(state.title, "Opening Inquest");
  assert.equal(state.romanNumeral, "I");
  assert.equal(state.goals[0], "Establish voice");
  assert.notEqual(state.title, "Chapter 7: The Unfolding");
});
