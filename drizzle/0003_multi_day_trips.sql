ALTER TABLE "itineraries" ADD COLUMN IF NOT EXISTS "number_of_days" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "itinerary_stops" ADD COLUMN IF NOT EXISTS "day_number" integer DEFAULT 1 NOT NULL;
