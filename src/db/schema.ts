import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "pending_review",
  "published",
  "archived",
]);

export const placeTypeEnum = pgEnum("place_type", [
  "attraction",
  "cafe",
  "resort",
  "restaurant",
  "accommodation",
  "business",
  "heritage",
  "nature",
  "service",
]);

export const itineraryStatusEnum = pgEnum("itinerary_status", [
  "submitted",
  "archived",
  "anonymized",
]);

export const itineraryEventTypeEnum = pgEnum("itinerary_event_type", [
  "builder_started",
  "preview_completed",
  "submitted",
  "retrieved",
  "downloaded",
]);

// ============================================================================
// 1. TOURISM TABLES
// ============================================================================

export const barangays = pgTable(
  "barangays",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    district: text("district").default("Salcedo").notNull(),
    population2020: integer("population_2020"),
    population2015: integer("population_2015"),
    elevationMeters: doublePrecision("elevation_meters"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    summary: text("summary").notNull(),
    historyNotes: text("history_notes"),
    highlights: jsonb("highlights").$type<string[]>().default([]).notNull(),
    featuredImageUrl: text("featured_image_url"),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("barangays_slug_idx").on(t.slug), index("barangays_name_idx").on(t.name)]
);

export const placeCategories = pgTable(
  "place_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    groupType: text("group_type").notNull(), // e.g., attraction, cafe, resort, restaurant, accommodation, culture, business, service
    description: text("description"),
    iconName: text("icon_name").default("MapPin").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("place_categories_slug_idx").on(t.slug)]
);

export const places = pgTable(
  "places",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    placeType: placeTypeEnum("place_type").notNull(),
    primaryCategoryId: uuid("primary_category_id").references(() => placeCategories.id, {
      onDelete: "set null",
    }),
    barangayId: uuid("barangay_id").references(() => barangays.id, {
      onDelete: "set null",
    }),
    address: text("address").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    phone: text("phone"),
    email: text("email"),
    websiteUrl: text("website_url"),
    socialMediaUrl: text("social_media_url"),
    featuredImageUrl: text("featured_image_url"),
    featuredImageCaption: text("featured_image_caption"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isHiddenGem: boolean("is_hidden_gem").default(false).notNull(),
    isPlaceholder: boolean("is_placeholder").default(false).notNull(),
    status: contentStatusEnum("status").default("draft").notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdByAdminId: uuid("created_by_admin_id"),
    updatedByAdminId: uuid("updated_by_admin_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("places_slug_idx").on(t.slug),
    index("places_status_type_idx").on(t.status, t.placeType),
    index("places_barangay_idx").on(t.barangayId),
    index("places_featured_idx").on(t.isFeatured, t.status),
  ]
);

export const placeCategoryAssignments = pgTable(
  "place_category_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => placeCategories.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("place_cat_assign_unique_idx").on(t.placeId, t.categoryId)]
);

export const placeImages = pgTable(
  "place_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption"),
    attribution: text("attribution"),
    isIllustrative: boolean("is_illustrative").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("place_images_place_idx").on(t.placeId)]
);

export const placeRatings = pgTable(
  "place_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    anonymousSessionId: uuid("anonymous_session_id").references(
      () => anonymousSessions.id,
      { onDelete: "set null" }
    ),
    reviewerToken: text("reviewer_token").notNull(),
    reviewerName: text("reviewer_name").default("Salcedo Visitor").notNull(),
    originLabel: text("origin_label"),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    travelerType: text("traveler_type").default("Leisure").notNull(),
    status: contentStatusEnum("status").default("published").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("place_ratings_place_reviewer_idx").on(t.placeId, t.reviewerToken),
    index("place_ratings_place_status_idx").on(t.placeId, t.status, t.createdAt),
  ]
);

export const placeAmenities = pgTable(
  "place_amenities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").default("general").notNull(),
    available: boolean("available").default(true).notNull(),
    notes: text("notes"),
  },
  (t) => [index("place_amenities_place_idx").on(t.placeId)]
);

export const placeOperatingHours = pgTable(
  "place_operating_hours",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sun .. 6 = Sat
    openTime: text("open_time"),
    closeTime: text("close_time"),
    isClosed: boolean("is_closed").default(false).notNull(),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("place_hours_unique_idx").on(t.placeId, t.dayOfWeek)]
);

