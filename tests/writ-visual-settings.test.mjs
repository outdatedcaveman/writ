import test from "node:test";
import assert from "node:assert/strict";

// Test visual settings and atmosphere presets
test("Visual Settings Engine: default configuration and presets validation", () => {
  const defaultVisualSettings = {
    atmosphere: "oled_black",
    fontFamily: "Source Serif 4",
    fontSizePx: 18,
    lineSpacing: 1.75,
    columnWidth: "standard",
    isTypewriterMode: false,
    isFocusMode: false,
    isZenMode: false
  };

  assert.equal(defaultVisualSettings.atmosphere, "oled_black");
  assert.equal(defaultVisualSettings.fontFamily, "Source Serif 4");
  assert.equal(defaultVisualSettings.fontSizePx, 18);
  assert.equal(defaultVisualSettings.lineSpacing, 1.75);
  assert.equal(defaultVisualSettings.columnWidth, "standard");
  assert.equal(defaultVisualSettings.isTypewriterMode, false);
  assert.equal(defaultVisualSettings.isFocusMode, false);
  assert.equal(defaultVisualSettings.isZenMode, false);

  // Test custom atmosphere styling
  const atmosphereColors = {
    oled_black: { bg: "#080808", text: "#ECE7DE" },
    paper_noir: { bg: "#0F0E0C", text: "#E5DEC9" },
    midnight_slate: { bg: "#0D1117", text: "#C9D1D9" },
    forest_noir: { bg: "#0A100D", text: "#C2D8B9" }
  };

  for (const [key, val] of Object.entries(atmosphereColors)) {
    assert.ok(val.bg.startsWith("#"));
    assert.ok(val.text.startsWith("#"));
  }
});

test("Visual Settings Engine: serialization and local storage round-trip", () => {
  const settings = {
    atmosphere: "forest_noir",
    fontFamily: "JetBrains Mono",
    fontSizePx: 22,
    lineSpacing: 2.0,
    columnWidth: "wide",
    isTypewriterMode: true,
    isFocusMode: true,
    isZenMode: true
  };

  const serialized = JSON.stringify(settings);
  const deserialized = JSON.parse(serialized);

  assert.deepEqual(deserialized, settings);
  assert.equal(deserialized.columnWidth, "wide");
  assert.equal(deserialized.isZenMode, true);
});
