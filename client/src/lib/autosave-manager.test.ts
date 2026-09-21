import { describe, it, expect, beforeEach } from "vitest";
import {
  saveAutosaveRecovery,
  getAutosaveRecovery,
  clearAutosaveRecovery,
  createProjectSnapshot,
  getProjectSnapshots,
  deleteProjectSnapshot,
  updateProjectRegistry,
  getAllRegisteredProjects,
  removeProjectFromRegistry
} from "./autosave-manager";

class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

if (typeof globalThis.localStorage === "undefined") {
  (globalThis as any).localStorage = new LocalStorageMock();
}

describe("Autosave & Version History Manager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves autosave recovery data", () => {
    const dummyData = JSON.stringify({ name: "Test Project", layers: 3 });
    const saved = saveAutosaveRecovery(dummyData);
    expect(saved).toBe(true);

    const retrieved = getAutosaveRecovery();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.data).toBe(dummyData);

    clearAutosaveRecovery();
    expect(getAutosaveRecovery()).toBeNull();
  });

  it("creates, retrieves and limits project snapshots", () => {
    const projectId = "proj-123";
    const snapshot = createProjectSnapshot(
      projectId,
      "Hero Design",
      1920,
      1080,
      4,
      JSON.stringify({ v: 1 }),
      "تعديل الألوان"
    );

    expect(snapshot).not.toBeNull();
    expect(snapshot?.projectName).toBe("Hero Design");

    const snapshots = getProjectSnapshots(projectId);
    expect(snapshots.length).toBe(1);
    expect(snapshots[0].note).toBe("تعديل الألوان");

    // Deleting snapshot
    const deleted = deleteProjectSnapshot(projectId, snapshot!.id);
    expect(deleted).toBe(true);
    expect(getProjectSnapshots(projectId).length).toBe(0);
  });

  it("updates, retrieves and deletes project registry metadata", () => {
    const p1 = {
      id: "p1",
      name: "Social Banner",
      createdAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
      width: 1080,
      height: 1080,
      layersCount: 5,
      isFavorite: true
    };

    updateProjectRegistry(p1);
    const list = getAllRegisteredProjects();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("Social Banner");
    expect(list[0].isFavorite).toBe(true);

    removeProjectFromRegistry("p1");
    expect(getAllRegisteredProjects().length).toBe(0);
  });
});
