-- Migration: Create Review table for ratings and comments
-- Description: Tracks user reviews, ratings (1-5 stars), and comments on recipes
-- Date: 2025-12-07

CREATE TABLE IF NOT EXISTS "Review" (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  recipe_id BIGINT NOT NULL REFERENCES "Recipe"(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can only have one review per recipe
  UNIQUE(user_id, recipe_id)
);

-- Index for quick lookups by recipe_id (get all reviews for a recipe)
CREATE INDEX IF NOT EXISTS idx_review_recipe_id ON "Review"(recipe_id);

-- Index for quick lookups by user_id (get all user's reviews)
CREATE INDEX IF NOT EXISTS idx_review_user_id ON "Review"(user_id);

-- Index for getting highest rated recipes
CREATE INDEX IF NOT EXISTS idx_review_rating ON "Review"(rating DESC);
