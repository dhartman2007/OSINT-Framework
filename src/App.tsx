import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FilterChips } from "@/components/FilterChips";
import { ResourceGrid } from "@/components/ResourceGrid";
import { Sidebar } from "@/components/Sidebar";
import { ToolDetailPanel } from "@/components/ToolDetailPanel";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildCategoryResourceCounts, parseArfTree } from "@/lib/parseArf";
import { createResourceSearchIndex, searchResources } from "@/lib/search";
import {
  getActiveCase,
  getFavorites,
  getRecentTools,
  getToolNotes,
  getViewPreferences,
  setActiveCase,
  setFavorites,
  setRecentTools,
  setToolNotes,
  setViewPreferences,
} from "@/lib/storage";
import type {
  ActiveCase,
  CategoryNode,
  ParsedArfTree,
  ResourceFilter,
  ResourceItem,
  ViewPreferences,
} from "@/lib/types";

function matchesResourceFilter(resource: ResourceItem, filter: ResourceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "free" || filter === "freemium" || filter === "paid") {
    return resource.accessType === filter;
  }
  if (filter === "login-required") {
    return resource.loginRequired || resource.tags.includes("login-required");
  }
  if (filter === "api") {
    return resource.apiAvailable || resource.tags.includes("api");
  }
  return resource.tags.includes(filter);
}

function resourceMatchesCategory(
  resource: ResourceItem,
  selectedCategory?: CategoryNode
): boolean {
  if (!selectedCategory) return true;
  return selectedCategory.path.every(
    (segment, index) => resource.categoryPath[index] === segment
  );
}

function getDefaultSelectedCategory(parsed: ParsedArfTree): string | undefined {
  if (!parsed.rootCategoryId) return parsed.categories[0]?.id;
  const categoryMap = new Map(parsed.categories.map((category) => [category.id, category]));
  const root = categoryMap.get(parsed.rootCategoryId);
  if (root?.childrenIds.length) return root.childrenIds[0];
  return parsed.rootCategoryId;
}

