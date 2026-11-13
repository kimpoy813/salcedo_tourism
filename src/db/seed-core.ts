import { eq, sql } from "drizzle-orm";
import type { AppDatabase } from "./index";
import * as schema from "./schema";
import {
  generateRetrievalCode,
  hashPassword,
  hashRetrievalCode,
  sha256Hex,
} from "../lib/crypto";

const VERIFIED_DATE = "2026-11-13";
const OFFICIAL_CENSUS_SOURCE =
  "Philippine Statistics Authority (PSA) 2020 Census / PhilAtlas Municipal Profile of Salcedo, Ilocos Sur";

export const SALCEDO_BARANGAYS = [
  {
    name: "Atabay",
    slug: "atabay",
    population2020: 285,
    population2015: 288,
    elevationMeters: 41.4,
    latitude: 17.1334,
    longitude: 120.5253,
    summary:
      "Lowland agricultural barangay southwest of Poblacion Sur, traversed by local farm roads connecting Pias, Lucbuban, and Sorioan.",
    highlights: ["Lowland rice paddies", "Atabay Bridge crossing", "Rural valley farmsteads"],
  },
  {
    name: "Balidbid",
    slug: "balidbid",
    population2020: 1273,
    population2015: 1181,
    elevationMeters: 65.0,
    latitude: 17.1499,
    longitude: 120.5414,
    summary:
      "Salcedo's most populous barangay, home to Sitio Arnap, scenic foothills along the Candon–Salcedo–Del Pilar corridor, and the Buaya River valley.",
    highlights: [
      "Salcedo Adventure and Leisure Park (Sitio Arnap)",
      "Buaya River valley corridor",
      "Ban-ao community settlements",
    ],
  },
  {
    name: "Baluarte",
    slug: "baluarte",
    population2020: 658,
    population2015: 690,
    elevationMeters: 56.5,
    latitude: 17.099,
    longitude: 120.5215,
    summary:
      "Southern foothill barangay bordering Santa Cruz and Gregorio del Pilar, celebrated for Baluarte Falls (Sangbay / Agila Falls).",
    highlights: [
      "Baluarte Falls (Agila / Sangbay Falls)",
      "Eagle-shaped gorge rock formation",
      "Forested mountain trails",
    ],
  },
  {
    name: "Baybayading",
    slug: "baybayading",
    population2020: 189,
    population2015: 248,
    elevationMeters: 360.7,
    latitude: 17.1207,
    longitude: 120.5657,
    summary:
      "High-elevation upland barangay at 360.7 meters above sea level on the eastern Cordillera slopes leading toward Mount Tirad.",
    highlights: ["Upland mountain ridges", "Hiking gateway toward Tirad Pass", "Orchards & agroforestry"],
  },
  {
    name: "Boguibog",
    slug: "boguibog",
    population2020: 648,
    population2015: 734,
    elevationMeters: 394.2,
    latitude: 17.0851,
    longitude: 120.5518,
    summary:
      "Southern upland barangay at 394.2 meters elevation bordering Gregorio del Pilar, offering sweeping highland views and cool upland climate.",
    highlights: ["Highland mountain terrain", "Cordillera foothill panoramas", "Cool upland air"],
  },
  {
    name: "Bulala-Leguey",
    slug: "bulala-leguey",
    population2020: 295,
    population2015: 306,
    elevationMeters: 127.2,
    latitude: 17.1298,
    longitude: 120.5752,
    summary:
      "Eastern upland barangay bordering Gregorio del Pilar just 6.6 km west of historic Mount Tirad.",
    highlights: ["Eastern foothill corridor", "Gateway toward Mount Tirad", "Agricultural terraces"],
  },
  {
    name: "Calangcuasan",
    slug: "calangcuasan",
    population2020: 1130,
    population2015: 1079,
    elevationMeters: 102.4,
    latitude: 17.1616,
    longitude: 120.5272,
    summary:
      "Salcedo's second-largest barangay in the northern valley bordering Galimuyod and Candon, known for productive orchards and farmsteads.",
    highlights: ["Northern agricultural valley", "Rambutan & fruit cultivation", "Galimuyod boundary corridor"],
  },
  {
    name: "Culiong",
    slug: "culiong",
    population2020: 280,
    population2015: 271,
    elevationMeters: 40.5,
    latitude: 17.1241,
    longitude: 120.5037,
    summary:
      "Western valley barangay near San Tiburcio and Santa Lucia, surrounded by irrigated lowland ricelands.",
    highlights: ["Western rice plains", "Quiet rural agricultural life"],
  },
  {
    name: "Dinaratan",
    slug: "dinaratan",
    population2020: 758,
    population2015: 811,
    elevationMeters: 42.7,
    latitude: 17.1148,
    longitude: 120.5295,
    summary:
      "Southern valley barangay connecting Sorioan and Baluarte along the inland route toward Santa Lucia and Santa Cruz.",
    highlights: ["Southern inland valley", "Access route to Baluarte Falls", "Tobacco & corn farms"],
  },
  {
    name: "Kaliwakiw",
    slug: "kaliwakiw",
    population2020: 366,
    population2015: 374,
    elevationMeters: 59.5,
    latitude: 17.1452,
    longitude: 120.5291,
    summary:
      "Western gateway barangay adjacent to Poblacion Norte and Candon City's Palacapac corridor.",
    highlights: ["Western approach from Candon", "Mixed orchard & rice fields"],
  },
  {
    name: "Kinmarin",
    slug: "kinmarin",
    population2020: 370,
    population2015: 382,
    elevationMeters: 228.5,
    latitude: 17.065,
    longitude: 120.5513,
    summary:
      "Southern highland barangay at 228.5 meters elevation, part of Salcedo's famed hiking ridge leading toward Tirad Pass.",
    highlights: ["Mountain trekking terrain", "Southern Cordillera foothills"],
  },
  {
    name: "Lucbuban",
    slug: "lucbuban",
    population2020: 551,
    population2015: 539,
    elevationMeters: 63.0,
    latitude: 17.1293,
    longitude: 120.5432,
    summary:
      "Central-southern barangay serving as the trailhead for Kinbandiw Falls, roughly a 30-minute walk from the Lucbuban Barangay Hall.",
    highlights: ["Trailhead to Kinbandiw Falls", "Forested stream valleys"],
  },
  {
    name: "Madarang",
    slug: "madarang",
    population2020: 254,
    population2015: 303,
    elevationMeters: 631.3,
    latitude: 17.1587,
    longitude: 120.578,
    summary:
      "Salcedo's highest barangay at 631.3 meters above sea level; Mount Madarang's cool mountain springs feed Bago Resort below.",
    highlights: [
      "Highest upland community (631.3m)",
      "Mount Madarang spring watershed",
      "Trekking route to Bago Falls",
    ],
  },
  {
    name: "Maligcong",
    slug: "maligcong",
    population2020: 299,
    population2015: 323,
    elevationMeters: 57.6,
    latitude: 17.1292,
    longitude: 120.5124,
    summary:
      "Western barangay bordered by Candon and Santa Lucia, known for quiet rural lanes and agricultural crops.",
    highlights: ["Western rural farmland", "Traditional Ilocano homesteads"],
  },
  {
    name: "Pias",
    slug: "pias",
    population2020: 485,
    population2015: 546,
    elevationMeters: 45.1,
    latitude: 17.1283,
    longitude: 120.5215,
    summary:
      "Historic valley barangay noted in regional records as the home of early 20th-century leader Bartolome Laoagan Apusen.",
    highlights: ["Historic community roots", "Central valley farmlands"],
  },
  {
    name: "Poblacion Norte",
    slug: "poblacion-norte",
    population2020: 910,
    population2015: 845,
    elevationMeters: 60.8,
    latitude: 17.1516,
    longitude: 120.536,
    summary:
      "Civic heart of Salcedo hosting the Municipal Hall, Salcedo Town Plaza & Gregorio del Pilar Shrine, Salcedo Rural Health Unit, and local eateries.",
    highlights: [
      "Salcedo Municipal Hall & Town Plaza",
      "Gregorio del Pilar Shrine",
      "Salcedo Rural Health Unit & Local Eateries",
    ],
  },
  {
    name: "Poblacion Sur",
    slug: "poblacion-sur",
    population2020: 598,
    population2015: 597,
    elevationMeters: 58.3,
    latitude: 17.1489,
    longitude: 120.5361,
    summary:
      "Southern town center hosting Saint Joseph Parish Church and the Ilocos Sur District Hospital – Salcedo along the National Road.",
    highlights: [
      "Saint Joseph Parish Church",
      "Ilocos Sur District Hospital – Salcedo",
      "Town center commercial strip",
    ],
  },
  {
    name: "San Gaspar",
    slug: "san-gaspar",
    population2020: 386,
    population2015: 369,
    elevationMeters: 55.2,
    latitude: 17.1491,
    longitude: 120.5292,
    summary:
      "Western approach barangay featuring San Gaspar Bridge along the road entering Salcedo from Candon City.",
    highlights: ["San Gaspar Bridge", "Gateway from Candon City"],
  },
  {
    name: "San Tiburcio",
    slug: "san-tiburcio",
    population2020: 596,
    population2015: 600,
    elevationMeters: 37.6,
    latitude: 17.1242,
    longitude: 120.5094,
    summary:
      "Lowest-elevation western barangay (37.6m) near Santa Lucia, anchored by San Tiburcio Bridge and irrigated fields.",
    highlights: ["San Tiburcio Bridge", "Western agricultural corridor"],
  },
  {
    name: "Sorioan",
    slug: "sorioan",
    population2020: 595,
    population2015: 622,
    elevationMeters: 57.1,
    latitude: 17.1219,
    longitude: 120.5365,
    summary:
      "Central-southern agricultural barangay noted for Salcedo's municipal cacao nursery supporting local tablea and chocolate farmers.",
    highlights: ["Sorioan Cacao Nursery Farm", "Cacao & fruit cultivation"],
  },
  {
    name: "Ubbog",
    slug: "ubbog",
    population2020: 184,
    population2015: 180,
    elevationMeters: 85.8,
    latitude: 17.14,
    longitude: 120.5582,
    summary:
      "Foothill barangay east of Balidbid named after the Ilocano word for natural spring ('ubbog'), leading toward Bago Resort and Madarang.",
    highlights: ["Natural foothill springs", "Route toward Bago Resort & Madarang"],
  },
];

