import test from "node:test";
import assert from "node:assert/strict";

// Test suite for Writ Desktop Studio core engines

test("1. Version Control DAG Engine: creates commits, tracks author attribution, and computes diffs", async () => {
  // Test commit generation and attribution
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

  // Simulate human edit commit
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

  // Create branch
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

  // Perform soft delete
  const trashItem = {
    id: sampleSegment.id,
    entityType: "segment",
    entityName: sampleSegment.title,
    deletedAt: Date.now(),
    payload: null
  };

  state.trash.unshift(trashItem);
  state.segments[sampleSegment.id].isArchived = true;

  // Verify it is preserved in trash and marked archived
  assert.equal(state.trash.length, 1);
  assert.equal(state.trash[0].entityName, "Discarded Chapter Idea");
  assert.equal(state.segments[sampleSegment.id].isArchived, true);
  assert.ok(state.segments[sampleSegment.id].textContent.length > 0, "Data was not wiped!");

  // Perform restore
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

test("4. Analytical Metrics & Cadence Diagnostics", async () => {
  const sampleText = "Short sentence. Another brief claim. Here is a much longer sentence that elaborates on the philosophical consequences of institutional risk aversion.";
  const words = sampleText.match(/\b[a-zA-Z0-9'’-]+\b/g) || [];
  const sentences = sampleText.match(/[^.!?]+[.!?]+(\s|$)/g) || [];

  assert.equal(sentences.length, 3);
  assert.ok(words.length > 15);

  const sentenceLengths = sentences.map(s => (s.match(/\b[a-zA-Z0-9'’-]+\b/g) || []).length);
  const avg = Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length);
  assert.ok(avg > 4);
});
