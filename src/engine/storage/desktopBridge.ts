/**
 * Desktop Storage Bridge
 * 
 * Provides unified persistence across:
 * 1. Native Electron Desktop App (direct disk / IPC)
 * 2. External Browser Access (via local HTTP server REST API /api/projects)
 * 3. Graceful fallback to localStorage when disconnected
 */

import { Project, TrashItem } from "../../types/workspace";

declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean;
      getServerInfo: () => Promise<{ port: number; lanIp: string; token: string }>;
      selectDirectory: () => Promise<string | null>;
      saveProjectToDisk: (project: Project) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      loadProjectsFromDisk: () => Promise<Project[]>;
    };
  }
}

export class DesktopBridge {
  private static instance: DesktopBridge;
  private serverBaseUrl: string = "http://localhost:4983";
  private isDesktopApp: boolean = false;

  private constructor() {
    this.isDesktopApp = typeof window !== "undefined" && !!window.electronAPI?.isDesktop;
    if (typeof window !== "undefined") {
      // If running in browser at http://localhost:4983 or LAN IP, use the current origin
      if (window.location.origin.startsWith("http://localhost:") || window.location.origin.startsWith("http://192.168.") || window.location.origin.startsWith("http://127.0.0.1:")) {
        this.serverBaseUrl = window.location.origin;
      }
    }
  }

  public static getInstance(): DesktopBridge {
    if (!DesktopBridge.instance) {
      DesktopBridge.instance = new DesktopBridge();
    }
    return DesktopBridge.instance;
  }

  public isDesktop(): boolean {
    return this.isDesktopApp;
  }

  public getServerBaseUrl(): string {
    return this.serverBaseUrl;
  }

  /**
   * Persists a project to disk.
   */
  public async saveProject(project: Project): Promise<boolean> {
    // 1. Try Native Electron IPC if available
    if (this.isDesktopApp && window.electronAPI?.saveProjectToDisk) {
      try {
        const res = await window.electronAPI.saveProjectToDisk(project);
        if (res.success) return true;
      } catch (e) {
        console.warn("[DesktopBridge] Electron IPC save failed, falling back to HTTP:", e);
      }
    }

    // 2. Try Local Embedded HTTP Server
    try {
      const res = await fetch(`${this.serverBaseUrl}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
      });
      if (res.ok) return true;
    } catch (e) {
      // Local server might be on a different port or in Vite dev mode
      console.warn("[DesktopBridge] HTTP server save failed, keeping in local storage:", e);
    }

    return false;
  }

  /**
   * Loads all projects from disk.
   */
  public async loadProjects(): Promise<Project[] | null> {
    if (this.isDesktopApp && window.electronAPI?.loadProjectsFromDisk) {
      try {
        const projects = await window.electronAPI.loadProjectsFromDisk();
        if (projects && projects.length > 0) return projects;
      } catch (e) {
        console.warn("[DesktopBridge] Electron IPC load failed:", e);
      }
    }

    try {
      const res = await fetch(`${this.serverBaseUrl}/api/projects`);
      if (res.ok) {
        const projects = await res.json();
        if (Array.isArray(projects) && projects.length > 0) {
          return projects;
        }
      }
    } catch (e) {
      // Fall through to localStorage
    }

    return null;
  }

  /**
   * Rule 1: Archives an item to disk Safety Trash
   */
  public async archiveToTrash(item: TrashItem): Promise<boolean> {
    try {
      const res = await fetch(`${this.serverBaseUrl}/api/trash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches the server status (port, LAN IP, uptime)
   */
  public async getServerStatus(): Promise<{ status: string; uptime: number; storagePath: string } | null> {
    try {
      const res = await fetch(`${this.serverBaseUrl}/api/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      return null;
    }
    return null;
  }
}