export const cafeDetails = pgTable("cafe_details", {
  placeId: uuid("place_id")
    .primaryKey()
    .references(() => places.id, { onDelete: "cascade" }),
  featuredDrinks: jsonb("featured_drinks").$type<string[]>().default([]).notNull(),
  foodOfferings: jsonb("food_offerings").$type<string[]>().default([]).notNull(),
  priceRangeNote: text("price_range_note"),
  hasWifi: boolean("has_wifi"),
  hasParking: boolean("has_parking"),
  seatingOptions: jsonb("seating_options").$type<string[]>().default([]).notNull(),
  brewStyleNote: text("brew_style_note"),
});

export const resortDetails = pgTable("resort_details", {
  placeId: uuid("place_id")
    .primaryKey()
    .references(() => places.id, { onDelete: "cascade" }),
  poolsSummary: text("pools_summary"),
  cottagesSummary: text("cottages_summary"),
  roomsSummary: text("rooms_summary"),
  recreationalFacilities: jsonb("recreational_facilities").$type<string[]>().default([]).notNull(),
  entranceFeeNote: text("entrance_fee_note"),
  cottageRoomRatesNote: text("cottage_room_rates_note"),
  policies: jsonb("policies").$type<string[]>().default([]).notNull(),
  externalInquiryUrl: text("external_inquiry_url"),
});

export const restaurantDetails = pgTable("restaurant_details", {
  placeId: uuid("place_id")
    .primaryKey()
    .references(() => places.id, { onDelete: "cascade" }),
  cuisineType: text("cuisine_type"),
  menuHighlights: jsonb("menu_highlights").$type<string[]>().default([]).notNull(),
  featuredDishes: jsonb("featured_dishes").$type<string[]>().default([]).notNull(),
  diningOptions: jsonb("dining_options").$type<string[]>().default([]).notNull(),
  hasParking: boolean("has_parking"),
  priceRangeNote: text("price_range_note"),
});

export const accommodationDetails = pgTable("accommodation_details", {
  placeId: uuid("place_id")
    .primaryKey()
    .references(() => places.id, { onDelete: "cascade" }),
  accommodationType: text("accommodation_type"),
  roomTypesSummary: text("room_types_summary"),
  rateNote: text("rate_note"),
  amenitiesSummary: jsonb("amenities_summary").$type<string[]>().default([]).notNull(),
  checkInOutPolicy: text("check_in_out_policy"),
  bookingInquiryUrl: text("booking_inquiry_url"),
});

export const attractionDetails = pgTable("attraction_details", {
  placeId: uuid("place_id")
    .primaryKey()
    .references(() => places.id, { onDelete: "cascade" }),
  activities: jsonb("activities").$type<string[]>().default([]).notNull(),
  visitorGuidelines: jsonb("visitor_guidelines").$type<string[]>().default([]).notNull(),
  entranceInfo: text("entrance_info"),
  historicalDetails: text("historical_details"),
  difficultyLevel: text("difficulty_level"),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
});

export const localProducts = pgTable(
  "local_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(), // agriculture, delicacy, handicraft, beverage, souvenir
    description: text("description").notNull(),
    traditionNotes: text("tradition_notes"),
    seasonalAvailability: text("seasonal_availability"),
    priceNote: text("price_note"),
    imageUrl: text("image_url"),
    barangayId: uuid("barangay_id").references(() => barangays.id, { onDelete: "set null" }),
    status: contentStatusEnum("status").default("draft").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("local_products_slug_idx").on(t.slug), index("local_products_status_idx").on(t.status)]
);

export const productProducers = pgTable(
  "product_producers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => localProducts.id, { onDelete: "cascade" }),
    producerName: text("producer_name").notNull(),
    barangayId: uuid("barangay_id").references(() => barangays.id, { onDelete: "set null" }),
    address: text("address"),
    contactInfo: text("contact_info"),
    notes: text("notes"),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
  },
  (t) => [index("product_producers_product_idx").on(t.productId)]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(), // festival, harvest_fair, religious, community, sports
    description: text("description").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    venueName: text("venue_name").notNull(),
    barangayId: uuid("barangay_id").references(() => barangays.id, { onDelete: "set null" }),
    imageUrl: text("image_url"),
    scheduleNotes: text("schedule_notes"),
    organizer: text("organizer"),
    status: contentStatusEnum("status").default("draft").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("events_slug_idx").on(t.slug), index("events_status_date_idx").on(t.status, t.startDate)]
);

