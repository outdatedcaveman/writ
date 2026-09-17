# Writ · Autonomous Literary Studio & Dialectical Manuscript Engine

> **A professional, visual-first desktop studio for authors, essayists, philosophers, and narrative architects.**  
> *Engineered around the structural systems of John McPhee, Vladimir Nabokov, Vince Gilligan, and Christopher Nolan.*  
> **Official Repository**: [https://github.com/outdatedcaveman/writ](https://github.com/outdatedcaveman/writ)

---

## ✦ Overview

**Writ** is an offline-first desktop studio engineered for deep, deliberate long-form literary and non-fiction composition: philosophical inquiries, investigative treatises, complex multi-threaded novels, speculative epics, and dramatic screenplays.

Unlike conventional text processors that treat manuscripts as flat vertical documents, Writ models manuscripts as **living, load-bearing narrative structures**:

1. **The Four Masters Craft Sentinel**: Proactively analyzes manuscript integrity against the analytical craft laws of John McPhee, Vladimir Nabokov, Vince Gilligan, and Christopher Nolan.
2. **Proactive Author Nudges & Multi-Horizon Cadences**: Flexible interval timers ranging from **15m to 2 weeks** (15m, 30m, 1h, 3h, 6h, 12h, 1d, 3d, 1w, 2w), with **Open-Aware Lapse Tracking** that immediately alerts you upon reopening if your target interval elapsed while you were away.
3. **Remote Phone & Webhook Alerts**: Push notifications sent straight to your phone via **ntfy.sh** (free, instant iOS & Android push with zero account required), custom webhooks (Slack, Discord, Pushover, Zapier), and email gateways.
4. **Zero-Attrition 1-Click Multiplatform Publishing**: Eliminates copy-paste friction:
   - **Obsidian**: Writes Markdown (`.md`) and visual Canvas (`.canvas`) directly to your vault and launches `obsidian://open?vault=...&file=...`.
   - **Google Docs**: Primes system clipboard with rich Merriweather serif styling and immediately launches a fresh document ready for Ctrl+V.
   - **Substack**: Formats headline, paywall cut (`<!-- paywall -->`), and subscriber footer, priming clipboard and launching Substack's draft editor.
   - **Notion**: Direct REST API integration creates the page in your workspace and immediately opens the resulting URL in your default browser.
   - **Wattpad**: Formats serialized chapters with Roman numerals and pull quotes, launching the Wattpad story creator directly.
5. **Interactive Relational Graph**: Draggable SVG topology canvas modeling character tension, thematic dynamics, and thesis-antithesis contradictions.
6. **Panoramic Timeline Arc**: Circular bezier arc visualizer mapping narrative threads across the entire horizon with infinite pan/zoom.
7. **Background Drop Vault Watcher**: Automatically ingests research notes, PDF excerpts, images, and citations dropped into `data/vault_inbox/` or sent via inbound REST webhooks.
8. **Version Control DAG & Branching**: Semantic version tree with author attribution (Human Author vs AI Daemon), branch exploration, and visual line/word diffing.

---

## ✦ The Four Masters Analytical Framework

Writ explicitly formalizes and automates the craft methods of four narrative masters:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE FOUR MASTERS SENTINEL                             │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Master               │ Craft Domain         │ Sentinel Law                  │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ John McPhee          │ Non-Fiction Keystone │ Thesis Lead & Synthesis must  │
│                      │ Architecture         │ be anchored in empirical data │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Vince Gilligan       │ Causal Consequence   │ Strict cause-and-effect; no   │
│                      │ Ledger               │ unearned turns or escapes     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Vladimir Nabokov     │ Modular Index-Card   │ Shuffled mosaic; no isolated  │
│                      │ Mosaic               │ chapters lacking thread weave │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Christopher Nolan    │ Temporal Cross-Cut   │ Multi-thread cadence, ticking │
│                      │ Velocity             │ clock & converging momentum   │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 1. John McPhee · Keystone Architecture & Synthesis
- **The Principle**: A non-fiction structure is an architectural arch. It collapses if the keystone cross-section (the opening lead and closing synthesis) rests on pure assertion rather than empirical evidence.
- **Sentinel Rule**: Flagged when a keystone section carries $>70$ load-bearing weight but has $<45\%$ text/goal development.

### 2. Vince Gilligan · Causal Consequence Integrity
- **The Principle**: *Breaking Bad* / *Better Call Saul* writers' room discipline—every dramatic effect must be earned by an antecedent cause. Actions trigger irreversible causal cascades.
- **Sentinel Rule**: Flagged when major turning points or climax convergences lack antecedent setup ($>75$ causal weight $\times$ $<50\%$ development).

### 3. Vladimir Nabokov · Modular Index-Card Mosaic
- **The Principle**: Nabokov composed *Lolita* and *Pale Fire* on 3x5 Bristol index cards, shuffling scenes to ensure every card was woven with recurring motifs, colors, and character perspectives.
- **Sentinel Rule**: Identifies "isolated islands"—chapters that fail to touch or advance any recurring narrative thread or thematic motif.

### 4. Christopher Nolan · Temporal Cross-Cut Velocity
- **The Principle**: Cross-cutting distinct temporal timelines toward a converging climax to heighten dramatic momentum and narrative velocity.
- **Sentinel Rule**: Analyzes chapter pacing rhythm across acts. Detects late-Act II and pre-climax convergence chapters whose text density drops below velocity threshold.

---

## ✦ Proactive Nudges, Open-Aware Logic & Remote Phone Alerts

Writ ensures you never lose momentum on critical chapters:

- **Expanded Cadence Presets**:
  - **Sprints**: `15m` (Active Sprint), `30m` (Standard Focus), `1h` (Deep Session)
  - **Milestones**: `3h` (Half Day), `6h` (Daily Milestone), `12h` (Twice Daily)
  - **Horizons**: `1d` (Daily Sentinel), `3d` (Bi-Weekly Review), `1w` (Weekly Check-In), `2w` (Fortnightly Review)
- **Open-Aware Lapsed Check**:
  If Writ was closed when your reminder interval elapsed, the moment you open the application it calculates the elapsed duration and displays an immediate alert:
  > *"While you were away (3d elapsed) — Gilligan's Law: Section IV (The Turning Point) carries critical causal deficits."*
- **Remote Mobile Push via ntfy.sh (Zero Account Required)**:
  1. Install the free **ntfy** app on iOS or Android.
  2. Subscribe to your private topic: `ntfy.sh/<your-topic>`.
  3. Receive high-priority push notifications directly on your mobile device whenever interval alerts or keystone deficits trigger.
- **Custom Webhooks & Email Gateways**:
  Direct POST webhook payloads to Slack, Discord, Pushover, or Zapier, plus email dispatch options.

---

## ✦ Zero-Attrition 1-Click Multiplatform Publishing

Clicking publish on any supported platform directly creates and launches your work ready for final distribution:

| Platform | 1-Click Action | Delivery Mechanism |
| :--- | :--- | :--- |
| **Obsidian** | `1-Click Save to Vault & Open Live in Obsidian ↗` | Saves `.md` with `[[wikilinks]]` and `.canvas` visual graph directly to vault, then triggers `obsidian://open` |
| **Google Docs** | `1-Click Create & Open Live in Google Docs ↗` | Primes rich Merriweather HTML in clipboard and opens `https://docs.google.com/document/create` |
| **Substack** | `1-Click Launch Ready Draft in Substack ↗` | Primes newsletter draft with `<!-- paywall -->` break and opens Substack post creator |
| **Notion** | `1-Click Publish & Open in Notion ↗` | Calls Notion REST API to create blocks and immediately launches resulting page URL in default browser |
| **Wattpad** | `1-Click Launch Draft in Wattpad ↗` | Formats serialized chapter with Roman numerals & pull quotes and opens Wattpad story creator |
| **LaTeX** | `Download LaTeX (.tex)` | Academic article class with `amsmath`, theorem environments, and KaTeX math compatibility |

---

## ✦ 1-Click Windows Installation (`Install-Writ.bat`)

Writ is packaged as a completely self-contained standalone Windows application (`Writ.exe`) requiring zero terminal knowledge.

### Quick Setup:
1. Double-click **`Install-Writ.bat`**.
2. The script will automatically:
   - Detect the pre-compiled `Writ.exe` binary in `release\win-unpacked\`.
   - Create a desktop shortcut (**`Writ Studio.lnk`**) on your Windows Desktop.
   - Launch Writ Desktop Studio immediately.

### Direct Executable Launch:
Run `release\win-unpacked\Writ.exe` directly from any folder. All project files, drafts, and vault notes are stored locally and safely in `Documents\Writ\data\`.

---

## ✦ Developer Setup (Building from Source)

### Prerequisites
- Node.js 18+ or 20+ (LTS)
- npm or yarn

### Building & Running
```bash
# Clone the official repository
git clone https://github.com/outdatedcaveman/writ.git
cd writ

# Install dependencies
npm install

# Run automated tests (25 tests covering DAG, Sentinel, Publishing, Layout)
node --test tests/*.test.mjs

# Start in development mode with hot reload
npm run dev

# Build production assets
npm run build

# Package standalone Windows executable (Writ.exe)
npx electron-builder --win --dir
```

---

## ✦ Architectural Principles & Safety

- **Rule 1 Safety Trash Compliance**: Permanent file deletion is structurally impossible. All discards route to `data/trash/` with ISO timestamps, atomic recovery metadata, and rollback capabilities.
- **Provider-Agnostic LLM Engine**: Connects to local models via Ollama (`http://localhost:11434`), Anthropic Claude, OpenAI, or Google Gemini with zero proprietary lock-in.
- **Dialectical Inquiry**: Engineered to provoke intellectual resistance, thematic depth, and structural rigor rather than superficial autocomplete.

---

*Writ — Crafted for those who write with architectural intent.*
