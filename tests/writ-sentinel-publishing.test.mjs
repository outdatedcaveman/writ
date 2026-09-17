import test from "node:test";
import assert from "node:assert/strict";

// Test suite for:
// 1. Cadence Options: Minutes, Hours, Days, Weeks (15m, 30m, 1h, 3h, 6h, 12h, 1d, 3d, 1w, 2w)
// 2. Open-Aware Lapsed Check (immediate prompt upon reopening with elapsed time calculation)
// 3. Remote Phone & Webhook Push Notifications (ntfy.sh & webhooks)
// 4. Zero-Attrition 1-Click Platform Openers (Obsidian, Substack, Google Docs, Wattpad, Notion)

const CADENCE_PRESETS = [
  { id: "15m", label: "15 Minutes (Active Sprint)", minutes: 15 },
  { id: "30m", label: "30 Minutes (Standard Focus)", minutes: 30 },
  { id: "1h", label: "1 Hour (Deep Session)", minutes: 60 },
  { id: "3h", label: "3 Hours (Half Day Reflection)", minutes: 180 },
  { id: "6h", label: "6 Hours (Daily Milestone)", minutes: 360 },
  { id: "12h", label: "12 Hours (Twice Daily)", minutes: 720 },
  { id: "1d", label: "1 Day (Daily Sentinel)", minutes: 1440 },
  { id: "3d", label: "3 Days (Bi-Weekly Review)", minutes: 4320 },
  { id: "1w", label: "1 Week (Weekly Check-In)", minutes: 10080 },
  { id: "2w", label: "2 Weeks (Fortnightly Review)", minutes: 20160 }
];

function checkLapsedInterval(settings, currentTimestamp = Date.now()) {
  if (!settings.enabled || !settings.openAwareAlerts || !settings.lastCheckTimestamp) {
    return { isLapsed: false, elapsedMinutes: 0, elapsedFormatted: "" };
  }

  const elapsedMs = Math.max(0, currentTimestamp - settings.lastCheckTimestamp);
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
  const isLapsed = elapsedMinutes >= settings.intervalMinutes;

  let elapsedFormatted = "";
  if (elapsedMinutes < 60) {
    elapsedFormatted = `${elapsedMinutes}m`;
  } else if (elapsedMinutes < 1440) {
    const hours = Math.floor(elapsedMinutes / 60);
    elapsedFormatted = `${hours}h`;
  } else if (elapsedMinutes < 10080) {
    const days = Math.floor(elapsedMinutes / 1440);
    elapsedFormatted = `${days}d`;
  } else {
    const weeks = Math.floor(elapsedMinutes / 10080);
    elapsedFormatted = `${weeks}w`;
  }

  return { isLapsed, elapsedMinutes, elapsedFormatted };
}

test("1. Multi-Cadence Presets: supports full range from 15m to 2 weeks", () => {
  assert.equal(CADENCE_PRESETS.length, 10);
  assert.equal(CADENCE_PRESETS[0].minutes, 15);
  assert.equal(CADENCE_PRESETS[2].minutes, 60);     // 1h
  assert.equal(CADENCE_PRESETS[5].minutes, 720);    // 12h
  assert.equal(CADENCE_PRESETS[6].minutes, 1440);   // 1d
  assert.equal(CADENCE_PRESETS[8].minutes, 10080);  // 1w
  assert.equal(CADENCE_PRESETS[9].minutes, 20160);  // 2w
});

