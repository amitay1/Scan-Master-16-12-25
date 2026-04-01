export const TECHNIQUE_SHEET_DRAFT_KEY = "techniqueSheet_draft";
export const UPDATE_RECOVERY_KEY = "scanmaster_update_recovery";

export type UpdateRecoveryReason = "manual-install" | "scheduled-restart" | "update-on-quit";

export interface UpdateRecoveryRecord {
  cardName: string;
  savedAt: string;
  reason: UpdateRecoveryReason;
  version?: string;
  activeTab?: string;
  reportMode?: "Technique" | "Report";
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readTechniqueSheetDraft<T = unknown>(): T | null {
  const storage = getStorage();
  const raw = storage?.getItem(TECHNIQUE_SHEET_DRAFT_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeTechniqueSheetDraft(snapshot: unknown): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(TECHNIQUE_SHEET_DRAFT_KEY, JSON.stringify(snapshot));
}

export function clearTechniqueSheetDraft(): void {
  const storage = getStorage();
  storage?.removeItem(TECHNIQUE_SHEET_DRAFT_KEY);
}

export function readUpdateRecoveryRecord(): UpdateRecoveryRecord | null {
  const storage = getStorage();
  const raw = storage?.getItem(UPDATE_RECOVERY_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UpdateRecoveryRecord;
  } catch {
    return null;
  }
}

export function writeUpdateRecoveryRecord(record: UpdateRecoveryRecord): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(UPDATE_RECOVERY_KEY, JSON.stringify(record));
}

export function clearUpdateRecoveryRecord(): void {
  const storage = getStorage();
  storage?.removeItem(UPDATE_RECOVERY_KEY);
}
