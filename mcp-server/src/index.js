#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_ARF_PATH = path.resolve(
  process.env.ARF_JSON_PATH ||
    path.join(process.cwd(), "..", "public", "arf.json")
);

function readArf() {
  const raw = fs.readFileSync(DEFAULT_ARF_PATH, "utf8");
  return JSON.parse(raw);
}

function walk(node, pathParts = [], results = []) {
  const currentPath = [...pathParts, node.name ?? "(missing name)"];

  if (node.type === "url") {
    results.push({
      name: node.name ?? "(missing name)",
      url: node.url ?? "",
      path: pathParts.join(" > "),
      description: node.description ?? "",
      bestFor: node.bestFor ?? "",
      pricing: node.pricing ?? "missing",
      status: node.status ?? "missing",
      input: node.input ?? "missing",
      output: node.output ?? "missing",
      opsec: node.opsec ?? "missing",
      opsecNote: node.opsecNote ?? "missing",
      localInstall: node.localInstall ?? false,
      api: node.api ?? false,
      registration: node.registration ?? false,
      deprecated: node.deprecated ?? false,
      googleDork: node.googleDork ?? false,
      editUrl: node.editUrl ?? false,
      invitationOnly: node.invitationOnly ?? false,
    });
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child, currentPath, results);
    }
  }

  return results;
}

function flattenResources(root) {
  return walk(root);
}

