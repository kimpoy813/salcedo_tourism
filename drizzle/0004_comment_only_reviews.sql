-- Allow comment-only reviews (rating is optional when a visitor leaves a comment)
ALTER TABLE "place_ratings" ALTER COLUMN "rating" DROP NOT NULL;
