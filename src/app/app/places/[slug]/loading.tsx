import { Skeleton } from "@/components/ui/design";

export default function PlaceLoading() {
  return (
    <div className="guide-wrap detail-page py-5" role="status" aria-label="Loading place details">
      <Skeleton className="w-44 h-4 mb-5" />
      <div className="detail-lead">
        <Skeleton className="aspect-[1.8]" />
        <div className="space-y-4 py-6">
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-3/4 h-12" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-2/3 h-4" />
        </div>
      </div>
      <Skeleton className="h-32" />
    </div>
  );
}