export const historicalArticles = pgTable(
  "historical_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    eraOrYear: text("era_or_year").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    imageCaption: text("image_caption"),
    status: contentStatusEnum("status").default("draft").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("historical_articles_slug_idx").on(t.slug)]
);

export const culturalArticles = pgTable(
  "cultural_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(), // tradition, craft, cuisine, faith, heritage
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    imageCaption: text("image_caption"),
    status: contentStatusEnum("status").default("draft").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("cultural_articles_slug_idx").on(t.slug)]
);

export const travelGuides = pgTable(
  "travel_guides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(), // getting_here, seasonal, outdoor_safety, etiquette
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    tipsJson: jsonb("tips_json").$type<string[]>().default([]).notNull(),
    imageUrl: text("image_url"),
    status: contentStatusEnum("status").default("draft").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("travel_guides_slug_idx").on(t.slug)]
);

export const galleries = pgTable(
  "galleries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    caption: text("caption").notNull(),
    attribution: text("attribution").notNull(),
    isIllustrative: boolean("is_illustrative").default(false).notNull(),
    barangayId: uuid("barangay_id").references(() => barangays.id, { onDelete: "set null" }),
    status: contentStatusEnum("status").default("draft").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("galleries_slug_idx").on(t.slug)]
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    priority: text("priority").default("normal").notNull(), // advisory, normal, urgent
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    status: contentStatusEnum("status").default("draft").notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("announcements_slug_idx").on(t.slug)]
);

export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyName: text("agency_name").notNull(),
  category: text("category").notNull(), // police, fire, medical, mdrrmo, municipal
  phoneNumbers: jsonb("phone_numbers").$type<string[]>().default([]).notNull(),
  address: text("address").notNull(),
  barangayId: uuid("barangay_id").references(() => barangays.id, { onDelete: "set null" }),
  operatingHours: text("operating_hours").default("24/7 Emergency Response"),
  notes: text("notes"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sourceReference: text("source_reference").notNull(),
  verificationDate: date("verification_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const municipalInformation = pgTable(
  "municipal_information",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(), // overview, geography, economy, demographics, governance, privacy_policy
    content: text("content").notNull(),
    metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().default({}).notNull(),
    sourceReference: text("source_reference").notNull(),
    verificationDate: date("verification_date").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("municipal_information_key_idx").on(t.key)]
);

export const curatedCollections = pgTable(
  "curated_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    subtitle: text("subtitle").notNull(),
    description: text("description").notNull(),
    coverImageUrl: text("cover_image_url"),
    placeIdsJson: jsonb("place_ids_json").$type<string[]>().default([]).notNull(),
    status: contentStatusEnum("status").default("draft").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("curated_collections_slug_idx").on(t.slug)]
);

// ============================================================================
// 2. ITINERARY TABLES (NO TOURIST LOGIN)
// ============================================================================

export const itineraryDrafts = pgTable(
  "itinerary_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    draftToken: text("draft_token").notNull(),
    title: text("title").notNull(),
    plannedVisitDate: date("planned_visit_date"),
    description: text("description"),
    stopsJson: jsonb("stops_json").$type<Array<Record<string, unknown>>>().default([]).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("itinerary_drafts_token_idx").on(t.draftToken)]
);

export const itineraries = pgTable(
  "itineraries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referenceNumber: text("reference_number").notNull(),
    title: text("title").notNull(),
    plannedVisitDate: date("planned_visit_date").notNull(),
    description: text("description"),
    totalStops: integer("total_stops").default(0).notNull(),
    estimatedTotalMinutes: integer("estimated_total_minutes").default(0).notNull(),
    status: itineraryStatusEnum("status").default("submitted").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("itineraries_ref_idx").on(t.referenceNumber),
    index("itineraries_planned_date_idx").on(t.plannedVisitDate),
    index("itineraries_created_idx").on(t.createdAt),
  ]
);

