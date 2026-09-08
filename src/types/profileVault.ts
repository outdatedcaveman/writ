export interface VaultSample {
  id: string;
  title: string;
  author: "self" | "admired_model";
  authorName: string;
  excerpt: string;
  tags: string[];
  addedAt: number;
  wordCount: number;
}

export interface StylisticProfile {
  personaSummary: string;
  toneDescriptors: string[];
  lexicalHabits: {
    favoriteFormulations: string[];
    avoidPatterns: string[];
    typicalComplexity: "compact" | "erudite" | "lyrical" | "philosophical";
  };
  rhetoricalCadence: {
    sentencePacing: string;
    paragraphDensity: string;
    dialecticPattern: string;
  };
  thematicConvictions: string[];
  syntheticPromptDirectives: string;
  lastTrainedAt: number;
}
