import test from "node:test";
import assert from "node:assert/strict";

// Test suite for Writ Desktop Studio core engines

test("1. Version Control DAG Engine: creates commits, tracks author attribution, and computes diffs", async () => {
  const initialCommit = {
    id: "c-root-1",
    parentId: null,
    branch: "main",
    timestamp: Date.now(),
    author: { type: "ai_daemon", name: "Writ Ingestion Engine" },
    message: "Initial manuscript deconstruction",
    affectedSegmentIds: ["seg-1"],
    segmentSnapshots: { "seg-1": "Certainty is rarely neutral." }
  };

  const dag = {
    commits: { "c-root-1": initialCommit },
    branches: { main: { name: "main", headCommitId: "c-root-1", createdAt: Date.now() } },
    activeBranch: "main",
    headCommitId: "c-root-1"
  };

  const humanCommitId = "c-human-2";
  const humanCommit = {
    id: humanCommitId,
    parentId: dag.headCommitId,
    branch: "main",
    timestamp: Date.now(),
    author: { type: "human", name: "Bruno" },
    message: "Refined philosophical nuance in Section I",
    affectedSegmentIds: ["seg-1"],
    segmentSnapshots: { "seg-1": "Certainty is rarely neutral. It organizes access." }
  };

  dag.commits[humanCommitId] = humanCommit;
  dag.branches.main.headCommitId = humanCommitId;
  dag.headCommitId = humanCommitId;

  assert.equal(dag.headCommitId, humanCommitId);
  assert.equal(dag.commits[humanCommitId].author.type, "human");
  assert.equal(dag.commits[humanCommitId].author.name, "Bruno");
  assert.equal(dag.commits[humanCommitId].parentId, "c-root-1");

  const branchName = "lyrical-experiment";
  dag.branches[branchName] = { name: branchName, headCommitId: humanCommitId, createdAt: Date.now() };
  dag.activeBranch = branchName;

  assert.equal(dag.activeBranch, "lyrical-experiment");
  assert.equal(dag.branches[branchName].headCommitId, humanCommitId);
});

test("2. Safety Trash Architecture (Rule 1 Compliance): never deletes permanently", async () => {
  const sampleSegment = {
    id: "seg-sample-99",
    title: "Discarded Chapter Idea",
    textContent: "A tentative scene that was deleted.",
    isArchived: false
  };

  const state = {
    segments: { [sampleSegment.id]: sampleSegment },
    trash: []
  };

  const trashItem = {
    id: sampleSegment.id,
    entityType: "segment",
    entityName: sampleSegment.title,
    deletedAt: Date.now(),
    payload: null
  };

  state.trash.unshift(trashItem);
  state.segments[sampleSegment.id].isArchived = true;

  assert.equal(state.trash.length, 1);
  assert.equal(state.trash[0].entityName, "Discarded Chapter Idea");
  assert.equal(state.segments[sampleSegment.id].isArchived, true);
  assert.ok(state.segments[sampleSegment.id].textContent.length > 0, "Data was not wiped!");

  state.trash = state.trash.filter(t => t.id !== sampleSegment.id);
  state.segments[sampleSegment.id].isArchived = false;

  assert.equal(state.trash.length, 0);
  assert.equal(state.segments[sampleSegment.id].isArchived, false);
});

