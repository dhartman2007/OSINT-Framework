import { ExternalLink, Link2, MoreHorizontal, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TOOL_TAG_LABELS } from "@/lib/tags";
import type { ResourceItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  resource: ResourceItem;
  isFavorite: boolean;
  isSelected: boolean;
  onOpen: (resource: ResourceItem) => void;
  onCopyUrl: (resource: ResourceItem) => void;
  onToggleFavorite: (resource: ResourceItem) => void;
  onShowDetails: (resource: ResourceItem) => void;
}

function badgeVariantForAccess(accessType: ResourceItem["accessType"]) {
  if (accessType === "free") return "success";
  if (accessType === "freemium") return "info";
  if (accessType === "paid") return "warning";
  return "neutral";
}

export function ResourceCard({
  resource,
  isFavorite,
  isSelected,
  onOpen,
  onCopyUrl,
  onToggleFavorite,
  onShowDetails,
}: ResourceCardProps) {
  const topTags = resource.tags.slice(0, 3);

  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-3 p-4 transition-colors",
        isSelected
          ? "border-accentBlue/60 bg-panelAlt/95"
          : "hover:border-slate-500/70 hover:bg-panelAlt/80"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-display text-base text-slate-100">
            {resource.name}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isFavorite ? "text-warning hover:text-yellow-300" : "text-slate-400"
            )}
            onClick={() => onToggleFavorite(resource)}
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          >
            <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>
        </div>

        <p className="truncate font-mono text-xs text-accentBlue">{resource.url}</p>
        <p className="line-clamp-3 text-sm text-slate-300">
          {resource.description || "No description available."}
        </p>
        <p className="line-clamp-2 text-xs text-slate-400">{resource.categoryPathLabel}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant={badgeVariantForAccess(resource.accessType)}>
          {resource.accessType}
        </Badge>
        {resource.loginRequired ? <Badge variant="warning">Login Required</Badge> : null}
        {resource.apiAvailable ? <Badge variant="info">API</Badge> : null}
        {topTags.map((tag) => (
          <Badge key={`${resource.id}-${tag}`} variant="neutral">
            {TOOL_TAG_LABELS[tag] ?? tag}
          </Badge>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button size="sm" onClick={() => onOpen(resource)}>
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </Button>
        <Button size="sm" variant="outline" onClick={() => onCopyUrl(resource)}>
          <Link2 className="h-3.5 w-3.5" />
          Copy URL
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="col-span-2"
          onClick={() => onShowDetails(resource)}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
          More / Details
        </Button>
      </div>
    </Card>
  );
}
