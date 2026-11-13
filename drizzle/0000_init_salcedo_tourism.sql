CREATE TYPE "public"."content_status" AS ENUM('draft', 'pending_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."itinerary_event_type" AS ENUM('builder_started', 'preview_completed', 'submitted', 'retrieved', 'downloaded');--> statement-breakpoint
CREATE TYPE "public"."itinerary_status" AS ENUM('submitted', 'archived', 'anonymized');--> statement-breakpoint
CREATE TYPE "public"."place_type" AS ENUM('attraction', 'cafe', 'resort', 'restaurant', 'accommodation', 'business', 'heritage', 'nature', 'service');--> statement-breakpoint
CREATE TABLE "accommodation_details" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"accommodation_type" text,
	"room_types_summary" text,
	"rate_note" text,
	"amenities_summary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"check_in_out_policy" text,
	"booking_inquiry_url" text
);
--> statement-breakpoint
CREATE TABLE "admin_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_date" date NOT NULL,
	"metric_key" text NOT NULL,
	"dimension_key" text DEFAULT 'all' NOT NULL,
	"count_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anonymous_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entry_path" text DEFAULT '/app' NOT NULL,
	"device_category" text DEFAULT 'unknown' NOT NULL,
	"is_likely_bot" boolean DEFAULT false NOT NULL,
	"page_views_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attraction_details" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"activities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visitor_guidelines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entrance_info" text,
	"historical_details" text,
	"difficulty_level" text,
	"estimated_duration_minutes" integer
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"actor_username" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"summary" text NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barangays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"district" text DEFAULT 'Salcedo' NOT NULL,
	"population_2020" integer,
	"population_2015" integer,
	"elevation_meters" double precision,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"summary" text NOT NULL,
	"history_notes" text,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_image_url" text,
	"source_reference" text NOT NULL,
	"verification_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafe_details" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"featured_drinks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"food_offerings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_range_note" text,
	"has_wifi" boolean,
	"has_parking" boolean,
	"seating_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brew_style_note" text
);
--> statement-breakpoint
CREATE TABLE "checkin_verification_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"reliability_label" text NOT NULL,
	"requires_staff_auth" boolean DEFAULT true NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkin_verification_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"status" "content_status" NOT NULL,
	"snapshot_json" jsonb NOT NULL,
	"edited_by_admin_id" uuid,
	"change_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultural_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"image_caption" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curated_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"subtitle" text NOT NULL,
	"description" text NOT NULL,
	"cover_image_url" text,
	"place_ids_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destination_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"verification_method_id" uuid NOT NULL,
	"itinerary_id" uuid,
	"recorded_by_admin_id" uuid,
	"verification_code_used" text,
	"group_size" integer DEFAULT 1 NOT NULL,
	"check_in_source" text NOT NULL,
	"duplicate_guard_hash" text NOT NULL,
	"notes" text,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_name" text NOT NULL,
	"category" text NOT NULL,
	"phone_numbers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"address" text NOT NULL,
	"barangay_id" uuid,
	"operating_hours" text DEFAULT '24/7 Emergency Response',
	"notes" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"venue_name" text NOT NULL,
	"barangay_id" uuid,
	"image_url" text,
	"schedule_notes" text,
	"organizer" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"caption" text NOT NULL,
	"attribution" text NOT NULL,
	"is_illustrative" boolean DEFAULT false NOT NULL,
	"barangay_id" uuid,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"era_or_year" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"image_caption" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itineraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" text NOT NULL,
	"title" text NOT NULL,
	"planned_visit_date" date NOT NULL,
	"description" text,
	"total_stops" integer DEFAULT 0 NOT NULL,
	"estimated_total_minutes" integer DEFAULT 0 NOT NULL,
	"status" "itinerary_status" DEFAULT 'submitted' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_access_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"code_salt" text NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_rotated_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "itinerary_access_credentials_itinerary_id_unique" UNIQUE("itinerary_id")
);
--> statement-breakpoint
CREATE TABLE "itinerary_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_token" text NOT NULL,
	"title" text NOT NULL,
	"planned_visit_date" date,
	"description" text,
	"stops_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"idempotency_key" text NOT NULL,
	"event_type" "itinerary_event_type" NOT NULL,
	"itinerary_id" uuid,
	"stop_count" integer DEFAULT 0 NOT NULL,
	"traveler_count" integer,
	"planned_visit_date" date,
	"place_ids_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"stop_order" integer NOT NULL,
	"visit_time" text,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"personal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"tradition_notes" text,
	"seasonal_availability" text,
	"price_note" text,
	"image_url" text,
	"barangay_id" uuid,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"blob_path" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"alt_text" text NOT NULL,
	"caption" text,
	"attribution" text NOT NULL,
	"is_illustrative" boolean DEFAULT false NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"uploaded_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "municipal_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"path" text NOT NULL,
	"page_type" text NOT NULL,
	"entity_slug" text,
	"referrer_path" text,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "place_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"group_type" text NOT NULL,
	"description" text,
	"icon_name" text DEFAULT 'MapPin' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_category_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"attribution" text,
	"is_illustrative" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_operating_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" text,
	"close_time" text,
	"is_closed" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "place_view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text NOT NULL,
	"description" text NOT NULL,
	"place_type" "place_type" NOT NULL,
	"primary_category_id" uuid,
	"barangay_id" uuid,
	"address" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"phone" text,
	"email" text,
	"website_url" text,
	"social_media_url" text,
	"featured_image_url" text,
	"featured_image_caption" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_hidden_gem" boolean DEFAULT false NOT NULL,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"published_at" timestamp with time zone,
	"created_by_admin_id" uuid,
	"updated_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_producers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"producer_name" text NOT NULL,
	"barangay_id" uuid,
	"address" text,
	"contact_info" text,
	"notes" text,
	"source_reference" text NOT NULL,
	"verification_date" date
);
--> statement-breakpoint
CREATE TABLE "reference_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resort_details" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"pools_summary" text,
	"cottages_summary" text,
	"rooms_summary" text,
	"recreational_facilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entrance_fee_note" text,
	"cottage_room_rates_note" text,
	"policies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"external_inquiry_url" text
);
--> statement-breakpoint
CREATE TABLE "restaurant_details" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"cuisine_type" text,
	"menu_highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_dishes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dining_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"has_parking" boolean,
	"price_range_note" text
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"normalized_query" text NOT NULL,
	"category_filter" text,
	"barangay_filter" text,
	"results_count" integer DEFAULT 0 NOT NULL,
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value_json" jsonb NOT NULL,
	"description" text NOT NULL,
	"updated_by_admin_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"tips_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"source_reference" text NOT NULL,
	"verification_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_arrival_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkin_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"arrival_date" date NOT NULL,
	"arrival_count" integer NOT NULL,
	"source_label" text NOT NULL,
	"reliability_tier" text NOT NULL,
	"verified_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_contact_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"visitor_name" text,
	"contact_number" text,
	"email_address" text,
	"follow_up_consent_given" boolean DEFAULT false NOT NULL,
	"consent_recorded_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visitor_contact_information_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
