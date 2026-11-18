import { Skeleton } from "@/components/ui/design";
export default function DiscoverLoading() {
  return (
    <div className="guide-wrap directory-page" role="status" aria-label="Loading destinations">
      <div className="page-intro">
        <Skeleton className="h-12 w-56" />
      </div>
      <Skeleton className="h-12 mb-6" />
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} className="my-4 h-20" />
      ))}
    </div>
  );
}
