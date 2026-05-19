import { useState } from "react";
import { ChevronLeft, FileText, Layers } from "lucide-react";
import { CategoryTree } from "@/components/CategoryTree";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActiveCase, CategoryNode, ResourceItem } from "@/lib/types";

interface SidebarProps {
  rootCategoryIds: string[];
  categoriesById: Map<string, CategoryNode>;
  countsByCategoryId: Record<string, number>;
  selectedCategoryId?: string;
  expandedCategoryIds: Set<string>;
  activeCase: ActiveCase;
  recentResources: ResourceItem[];
  onToggleExpand: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onUpdateCase: (next: ActiveCase) => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  rootCategoryIds,
  categoriesById,
  countsByCategoryId,
  selectedCategoryId,
  expandedCategoryIds,
  activeCase,
  recentResources,
  onToggleExpand,
  onSelectCategory,
  onUpdateCase,
  onCloseMobile,
}: SidebarProps) {
  const [editingCase, setEditingCase] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-3 py-3 lg:px-4">
        <div>
          <p className="font-display text-sm tracking-wide text-slate-200">Categories</p>
          <p className="text-xs text-slate-400">Recursive ARF tree</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Close sidebar"
          onClick={onCloseMobile}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pl-2 pr-1 py-3 lg:pl-3 lg:pr-2">
        <CategoryTree
          rootCategoryIds={rootCategoryIds}
          categoriesById={categoriesById}
          countsByCategoryId={countsByCategoryId}
          selectedCategoryId={selectedCategoryId}
          expandedCategoryIds={expandedCategoryIds}
          onToggleExpand={onToggleExpand}
          onSelectCategory={onSelectCategory}
        />
      </div>

      <div className="shrink-0 border-t border-border/70 p-3">
        <Card className="space-y-3 bg-panelAlt/80 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm text-slate-100">Case Mode</p>
              <p className="text-xs text-slate-400">
                Active placeholder saved locally
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCase((value) => !value)}
            >
              {editingCase ? "Done" : "Edit"}
            </Button>
          </div>

          {editingCase ? (
            <div className="space-y-2">
              <Input
                value={activeCase.name}
                onChange={(event) =>
                  onUpdateCase({
                    ...activeCase,
                    name: event.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                placeholder="Case name"
              />
              <Textarea
                value={activeCase.summary}
                onChange={(event) =>
                  onUpdateCase({
                    ...activeCase,
                    summary: event.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="min-h-24"
                placeholder="Case summary"
              />
            </div>
          ) : (
            <div className="space-y-2 rounded-md border border-border/60 bg-panel/70 p-2">
              <p className="text-sm font-medium text-slate-100">{activeCase.name}</p>
              <p className="line-clamp-3 text-xs text-slate-300">{activeCase.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="rounded-md border border-border/60 bg-panel/70 p-2">
              <p className="mb-1 flex items-center gap-1 text-slate-400">
                <Layers className="h-3.5 w-3.5" />
                Tools in Case
              </p>
              <p className="font-mono text-base text-slate-100">{activeCase.toolIds.length}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-panel/70 p-2">
              <p className="mb-1 flex items-center gap-1 text-slate-400">
                <FileText className="h-3.5 w-3.5" />
                Recent Opens
              </p>
              <p className="font-mono text-base text-slate-100">{recentResources.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