CREATE TABLE "visitor_privacy_acknowledgments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"notice_version" text NOT NULL,
	"acknowledged" boolean NOT NULL,
	"follow_up_consent" boolean DEFAULT false NOT NULL,
	"retention_policy_summary" text NOT NULL,
	"acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_id" uuid NOT NULL,
	"origin_municipality" text NOT NULL,
	"origin_province" text NOT NULL,
	"origin_country" text DEFAULT 'Philippines' NOT NULL,
	"planned_visit_date" date NOT NULL,
	"traveler_count" integer DEFAULT 1 NOT NULL,
	"purpose_of_visit" text,
	"first_time_visitor" text,
	"transportation_type" text,
	"length_of_stay" text,
	"discovery_source" text,
	"interested_attractions" text,
	"preferred_experience" text,
	"privacy_notice_version" text NOT NULL,
	"privacy_acknowledged_at" timestamp with time zone NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	"anonymized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visitor_submissions_itinerary_id_unique" UNIQUE("itinerary_id")
);
--> statement-breakpoint
ALTER TABLE "accommodation_details" ADD CONSTRAINT "accommodation_details_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attraction_details" ADD CONSTRAINT "attraction_details_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_details" ADD CONSTRAINT "cafe_details_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_edited_by_admin_id_admin_users_id_fk" FOREIGN KEY ("edited_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_checkins" ADD CONSTRAINT "destination_checkins_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_checkins" ADD CONSTRAINT "destination_checkins_verification_method_id_checkin_verification_methods_id_fk" FOREIGN KEY ("verification_method_id") REFERENCES "public"."checkin_verification_methods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_checkins" ADD CONSTRAINT "destination_checkins_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_access_credentials" ADD CONSTRAINT "itinerary_access_credentials_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_products" ADD CONSTRAINT "local_products_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_admin_id_admin_users_id_fk" FOREIGN KEY ("uploaded_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_view_events" ADD CONSTRAINT "page_view_events_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_amenities" ADD CONSTRAINT "place_amenities_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_category_assignments" ADD CONSTRAINT "place_category_assignments_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_category_assignments" ADD CONSTRAINT "place_category_assignments_category_id_place_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."place_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_operating_hours" ADD CONSTRAINT "place_operating_hours_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_view_events" ADD CONSTRAINT "place_view_events_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_view_events" ADD CONSTRAINT "place_view_events_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_primary_category_id_place_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."place_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_producers" ADD CONSTRAINT "product_producers_product_id_local_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."local_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_producers" ADD CONSTRAINT "product_producers_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resort_details" ADD CONSTRAINT "resort_details_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_details" ADD CONSTRAINT "restaurant_details_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_events" ADD CONSTRAINT "search_events_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_admin_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_arrival_records" ADD CONSTRAINT "visitor_arrival_records_checkin_id_destination_checkins_id_fk" FOREIGN KEY ("checkin_id") REFERENCES "public"."destination_checkins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_arrival_records" ADD CONSTRAINT "visitor_arrival_records_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_contact_information" ADD CONSTRAINT "visitor_contact_information_submission_id_visitor_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."visitor_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_privacy_acknowledgments" ADD CONSTRAINT "visitor_privacy_acknowledgments_submission_id_visitor_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."visitor_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_submissions" ADD CONSTRAINT "visitor_submissions_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_role_unique_idx" ON "admin_role_assignments" USING btree ("admin_user_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_username_idx" ON "admin_users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_daily_unique_idx" ON "analytics_daily_aggregates" USING btree ("metric_date","metric_key","dimension_key");--> statement-breakpoint
CREATE UNIQUE INDEX "announcements_slug_idx" ON "announcements" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "anonymous_sessions_token_idx" ON "anonymous_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "anonymous_sessions_started_idx" ON "anonymous_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "anonymous_sessions_last_act_idx" ON "anonymous_sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("admin_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "barangays_slug_idx" ON "barangays" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "barangays_name_idx" ON "barangays" USING btree ("name");--> statement-breakpoint
CREATE INDEX "content_revisions_entity_idx" ON "content_revisions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cultural_articles_slug_idx" ON "cultural_articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "curated_collections_slug_idx" ON "curated_collections" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "destination_checkins_guard_idx" ON "destination_checkins" USING btree ("duplicate_guard_hash");--> statement-breakpoint
CREATE INDEX "destination_checkins_place_idx" ON "destination_checkins" USING btree ("place_id","checked_in_at");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_status_date_idx" ON "events" USING btree ("status","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "galleries_slug_idx" ON "galleries" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "historical_articles_slug_idx" ON "historical_articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "itineraries_ref_idx" ON "itineraries" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "itineraries_planned_date_idx" ON "itineraries" USING btree ("planned_visit_date");--> statement-breakpoint
CREATE INDEX "itineraries_created_idx" ON "itineraries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "itinerary_drafts_token_idx" ON "itinerary_drafts" USING btree ("draft_token");--> statement-breakpoint
CREATE UNIQUE INDEX "itinerary_event_idempotency_idx" ON "itinerary_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "itinerary_event_type_idx" ON "itinerary_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "itinerary_stops_itinerary_idx" ON "itinerary_stops" USING btree ("itinerary_id","stop_order");--> statement-breakpoint
CREATE INDEX "itinerary_stops_place_idx" ON "itinerary_stops" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "local_products_slug_idx" ON "local_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "local_products_status_idx" ON "local_products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_assets_cat_idx" ON "media_assets" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "municipal_information_key_idx" ON "municipal_information" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "page_view_idempotency_idx" ON "page_view_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "page_view_viewed_idx" ON "page_view_events" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "page_view_type_idx" ON "page_view_events" USING btree ("page_type");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_slug_idx" ON "permissions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "place_amenities_place_idx" ON "place_amenities" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "place_categories_slug_idx" ON "place_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "place_cat_assign_unique_idx" ON "place_category_assignments" USING btree ("place_id","category_id");--> statement-breakpoint
CREATE INDEX "place_images_place_idx" ON "place_images" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "place_hours_unique_idx" ON "place_operating_hours" USING btree ("place_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "place_view_idempotency_idx" ON "place_view_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "place_view_session_dedupe_idx" ON "place_view_events" USING btree ("session_id","place_id");--> statement-breakpoint
CREATE INDEX "place_view_place_idx" ON "place_view_events" USING btree ("place_id","viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "places_slug_idx" ON "places" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "places_status_type_idx" ON "places" USING btree ("status","place_type");--> statement-breakpoint
CREATE INDEX "places_barangay_idx" ON "places" USING btree ("barangay_id");--> statement-breakpoint
CREATE INDEX "places_featured_idx" ON "places" USING btree ("is_featured","status");--> statement-breakpoint
CREATE INDEX "product_producers_product_idx" ON "product_producers" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_slug_idx" ON "roles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "search_event_idempotency_idx" ON "search_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "search_event_query_idx" ON "search_events" USING btree ("normalized_query");--> statement-breakpoint
CREATE INDEX "search_event_time_idx" ON "search_events" USING btree ("searched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "travel_guides_slug_idx" ON "travel_guides" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "visitor_arrival_date_idx" ON "visitor_arrival_records" USING btree ("arrival_date","place_id");--> statement-breakpoint
CREATE INDEX "visitor_sub_province_idx" ON "visitor_submissions" USING btree ("origin_province");--> statement-breakpoint
CREATE INDEX "visitor_sub_date_idx" ON "visitor_submissions" USING btree ("planned_visit_date");--> statement-breakpoint
CREATE INDEX "visitor_sub_created_idx" ON "visitor_submissions" USING btree ("created_at");