export const itineraryStops = pgTable(
  "itinerary_stops",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itineraryId: uuid("itinerary_id")
      .notNull()
      .references(() => itineraries.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "restrict" }),
    stopOrder: integer("stop_order").notNull(),
    visitTime: text("visit_time"),
    durationMinutes: integer("duration_minutes").default(60).notNull(),
    personalNotes: text("personal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("itinerary_stops_itinerary_idx").on(t.itineraryId, t.stopOrder),
    index("itinerary_stops_place_idx").on(t.placeId),
  ]
);

export const itineraryAccessCredentials = pgTable("itinerary_access_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  itineraryId: uuid("itinerary_id")
    .notNull()
    .references(() => itineraries.id, { onDelete: "cascade" })
    .unique(),
  codeHash: text("code_hash").notNull(),
  codeSalt: text("code_salt").notNull(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 3. VISITOR INFORMATION TABLES (STRICTLY SEPARATE FROM PUBLIC ANALYTICS)
// ============================================================================

export const visitorSubmissions = pgTable(
  "visitor_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itineraryId: uuid("itinerary_id")
      .notNull()
      .references(() => itineraries.id, { onDelete: "cascade" })
      .unique(),
    originMunicipality: text("origin_municipality").notNull(),
    originProvince: text("origin_province").notNull(),
    originCountry: text("origin_country").default("Philippines").notNull(),
    plannedVisitDate: date("planned_visit_date").notNull(),
    travelerCount: integer("traveler_count").default(1).notNull(),
    purposeOfVisit: text("purpose_of_visit"),
    firstTimeVisitor: text("first_time_visitor"), // yes | no | prefer_not_to_say
    transportationType: text("transportation_type"),
    lengthOfStay: text("length_of_stay"),
    discoverySource: text("discovery_source"),
    interestedAttractions: text("interested_attractions"),
    preferredExperience: text("preferred_experience"),
    privacyNoticeVersion: text("privacy_notice_version").notNull(),
    privacyAcknowledgedAt: timestamp("privacy_acknowledged_at", { withTimezone: true }).notNull(),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("visitor_sub_province_idx").on(t.originProvince),
    index("visitor_sub_date_idx").on(t.plannedVisitDate),
    index("visitor_sub_created_idx").on(t.createdAt),
  ]
);

export const visitorContactInformation = pgTable("visitor_contact_information", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => visitorSubmissions.id, { onDelete: "cascade" })
    .unique(),
  visitorName: text("visitor_name"),
  contactNumber: text("contact_number"),
  emailAddress: text("email_address"),
  followUpConsentGiven: boolean("follow_up_consent_given").default(false).notNull(),
  consentRecordedAt: timestamp("consent_recorded_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const visitorPrivacyAcknowledgments = pgTable("visitor_privacy_acknowledgments", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => visitorSubmissions.id, { onDelete: "cascade" }),
  noticeVersion: text("notice_version").notNull(),
  acknowledged: boolean("acknowledged").notNull(),
  followUpConsent: boolean("follow_up_consent").default(false).notNull(),
  retentionPolicySummary: text("retention_policy_summary").notNull(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 4. ANONYMOUS ANALYTICS TABLES (NO RAW IPs, NO FINGERPRINTS, NO PII)
// ============================================================================

export const anonymousSessions = pgTable(
  "anonymous_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionToken: text("session_token").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
    entryPath: text("entry_path").default("/app").notNull(),
    deviceCategory: text("device_category").default("unknown").notNull(), // mobile | tablet | desktop | unknown
    isLikelyBot: boolean("is_likely_bot").default(false).notNull(),
    pageViewsCount: integer("page_views_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("anonymous_sessions_token_idx").on(t.sessionToken),
    index("anonymous_sessions_started_idx").on(t.startedAt),
    index("anonymous_sessions_last_act_idx").on(t.lastActivityAt),
  ]
);

export const pageViewEvents = pgTable(
  "page_view_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => anonymousSessions.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    path: text("path").notNull(),
    pageType: text("page_type").notNull(), // home, discover, cafe_directory, resort_directory, restaurant_directory, place_detail, barangay, map, trips, more
    entitySlug: text("entity_slug"),
    referrerPath: text("referrer_path"),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("page_view_idempotency_idx").on(t.idempotencyKey),
    index("page_view_viewed_idx").on(t.viewedAt),
    index("page_view_type_idx").on(t.pageType),
  ]
);

export const placeViewEvents = pgTable(
  "place_view_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => anonymousSessions.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("place_view_idempotency_idx").on(t.idempotencyKey),
    uniqueIndex("place_view_session_dedupe_idx").on(t.sessionId, t.placeId),
    index("place_view_place_idx").on(t.placeId, t.viewedAt),
  ]
);

export const searchEvents = pgTable(
  "search_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => anonymousSessions.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    normalizedQuery: text("normalized_query").notNull(),
    categoryFilter: text("category_filter"),
    barangayFilter: text("barangay_filter"),
    resultsCount: integer("results_count").default(0).notNull(),
    searchedAt: timestamp("searched_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("search_event_idempotency_idx").on(t.idempotencyKey),
    index("search_event_query_idx").on(t.normalizedQuery),
    index("search_event_time_idx").on(t.searchedAt),
  ]
);

export const itineraryEvents = pgTable(
  "itinerary_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => anonymousSessions.id, { onDelete: "set null" }),
    idempotencyKey: text("idempotency_key").notNull(),
    eventType: itineraryEventTypeEnum("event_type").notNull(),
    itineraryId: uuid("itinerary_id").references(() => itineraries.id, { onDelete: "set null" }),
    stopCount: integer("stop_count").default(0).notNull(),
    travelerCount: integer("traveler_count"),
    plannedVisitDate: date("planned_visit_date"),
    placeIdsJson: jsonb("place_ids_json").$type<string[]>().default([]).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("itinerary_event_idempotency_idx").on(t.idempotencyKey),
    index("itinerary_event_type_idx").on(t.eventType, t.occurredAt),
  ]
);

