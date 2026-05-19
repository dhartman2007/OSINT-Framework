export type AccessType = "free" | "freemium" | "paid" | "unknown";

export type KnownToolTag =
  | "login-required"
  | "api"
  | "dorking"
  | "military"
  | "maps"
  | "people"
  | "breach"
  | "local-install"
  | "deprecated"
  | "invitation-only"
  | "active-opsec"
  | "passive-opsec";

export type ToolTag = KnownToolTag | (string & {});

export type ResourceFilter =
  | "all"
  | "free"
  | "freemium"
  | "paid"
  | "login-required"
  | "api"
  | "dorking"
  | "military"
  | "maps"
  | "people"
  | "breach";

export interface RawArfNode {
  name?: string;
  type?: string;
  url?: string;
  link?: string;
  href?: string;
  description?: string;
  status?: string;
  pricing?: string;
  accessType?: string;
  bestFor?: string;
  input?: string;
  output?: string;
  opsec?: string;
  opsecNote?: string;
  localInstall?: boolean;
  googleDork?: boolean;
  registration?: boolean;
  editUrl?: boolean;
  api?: boolean;
  invitationOnly?: boolean;
  deprecated?: boolean;
  children?: RawArfNode[];
  [key: string]: unknown;
}

export interface CategoryNode {
  id: string;
  name: string;
  path: string[];
  pathLabel: string;
  description?: string;
  parentId?: string;
  depth: number;
  childrenIds: string[];
  order: number;
}

export interface ResourceItem {
  id: string;
  name: string;
  url: string;
  description: string;
  categoryId: string;
  categoryPath: string[];
  categoryPathLabel: string;
  accessType: AccessType;
  tags: ToolTag[];
  loginRequired: boolean;
  apiAvailable: boolean;
  pricingRaw?: string;
  status?: string;
  bestFor?: string;
  input?: string;
  output?: string;
  opsec?: string;
  opsecNote?: string;
  type?: string;
  raw: RawArfNode;
}

export interface ParsedArfTree {
  categories: CategoryNode[];
  resources: ResourceItem[];
  rootCategoryId?: string;
}

export interface ActiveCase {
  name: string;
  summary: string;
  toolIds: string[];
  updatedAt: string;
}

export interface ViewPreferences {
  selectedCategoryId?: string;
  selectedFilter: ResourceFilter;
  showFavoritesOnly: boolean;
  showNotesOnly: boolean;
  theme: "dark" | "light";
}
