# Writ · Autonomous Literary Studio & Dialectical Manuscript Engine

> **A professional, visual-first desktop studio for authors, essayists, philosophers, and narrative architects.**  
> *Engineered around the structural systems of John McPhee, Vladimir Nabokov, Vince Gilligan, and Christopher Nolan.*

---

## ✦ Overview

**Writ** is an offline-first desktop application engineered for deep, deliberate long-form writing: philosophical treatises, literary non-fiction, complex multi-threaded novels, speculative epics, and dramatic screenplays.

Unlike traditional text editors that treat manuscripts as flat vertical documents, Writ models creative work as **living, load-bearing narrative systems**:

1. **The Four Masters Craft Sentinel**: Proactively monitors your manuscript against the analytical craft laws of John McPhee, Vladimir Nabokov, Vince Gilligan, and Christopher Nolan.
2. **Proactive Interval Nudge System**: Configurable background timer (15m, 30m, 45m, 60m) that alerts you when critical load-bearing sections (keystones, major turning points, climax convergence chapters) are underwritten relative to their narrative weight.
3. **Multi-Platform Publishing Suite**: One-click publishing and export to **Obsidian** (with YAML frontmatter, `[[wikilinks]]`, and interactive `.canvas` file), **Google Docs** (native formatted rich HTML paste + batchUpdate API schema), **Substack** (newsletter draft with `<!-- paywall -->` break), **Wattpad** (serialized chapter with voting CTAs), and **Notion** (direct REST API block creator).
4. **Interactive Relational Graph**: Draggable SVG topology canvas modeling character tension, philosophical thesis-antithesis dynamics, and direct manuscript jump links.
5. **Panoramic Timeline Arc**: Circular bezier arc visualizer mapping narrative threads across the entire manuscript horizon with infinite pan/zoom.
6. **Background Drop Vault Watcher**: Automatically ingests research notes, PDF excerpts, images, and citations dropped into `data/vault_inbox/` or sent via inbound REST webhooks.
7. **Version Control DAG & Branching**: Semantic version tree with author attribution (Human Author vs AI Daemon), branch exploration, and visual line/word diffing.

---

## ✦ The Four Masters Craft Systems

Writ explicitly formalizes and automates the analytical methods of four legendary narrative masters:

### 1. John McPhee · Keystone Architecture & Synthesis
- **The Craft Principle**: A non-fiction structure is an architectural arch. It cannot stand if the keystone cross-section (the opening lead inquiry and the closing synthesis) rests on pure assertion rather than observed, empirical evidence.
- **Sentinel Analysis**: Evaluates thesis load-bearing weight against empirical citation density. Flagged when a keystone section carries $>70$ weight but has $<45\%$ text/goal development.

### 2. Vince Gilligan · Causal Consequence Integrity
- **The Craft Principle**: *Breaking Bad* / *Better Call Saul* writers' room discipline—every dramatic effect must be earned by an antecedent cause. Characters cannot be rescued by coincidence; actions must trigger irreversible causal cascades.
- **Sentinel Analysis**: Maps plot turning points and dramatic climaxes. Flagged when major turning points lack antecedent setup or consequence integration ($>75$ causal weight $\times$ $<50\%$ development).

### 3. Vladimir Nabokov · Modular Index-Card Mosaic
- **The Craft Principle**: Nabokov composed *Lolita* and *Pale Fire* on 3x5 Bristol index cards, shuffling scenes non-linearly to ensure every card was woven with recurring motifs, colors, and character perspectives.
- **Sentinel Analysis**: Identifies "isolated islands"—middle chapters that fail to touch or advance any recurring narrative thread or thematic motif.

### 4. Christopher Nolan · Temporal Cross-Cut Rhythm
- **The Craft Principle**: Cross-cutting distinct temporal timelines (e.g. *Dunkirk*, *Oppenheimer*, *Inception*) toward a converging climax to heighten dramatic momentum and narrative velocity.
- **Sentinel Analysis**: Analyzes chapter pacing rhythm across acts. Detects late-Act II and pre-climax convergence chapters whose text density and velocity drop below threshold ($<600$ words).

---

## ✦ Proactive Interval Nudge System

