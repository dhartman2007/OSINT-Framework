import type { AccessType, RawArfNode, ToolTag } from "@/lib/types";

const ACCESS_FIELDS = ["pricing", "accessType", "access", "cost", "plan"];

export const TOOL_TAG_LABELS: Record<string, string> = {
  "login-required": "Login Required",
  api: "API",
  dorking: "Dorking",
  military: "Military",
  maps: "Maps",
  people: "People",
  breach: "Breach",
  "local-install": "Local Tool",
  deprecated: "Deprecated",
  "invitation-only": "Invite Only",
  "active-opsec": "Active OPSEC",
  "passive-opsec": "Passive OPSEC",
};

function toNormalizedString(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function inferAccessType(node: RawArfNode): AccessType {
  const explicitValue = ACCESS_FIELDS.map(
    (field) => node[field as keyof RawArfNode]
  )
    .map(toNormalizedString)
    .find(Boolean);

  if (!explicitValue) {
    return "unknown";
  }

  if (explicitValue.includes("freemium")) {
    return "freemium";
  }
  if (
    explicitValue.includes("paid") ||
    explicitValue.includes("subscription") ||
    explicitValue.includes("commercial")
  ) {
    return "paid";
  }
  if (explicitValue.includes("free")) {
    return "free";
  }

  return "unknown";
}

export function inferToolTags(
  node: RawArfNode,
  categoryPath: string[],
  resourceName: string,
  url: string,
  description: string
): ToolTag[] {
  const tags = new Set<ToolTag>();
  const searchable = [
    categoryPath.join(" "),
    resourceName,
    url,
    description,
    typeof node.type === "string" ? node.type : "",
  ]
    .join(" ")
    .toLowerCase();

  if (node.registration || node.invitationOnly || resourceName.includes("(R)")) {
    tags.add("login-required");
  }
  if (node.api) {
    tags.add("api");
  }
  if (node.localInstall || resourceName.includes("(T)")) {
    tags.add("local-install");
  }
  if (node.deprecated) {
    tags.add("deprecated");
  }
  if (node.invitationOnly) {
    tags.add("invitation-only");
  }
  if (node.opsec === "active") {
    tags.add("active-opsec");
  }
  if (node.opsec === "passive") {
    tags.add("passive-opsec");
  }

  if (node.googleDork || resourceName.includes("(D)") || searchable.includes("dork")) {
    tags.add("dorking");
  }
  if (
    hasAnyKeyword(searchable, [
      "military",
      "defense",
      "army",
      "navy",
      "air force",
      "intel",
    ])
  ) {
    tags.add("military");
  }
  if (
    hasAnyKeyword(searchable, [
      "maps",
      "map",
      "geospatial",
      "geo",
      "satellite",
      "openstreetmap",
    ])
  ) {
    tags.add("maps");
  }
  if (
    hasAnyKeyword(searchable, [
      "people",
      "person",
      "username",
      "email",
      "phone",
      "identity",
      "social",
    ])
  ) {
    tags.add("people");
  }
  if (
    hasAnyKeyword(searchable, [
      "breach",
      "leak",
      "paste",
      "credential",
      "compromised",
      "haveibeenpwned",
    ])
  ) {
    tags.add("breach");
  }

  return Array.from(tags);
}
