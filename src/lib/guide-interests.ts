import type { PlaceCardData } from "@/components/app/PlaceCard";

/** A few broad starting points, without losing the directory's detailed filters. */
export const interests = [
  {
    key: "nature",
    label: "Nature & outdoors",
    note: "Waterfalls and trails",
    types: ["nature", "attraction"],
  },
  {
    key: "stays",
    label: "Stays & resorts",
    note: "Springs and retreats",
    types: ["resort", "accommodation"],
  },
  { key: "food", label: "Food & drink", note: "A taste of Salcedo", types: ["cafe", "restaurant"] },
  {
    key: "heritage",
    label: "Culture & heritage",
    note: "Stories and landmarks",
    types: ["heritage", "business"],
  },
];

export const typeLabels: Record<string, string> = {
  attraction: "Attraction",
  nature: "Nature",
  heritage: "Heritage",
  resort: "Resort",
  restaurant: "Dining",
  cafe: "Café",
  accommodation: "Stay",
  business: "Local craft",
  service: "Service",
};

/** All views use the same published place set and the server's ranking metrics. */
export function selectDirectoryPlaces(
  initialPlaces: PlaceCardData[],
  {
    interest,
    category = "all",
    barangay = "all",
    type = "all",
    query = "",
    sort = "most_visited",
  }: {
    interest?: (typeof interests)[number];
    category?: string;
    barangay?: string;
    type?: string;
    query?: string;
    sort?: string | null;
  },
) {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = normalize(query.trim());
  const list = initialPlaces.filter((p) => {
    if (interest && !interest.types.includes(p.placeType)) return false;
    if (category !== "all" && category !== p.primaryCategory?.slug) return false;
    if (barangay !== "all" && barangay !== p.barangay?.slug) return false;
    if (
      type !== "all" &&
      !(type === "attraction"
        ? ["attraction", "nature", "heritage"].includes(p.placeType)
        : type === p.placeType)
    )
      return false;
    return (
      !q ||
      normalize(
        `${p.name} ${p.shortDescription} ${p.address} ${p.barangay?.name ?? ""} ${p.placeType} ${p.primaryCategory?.name ?? ""}`,
      ).includes(q)
    );
  });
  if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "featured")
    return list.sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
  const key =
    sort === "top_rated"
      ? "topRatedRank"
      : sort === "by_category"
        ? "categoryRank"
        : "mostVisitedRank";
  return list.sort((a, b) => (a[key] ?? Infinity) - (b[key] ?? Infinity));
}
