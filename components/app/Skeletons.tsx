import { cn } from "@/lib/utils";

export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.03] animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "h-4 bg-white/[0.05] rounded",
            i === 0 ? "w-32" : i === 1 ? "w-24" : "flex-1"
          )} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="sv-card p-4 space-y-3 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="h-5 bg-white/[0.08] rounded w-1/2" />
        <div className="h-4 bg-white/[0.05] rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/[0.04] rounded w-full" />
        <div className="h-3 bg-white/[0.04] rounded w-3/4" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-7 bg-white/[0.05] rounded-lg w-20" />
        <div className="h-7 bg-white/[0.05] rounded-lg w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="sv-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.05] flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 bg-white/[0.1] rounded w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}
