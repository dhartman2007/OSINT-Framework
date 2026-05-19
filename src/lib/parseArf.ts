import { inferAccessType, inferToolTags } from "@/lib/tags";
import type {
  CategoryNode,
  ParsedArfTree,
  RawArfNode,
  ResourceItem,
} from "@/lib/types";

const CATEGORY_PATH_SEPARATOR = " / ";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hashString(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function makeCategoryId(path: string[]): string {
  const token = path.map(buildSlug).join("__");
  return `cat_${token || "root"}`;
}

function findResourceUrl(node: RawArfNode): string {
  const candidates = [node.url, node.link, node.href];
  for (const candidate of candidates) {
    const value = toStringValue(candidate);
    if (value) return value;
  }
  return "";
}

function buildResourceDescription(node: RawArfNode): string {
  const description = toStringValue(node.description);
  if (description) return description;

  const fragments: string[] = [];
  const bestFor = toStringValue(node.bestFor);
  const input = toStringValue(node.input);
  const output = toStringValue(node.output);

  if (bestFor) fragments.push(bestFor);
  if (input) fragments.push(`Input: ${input}`);
  if (output) fragments.push(`Output: ${output}`);

  return fragments.join(" ").trim();
}

function buildResourceName(node: RawArfNode, fallbackUrl: string): string {
  const name = toStringValue(node.name);
  if (name) return name;

  try {
    const hostname = new URL(fallbackUrl).hostname;
    if (hostname) return hostname;
  } catch {
    // Ignore URL parse errors and continue to fallback.
  }

  return "Unnamed Resource";
}

export function parseArfTree(raw: unknown): ParsedArfTree {
  if (!isRecord(raw)) {
    throw new Error("ARF data is malformed: expected a JSON object at root.");
  }

  const categoriesById = new Map<string, CategoryNode>();
  const resources: ResourceItem[] = [];
  const resourceIdCount = new Map<string, number>();
  let categoryOrder = 0;
  let rootCategoryId: string | undefined;

  const ensureCategory = (path: string[], description?: string): CategoryNode => {
    const id = makeCategoryId(path);
    const existing = categoriesById.get(id);
    if (existing) {
      if (!existing.description && description) {
        existing.description = description;
      }
      return existing;
    }

    const parentPath = path.slice(0, -1);
    const parentId = parentPath.length > 0 ? makeCategoryId(parentPath) : undefined;
    if (parentPath.length > 0) {
      ensureCategory(parentPath);
    }

    const category: CategoryNode = {
      id,
      name: path[path.length - 1] ?? "Uncategorized",
      path: [...path],
      pathLabel: path.join(CATEGORY_PATH_SEPARATOR),
      description: description || undefined,
      parentId,
      depth: Math.max(0, path.length - 1),
      childrenIds: [],
      order: categoryOrder,
    };
    categoryOrder += 1;
    categoriesById.set(id, category);

    if (parentId) {
      const parent = categoriesById.get(parentId);
      if (parent && !parent.childrenIds.includes(id)) {
        parent.childrenIds.push(id);
      }
    }

    return category;
  };

  const pushResource = (node: RawArfNode, categoryPath: string[], url: string) => {
    const safeCategoryPath = categoryPath.length > 0 ? categoryPath : ["Uncategorized"];
    const category = ensureCategory(safeCategoryPath);
    const name = buildResourceName(node, url);
    const description = buildResourceDescription(node);
    const categoryPathLabel = safeCategoryPath.join(CATEGORY_PATH_SEPARATOR);
    const accessType = inferAccessType(node);
    const tags = inferToolTags(node, safeCategoryPath, name, url, description);
    const loginRequired =
      node.registration === true ||
      node.invitationOnly === true ||
      name.includes("(R)");
    const apiAvailable = node.api === true;

    const seed = `${name}|${url}|${categoryPathLabel}`;
    const baseId = `tool_${buildSlug(name) || "item"}_${hashString(seed)}`;
    const duplicateCount = resourceIdCount.get(baseId) ?? 0;
    resourceIdCount.set(baseId, duplicateCount + 1);
    const id = duplicateCount === 0 ? baseId : `${baseId}_${duplicateCount + 1}`;

    resources.push({
      id,
      name,
      url,
      description,
      categoryId: category.id,
      categoryPath: safeCategoryPath,
      categoryPathLabel,
      accessType,
      tags,
      loginRequired,
      apiAvailable,
      pricingRaw: toStringValue(node.pricing),
      status: toStringValue(node.status),
      bestFor: toStringValue(node.bestFor),
      input: toStringValue(node.input),
      output: toStringValue(node.output),
      opsec: toStringValue(node.opsec),
      opsecNote: toStringValue(node.opsecNote),
      type: toStringValue(node.type),
      raw: node,
    });
  };

  const visit = (value: unknown, currentCategoryPath: string[]) => {
    if (!isRecord(value)) return;
    const node = value as RawArfNode;
    const name = toStringValue(node.name);
    const hasChildren = Array.isArray(node.children);
    const url = findResourceUrl(node);

    let categoryPath = currentCategoryPath;
    if (hasChildren) {
      const fallbackName = name || "Unnamed Category";
      categoryPath = [...currentCategoryPath, fallbackName];
      const category = ensureCategory(categoryPath, toStringValue(node.description));
      if (!rootCategoryId && category.depth === 0) {
        rootCategoryId = category.id;
      }
    }

    if (url) {
      pushResource(node, categoryPath, url);
    }

    if (hasChildren) {
      for (const child of node.children ?? []) {
        visit(child, categoryPath);
      }
    }
  };

  visit(raw, []);

  const categories = Array.from(categoriesById.values()).sort(
    (left, right) => left.order - right.order
  );
  if (!rootCategoryId && categories.length > 0) {
    rootCategoryId = categories[0].id;
  }

  return {
    categories,
    resources,
    rootCategoryId,
  };
}

export function buildCategoryResourceCounts(
  categories: CategoryNode[],
  resources: ResourceItem[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  const pathToId = new Map<string, string>(
    categories.map((category) => [category.pathLabel, category.id])
  );

  for (const resource of resources) {
    for (let depth = 1; depth <= resource.categoryPath.length; depth += 1) {
      const pathLabel = resource.categoryPath
        .slice(0, depth)
        .join(CATEGORY_PATH_SEPARATOR);
      const categoryId = pathToId.get(pathLabel);
      if (!categoryId) continue;
      counts[categoryId] = (counts[categoryId] ?? 0) + 1;
    }
  }

  return counts;
}