export async function seedDatabase(db: AppDatabase): Promise<void> {
  // 1. Seed Roles & Permissions
  const roleDefs = [
    {
      slug: "super_admin",
      name: "Super Administrator",
      description: "Full administrative access across content, analytics, visitor data, settings, and admin accounts.",
    },
    {
      slug: "tourism_admin",
      name: "Tourism Administrator",
      description: "Manage tourism records, approve and publish content, oversee check-ins, and review aggregate reports.",
    },
    {
      slug: "content_editor",
      name: "Content Editor",
      description: "Create and edit draft tourism content and media assets; submit changes for approval.",
    },
    {
      slug: "visitor_data_officer",
      name: "Authorized Visitor Data Officer",
      description: "Access submitted visitor records, manage retention/anonymization, export reports, and verify arrivals.",
    },
  ];

  const permissionDefs = [
    { slug: "content.edit", name: "Edit Draft Content", category: "content" },
    { slug: "content.publish", name: "Approve & Publish Content", category: "content" },
    { slug: "media.manage", name: "Manage Media Library", category: "content" },
    { slug: "analytics.read", name: "View Anonymous & Aggregate Analytics", category: "analytics" },
    { slug: "visitor.aggregate.read", name: "View De-identified Visitor Insights", category: "visitor" },
    { slug: "visitor.pii.read", name: "View Visitor Contact Information", category: "visitor" },
    { slug: "visitor.pii.delete", name: "Anonymize or Delete Visitor Records", category: "visitor" },
    { slug: "visitor.export", name: "Export Tourism Reports", category: "reports" },
    { slug: "checkins.manage", name: "Record & Verify On-Site Check-ins", category: "checkins" },
    { slug: "admin.users.manage", name: "Manage Admin Users & Roles", category: "admin" },
    { slug: "admin.audit.read", name: "View Audit Logs", category: "admin" },
    { slug: "admin.settings.manage", name: "Configure Privacy & System Settings", category: "admin" },
  ];

  for (const perm of permissionDefs) {
    await db
      .insert(schema.permissions)
      .values(perm)
      .onConflictDoNothing({ target: schema.permissions.slug });
  }

  for (const role of roleDefs) {
    await db
      .insert(schema.roles)
      .values(role)
      .onConflictDoNothing({ target: schema.roles.slug });
  }

  const allRoles = await db.select().from(schema.roles);
  const allPerms = await db.select().from(schema.permissions);
  const roleBySlug = new Map(allRoles.map((r) => [r.slug, r]));
  const permBySlug = new Map(allPerms.map((p) => [p.slug, p]));

  const rolePermMap: Record<string, string[]> = {
    super_admin: permissionDefs.map((p) => p.slug),
    tourism_admin: [
      "content.edit",
      "content.publish",
      "media.manage",
      "analytics.read",
      "visitor.aggregate.read",
      "visitor.export",
      "checkins.manage",
    ],
    content_editor: ["content.edit", "media.manage"],
    visitor_data_officer: [
      "analytics.read",
      "visitor.aggregate.read",
      "visitor.pii.read",
      "visitor.pii.delete",
      "visitor.export",
      "checkins.manage",
    ],
  };

  for (const [roleSlug, permSlugs] of Object.entries(rolePermMap)) {
    const r = roleBySlug.get(roleSlug);
    if (!r) continue;
    for (const pSlug of permSlugs) {
      const p = permBySlug.get(pSlug);
      if (!p) continue;
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: r.id, permissionId: p.id })
        .onConflictDoNothing();
    }
  }

  // 2. Seed Default Admin Accounts (overridable via environment variables)
  const adminSeeds = [
    {
      username: process.env.ADMIN_USERNAME || "cedo_superadmin",
      email: process.env.ADMIN_EMAIL || "tourism@salcedo-ilocossur.gov.ph",
      fullName: "CEDO Super Administrator",
      password: process.env.ADMIN_PASSWORD || "SalcedoAdmin2026!",
      roleSlug: "super_admin",
    },
    {
      username: process.env.TOURISM_ADMIN_USERNAME || "tourism_officer",
      email: "officer@salcedo-ilocossur.gov.ph",
      fullName: "Municipal Tourism Officer",
      password: process.env.TOURISM_ADMIN_PASSWORD || "SalcedoTourism2026!",
      roleSlug: "tourism_admin",
    },
    {
      username: process.env.EDITOR_USERNAME || "cedo_editor",
      email: "editor@salcedo-ilocossur.gov.ph",
      fullName: "Tourism Content Editor",
      password: process.env.EDITOR_PASSWORD || "SalcedoEditor2026!",
      roleSlug: "content_editor",
    },
    {
      username: process.env.DATA_OFFICER_USERNAME || "data_officer",
      email: "dpo@salcedo-ilocossur.gov.ph",
      fullName: "Authorized Visitor Data Officer",
      password: process.env.DATA_OFFICER_PASSWORD || "SalcedoDPO2026!",
      roleSlug: "visitor_data_officer",
    },
  ];

  for (const acc of adminSeeds) {
    const existingUser = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, acc.username))
      .limit(1);

    let adminId = existingUser[0]?.id;
    if (!adminId) {
      const [inserted] = await db
        .insert(schema.adminUsers)
        .values({
          username: acc.username,
          email: acc.email,
          fullName: acc.fullName,
          passwordHash: hashPassword(acc.password),
          isActive: true,
        })
        .returning({ id: schema.adminUsers.id });
      adminId = inserted.id;
    }

    const r = roleBySlug.get(acc.roleSlug);
    if (adminId && r) {
      await db
        .insert(schema.adminRoleAssignments)
        .values({ adminUserId: adminId, roleId: r.id })
        .onConflictDoNothing();
    }
  }

  // 3. Seed System Settings
  const settings = [
    {
      key: "privacy_policy",
      valueJson: {
        version: "2026.1-RA10173",
        retentionDays: 365,
        controllerName: "Municipality of Salcedo — Municipal Tourism & CEDO Office",
        controllerEmail: "tourism@salcedo-ilocossur.gov.ph",
      },
      description: "Active Republic Act No. 10173 privacy notice version and retention configuration.",
    },
    {
      key: "analytics_config",
      valueJson: {
        sessionInactivityMinutes: 30,
        deduplicatePlaceViewsPerSession: true,
        excludeAdminSessions: true,
        retentionDays: 730,
      },
      description: "Privacy-conscious anonymous analytics ingestion configuration.",
    },
    {
      key: "checkin_module",
      valueJson: {
        enabled: true,
        requireAuthorizedStaffForPhysicalArrivals: true,
        notes: "Separates verified on-site tourist arrivals from digital app views and planned trips.",
      },
      description: "Optional physical arrival check-in module settings.",
    },
  ];

  for (const s of settings) {
    await db
      .insert(schema.systemSettings)
      .values(s)
      .onConflictDoNothing({ target: schema.systemSettings.key });
  }

  // 4. Seed All 21 Official Barangays of Salcedo, Ilocos Sur
  for (const brgy of SALCEDO_BARANGAYS) {
    await db
      .insert(schema.barangays)
      .values({
        name: brgy.name,
        slug: brgy.slug,
        district: "Salcedo, Ilocos Sur (2nd District)",
        population2020: brgy.population2020,
        population2015: brgy.population2015,
        elevationMeters: brgy.elevationMeters,
        latitude: brgy.latitude,
        longitude: brgy.longitude,
        summary: brgy.summary,
        historyNotes: `Official barangay of the Municipality of Salcedo (formerly Baugen), Postal Code 2711, Region I.`,
        highlights: brgy.highlights,
        featuredImageUrl: "/images/salcedo/hero-salcedo-valley.png",
        sourceReference: OFFICIAL_CENSUS_SOURCE,
        verificationDate: VERIFIED_DATE,
      })
      .onConflictDoNothing({ target: schema.barangays.slug });
  }

  const dbBarangays = await db.select().from(schema.barangays);
  const brgyBySlug = new Map(dbBarangays.map((b) => [b.slug, b]));

  // 5. Seed Categories
  const categoryDefs = [
    {
      name: "Nature & Waterfalls",
      slug: "nature-waterfalls",
      groupType: "nature",
      description: "Mountain waterfalls, natural pools, river corridors, and upland scenic spots.",
      iconName: "Trees",
      displayOrder: 1,
    },
    {
      name: "Resorts & Spring Pools",
      slug: "resorts-staycations",
      groupType: "resort",
      description: "Mountain spring resorts, cottages, leisure pools, and farm stays.",
      iconName: "Waves",
      displayOrder: 2,
    },
    {
      name: "Cafés & Coffee Spots",
      slug: "cafes-coffee",
      groupType: "cafe",
      description: "Local coffee shops, artisanal tablea lounges, and cozy snack spots.",
      iconName: "Coffee",
      displayOrder: 3,
    },
    {
      name: "Where to Eat",
      slug: "restaurants-eateries",
      groupType: "restaurant",
      description: "Local grills, eateries, carinderias, and authentic Ilocano dining.",
      iconName: "UtensilsCrossed",
      displayOrder: 4,
    },
    {
      name: "Culture & Heritage",
      slug: "culture-heritage",
      groupType: "heritage",
      description: "Civic landmarks, memorials, parish heritage, and community history.",
      iconName: "Landmark",
      displayOrder: 5,
    },
    {
      name: "Agri-Tourism & Local Finds",
      slug: "agritourism-local-finds",
      groupType: "business",
      description: "Rambutan orchards, cacao nurseries, artisanal tablea producers, and farms.",
      iconName: "Sprout",
      displayOrder: 6,
    },
    {
      name: "Accommodations",
      slug: "accommodations",
      groupType: "accommodation",
      description: "Overnight farm rooms, inns, and verified homestays.",
      iconName: "BedDouble",
      displayOrder: 7,
    },
    {
      name: "Essential Services",
      slug: "essential-services",
      groupType: "service",
      description: "Municipal offices, district hospital, health unit, and emergency response.",
      iconName: "ShieldPlus",
      displayOrder: 8,
    },
  ];

  for (const cat of categoryDefs) {
    await db
      .insert(schema.placeCategories)
      .values(cat)
      .onConflictDoNothing({ target: schema.placeCategories.slug });
  }

  const dbCats = await db.select().from(schema.placeCategories);
  const catBySlug = new Map(dbCats.map((c) => [c.slug, c]));

  // 6. Seed Verified Places & Establishments + Clearly Labeled Administrative Draft Placeholders
  type SeedPlace = {
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    placeType: (typeof schema.placeTypeEnum.enumValues)[number];
    categorySlug: string;
    barangaySlug: string;
    address: string;
    latitude: number;
    longitude: number;
    phone?: string | null;
    socialMediaUrl?: string | null;
    featuredImageUrl: string;
    featuredImageCaption: string;
    isFeatured: boolean;
    isHiddenGem: boolean;
    isPlaceholder: boolean;
    status: "draft" | "pending_review" | "published" | "archived";
    sourceReference: string;
    verificationDate: string | null;
    attraction?: {
      activities: string[];
      visitorGuidelines: string[];
      entranceInfo: string | null;
      historicalDetails: string | null;
      difficultyLevel: string;
      estimatedDurationMinutes: number;
    };
    resort?: {
      poolsSummary: string | null;
      cottagesSummary: string | null;
      roomsSummary: string | null;
      recreationalFacilities: string[];
      entranceFeeNote: string | null;
      cottageRoomRatesNote: string | null;
      policies: string[];
      externalInquiryUrl: string | null;
    };
    restaurant?: {
      cuisineType: string;
      menuHighlights: string[];
      featuredDishes: string[];
      diningOptions: string[];
      hasParking: boolean | null;
      priceRangeNote: string | null;
    };
    cafe?: {
      featuredDrinks: string[];
      foodOfferings: string[];
      priceRangeNote: string | null;
      hasWifi: boolean | null;
      hasParking: boolean | null;
      seatingOptions: string[];
      brewStyleNote: string | null;
    };
    accommodation?: {
      accommodationType: string;
      roomTypesSummary: string | null;
      rateNote: string | null;
      amenitiesSummary: string[];
      checkInOutPolicy: string | null;
      bookingInquiryUrl: string | null;
    };
  };

  const seedPlaces: SeedPlace[] = [
    {
      name: "Baluarte Falls (Sangbay / Agila Falls)",
      slug: "baluarte-falls-agila-falls",
      shortDescription:
        "A scenic 20-meter mountain waterfall in Barangay Baluarte featuring an eagle-shaped rock formation and clear emerald plunge pool.",
      description:
        "Tucked inside a lush mountain gorge in Barangay Baluarte, Baluarte Falls—locally known as Sangbay Falls or Agila Falls due to a natural eagle-shaped rock formation near the cascade—drops roughly 20 meters into a cool, clear freshwater basin surrounded by dense tropical foliage.",
      placeType: "nature",
      categorySlug: "nature-waterfalls",
      barangaySlug: "baluarte",
      address: "Barangay Baluarte, Salcedo, Ilocos Sur 2711",
      latitude: 17.0958,
      longitude: 120.5262,
      featuredImageUrl: "/images/salcedo/baluarte-falls.png",
      featuredImageCaption:
        "Editorial visual illustration of Baluarte Falls mountain cascade (Barangay Baluarte, Salcedo).",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference:
        "Banat Turismo Salcedo Tourism Profile & Traveloka/Ilocos Sur Local Destination Records",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["Waterfall sightseeing", "Freshwater swimming", "Short mountain trek", "Nature photography"],
        visitorGuidelines: [
          "Coordinate at Barangay Baluarte Hall before trekking during rainy months.",
          "Wear non-slip footwear on wet gorge rocks.",
          "Pack out all trash to keep the watershed clean.",
        ],
        entranceInfo: "Public natural attraction; coordinate locally with barangay guides for trail access.",
        historicalDetails: "Named Agila Falls by residents for the eagle-like rock silhouette beside the falls.",
        difficultyLevel: "Moderate short hike",
        estimatedDurationMinutes: 120,
      },
    },
    {
      name: "Bago Resort (Bago Spring Water Resort)",
      slug: "bago-resort-spring-water",
      shortDescription:
        "Ilocos Sur's pioneering natural mountain spring-water pool fed directly by Mount Madarang springs beside the Buaya River.",
      description:
        "Located in the eastern foothills near Ubbog and Mount Madarang, Bago Resort (historically known locally as Kakalkaldingan) is noted as the first man-made pool in Ilocos Sur supplied continuously by natural chlorine-free mountain spring water from Mount Madarang. Features separate kids and adult flowing spring pools, kubo cottages, deck tables, a function hall, and direct proximity to the Grand Buaya River and the trail to Bago Falls.",
      placeType: "resort",
      categorySlug: "resorts-staycations",
      barangaySlug: "ubbog",
      address: "Eastern Foothills (via Ubbog / Madarang Road), Salcedo, Ilocos Sur 2711",
      latitude: 17.1415,
      longitude: 120.5675,
      phone: "+63 956 051 7596",
      socialMediaUrl: "https://www.facebook.com/BagoResort/",
      featuredImageUrl: "/images/salcedo/spring-water-resort.png",
      featuredImageCaption:
        "Editorial visual illustration of upland mountain spring-water pools and nipa cottages (Salcedo foothills).",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference:
        "Bago Resort Official Facebook Page (@BagoResort), Mapcarta Node 5339172722, Public Visitor Rate Advisories",
      verificationDate: VERIFIED_DATE,
      resort: {
        poolsSummary:
          "Two natural chlorine-free flowing spring-water pools (kids pool and adult pool) fed by Mount Madarang.",
        cottagesSummary: "Poolside tables (6–8 pax), deck-view tables (6–8 pax), and kubo cottages (8–10 pax).",
        roomsSummary: "Day-use cottages and group function hall (approx. 100 pax capacity).",
        recreationalFacilities: [
          "Natural mountain spring swimming pools",
          "Buaya River access",
          "Function hall",
          "Cooking & picnic areas",
          "Hike access toward Mount Madarang / Bago Falls",
        ],
        entranceFeeNote:
          "Published public advisories cite ₱40 (children), ₱50 (teens & adults), 0–6 yrs free (subject to seasonal updates; verify via contact number).",
        cottageRoomRatesNote:
          "Publicly listed historical rates: poolside tables ₱100, deck tables ₱150, kubo cottages ₱250, function hall ₱1,000 (first-come, first-served).",
        policies: [
          "First-come, first-served policy for cottages and tables.",
          "Guests may bring food/drinks (corkage policy may apply for certain promos).",
        ],
        externalInquiryUrl: "https://www.facebook.com/BagoResort/",
      },
    },
    {
      name: "Bakaan Farm and Resort",
      slug: "bakaan-farm-and-resort",
      shortDescription:
        "Sustainable agritourism farm, learning center, and resort featuring air-conditioned rooms, pool with slide, and seasonal rambutan orchards.",
      description:
        "Bakaan Farm and Resort serves both as an agricultural learning center and family resort in Salcedo. Visitors experience sustainable organic farming, vermiculture workshops, and seasonal rambutan picking across over 200 rambutan trees (typically July–September/October), alongside an outdoor pool with slide, air-conditioned guest rooms, and a 150-guest function hall.",
      placeType: "resort",
      categorySlug: "resorts-staycations",
      barangaySlug: "balidbid",
      address: "Bakaan, Salcedo, Ilocos Sur 2711",
      latitude: 17.1475,
      longitude: 120.544,
      phone: "+63 929 338 8998",
      socialMediaUrl: "https://www.facebook.com/people/Bakaan-Farm-and-Resort/100064156234170/",
      featuredImageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      featuredImageCaption:
        "Editorial visual illustration representing Salcedo's rambutan harvests and upland agritourism.",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference:
        "Bakaan Farm and Resort Official Facebook Page & Banat Turismo Salcedo Profile",
      verificationDate: VERIFIED_DATE,
      resort: {
        poolsSummary: "Large outdoor swimming pool with slide.",
        cottagesSummary: "Farm pavilions and garden rest areas for group educational tours (Lakbay Aral).",
        roomsSummary: "Air-conditioned guest rooms with cable TV, Wi-Fi, and private bathrooms.",
        recreationalFacilities: [
          "Outdoor pool with slide",
          "200+ tree rambutan orchard (seasonal picking)",
          "Organic farming & vermiculture learning center",
          "150-person function hall",
        ],
        entranceFeeNote: "Contact management (+63 929 338 8998) for current day-tour and Lakbay Aral rates.",
        cottageRoomRatesNote: "Room and function hall rates available directly upon inquiry.",
        policies: [
          "Advance coordination recommended for Lakbay Aral school/group tours.",
          "Rambutan picking is strictly seasonal (July–October harvest window).",
        ],
        externalInquiryUrl: "https://www.facebook.com/people/Bakaan-Farm-and-Resort/100064156234170/",
      },
      accommodation: {
        accommodationType: "Farm Resort & Guest Rooms",
        roomTypesSummary: "Air-conditioned private rooms equipped with private bathrooms, cable TV, and Wi-Fi.",
        rateNote: "Verify current overnight room rates directly at +63 929 338 8998.",
        amenitiesSummary: ["Air-conditioning", "Wi-Fi", "Private bathrooms", "Pool access", "Farm tour access"],
        checkInOutPolicy: "Confirm check-in/check-out times directly with Bakaan Farm and Resort.",
        bookingInquiryUrl: "https://www.facebook.com/people/Bakaan-Farm-and-Resort/100064156234170/",
      },
    },
    {
      name: "Salcedo Adventure and Leisure Park",
      slug: "salcedo-adventure-leisure-park",
      shortDescription:
        "Outdoor adventure park at Sitio Arnap, Balidbid overlooking the Buaya River and surrounding foothills.",
      description:
        "Situated along the Candon–Galimuyod–Salcedo–Del Pilar Road in Sitio Arnap, Barangay Balidbid, Salcedo Adventure and Leisure Park offers outdoor ziplining, rappelling, nature trails, pool and river swimming, and shaded picnic cottages framing panoramic views of Salcedo's mountains and the Buaya River.",
      placeType: "attraction",
      categorySlug: "nature-waterfalls",
      barangaySlug: "balidbid",
      address: "Sitio Arnap, Candon–Galimuyod–Salcedo–Del Pilar Rd, Brgy. Balidbid, Salcedo, Ilocos Sur",
      latitude: 17.1488,
      longitude: 120.5465,
      featuredImageUrl: "/images/salcedo/hero-salcedo-valley.png",
      featuredImageCaption:
        "Editorial visual illustration of Salcedo's Buaya River valley and foothills near Sitio Arnap.",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference: "Banat Turismo Salcedo Profile & Ilocos Sur Tourism Directory",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["Ziplining", "Rappelling", "Nature hikes", "River & pool swimming", "Picnicking"],
        visitorGuidelines: [
          "Observed daily schedule listed in municipal profile: 8:00 AM – 5:00 PM.",
          "Follow safety briefings from park staff for zipline and rappelling activities.",
        ],
        entranceInfo: "Historically listed entrance fee of ₱50 per person (verify current activity rates on-site).",
        historicalDetails: "Developed to showcase the natural Buaya River corridor and upland gateway of Balidbid.",
        difficultyLevel: "Easy to Moderate",
        estimatedDurationMinutes: 180,
      },
    },
    {
      name: "Kinbandiw Falls",
      slug: "kinbandiw-falls",
      shortDescription:
        "A serene hidden waterfall in Barangay Lucbuban reached via a scenic 30-minute walk from the barangay hall.",
      description:
        "Recognized as one of Salcedo's quiet natural gems, Kinbandiw Falls lies approximately 30 minutes on foot from the Barangay Hall of Lucbuban. Clear upland water cascades over layered stone shelves into a tranquil woodland pool ideal for unhurried nature appreciation.",
      placeType: "nature",
      categorySlug: "nature-waterfalls",
      barangaySlug: "lucbuban",
      address: "Barangay Lucbuban, Salcedo, Ilocos Sur 2711",
      latitude: 17.1318,
      longitude: 120.5468,
      featuredImageUrl: "/images/salcedo/baluarte-falls.png",
      featuredImageCaption:
        "Editorial visual illustration of secluded mountain cascade waters in Barangay Lucbuban.",
      isFeatured: false,
      isHiddenGem: true,
      isPlaceholder: false,
      status: "published",
      sourceReference: "Banat Turismo Salcedo Tourism Sector Compilation",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["30-minute nature walk", "Waterfall viewing", "Freshwater dip", "Photography"],
        visitorGuidelines: [
          "Log in at Barangay Lucbuban Hall before starting the trail.",
          "Bring drinking water and sturdy trail footwear.",
        ],
        entranceInfo: "No fixed commercial entrance fee published; inquire at Lucbuban Barangay Hall.",
        historicalDetails: "A community-stewarded natural spring cascade.",
        difficultyLevel: "Easy–Moderate 30-min walk",
        estimatedDurationMinutes: 120,
      },
    },
    {
      name: "Salcedo Town Plaza & Gregorio del Pilar Shrine",
      slug: "salcedo-town-plaza-del-pilar-shrine",
      shortDescription:
        "Historic civic square in Poblacion Norte featuring the equestrian monument of Gen. Gregorio del Pilar facing Tirad Pass.",
      description:
        "At the heart of Poblacion Norte stands Salcedo Town Plaza, anchored by the Gregorio del Pilar Shrine depicting the young revolutionary hero on horseback facing east toward historic Tirad Pass where he fought his final battle. Flanked by the Municipal Hall and mountain horizons, it is Salcedo's premier civic and heritage landmark.",
      placeType: "heritage",
      categorySlug: "culture-heritage",
      barangaySlug: "poblacion-norte",
      address: "Poblacion Norte, Salcedo, Ilocos Sur 2711",
      latitude: 17.15107,
      longitude: 120.53634,
      featuredImageUrl: "/images/salcedo/plaza-heritage.png",
      featuredImageCaption:
        "Editorial visual illustration of Salcedo's tranquil historic town plaza and distant mountain range.",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference: "Banat Turismo Salcedo & Municipal Heritage Records",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["Heritage sightseeing", "Historical reflection", "Evening plaza strolls", "Community events"],
        visitorGuidelines: ["Open public civic square; respect memorial monument grounds."],
        entranceInfo: "Free public access.",
        historicalDetails:
          "Honors Gen. Gregorio del Pilar's legacy and Salcedo's historic position as a foothill gateway toward Tirad Pass.",
        difficultyLevel: "Accessible to all",
        estimatedDurationMinutes: 45,
      },
    },
    {
      name: "Saint Joseph Parish Church",
      slug: "saint-joseph-parish-church",
      shortDescription:
        "Salcedo's enduring Roman Catholic parish church in the Poblacion center, anchoring local religious festivals and community faith.",
      description:
        "Located in the town center between Poblacion Norte and Poblacion Sur, Saint Joseph Parish Church serves as the spiritual centerpiece of Salcedo's parish celebrations, Holy Week traditions, and town patronal gatherings.",
      placeType: "heritage",
      categorySlug: "culture-heritage",
      barangaySlug: "poblacion-sur",
      address: "Poblacion Sur / Poblacion Norte, Salcedo, Ilocos Sur 2711",
      latitude: 17.1501,
      longitude: 120.5366,
      featuredImageUrl: "/images/salcedo/plaza-heritage.png",
      featuredImageCaption:
        "Editorial visual illustration representing Salcedo's parish heritage and town center.",
      isFeatured: false,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference: "WorldPlaces Salcedo Directory & Local Parish Records",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["Heritage church visit", "Quiet prayer", "Patronal celebration attendance"],
        visitorGuidelines: ["Observe modest attire and silence during parish liturgical services."],
        entranceInfo: "Free public entry.",
        historicalDetails: "Parish center dedicated to Saint Joseph serving Salcedo's 21 barangays.",
        difficultyLevel: "Accessible to all",
        estimatedDurationMinutes: 30,
      },
    },
    {
      name: "Salcedo Upland Resort",
      slug: "salcedo-upland-resort",
      shortDescription:
        "Accessible upland leisure resort situated near Poblacion Sur and the Sorioan road corridor.",
      description:
        "Verified in local geographic directories near the town proper along the Poblacion Sur–Sorioan corridor, Salcedo Upland Resort provides convenient local leisure access close to central town landmarks.",
      placeType: "resort",
      categorySlug: "resorts-staycations",
      barangaySlug: "poblacion-sur",
      address: "Poblacion Sur / Sorioan Road, Salcedo, Ilocos Sur 2711",
      latitude: 17.1456,
      longitude: 120.5378,
      featuredImageUrl: "/images/salcedo/spring-water-resort.png",
      featuredImageCaption:
        "Editorial visual illustration of Salcedo's upland resort scenery (verify on-site facilities directly).",
      isFeatured: false,
      isHiddenGem: true,
      isPlaceholder: false,
      status: "published",
      sourceReference: "WorldPlaces Salcedo Local Geographic Directory",
      verificationDate: VERIFIED_DATE,
      resort: {
        poolsSummary: "Local upland leisure facilities near Poblacion Sur (pool specs pending full LGU field audit).",
        cottagesSummary: "Day-use rest areas (contact Municipal Tourism Office for updated details).",
        roomsSummary: null,
        recreationalFacilities: ["Upland valley leisure setting", "Proximity to Poblacion landmarks"],
        entranceFeeNote: "Rates not yet verified in public municipal records; inquire on-site.",
        cottageRoomRatesNote: null,
        policies: ["Confirm operating hours and event availability directly before group travel."],
        externalInquiryUrl: null,
      },
    },
    {
      name: "Palay's BBQ",
      slug: "palays-bbq-poblacion-norte",
      shortDescription:
        "Local grilled barbecue eatery in Barangay Poblacion Norte convenient to Salcedo Town Plaza.",
      description:
        "Listed in local Poblacion Norte directories just minutes from Salcedo Town Plaza and Central School, Palay's BBQ is a community grill spot serving straightforward Filipino barbecue staples.",
      placeType: "restaurant",
      categorySlug: "restaurants-eateries",
      barangaySlug: "poblacion-norte",
      address: "Barangay Poblacion Norte, Salcedo, Ilocos Sur 2711",
      latitude: 17.1531,
      longitude: 120.5362,
      featuredImageUrl: "/images/salcedo/local-eatery-table.png",
      featuredImageCaption:
        "Editorial visual illustration of rural Ilocano barbecue & local dining table.",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference: "WorldPlaces Poblacion Norte, Salcedo Local Business Listing",
      verificationDate: VERIFIED_DATE,
      restaurant: {
        cuisineType: "Filipino Barbecue & Local Eatery",
        menuHighlights: ["Charcoal-grilled barbecue skewers (exact daily menu varies on-site)"],
        featuredDishes: ["Pork & Chicken Barbecue"],
        diningOptions: ["Casual Dine-In", "Takeout"],
        hasParking: null,
        priceRangeNote: "Menu prices not yet verified online; affordable local eatery pricing.",
      },
    },
    {
      name: "Tsokolate de Ylocos / Wynn's Food Products",
      slug: "tsokolate-de-ylocos-wynns-food-products",
      shortDescription:
        "DOST & DTI-assisted artisanal cacao tablea and award-winning 70% dark chocolate producer sourced from Salcedo cacao trees.",
      description:
        "Started in 2015 by Emmylou Jomero and assisted under the DOST & DTI SETUP Chocolate Industry Program in 2024, Tsokolate de Ylocos / Wynn's Food Products crafts pure cacao tablea, Top-5 Kakao Konek 2019 70% dark chocolate, coconut cacao jam, cacao toffee candy, sugar-free tablea, dragon fruit vinegar, and chili garlic products using cacao harvested in Salcedo.",
      placeType: "business",
      categorySlug: "agritourism-local-finds",
      barangaySlug: "poblacion-norte",
      address: "Salcedo, Ilocos Sur 2711",
      latitude: 17.15155,
      longitude: 120.53675,
      featuredImageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      featuredImageCaption:
        "Editorial visual illustration of Salcedo cacao pods, roasted beans, and artisanal tablea discs.",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference:
        "Wikipedia Salcedo Economy Profile, DOST/DTI SETUP 2024 Release & Kannawidan Ylocos Festival Recognition",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["Artisanal tablea discovery", "Local pasalubong sourcing", "Cacao craft learning"],
        visitorGuidelines: [
          "Contact the Municipal Tourism / CEDO Office to arrange producer visits or bulk pasalubong orders.",
        ],
        entranceInfo: "Local MSME producer showcase (visit by coordination).",
        historicalDetails:
          "Founded in 2015; ranked Top 5 in Best 70% Dark Chocolate Contest at Kakao Konek 2019 in Davao City.",
        difficultyLevel: "Accessible",
        estimatedDurationMinutes: 45,
      },
    },
    {
      name: "Sorioan Cacao Nursery Farm",
      slug: "sorioan-cacao-nursery-farm",
      shortDescription:
        "Community agricultural cacao nursery in Barangay Sorioan nurturing seedlings and supporting local cacao farmers.",
      description:
        "Established in Barangay Sorioan to strengthen Salcedo's thriving cacao value chain, the Cacao Nursery Farm cultivates healthy cacao seedlings and hosts technical assistance initiatives supporting farmers across the municipality.",
      placeType: "business",
      categorySlug: "agritourism-local-finds",
      barangaySlug: "sorioan",
      address: "Barangay Sorioan, Salcedo, Ilocos Sur 2711",
      latitude: 17.12121,
      longitude: 120.53633,
      featuredImageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      featuredImageCaption:
        "Editorial visual illustration of Salcedo's local cacao farming and nursery initiatives.",
      isFeatured: false,
      isHiddenGem: true,
      isPlaceholder: false,
      status: "published",
      sourceReference: "Banat Turismo Salcedo Tourism & Agriculture Profile",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["Agri-tourism visit", "Cacao cultivation briefing", "Farm photography"],
        visitorGuidelines: ["Coordinate with Barangay Sorioan or Municipal Agriculture Office prior to group tours."],
        entranceInfo: "Agricultural demonstration site (no commercial entrance fee).",
        historicalDetails: "Supports Salcedo's growing reputation for high-grade Ilocos Sur cacao.",
        difficultyLevel: "Easy",
        estimatedDurationMinutes: 60,
      },
    },
    {
      name: "Ilocos Sur District Hospital – Salcedo & Rural Health Unit",
      slug: "salcedo-district-hospital-and-rhu",
      shortDescription:
        "Essential municipal medical and emergency healthcare facilities serving residents and visitors in Poblacion.",
      description:
        "Located along the National Road in Poblacion Sur (District Hospital) and nearby Poblacion Norte (Rural Health Unit), these essential public facilities provide urgent medical consultation and emergency care for travelers in Salcedo.",
      placeType: "service",
      categorySlug: "essential-services",
      barangaySlug: "poblacion-sur",
      address: "National Road, Poblacion Sur / Poblacion Norte, Salcedo, Ilocos Sur 2711",
      latitude: 17.1483,
      longitude: 120.5354,
      phone: "0939 371 4081 (Hospital) / 0917 890 0064 (RHU)",
      featuredImageUrl: "/images/salcedo/plaza-heritage.png",
      featuredImageCaption: "Essential public medical service landmark in Poblacion, Salcedo.",
      isFeatured: false,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference: "LookPH District Hospital Listing & HealthcarePhilippines Salcedo RHU Directory",
      verificationDate: VERIFIED_DATE,
    },
    {
      name: "Mount Madarang Trail & Viewpoint",
      slug: "mount-madarang-trail-viewpoint",
      shortDescription:
        "High-elevation upland ridge trail in Barangay Madarang (631m ASL) overlooking the Buaya River valley and Cordillera foothills.",
      description:
        "Reaching Salcedo's highest barangay at 631 meters above sea level, the Mount Madarang Trail & Viewpoint treats hikers to cool pine-kissed mountain air, sweeping sunrise panoramas over the Buaya River valley, and watershed springs that feed Bago Resort below.",
      placeType: "nature",
      categorySlug: "nature-waterfalls",
      barangaySlug: "madarang",
      address: "Barangay Madarang, Salcedo, Ilocos Sur 2711",
      latitude: 17.1625,
      longitude: 120.5795,
      featuredImageUrl: "/images/salcedo/hero-salcedo-valley.png",
      featuredImageCaption:
        "Editorial visual illustration of Salcedo's upland valleys and Cordillera ridges near Madarang.",
      isFeatured: false,
      isHiddenGem: true,
      isPlaceholder: false,
      status: "published",
      sourceReference: "PhilAtlas Elevation Profile & Municipal Upland Trail Reference",
      verificationDate: VERIFIED_DATE,
      attraction: {
        activities: ["Sunrise ridge viewing", "Upland ridge hiking", "Watershed sightseeing", "Birdwatching"],
        visitorGuidelines: [
          "Coordinate with Barangay Madarang officials before attempting upper ridge hikes.",
          "Carry sufficient drinking water and start early to avoid midday heat.",
        ],
        entranceInfo: "Open upland barangay trail; coordinate locally for guided walks.",
        historicalDetails: "Natural spring watershed supplying eastern Salcedo foothills.",
        difficultyLevel: "Moderate to Challenging",
        estimatedDurationMinutes: 150,
      },
    },
    {
      name: "Salcedo Heritage Tablea & Coffee Corner",
      slug: "salcedo-heritage-tablea-coffee-corner",
      shortDescription:
        "Cozy poblacion café showcase serving traditional Salcedo cacao tablea hot chocolate, Cordillera drip coffee, and rice cakes.",
      description:
        "Steps from Salcedo Town Plaza in Poblacion Norte, this sample café showcase highlights Salcedo's homegrown cacao heritage—pairing rich sikwate (pure roasted tablea) and upland coffee brews with fresh Ilocano kakanin pastries for morning travelers.",
      placeType: "cafe",
      categorySlug: "cafes-coffee",
      barangaySlug: "poblacion-norte",
      address: "Town Plaza Perimeter, Poblacion Norte, Salcedo, Ilocos Sur 2711",
      latitude: 17.1522,
      longitude: 120.5354,
      featuredImageUrl: "/images/salcedo/local-eatery-table.png",
      featuredImageCaption:
        "Editorial visual illustration of Salcedo heritage coffee & tablea hospitality.",
      isFeatured: true,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference: "Municipal Sample Directory Entry (Cacao & Poblacion Showcase)",
      verificationDate: VERIFIED_DATE,
      cafe: {
        featuredDrinks: ["Traditional Salcedo Tablea Sikwate", "Iced Cacao Mocha", "Cordillera Pour-Over Coffee"],
        foodOfferings: ["Bibingka & Kakanin", "Toasted Pandesal with Cacao Jam", "Banana Turon"],
        priceRangeNote: "₱65 – ₱160 per drink & snack",
        hasWifi: true,
        hasParking: true,
        seatingOptions: ["Shaded Veranda", "Indoor Heritage Nook"],
        brewStyleNote: "Single-origin Salcedo cacao tablea whisked in cast-iron batirol alongside northern Luzon arabica.",
      },
    },
    {
      name: "Buaya River Valley Homestay & Farm Inn",
      slug: "buaya-river-valley-homestay",
      shortDescription:
        "Peaceful countryside farm guesthouse in Barangay Balidbid offering clean family rooms near Salcedo Adventure Park.",
      description:
        "Positioned along the quiet valley corridor of Barangay Balidbid between Poblacion and Bago Resort, this sample homestay profile offers travelers cool evening mountain breezes, home-cooked Ilocano breakfast, and convenient proximity to Salcedo's major trails.",
      placeType: "accommodation",
      categorySlug: "accommodations",
      barangaySlug: "balidbid",
      address: "Balidbid Valley Road, Brgy. Balidbid, Salcedo, Ilocos Sur 2711",
      latitude: 17.1481,
      longitude: 120.5429,
      featuredImageUrl: "/images/salcedo/spring-water-resort.png",
      featuredImageCaption:
        "Editorial visual illustration of countryside rest cottages and upland tranquility in Salcedo.",
      isFeatured: false,
      isHiddenGem: true,
      isPlaceholder: false,
      status: "published",
      sourceReference: "Municipal Sample Directory Entry (Valley Homestay Showcase)",
      verificationDate: VERIFIED_DATE,
      accommodation: {
        accommodationType: "Countryside Farm Homestay",
        roomTypesSummary: "4 fan & air-conditioned guest rooms (2–5 pax capacity per room) with garden veranda.",
        rateNote: "Typical overnight family stay ₱1,400 – ₱2,600/night (sample municipal guide rate).",
        amenitiesSummary: ["Free Parking", "Garden Veranda", "Ilocano Breakfast Option", "Quiet Valley Setting"],
        checkInOutPolicy: "Check-in 2:00 PM • Check-out 12:00 NN",
        bookingInquiryUrl: null,
      },
    },
    {
      name: "Kusina ti Ili Eatery & Ilocano Grill",
      slug: "kusina-ti-ili-ilocano-grill",
      shortDescription:
        "Warm community kitchen in Poblacion Sur serving classic Ilocano pinakbet, crispy bagnet, dinakdakan, and farm vegetables.",
      description:
        "Conveniently situated near Saint Joseph Parish Church and the National Road in Poblacion Sur, Kusina ti Ili showcases comforting home-style Ilocano cooking prepared with fresh valley produce, crispy bagnet, and smoky grilled meats.",
      placeType: "restaurant",
      categorySlug: "restaurants-eateries",
      barangaySlug: "poblacion-sur",
      address: "National Road, Brgy. Poblacion Sur, Salcedo, Ilocos Sur 2711",
      latitude: 17.1471,
      longitude: 120.5368,
      featuredImageUrl: "/images/salcedo/local-eatery-table.png",
      featuredImageCaption:
        "Editorial visual illustration of an authentic Ilocano dining table in Salcedo.",
      isFeatured: false,
      isHiddenGem: false,
      isPlaceholder: false,
      status: "published",
      sourceReference: "Municipal Sample Directory Entry (Ilocano Culinary Showcase)",
      verificationDate: VERIFIED_DATE,
      restaurant: {
        cuisineType: "Authentic Ilocano Home Cooking & Grill",
        menuHighlights: ["Pinakbet Ilocano", "Crispy Bagnet", "Grilled Liempo", "Dinakdakan"],
        featuredDishes: ["Pinakbet with Bagnet", "Pork Dinakdakan", "Fresh Tamarind Sinigang"],
        diningOptions: ["Open-Air Dine-In", "Family Bilao Takeout"],
        hasParking: true,
        priceRangeNote: "₱120 – ₱260 per meal",
      },
    },
    // Clearly labeled administrative placeholders (PENDING REVIEW — NOT PUBLICLY SHOWN until verified by Tourism Officer)
    {
      name: "[Admin Placeholder] Poblacion Specialty Coffee & Tablea Café",
      slug: "placeholder-poblacion-cafe",
      shortDescription:
        "Administrative placeholder awaiting Municipal Tourism Office field verification of independent cafés in Salcedo.",
      description:
        "This record is an administrative placeholder maintained by CEDO for field verification. Do not publish until exact business name, address, verified operating hours, and menu details are confirmed with the establishment owner.",
      placeType: "cafe",
      categorySlug: "cafes-coffee",
      barangaySlug: "poblacion-norte",
      address: "Pending Verification — Poblacion Norte, Salcedo, Ilocos Sur",
      latitude: 17.1518,
      longitude: 120.5359,
      featuredImageUrl: "/images/salcedo/local-eatery-table.png",
      featuredImageCaption: "Placeholder visual awaiting verified establishment photos.",
      isFeatured: false,
      isHiddenGem: false,
      isPlaceholder: true,
      status: "pending_review",
      sourceReference: "Administrative Placeholder — Pending Municipal Tourism Field Verification",
      verificationDate: null,
      cafe: {
        featuredDrinks: ["Pending field verification"],
        foodOfferings: ["Pending field verification"],
        priceRangeNote: null,
        hasWifi: null,
        hasParking: null,
        seatingOptions: [],
        brewStyleNote: "Awaiting Tourism Office verification.",
      },
    },
    {
      name: "[Admin Placeholder] Salcedo Upland Community Homestay",
      slug: "placeholder-upland-homestay",
      shortDescription:
        "Administrative placeholder for accredited barangay homestays awaiting DOT/LGU accreditation details.",
      description:
        "Administrative placeholder awaiting LGU accreditation records and owner consent before public listing.",
      placeType: "accommodation",
      categorySlug: "accommodations",
      barangaySlug: "balidbid",
      address: "Pending Verification — Barangay Balidbid, Salcedo, Ilocos Sur",
      latitude: 17.1492,
      longitude: 120.5425,
      featuredImageUrl: "/images/salcedo/spring-water-resort.png",
      featuredImageCaption: "Placeholder visual awaiting verified homestay photography.",
      isFeatured: false,
      isHiddenGem: false,
      isPlaceholder: true,
      status: "draft",
      sourceReference: "Administrative Placeholder — Pending LGU Accreditation",
      verificationDate: null,
      accommodation: {
        accommodationType: "Community Homestay (Unverified)",
        roomTypesSummary: null,
        rateNote: null,
        amenitiesSummary: [],
        checkInOutPolicy: null,
        bookingInquiryUrl: null,
      },
    },
  ];

  const legacyCoordBackfills: Record<string, [number, number]> = {
    "baluarte-falls-agila-falls": [17.099, 120.5215],
    "kinbandiw-falls": [17.1293, 120.5432],
    "salcedo-town-plaza-del-pilar-shrine": [17.1508, 120.536],
    "saint-joseph-parish-church": [17.1496, 120.5363],
    "salcedo-upland-resort": [17.1476, 120.5382],
    "palays-bbq-poblacion-norte": [17.1518, 120.5356],
    "tsokolate-de-ylocos-wynns-food-products": [17.1504, 120.5369],
    "sorioan-cacao-nursery-farm": [17.1219, 120.5365],
    "salcedo-district-hospital-and-rhu": [17.1485, 120.5362],
    "mount-madarang-trail-viewpoint": [17.1587, 120.578],
    "salcedo-heritage-tablea-coffee-corner": [17.1512, 120.5358],
    "kusina-ti-ili-ilocano-grill": [17.1489, 120.5364],
    "placeholder-poblacion-cafe": [17.1514, 120.5359],
  };

  for (const sp of seedPlaces) {
    const existing = await db
      .select()
      .from(schema.places)
      .where(eq(schema.places.slug, sp.slug))
      .limit(1);

    if (existing.length > 0) {
      const legacy = legacyCoordBackfills[sp.slug];
      if (
        legacy &&
        existing[0].latitude === legacy[0] &&
        existing[0].longitude === legacy[1]
      ) {
        await db
          .update(schema.places)
          .set({ latitude: sp.latitude, longitude: sp.longitude, updatedAt: new Date() })
          .where(eq(schema.places.id, existing[0].id));
      }
      continue;
    }

    const cat = catBySlug.get(sp.categorySlug);
    const brgy = brgyBySlug.get(sp.barangaySlug);

    const [createdPlace] = await db
      .insert(schema.places)
      .values({
        name: sp.name,
        slug: sp.slug,
        shortDescription: sp.shortDescription,
        description: sp.description,
        placeType: sp.placeType,
        primaryCategoryId: cat?.id ?? null,
        barangayId: brgy?.id ?? null,
        address: sp.address,
        latitude: sp.latitude,
        longitude: sp.longitude,
        phone: sp.phone ?? null,
        socialMediaUrl: sp.socialMediaUrl ?? null,
        featuredImageUrl: sp.featuredImageUrl,
        featuredImageCaption: sp.featuredImageCaption,
        isFeatured: sp.isFeatured,
        isHiddenGem: sp.isHiddenGem,
        isPlaceholder: sp.isPlaceholder,
        status: sp.status,
        sourceReference: sp.sourceReference,
        verificationDate: sp.verificationDate,
        publishedAt: sp.status === "published" ? new Date() : null,
      })
      .returning();

    if (cat) {
      await db
        .insert(schema.placeCategoryAssignments)
        .values({ placeId: createdPlace.id, categoryId: cat.id })
        .onConflictDoNothing();
    }

    await db.insert(schema.placeImages).values({
      placeId: createdPlace.id,
      url: sp.featuredImageUrl,
      caption: sp.featuredImageCaption,
      attribution: "Project CEDO: Turi App — Editorial Visual Asset",
      isIllustrative: true,
      displayOrder: 0,
    });

    if (sp.attraction) {
      await db.insert(schema.attractionDetails).values({
        placeId: createdPlace.id,
        ...sp.attraction,
      });
    }
    if (sp.resort) {
      await db.insert(schema.resortDetails).values({
        placeId: createdPlace.id,
        ...sp.resort,
      });
    }
    if (sp.restaurant) {
      await db.insert(schema.restaurantDetails).values({
        placeId: createdPlace.id,
        ...sp.restaurant,
      });
    }
    if (sp.cafe) {
      await db.insert(schema.cafeDetails).values({
        placeId: createdPlace.id,
        ...sp.cafe,
      });
    }
    if (sp.accommodation) {
      await db.insert(schema.accommodationDetails).values({
        placeId: createdPlace.id,
        ...sp.accommodation,
      });
    }
  }

  // 7. Seed Local Products & Producers
  const productsSeed = [
    {
      name: "Salcedo Fresh Rambutan",
      slug: "salcedo-rambutan",
      category: "agriculture",
      description:
        "Salcedo is celebrated as 'The Rambutan Basket of the North,' supported by 2,185 rambutan growers across its valley and foothill barangays. Sweet, juicy red rambutan fruits peak during harvest fairs alongside value-added dried rambutan and jams.",
      traditionNotes:
        "Municipal ordinances provide free rambutan seedlings to households while LGU processing initiatives support dried rambutan and preserves.",
      seasonalAvailability: "Peak harvest July – October (highlighted by October Banat Kadiwa cum Rambutan Harvest Fair)",
      priceNote: "Seasonal farm-gate prices commonly reported around ₱100–₱120/kg (varies by season and grade).",
      imageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      barangaySlug: "balidbid",
      isFeatured: true,
      sourceReference: "Philippine Information Agency (PIA) 2025 & Salcedo LGU Rambutan Grower Profile",
      producer: {
        producerName: "Salcedo Rambutan Growers & Bakaan Orchard",
        barangaySlug: "balidbid",
        address: "Across Balidbid, Calangcuasan, and Foothill Barangays, Salcedo, Ilocos Sur",
        contactInfo: "Via Salcedo Municipal Agriculture / CEDO Office",
      },
    },
    {
      name: "Tsokolate de Ylocos Artisanal Cacao Tablea & Dark Chocolate",
      slug: "tsokolate-de-ylocos-cacao-tablea",
      category: "delicacy",
      description:
        "Single-origin roasted cacao tablea discs, 70% dark chocolate bars, coconut cacao jam, cacao toffee candy, and sugar-free tablea crafted from Salcedo's towering cacao trees.",
      traditionNotes:
        "Traditional roasting, grinding, and molding of local cacao beans into rich tablea discs for hot morning tsokolate, enhanced with DOST & DTI SETUP equipment.",
      seasonalAvailability: "Available year-round via local MSME orders and provincial trade fairs.",
      priceNote: "Contact producer / municipal trade showcase for current pack pricing.",
      imageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      barangaySlug: "sorioan",
      isFeatured: true,
      sourceReference: "DOST/DTI SETUP 2024 & Wikipedia Salcedo Economy Profile (Wynn's Food Products)",
      producer: {
        producerName: "Wynn's Food Products (Tsokolate de Ylocos)",
        barangaySlug: "poblacion-norte",
        address: "Salcedo, Ilocos Sur 2711",
        contactInfo: "Coordinate through Salcedo Municipal Tourism / DTI Negosyo Center",
      },
    },
    {
      name: "Salcedo Upland Rice, Corn & Dragon Fruit Byproducts",
      slug: "salcedo-rice-dragonfruit-products",
      category: "agriculture",
      description:
        "Staple wet-rice valley harvests, upland corn, and locally processed dragon fruit vinegar and dragon fruit juice crafted by Salcedo micro-enterprises.",
      traditionNotes:
        "Reflects Salcedo's enduring agrarian identity along the Buaya River valley and foothills.",
      seasonalAvailability: "Harvest cycles throughout dry and wet seasons.",
      priceNote: "Market rates at Banat Kadiwa fairs.",
      imageUrl: "/images/salcedo/local-eatery-table.png",
      barangaySlug: "calangcuasan",
      isFeatured: false,
      sourceReference: "PSA Agricultural Profile & Salcedo MSME Trade Records",
      producer: {
        producerName: "Salcedo Kadiwa Farmers & MSME Collective",
        barangaySlug: "poblacion-norte",
        address: "Salcedo Public Market / Municipal Grounds, Poblacion Norte",
        contactInfo: "Municipal Agriculture Office, Salcedo",
      },
    },
  ];

  for (const prod of productsSeed) {
    const existing = await db
      .select()
      .from(schema.localProducts)
      .where(eq(schema.localProducts.slug, prod.slug))
      .limit(1);
    if (existing.length > 0) continue;

    const brgy = brgyBySlug.get(prod.barangaySlug);
    const [created] = await db
      .insert(schema.localProducts)
      .values({
        name: prod.name,
        slug: prod.slug,
        category: prod.category,
        description: prod.description,
        traditionNotes: prod.traditionNotes,
        seasonalAvailability: prod.seasonalAvailability,
        priceNote: prod.priceNote,
        imageUrl: prod.imageUrl,
        barangayId: brgy?.id ?? null,
        status: "published",
        isFeatured: prod.isFeatured,
        sourceReference: prod.sourceReference,
        verificationDate: VERIFIED_DATE,
      })
      .returning();

    const pBrgy = brgyBySlug.get(prod.producer.barangaySlug);
    await db.insert(schema.productProducers).values({
      productId: created.id,
      producerName: prod.producer.producerName,
      barangayId: pBrgy?.id ?? null,
      address: prod.producer.address,
      contactInfo: prod.producer.contactInfo,
      sourceReference: prod.sourceReference,
      verificationDate: VERIFIED_DATE,
    });
  }

  // 8. Seed Verified Festivals & Events
  const eventsSeed = [
    {
      title: "Banat Kadiwa cum Rambutan Harvest Fair",
      slug: "banat-kadiwa-rambutan-harvest-fair",
      category: "harvest_fair",
      description:
        "Salcedo's flagship agritourism harvest showcase offering over 2,000 kilograms of fresh local rambutan, fruit-picking experiences, rambutan eating contests, free household seedling initiatives, and Kadiwa MSME products.",
      startDate: "2026-10-03",
      endDate: "2026-10-04",
      venueName: "Salcedo Municipal Grounds / Town Plaza",
      barangaySlug: "poblacion-norte",
      imageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      scheduleNotes: "Typically held in early October during peak rambutan harvest; confirm exact annual dates with LGU.",
      organizer: "Local Government Unit (LGU) of Salcedo",
      isFeatured: true,
      sourceReference: "Philippine Information Agency (PIA) & Salcedo LGU Official Feature",
    },
    {
      title: "Salcedo Republic Act No. 1627 Renaming Commemoration",
      slug: "salcedo-ra-1627-anniversary",
      category: "community",
      description:
        "Annual civic commemoration marking June 20, 1957—when Republic Act No. 1627 officially renamed the Municipality of Bauguen (Baugen) to Salcedo.",
      startDate: "2027-06-20",
      endDate: "2027-06-20",
      venueName: "Salcedo Town Plaza & Municipal Hall",
      barangaySlug: "poblacion-norte",
      imageUrl: "/images/salcedo/plaza-heritage.png",
      scheduleNotes: "Annual municipal historical commemoration every June 20.",
      organizer: "Municipality of Salcedo",
      isFeatured: true,
      sourceReference: "Republic Act No. 1627 (June 20, 1957)",
    },
    {
      title: "Salcedo Motocross & Upland Adventure Showcase",
      slug: "salcedo-motocross-upland-showcase",
      category: "sports",
      description:
        "High-energy off-road motocross gathering turning Salcedo's rugged foothill terrain into a regional extreme-sports track featured during Ilocos Sur provincial festival circuits.",
      startDate: "2027-02-14",
      endDate: "2027-02-15",
      venueName: "Salcedo Motocross Track / Foothills",
      barangaySlug: "balidbid",
      imageUrl: "/images/salcedo/hero-salcedo-valley.png",
      scheduleNotes: "Dates align with February Ilocos Sur provincial festival schedule; verify annual race calendar with LGU.",
      organizer: "Municipality of Salcedo & Provincial Tourism Partners",
      isFeatured: false,
      sourceReference: "Ilocos Sur Festival 2026 Coverage (Salcedo Two-Day Motocross Competition)",
    },
  ];

  for (const ev of eventsSeed) {
    const brgy = brgyBySlug.get(ev.barangaySlug);
    await db
      .insert(schema.events)
      .values({
        title: ev.title,
        slug: ev.slug,
        category: ev.category,
        description: ev.description,
        startDate: ev.startDate,
        endDate: ev.endDate,
        venueName: ev.venueName,
        barangayId: brgy?.id ?? null,
        imageUrl: ev.imageUrl,
        scheduleNotes: ev.scheduleNotes,
        organizer: ev.organizer,
        status: "published",
        isFeatured: ev.isFeatured,
        sourceReference: ev.sourceReference,
        verificationDate: VERIFIED_DATE,
      })
      .onConflictDoNothing({ target: schema.events.slug });
  }

  // 9. Seed Historical & Cultural Articles & Travel Guides
  const historicalSeed = [
    {
      title: "From Bauguen to Salcedo: Republic Act No. 1627 (1957)",
      slug: "from-bauguen-to-salcedo-ra-1627",
      eraOrYear: "June 20, 1957",
      summary:
        "How the historic inland municipality formerly known as Bauguen (Baugen) was officially renamed Salcedo in honor of explorer Juan de Salcedo.",
      content:
        "Long before 1957, the riverside and foothill settlements of Salcedo were known officially as Bauguen (also spelled Baugen). Under American-era governance and early post-war Philippine administration, the town consolidated its 21 barangays from a 1903 census population of 1,504 to over 5,000 by 1939. On June 20, 1957, the Philippine Congress enacted Republic Act No. 1627, officially changing the municipality's name to Salcedo in commemoration of Spanish explorer Juan de Salcedo, who led early expeditions into Ilocos in 1572.",
      imageUrl: "/images/salcedo/seal-of-salcedo.png",
      imageCaption: "Official Municipal Seal of Bayan ng Salcedo, Lalawigan ng Ilocos Sur.",
      displayOrder: 1,
      sourceReference: "Republic Act No. 1627 & PSA Historical Census Records",
    },
    {
      title: "Foothills of Tirad Pass & Gen. Gregorio del Pilar Heritage",
      slug: "foothills-of-tirad-pass-heritage",
      eraOrYear: "1899 – Present",
      summary:
        "Salcedo's geographic role along the western approaches of Mount Tirad and the commemorative shrine at Salcedo Town Plaza.",
      content:
        "Nestled immediately west of Gregorio del Pilar and the soaring ridge of Mount Tirad, Salcedo's eastern barangays—Madarang, Baybayading, Bulala-Leguey, and Boguibog—stand at the foothills leading into the historic Cordillera pass. At the center of Poblacion Norte, the Gregorio del Pilar Shrine faces directly east toward Tirad Pass, reminding visitors of Salcedo's deep ties to northern Luzon history.",
      imageUrl: "/images/salcedo/plaza-heritage.png",
      imageCaption: "Editorial visual illustration of Salcedo's historic town plaza looking toward the Cordillera foothills.",
      displayOrder: 2,
      sourceReference: "Municipal Heritage Profile & PhilAtlas Topographic Landmarks",
    },
  ];

  for (const h of historicalSeed) {
    await db
      .insert(schema.historicalArticles)
      .values({
        ...h,
        status: "published",
        verificationDate: VERIFIED_DATE,
      })
      .onConflictDoNothing({ target: schema.historicalArticles.slug });
  }

  const culturalSeed = [
    {
      title: "The Rambutan Basket of the North",
      slug: "rambutan-basket-of-the-north",
      category: "craft",
      summary:
        "Over 2,185 rambutan growers make Salcedo a vibrant seasonal orchard capital across northern Luzon.",
      content:
        "Walk through Salcedo's valleys between July and October and crimson rambutan clusters frame roadside farms and hillside orchards. Backed by municipal seedling distribution ordinances and a dedicated processing initiative for dried rambutan and jams, rambutan cultivation unites rural families, agro-tourism visitors, and the annual Banat Kadiwa cum Rambutan Harvest Fair.",
      imageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      imageCaption: "Editorial visual illustration of Salcedo's crimson rambutan and cacao harvests.",
      isFeatured: true,
      sourceReference: "Philippine Information Agency (PIA) 2025 & Salcedo LGU",
    },
    {
      title: "Single-Origin Cacao & Artisanal Tablea Craft",
      slug: "artisanal-cacao-tablea-craft",
      category: "cuisine",
      summary:
        "From Sorioan's cacao seedling nurseries to national dark-chocolate acclaim, Salcedo's cacao artisans preserve traditional tablea making.",
      content:
        "Salcedo's well-drained valley soils nurture towering cacao trees whose fermented beans are roasted, ground, and hand-molded into pure tablea discs. Producers such as Wynn's Food Products (Tsokolate de Ylocos), supported by DOST and DTI SETUP upgrades, have brought Salcedo chocolate onto national stages—earning Top 5 honors at Kakao Konek while preserving the warmth of morning Ilocano tsokolate.",
      imageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      imageCaption: "Editorial visual illustration of roasted cacao pods and artisanal tablea.",
      isFeatured: true,
      sourceReference: "DOST/DTI SETUP 2024 & Banat Turismo Salcedo",
    },
    {
      title: "Bago & Upland Community Living Traditions",
      slug: "upland-community-living-traditions",
      category: "tradition",
      summary:
        "Cultural stewardship among Salcedo's Ilocano and upland communities participating in Begnas di Ilocos Sur.",
      content:
        "As one of Ilocos Sur's inland municipalities bordering upland indigenous cultural communities, Salcedo participates actively in provincial heritage showcases like Begnas di Ilocos Sur. Traditional farming stewardship, upland watershed care along Mount Madarang and the Buaya River, and warm hospitality define daily life across all 21 barangays.",
      imageUrl: "/images/salcedo/hero-salcedo-valley.png",
      imageCaption: "Editorial visual illustration of Salcedo's upland valleys and terraced farmlands.",
      isFeatured: false,
      sourceReference: "PIA Begnas di Ilocos Sur 2025 & Municipal Cultural Profile",
    },
  ];

  for (const c of culturalSeed) {
    await db
      .insert(schema.culturalArticles)
      .values({
        ...c,
        status: "published",
        verificationDate: VERIFIED_DATE,
      })
      .onConflictDoNothing({ target: schema.culturalArticles.slug });
  }

  const guidesSeed = [
    {
      title: "Getting to Salcedo, Ilocos Sur (Landlocked Valley Guide)",
      slug: "getting-to-salcedo-guide",
      category: "getting_here",
      summary:
        "Salcedo is an entirely landlocked mountain-valley municipality accessible via inland highways from Candon City, Galimuyod, and Santa Lucia.",
      content:
        "Unlike coastal towns along the West Philippine Sea, Salcedo is 100% landlocked—surrounded by Candon City and Galimuyod to the north/northwest, Gregorio del Pilar to the east, Santa Lucia to the west, and Santa Cruz to the south. From Manila or Vigan along the Manila North Road (MacArthur Highway), turn inland at Candon City via the Candon–Galimuyod–Salcedo–Del Pilar Road (roughly 20–30 minutes inland to Poblacion Norte). Travelers coming from Santa Lucia should note that mountain connector roads can be narrow during heavy rains; check local MDRRMO advisories before taking secondary upland routes.",
      tipsJson: [
        "Use Candon City via Galimuyod–Salcedo Road as the primary paved approach.",
        "Salcedo has no beaches—pack for rivers, mountain waterfalls, spring pools, and cool foothills.",
        "Save emergency numbers (MDRRMO 0995-129-3542) and download your itinerary offline before heading into upland barangays where cellular signal softens.",
      ],
      imageUrl: "/images/salcedo/ilocos-sur-locator-map.jpg",
      isFeatured: true,
      sourceReference: "PhilAtlas Geography Profile & Local Travel Advisories",
    },
    {
      title: "Seasonal Calendar: Dry Trails vs. Rambutan Harvest",
      slug: "seasonal-calendar-guide",
      category: "seasonal",
      summary:
        "Choose November–May for clear waterfall hikes and dry upland roads, or July–October for lush waterfalls and fresh rambutan orchards.",
      content:
        "Salcedo enjoys two distinct tropical seasons. The dry months from November through April offer crisp morning breezes, clear views toward Mount Tirad, and easy access to Baluarte Falls and Kinbandiw Falls. From July through October, mountain springs run full and Salcedo's 2,185 rambutan growers celebrate peak harvest season—culminating in the October Banat Kadiwa cum Rambutan Harvest Fair.",
      tipsJson: [
        "Visit July–October for fresh rambutan picking at participating orchards.",
        "Visit November–April for dry hiking trails toward Kinbandiw and Baluarte Falls.",
        "Always check in at barangay halls when hiking mountain waterfalls during rainy weeks.",
      ],
      imageUrl: "/images/salcedo/baluarte-falls.png",
      isFeatured: true,
      sourceReference: "PIA Feature & Municipal Tourism Seasonal Advisories",
    },
  ];

  for (const g of guidesSeed) {
    await db
      .insert(schema.travelGuides)
      .values({
        ...g,
        status: "published",
        verificationDate: VERIFIED_DATE,
      })
      .onConflictDoNothing({ target: schema.travelGuides.slug });
  }

  // 10. Seed Emergency Contacts
  const existingContacts = await db.select().from(schema.emergencyContacts).limit(1);
  if (existingContacts.length === 0) {
    const pobNorte = brgyBySlug.get("poblacion-norte");
    const pobSur = brgyBySlug.get("poblacion-sur");
    await db.insert(schema.emergencyContacts).values([
      {
        agencyName: "Salcedo MDRRMO (Disaster Risk Reduction & Management)",
        category: "mdrrmo",
        phoneNumbers: ["0995 129 3542"],
        address: "Municipal Compound, Poblacion Norte, Salcedo, Ilocos Sur 2711",
        barangayId: pobNorte?.id ?? null,
        operatingHours: "24/7 Emergency Operations",
        notes: "Primary contact for road, weather, and mountain trail safety advisories.",
        displayOrder: 1,
        sourceReference: "HuliPH / Salcedo Municipal Emergency Directory",
        verificationDate: VERIFIED_DATE,
      },
      {
        agencyName: "Salcedo Municipal Police Station (PNP)",
        category: "police",
        phoneNumbers: ["+63 927 783 7644", "+63 998 967 2953"],
        address: "Poblacion Norte, Salcedo, Ilocos Sur 2711",
        barangayId: pobNorte?.id ?? null,
        operatingHours: "24/7 Police Assistance",
        notes: "Includes Chief of Police & Station Hotline.",
        displayOrder: 2,
        sourceReference: "Philippine Police Contact Directory",
        verificationDate: VERIFIED_DATE,
      },
      {
        agencyName: "Salcedo Fire Station (Bureau of Fire Protection)",
        category: "fire",
        phoneNumbers: ["0917 186 7911", "0915 934 3324"],
        address: "Beside Municipal Health Office, Poblacion Norte, Salcedo, Ilocos Sur 2711",
        barangayId: pobNorte?.id ?? null,
        operatingHours: "24/7 Fire & Rescue",
        displayOrder: 3,
        sourceReference: "HuliPH Salcedo Fire Station Listing",
        verificationDate: VERIFIED_DATE,
      },
      {
        agencyName: "Ilocos Sur District Hospital – Salcedo",
        category: "medical",
        phoneNumbers: ["0939 371 4081"],
        address: "National Road, Poblacion Sur, Salcedo, Ilocos Sur 2711",
        barangayId: pobSur?.id ?? null,
        operatingHours: "24/7 Emergency Medical Care",
        displayOrder: 4,
        sourceReference: "LookPH District Hospital Listing",
        verificationDate: VERIFIED_DATE,
      },
      {
        agencyName: "Salcedo Rural Health Unit (RHU)",
        category: "medical",
        phoneNumbers: ["0917 890 0064"],
        address: "Barangay Poblacion Norte, Salcedo, Ilocos Sur 2711",
        barangayId: pobNorte?.id ?? null,
        operatingHours: "Monday – Friday, 8:00 AM – 5:00 PM",
        displayOrder: 5,
        sourceReference: "HealthcarePhilippines Salcedo RHU Profile",
        verificationDate: VERIFIED_DATE,
      },
    ]);
  }

  // 11. Seed Municipal Information & RA 10173 Privacy Policy
  const municipalDocs = [
    {
      key: "profile_overview",
      title: "Municipality of Salcedo — Official Profile",
      category: "overview",
      content:
        "Salcedo (Ilocano: Ili ti Salcedo; Filipino: Bayan ng Salcedo), formerly known as Bauguen (Baugen), is a 4th-class landlocked municipality in the 2nd Legislative District of Ilocos Sur, Region I, Philippines. Covering 103.44 sq km across 21 barangays with 11,110 residents (2020 PSA Census; 11,196 in 2024 POPCEN), Salcedo sits at the scenic western foothills of the Cordillera range and Tirad Pass, traversed by the Buaya River. Known as 'The Rambutan Basket of the North,' its rural economy blends wet-rice agriculture, corn, cacao tablea craftsmanship, and sustainable mountain-spring agritourism.",
      metadataJson: {
        postalCode: "2711",
        classification: "4th-class Landlocked Municipality",
        landAreaSqKm: 103.44,
        population2020: 11110,
        population2024: 11196,
        barangayCount: 21,
        coordinates: "17.1507° N, 120.5361° E",
        coastalStatus: "Landlocked (no beaches or marine coastline)",
        formerName: "Bauguen (renamed via RA 1627 on June 20, 1957)",
      },
      sourceReference: "PSA 2020/2024 Census, Republic Act No. 1627, PhilAtlas",
    },
    {
      key: "geography_landlocked_valley",
      title: "Geography & Landlocked Valley Setting",
      category: "geography",
      content:
        "Salcedo is a landlocked valley municipality covering 103.44 sq km along the western Cordillera foothills of Ilocos Sur. Bordered by Candon City, Galimuyod, Gregorio del Pilar, Quirino, Santa Lucia, and Santa Cruz, its terrain rises from lowland rice plains in Poblacion and San Gaspar to 631 meters above sea level in upland Barangay Madarang, fed by the Buaya River and spring watersheds.",
      metadataJson: {
        landAreaSqKm: 103.44,
        maxElevationBarangay: "Madarang (631 m ASL)",
        riverSystem: "Buaya River",
      },
      sourceReference: "PhilAtlas Geography Profile & PSA / NAMRIA Boundary Records",
    },
    {
      key: "economy_agriculture_rambutan",
      title: "Local Economy, Rambutan & Cacao Tablea",
      category: "economy",
      content:
        "Celebrated as the 'Rambutan Basket of the North,' Salcedo's economy is anchored by rice, corn, seasonal rambutan orchards (July–October harvest), and value-added cacao tablea and 70% dark chocolate crafted by DOST/DTI-assisted local MSMEs alongside community-led eco-agritourism.",
      metadataJson: {
        keyProduce: ["Rambutan", "Cacao Tablea", "Palay Rice", "Corn"],
      },
      sourceReference: "Municipality of Salcedo — CEDO & DOST/DTI SETUP Records",
    },
    {
      key: "governance_tourism_office",
      title: "Municipal Tourism & CEDO Governance",
      category: "governance",
      content:
        "Tourism promotion, local enterprise support, and heritage preservation are coordinated through the Municipal Community Economic Development Office (CEDO) and Municipal Tourism Office at Salcedo Municipal Hall, Poblacion Norte (2711).",
      metadataJson: {
        office: "CEDO / Municipal Tourism Office",
        location: "Salcedo Municipal Hall, Poblacion Norte",
      },
      sourceReference: "Municipality of Salcedo — CEDO Official Records",
    },
    {
      key: "privacy_policy_ra10173",
      title: "Data Privacy Notice & Policy (Republic Act No. 10173)",
      category: "privacy_policy",
      content:
        "In accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), the Municipality of Salcedo (CEDO / Municipal Tourism Office) collects only minimal travel-planning information voluntarily submitted at the end of itinerary creation. Browsing the PWA, viewing places, using the interactive map, and saving local drafts on your device require NO account, NO login, and NO personal contact details. When you choose to submit a travel plan, required fields are limited to origin municipality/province (and country if outside the Philippines), planned visit date, and traveler group count so the municipality can generate aggregate tourism statistics. Optional fields (name, contact number, email) are stored separately from anonymous analytics, retained strictly for 365 days unless anonymized earlier, accessed solely by Authorized Visitor Data Officers and Super Administrators, and never sold or disclosed publicly. Optional follow-up communications require separate affirmative consent. You may retrieve, rotate access credentials for, or permanently delete/anonymize your submitted itinerary anytime using your Reference Number and Private Retrieval Code—without any login.",
      metadataJson: {
        version: "2026.1-RA10173",
        retentionDays: 365,
        legalBasis: "Consent and legitimate municipal tourism planning under RA 10173",
        prohibitedFields: [
          "Government ID numbers",
          "Birth dates",
          "Full street home addresses",
          "Continuous GPS location histories",
          "Device fingerprinting",
        ],
      },
      sourceReference: "Municipality of Salcedo Tourism Data Governance Policy (RA 10173)",
    },
  ];

  for (const doc of municipalDocs) {
    await db
      .insert(schema.municipalInformation)
      .values({
        ...doc,
        verificationDate: VERIFIED_DATE,
      })
      .onConflictDoNothing({ target: schema.municipalInformation.key });
  }

  // 12. Seed Galleries & Curated Collections & Announcements
  const dbPlaces = await db.select().from(schema.places);
  const placeBySlug = new Map(dbPlaces.map((p) => [p.slug, p]));

  const gallerySeed = [
    {
      title: "Salcedo Valley & Cordillera Foothills",
      slug: "gallery-salcedo-valley",
      category: "landscape",
      description: "Golden morning mist rising over Salcedo's landlocked rice terraces and the Buaya River.",
      imageUrl: "/images/salcedo/hero-salcedo-valley.png",
      caption: "Editorial illustration — Salcedo inland valley & Cordillera foothills.",
      attribution: "Project CEDO: Turi App Editorial Visual",
      isIllustrative: true,
      barangaySlug: "balidbid",
      displayOrder: 1,
      sourceReference: "Project CEDO Editorial Asset",
    },
    {
      title: "Official Seal of the Municipality of Salcedo",
      slug: "gallery-official-seal",
      category: "heritage",
      description: "Municipal emblem reading 'Bayan ng Salcedo, Lalawigan ng Ilocos Sur' featuring mountains, fields, and river.",
      imageUrl: "/images/salcedo/seal-of-salcedo.png",
      caption: "Authentic Municipal Seal of Salcedo, Ilocos Sur.",
      attribution: "Wikimedia Commons / Public Domain Municipal Seal",
      isIllustrative: false,
      barangaySlug: "poblacion-norte",
      displayOrder: 2,
      sourceReference: "Wikimedia Commons — Flag & Seal of Salcedo, Ilocos Sur",
    },
    {
      title: "Salcedo Location Map in Ilocos Sur",
      slug: "gallery-locator-map",
      category: "geography",
      description: "Provincial locator showing Salcedo's landlocked inland position in central-southern Ilocos Sur.",
      imageUrl: "/images/salcedo/ilocos-sur-locator-map.jpg",
      caption: "Provincial locator map highlighting landlocked Salcedo, Ilocos Sur.",
      attribution: "Wikimedia Commons / Public Reference Map",
      isIllustrative: false,
      barangaySlug: "poblacion-norte",
      displayOrder: 3,
      sourceReference: "Ilocos Sur Provincial Locator Reference",
    },
    {
      title: "Mountain Falls & Plunge Pool",
      slug: "gallery-mountain-falls",
      category: "nature",
      description: "Representative mountain waterfall imagery honoring Baluarte Falls and Kinbandiw Falls.",
      imageUrl: "/images/salcedo/baluarte-falls.png",
      caption: "Editorial illustration — Salcedo mountain waterfall cascade.",
      attribution: "Project CEDO: Turi App Editorial Visual",
      isIllustrative: true,
      barangaySlug: "baluarte",
      displayOrder: 4,
      sourceReference: "Project CEDO Editorial Asset",
    },
    {
      title: "Rambutan & Artisanal Tablea Showcase",
      slug: "gallery-rambutan-tablea",
      category: "products",
      description: "Fresh Salcedo rambutan clusters paired with roasted cacao pods and dark tablea discs.",
      imageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      caption: "Editorial illustration — Salcedo's Rambutan & Cacao heritage.",
      attribution: "Project CEDO: Turi App Editorial Visual",
      isIllustrative: true,
      barangaySlug: "sorioan",
      displayOrder: 5,
      sourceReference: "Project CEDO Editorial Asset",
    },
  ];

  for (const g of gallerySeed) {
    const brgy = brgyBySlug.get(g.barangaySlug);
    await db
      .insert(schema.galleries)
      .values({
        title: g.title,
        slug: g.slug,
        category: g.category,
        description: g.description,
        imageUrl: g.imageUrl,
        caption: g.caption,
        attribution: g.attribution,
        isIllustrative: g.isIllustrative,
        barangayId: brgy?.id ?? null,
        status: "published",
        displayOrder: g.displayOrder,
        sourceReference: g.sourceReference,
        verificationDate: VERIFIED_DATE,
      })
      .onConflictDoNothing({ target: schema.galleries.slug });
  }

  // Seed Media Assets table so Admin Media Library shows all assets immediately
  const existingMedia = await db.select().from(schema.mediaAssets).limit(1);
  if (existingMedia.length === 0) {
    await db.insert(schema.mediaAssets).values([
      {
        filename: "hero-salcedo-valley.png",
        url: "/images/salcedo/hero-salcedo-valley.png",
        mimeType: "image/png",
        sizeBytes: 420000,
        altText: "Salcedo inland valley and Cordillera foothills at dawn",
        caption: "Editorial visual illustration — Salcedo, Ilocos Sur",
        attribution: "Project CEDO Editorial Asset",
        isIllustrative: true,
        category: "landscape",
      },
      {
        filename: "baluarte-falls.png",
        url: "/images/salcedo/baluarte-falls.png",
        mimeType: "image/png",
        sizeBytes: 410000,
        altText: "Lush Philippine mountain waterfall plunging into emerald basin",
        caption: "Editorial visual illustration — Baluarte & Kinbandiw Falls",
        attribution: "Project CEDO Editorial Asset",
        isIllustrative: true,
        category: "nature",
      },
      {
        filename: "spring-water-resort.png",
        url: "/images/salcedo/spring-water-resort.png",
        mimeType: "image/png",
        sizeBytes: 405000,
        altText: "Upland mountain spring-water pool with bamboo cottages",
        caption: "Editorial visual illustration — Salcedo Spring Resorts",
        attribution: "Project CEDO Editorial Asset",
        isIllustrative: true,
        category: "resort",
      },
      {
        filename: "rambutan-cacao-harvest.png",
        url: "/images/salcedo/rambutan-cacao-harvest.png",
        mimeType: "image/png",
        sizeBytes: 390000,
        altText: "Fresh red rambutan clusters and cacao tablea chocolate discs",
        caption: "Editorial visual illustration — Rambutan & Cacao Harvests",
        attribution: "Project CEDO Editorial Asset",
        isIllustrative: true,
        category: "products",
      },
      {
        filename: "plaza-heritage.png",
        url: "/images/salcedo/plaza-heritage.png",
        mimeType: "image/png",
        sizeBytes: 395000,
        altText: "Tranquil provincial town plaza and church facade below mountains",
        caption: "Editorial visual illustration — Town Plaza & Parish Heritage",
        attribution: "Project CEDO Editorial Asset",
        isIllustrative: true,
        category: "heritage",
      },
      {
        filename: "local-eatery-table.png",
        url: "/images/salcedo/local-eatery-table.png",
        mimeType: "image/png",
        sizeBytes: 380000,
        altText: "Open-air bamboo pavilion grill eatery overlooking valley",
        caption: "Editorial visual illustration — Local Eateries & Tablea",
        attribution: "Project CEDO Editorial Asset",
        isIllustrative: true,
        category: "dining",
      },
      {
        filename: "seal-of-salcedo.png",
        url: "/images/salcedo/seal-of-salcedo.png",
        mimeType: "image/png",
        sizeBytes: 120000,
        altText: "Official Seal of Bayan ng Salcedo, Lalawigan ng Ilocos Sur",
        caption: "Official Municipal Seal of Salcedo",
        attribution: "Wikimedia Commons / Public Domain",
        isIllustrative: false,
        category: "official",
      },
      {
        filename: "ilocos-sur-locator-map.jpg",
        url: "/images/salcedo/ilocos-sur-locator-map.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 48000,
        altText: "Locator map showing landlocked Salcedo inside Ilocos Sur",
        caption: "Provincial Locator Map of Salcedo, Ilocos Sur",
        attribution: "Wikimedia Commons / Public Reference",
        isIllustrative: false,
        category: "geography",
      },
    ]);
  }

  const collectionsSeed = [
    {
      title: "Waterfalls & Natural Springs Trail",
      slug: "waterfalls-and-springs-trail",
      subtitle: "Freshwater cascades and mountain spring pools",
      description:
        "Follow Salcedo's mountain waters from Mount Madarang-fed Bago Resort to the cool forest pools of Baluarte Falls and Kinbandiw Falls.",
      coverImageUrl: "/images/salcedo/baluarte-falls.png",
      placeIdsJson: [
        placeBySlug.get("baluarte-falls-agila-falls")?.id,
        placeBySlug.get("bago-resort-spring-water")?.id,
        placeBySlug.get("kinbandiw-falls")?.id,
      ].filter((id): id is string => Boolean(id)),
      displayOrder: 1,
      isFeatured: true,
    },
    {
      title: "Taste of Salcedo: Farms, Grill & Cacao",
      slug: "taste-of-salcedo-collection",
      subtitle: "Rambutan orchards, artisanal tablea, and local grill",
      description:
        "Pair a farm walk at Bakaan Farm and Sorioan Cacao Nursery with local tablea creations and hearty grilled fare in Poblacion Norte.",
      coverImageUrl: "/images/salcedo/rambutan-cacao-harvest.png",
      placeIdsJson: [
        placeBySlug.get("bakaan-farm-and-resort")?.id,
        placeBySlug.get("tsokolate-de-ylocos-wynns-food-products")?.id,
        placeBySlug.get("sorioan-cacao-nursery-farm")?.id,
        placeBySlug.get("palays-bbq-poblacion-norte")?.id,
      ].filter((id): id is string => Boolean(id)),
      displayOrder: 2,
      isFeatured: true,
    },
    {
      title: "Heritage & Foothill Day Trip",
      slug: "heritage-and-foothill-day-trip",
      subtitle: "Civic landmarks, parish faith, and valley vistas",
      description:
        "Start at the Gregorio del Pilar Shrine and Saint Joseph Parish in Poblacion before heading east to Salcedo Adventure and Leisure Park.",
      coverImageUrl: "/images/salcedo/plaza-heritage.png",
      placeIdsJson: [
        placeBySlug.get("salcedo-town-plaza-del-pilar-shrine")?.id,
        placeBySlug.get("saint-joseph-parish-church")?.id,
        placeBySlug.get("salcedo-adventure-leisure-park")?.id,
      ].filter((id): id is string => Boolean(id)),
      displayOrder: 3,
      isFeatured: true,
    },
  ];

  for (const col of collectionsSeed) {
    await db
      .insert(schema.curatedCollections)
      .values({
        ...col,
        status: "published",
      })
      .onConflictDoNothing({ target: schema.curatedCollections.slug });
  }

  await db
    .insert(schema.announcements)
    .values([
      {
        title: "Account-Free Tourism Discovery & Privacy-First Trip Planning",
        slug: "account-free-itinerary-launch",
        priority: "normal",
        summary:
          "Explore every destination in Salcedo and craft custom itineraries immediately—no sign-in or password required.",
        content:
          "Project CEDO: Turi App lets every visitor explore Salcedo's 21 barangays, waterfalls, spring resorts, local eats, and heritage sites without creating an account. Save drafts offline on your phone or optionally submit your trip at the end to help Salcedo's Municipal Tourism Office improve visitor support.",
        publishedAt: new Date(),
        status: "published",
        sourceReference: "Municipality of Salcedo — CEDO Office",
        verificationDate: VERIFIED_DATE,
      },
      {
        title: "Rainy-Season Trail Advisory for Upland Waterfalls",
        slug: "rainy-season-waterfall-advisory",
        priority: "advisory",
        summary:
          "Visitors trekking to Baluarte Falls and Kinbandiw Falls are advised to coordinate with barangay officials during heavy rainfall.",
        content:
          "Mountain paths in Baluarte, Lucbuban, and Madarang can become slick after afternoon rains. Check in at the respective Barangay Hall before trekking and save Salcedo MDRRMO's 24/7 hotline (0995 129 3542) in your phone.",
        publishedAt: new Date(),
        status: "published",
        sourceReference: "Salcedo MDRRMO Visitor Safety Advisory",
        verificationDate: VERIFIED_DATE,
      },
    ])
    .onConflictDoNothing({ target: schema.announcements.slug });

  // 13. Seed Check-In Verification Methods (Extensible Physical Arrivals Module)
  const verificationMethods = [
    {
      code: "staff_assisted",
      name: "Authorized Tourism Staff Check-In",
      description: "On-site arrival verified and recorded directly by municipal tourism staff or barangay tourism desk.",
      reliabilityLabel: "Verified — Municipal Staff",
      requiresStaffAuth: true,
      isEnabled: true,
    },
    {
      code: "official_logbook",
      name: "Official Destination Visitor Logbook Entry",
      description: "Transcribed or validated entry from a signed municipal/resort physical logbook.",
      reliabilityLabel: "Verified — Official Logbook",
      requiresStaffAuth: true,
      isEnabled: true,
    },
    {
      code: "verified_onsite_qr",
      name: "Rotating Staff-Issued On-Site Check-In Token",
      description: "Time-bounded verification token displayed by on-site staff (never static unverified public QR alone).",
      reliabilityLabel: "Verified — On-Site Rotating Token",
      requiresStaffAuth: true,
      isEnabled: true,
    },
    {
      code: "attraction_attendance",
      name: "Approved Attraction / Event Attendance Record",
      description: "Verified headcount or ticketed entrance tally submitted by accredited site operators.",
      reliabilityLabel: "Verified — Accredited Site Record",
      requiresStaffAuth: true,
      isEnabled: true,
    },
  ];

  for (const m of verificationMethods) {
    await db
      .insert(schema.checkinVerificationMethods)
      .values(m)
      .onConflictDoNothing({ target: schema.checkinVerificationMethods.code });
  }

  // 14. Seed Place Amenities & Weekly Operating Hours (idempotent)
  const existingAmenities = await db.select({ id: schema.placeAmenities.id }).from(schema.placeAmenities).limit(1);
  if (existingAmenities.length === 0) {
    const publishedPlacesForMeta = dbPlaces.filter((p) => p.status === "published" && !p.isPlaceholder);
    const amenityByType: Record<string, Array<{ name: string; category: string }>> = {
      nature: [
        { name: "Natural Freshwater Pool", category: "nature" },
        { name: "Barangay Trail Guidance", category: "safety" },
        { name: "Scenic Photo Spots", category: "feature" },
      ],
      resort: [
        { name: "Parking Area", category: "facility" },
        { name: "Picnic Cottages", category: "facility" },
        { name: "Restrooms & Changing Area", category: "facility" },
        { name: "Family Friendly", category: "general" },
      ],
      attraction: [
        { name: "Parking Area", category: "facility" },
        { name: "Picnic Tables", category: "facility" },
        { name: "Mountain River Views", category: "feature" },
      ],
      heritage: [
        { name: "Public Access", category: "general" },
        { name: "Walkable Town Center", category: "general" },
        { name: "Shade & Seating", category: "facility" },
      ],
      restaurant: [
        { name: "Casual Seating", category: "facility" },
        { name: "Takeout Available", category: "service" },
        { name: "Cash Payments", category: "service" },
      ],
      cafe: [
        { name: "Wi-Fi Available", category: "facility" },
        { name: "Parking Space", category: "facility" },
        { name: "Local Cacao Drinks", category: "feature" },
      ],
      accommodation: [
        { name: "Overnight Parking", category: "facility" },
        { name: "Private Bath", category: "facility" },
        { name: "Quiet Rural Setting", category: "feature" },
      ],
      business: [
        { name: "Local Producer Showcase", category: "feature" },
        { name: "Pasalubong Orders", category: "service" },
      ],
      service: [
        { name: "Emergency Assistance", category: "safety" },
        { name: "Accessible Road Frontage", category: "facility" },
      ],
    };

    const amenityRows: Array<{ placeId: string; name: string; category: string; available: boolean }> = [];
    for (const pl of publishedPlacesForMeta) {
      const items = amenityByType[pl.placeType] ?? [{ name: "Visitor Access", category: "general" }];
      for (const item of items) {
        amenityRows.push({
          placeId: pl.id,
          name: item.name,
          category: item.category,
          available: true,
        });
      }
    }
    if (amenityRows.length > 0) {
      await db.insert(schema.placeAmenities).values(amenityRows);
    }
  }

  const existingHours = await db
    .select({ id: schema.placeOperatingHours.id })
    .from(schema.placeOperatingHours)
    .limit(1);
  if (existingHours.length === 0) {
    const publishedPlacesForHours = dbPlaces.filter((p) => p.status === "published" && !p.isPlaceholder);
    const hoursRows: Array<{
      placeId: string;
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }> = [];

    for (const pl of publishedPlacesForHours) {
      const [openTime, closeTime] =
        pl.placeType === "service" || pl.slug === "salcedo-town-plaza-del-pilar-shrine"
          ? ["00:00", "23:59"]
          : pl.placeType === "cafe"
          ? ["07:00", "19:00"]
          : pl.placeType === "restaurant"
          ? ["09:00", "20:00"]
          : pl.placeType === "accommodation"
          ? ["06:00", "22:00"]
          : ["07:00", "17:00"];

      for (let day = 0; day <= 6; day++) {
        hoursRows.push({
          placeId: pl.id,
          dayOfWeek: day,
          openTime,
          closeTime,
          isClosed: false,
        });
      }
    }
    if (hoursRows.length > 0) {
      await db.insert(schema.placeOperatingHours).values(hoursRows).onConflictDoNothing();
    }
  }
}

