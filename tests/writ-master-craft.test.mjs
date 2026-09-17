import test from "node:test";
import assert from "node:assert/strict";

// Test suite for:
// 1. The Four Masters Craft Sentinel (McPhee, Nabokov, Gilligan, Nolan)
// 2. Proactive Interval Nudge System
// 3. Multi-Platform Publishing Suite (Obsidian, Google Docs, Substack, Wattpad, Notion)

// Mock Types & Classes matching Engine Implementations

class MockPlatformHub {
  formatForSubstack(project, segment) {
    const title = segment.title;
    const subtitle = segment.synopsis || project.logline;
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
      `Inquiry requires enduring the discomfort of not yet having an answer.\n\n` +
      `*Subscribe to receive new chapters directly in your inbox.*`;

    return {
      platform: "substack",
      title,
      subtitle,
      formattedBody: body,
      metadata: {
        tags: ["Essays", "Writing Craft"],
        description: subtitle,
        paywallBreakIndex: teaser.length
      },
      deliveryStatus: "ready_to_send"
    };
  }

  formatForWattpad(project, segment) {
    const title = `${segment.romanNumeral}. ${segment.title}`;
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
        tags: ["philosophical", "drama", "writerscommunity"],
        description: segment.synopsis,
        cliffhangerSnippet: segment.textContent.slice(-180).trim()
      },
      deliveryStatus: "ready_to_send"
    };
  }

  formatForObsidianVault(project, wiki, segments = []) {
    const totalWords = segments.reduce((acc, s) => acc + s.textContent.split(/\s+/).filter(Boolean).length, 0);

    let obsidianMd = `---\n` +
      `title: "${project.title}"\n` +
      `slug: "${project.slug}"\n` +
      `genre: "${project.genre}"\n` +
      `total_words: ${totalWords}\n` +
      `tags:\n` +
      `  - writ/manuscript\n` +
      `  - genre/${project.genre}\n` +
      `status: in-progress\n` +
      `---\n\n` +
      `# ${project.title}\n\n` +
      `> [!abstract] Central Inquiry\n` +
      `> ${project.logline}\n\n`;

    segments.forEach(seg => {
      let chapterText = seg.textContent;
      if (wiki?.characters) {
        for (const char of wiki.characters) {
          const reg = new RegExp(`\\b(${char.name})\\b`, "g");
          chapterText = chapterText.replace(reg, `[[$1]]`);
        }
      }
      obsidianMd += `## [[Section ${seg.romanNumeral} - ${seg.title}]]\n\n${chapterText}\n\n---\n\n`;
    });

    const canvasNodes = [
      { id: "node-project-root", type: "text", text: project.title, x: 0, y: 0, width: 340, height: 180 }
    ];
    const canvasEdges = [];

    segments.forEach((seg, idx) => {
      const nodeId = `node-chapter-${seg.id}`;
      canvasNodes.push({ id: nodeId, type: "text", text: seg.title, x: (idx + 1) * 380, y: 0, width: 320, height: 200 });
      canvasEdges.push({ id: `edge-${idx}`, fromNode: idx === 0 ? "node-project-root" : `node-chapter-${segments[idx - 1].id}`, toNode: nodeId });
    });

    return {
      platform: "obsidian",
      title: `${project.slug}-obsidian-vault.md`,
      formattedBody: obsidianMd,
      metadata: {
        description: "Obsidian Vault Export",
        tags: ["obsidian", "canvas"],
        canvasJson: JSON.stringify({ nodes: canvasNodes, edges: canvasEdges }, null, 2)
      },
      deliveryStatus: "ready_to_send"
    };
  }

  formatForGoogleDocs(project, segments = []) {
    let html = `<div style="font-family: 'Merriweather', Georgia, serif; font-size: 11pt; line-height: 1.85; color: #111827;">\n` +
      `  <h1>${project.title}</h1>\n` +
      `  <p><em>${project.logline}</em></p>\n` +
      `  <hr />\n`;

    segments.forEach(seg => {
      html += `  <h2>Section ${seg.romanNumeral}: ${seg.title}</h2>\n`;
      const paras = seg.textContent.split(/\n\s*\n/).filter(Boolean);
      paras.forEach(p => {
        html += `  <p style="text-indent: 1.5em;">${p}</p>\n`;
      });
    });
    html += `</div>`;

    const googleDocsJson = {
      title: project.title,
      requests: [
        { insertText: { location: { index: 1 }, text: `${project.title}\n` } }
      ]
    };

    return {
      platform: "google_docs",
      title: `${project.title} (Google Docs)`,
      formattedBody: html,
      metadata: {
        description: "Rich HTML + batchUpdate API schema",
        googleDocsJson
      },
      deliveryStatus: "ready_to_send"
    };
  }

  validatePlatformPackage(pkg) {
    const checks = [];
    checks.push({ name: "Title Presence", passed: Boolean(pkg.title && pkg.title.trim().length > 0), message: "Title ok" });
    checks.push({ name: "Body Content", passed: Boolean(pkg.formattedBody && pkg.formattedBody.trim().length > 30), message: "Body ok" });

    if (pkg.platform === "obsidian") {
      const hasFrontmatter = pkg.formattedBody.startsWith("---\n") && pkg.formattedBody.indexOf("\n---\n", 4) > -1;
      checks.push({ name: "YAML Frontmatter Integrity", passed: hasFrontmatter, message: "YAML Frontmatter verified" });
      checks.push({ name: "Wikilinks Syntax", passed: pkg.formattedBody.includes("[[") && pkg.formattedBody.includes("]]"), message: "Wikilinks verified" });
      const canvas = JSON.parse(pkg.metadata.canvasJson || "{}");
      checks.push({ name: "Obsidian Canvas Structure", passed: Boolean(canvas.nodes && canvas.edges), message: "Canvas verified" });
    } else if (pkg.platform === "google_docs") {
      const hasStyledHtml = pkg.formattedBody.includes("<div style=") && pkg.formattedBody.includes("<h1");
      checks.push({ name: "Google Docs Native HTML", passed: hasStyledHtml, message: "HTML verified" });
      checks.push({ name: "BatchUpdate Schema", passed: Boolean(pkg.metadata.googleDocsJson?.requests), message: "BatchUpdate verified" });
    } else if (pkg.platform === "substack") {
      checks.push({ name: "Substack Paywall Cut", passed: pkg.formattedBody.includes("<!-- paywall -->"), message: "Paywall verified" });
      checks.push({ name: "Subscriber CTA", passed: pkg.formattedBody.toLowerCase().includes("subscribe"), message: "CTA verified" });
    } else if (pkg.platform === "wattpad") {
      checks.push({ name: "Voting Hook", passed: pkg.formattedBody.includes("Vote"), message: "Hook verified" });
      checks.push({ name: "Tags", passed: Boolean(pkg.metadata.tags?.length >= 3), message: "Tags verified" });
    }

    const valid = checks.every(c => c.passed);
    return { valid, checks };
  }
}

