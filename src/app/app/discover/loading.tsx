import { PlaceListSkeleton, Skeleton } from "@/components/ui/design";

export default function DiscoverLoading() {
  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-7 space-y-4" role="status" aria-label="Loading Discover">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
      <div className="flex gap-1.5">
        {[64, 76, 56, 84].map((w) => (
          <Skeleton key={w} className="h-7 rounded-full" />
        ))}
      </div>
      <PlaceListSkeleton rows={5} />
    </div>
  );
}
