import { ExternalLink, Link2, Plus, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TOOL_TAG_LABELS } from "@/lib/tags";
import type { ResourceItem } from "@/lib/types";

interface ToolDetailPanelProps {
  resource?: ResourceItem;
  note: string;
  isFavorite: boolean;
  onOpenTool: (resource: ResourceItem) => void;
  onCopyUrl: (resource: ResourceItem) => void;
  onAddToCase: (resource: ResourceItem) => void;
  onToggleFavorite: (resource: ResourceItem) => void;
  onNoteChange: (value: string) => void;
  onCloseMobile: () => void;
}

function accessBadgeVariant(accessType: ResourceItem["accessType"]) {
  if (accessType === "free") return "success";
  if (accessType === "freemium") return "info";
  if (accessType === "paid") return "warning";
  return "neutral";
}

export function ToolDetailPanel({
  resource,
  note,
  isFavorite,
  onOpenTool,
  onCopyUrl,
  onAddToCase,
  onToggleFavorite,
  onNoteChange,
  onCloseMobile,
}: ToolDetailPanelProps) {
  if (!resource) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <p className="font-display text-lg text-slate-100">Tool Details</p>
          <p className="max-w-sm text-sm text-slate-400">
            Select a resource card to inspect details, add notes, and pin it to the
            active case.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/70 px-4 py-4">
        <div className="space-y-1">
          <p className="font-display text-lg text-slate-100">{resource.name}</p>
          <p className="break-all font-mono text-xs text-accentBlue">{resource.url}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close details panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => onOpenTool(resource)}>
            <ExternalLink className="h-3.5 w-3.5" />
            Open Tool
          </Button>
          <Button size="sm" variant="outline" onClick={() => onCopyUrl(resource)}>
            <Link2 className="h-3.5 w-3.5" />
            Copy URL
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAddToCase(resource)}>
            <Plus className="h-3.5 w-3.5" />
            Add to Case
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggleFavorite(resource)}>
            <Star className="h-3.5 w-3.5" />
            {isFavorite ? "Favorited" : "Favorite"}
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-border/70 bg-panelAlt/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Summary</p>
          <p className="text-sm text-slate-200">
            {resource.description || "No description available."}
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-border/70 bg-panelAlt/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Metadata</p>
          <div className="space-y-1.5 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-500">Category Path:</span>{" "}
              {resource.categoryPathLabel}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Access Type:</span>{" "}
              <Badge variant={accessBadgeVariant(resource.accessType)}>
                {resource.accessType}
              </Badge>
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Login Required:</span>{" "}
              {resource.loginRequired ? "Yes" : "Unknown / No"}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">API Available:</span>{" "}
              {resource.apiAvailable ? "Yes" : "Unknown / No"}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-border/70 bg-panelAlt/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tags</p>
          <div className="flex flex-wrap gap-2">
            {resource.tags.length > 0 ? (
              resource.tags.map((tag) => (
                <Badge key={`${resource.id}-${tag}`} variant="neutral">
                  {TOOL_TAG_LABELS[tag] ?? tag}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-slate-400">No tags inferred.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Analyst Notes (local)
          </p>
          <Textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Add investigation notes for this resource. Notes stay in localStorage."
          />
        </div>
      </div>
    </div>
  );
}