export const analyticsDailyAggregates = pgTable(
  "analytics_daily_aggregates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    metricDate: date("metric_date").notNull(),
    metricKey: text("metric_key").notNull(),
    dimensionKey: text("dimension_key").default("all").notNull(),
    countValue: integer("count_value").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("analytics_daily_unique_idx").on(t.metricDate, t.metricKey, t.dimensionKey)]
);

// ============================================================================
// 5. ACTUAL ARRIVAL / ON-SITE CHECK-IN TABLES (SEPARATE FROM DIGITAL VISITS)
// ============================================================================

export const checkinVerificationMethods = pgTable("checkin_verification_methods", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(), // staff_assisted, official_logbook, verified_onsite_qr, attraction_attendance
  name: text("name").notNull(),
  description: text("description").notNull(),
  reliabilityLabel: text("reliability_label").notNull(), // e.g., "Verified — Staff Assisted", "Verified — Official Logbook"
  requiresStaffAuth: boolean("requires_staff_auth").default(true).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const destinationCheckins = pgTable(
  "destination_checkins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    verificationMethodId: uuid("verification_method_id")
      .notNull()
      .references(() => checkinVerificationMethods.id, { onDelete: "restrict" }),
    itineraryId: uuid("itinerary_id").references(() => itineraries.id, { onDelete: "set null" }),
    recordedByAdminId: uuid("recorded_by_admin_id"),
    verificationCodeUsed: text("verification_code_used"),
    groupSize: integer("group_size").default(1).notNull(),
    checkInSource: text("check_in_source").notNull(),
    duplicateGuardHash: text("duplicate_guard_hash").notNull(),
    notes: text("notes"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("destination_checkins_guard_idx").on(t.duplicateGuardHash),
    index("destination_checkins_place_idx").on(t.placeId, t.checkedInAt),
  ]
);

export const visitorArrivalRecords = pgTable(
  "visitor_arrival_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkinId: uuid("checkin_id")
      .notNull()
      .references(() => destinationCheckins.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    arrivalDate: date("arrival_date").notNull(),
    arrivalCount: integer("arrival_count").notNull(),
    sourceLabel: text("source_label").notNull(),
    reliabilityTier: text("reliability_tier").notNull(),
    verifiedByAdminId: uuid("verified_by_admin_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("visitor_arrival_date_idx").on(t.arrivalDate, t.placeId)]
);

// ============================================================================
// 6. ADMINISTRATION, RBAC & AUDIT TABLES
// ============================================================================

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("admin_users_username_idx").on(t.username), uniqueIndex("admin_users_email_idx").on(t.email)]
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(), // super_admin, tourism_admin, content_editor, visitor_data_officer
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("roles_slug_idx").on(t.slug)]
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
  },
  (t) => [uniqueIndex("permissions_slug_idx").on(t.slug)]
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

