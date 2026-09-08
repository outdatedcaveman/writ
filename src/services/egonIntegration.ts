// Integration service with Bruno\x27s central Egon Mind hub

export interface EgonMemoryUpsertParams {
  kind: "fact" | "decision" | "preference" | "skill" | "pattern";
  content: string;
  tags: string[];
}

export class EgonMindService {
  private baseUrl = "http://127.0.0.1:8000/api/v1/mind";
  private isOnlineCache: boolean | null = null;
  private lastCheck = 0;

  public async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (this.isOnlineCache !== null && now - this.lastCheck < 15000) {
      return this.isOnlineCache;
    }
    try {
      const res = await fetch(`${this.baseUrl}/stats`, { method: "GET" });
      this.isOnlineCache = res.ok;
      this.lastCheck = now;
      return res.ok;
    } catch {
      this.isOnlineCache = false;
      this.lastCheck = now;
      return false;
    }
  }

  public async appendActivity(project: string, summary: string, payload?: any): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/activity/append`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          summary,
          payload: payload || {}
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async upsertMemory(params: EgonMemoryUpsertParams): Promise<{ status: string; id?: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/memory/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
      return { status: "error" };
    } catch (e) {
      return { status: "offline" };
    }
  }
}

export const egonService = new EgonMindService();
