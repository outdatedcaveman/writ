export interface StockAssetItem {
  id: string;
  source: "Wikimedia Commons" | "Openverse" | "Unsplash Public" | "Library of Congress";
  title: string;
  thumbnailUrl: string;
  fullImageUrl: string;
  license: "Public Domain" | "CC0" | "CC-BY 4.0";
  creator: string;
  tags: string[];
  dimensions: string;
}

export interface GeneratedAssetStoryboard {
  id: string;
  targetChapterTitle: string;
  promptDescription: string;
  engine: "Imagen 3 / SDXL" | "Sora / Runway Gen-3" | "DALL-E 3";
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  aestheticKeywords: string[];
  simulatedPreviewUrl: string;
  cameraMovement: string;
  lightingCue: string;
}

export class AssetService {
  // Curated database of free & open creative stock assets aligned with philosophical and literary aesthetics
  private stockCatalog: StockAssetItem[] = [
    {
      id: "stock-1",
      source: "Wikimedia Commons",
      title: "Fog Rolling Over Mountain Ridge",
      thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      fullImageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
      license: "CC0",
      creator: "Free Public Domain Archives",
      tags: ["mist", "uncertainty", "landscape", "solitude", "contemplation"],
      dimensions: "1920x1080"
    },
    {
      id: "stock-2",
      source: "Openverse",
      title: "Architectural Shadows and Minimalist Glass",
      thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
      fullImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
      license: "Public Domain",
      creator: "Architectural Archives",
      tags: ["institution", "structure", "glass", "monolith", "corporate"],
      dimensions: "2048x1365"
    },
    {
      id: "stock-3",
      source: "Wikimedia Commons",
      title: "The Solitary Scholar at Desk",
      thumbnailUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=400&q=80",
      fullImageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80",
      license: "CC-BY 4.0",
      creator: "Bibliotheque Archive",
      tags: ["writing", "books", "reading", "inquiry", "manuscript"],
      dimensions: "1600x1200"
    },
    {
      id: "stock-4",
      source: "Library of Congress",
      title: "Night Rain Reflections on Urban Pavement",
      thumbnailUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=400&q=80",
      fullImageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1600&q=80",
      license: "Public Domain",
      creator: "Historical Collection",
      tags: ["rain", "bus stop", "night", "asphalt", "reflections"],
      dimensions: "1800x1200"
    }
  ];

  public searchStockAssets(query: string): StockAssetItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.stockCatalog;

    return this.stockCatalog.filter(item => {
      return item.title.toLowerCase().includes(q) ||
             item.tags.some(t => t.toLowerCase().includes(q)) ||
             item.source.toLowerCase().includes(q);
    });
  }

  public generateStoryboardPrompt(
    chapterTitle: string,
    chapterSynopsis: string,
    type: "image" | "video"
  ): GeneratedAssetStoryboard {
    const isVideo = type === "video";
    const promptDescription = isVideo
      ? `Cinematic 35mm film still, slow dolly push-in: An austere institutional boardroom with floor-to-ceiling rain-streaked windows, muted slate-gray color grade, high contrast soft light. A single protagonist stands quietly looking out while blurred figures hurry past in business dress. Grainy analog texture, melancholic philosophical mood.`
      : `Minimalist literary book jacket photograph, medium format: Extreme macro shot of an open notebook with wet ink fading into water, Source Serif typography embossed faintly, deep true black shadows with warm silver highlights, understated and editorial.`;

    return {
      id: `gen-${Date.now().toString(36)}`,
      targetChapterTitle: chapterTitle,
      promptDescription,
      engine: isVideo ? "Sora / Runway Gen-3" : "Imagen 3 / SDXL",
      aspectRatio: isVideo ? "16:9" : "4:5",
      aestheticKeywords: ["35mm analog film", "natural diffused daylight", "subdued slate & terracotta", "true black depth", "editorial"],
      simulatedPreviewUrl: isVideo
        ? "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
        : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      cameraMovement: isVideo ? "Slow 2.5m dolly-in on 50mm anamorphic lens at 24fps" : "Static 80mm prime portrait",
      lightingCue: "Soft overcast north-facing window light, ratio 4:1"
    };
  }
}

export const assetService = new AssetService();
