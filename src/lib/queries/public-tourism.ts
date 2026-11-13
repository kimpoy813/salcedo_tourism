import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

export interface PlaceFilterOptions {
  type?: string | null;
  categorySlug?: string | null;
  barangaySlug?: string | null;
  search?: string | null;
  featuredOnly?: boolean;
  hiddenGemOnly?: boolean;
  sort?: "featured" | "most_visited" | "top_rated" | "name" | "newest";
  limit?: number;
}

export interface PlaceRankingsAndStats {
  averageRating: number;
  ratingCount: number;
  viewCount: number;
  arrivalsCount: number;
  itineraryCount: number;
  visitCount: number;
  mostVisitedRank: number;
  topRatedRank: number;
  categoryRank: number;
}

export interface PlaceReviewItem {
  id: string;
  reviewerName: string;
  originLabel: string | null;
  rating: number;
  comment: string | null;
  travelerType: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceRatingsSummary {
  averageRating: number;
  ratingCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: PlaceReviewItem[];
}

async function computePublishedRankingsMap() {
  const db = await getDb();

  const [allPublished, viewRows, arrivalRows, stopRows, ratingRows] =
    await Promise.all([
      db
        .select({
          id: schema.places.id,
          name: schema.places.name,
          placeType: schema.places.placeType,
          primaryCategoryId: schema.places.primaryCategoryId,
          isFeatured: schema.places.isFeatured,
        })
        .from(schema.places)
        .where(
          and(
            eq(schema.places.status, "published"),
            eq(schema.places.isPlaceholder, false)
          )
        ),
      db
        .select({
          placeId: schema.placeViewEvents.placeId,
          cnt: sql<number>`count(*)::int`,
        })
        .from(schema.placeViewEvents)
        .groupBy(schema.placeViewEvents.placeId),
      db
        .select({
          placeId: schema.visitorArrivalRecords.placeId,
          total: sql<number>`coalesce(sum(${schema.visitorArrivalRecords.arrivalCount}), 0)::int`,
        })
        .from(schema.visitorArrivalRecords)
        .groupBy(schema.visitorArrivalRecords.placeId),
      db
        .select({
          placeId: schema.itineraryStops.placeId,
          cnt: sql<number>`count(*)::int`,
        })
        .from(schema.itineraryStops)
        .groupBy(schema.itineraryStops.placeId),
      db
        .select({
          placeId: schema.placeRatings.placeId,
          cnt: sql<number>`count(*)::int`,
          avg: sql<number>`coalesce(avg(${schema.placeRatings.rating}), 0)::float`,
        })
        .from(schema.placeRatings)
        .where(eq(schema.placeRatings.status, "published"))
        .groupBy(schema.placeRatings.placeId),
    ]);

  const viewMap = new Map(viewRows.map((r) => [r.placeId, Number(r.cnt) || 0]));
  const arrivalMap = new Map(arrivalRows.map((r) => [r.placeId, Number(r.total) || 0]));
  const stopMap = new Map(stopRows.map((r) => [r.placeId, Number(r.cnt) || 0]));
  const ratingMap = new Map(
    ratingRows.map((r) => [
      r.placeId,
      {
        count: Number(r.cnt) || 0,
        avg: Number(Number(r.avg || 0).toFixed(1)),
      },
    ])
  );

  const metrics = allPublished.map((p) => {
    const viewCount = viewMap.get(p.id) ?? 0;
    const arrivalsCount = arrivalMap.get(p.id) ?? 0;
    const itineraryCount = stopMap.get(p.id) ?? 0;
    const r = ratingMap.get(p.id) ?? { count: 0, avg: 0 };
    const visitCount = viewCount + arrivalsCount;
    // Weighted score ensures spots with more verified tourist reviews outrank 1-review anomalies
    const bayesianRating =
      r.count > 0 ? (r.count * r.avg + 2 * 4.2) / (r.count + 2) : 0;

    return {
      id: p.id,
      name: p.name,
      categoryKey: p.primaryCategoryId || p.placeType,
      isFeatured: p.isFeatured,
      averageRating: r.avg,
      ratingCount: r.count,
      viewCount,
      arrivalsCount,
      itineraryCount,
      visitCount,
      bayesianRating,
    };
  });

  const visitedSorted = [...metrics].sort(
    (a, b) =>
      b.visitCount - a.visitCount ||
      b.itineraryCount - a.itineraryCount ||
      b.averageRating - a.averageRating ||
      a.name.localeCompare(b.name)
  );
  const mostVisitedRankMap = new Map(visitedSorted.map((m, i) => [m.id, i + 1]));

  const ratedSorted = [...metrics].sort(
    (a, b) =>
      b.bayesianRating - a.bayesianRating ||
      b.averageRating - a.averageRating ||
      b.ratingCount - a.ratingCount ||
      b.visitCount - a.visitCount ||
      a.name.localeCompare(b.name)
  );
  const topRatedRankMap = new Map(ratedSorted.map((m, i) => [m.id, i + 1]));

  // Category-level ranking balanced across tourist ratings and visit counts
  const categoryRankMap = new Map<string, number>();
  const byCat = new Map<string, typeof metrics>();
  for (const m of metrics) {
    const list = byCat.get(m.categoryKey) ?? [];
    list.push(m);
    byCat.set(m.categoryKey, list);
  }
  for (const list of byCat.values()) {
    list.sort(
      (a, b) =>
        b.bayesianRating * 5 +
        b.visitCount -
        (a.bayesianRating * 5 + a.visitCount) ||
        a.name.localeCompare(b.name)
    );
    list.forEach((m, idx) => categoryRankMap.set(m.id, idx + 1));
  }

  const out = new Map<string, PlaceRankingsAndStats>();
  for (const m of metrics) {
    out.set(m.id, {
      averageRating: m.averageRating,
      ratingCount: m.ratingCount,
      viewCount: m.viewCount,
      arrivalsCount: m.arrivalsCount,
      itineraryCount: m.itineraryCount,
      visitCount: m.visitCount,
      mostVisitedRank: mostVisitedRankMap.get(m.id) ?? 1,
      topRatedRank: topRatedRankMap.get(m.id) ?? 1,
      categoryRank: categoryRankMap.get(m.id) ?? 1,
    });
  }
  return out;
}

export async function getPublishedPlaces(filters: PlaceFilterOptions = {}) {
  const db = await getDb();

  const conditions = [
    eq(schema.places.status, "published"),
    eq(schema.places.isPlaceholder, false),
  ];

  if (filters.type && filters.type !== "all") {
    const allowed = [
      "attraction",
      "cafe",
      "resort",
      "restaurant",
      "accommodation",
      "business",
      "heritage",
      "nature",
      "service",
    ] as const;
    if ((allowed as readonly string[]).includes(filters.type)) {
      conditions.push(
        eq(
          schema.places.placeType,
          filters.type as (typeof schema.placeTypeEnum.enumValues)[number]
        )
      );
    }
  }

  if (filters.featuredOnly) {
    conditions.push(eq(schema.places.isFeatured, true));
  }

  if (filters.hiddenGemOnly) {
    conditions.push(eq(schema.places.isHiddenGem, true));
  }

  if (filters.categorySlug && filters.categorySlug !== "all") {
    const [cat] = await db
      .select({ id: schema.placeCategories.id })
      .from(schema.placeCategories)
      .where(eq(schema.placeCategories.slug, filters.categorySlug))
      .limit(1);
    if (!cat) return [];
    conditions.push(eq(schema.places.primaryCategoryId, cat.id));
  }

  if (filters.barangaySlug && filters.barangaySlug !== "all") {
    const [brgy] = await db
      .select({ id: schema.barangays.id })
      .from(schema.barangays)
      .where(eq(schema.barangays.slug, filters.barangaySlug))
      .limit(1);
    if (!brgy) return [];
    conditions.push(eq(schema.places.barangayId, brgy.id));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(schema.places.name, q),
        ilike(schema.places.shortDescription, q),
        ilike(schema.places.description, q),
        ilike(schema.places.address, q)
      )!
    );
  }

  const orderByClause =
    filters.sort === "name"
      ? [asc(schema.places.name)]
      : filters.sort === "newest"
      ? [desc(schema.places.publishedAt), asc(schema.places.name)]
      : [desc(schema.places.isFeatured), desc(schema.places.publishedAt), asc(schema.places.name)];

  const [rows, rankingsMap] = await Promise.all([
    db
      .select()
      .from(schema.places)
      .where(and(...conditions))
      .orderBy(...orderByClause)
      .limit(filters.limit ?? 100),
    computePublishedRankingsMap(),
  ]);

  if (rows.length === 0) return [];

  const brgyIds = Array.from(
    new Set(rows.map((r) => r.barangayId).filter((v): v is string => Boolean(v)))
  );
  const catIds = Array.from(
    new Set(rows.map((r) => r.primaryCategoryId).filter((v): v is string => Boolean(v)))
  );
  const placeIds = rows.map((r) => r.id);

  const [
    brgyRows,
    catRows,
    cafeRows,
    resortRows,
    restaurantRows,
    attractionRows,
    accommRows,
  ] = await Promise.all([
    brgyIds.length
      ? db.select().from(schema.barangays).where(inArray(schema.barangays.id, brgyIds))
      : [],
    catIds.length
      ? db
          .select()
          .from(schema.placeCategories)
          .where(inArray(schema.placeCategories.id, catIds))
      : [],
    db
      .select()
      .from(schema.cafeDetails)
      .where(inArray(schema.cafeDetails.placeId, placeIds)),
    db
      .select()
      .from(schema.resortDetails)
      .where(inArray(schema.resortDetails.placeId, placeIds)),
    db
      .select()
      .from(schema.restaurantDetails)
      .where(inArray(schema.restaurantDetails.placeId, placeIds)),
    db
      .select()
      .from(schema.attractionDetails)
      .where(inArray(schema.attractionDetails.placeId, placeIds)),
    db
      .select()
      .from(schema.accommodationDetails)
      .where(inArray(schema.accommodationDetails.placeId, placeIds)),
  ]);

  const brgyMap = new Map(brgyRows.map((b) => [b.id, b]));
  const catMap = new Map(catRows.map((c) => [c.id, c]));
  const cafeMap = new Map(cafeRows.map((c) => [c.placeId, c]));
  const resortMap = new Map(resortRows.map((c) => [c.placeId, c]));
  const restaurantMap = new Map(restaurantRows.map((c) => [c.placeId, c]));
  const attractionMap = new Map(attractionRows.map((c) => [c.placeId, c]));
  const accommMap = new Map(accommRows.map((c) => [c.placeId, c]));

  const enriched = rows.map((place) => {
    const stats = rankingsMap.get(place.id) ?? {
      averageRating: 0,
      ratingCount: 0,
      viewCount: 0,
      arrivalsCount: 0,
      itineraryCount: 0,
      visitCount: 0,
      mostVisitedRank: 1,
      topRatedRank: 1,
      categoryRank: 1,
    };

    return {
      ...place,
      ...stats,
      barangay: place.barangayId ? brgyMap.get(place.barangayId) ?? null : null,
      primaryCategory: place.primaryCategoryId
        ? catMap.get(place.primaryCategoryId) ?? null
        : null,
      cafeDetails: cafeMap.get(place.id) ?? null,
      resortDetails: resortMap.get(place.id) ?? null,
      restaurantDetails: restaurantMap.get(place.id) ?? null,
      attractionDetails: attractionMap.get(place.id) ?? null,
      accommodationDetails: accommMap.get(place.id) ?? null,
    };
  });

  if (filters.sort === "most_visited") {
    enriched.sort((a, b) => a.mostVisitedRank - b.mostVisitedRank);
  } else if (filters.sort === "top_rated") {
    enriched.sort((a, b) => a.topRatedRank - b.topRatedRank);
  }

  return enriched;
}

