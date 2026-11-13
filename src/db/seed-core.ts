import { eq } from "drizzle-orm";
import type { AppDatabase } from "./index";
import * as schema from "./schema";
import { hashPassword } from "../lib/crypto";

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
      latitude: 17.099,
      longitude: 120.5215,
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
      latitude: 17.1293,
      longitude: 120.5432,
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
      latitude: 17.1508,
      longitude: 120.536,
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
      latitude: 17.1496,
      longitude: 120.5363,
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
      latitude: 17.1476,
      longitude: 120.5382,
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
      latitude: 17.1518,
      longitude: 120.5356,
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
      latitude: 17.1504,
      longitude: 120.5369,
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
      latitude: 17.1219,
      longitude: 120.5365,
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
      latitude: 17.1485,
      longitude: 120.5362,
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
      latitude: 17.1514,
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

  for (const sp of seedPlaces) {
    const existing = await db
      .select()
      .from(schema.places)
      .where(eq(schema.places.slug, sp.slug))
      .limit(1);

    if (existing.length > 0) continue;

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
}
