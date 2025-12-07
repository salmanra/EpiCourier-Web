-- Migration: Create Favorites table
-- Description: Tracks user-favorited recipes
-- Date: 2025-12-06

CREATE TABLE IF NOT EXISTS "Favorite" (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  recipe_id BIGINT NOT NULL REFERENCES "Recipe"(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only favorite a recipe once
  UNIQUE(user_id, recipe_id)
);

-- Index for quick lookups by user_id
CREATE INDEX IF NOT EXISTS idx_favorite_user_id ON "Favorite"(user_id);

-- Index for quick lookups by recipe_id
CREATE INDEX IF NOT EXISTS idx_favorite_recipe_id ON "Favorite"(recipe_id);
