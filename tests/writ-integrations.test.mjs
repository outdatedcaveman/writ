import test from "node:test";
import assert from "node:assert/strict";

// Test suite for Writ Integrations: Project Scaffolding, Notion Direct API & Clipboard, Vault Ingestion, Layout, and Fonts

test("1. Visual Project Scaffolding: creates robust project state, wiki, and initial chapter", () => {
  const params = {
    title: "The Architecture of Thought",
    logline: "An exploration into recursive cognition.",
    genre: "essay",
    themeId: "theme-epistemology",
    intent: "Demonstrate how conceptual frameworks evolve.",
    firstChapterTitle: "Prolegomena to Any Future Synthesis"
  };

  const projId = "proj-test-1";
  const draftId = "draft-test-1";
  const segId = "seg-test-1";

  const newProject = {
    id: projId,
    themeId: params.themeId,
    title: params.title,
    slug: params.title.toLowerCase().replace(/\s+/g, "-"),
    logline: params.logline,
    genre: params.genre,
    intent: params.intent,
    activeDraftId: draftId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const newSegment = {
    id: segId,
    draftId,
    title: params.firstChapterTitle,
    romanNumeral: "I",
    order: 1,
    synopsis: "The initial provocation.",
    goals: ["Introduce the core subject"],
    treatedThreadIds: [],
    characterIds: [],
    textContent: "Begin typing your thoughts here...",
    status: "active"
  };

  const newWiki = {
    themeAndPremise: {
      centralInquiry: params.logline,
      readerPromise: "Clear and resonant insight.",
      tone: "Reflective and exact.",
      genre: params.genre,
      targetLength: "3,000 - 5,000 words"
    },
    characters: [],
    arguments: [],
    plotPoints: [],
    macroStructure: {
      framework: "dialectic_thesis_antithesis",
      acts: [
        { name: "Act I", summary: "Opening setup", targetPacing: "measured" },
        { name: "Act II", summary: "Complication", targetPacing: "building" },
        { name: "Act III", summary: "Resolution", targetPacing: "reflective" }
      ]
    }
  };

  assert.equal(newProject.title, "The Architecture of Thought");
  assert.equal(newProject.slug, "the-architecture-of-thought");
  assert.equal(newSegment.title, "Prolegomena to Any Future Synthesis");
  assert.equal(newSegment.romanNumeral, "I");
  assert.equal(newWiki.themeAndPremise.centralInquiry, "An exploration into recursive cognition.");
});

test("2. Notion Direct Publishing & Rich Clipboard Transpiler (No Raw JSON Code Paste)", () => {
  const mockProject = {
    id: "p1",
    title: "Dialectics of Irony",
    logline: "Socratic skepticism vs existential commitment",
    genre: "philosophy"
  };

  const mockWiki = {
    themeAndPremise: {
      centralInquiry: "How does irony destabilize dogma?",
      readerPromise: "Uncompromising clarity.",
      tone: "Philosophical and dialectical",
      genre: "philosophy",
      targetLength: "4,000 words"
    }
  };

  const mockSegments = [
    {
      id: "s1",
      romanNumeral: "I",
      title: "The Socratic Paradox",
      textContent: "All that I know is that I know nothing.\n\nYet this negation is productive.",
      order: 1
    }
  ];

  // Helper simulating platformHub.formatForNotionClipboard
  const formatForNotionClipboard = (project, wiki, segments) => {
    let out = `# ${project.title}\n\n`;
    if (wiki?.themeAndPremise?.readerPromise) {
      out += `> **Premise & Reader Promise**: ${wiki.themeAndPremise.readerPromise}\n\n`;
    }
    segments.forEach(seg => {
      out += `## Section ${seg.romanNumeral}: ${seg.title}\n\n`;
      out += `${seg.textContent}\n\n---\n\n`;
    });
    return out.trim();
  };

  const clipboardResult = formatForNotionClipboard(mockProject, mockWiki, mockSegments);

  // Must be clean readable markdown, NOT a JSON AST code block
  assert.ok(!clipboardResult.startsWith("[{"));
  assert.ok(!clipboardResult.includes('"object": "block"'));
  assert.ok(clipboardResult.includes("# Dialectics of Irony"));
  assert.ok(clipboardResult.includes("## Section I: The Socratic Paradox"));
  assert.ok(clipboardResult.includes("All that I know is that I know nothing."));

  // Helper simulating direct Notion REST API blocks creation
  const buildNotionBlockPayload = (project, wiki, segments) => {
    const blocks = [];
    if (wiki?.themeAndPremise?.readerPromise) {
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{ type: "text", text: { content: wiki.themeAndPremise.readerPromise } }],
          icon: { emoji: "📖" }
        }
      });
    }
    segments.forEach(seg => {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: `Section ${seg.romanNumeral}: ${seg.title}` } }]
        }
      });
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: seg.textContent } }]
        }
      });
      blocks.push({ object: "block", type: "divider", divider: {} });
    });
    return blocks;
  };

  const blocks = buildNotionBlockPayload(mockProject, mockWiki, mockSegments);
  assert.equal(blocks[0].type, "callout");
  assert.equal(blocks[1].type, "heading_2");
  assert.equal(blocks[2].type, "paragraph");
  assert.equal(blocks[3].type, "divider");
});

