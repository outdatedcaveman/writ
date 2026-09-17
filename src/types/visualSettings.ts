export type EditorAtmosphere = "oled_black" | "paper_noir" | "midnight_slate" | "forest_noir";
export type FontFamilyOption =
  | "source_serif"
  | "eb_garamond"
  | "merriweather"
  | "lora"
  | "literata"
  | "roboto_sans"
  | "inter"
  | "jetbrains_mono"
  | "fira_code"
  | "custom";
export type ColumnWidthOption = "compact" | "standard" | "wide" | "full";

export interface VisualSettings {
  // Atmosphere & Theme
  atmosphere: EditorAtmosphere;
  
  // Typography
  fontFamily: FontFamilyOption;
  customFontName?: string;
  customFontData?: string;
  fontSize: number; // in pixels (14 to 26)
  lineHeight: number; // 1.5, 1.75, 2.0
  columnWidth: ColumnWidthOption;
  
  // Literary Features
  typewriterMode: boolean; // keep active line centered
  focusMode: boolean; // dim non-active paragraphs
  showMathPreview: boolean; // live KaTeX math preview toggle
  showDeliverables: boolean; // show chapter checklist
  showMetrics: boolean; // show pacing metrics drawer
  zenMode: boolean; // hide sidebars for pure writing focus
}

export const defaultVisualSettings: VisualSettings = {
  atmosphere: "oled_black",
  fontFamily: "source_serif",
  fontSize: 18,
  lineHeight: 1.8,
  columnWidth: "standard",
  typewriterMode: false,
  focusMode: false,
  showMathPreview: true,
  showDeliverables: true,
  showMetrics: true,
  zenMode: false
};
