import type { RefObject } from "react";
import {
  BriefcaseBusiness,
  Menu,
  Moon,
  NotebookPen,
  Search,
  Star,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TopBarProps {
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement>;
  theme: "dark" | "light";
  favoritesActive: boolean;
  notesActive: boolean;
  casesActive: boolean;
  onSearchChange: (value: string) => void;
  onToggleFavorites: () => void;
  onToggleNotes: () => void;
  onToggleCases: () => void;
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
}

export function TopBar({
  searchQuery,
  searchInputRef,
  theme,
  favoritesActive,
  notesActive,
  casesActive,
  onSearchChange,
  onToggleFavorites,
  onToggleNotes,
  onToggleCases,
  onToggleTheme,
  onOpenSidebar,
}: TopBarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 lg:px-5">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        className="lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search resources, tags, URLs, or categories"
          className="h-11 pl-9 pr-16 text-base"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/80 bg-panel px-1.5 py-0.5 font-mono text-[11px] text-slate-400">
          Ctrl+/
        </span>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <Button
          variant={favoritesActive ? "secondary" : "outline"}
          size="md"
          onClick={onToggleFavorites}
          className={cn(favoritesActive && "font-semibold")}
        >
          <Star className="h-4 w-4" />
          Favorites
        </Button>
        <Button
          variant={notesActive ? "secondary" : "outline"}
          size="md"
          onClick={onToggleNotes}
          className={cn(notesActive && "font-semibold")}
        >
          <NotebookPen className="h-4 w-4" />
          Notes
        </Button>
        <Button
          variant={casesActive ? "secondary" : "outline"}
          size="md"
          onClick={onToggleCases}
          className={cn(casesActive && "font-semibold")}
        >
          <BriefcaseBusiness className="h-4 w-4" />
          Cases
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        aria-label="Toggle color theme"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