export default function App() {
  const [initialPreferences] = useState<ViewPreferences>(() => getViewPreferences());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [rootCategoryId, setRootCategoryId] = useState<string | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    initialPreferences.selectedCategoryId
  );
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<ResourceFilter>(
    initialPreferences.selectedFilter
  );
  const [theme, setTheme] = useState<"dark" | "light">(initialPreferences.theme);
  const [favorites, setFavoritesState] = useState<Set<string>>(
    () => new Set(getFavorites())
  );
  const [recentToolIds, setRecentToolIds] = useState<string[]>(() => getRecentTools());
  const [toolNotes, setToolNotesState] = useState<Record<string, string>>(
    () => getToolNotes()
  );
  const [activeCase, setActiveCaseState] = useState<ActiveCase>(() => getActiveCase());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(
    initialPreferences.showFavoritesOnly
  );
  const [showNotesOnly, setShowNotesOnly] = useState(initialPreferences.showNotesOnly);
  const [showCaseOnly, setShowCaseOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<number | null>(null);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const resourcesById = useMemo(
    () => new Map(resources.map((resource) => [resource.id, resource])),
    [resources]
  );
  const countsByCategoryId = useMemo(
    () => buildCategoryResourceCounts(categories, resources),
    [categories, resources]
  );

  const selectedCategory = selectedCategoryId
    ? categoriesById.get(selectedCategoryId)
    : undefined;
  const selectedResource = selectedResourceId
    ? resourcesById.get(selectedResourceId)
    : undefined;

  const rootCategoryIds = useMemo(() => {
    if (!rootCategoryId) {
      return categories.filter((category) => category.depth === 0).map((category) => category.id);
    }
    const rootCategory = categoriesById.get(rootCategoryId);
    if (rootCategory && rootCategory.childrenIds.length > 0) {
      return rootCategory.childrenIds;
    }
    return categories.filter((category) => category.depth === 0).map((category) => category.id);
  }, [categories, categoriesById, rootCategoryId]);

  const searchIndex = useMemo(() => createResourceSearchIndex(resources), [resources]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = searchQuery.trim();
    const source = normalizedQuery
      ? searchResources(searchIndex, normalizedQuery)
      : resources.filter((resource) =>
          resourceMatchesCategory(resource, selectedCategory)
        );

    const withChips = source.filter((resource) =>
      matchesResourceFilter(resource, selectedFilter)
    );
    const withFavorites = showFavoritesOnly
      ? withChips.filter((resource) => favorites.has(resource.id))
      : withChips;
    const withNotes = showNotesOnly
      ? withFavorites.filter(
          (resource) => (toolNotes[resource.id] ?? "").trim().length > 0
        )
      : withFavorites;
    const withCase = showCaseOnly
      ? withNotes.filter((resource) => activeCase.toolIds.includes(resource.id))
      : withNotes;

    if (normalizedQuery) return withCase;
    return [...withCase].sort((left, right) => left.name.localeCompare(right.name));
  }, [
    activeCase.toolIds,
    favorites,
    resources,
    searchIndex,
    searchQuery,
    selectedCategory,
    selectedFilter,
    showCaseOnly,
    showFavoritesOnly,
    showNotesOnly,
    toolNotes,
  ]);

  const recentResources = useMemo(
    () =>
      recentToolIds
        .map((toolId) => resourcesById.get(toolId))
        .filter((resource): resource is ResourceItem => Boolean(resource))
        .slice(0, 8),
    [recentToolIds, resourcesById]
  );

  useEffect(() => {
    const abortController = new AbortController();

    const loadArfData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/arf.json", {
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Unable to load /arf.json (HTTP ${response.status}).`);
        }

        const raw = await response.json();
        const parsed = parseArfTree(raw);

        setCategories(parsed.categories);
        setResources(parsed.resources);
        setRootCategoryId(parsed.rootCategoryId);

        const validCategoryIds = new Set(parsed.categories.map((category) => category.id));
        const preferredCategory = initialPreferences.selectedCategoryId;
        const fallbackCategory = validCategoryIds.has(preferredCategory ?? "")
          ? preferredCategory
          : getDefaultSelectedCategory(parsed);
        setSelectedCategoryId(fallbackCategory);

        const initialExpanded = new Set(
          parsed.categories
            .filter((category) => category.depth <= 1)
            .map((category) => category.id)
        );
        const categoryMap = new Map(
          parsed.categories.map((category) => [category.id, category])
        );
        let walker = fallbackCategory ? categoryMap.get(fallbackCategory) : undefined;
        while (walker?.parentId) {
          initialExpanded.add(walker.parentId);
          walker = categoryMap.get(walker.parentId);
        }
        if (fallbackCategory) {
          initialExpanded.add(fallbackCategory);
        }
        setExpandedCategoryIds(initialExpanded);
      } catch (caughtError) {
        if (abortController.signal.aborted) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load ARF data."
        );
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadArfData();
    return () => {
      abortController.abort();
    };
  }, [initialPreferences.selectedCategoryId, retryCount]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const pressedShortcut =
        (event.ctrlKey || event.metaKey) && event.key === "/";
      if (!pressedShortcut) return;
      event.preventDefault();
      searchInputRef.current?.focus();
      setSidebarOpen(false);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    setFavorites(Array.from(favorites));
  }, [favorites]);

  useEffect(() => {
    setRecentTools(recentToolIds);
  }, [recentToolIds]);

  useEffect(() => {
    setToolNotes(toolNotes);
  }, [toolNotes]);

  useEffect(() => {
    setActiveCase(activeCase);
  }, [activeCase]);

  useEffect(() => {
    setViewPreferences({
      selectedCategoryId,
      selectedFilter,
      showFavoritesOnly,
      showNotesOnly,
      theme,
    });
  }, [selectedCategoryId, selectedFilter, showFavoritesOnly, showNotesOnly, theme]);

  useEffect(
    () => () => {
      if (statusTimerRef.current !== null) {
        window.clearTimeout(statusTimerRef.current);
      }
    },
    []
  );

  const notify = (message: string) => {
    setStatusMessage(message);
    if (statusTimerRef.current !== null) {
      window.clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
    }, 1800);
  };

  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategoryIds((previous) => {
      const next = new Set(previous);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSidebarOpen(false);
  };

  const handleShowDetails = (resource: ResourceItem) => {
    setSelectedResourceId(resource.id);
    setDetailOpen(true);
  };

  const recordRecentlyOpened = (resourceId: string) => {
    setRecentToolIds((previous) => {
      const next = [resourceId, ...previous.filter((item) => item !== resourceId)];
      return next.slice(0, 50);
    });
  };

  const handleOpenResource = (resource: ResourceItem) => {
    setSelectedResourceId(resource.id);
    setDetailOpen(true);
    recordRecentlyOpened(resource.id);
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  const handleCopyUrl = async (resource: ResourceItem) => {
    try {
      await navigator.clipboard.writeText(resource.url);
      notify(`Copied URL for ${resource.name}`);
    } catch {
      notify("Unable to copy URL in this browser context.");
    }
  };

  const handleToggleFavorite = (resource: ResourceItem) => {
    setFavoritesState((previous) => {
      const next = new Set(previous);
      if (next.has(resource.id)) {
        next.delete(resource.id);
      } else {
        next.add(resource.id);
      }
      return next;
    });
  };

  const handleAddToCase = (resource: ResourceItem) => {
    setActiveCaseState((previous) => {
      if (previous.toolIds.includes(resource.id)) return previous;
      return {
        ...previous,
        toolIds: [...previous.toolIds, resource.id],
        updatedAt: new Date().toISOString(),
      };
    });
    notify(`${resource.name} added to active case.`);
  };

  const handleUpdateCase = (nextCase: ActiveCase) => {
    setActiveCaseState(nextCase);
  };

  const handleNoteChange = (nextNote: string) => {
    if (!selectedResource) return;
    setToolNotesState((previous) => ({
      ...previous,
      [selectedResource.id]: nextNote,
    }));
  };

  const topBar = (
    <TopBar
      searchQuery={searchQuery}
      searchInputRef={searchInputRef}
      theme={theme}
      favoritesActive={showFavoritesOnly}
      notesActive={showNotesOnly}
      casesActive={showCaseOnly}
      onSearchChange={setSearchQuery}
      onToggleFavorites={() => setShowFavoritesOnly((value) => !value)}
      onToggleNotes={() => setShowNotesOnly((value) => !value)}
      onToggleCases={() => setShowCaseOnly((value) => !value)}
      onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );

  const sidebar = (
    <Sidebar
      rootCategoryIds={rootCategoryIds}
      categoriesById={categoriesById}
      countsByCategoryId={countsByCategoryId}
      selectedCategoryId={selectedCategoryId}
      expandedCategoryIds={expandedCategoryIds}
      activeCase={activeCase}
      recentResources={recentResources}
      onToggleExpand={handleToggleExpand}
      onSelectCategory={handleSelectCategory}
      onUpdateCase={handleUpdateCase}
      onCloseMobile={() => setSidebarOpen(false)}
    />
  );

  const mainPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 border-b border-border/70 bg-panel/70 px-4 py-4 lg:px-5">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.24em] text-accentBlue">
            OSINT Framework Local Edition
          </p>
          <h1 className="mt-1 font-display text-2xl text-slate-100">
            {selectedCategory?.name ?? "All Resources"}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            {selectedCategory?.description ||
              "Local-first analyst console backed by public/arf.json."}
          </p>
        </div>

        <FilterChips activeFilter={selectedFilter} onSelectFilter={setSelectedFilter} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>{filteredResources.length} visible resources</span>
          {showFavoritesOnly ? <span>Favorites enabled</span> : null}
          {showNotesOnly ? <span>Notes enabled</span> : null}
          {showCaseOnly ? <span>Case filter enabled</span> : null}
          {statusMessage ? <span className="text-accent">{statusMessage}</span> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 lg:px-5">
        {loading ? (
          <Card className="flex min-h-[220px] items-center justify-center gap-2 bg-panelAlt/60">
            <Loader2 className="h-5 w-5 animate-spin text-accentBlue" />
            <p className="text-sm text-slate-300">Loading ARF resources...</p>
          </Card>
        ) : error ? (
          <Card className="space-y-3 border-danger/60 bg-red-950/20 p-5">
            <p className="font-display text-lg text-red-200">Unable to load `public/arf.json`</p>
            <p className="text-sm text-red-100/85">{error}</p>
            <Button
              variant="danger"
              size="md"
              onClick={() => setRetryCount((value) => value + 1)}
              className="w-fit"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Load
            </Button>
          </Card>
        ) : (
          <ResourceGrid
            resources={filteredResources}
            selectedResourceId={selectedResourceId}
            favoriteIds={favorites}
            onOpenResource={handleOpenResource}
            onCopyUrl={handleCopyUrl}
            onToggleFavorite={handleToggleFavorite}
            onShowDetails={handleShowDetails}
          />
        )}
      </div>
    </div>
  );

  const detailPanel = (
    <ToolDetailPanel
      resource={selectedResource}
      note={selectedResource ? toolNotes[selectedResource.id] ?? "" : ""}
      isFavorite={selectedResource ? favorites.has(selectedResource.id) : false}
      onOpenTool={handleOpenResource}
      onCopyUrl={handleCopyUrl}
      onAddToCase={handleAddToCase}
      onToggleFavorite={handleToggleFavorite}
      onNoteChange={handleNoteChange}
      onCloseMobile={() => setDetailOpen(false)}
    />
  );

  return (
    <AppShell
      topBar={topBar}
      sidebar={sidebar}
      main={mainPanel}
      detail={detailPanel}
      sidebarOpen={sidebarOpen}
      detailOpen={detailOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onCloseDetail={() => setDetailOpen(false)}
    />
  );
}
