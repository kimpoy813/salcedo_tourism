import { Skeleton } from "@/components/ui/design";

export default function PlaceLoading() {
  return (
    <div className="min-h-full bg-[#FAF9F6]" role="status" aria-label="Loading place">
      <Skeleton className="h-[290px] rounded-none" />
      <div className="px-4 -mt-6 relative z-10 space-y-4">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[86px]" />
          ))}
        </div>
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
