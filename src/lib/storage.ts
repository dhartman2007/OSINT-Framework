import type { ActiveCase, ViewPreferences } from "@/lib/types";

const STORAGE_PREFIX = "osint-local:v1";

const STORAGE_KEYS = {
  favorites: `${STORAGE_PREFIX}:favorites`,
  recent: `${STORAGE_PREFIX}:recent`,
  notes: `${STORAGE_PREFIX}:notes`,
  activeCase: `${STORAGE_PREFIX}:activeCase`,
  viewPreferences: `${STORAGE_PREFIX}:viewPreferences`,
} as const;

const DEFAULT_ACTIVE_CASE: ActiveCase = {
  name: "Case 001",
  summary: "No active summary yet. Add notes to start documenting this case.",
  toolIds: [],
  updatedAt: new Date(0).toISOString(),
};

const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  selectedFilter: "all",
  showFavoritesOnly: false,
  showNotesOnly: false,
  theme: "dark",
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can fail in private browsing or strict policies.
  }
}

export function getFavorites(): string[] {
  const value = readJson<string[]>(STORAGE_KEYS.favorites, []);
  return Array.isArray(value) ? value : [];
}

export function setFavorites(favorites: string[]): void {
  writeJson(STORAGE_KEYS.favorites, favorites);
}

export function getRecentTools(): string[] {
  const value = readJson<string[]>(STORAGE_KEYS.recent, []);
  return Array.isArray(value) ? value : [];
}

export function setRecentTools(toolIds: string[]): void {
  writeJson(STORAGE_KEYS.recent, toolIds.slice(0, 50));
}

export function getToolNotes(): Record<string, string> {
  const value = readJson<Record<string, string>>(STORAGE_KEYS.notes, {});
  return value && typeof value === "object" ? value : {};
}

export function setToolNotes(notes: Record<string, string>): void {
  writeJson(STORAGE_KEYS.notes, notes);
}

export function getActiveCase(): ActiveCase {
  const value = readJson<ActiveCase>(STORAGE_KEYS.activeCase, DEFAULT_ACTIVE_CASE);
  if (!value || typeof value !== "object") return DEFAULT_ACTIVE_CASE;
  return {
    name: typeof value.name === "string" ? value.name : DEFAULT_ACTIVE_CASE.name,
    summary:
      typeof value.summary === "string"
        ? value.summary
        : DEFAULT_ACTIVE_CASE.summary,
    toolIds: Array.isArray(value.toolIds)
      ? value.toolIds.filter((toolId) => typeof toolId === "string")
      : [],
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : DEFAULT_ACTIVE_CASE.updatedAt,
  };
}

export function setActiveCase(activeCase: ActiveCase): void {
  writeJson(STORAGE_KEYS.activeCase, activeCase);
}

export function getViewPreferences(): ViewPreferences {
  const value = readJson<ViewPreferences>(
    STORAGE_KEYS.viewPreferences,
    DEFAULT_VIEW_PREFERENCES
  );

  return {
    selectedCategoryId:
      typeof value.selectedCategoryId === "string"
        ? value.selectedCategoryId
        : undefined,
    selectedFilter:
      value.selectedFilter ?? DEFAULT_VIEW_PREFERENCES.selectedFilter,
    showFavoritesOnly:
      typeof value.showFavoritesOnly === "boolean"
        ? value.showFavoritesOnly
        : DEFAULT_VIEW_PREFERENCES.showFavoritesOnly,
    showNotesOnly:
      typeof value.showNotesOnly === "boolean"
        ? value.showNotesOnly
        : DEFAULT_VIEW_PREFERENCES.showNotesOnly,
    theme: value.theme === "light" ? "light" : "dark",
  };
}

export function setViewPreferences(preferences: ViewPreferences): void {
  writeJson(STORAGE_KEYS.viewPreferences, preferences);
}
