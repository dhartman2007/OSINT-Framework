import Fuse, { type IFuseOptions } from "fuse.js";
import type { ResourceItem } from "@/lib/types";

const FUSE_OPTIONS: IFuseOptions<ResourceItem> = {
  includeScore: true,
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "name", weight: 0.32 },
    { name: "url", weight: 0.18 },
    { name: "description", weight: 0.18 },
    { name: "categoryPathLabel", weight: 0.14 },
    { name: "tags", weight: 0.12 },
    { name: "accessType", weight: 0.06 },
  ],
};

export function createResourceSearchIndex(
  resources: ResourceItem[]
): Fuse<ResourceItem> {
  return new Fuse(resources, FUSE_OPTIONS);
}

export function searchResources(
  fuse: Fuse<ResourceItem>,
  query: string
): ResourceItem[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return fuse.getIndex().docs as ResourceItem[];
  }

  return fuse.search(normalizedQuery).map((result) => result.item);
}