export const adminRoleAssignments = pgTable(
  "admin_role_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("admin_role_unique_idx").on(t.adminUserId, t.roleId)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    actorUsername: text("actor_username").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    summary: text("summary").notNull(),
    metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt), index("audit_logs_actor_idx").on(t.adminUserId)]
);

export const contentRevisions = pgTable(
  "content_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    versionNumber: integer("version_number").default(1).notNull(),
    status: contentStatusEnum("status").notNull(),
    snapshotJson: jsonb("snapshot_json").$type<Record<string, unknown>>().notNull(),
    editedByAdminId: uuid("edited_by_admin_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    changeNote: text("change_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("content_revisions_entity_idx").on(t.entityType, t.entityId)]
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    filename: text("filename").notNull(),
    url: text("url").notNull(),
    blobPath: text("blob_path"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").default(0).notNull(),
    altText: text("alt_text").notNull(),
    caption: text("caption"),
    attribution: text("attribution").notNull(),
    isIllustrative: boolean("is_illustrative").default(false).notNull(),
    category: text("category").default("general").notNull(),
    uploadedByAdminId: uuid("uploaded_by_admin_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("media_assets_cat_idx").on(t.category)]
);

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  valueJson: jsonb("value_json").$type<Record<string, unknown>>().notNull(),
  description: text("description").notNull(),
  updatedByAdminId: uuid("updated_by_admin_id").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referenceCounters = pgTable("reference_counters", {
  key: text("key").primaryKey(),
  lastValue: integer("last_value").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const barangaysRelations = relations(barangays, ({ many }) => ({
  places: many(places),
  products: many(localProducts),
  events: many(events),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  barangay: one(barangays, {
    fields: [places.barangayId],
    references: [barangays.id],
  }),
  primaryCategory: one(placeCategories, {
    fields: [places.primaryCategoryId],
    references: [placeCategories.id],
  }),
  images: many(placeImages),
  amenities: many(placeAmenities),
  operatingHours: many(placeOperatingHours),
  cafeDetails: one(cafeDetails, {
    fields: [places.id],
    references: [cafeDetails.placeId],
  }),
  resortDetails: one(resortDetails, {
    fields: [places.id],
    references: [resortDetails.placeId],
  }),
  restaurantDetails: one(restaurantDetails, {
    fields: [places.id],
    references: [restaurantDetails.placeId],
  }),
  accommodationDetails: one(accommodationDetails, {
    fields: [places.id],
    references: [accommodationDetails.placeId],
  }),
  attractionDetails: one(attractionDetails, {
    fields: [places.id],
    references: [attractionDetails.placeId],
  }),
}));

export const itinerariesRelations = relations(itineraries, ({ one, many }) => ({
  stops: many(itineraryStops),
  accessCredential: one(itineraryAccessCredentials, {
    fields: [itineraries.id],
    references: [itineraryAccessCredentials.itineraryId],
  }),
  visitorSubmission: one(visitorSubmissions, {
    fields: [itineraries.id],
    references: [visitorSubmissions.itineraryId],
  }),
}));

export const itineraryStopsRelations = relations(itineraryStops, ({ one }) => ({
  itinerary: one(itineraries, {
    fields: [itineraryStops.itineraryId],
    references: [itineraries.id],
  }),
  place: one(places, {
    fields: [itineraryStops.placeId],
    references: [places.id],
  }),
}));

export const visitorSubmissionsRelations = relations(visitorSubmissions, ({ one }) => ({
  itinerary: one(itineraries, {
    fields: [visitorSubmissions.itineraryId],
    references: [itineraries.id],
  }),
  contactInfo: one(visitorContactInformation, {
    fields: [visitorSubmissions.id],
    references: [visitorContactInformation.submissionId],
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  roleAssignments: many(adminRoleAssignments),
}));

export const adminRoleAssignmentsRelations = relations(adminRoleAssignments, ({ one }) => ({
  adminUser: one(adminUsers, {
    fields: [adminRoleAssignments.adminUserId],
    references: [adminUsers.id],
  }),
  role: one(roles, {
    fields: [adminRoleAssignments.roleId],
    references: [roles.id],
  }),
}));
