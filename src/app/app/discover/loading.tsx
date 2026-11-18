import { Skeleton } from "@/components/ui/design";

export default function DiscoverLoading() {
  return (
    <div className="guide-wrap directory-page" role="status" aria-label="Loading destinations">
      <div className="page-intro">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-56" />
        </div>
      </div>
      <Skeleton className="h-12 mb-6" />
      <div className="places-grid">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="aspect-[1.45]" />
        ))}
      </div>
    </div>
  );
}
