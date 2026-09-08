import katex from "katex";

export function renderLatexInText(rawText: string): string {
  if (!rawText) return "";

  // Replace block math $$...$$
  let processed = rawText.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<div class="text-red-400 font-mono text-xs">LaTeX Error: ${math}</div>`;
    }
  });

  // Replace inline math $...$
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="text-red-400 font-mono text-xs">${math}</span>`;
    }
  });

  return processed;
}