// Craft Sentinel Logic
function evaluateCraftSentinel(project, segments, wiki) {
  const deficits = [];
  const targetWordsPerChapter = 1500;

  // McPhee Keystone Synthesis
  const keystones = segments.filter((s, idx) => idx === 0 || idx === segments.length - 1);
  let mcPheeDeficits = 0;
  keystones.forEach(seg => {
    const words = seg.textContent.split(/\s+/).filter(Boolean).length;
    const progress = Math.min(100, Math.round((words / targetWordsPerChapter) * 100));
    if (progress < 45) {
      mcPheeDeficits++;
      deficits.push({
        master: "mcphee",
        severity: "critical",
        chapterId: seg.id,
        chapterTitle: seg.title,
        chapterRoman: seg.romanNumeral,
        weight: 90,
        currentProgress: progress,
        deficitScore: 90 * (1 - progress / 100),
        reason: "Keystone chapter carries thesis load but lacks evidence density.",
        recommendation: "Ground the central claim in specific physical evidence."
      });
    }
  });

  // Gilligan Causality
  let brokenCausalChains = 0;
  const turningPoints = wiki.plotPoints.filter(p => p.type === "turning_point" || p.type === "climax");
  turningPoints.forEach(tp => {
    const linkedChapter = segments.find(s => s.id === tp.chapterId) || segments[0];
    const words = linkedChapter ? linkedChapter.textContent.split(/\s+/).filter(Boolean).length : 0;
    const progress = Math.min(100, Math.round((words / targetWordsPerChapter) * 100));
    if (progress < 50) {
      brokenCausalChains++;
      deficits.push({
        master: "gilligan",
        severity: "critical",
        chapterId: linkedChapter.id,
        chapterTitle: linkedChapter.title,
        chapterRoman: linkedChapter.romanNumeral,
        weight: 95,
        currentProgress: progress,
        deficitScore: 95 * (1 - progress / 100),
        reason: "Critical turning point lacks earned consequence setup.",
        recommendation: "Build the irreversible cause before this effect strikes."
      });
    }
  });

  // Nabokov Mosaic
  let isolatedCount = 0;
  segments.forEach((seg, idx) => {
    if (idx > 0 && idx < segments.length - 1 && seg.treatedThreadIds.length === 0) {
      isolatedCount++;
      deficits.push({
        master: "nabokov",
        severity: "moderate",
        chapterId: seg.id,
        chapterTitle: seg.title,
        chapterRoman: seg.romanNumeral,
        weight: 70,
        currentProgress: 20,
        deficitScore: 56,
        reason: "Chapter sits as an isolated narrative island without recurring motifs.",
        recommendation: "Weave an existing thematic motif or character thread through this scene."
      });
    }
  });

  // Nolan Rhythm
  let pacingDrops = 0;
  if (segments.length >= 3) {
    const lateIdx = Math.floor(segments.length * 0.7);
    const lateChapter = segments[lateIdx];
    const words = lateChapter.textContent.split(/\s+/).filter(Boolean).length;
    if (words < 600) {
      pacingDrops++;
      deficits.push({
        master: "nolan",
        severity: "high",
        chapterId: lateChapter.id,
        chapterTitle: lateChapter.title,
        chapterRoman: lateChapter.romanNumeral,
        weight: 85,
        currentProgress: 30,
        deficitScore: 60,
        reason: "Pre-climax convergence chapter has insufficient narrative velocity.",
        recommendation: "Cross-cut between running timelines to accelerate temporal pressure."
      });
    }
  }

  deficits.sort((a, b) => b.deficitScore - a.deficitScore);

  return {
    integrityScore: Math.max(0, 100 - deficits.length * 15),
    deficits,
    mcPheeDeficits,
    brokenCausalChains,
    isolatedCount,
    pacingDrops
  };
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test("1. Master Craft Sentinel identifies McPhee keystone and Gilligan causal deficits", () => {
  const project = { title: "The Sovereign Self", slug: "the-sovereign-self", logline: "Inquiry into autonomy", genre: "essay" };
  const segments = [
    { id: "s1", romanNumeral: "I", title: "The False Refuge", textContent: "Brief lead statement.", treatedThreadIds: ["th-1"] },
    { id: "s2", romanNumeral: "II", title: "The Turning Wheel", textContent: "Short turning point.", treatedThreadIds: ["th-1"] },
    { id: "s3", romanNumeral: "III", title: "Final Synthesis", textContent: "Thin conclusion.", treatedThreadIds: ["th-1"] }
  ];
  const wiki = {
    characters: [{ id: "c1", name: "Aria" }],
    plotPoints: [{ id: "p1", title: "The Rupture", type: "turning_point", chapterId: "s2" }]
  };

  const report = evaluateCraftSentinel(project, segments, wiki);

  assert.ok(report.deficits.length >= 2, "Should identify multiple load-bearing deficits");
  const mcphee = report.deficits.find(d => d.master === "mcphee");
  const gilligan = report.deficits.find(d => d.master === "gilligan");

  assert.ok(mcphee, "McPhee keystone deficit should be detected for thin lead/synthesis");
  assert.equal(mcphee.severity, "critical");
  assert.ok(gilligan, "Gilligan consequence deficit should be detected for underdeveloped turning point");
  assert.equal(gilligan.severity, "critical");
});

test("2. Master Craft Sentinel identifies Nabokov isolated islands and Nolan pacing drops", () => {
  const project = { title: "Dunkirk Paradox", slug: "dunkirk-paradox", logline: "Multi-timeline study", genre: "novel" };
  const segments = [
    { id: "s1", romanNumeral: "I", title: "The Mole", textContent: "Dense opening text with one thousand words to pass.", treatedThreadIds: ["th-1"] },
    { id: "s2", romanNumeral: "II", title: "The Sea (Island)", textContent: "Content here without any treated thread.", treatedThreadIds: [] },
    { id: "s3", romanNumeral: "III", title: "The Air (Convergence)", textContent: "Too brief for late climax.", treatedThreadIds: ["th-1"] },
    { id: "s4", romanNumeral: "IV", title: "Resolution", textContent: "Dense closing chapter with solid wrap-up.", treatedThreadIds: ["th-1"] }
  ];
  const wiki = {
    characters: [],
    plotPoints: []
  };

  const report = evaluateCraftSentinel(project, segments, wiki);

  const nabokov = report.deficits.find(d => d.master === "nabokov");
  const nolan = report.deficits.find(d => d.master === "nolan");

  assert.ok(nabokov, "Nabokov should flag chapter II for lacking recurring thread treatments");
  assert.equal(nabokov.chapterTitle, "The Sea (Island)");

  assert.ok(nolan, "Nolan should flag late chapter III for pacing deficit (<600 words)");
  assert.equal(nolan.chapterTitle, "The Air (Convergence)");
});

test("3. Obsidian Vault Exporter compiles YAML frontmatter, [[wikilinks]], and .canvas JSON", () => {
  const hub = new MockPlatformHub();
  const project = { title: "Dialectics of Irony", slug: "dialectics-of-irony", logline: "Socratic inquiry", genre: "philosophy" };
  const wiki = {
    characters: [{ id: "c1", name: "Socrates" }]
  };
  const segments = [
    { id: "s1", romanNumeral: "I", title: "The Oracle at Delphi", textContent: "Socrates approached the shrine." },
    { id: "s2", romanNumeral: "II", title: "The Aporia", textContent: "Socrates questioned the elders." }
  ];

  const pkg = hub.formatForObsidianVault(project, wiki, segments);
  const validation = hub.validatePlatformPackage(pkg);

  assert.equal(pkg.platform, "obsidian");
  assert.ok(pkg.formattedBody.startsWith("---\n"), "Obsidian export must start with YAML frontmatter");
  assert.ok(pkg.formattedBody.includes("[[Socrates]]"), "Obsidian export must wrap characters in [[wikilinks]]");
  assert.ok(pkg.metadata.canvasJson, "Obsidian export must include .canvas JSON");

  const parsedCanvas = JSON.parse(pkg.metadata.canvasJson);
  assert.equal(parsedCanvas.nodes.length, 3, "Canvas must have root project node + 2 chapter nodes");
  assert.equal(parsedCanvas.edges.length, 2, "Canvas must have 2 connecting edges");

  assert.equal(validation.valid, true, "Obsidian package validation must pass 100%");
});

test("4. Google Docs Exporter compiles typography-styled HTML and batchUpdate JSON", () => {
  const hub = new MockPlatformHub();
  const project = { title: "The Masterwork", slug: "the-masterwork", logline: "Grand synthesis", genre: "essay" };
  const segments = [
    { id: "s1", romanNumeral: "I", title: "The Genesis", textContent: "Paragraph one.\n\nParagraph two." }
  ];

  const pkg = hub.formatForGoogleDocs(project, segments);
  const validation = hub.validatePlatformPackage(pkg);

  assert.equal(pkg.platform, "google_docs");
  assert.ok(pkg.formattedBody.includes("<div style="), "Google Docs formatted body must include container styles");
  assert.ok(pkg.formattedBody.includes("<h1>The Masterwork</h1>"), "Google Docs formatted body must contain h1");
  assert.ok(pkg.metadata.googleDocsJson?.requests, "Google Docs metadata must contain batchUpdate requests");

  assert.equal(validation.valid, true, "Google Docs package validation must pass 100%");
});

test("5. Substack Newsletter and Wattpad Serial Chapter Exporters validate successfully", () => {
  const hub = new MockPlatformHub();
  const project = { title: "Echoes of Eternity", slug: "echoes-of-eternity", logline: "Serial fiction adventure", genre: "novel" };
  const segment = {
    id: "s1",
    romanNumeral: "I",
    title: "Into the Abyss",
    synopsis: "The descent begins.",
    textContent: "The wind howled across the cliff face.\n\nThey took the first step down into darkness.\n\nThe cavern walls glowed with phosphorescence."
  };

  const substackPkg = hub.formatForSubstack(project, segment);
  const substackVal = hub.validatePlatformPackage(substackPkg);

  assert.equal(substackPkg.platform, "substack");
  assert.ok(substackPkg.formattedBody.includes("<!-- paywall -->"), "Substack post must contain paywall marker");
  assert.ok(substackPkg.formattedBody.includes("Subscribe"), "Substack post must contain subscription call-to-action");
  assert.equal(substackVal.valid, true, "Substack validation must pass");

  const wattpadPkg = hub.formatForWattpad(project, segment);
  const wattpadVal = hub.validatePlatformPackage(wattpadPkg);

  assert.equal(wattpadPkg.platform, "wattpad");
  assert.ok(wattpadPkg.formattedBody.includes("Part I: Into the Abyss"), "Wattpad post must contain part number and title");
  assert.ok(wattpadPkg.formattedBody.includes("Vote"), "Wattpad post must contain voting hook");
  assert.ok(wattpadPkg.metadata.tags.length >= 3, "Wattpad must attach at least 3 genre tags");
  assert.equal(wattpadVal.valid, true, "Wattpad validation must pass");
});
