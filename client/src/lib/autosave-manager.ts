/**
 * ImagePro Studio — Autosave, Snapshots & Version History Manager
 * Non-destructive local project snapshots with timestamping and recovery
 */

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: number;
  dateFormatted: string;
  thumbnail?: string;
  width: number;
  height: number;
  layersCount: number;
  note: string;
  data: string; // Serialized ImageProProjectPackage
}

export interface StoredProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  width: number;
  height: number;
  layersCount: number;
  thumbnail?: string;
  folder?: string;
  isFavorite?: boolean;
  isTrash?: boolean;
}

const AUTOSAVE_STORAGE_KEY = "imagepro_autosave_recovery_v1";
const SNAPSHOTS_KEY_PREFIX = "imagepro_snapshots_";
const PROJECTS_META_KEY = "imagepro_projects_registry_v1";

/**
 * Save crash-recovery autosave state
 */
export function saveAutosaveRecovery(projectDataJson: string): boolean {
  try {
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify({
      savedAt: Date.now(),
      data: projectDataJson
    }));
    return true;
  } catch (err) {
    console.warn("Autosave storage full or quota exceeded", err);
    return false;
  }
}

/**
 * Check if there is an unsaved recovery session
 */
export function getAutosaveRecovery(): { savedAt: number; data: string } | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear recovery state after clean save
 */
export function clearAutosaveRecovery(): void {
  try {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
  } catch {}
}

/**
 * Save a discrete version snapshot for a project
 */
export function createProjectSnapshot(
  projectId: string,
  projectName: string,
  width: number,
  height: number,
  layersCount: number,
  projectDataJson: string,
  note = "حفظ تلقائي دوري",
  thumbnail?: string
): ProjectSnapshot | null {
  try {
    const key = `${SNAPSHOTS_KEY_PREFIX}${projectId}`;
    const raw = localStorage.getItem(key);
    const existing: ProjectSnapshot[] = raw ? JSON.parse(raw) : [];

    const now = new Date();
    const snapshot: ProjectSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      projectName,
      timestamp: Date.now(),
      dateFormatted: now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      thumbnail,
      width,
      height,
      layersCount,
      note,
      data: projectDataJson
    };

    // Keep up to 12 most recent snapshots per project to avoid quota issues
    const updated = [snapshot, ...existing.slice(0, 11)];
    localStorage.setItem(key, JSON.stringify(updated));
    return snapshot;
  } catch (err) {
    console.warn("Could not save snapshot", err);
    return null;
  }
}

/**
 * List all snapshots for a project
 */
export function getProjectSnapshots(projectId: string): ProjectSnapshot[] {
  try {
    const key = `${SNAPSHOTS_KEY_PREFIX}${projectId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Delete a specific snapshot
 */
export function deleteProjectSnapshot(projectId: string, snapshotId: string): boolean {
  try {
    const key = `${SNAPSHOTS_KEY_PREFIX}${projectId}`;
    const existing = getProjectSnapshots(projectId);
    const updated = existing.filter((s) => s.id !== snapshotId);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

/**
 * Register or update project metadata in the Projects Registry
 */
export function updateProjectRegistry(meta: StoredProjectMetadata): void {
  try {
    const raw = localStorage.getItem(PROJECTS_META_KEY);
    const registry: Record<string, StoredProjectMetadata> = raw ? JSON.parse(raw) : {};
    registry[meta.id] = {
      ...registry[meta.id],
      ...meta,
      updatedAt: Date.now()
    };
    localStorage.setItem(PROJECTS_META_KEY, JSON.stringify(registry));
  } catch (err) {
    console.warn("Registry save failed", err);
  }
}

/**
 * Get all registered projects metadata
 */
export function getAllRegisteredProjects(): StoredProjectMetadata[] {
  try {
    const raw = localStorage.getItem(PROJECTS_META_KEY);
    if (!raw) return [];
    const registry: Record<string, StoredProjectMetadata> = JSON.parse(raw);
    return Object.values(registry).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * Delete a project from the registry and remove its snapshots
 */
export function removeProjectFromRegistry(projectId: string): void {
  try {
    const raw = localStorage.getItem(PROJECTS_META_KEY);
    if (raw) {
      const registry: Record<string, StoredProjectMetadata> = JSON.parse(raw);
      delete registry[projectId];
      localStorage.setItem(PROJECTS_META_KEY, JSON.stringify(registry));
    }
    localStorage.removeItem(`${SNAPSHOTS_KEY_PREFIX}${projectId}`);
    localStorage.removeItem(`imagepro_project_${projectId}`);
  } catch {}
}
