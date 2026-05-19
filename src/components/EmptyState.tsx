import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-panelAlt/40 px-5 py-12 text-center">
      <SearchX className="mb-3 h-8 w-8 text-slate-500" />
      <p className="font-display text-lg text-slate-100">{title}</p>
      <p className="mt-1 max-w-xl text-sm text-slate-400">{description}</p>
    </div>
  );
}