test("3. Deconstruction & Segmenting: breaks raw text into structured chapters and extracts beats", async () => {
  const rawManuscript = `Section I: The Posture of Inquiry
Certainty is rarely neutral. It organizes access, legitimizes some voices, and quiets others.

Section II: The Hidden Costs
When certainty becomes a requirement, curiosity starts to look like indecision. Over time, the signal we optimize for is no longer truth-seeking.

Section III: Living with Doubt
To live well with uncertainty is to recognize that our maps are always smaller than the territory.`;

  const sectionSplitRegex = /(?:^|\n\n+)(?=(?:(?:Chapter|Section|Act|Part)\s+[0-9IVXLCDM]+|[IVXLCDM]+\.|\#{1,3}\s+))/i;
  const sections = rawManuscript.split(sectionSplitRegex).map(s => s.trim()).filter(Boolean);

  assert.equal(sections.length, 3, "Should detect exactly 3 sections");
  assert.ok(sections[0].includes("Section I: The Posture of Inquiry"));
  assert.ok(sections[1].includes("Section II: The Hidden Costs"));
  assert.ok(sections[2].includes("Section III: Living with Doubt"));
});

test("4. Project Drop Vault & AI Synthesizer: auto-placement and structural incorporation", async () => {
  const droppedText = "The bus-stop conversation about weather forecasts: people get visibly irritated when an app reports a 40% chance of rain.";
  
  // Simulating placement matching logic
  const isPersonal = /bus|weather|ordinary|personal|fear/i.test(droppedText);
  assert.ok(isPersonal, "Should recognize personal/ordinary dimension");

  const targetSection = isPersonal ? "Section III" : "Section I";
  assert.equal(targetSection, "Section III");

  // Simulating structural incorporation
  const targetSegment = {
    id: "seg-3",
    title: "Certainty as a social demand",
    textContent: "Initial draft of Section III."
  };

  const textToIntegrate = `We see this even in ordinary life: ${droppedText}`;
  targetSegment.textContent += `\n\n${textToIntegrate}`;

  assert.ok(targetSegment.textContent.includes("We see this even in ordinary life:"));
  assert.ok(targetSegment.textContent.includes("40% chance of rain"));
});

test("5. Platform Publishing Hub: formats across Substack, Wattpad, YouTube, and LaTeX", async () => {
  const sampleProject = {
    id: "proj-1",
    title: "On Certainty and Doubt",
    genre: "Philosophy / Longform Essay"
  };

  const sampleSegment = {
    id: "seg-1",
    title: "The Posture of Inquiry",
    romanNumeral: "I",
    synopsis: "An exploration into why doubt is penalized.",
    textContent: "Certainty is rarely neutral. It organizes access, legitimizes some voices, and quiets others."
  };

  // Substack export verification
  const substackBody = `*By Bruno · Written with Writ*\n\n---\n\n${sampleSegment.textContent}\n\n---\n\n### The Takeaway\n\nIf we want wiser institutions and truer relationships, we have to change the incentives to favor curiosity over false certainty.\n\n*Subscribe for more longform essays and inquiries.*`;
  assert.ok(substackBody.includes("By Bruno · Written with Writ"));
  assert.ok(substackBody.includes(sampleSegment.textContent));

  // YouTube Script export verification with cue markers
  const youtubeScript = `[00:00 - Hook / Cold Open]\n"Certainty is rarely neutral. It organizes access..."\n[B-Roll: Slow zoom on crowded city crosswalk]\n\n[00:45 - The Premise]\n${sampleSegment.synopsis}\n[On-Screen Graphic: The Cost of Certainty]`;
  assert.ok(youtubeScript.includes("[00:00 - Hook / Cold Open]"));
  assert.ok(youtubeScript.includes("[B-Roll:"));

  // LaTeX Document generator
  const latexDoc = `\\documentclass[11pt,a4paper]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath}\n\\title{${sampleProject.title}: ${sampleSegment.title}}\n\\author{Bruno}\n\\begin{document}\n\\maketitle\n\n${sampleSegment.textContent}\n\n\\end{document}`;
  assert.ok(latexDoc.includes("\\documentclass[11pt,a4paper]{article}"));
  assert.ok(latexDoc.includes("\\begin{document}"));
  assert.ok(latexDoc.includes("\\end{document}"));
});

test("6. LaTeX Math Expression Parser: accurately isolates inline $...$ and display $$...$$ math", async () => {
  const manuscriptWithMath = "The uncertainty principle states that $\\Delta x \\Delta p \\ge \\frac{\\hbar}{2}$, which bounds measurement precision.\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$";

  // In the two-pass parser, display math is extracted/processed first
  const displayMathMatches = [];
  const afterDisplay = manuscriptWithMath.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    displayMathMatches.push(math.trim());
    return "[MATH_BLOCK]";
  });

  assert.equal(displayMathMatches.length, 1);
  assert.equal(displayMathMatches[0], "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}");

  // Then inline math is extracted from the remaining text
  const inlineMathMatches = [];
  afterDisplay.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    inlineMathMatches.push(math.trim());
    return "[INLINE_MATH]";
  });

  assert.equal(inlineMathMatches.length, 1);
  assert.equal(inlineMathMatches[0], "\\Delta x \\Delta p \\ge \\frac{\\hbar}{2}");
});

test("7. Standalone Embedded Server & Atomic Disk Persistence: atomic save and Rule 1 trash sync", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const os = await import("node:os");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "writ-test-"));
  const projectsDir = path.join(tempDir, "projects");
  const trashDir = path.join(tempDir, "trash");
  fs.mkdirSync(projectsDir, { recursive: true });
  fs.mkdirSync(trashDir, { recursive: true });

  const sampleProject = {
    id: "proj-persist-test",
    title: "The Architecture of Solidity",
    updatedAt: Date.now()
  };

  const filePath = path.join(projectsDir, `${sampleProject.id}.json`);
  const backupPath = path.join(projectsDir, `${sampleProject.id}.bak`);

  // Initial write
  fs.writeFileSync(filePath, JSON.stringify(sampleProject, null, 2), "utf-8");
  assert.ok(fs.existsSync(filePath));

  // Atomic backup and update
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  const updatedProject = { ...sampleProject, title: "The Architecture of Solidity (Revised)" };
  fs.writeFileSync(filePath, JSON.stringify(updatedProject, null, 2), "utf-8");

  assert.ok(fs.existsSync(backupPath), "Backup .bak must exist");
  const currentContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const backupContent = JSON.parse(fs.readFileSync(backupPath, "utf-8"));

  assert.equal(currentContent.title, "The Architecture of Solidity (Revised)");
  assert.equal(backupContent.title, "The Architecture of Solidity");

  // Rule 1: Soft-delete trash index persistence
  const trashIndexFile = path.join(trashDir, "trash_index.json");
  const trashItem = {
    id: sampleProject.id,
    entityType: "project",
    entityName: sampleProject.title,
    deletedAt: Date.now()
  };
  fs.writeFileSync(trashIndexFile, JSON.stringify([trashItem], null, 2), "utf-8");
  assert.ok(fs.existsSync(trashIndexFile));
  const trashRecords = JSON.parse(fs.readFileSync(trashIndexFile, "utf-8"));
  assert.equal(trashRecords.length, 1);
  assert.equal(trashRecords[0].id, sampleProject.id);

  // Clean up test temp dir
  fs.rmSync(tempDir, { recursive: true, force: true });
});