Authors frequently get lost in polishing early scenes while neglecting underdeveloped, load-bearing chapters that will break the manuscript's structural integrity later.

Writ includes a proactive, non-intrusive interval alert system:
- **Configurable Cadence**: Choose reminder intervals of **15 minutes**, **30 minutes**, **45 minutes**, **60 minutes**, or disable as desired.
- **Deficit Ranking**: Calculates the Deficit Priority Score:
  $$\text{Deficit Score} = \text{Load-Bearing Weight} \times \left(1 - \frac{\text{Current Progress}}{100}\right)$$
- **Gentle Floating Nudge**: Surfaces a lightweight toast indicating which master's law is at risk, with one-click **"Focus Section"** to immediately navigate and begin filling the deficit.

---

## ✦ Multi-Platform Publishing Suite

Export and publish seamlessly to every major modern publishing channel:

| Platform | Capabilities | Export Format |
| :--- | :--- | :--- |
| **Obsidian** | YAML frontmatter (`title`, `tags`, `wordCount`), character `[[wikilinks]]`, and interactive visual `.canvas` file | `.md` + `.canvas` JSON |
| **Google Docs** | Native rich HTML clipboard paste (preserves Merriweather serif styling, indentations, and hierarchy) + Google Docs API `batchUpdate` schema | Rich HTML / JSON |
| **Substack** | Newsletter dispatch with headline, inquiry subtitle, author byline, `<!-- paywall -->` member cut, and subscription footer | Markdown / HTML |
| **Wattpad** | Serialized chapter layout with Part Roman numerals, teaser pull quote, cliffhanger pacing, vote & comment CTAs, and tag cloud | BBCode / Markdown |
| **Notion** | Direct REST API publish creating native Notion blocks (`heading_1`, `callout`, `paragraph`) in your workspace, plus pasteable Markdown | Direct API / Markdown |
| **Academic LaTeX** | Full LaTeX article document with `amsmath`, `geometry`, abstract, and sections | `.tex` source |

---

## ✦ Simple 1-Click Windows Installation

Writ is packaged as a completely self-contained, standalone Windows executable (`Writ.exe`) requiring zero terminal commands.

### Quick Launch via Installer Script:
1. Double-click **`Install-Writ.bat`**.
2. The script will automatically:
   - Verify the pre-built `Writ.exe` binary (or build it from source if not present).
   - Create an authentic desktop shortcut (**`Writ Studio.lnk`**) on your Windows Desktop.
   - Launch Writ Desktop Studio immediately.

### Manual Direct Launch:
Run `release\win-unpacked\Writ.exe` directly from any folder. All data is saved safely in `Documents\Writ\data\`.

---

## ✦ Developer Setup (Building from Source)

### Prerequisites
- Node.js 18+ or 20+ (LTS)
- npm or yarn

### Development
```bash
# Clone the repository
git clone https://github.com/writ-studio/writ.git
cd writ

# Install dependencies
npm install

# Run Vite dev server with Hot Module Replacement
npm run dev

# Launch Electron desktop window
npm run electron:dev
```

### Automated Testing
```bash
# Run the complete test suite (Integrations, Four Masters Sentinel, Multi-Platform Hub)
node --test tests/*.test.mjs
```

### Packaging Windows Standalone Binary
```bash
npm run build
npx electron-builder --win --dir
```
Output folder: `release/win-unpacked/Writ.exe`

---

## ✦ Core Principles & Security Guarantee

1. **Zero Permanent Deletion (Safety Trash)**: No chapter, draft, character dossier, or research vault item is ever deleted permanently. All removals route to the recoverable Safety Trash Drawer.
2. **Offline & Privacy First**: Writ functions 100% offline. Zero tracking, zero telemetry, and zero mandatory cloud accounts.
3. **Provider-Agnostic AI**: Connect your choice of OpenAI, Anthropic Claude, Google Gemini, local Ollama (Llama 3, DeepSeek), or custom Egon Mind MCP servers via visual settings.
4. **100% Visual GUI Control**: Every single workflow is visually operable with zero required coding.

---

## ✦ License

MIT License. Copyright (c) 2026 Writ Studio.