function getRootValidation(root, resources) {
  const rootChildren = Array.isArray(root.children) ? root.children : [];

  const result = {
    rootName: root.name ?? "(missing name)",
    rootType: root.type ?? "(missing type)",
    arfPath: DEFAULT_ARF_PATH,
    totalRootChildren: rootChildren.length,
    topLevelFolderCount: rootChildren.filter((c) => c.type === "folder").length,
    topLevelUrlCount: rootChildren.filter((c) => c.type === "url").length,
    topLevelMissingTypeCount: rootChildren.filter((c) => c.type === undefined)
      .length,
    totalRecursiveUrlCount: resources.length,
  };

  result.checksum =
    result.topLevelFolderCount +
    result.topLevelUrlCount +
    result.topLevelMissingTypeCount;

  result.checksumOk = result.checksum === result.totalRootChildren;

  return result;
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function textOf(resource) {
  return [
    resource.path,
    resource.name,
    resource.description,
    resource.bestFor,
    resource.input,
    resource.output,
    resource.opsec,
    resource.opsecNote,
  ]
    .join(" ")
    .toLowerCase();
}

function scenarioText(options = {}) {
  return [
    options.targetType,
    options.targetName,
    options.location,
    options.scenario,
    ...(Array.isArray(options.priorities) ? options.priorities : []),
  ]
    .join(" ")
    .toLowerCase();
}

const bucketLabels = {
  username: "Username investigation",
  email: "Email discovery / verification",
  domain_dns: "Domain and DNS research",
  social: "Social networks / messaging",
  public_records: "Public records / business / compliance",
  transportation: "Transportation",
  geolocation_maps: "Geolocation and maps",
  weather_public_safety_local: "Weather / public safety / local awareness",
  military: "Military / defense-related OSINT",
  opsec: "OPSEC and privacy",
};

const bucketLimits = {
  username: 1,
  email: 2,
  domain_dns: 1,
  social: 1,
  public_records: 1,
  transportation: 1,
  geolocation_maps: 2,
  weather_public_safety_local: 2,
  military: 1,
  opsec: 1,
};

const bucketPreferredTerms = {
  username: [
    "username enumeration",
    "username",
    "social media accounts",
    "profile discovery",
    "account discovery",
  ],
  email: [
    "email search",
    "email verification",
    "reverse email",
    "email reputation",
    "email address",
  ],
  domain_dns: [
    "whois",
    "dns",
    "subdomain",
    "domain intelligence",
    "rdap",
    "passive dns",
  ],
  social: [
    "social networks",
    "profile",
    "social media",
    "account discovery",
  ],
  public_records: [
    "public records",
    "court",
    "property",
    "business records",
    "company",
  ],
  transportation: [
    "ais",
    "ads-b",
    "aircraft",
    "marine",
    "vessel",
    "ship",
    "vin",
    "rail",
  ],
  geolocation_maps: [
    "map",
    "geolocation",
    "coordinates",
    "imagery",
    "satellite",
    "tower",
    "terrain",
  ],
  weather_public_safety_local: [
    "weather",
    "hurricane",
    "storm",
    "radar",
    "alert",
    "warning",
    "emergency",
    "public safety",
    "noaa",
    "nws",
    "outage",
    "beach",
  ],
  military: [
    "military",
    "defense",
    "satellite",
    "imagery",
    "aircraft",
    "vessel",
    "facility",
  ],
  opsec: [
    "opsec",
    "privacy",
    "browser",
    "vpn",
    "tor",
    "proxy",
    "metadata",
    "anonym",
  ],
};

const bucketDefs = {
  username: (r) => r.path.includes("Username"),

  email: (r) => r.path.includes("Email Address"),

  domain_dns: (r) => r.path.includes("Domain Name"),

  social: (r) =>
    r.path.includes("Social Networks") || r.path.includes("Instant Messaging"),

  public_records: (r) =>
    r.path.includes("Public Records") ||
    r.path.includes("Business Records") ||
    r.path.includes("Compliance"),

  transportation: (r) => r.path.includes("Transportation"),

  geolocation_maps: (r) => r.path.includes("Geolocation Tools / Maps"),

  weather_public_safety_local: (r) => {
    const t = textOf(r);
    return [
      "weather",
      "storm",
      "hurricane",
      "tornado",
      "flood",
      "emergency management",
      "disaster",
      "public safety",
      "alert",
      "warning",
      "radar",
      "noaa",
      "nws",
      "marine forecast",
      "maritime",
      "coast guard",
      "wildfire",
      "air quality",
      "power outage",
      "outage",
      "beach",
      "county emergency",
    ].some((term) => t.includes(term));
  },

  military: (r) => r.path.includes("Military"),

  opsec: (r) => {
    const t = textOf(r);
    return (
      r.path.includes("OpSec") ||
      [
        "privacy",
        "opsec",
        "anonymous",
        "attribution",
        "browser",
        "vpn",
        "tor",
        "proxy",
        "burner",
        "compartment",
      ].some((term) => t.includes(term))
    );
  },
};

function scoreTool(resource) {
  let score = 0;

  if (resource.deprecated !== true) score += 10;
  if (normalizeText(resource.opsec) === "passive") score += 8;
  if (resource.registration !== true) score += 5;
  if (resource.api !== true) score += 3;
  if (resource.pricing === "free") score += 4;
  if (resource.pricing === "freemium") score += 2;
  if (resource.localInstall === true) score += 1;
  if (resource.status === "live") score += 2;

  return score;
}

function compactTool(resource) {
  return {
    name: resource.name,
    path: resource.path,
    url: resource.url,
    description: resource.description || "missing",
    bestFor: resource.bestFor || "missing",
    pricing: resource.pricing,
    status: resource.status,
    input: resource.input,
    output: resource.output,
    opsec: resource.opsec,
    opsecNote: resource.opsecNote,
    localInstall: resource.localInstall,
    api: resource.api,
    registration: resource.registration,
    deprecated: resource.deprecated,
    score: scoreTool(resource),
  };
}

function scenarioBoost(resource, bucket, context) {
  let score = 0;
  const t = textOf(resource);
  const s = scenarioText(context);

  if (
    s.includes("gulf shores") ||
    s.includes("alabama") ||
    s.includes("gulf coast") ||
    s.includes("coastal")
  ) {
    if (bucket === "transportation") {
      for (const term of [
        "ais",
        "vessel",
        "ship",
        "marine",
        "maritime",
        "fishing",
        "nautical",
        "coast",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }

    if (bucket === "weather_public_safety_local") {
      for (const term of [
        "weather",
        "hurricane",
        "storm",
        "radar",
        "noaa",
        "nws",
        "warning",
        "alert",
        "forecast",
        "flood",
        "beach",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }

    if (bucket === "geolocation_maps") {
      for (const term of [
        "map",
        "imagery",
        "satellite",
        "coordinates",
        "terrain",
        "earth",
      ]) {
        if (t.includes(term)) score += 6;
      }
    }
  }

  if (String(context.targetType).toLowerCase() === "person") {
    if (bucket === "username") {
      for (const term of [
        "username",
        "profile",
        "social media",
        "people search",
        "account discovery",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }

    if (bucket === "email") {
      for (const term of [
        "reverse email",
        "email reputation",
        "email search",
        "email address",
        "breach",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }

    if (bucket === "public_records") {
      for (const term of [
        "public records",
        "court",
        "criminal",
        "property",
        "people search",
        "background",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }

    if (bucket === "social") {
      for (const term of [
        "social media",
        "profile",
        "facebook",
        "instagram",
        "linkedin",
        "account",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }
  }

  if (
    String(context.targetType).toLowerCase() === "domain" ||
    String(context.targetType).toLowerCase() === "organization"
  ) {
    if (bucket === "domain_dns") {
      for (const term of [
        "whois",
        "dns",
        "subdomain",
        "passive dns",
        "rdap",
        "domain intelligence",
        "infrastructure",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }

    if (bucket === "public_records") {
      for (const term of [
        "business",
        "company",
        "annual report",
        "corporate",
        "sec",
        "registration",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }
  }

  if (
    s.includes("maritime") ||
    s.includes("marine") ||
    s.includes("vessel") ||
    s.includes("ship") ||
    s.includes("ais")
  ) {
    if (bucket === "transportation" || bucket === "weather_public_safety_local") {
      for (const term of [
        "ais",
        "marine",
        "maritime",
        "vessel",
        "ship",
        "coast",
        "nautical",
      ]) {
        if (t.includes(term)) score += 8;
      }
    }
  }

  if (
    s.includes("person") ||
    s.includes("people") ||
    s.includes("social") ||
    s.includes("username")
  ) {
    if (
      bucket === "username" ||
      bucket === "email" ||
      bucket === "public_records" ||
      bucket === "social"
    ) {
      score += 10;
    }
  }

  if (s.includes("opsec") || s.includes("privacy")) {
    if (bucket === "opsec") {
      score += 12;
    }
  }

  return score;
}

function scoreForBucket(resource, bucket, context = {}) {
  let score = scoreTool(resource);
  const terms = bucketPreferredTerms[bucket] ?? [];
  const t = textOf(resource);

  for (const term of terms) {
    if (t.includes(term)) score += 6;
  }

  score += scenarioBoost(resource, bucket, context);

  const s = scenarioText(context);
  const recoveryTerms = [
    "recovery",
    "password reset",
    "login",
    "identify endpoint",
    "account recovery",
  ];
  if (
    !s.includes("account recovery") &&
    recoveryTerms.some((term) => t.includes(term))
  ) {
    score -= 12;
  }

  if (bucket === "opsec") {
    const darkNetworkTerms = ["i2p", "darknet", "onion", "hidden service"];
    if (
      !s.includes("i2p") &&
      !s.includes("dark web") &&
      darkNetworkTerms.some((term) => t.includes(term))
    ) {
      score -= 8;
    }

    const practicalOpsecTerms = [
      "browser",
      "metadata",
      "privacy",
      "vpn",
      "proxy",
      "tor browser",
      "evidence",
      "capture",
    ];
    for (const term of practicalOpsecTerms) {
      if (t.includes(term)) score += 5;
    }
  }

  return score;
}

function selectBest(
  matches,
  limit,
  bucket,
  context = {},
  selectedUrls = new Set()
) {
  const ranked = [...matches]
    .sort((a, b) => {
      const scoreDiff =
        scoreForBucket(b, bucket, context) - scoreForBucket(a, bucket, context);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.name).localeCompare(String(b.name));
    })
    .map((resource) => ({
      resource,
      normalizedUrl: normalizeText(resource.url),
    }));

  const unused = ranked.filter(
    ({ normalizedUrl }) => !normalizedUrl || !selectedUrls.has(normalizedUrl)
  );
  const reuse = ranked.filter(
    ({ normalizedUrl }) => normalizedUrl && selectedUrls.has(normalizedUrl)
  );
  const selected =
    unused.length >= limit
      ? unused.slice(0, limit)
      : [...unused, ...reuse].slice(0, limit);

  return selected.map(({ resource }) => compactTool(resource));
}

function buildBucketPlan(resources, options = {}) {
  const scenarioContext = {
    targetType: String(options.targetType ?? "general").toLowerCase(),
    targetName: String(options.targetName ?? ""),
    location: String(options.location ?? ""),
    scenario: String(options.scenario ?? ""),
    priorities: Array.isArray(options.priorities)
      ? options.priorities.map(String)
      : [],
  };

  const bucketCoverage = {};
  const finalToolTable = [];
  const selectedUrls = new Set();

  for (const [bucket, predicate] of Object.entries(bucketDefs)) {
    const matches = resources.filter(predicate);
    const limit = bucketLimits[bucket] ?? 1;

    const selected = selectBest(
      matches,
      limit,
      bucket,
      scenarioContext,
      selectedUrls
    );

    bucketCoverage[bucket] = {
      label: bucketLabels[bucket],
      matchCount: matches.length,
      selectedCount: selected.length,
      selectedToolNames: selected.map((r) => r.name),
    };

    for (const r of selected) {
      if (r.url) selectedUrls.add(normalizeText(r.url));
      finalToolTable.push({
        bucket,
        bucketLabel: bucketLabels[bucket],
        ...r,
      });
    }
  }

  return {
    scenarioContext,
    bucketCoverage,
    finalToolTable,
    validationChecks: {
      finalToolCount: finalToolTable.length,
      transportationCovered:
        bucketCoverage.transportation.matchCount === 0 ||
        finalToolTable.some((r) => r.bucket === "transportation"),
      geolocationCovered:
        bucketCoverage.geolocation_maps.matchCount === 0 ||
        finalToolTable.some((r) => r.bucket === "geolocation_maps"),
      militaryCovered:
        bucketCoverage.military.matchCount === 0 ||
        finalToolTable.some((r) => r.bucket === "military"),
      opsecCovered:
        bucketCoverage.opsec.matchCount === 0 ||
        finalToolTable.some((r) => r.bucket === "opsec"),
    },
    scoringNotes: [
      "Base scoring favors live, non-deprecated, passive, free/freemium, no-registration tools.",
      "Bucket-specific preferred terms are applied before final selection.",
      "Scenario terms are used to bias selections when targetType, location, scenario, or priorities are provided.",
      "Duplicate URLs are avoided across buckets when alternatives are available.",
    ],
  };
}

function searchResources(resources, args = {}) {
  const query = normalizeText(args.query);
  const categoryPath = normalizeText(args.categoryPath);
  const opsec = normalizeText(args.opsec);
  const pricing = normalizeText(args.pricing);
  const includeDeprecated = Boolean(args.includeDeprecated);
  const limit = Math.min(Number(args.limit ?? 20), 50);

  const terms = query
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const matches = resources
    .filter((r) => includeDeprecated || r.deprecated !== true)
    .filter((r) => {
      if (!categoryPath) return true;
      return normalizeText(r.path).includes(categoryPath);
    })
    .filter((r) => {
      if (!opsec) return true;
      return normalizeText(r.opsec) === opsec;
    })
    .filter((r) => {
      if (!pricing) return true;
      return normalizeText(r.pricing) === pricing;
    })
    .filter((r) => {
      if (terms.length === 0) return true;
      const text = textOf(r);
      return terms.every((term) => text.includes(term));
    })
    .sort((a, b) => scoreTool(b) - scoreTool(a))
    .slice(0, limit)
    .map(compactTool);

  return {
    query: args.query ?? "",
    categoryPath: args.categoryPath ?? "",
    opsec: args.opsec ?? "",
    pricing: args.pricing ?? "",
    includeDeprecated,
    count: matches.length,
    results: matches,
  };
}

function getCategorySummary(root) {
  const children = Array.isArray(root.children) ? root.children : [];

  function countUrls(node) {
    let count = node.type === "url" ? 1 : 0;
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        count += countUrls(child);
      }
    }
    return count;
  }

  return children.map((child) => {
    const directChildren = Array.isArray(child.children) ? child.children : [];
    return {
      category: child.name ?? "(missing name)",
      type: child.type ?? "(missing type)",
      directFolders: directChildren.filter((c) => c.type === "folder").length,
      directResources: directChildren.filter((c) => c.type === "url").length,
      missingTypeChildren: directChildren.filter((c) => c.type === undefined)
        .length,
      totalRecursiveResources: countUrls(child),
    };
  });
}

function loadContext() {
  const root = readArf();
  const resources = flattenResources(root);
  return { root, resources };
}

function asJsonContent(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

const server = new Server(
  {
    name: "local-osint-framework",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "validate_arf",
        description:
          "Validate the local OSINT Framework arf.json root schema and resource count.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "category_summary",
        description:
          "Return top-level OSINT Framework categories with direct and recursive resource counts.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "search_osint_tools",
        description:
          "Search local OSINT Framework tools by query, category path, OPSEC level, and pricing.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Search terms matched against name, path, description, input, output, and OPSEC notes.",
            },
            categoryPath: {
              type: "string",
              description:
                "Optional category path filter, e.g. Username, Domain Name, Transportation, Military.",
            },
            opsec: {
              type: "string",
              description: "Optional OPSEC filter, e.g. passive or active.",
            },
            pricing: {
              type: "string",
              description: "Optional pricing filter, e.g. free, freemium, paid.",
            },
            includeDeprecated: {
              type: "boolean",
              description: "Include deprecated resources if true.",
            },
            limit: {
              type: "number",
              description: "Maximum results to return, capped at 50.",
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "build_osint_bucket_plan",
        description:
          "Build a balanced passive-first OSINT plan, optionally biased by target type, location, scenario, and priorities.",
        inputSchema: {
          type: "object",
          properties: {
            targetType: {
              type: "string",
              description:
                "Optional target type, e.g. person, domain, organization, location, vehicle, vessel, aircraft, or general.",
            },
            targetName: {
              type: "string",
              description: "Optional target name or primary subject label.",
            },
            location: {
              type: "string",
              description: "Optional location context used to bias local tooling.",
            },
            scenario: {
              type: "string",
              description:
                "Optional scenario narrative used to bias tool selections.",
            },
            priorities: {
              type: "array",
              items: { type: "string" },
              description:
                "Optional priority tags to emphasize in scoring, e.g. maritime, social, opsec.",
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "get_tool_by_name",
        description:
          "Find exact or partial tool name matches in the local OSINT Framework.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Tool name or partial name.",
            },
            limit: {
              type: "number",
              description: "Maximum matches to return, capped at 20.",
            },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const { root, resources } = loadContext();

  switch (name) {
    case "validate_arf": {
      const validation = getRootValidation(root, resources);
      return asJsonContent(validation);
    }

    case "category_summary": {
      return asJsonContent({
        root: root.name ?? "(missing name)",
        categories: getCategorySummary(root),
      });
    }

    case "search_osint_tools": {
      return asJsonContent(searchResources(resources, args));
    }

    case "build_osint_bucket_plan": {
      const rootValidation = getRootValidation(root, resources);
      const plan = buildBucketPlan(resources, args);

      return asJsonContent({
        rootValidation,
        ...plan,
      });
    }

    case "get_tool_by_name": {
      const needle = normalizeText(args.name);
      const limit = Math.min(Number(args.limit ?? 10), 20);

      const matches = resources
        .filter((r) => normalizeText(r.name).includes(needle))
        .sort((a, b) => scoreTool(b) - scoreTool(a))
        .slice(0, limit)
        .map(compactTool);

      return asJsonContent({
        query: args.name,
        count: matches.length,
        results: matches,
      });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

// Important: do not console.log from an MCP stdio server.
// stdout is reserved for JSON-RPC messages.
console.error(
  `[local-osint-framework] MCP server running. ARF path: ${DEFAULT_ARF_PATH}`
);
