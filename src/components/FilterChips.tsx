import { Button } from "@/components/ui/button";
import type { ResourceFilter } from "@/lib/types";

const FILTERS: Array<{ id: ResourceFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "free", label: "Free" },
  { id: "freemium", label: "Freemium" },
  { id: "paid", label: "Paid" },
  { id: "login-required", label: "Login Required" },
  { id: "api", label: "API" },
  { id: "dorking", label: "Dorking" },
  { id: "military", label: "Military" },
  { id: "maps", label: "Maps" },
  { id: "people", label: "People" },
  { id: "breach", label: "Breach" },
];

interface FilterChipsProps {
  activeFilter: ResourceFilter;
  onSelectFilter: (filter: ResourceFilter) => void;
}

export function FilterChips({ activeFilter, onSelectFilter }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "secondary" : "outline"}
          size="sm"
          onClick={() => onSelectFilter(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
