import { z } from "zod";

export const itineraryStopInputSchema = z.object({
  placeId: z.string().uuid("Valid destination ID is required."),
  stopOrder: z.number().int().min(1).max(50),
  dayNumber: z.number().int().min(1).max(14).default(1),
  visitTime: z.string().max(40).optional().nullable(),
  durationMinutes: z.number().int().min(15).max(1440).default(60),
  personalNotes: z.string().max(400).optional().nullable(),
});

export const submitItinerarySchema = z.object({
  itinerary: z.object({
    title: z.string().trim().min(2, "Trip title must be at least 2 characters.").max(120),
    plannedVisitDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Planned travel date must be YYYY-MM-DD."),
    description: z.string().trim().max(500).optional().nullable(),
    stops: z
      .array(itineraryStopInputSchema)
      .min(1, "Please include at least one destination in your itinerary.")
      .max(25, "Maximum 25 stops per itinerary."),
  }),
  visitor: z
    .object({
      visitorName: z.string().trim().max(120).optional().nullable(),
      originMunicipality: z
        .string()
        .trim()
        .min(2, "Municipality or city of residence is required.")
        .max(120),
      originProvince: z
        .string()
        .trim()
        .min(2, "Province of residence is required.")
        .max(120),
      originCountry: z.string().trim().max(120).default("Philippines"),
      contactNumber: z.string().trim().max(40).optional().nullable(),
      emailAddress: z
        .string()
        .trim()
        .email("Please enter a valid email address.")
        .max(150)
        .optional()
        .or(z.literal(""))
        .nullable(),
      plannedVisitDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Planned visit date must be YYYY-MM-DD."),
      travelerCount: z.number().int().min(1, "At least 1 traveler is required.").max(500),
      purposeOfVisit: z.string().trim().max(100).optional().nullable(),
      firstTimeVisitor: z
        .enum(["yes", "no", "prefer_not_to_say"])
        .optional()
        .nullable(),
      transportationType: z.string().trim().max(80).optional().nullable(),
      lengthOfStay: z.string().trim().max(80).optional().nullable(),
      discoverySource: z.string().trim().max(120).optional().nullable(),
      interestedAttractions: z.string().trim().max(300).optional().nullable(),
      preferredExperience: z.string().trim().max(150).optional().nullable(),
      privacyAcknowledged: z
        .boolean()
        .refine((v) => v === true, {
          message: "You must acknowledge the Data Privacy Notice to submit.",
        }),
      privacyNoticeVersion: z.string().trim().min(1).max(40).default("2026.1-RA10173"),
      followUpConsentGiven: z.boolean().default(false),
    }),
  sessionToken: z.string().max(128).optional().nullable(),
});

export const retrieveItinerarySchema = z.object({
  referenceNumber: z
    .string()
    .trim()
    .min(5, "Reference number is required.")
    .max(40),
  privateCode: z
    .string()
    .trim()
    .min(8, "Private retrieval code is required.")
    .max(64),
});

export const placeMutationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens only."),
  shortDescription: z.string().trim().min(10).max(320),
  description: z.string().trim().min(15).max(5000),
  placeType: z.enum([
    "attraction",
    "cafe",
    "resort",
    "restaurant",
    "accommodation",
    "business",
    "heritage",
    "nature",
    "service",
  ]),
  primaryCategoryId: z.string().uuid().optional().nullable(),
  barangayId: z.string().uuid().optional().nullable(),
  address: z.string().trim().min(3).max(250),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  phone: z.string().trim().max(80).optional().nullable(),
  email: z.string().trim().max(120).optional().nullable(),
  websiteUrl: z.string().trim().max(300).optional().nullable(),
  socialMediaUrl: z.string().trim().max(300).optional().nullable(),
  featuredImageUrl: z.string().trim().max(500).optional().nullable(),
  featuredImageCaption: z.string().trim().max(300).optional().nullable(),
  isFeatured: z.boolean().default(false),
  isHiddenGem: z.boolean().default(false),
  isPlaceholder: z.boolean().default(false),
  status: z.enum(["draft", "pending_review", "published", "archived"]).default("draft"),
  sourceReference: z.string().trim().min(3).max(300),
  verificationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  cafeDetails: z
    .object({
      featuredDrinks: z.array(z.string()).default([]),
      foodOfferings: z.array(z.string()).default([]),
      priceRangeNote: z.string().nullable().optional(),
      hasWifi: z.boolean().nullable().optional(),
      hasParking: z.boolean().nullable().optional(),
      seatingOptions: z.array(z.string()).default([]),
      brewStyleNote: z.string().nullable().optional(),
    })
    .optional(),
  resortDetails: z
    .object({
      poolsSummary: z.string().nullable().optional(),
      cottagesSummary: z.string().nullable().optional(),
      roomsSummary: z.string().nullable().optional(),
      recreationalFacilities: z.array(z.string()).default([]),
      entranceFeeNote: z.string().nullable().optional(),
      cottageRoomRatesNote: z.string().nullable().optional(),
      policies: z.array(z.string()).default([]),
      externalInquiryUrl: z.string().nullable().optional(),
    })
    .optional(),
  restaurantDetails: z
    .object({
      cuisineType: z.string().nullable().optional(),
      menuHighlights: z.array(z.string()).default([]),
      featuredDishes: z.array(z.string()).default([]),
      diningOptions: z.array(z.string()).default([]),
      hasParking: z.boolean().nullable().optional(),
      priceRangeNote: z.string().nullable().optional(),
    })
    .optional(),
  attractionDetails: z
    .object({
      activities: z.array(z.string()).default([]),
      visitorGuidelines: z.array(z.string()).default([]),
      entranceInfo: z.string().nullable().optional(),
      historicalDetails: z.string().nullable().optional(),
      difficultyLevel: z.string().nullable().optional(),
      estimatedDurationMinutes: z.number().int().min(10).max(1440).nullable().optional(),
    })
    .optional(),
});

export const createCheckinSchema = z.object({
  placeId: z.string().uuid(),
  verificationMethodCode: z.enum([
    "staff_assisted",
    "official_logbook",
    "verified_onsite_qr",
    "attraction_attendance",
  ]),
  itineraryReferenceNumber: z.string().trim().max(40).optional().nullable(),
  groupSize: z.number().int().min(1).max(500).default(1),
  verificationCodeUsed: z.string().trim().max(64).optional().nullable(),
  checkInSource: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(400).optional().nullable(),
  clientNonce: z.string().trim().min(4).max(120).optional(),
});
