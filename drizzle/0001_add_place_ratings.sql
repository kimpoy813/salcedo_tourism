CREATE TABLE "place_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"anonymous_session_id" uuid,
	"reviewer_token" text NOT NULL,
	"reviewer_name" text DEFAULT 'Salcedo Visitor' NOT NULL,
	"origin_label" text,
	"rating" integer NOT NULL,
	"comment" text,
	"traveler_type" text DEFAULT 'Leisure' NOT NULL,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "place_ratings" ADD CONSTRAINT "place_ratings_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_ratings" ADD CONSTRAINT "place_ratings_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "place_ratings_place_reviewer_idx" ON "place_ratings" USING btree ("place_id","reviewer_token");--> statement-breakpoint
CREATE INDEX "place_ratings_place_status_idx" ON "place_ratings" USING btree ("place_id","status","created_at");