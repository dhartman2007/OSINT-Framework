import { ChevronDown, ChevronRight, FolderTree } from "lucide-react";
import type { CategoryNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryTreeProps {
  rootCategoryIds: string[];
  categoriesById: Map<string, CategoryNode>;
  countsByCategoryId: Record<string, number>;
  selectedCategoryId?: string;
  expandedCategoryIds: Set<string>;
  onToggleExpand: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
}

function CategoryTreeNode({
  categoryId,
  categoriesById,
  countsByCategoryId,
  selectedCategoryId,
  expandedCategoryIds,
  onToggleExpand,
  onSelectCategory,
}: Omit<CategoryTreeProps, "rootCategoryIds"> & { categoryId: string }) {
  const category = categoriesById.get(categoryId);
  if (!category) return null;

  const hasChildren = category.childrenIds.length > 0;
  const isExpanded = expandedCategoryIds.has(category.id);
  const isSelected = selectedCategoryId === category.id;
  const resourceCount = countsByCategoryId[category.id] ?? 0;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "group flex w-full items-center gap-1 rounded-md px-2 py-1 text-left transition-colors",
          isSelected ? "bg-accentBlue/20 text-blue-200" : "hover:bg-panelAlt/80"
        )}
        style={{ paddingLeft: `${0.45 + category.depth * 0.68}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? "Collapse category" : "Expand category"}
            onClick={() => onToggleExpand(category.id)}
            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="h-4 w-4" />
        )}
        <button
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <FolderTree className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate text-sm">{category.name}</span>
        </button>
        <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
          {resourceCount}
        </span>
      </div>

      {hasChildren && isExpanded ? (
        <div className="space-y-1">
          {category.childrenIds.map((childId) => (
            <CategoryTreeNode
              key={childId}
              categoryId={childId}
              categoriesById={categoriesById}
              countsByCategoryId={countsByCategoryId}
              selectedCategoryId={selectedCategoryId}
              expandedCategoryIds={expandedCategoryIds}
              onToggleExpand={onToggleExpand}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CategoryTree({
  rootCategoryIds,
  categoriesById,
  countsByCategoryId,
  selectedCategoryId,
  expandedCategoryIds,
  onToggleExpand,
  onSelectCategory,
}: CategoryTreeProps) {
  return (
    <div className="min-w-0 space-y-1">
      {rootCategoryIds.map((categoryId) => (
        <CategoryTreeNode
          key={categoryId}
          categoryId={categoryId}
          categoriesById={categoriesById}
          countsByCategoryId={countsByCategoryId}
          selectedCategoryId={selectedCategoryId}
          expandedCategoryIds={expandedCategoryIds}
          onToggleExpand={onToggleExpand}
          onSelectCategory={onSelectCategory}
        />
      ))}
    </div>
  );
}