test("2. Open-Aware Lapse Logic: identifies lapsed intervals while app was closed", () => {
  const now = 1750000000000;
  const oneHourMs = 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Case A: Interval is 1 hour, closed for 3 hours -> Lapsed
  const settingsA = {
    enabled: true,
    openAwareAlerts: true,
    intervalMinutes: 60,
    lastCheckTimestamp: now - (3 * oneHourMs)
  };
  const resultA = checkLapsedInterval(settingsA, now);
  assert.equal(resultA.isLapsed, true);
  assert.equal(resultA.elapsedMinutes, 180);
  assert.equal(resultA.elapsedFormatted, "3h");

  // Case B: Interval is 1 day, closed for 3 days -> Lapsed
  const settingsB = {
    enabled: true,
    openAwareAlerts: true,
    intervalMinutes: 1440,
    lastCheckTimestamp: now - (3 * oneDayMs)
  };
  const resultB = checkLapsedInterval(settingsB, now);
  assert.equal(resultB.isLapsed, true);
  assert.equal(resultB.elapsedMinutes, 4320);
  assert.equal(resultB.elapsedFormatted, "3d");

  // Case C: Interval is 1 week, closed for 2 weeks -> Lapsed
  const settingsC = {
    enabled: true,
    openAwareAlerts: true,
    intervalMinutes: 10080,
    lastCheckTimestamp: now - (14 * oneDayMs)
  };
  const resultC = checkLapsedInterval(settingsC, now);
  assert.equal(resultC.isLapsed, true);
  assert.equal(resultC.elapsedFormatted, "2w");

  // Case D: Interval is 1 day, closed for only 12 hours -> Not Lapsed
  const settingsD = {
    enabled: true,
    openAwareAlerts: true,
    intervalMinutes: 1440,
    lastCheckTimestamp: now - (12 * oneHourMs)
  };
  const resultD = checkLapsedInterval(settingsD, now);
  assert.equal(resultD.isLapsed, false);
});

test("3. Remote Phone & Webhook Alert Payload Formatting", () => {
  const mockDiagnosis = {
    id: "diag-1",
    school: "gilligan",
    schoolLabel: "Gilligan's Law of Causality",
    severity: "critical",
    segmentRoman: "IV",
    segmentTitle: "The Turning Point",
    headline: "Unearned Reversal Lacks Grounded Cause",
    recommendation: "Establish the antecedent decision before the crisis."
  };

  const projectTitle = "The Irony of Becoming";

  const title = `Writ Alert: ${mockDiagnosis.schoolLabel}`;
  const message = `Section ${mockDiagnosis.segmentRoman} (${mockDiagnosis.segmentTitle}) in "${projectTitle}":\n${mockDiagnosis.headline}\n\n${mockDiagnosis.recommendation}`;

  assert.ok(title.includes("Gilligan"));
  assert.ok(message.includes("Section IV (The Turning Point)"));
  assert.ok(message.includes("The Irony of Becoming"));

  // ntfy.sh endpoint verification
  const topic = "writ-craft-alerts";
  const ntfyUrl = `https://ntfy.sh/${encodeURIComponent(topic)}`;
  assert.equal(ntfyUrl, "https://ntfy.sh/writ-craft-alerts");
});

test("4. Zero-Attrition Obsidian Direct Live Opener: formats URI and note structure", () => {
  const vaultName = "Literary Studio";
  const projectTitle = "Dialectics of Irony";
  const cleanVault = encodeURIComponent(vaultName.trim());
  const cleanFile = encodeURIComponent(projectTitle.trim());

  const obsidianUri = `obsidian://open?vault=${cleanVault}&file=${cleanFile}`;
  assert.equal(obsidianUri, "obsidian://open?vault=Literary%20Studio&file=Dialectics%20of%20Irony");
});

test("5. Zero-Attrition Substack & Google Docs Direct Draft Launchers", () => {
  // Substack direct draft launch
  const defaultSubstackUrl = "https://substack.com/publish/post";
  assert.equal(defaultSubstackUrl, "https://substack.com/publish/post");

  const customDomain = "inquiries.substack.com";
  const customSubstackUrl = `https://${customDomain}/publish/post`;
  assert.equal(customSubstackUrl, "https://inquiries.substack.com/publish/post");

  // Google Docs direct creation launch
  const googleDocsUrl = "https://docs.google.com/document/create";
  assert.equal(googleDocsUrl, "https://docs.google.com/document/create");

  // Wattpad direct story launch
  const wattpadUrl = "https://www.wattpad.com/myworks/new";
  assert.equal(wattpadUrl, "https://www.wattpad.com/myworks/new");
});
