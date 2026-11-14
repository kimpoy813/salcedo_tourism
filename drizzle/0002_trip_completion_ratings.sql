ALTER TYPE "itinerary_status" ADD VALUE IF NOT EXISTS 'completed';--> statement-breakpoint
ALTER TYPE "itinerary_event_type" ADD VALUE IF NOT EXISTS 'trip_completed';--> statement-breakpoint
ALTER TABLE "itineraries" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "itinerary_stops" ADD COLUMN IF NOT EXISTS "visited_at" timestamp with time zone;
