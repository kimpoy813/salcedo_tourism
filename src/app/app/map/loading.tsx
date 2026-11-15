import { Skeleton } from "@/components/ui/design";

export default function MapLoading() {
  return (
    <div className="w-full h-full bg-[#ECE9E0] relative" role="status" aria-label="Loading map">
      <Skeleton className="absolute top-3 left-3 right-3 h-11 rounded-full" />
      <Skeleton className="absolute top-16 left-3 h-8 w-56 rounded-full" />
      <Skeleton className="absolute bottom-24 left-3 right-3 h-20 rounded-2xl" />
      <p className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#616E69]">
        Loading Salcedo map…
      </p>
    </div>
  );
}
