# Writ · Autonomous Literary Studio & Dialectical Manuscript Engine

> **A professional, visual-first desktop studio for authors, essayists, philosophers, and narrative architects.**

---

## Overview

**Writ** is a desktop application engineered for deep, deliberate long-form writing: philosophical treatises, literary fiction, complex multi-threaded novels, speculative fiction, and dramatic screenplays. 

Unlike conventional word processors that treat writing as a flat sequence of text, Writ treats long-form works as **living structural knowledge systems**:
- **Manuscript Canvas**: Distraction-free typography with custom font library, font file importer (`.ttf`, `.otf`, `.woff2`), KaTeX LaTeX mathematical typesetting, and visual formatting.
- **Narrative Architecture & VCS DAG**: Version control tree with semantic commits, branching exploration, and visual Git diffing.
- **Story Bible & Project Wiki**: Central inquiry, reader promise, dialectical arguments, character dossiers, and dramatic beat maps.
- **Dynamic Relational Graph**: Draggable SVG node-link topology with real tension metrics, dialectical counter-arguments, and direct jump links to manuscript chapters.
- **Panoramic Arc Diagram & Timeline Matrix**: Whole-project panoramic visualization connecting chapters via circular bezier thread arcs, narrative tension curves, and infinite zoom/pan.
- **Vault Auto-Ingestion**: Ingest research notes, images, PDFs, and citations seamlessly via local background folder watchers and external webhooks.
- **Direct Publishing Studio**: Export cleanly to LaTeX, EPUB, and Markdown, or publish directly via live APIs to Notion workspaces, Substack, and serialization platforms.

---

## Core Principles

1. **Zero Permanent Deletion (Safety Trash)**: No project, chapter, character, or research note is ever permanently lost without explicit multi-step human confirmation. All removals are routed to the recoverable Safety Trash Drawer.
2. **Privacy First & Provider-Agnostic AI**: Zero hardcoded personal tokens or proprietary walled gardens. Connect your choice of OpenAI, Anthropic Claude, Google Gemini, local Ollama, or custom MCP servers directly via the visual Settings interface.
3. **100% Visual GUI Control**: Every single capability—from project creation and VCS branching to font loading and API publishing—is operable visually with zero required command-line usage.

---

## Quick Start

### Prerequisites
- Node.js 18+ / 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/writ-studio/writ.git
cd writ

# Install dependencies
npm install

# Launch Vite development server
npm run dev

# Run Electron desktop window
npm run electron:dev
```

### Building Desktop Packages
```bash
# Compile TypeScript and bundle frontend
npm run build

# Package standalone Windows executable (unpacked or installer)
npx electron-builder --win --dir
```
The compiled standalone executable will be located in `release/win-unpacked/Writ.exe`.

---

## Visual Features

### 1. Typography & Custom Font Library
Choose from classic literary typefaces or import any local font file directly:
- **Serif**: Source Serif 4, EB Garamond, Merriweather, Lora, Literata
- **Sans-Serif**: Roboto, Inter
- **Monospace**: JetBrains Mono, Fira Code
- **Custom Font Loader**: Visually upload any `.ttf`, `.otf`, or `.woff2` font from your system. Writ registers the font instantly with the browser's `FontFace` engine.

### 2. Vault Drop Folder Watcher & Webhooks
Drop reference files, research papers, notes, or image inspirations into `data/vault_inbox/`. Writ's background watcher automatically parses the title, extracts content, synthesizes conceptual tags, and places them into your Project Drop Vault.

Alternatively, send payloads to the inbound REST webhook:
```bash
curl -X POST http://127.0.0.1:4000/api/vault/inbound \
  -H "Content-Type: application/json" \
  -d '{"title": "Historical Context", "type": "note", "content": "Primary source excerpt..."}'
```

### 3. Direct Notion & Platform Publishing
- **Direct Notion REST API Publish**: Publish chapters directly into your Notion workspace as real formatted blocks (`heading_1`, `paragraph`, `callout`, `divider`) using your Notion Integration Token and Page ID.
- **Copy for Notion (Rich Markdown)**: Generates clean, native rich Markdown that Notion automatically formats into native blocks when pasted into the browser.
- **Transpilers**: Export full manuscripts with frontmatter to LaTeX (`.tex`), clean HTML5, Markdown (`.md`), or plain text.

### 4. Interactive Draggable Relationship Graph
- Arrange characters, philosophical foils, and dialectical theses on an interactive SVG canvas.
- Drag nodes freely to reveal relational topologies.
- View edge tension badges and click any node to see which chapters in your manuscript mention that character or thesis, with one-click navigation to that section.

### 5. Panoramic Arc Diagram & Timeline
- Contemplates your entire project from Chapter 1 to $N$ across a panoramic canvas.
- Visualizes narrative threads and character journeys as circular bezier arcs connecting chapters.
- Infinite zoom and pan with mouse wheel and toolbar controls.
- Integrated dramatic tension curve calculated from plot beat weights and text density.

---

## AI Agent Integration

Configure your AI provider visually in **Studio Settings → AI Provider Control Center**:
- **OpenAI**: GPT-4o, o1, o3-mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.7 Sonnet
- **Google Gemini**: Gemini 2.0 Flash, Gemini 1.5 Pro
- **Local Ollama**: Llama 3.3, Mistral, DeepSeek-R1 (100% offline, zero network telemetry)
- **Custom / Egon MCP**: Connect to local multi-agent hubs or custom orchestrators.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