export async function getPlaceRatingsSummary(
  placeId: string
): Promise<PlaceRatingsSummary> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.placeRatings)
    .where(
      and(
        eq(schema.placeRatings.placeId, placeId),
        eq(schema.placeRatings.status, "published")
      )
    )
    .orderBy(desc(schema.placeRatings.updatedAt), desc(schema.placeRatings.createdAt))
    .limit(50);

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sum = 0;
  for (const r of rows) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] ?? 0) + 1;
    sum += r.rating;
  }

  const ratingCount = rows.length;
  const averageRating =
    ratingCount > 0 ? Number((sum / ratingCount).toFixed(1)) : 0;

  return {
    averageRating,
    ratingCount,
    distribution,
    reviews: rows.map((r) => ({
      id: r.id,
      reviewerName: r.reviewerName,
      originLabel: r.originLabel,
      rating: r.rating,
      comment: r.comment,
      travelerType: r.travelerType,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

export async function resolvePublishedPlace(idOrSlug: string) {
  const db = await getDb();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const [place] = await db
    .select()
    .from(schema.places)
    .where(
      and(
        eq(schema.places.status, "published"),
        eq(schema.places.isPlaceholder, false),
        isUuid ? eq(schema.places.id, idOrSlug) : eq(schema.places.slug, idOrSlug)
      )
    )
    .limit(1);

  return place ?? null;
}

export async function getPublishedPlaceByIdOrSlug(idOrSlug: string) {
  const db = await getDb();
  const place = await resolvePublishedPlace(idOrSlug);
  if (!place) return null;

  const [
    barangay,
    primaryCategory,
    images,
    amenities,
    operatingHours,
    cafe,
    resort,
    restaurant,
    attraction,
    accommodation,
    ratingsSummary,
    rankingsMap,
  ] = await Promise.all([
    place.barangayId
      ? db
          .select()
          .from(schema.barangays)
          .where(eq(schema.barangays.id, place.barangayId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
    place.primaryCategoryId
      ? db
          .select()
          .from(schema.placeCategories)
          .where(eq(schema.placeCategories.id, place.primaryCategoryId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
    db
      .select()
      .from(schema.placeImages)
      .where(eq(schema.placeImages.placeId, place.id))
      .orderBy(asc(schema.placeImages.displayOrder)),
    db
      .select()
      .from(schema.placeAmenities)
      .where(eq(schema.placeAmenities.placeId, place.id)),
    db
      .select()
      .from(schema.placeOperatingHours)
      .where(eq(schema.placeOperatingHours.placeId, place.id))
      .orderBy(asc(schema.placeOperatingHours.dayOfWeek)),
    db
      .select()
      .from(schema.cafeDetails)
      .where(eq(schema.cafeDetails.placeId, place.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(schema.resortDetails)
      .where(eq(schema.resortDetails.placeId, place.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(schema.restaurantDetails)
      .where(eq(schema.restaurantDetails.placeId, place.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(schema.attractionDetails)
      .where(eq(schema.attractionDetails.placeId, place.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(schema.accommodationDetails)
      .where(eq(schema.accommodationDetails.placeId, place.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    getPlaceRatingsSummary(place.id),
    computePublishedRankingsMap(),
  ]);

  const stats = rankingsMap.get(place.id) ?? {
    averageRating: ratingsSummary.averageRating,
    ratingCount: ratingsSummary.ratingCount,
    viewCount: 0,
    arrivalsCount: 0,
    itineraryCount: 0,
    visitCount: 0,
    mostVisitedRank: 1,
    topRatedRank: 1,
    categoryRank: 1,
  };

  const relatedRaw = await getPublishedPlaces({ limit: 16 });
  const relatedPlaces = relatedRaw
    .filter((p) => p.id !== place.id)
    .sort((a, b) => {
      const aScore =
        (a.barangayId === place.barangayId ? 2 : 0) +
        (a.placeType === place.placeType ? 1 : 0);
      const bScore =
        (b.barangayId === place.barangayId ? 2 : 0) +
        (b.placeType === place.placeType ? 1 : 0);
      return bScore - aScore || a.mostVisitedRank - b.mostVisitedRank;
    })
    .slice(0, 4);

  return {
    ...place,
    ...stats,
    ratingsSummary,
    barangay,
    primaryCategory,
    images,
    amenities,
    operatingHours,
    cafeDetails: cafe,
    resortDetails: resort,
    restaurantDetails: restaurant,
    attractionDetails: attraction,
    accommodationDetails: accommodation,
    relatedPlaces,
  };
}

export async function getCategoriesWithCounts() {
  const db = await getDb();
  const [cats, publishedPlaces] = await Promise.all([
    db
      .select()
      .from(schema.placeCategories)
      .where(eq(schema.placeCategories.isActive, true))
      .orderBy(asc(schema.placeCategories.displayOrder)),
    db
      .select({
        id: schema.places.id,
        primaryCategoryId: schema.places.primaryCategoryId,
      })
      .from(schema.places)
      .where(
        and(eq(schema.places.status, "published"), eq(schema.places.isPlaceholder, false))
      ),
  ]);

  const counts = new Map<string, number>();
  for (const p of publishedPlaces) {
    if (p.primaryCategoryId) {
      counts.set(p.primaryCategoryId, (counts.get(p.primaryCategoryId) ?? 0) + 1);
    }
  }

  return cats.map((c) => ({
    ...c,
    publishedCount: counts.get(c.id) ?? 0,
  }));
}

export async function getAllBarangaysWithCounts() {
  const db = await getDb();
  const [allBarangays, publishedPlaces, publishedProducts, publishedEvents] = await Promise.all([
    db.select().from(schema.barangays).orderBy(asc(schema.barangays.name)),
    db
      .select({ id: schema.places.id, barangayId: schema.places.barangayId })
      .from(schema.places)
      .where(
        and(eq(schema.places.status, "published"), eq(schema.places.isPlaceholder, false))
      ),
    db
      .select({ id: schema.localProducts.id, barangayId: schema.localProducts.barangayId })
      .from(schema.localProducts)
      .where(eq(schema.localProducts.status, "published")),
    db
      .select({ id: schema.events.id, barangayId: schema.events.barangayId })
      .from(schema.events)
      .where(eq(schema.events.status, "published")),
  ]);

  const placeCount = new Map<string, number>();
  const productCount = new Map<string, number>();
  const eventCount = new Map<string, number>();

  for (const p of publishedPlaces) {
    if (p.barangayId) placeCount.set(p.barangayId, (placeCount.get(p.barangayId) ?? 0) + 1);
  }
  for (const pr of publishedProducts) {
    if (pr.barangayId) productCount.set(pr.barangayId, (productCount.get(pr.barangayId) ?? 0) + 1);
  }
  for (const ev of publishedEvents) {
    if (ev.barangayId) eventCount.set(ev.barangayId, (eventCount.get(ev.barangayId) ?? 0) + 1);
  }

  return allBarangays.map((b) => ({
    ...b,
    publishedPlacesCount: placeCount.get(b.id) ?? 0,
    publishedProductsCount: productCount.get(b.id) ?? 0,
    publishedEventsCount: eventCount.get(b.id) ?? 0,
  }));
}

export async function getPublishedEvents() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.status, "published"))
    .orderBy(asc(schema.events.startDate));
  const brgys = await db.select().from(schema.barangays);
  const brgyMap = new Map(brgys.map((b) => [b.id, b]));
  return rows.map((r) => ({
    ...r,
    barangay: r.barangayId ? brgyMap.get(r.barangayId) ?? null : null,
  }));
}

export async function getPublishedProducts() {
  const db = await getDb();
  const [rows, producers, brgys] = await Promise.all([
    db
      .select()
      .from(schema.localProducts)
      .where(eq(schema.localProducts.status, "published"))
      .orderBy(desc(schema.localProducts.isFeatured), asc(schema.localProducts.name)),
    db.select().from(schema.productProducers),
    db.select().from(schema.barangays),
  ]);
  const brgyMap = new Map(brgys.map((b) => [b.id, b]));
  const producerMap = new Map<string, typeof producers>();
  for (const pr of producers) {
    const arr = producerMap.get(pr.productId) ?? [];
    arr.push(pr);
    producerMap.set(pr.productId, arr);
  }
  return rows.map((p) => ({
    ...p,
    barangay: p.barangayId ? brgyMap.get(p.barangayId) ?? null : null,
    producers: producerMap.get(p.id) ?? [],
  }));
}

export async function getPublishedArticlesAndGuides() {
  const db = await getDb();
  const [historical, cultural, guides, announcements, galleries, contacts, municipal, collections] =
    await Promise.all([
      db
        .select()
        .from(schema.historicalArticles)
        .where(eq(schema.historicalArticles.status, "published"))
        .orderBy(asc(schema.historicalArticles.displayOrder)),
      db
        .select()
        .from(schema.culturalArticles)
        .where(eq(schema.culturalArticles.status, "published"))
        .orderBy(desc(schema.culturalArticles.isFeatured)),
      db
        .select()
        .from(schema.travelGuides)
        .where(eq(schema.travelGuides.status, "published"))
        .orderBy(desc(schema.travelGuides.isFeatured)),
      db
        .select()
        .from(schema.announcements)
        .where(eq(schema.announcements.status, "published"))
        .orderBy(desc(schema.announcements.publishedAt)),
      db
        .select()
        .from(schema.galleries)
        .where(eq(schema.galleries.status, "published"))
        .orderBy(asc(schema.galleries.displayOrder)),
      db
        .select()
        .from(schema.emergencyContacts)
        .where(eq(schema.emergencyContacts.isActive, true))
        .orderBy(asc(schema.emergencyContacts.displayOrder)),
      db.select().from(schema.municipalInformation),
      db
        .select()
        .from(schema.curatedCollections)
        .where(eq(schema.curatedCollections.status, "published"))
        .orderBy(asc(schema.curatedCollections.displayOrder)),
    ]);

  return {
    historical,
    cultural,
    guides,
    announcements,
    galleries,
    contacts,
    municipal,
    collections,
  };
}
