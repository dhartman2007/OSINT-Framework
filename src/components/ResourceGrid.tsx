import { ResourceCard } from "@/components/ResourceCard";
import { EmptyState } from "@/components/EmptyState";
import type { ResourceItem } from "@/lib/types";

interface ResourceGridProps {
  resources: ResourceItem[];
  selectedResourceId?: string;
  favoriteIds: Set<string>;
  onOpenResource: (resource: ResourceItem) => void;
  onCopyUrl: (resource: ResourceItem) => void;
  onToggleFavorite: (resource: ResourceItem) => void;
  onShowDetails: (resource: ResourceItem) => void;
}

export function ResourceGrid({
  resources,
  selectedResourceId,
  favoriteIds,
  onOpenResource,
  onCopyUrl,
  onToggleFavorite,
  onShowDetails,
}: ResourceGridProps) {
  if (resources.length === 0) {
    return (
      <EmptyState
        title="No resources match this view"
        description="Try broadening filters, clearing search, or selecting a different category."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          isFavorite={favoriteIds.has(resource.id)}
          isSelected={selectedResourceId === resource.id}
          onOpen={onOpenResource}
          onCopyUrl={onCopyUrl}
          onToggleFavorite={onToggleFavorite}
          onShowDetails={onShowDetails}
        />
      ))}
    </div>
  );
}