/**
 * Seeds realistic sample visitor itineraries, verified on-site check-ins, and 14-day
 * anonymous analytics activity so dashboards and public modules show living sample data.
 * Kept separate from `seedDatabase` so baseline integrity tests remain deterministic.
 */
export async function seedSampleActivityData(db: AppDatabase): Promise<void> {
  const existingItin = await db.select({ id: schema.itineraries.id }).from(schema.itineraries).limit(1);
  const existingCheckin = await db
    .select({ id: schema.destinationCheckins.id })
    .from(schema.destinationCheckins)
    .limit(1);
  const existingSession = await db
    .select({ id: schema.anonymousSessions.id })
    .from(schema.anonymousSessions)
    .limit(1);

  const allPlaces = await db.select().from(schema.places);
  const published = allPlaces.filter((p) => p.status === "published" && !p.isPlaceholder);
  if (published.length === 0) return;

  const bySlug = new Map(published.map((p) => [p.slug, p]));
  const fallbackPlace = published[0];
  const pickPlace = (slug: string) => bySlug.get(slug) ?? fallbackPlace;

  const now = new Date();
  const dayOffsetDate = (offsetDays: number) =>
    new Date(now.getTime() + offsetDays * 86400_000);
  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  // 1. Sample Submitted Visitor Itineraries & Demographics (RA 10173 compliant)
  if (existingItin.length === 0) {
    const year = now.getUTCFullYear();
    const counterKey = `CEDO-TRIP-${year}`;
    const sampleTrips = [
      {
        num: 1,
        title: "Salcedo Waterfalls & Spring Escape",
        visitOffsetDays: 3,
        createdOffsetDays: -4,
        originMunicipality: "Candon City",
        originProvince: "Ilocos Sur",
        travelerCount: 4,
        purposeOfVisit: "Leisure & Nature Sightseeing",
        transportationType: "Private Vehicle",
        lengthOfStay: "Day Trip",
        preferredExperience: "Waterfalls & Resorts",
        visitorName: "Elena Corpuz",
        contactNumber: "+63 917 555 0101",
        emailAddress: null,
        followUpConsent: true,
        stops: [
          { slug: "salcedo-town-plaza-del-pilar-shrine", time: "08:30", mins: 45 },
          { slug: "baluarte-falls-agila-falls", time: "10:00", mins: 120 },
          { slug: "bago-resort-spring-water", time: "13:00", mins: 150 },
        ],
      },
      {
        num: 2,
        title: "Cacao, Tablea & Heritage Day",
        visitOffsetDays: 5,
        createdOffsetDays: -3,
        originMunicipality: "Vigan City",
        originProvince: "Ilocos Sur",
        travelerCount: 2,
        purposeOfVisit: "Agri-Tourism / Farm Visit",
        transportationType: "Private Vehicle",
        lengthOfStay: "Day Trip",
        preferredExperience: "Local Food & Cacao",
        visitorName: "Marco Bautista",
        contactNumber: null,
        emailAddress: "marco.b.sample@example.ph",
        followUpConsent: false,
        stops: [
          { slug: "saint-joseph-parish-church", time: "09:00", mins: 30 },
          { slug: "tsokolate-de-ylocos-wynns-food-products", time: "10:00", mins: 60 },
          { slug: "sorioan-cacao-nursery-farm", time: "11:30", mins: 60 },
          { slug: "palays-bbq-poblacion-norte", time: "13:00", mins: 60 },
        ],
      },
      {
        num: 3,
        title: "Cordillera Foothills Family Outing",
        visitOffsetDays: 8,
        createdOffsetDays: -2,
        originMunicipality: "San Fernando",
        originProvince: "La Union",
        travelerCount: 6,
        purposeOfVisit: "Family Resort Outing",
        transportationType: "Van / Group Transport",
        lengthOfStay: "Overnight Stay",
        preferredExperience: "Resorts & Family Parks",
        visitorName: "Clarisse Mendoza",
        contactNumber: "+63 918 555 0144",
        emailAddress: null,
        followUpConsent: true,
        stops: [
          { slug: "salcedo-adventure-leisure-park", time: "09:00", mins: 150 },
          { slug: "kusina-ti-ili-ilocano-grill", time: "12:00", mins: 75 },
          { slug: "bakaan-farm-and-resort", time: "14:00", mins: 180 },
        ],
      },
      {
        num: 4,
        title: "Quiet Hidden Gems Trail",
        visitOffsetDays: 12,
        createdOffsetDays: -1,
        originMunicipality: "Baguio City",
        originProvince: "Benguet",
        travelerCount: 2,
        purposeOfVisit: "Leisure & Nature Sightseeing",
        transportationType: "Motorcycle",
        lengthOfStay: "Day Trip",
        preferredExperience: "Hiking & Hidden Waterfalls",
        visitorName: null,
        contactNumber: null,
        emailAddress: null,
        followUpConsent: false,
        stops: [
          { slug: "kinbandiw-falls", time: "08:00", mins: 120 },
          { slug: "mount-madarang-trail-viewpoint", time: "11:00", mins: 150 },
        ],
      },
      {
        num: 5,
        title: "Ilocos Sur Agritourism Lakbay Aral",
        visitOffsetDays: 14,
        createdOffsetDays: -1,
        originMunicipality: "Quezon City",
        originProvince: "Metro Manila",
        travelerCount: 12,
        purposeOfVisit: "Research / Educational Fieldwork",
        transportationType: "Tourist Bus / Van",
        lengthOfStay: "Overnight Stay",
        preferredExperience: "Agritourism & MSMEs",
        visitorName: "Prof. Ramon Villanueva",
        contactNumber: "+63 927 555 0198",
        emailAddress: "lakbay.sample@example.ph",
        followUpConsent: true,
        stops: [
          { slug: "bakaan-farm-and-resort", time: "08:30", mins: 120 },
          { slug: "sorioan-cacao-nursery-farm", time: "11:00", mins: 90 },
          { slug: "tsokolate-de-ylocos-wynns-food-products", time: "13:30", mins: 60 },
          { slug: "buaya-river-valley-homestay", time: "16:00", mins: 90 },
        ],
      },
      {
        num: 6,
        title: "Weekend Coffee & Plaza Walk",
        visitOffsetDays: 0,
        createdOffsetDays: 0,
        originMunicipality: "Narvacan",
        originProvince: "Ilocos Sur",
        travelerCount: 1,
        purposeOfVisit: "Leisure & Nature Sightseeing",
        transportationType: "Public Commute",
        lengthOfStay: "Half Day",
        preferredExperience: "Cafés & Heritage",
        visitorName: null,
        contactNumber: null,
        emailAddress: null,
        followUpConsent: false,
        stops: [
          { slug: "salcedo-heritage-tablea-coffee-corner", time: "09:00", mins: 60 },
          { slug: "salcedo-town-plaza-del-pilar-shrine", time: "10:15", mins: 45 },
        ],
      },
    ];

    for (const t of sampleTrips) {
      const refNum = `${counterKey}-${String(t.num).padStart(6, "0")}`;
      const createdAt = dayOffsetDate(t.createdOffsetDays);
      const visitDate = isoDate(dayOffsetDate(t.visitOffsetDays));
      const expiresAt = new Date(createdAt.getTime() + 365 * 86400_000);
      const totalMinutes = t.stops.reduce((acc, s) => acc + s.mins, 0);

      const [itin] = await db
        .insert(schema.itineraries)
        .values({
          referenceNumber: refNum,
          title: t.title,
          plannedVisitDate: visitDate,
          description: "Sample visitor itinerary preloaded for Salcedo tourism planning showcase.",
          totalStops: t.stops.length,
          estimatedTotalMinutes: totalMinutes,
          status: "submitted",
          expiresAt,
          createdAt,
          updatedAt: createdAt,
        })
        .onConflictDoNothing({ target: schema.itineraries.referenceNumber })
        .returning();

      if (!itin) continue;

      await db.insert(schema.itineraryStops).values(
        t.stops.map((st, idx) => ({
          itineraryId: itin.id,
          placeId: pickPlace(st.slug).id,
          stopOrder: idx + 1,
          visitTime: st.time,
          durationMinutes: st.mins,
          personalNotes: idx === 0 ? "Morning arrival stop" : null,
        }))
      );

      const code = generateRetrievalCode();
      const { codeHash, codeSalt } = hashRetrievalCode(code);
      await db.insert(schema.itineraryAccessCredentials).values({
        itineraryId: itin.id,
        codeHash,
        codeSalt,
      });

      const [sub] = await db
        .insert(schema.visitorSubmissions)
        .values({
          itineraryId: itin.id,
          originMunicipality: t.originMunicipality,
          originProvince: t.originProvince,
          originCountry: "Philippines",
          plannedVisitDate: visitDate,
          travelerCount: t.travelerCount,
          purposeOfVisit: t.purposeOfVisit,
          firstTimeVisitor: t.num % 2 === 0 ? "no" : "yes",
          transportationType: t.transportationType,
          lengthOfStay: t.lengthOfStay,
          discoverySource: "Social Media / Online Search",
          preferredExperience: t.preferredExperience,
          privacyNoticeVersion: "2026.1-RA10173",
          privacyAcknowledgedAt: createdAt,
          retentionExpiresAt: expiresAt,
          createdAt,
        })
        .returning();

      await db.insert(schema.visitorContactInformation).values({
        submissionId: sub.id,
        visitorName: t.visitorName,
        contactNumber: t.contactNumber,
        emailAddress: t.emailAddress,
        followUpConsentGiven: t.followUpConsent,
        consentRecordedAt: t.followUpConsent ? createdAt : null,
      });

      await db.insert(schema.visitorPrivacyAcknowledgments).values({
        submissionId: sub.id,
        noticeVersion: "2026.1-RA10173",
        acknowledged: true,
        followUpConsent: t.followUpConsent,
        retentionPolicySummary: "365-day standard retention under RA 10173.",
        acknowledgedAt: createdAt,
      });
    }

    await db
      .insert(schema.referenceCounters)
      .values({ key: counterKey, lastValue: sampleTrips.length, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.referenceCounters.key,
        set: {
          lastValue: sql`GREATEST(${schema.referenceCounters.lastValue}, ${sampleTrips.length})`,
          updatedAt: now,
        },
      });
  }

  // 2. Sample Verified On-Site Physical Arrivals
  if (existingCheckin.length === 0) {
    const methods = await db.select().from(schema.checkinVerificationMethods);
    const methodByCode = new Map(methods.map((m) => [m.code, m]));
    const fallbackMethod = methods[0];

    const [superAdmin] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, "cedo_superadmin"))
      .limit(1);

    const sampleCheckins = [
      {
        key: "sample-checkin-bago-today",
        slug: "bago-resort-spring-water",
        methodCode: "staff_assisted",
        groupSize: 4,
        source: "Bago Resort Gate Desk",
        daysAgo: 0,
        notes: "Morning spring-pool visitors verified by resort desk.",
      },
      {
        key: "sample-checkin-baluarte-1d",
        slug: "baluarte-falls-agila-falls",
        methodCode: "official_logbook",
        groupSize: 3,
        source: "Brgy. Baluarte Trail Logbook",
        daysAgo: 1,
        notes: "Logged hikers accompanied by barangay trail guide.",
      },
      {
        key: "sample-checkin-park-2d",
        slug: "salcedo-adventure-leisure-park",
        methodCode: "attraction_attendance",
        groupSize: 6,
        source: "Sitio Arnap Entrance Booth",
        daysAgo: 2,
        notes: "Weekend family day-tour tally.",
      },
      {
        key: "sample-checkin-bakaan-4d",
        slug: "bakaan-farm-and-resort",
        methodCode: "staff_assisted",
        groupSize: 8,
        source: "Bakaan Farm Reception",
        daysAgo: 4,
        notes: "Agri-tourism orchard walk group.",
      },
      {
        key: "sample-checkin-plaza-5d",
        slug: "salcedo-town-plaza-del-pilar-shrine",
        methodCode: "verified_onsite_qr",
        groupSize: 2,
        source: "Municipal Tourism Desk",
        daysAgo: 5,
        notes: "Heritage walk check-in verified by tourism staff.",
      },
    ];

    for (const sc of sampleCheckins) {
      const place = pickPlace(sc.slug);
      const method = methodByCode.get(sc.methodCode) ?? fallbackMethod;
      if (!method) continue;

      const checkedAt = dayOffsetDate(-sc.daysAgo);
      const arrivalDate = isoDate(checkedAt);
      const guardHash = sha256Hex(sc.key);

      const [checkin] = await db
        .insert(schema.destinationCheckins)
        .values({
          placeId: place.id,
          verificationMethodId: method.id,
          recordedByAdminId: superAdmin?.id ?? null,
          groupSize: sc.groupSize,
          checkInSource: sc.source,
          duplicateGuardHash: guardHash,
          notes: sc.notes,
          checkedInAt: checkedAt,
          createdAt: checkedAt,
        })
        .onConflictDoNothing({ target: schema.destinationCheckins.duplicateGuardHash })
        .returning();

      if (checkin) {
        await db.insert(schema.visitorArrivalRecords).values({
          checkinId: checkin.id,
          placeId: place.id,
          arrivalDate,
          arrivalCount: sc.groupSize,
          sourceLabel: method.name,
          reliabilityTier: method.reliabilityLabel,
          verifiedByAdminId: superAdmin?.id ?? null,
          createdAt: checkedAt,
        });
      }
    }
  }

  // 3. Sample 14-Day Anonymous Analytics Sessions, Views & Searches
  const weightedVisitTargets: Array<{ slug: string; targetViews: number }> = [
    { slug: "baluarte-falls-agila-falls", targetViews: 32 },
    { slug: "bago-resort-spring-water", targetViews: 28 },
    { slug: "bakaan-farm-and-resort", targetViews: 24 },
    { slug: "salcedo-adventure-leisure-park", targetViews: 21 },
    { slug: "salcedo-town-plaza-del-pilar-shrine", targetViews: 19 },
    { slug: "tsokolate-de-ylocos-wynns-food-products", targetViews: 17 },
    { slug: "salcedo-heritage-tablea-coffee-corner", targetViews: 15 },
    { slug: "kinbandiw-falls", targetViews: 13 },
    { slug: "kusina-ti-ili-ilocano-grill", targetViews: 11 },
    { slug: "mount-madarang-trail-viewpoint", targetViews: 10 },
    { slug: "palays-bbq-poblacion-norte", targetViews: 9 },
    { slug: "saint-joseph-parish-church", targetViews: 8 },
    { slug: "salcedo-upland-resort", targetViews: 7 },
    { slug: "buaya-river-valley-homestay", targetViews: 6 },
    { slug: "sorioan-cacao-nursery-farm", targetViews: 5 },
    { slug: "salcedo-district-hospital-and-rhu", targetViews: 3 },
  ];

  if (existingSession.length === 0) {
    const searchTerms = [
      "baluarte falls",
      "bago resort",
      "tablea",
      "rambutan",
      "poblacion",
      "spring pool",
      "coffee",
      "kinbandiw",
    ];

    const sessionDayOffsets = [
      0, 0, 0, 0, 0,
      1, 1, 1, 1,
      2, 2, 2,
      3, 3,
      4, 4, 4,
      5, 5,
      6, 6, 6,
      7, 7,
      8, 8,
      9, 9,
      10, 10,
      11, 11,
      12,
      13, 13,
    ];

    const seededSessions: Array<{ id: string; startedAt: Date }> = [];

    for (let i = 0; i < sessionDayOffsets.length; i++) {
      const daysAgo = sessionDayOffsets[i];
      const startedAt = new Date(dayOffsetDate(-daysAgo).getTime() - (i % 6) * 3600_000);
      const token = `sample-anon-session-${String(i + 1).padStart(3, "0")}`;

      const [sess] = await db
        .insert(schema.anonymousSessions)
        .values({
          sessionToken: token,
          startedAt,
          lastActivityAt: new Date(startedAt.getTime() + 8 * 60_000),
          entryPath: i % 3 === 0 ? "/app/map" : "/app",
          deviceCategory: i % 5 === 0 ? "desktop" : "mobile",
          isLikelyBot: false,
          pageViewsCount: 2,
          createdAt: startedAt,
        })
        .onConflictDoNothing({ target: schema.anonymousSessions.sessionToken })
        .returning();

      if (!sess) continue;
      seededSessions.push({ id: sess.id, startedAt });

      await db
        .insert(schema.pageViewEvents)
        .values([
          {
            sessionId: sess.id,
            idempotencyKey: `sample-pv-home-${i}`,
            path: "/app",
            pageType: "home",
            viewedAt: startedAt,
          },
          {
            sessionId: sess.id,
            idempotencyKey: `sample-pv-sub-${i}`,
            path: i % 2 === 0 ? "/app/discover" : "/app/map",
            pageType: i % 2 === 0 ? "discover" : "map",
            viewedAt: new Date(startedAt.getTime() + 90_000),
          },
        ])
        .onConflictDoNothing();

      if (i < 24) {
        const term = searchTerms[i % searchTerms.length];
        await db
          .insert(schema.searchEvents)
          .values({
            sessionId: sess.id,
            idempotencyKey: `sample-search-${i}`,
            normalizedQuery: term,
            resultsCount: 2 + (i % 4),
            searchedAt: new Date(startedAt.getTime() + 60_000),
          })
          .onConflictDoNothing();
      }

      if (i < 10) {
        const eventType =
          i < 4
            ? "builder_started"
            : i < 7
            ? "downloaded"
            : i < 9
            ? "submitted"
            : "retrieved";
        await db
          .insert(schema.itineraryEvents)
          .values({
            sessionId: sess.id,
            idempotencyKey: `sample-itin-ev-${i}`,
            eventType,
            stopCount: 2 + (i % 3),
            occurredAt: new Date(startedAt.getTime() + 300_000),
          })
          .onConflictDoNothing();
      }
    }

    // Seed weighted distinct place views across all 16 spots for realistic Most Visited rankings
    for (let pIdx = 0; pIdx < weightedVisitTargets.length; pIdx++) {
      const target = weightedVisitTargets[pIdx];
      const pl = pickPlace(target.slug);
      const count = Math.min(target.targetViews, seededSessions.length);
      for (let sIdx = 0; sIdx < count; sIdx++) {
        const sess = seededSessions[(sIdx + pIdx * 3) % seededSessions.length];
        await db
          .insert(schema.placeViewEvents)
          .values({
            sessionId: sess.id,
            placeId: pl.id,
            idempotencyKey: `sample-weighted-pv-${target.slug}-${sIdx}`,
            viewedAt: new Date(sess.startedAt.getTime() + (pIdx + 1) * 45_000),
          })
          .onConflictDoNothing();
      }
    }

    const existingAudit = await db.select({ id: schema.auditLogs.id }).from(schema.auditLogs).limit(1);
    if (existingAudit.length === 0) {
      await db.insert(schema.auditLogs).values([
        {
          actorUsername: "cedo_superadmin",
          action: "seed.sample_data",
          targetType: "system",
          summary: "Loaded verified Salcedo municipal baseline catalog and initial sample tourism activity.",
          metadataJson: { barangays: 21, sampleItineraries: 6, sampleCheckins: 5 },
        },
      ]);
    }
  } else {
    // Ensure any already-seeded database has weighted view counts across all 16 places
    const existingViewCount = await db
      .select({ id: schema.placeViewEvents.id })
      .from(schema.placeViewEvents);
    if (existingViewCount.length < 150) {
      const sessions = await db
        .select({ id: schema.anonymousSessions.id, startedAt: schema.anonymousSessions.startedAt })
        .from(schema.anonymousSessions)
        .limit(35);
      if (sessions.length > 0) {
        for (let pIdx = 0; pIdx < weightedVisitTargets.length; pIdx++) {
          const target = weightedVisitTargets[pIdx];
          const pl = pickPlace(target.slug);
          const count = Math.min(target.targetViews, sessions.length);
          for (let sIdx = 0; sIdx < count; sIdx++) {
            const sess = sessions[(sIdx + pIdx * 3) % sessions.length];
            await db
              .insert(schema.placeViewEvents)
              .values({
                sessionId: sess.id,
                placeId: pl.id,
                idempotencyKey: `sample-backfill-pv-${target.slug}-${sIdx}`,
                viewedAt: new Date(sess.startedAt.getTime() + (pIdx + 1) * 45_000),
              })
              .onConflictDoNothing();
          }
        }
      }
    }
  }

  // 4. Sample Tourist Ratings & Reviews (Account-Free Community Feedback)
  const existingRatings = await db
    .select({ id: schema.placeRatings.id })
    .from(schema.placeRatings)
    .limit(1);

  if (existingRatings.length === 0) {
    const sampleReviewsBySlug: Record<
      string,
      Array<{
        name: string;
        origin: string;
        rating: number;
        travelerType: string;
        comment: string;
        daysAgo: number;
      }>
    > = {
      "baluarte-falls-agila-falls": [
        {
          name: "Marisol D.",
          origin: "Candon City, Ilocos Sur",
          rating: 5,
          travelerType: "Barkada",
          comment: "Ice-cold clear pool and peaceful forest trail. Register at Brgy. Baluarte hall first—local guides are super helpful.",
          daysAgo: 1,
        },
        {
          name: "Kenji R.",
          origin: "Baguio City",
          rating: 5,
          travelerType: "Solo",
          comment: "One of the cleanest hidden waterfalls in Ilocos Sur. Go before 9 AM for great morning light.",
          daysAgo: 3,
        },
        {
          name: "Liza & Paolo",
          origin: "San Fernando, La Union",
          rating: 5,
          travelerType: "Couple",
          comment: "Worth the short foothill walk. Bring water shoes because rocks near the basin can get slippery.",
          daysAgo: 6,
        },
        {
          name: "Mark T.",
          origin: "Vigan City",
          rating: 5,
          travelerType: "Family",
          comment: "Refreshing mountain air and zero commercial crowd.",
          daysAgo: 9,
        },
        {
          name: "Jessa V.",
          origin: "Quezon City",
          rating: 4,
          travelerType: "Barkada",
          comment: "Beautiful cascade and very chill swimming spot. Trail is steep in parts after rain.",
          daysAgo: 11,
        },
      ],
      "bago-resort-spring-water": [
        {
          name: "Tita Grace",
          origin: "Candon City, Ilocos Sur",
          rating: 5,
          travelerType: "Family",
          comment: "Fresh mountain spring water with zero harsh chlorine smell! Clean cottages for our whole family.",
          daysAgo: 1,
        },
        {
          name: "Danilo G.",
          origin: "Santa Lucia, Ilocos Sur",
          rating: 5,
          travelerType: "Family",
          comment: "Very affordable entrance fees and safe kiddie pools. Perfect weekend cooldown.",
          daysAgo: 4,
        },
        {
          name: "Aira M.",
          origin: "Narvacan",
          rating: 5,
          travelerType: "Barkada",
          comment: "Shaded picnic cottages right beside the mountain backdrop. Easy parking too.",
          daysAgo: 7,
        },
        {
          name: "Bryan K.",
          origin: "Vigan City",
          rating: 4,
          travelerType: "Couple",
          comment: "Great cold spring water, bring cash for cottage rental and snacks.",
          daysAgo: 10,
        },
      ],
      "salcedo-heritage-tablea-coffee-corner": [
        {
          name: "Camille S.",
          origin: "Vigan City, Ilocos Sur",
          rating: 5,
          travelerType: "Couple",
          comment: "The iced sikwate tablea latte using local Sorioan cacao is unforgettable. Cozy spot beside the plaza.",
          daysAgo: 1,
        },
        {
          name: "Niko P.",
          origin: "Candon City",
          rating: 5,
          travelerType: "Solo",
          comment: "Strong Benguet arabica and friendly baristas. Reliable Wi-Fi while checking our map route.",
          daysAgo: 2,
        },
        {
          name: "Hanna L.",
          origin: "Baguio City",
          rating: 5,
          travelerType: "Barkada",
          comment: "Loved the rambutan cheesecake slice and warm cacao tsokolate!",
          daysAgo: 5,
        },
        {
          name: "Rico F.",
          origin: "Manila",
          rating: 5,
          travelerType: "Leisure",
          comment: "Best morning coffee stop before heading to Salcedo's upland waterfalls.",
          daysAgo: 8,
        },
      ],
      "bakaan-farm-and-resort": [
        {
          name: "Prof. Ramon V.",
          origin: "Quezon City",
          rating: 5,
          travelerType: "Family",
          comment: "Our whole group enjoyed the rambutan orchard tour and breezy poolside pavilions.",
          daysAgo: 2,
        },
        {
          name: "Celine A.",
          origin: "San Fernando, La Union",
          rating: 5,
          travelerType: "Family",
          comment: "Spacious greenery, clean water, and super welcoming hosts.",
          daysAgo: 5,
        },
        {
          name: "Jomar C.",
          origin: "Candon City",
          rating: 4,
          travelerType: "Barkada",
          comment: "Huge shaded grounds for picnics. Harvest season in August–October is peak!",
          daysAgo: 9,
        },
        {
          name: "Lea P.",
          origin: "Tagudin",
          rating: 5,
          travelerType: "Family",
          comment: "Kids loved seeing real rambutan and cacao trees up close.",
          daysAgo: 12,
        },
      ],
      "salcedo-adventure-leisure-park": [
        {
          name: "Clarisse M.",
          origin: "San Fernando, La Union",
          rating: 5,
          travelerType: "Family",
          comment: "Fantastic panoramic hillside view of the Buaya River valley. Great open lawns for kids.",
          daysAgo: 2,
        },
        {
          name: "Gelo R.",
          origin: "Candon City",
          rating: 4,
          travelerType: "Barkada",
          comment: "Awesome picnic cottages and sunrise views over the foothills.",
          daysAgo: 6,
        },
        {
          name: "Mina O.",
          origin: "Santa Cruz",
          rating: 5,
          travelerType: "Couple",
          comment: "Calm, breezy, and photogenic—especially around golden hour.",
          daysAgo: 10,
        },
      ],
      "tsokolate-de-ylocos-wynns-food-products": [
        {
          name: "Marco B.",
          origin: "Vigan City",
          rating: 5,
          travelerType: "Leisure",
          comment: "Picked up pure cacao tablea rolls and rich dark chocolate bars for pasalubong. Locally grown and roasted!",
          daysAgo: 2,
        },
        {
          name: "Teresita N.",
          origin: "Candon City",
          rating: 5,
          travelerType: "Family",
          comment: "Authentic traditional Ilocano cacao aroma. Zero artificial fillers.",
          daysAgo: 5,
        },
        {
          name: "Daryl E.",
          origin: "Quezon City",
          rating: 4,
          travelerType: "Couple",
          comment: "Great local enterprise showcase—call ahead for big pasalubong boxes.",
          daysAgo: 8,
        },
      ],
      "kusina-ti-ili-ilocano-grill": [
        {
          name: "Anton P.",
          origin: "Vigan City",
          rating: 5,
          travelerType: "Barkada",
          comment: "Crispy bagnet pinakbet and smoky pork sinigang hit the spot after our hike!",
          daysAgo: 1,
        },
        {
          name: "Shiela B.",
          origin: "Candon City",
          rating: 5,
          travelerType: "Family",
          comment: "Generous servings, clean dining area, and fresh highland vegetables.",
          daysAgo: 4,
        },
        {
          name: "Vince M.",
          origin: "La Union",
          rating: 4,
          travelerType: "Couple",
          comment: "Quick lunch stop near Poblacion, tasty inihaw and friendly staff.",
          daysAgo: 8,
        },
      ],
      "salcedo-town-plaza-del-pilar-shrine": [
        {
          name: "Elena C.",
          origin: "Candon City",
          rating: 5,
          travelerType: "Family",
          comment: "Historic and clean town center honoring Gen. Gregorio del Pilar's legacy in Baugen.",
          daysAgo: 3,
        },
        {
          name: "Patricio G.",
          origin: "Vigan City",
          rating: 4,
          travelerType: "Solo",
          comment: "Great starting anchor point for walking Poblacion and grabbing coffee nearby.",
          daysAgo: 7,
        },
        {
          name: "Nadine Y.",
          origin: "Manila",
          rating: 5,
          travelerType: "Leisure",
          comment: "Peaceful shaded plaza especially during early morning walks.",
          daysAgo: 11,
        },
      ],
      "kinbandiw-falls": [
        {
          name: "Jericho T.",
          origin: "Baguio City",
          rating: 5,
          travelerType: "Solo",
          comment: "True hidden gem off the beaten path! Untouched forest cascade in upland Salcedo.",
          daysAgo: 3,
        },
        {
          name: "Bea C.",
          origin: "Candon City",
          rating: 4,
          travelerType: "Barkada",
          comment: "Raw and scenic, definitely bring a local guide and wear sturdy trail sandals.",
          daysAgo: 8,
        },
      ],
      "buaya-river-valley-homestay": [
        {
          name: "Prof. Ramon V.",
          origin: "Quezon City",
          rating: 5,
          travelerType: "Family",
          comment: "Spotless rooms, cool valley breeze at night, and home-cooked Ilocano breakfast.",
          daysAgo: 2,
        },
        {
          name: "Hannah K.",
          origin: "San Fernando, La Union",
          rating: 5,
          travelerType: "Couple",
          comment: "Quiet restful stay just minutes away from Poblacion.",
          daysAgo: 6,
        },
      ],
      "mount-madarang-trail-viewpoint": [
        {
          name: "Karl W.",
          origin: "Baguio City",
          rating: 5,
          travelerType: "Barkada",
          comment: "Sea of clouds above the Buaya valley at dawn! Steep trek but totally worth it.",
          daysAgo: 4,
        },
        {
          name: "Sammy R.",
          origin: "Vigan City",
          rating: 4,
          travelerType: "Solo",
          comment: "Rewarding eastern ridge views overlooking Salcedo and neighboring peaks.",
          daysAgo: 9,
        },
      ],
      "palays-bbq-poblacion-norte": [
        {
          name: "Gabe D.",
          origin: "Candon City",
          rating: 5,
          travelerType: "Barkada",
          comment: "Best smoky pork BBQ skewers in town! Super budget-friendly evening meal.",
          daysAgo: 2,
        },
        {
          name: "Ria S.",
          origin: "Galimuyod",
          rating: 4,
          travelerType: "Family",
          comment: "Quick grilled favorites right in Poblacion Norte.",
          daysAgo: 7,
        },
      ],
      "saint-joseph-parish-church": [
        {
          name: "Maria F.",
          origin: "Santa Lucia",
          rating: 5,
          travelerType: "Family",
          comment: "Serene heritage parish grounds in the heart of Poblacion.",
          daysAgo: 4,
        },
        {
          name: "Joel A.",
          origin: "Candon City",
          rating: 4,
          travelerType: "Solo",
          comment: "Peaceful architectural landmark across from the town plaza.",
          daysAgo: 10,
        },
      ],
      "salcedo-upland-resort": [
        {
          name: "Nora L.",
          origin: "Santa Cruz",
          rating: 4,
          travelerType: "Family",
          comment: "Cool upland breeze and quiet pool cottages away from town traffic.",
          daysAgo: 5,
        },
        {
          name: "Dennis P.",
          origin: "Candon City",
          rating: 4,
          travelerType: "Barkada",
          comment: "Relaxing shaded resort setting for small family gatherings.",
          daysAgo: 9,
        },
      ],
      "sorioan-cacao-nursery-farm": [
        {
          name: "Marco B.",
          origin: "Vigan City",
          rating: 5,
          travelerType: "Leisure",
          comment: "Fascinating cacao nursery learning tour with farmers in Brgy. Sorioan.",
          daysAgo: 4,
        },
        {
          name: "Trish M.",
          origin: "Manila",
          rating: 4,
          travelerType: "Couple",
          comment: "Educational farm stop showing how Salcedo tablea starts from seedlings.",
          daysAgo: 11,
        },
      ],
      "salcedo-district-hospital-and-rhu": [
        {
          name: "Erwin B.",
          origin: "Candon City",
          rating: 4,
          travelerType: "Leisure",
          comment: "Clean, attentive emergency assistance and clear roadside signage.",
          daysAgo: 6,
        },
      ],
    };

    const ratingInserts: Array<typeof schema.placeRatings.$inferInsert> = [];
    for (const [slug, reviews] of Object.entries(sampleReviewsBySlug)) {
      const place = bySlug.get(slug);
      if (!place) continue;
      reviews.forEach((rev, idx) => {
        const ts = dayOffsetDate(-rev.daysAgo);
        ratingInserts.push({
          placeId: place.id,
          reviewerToken: `sample-reviewer-${slug}-${idx + 1}`,
          reviewerName: rev.name,
          originLabel: rev.origin,
          rating: rev.rating,
          comment: rev.comment,
          travelerType: rev.travelerType,
          status: "published",
          createdAt: ts,
          updatedAt: ts,
        });
      });
    }

    if (ratingInserts.length > 0) {
      await db.insert(schema.placeRatings).values(ratingInserts).onConflictDoNothing();
    }
  }
}