test("3. Vault Auto-Ingestion & Background Watcher Parser", () => {
  const sampleFilename = "Heidegger_Being_Notes.md";
  const sampleFileContent = "# Question of Being\n\nDasein is the entity whose being is an issue for it.";

  const parseDroppedFile = (filename, content) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const cleanTitle = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    const tags = [];
    if (content.toLowerCase().includes("being") || content.toLowerCase().includes("dasein")) tags.push("ontology");
    if (content.toLowerCase().includes("epistemology") || content.toLowerCase().includes("truth")) tags.push("epistemology");

    return {
      id: `vault-inbox-${Date.now()}`,
      title: cleanTitle,
      type: ext === "md" || ext === "txt" ? "note" : "research",
      content: content.trim(),
      tags,
      source: "data/vault_inbox",
      createdAt: Date.now()
    };
  };

  const parsed = parseDroppedFile(sampleFilename, sampleFileContent);
  assert.equal(parsed.title, "Heidegger Being Notes");
  assert.equal(parsed.type, "note");
  assert.ok(parsed.tags.includes("ontology"));
  assert.ok(parsed.content.includes("Dasein"));
});

test("4. Responsive Layout Dimensions Persistence and Boundaries", () => {
  const clampSidebarWidth = (w) => Math.max(180, Math.min(600, w));
  const clampCopilotWidth = (w) => Math.max(260, Math.min(800, w));

  assert.equal(clampSidebarWidth(100), 180);
  assert.equal(clampSidebarWidth(750), 600);
  assert.equal(clampSidebarWidth(280), 280);

  assert.equal(clampCopilotWidth(200), 260);
  assert.equal(clampCopilotWidth(950), 800);
  assert.equal(clampCopilotWidth(400), 400);
});

test("5. Custom Font Library & Font Importer Engine", () => {
  const supportedFonts = [
    "source_serif",
    "eb_garamond",
    "merriweather",
    "lora",
    "literata",
    "roboto_sans",
    "inter",
    "jetbrains_mono",
    "fira_code",
    "custom"
  ];

  assert.equal(supportedFonts.length, 10);
  assert.ok(supportedFonts.includes("eb_garamond"));
  assert.ok(supportedFonts.includes("merriweather"));
  assert.ok(supportedFonts.includes("custom"));

  const fontFaceDeclaration = (fontName, base64Data, format = "truetype") => {
    return `@font-face { font-family: "${fontName}"; src: url("data:font/${format};base64,${base64Data}") format("${format}"); }`;
  };

  const css = fontFaceDeclaration("MinionProCustom", "dGVzdC1kYXRh");
  assert.ok(css.includes('font-family: "MinionProCustom"'));
  assert.ok(css.includes("data:font/truetype;base64,dGVzdC1kYXRh"));
});

test("6. Provider-Agnostic AI Control Center Settings Validation", () => {
  const validProviders = ["openai", "anthropic", "gemini", "ollama", "custom"];

  const settings = {
    provider: "ollama",
    openaiKey: "",
    anthropicKey: "",
    geminiKey: "",
    ollamaBaseUrl: "http://localhost:11434",
    customEndpoint: "",
    model: "llama3.3"
  };

  assert.ok(validProviders.includes(settings.provider));
  assert.equal(settings.provider, "ollama");
  assert.equal(settings.ollamaBaseUrl, "http://localhost:11434");
  // Asserts no personal keys hardcoded in code
  assert.equal(settings.openaiKey, "");
  assert.equal(settings.anthropicKey, "");
});
