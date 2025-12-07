-- Migration: Create all required tables for EpiCourier
-- Description: Creates User, Recipe, Ingredient, Calendar, and mapping tables in the correct order
-- Date: 2025-12-06

-- ============================================
-- 1. Create User table
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT,
  fullname TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- ============================================
-- 2. Create Recipe table
-- ============================================
CREATE TABLE IF NOT EXISTS "Recipe" (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  image_url TEXT,
  min_prep_time INTEGER,
  green_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_name ON "Recipe"(name);

-- ============================================
-- 3. Create Ingredient table
-- ============================================
CREATE TABLE IF NOT EXISTS "Ingredient" (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  unit TEXT NOT NULL,
  calories_kcal NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  sugars_g NUMERIC,
  agg_fats_g NUMERIC,
  cholesterol_mg NUMERIC,
  vit_a_microg NUMERIC,
  vit_c_mg NUMERIC,
  vit_d_microg NUMERIC,
  vit_e_mg NUMERIC,
  vit_k_microg NUMERIC,
  agg_vit_b_mg NUMERIC,
  agg_minerals_mg NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_name ON "Ingredient"(name);

-- ============================================
-- 4. Create RecipeTag table
-- ============================================
CREATE TABLE IF NOT EXISTS "RecipeTag" (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Create Calendar table
-- ============================================
CREATE TABLE IF NOT EXISTS "Calendar" (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  recipe_id BIGINT,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  status BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_calendar_user
    FOREIGN KEY (user_id)
    REFERENCES "User"(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_calendar_recipe
    FOREIGN KEY (recipe_id)
    REFERENCES "Recipe"(id)
    ON DELETE SET NULL,

  -- Check constraint for meal_type values
  CONSTRAINT check_meal_type
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_user_id ON "Calendar"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON "Calendar"(date);
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON "Calendar"(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_recipe_id ON "Calendar"(recipe_id);

-- ============================================
-- 6. Create Recipe-Ingredient_Map table
-- ============================================
CREATE TABLE IF NOT EXISTS "Recipe-Ingredient_Map" (
  id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT,
  ingredient_id BIGINT,
  relative_unit_100 NUMERIC,

  CONSTRAINT fk_recipe_ingredient_recipe
    FOREIGN KEY (recipe_id)
    REFERENCES "Recipe"(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_recipe_ingredient_ingredient
    FOREIGN KEY (ingredient_id)
    REFERENCES "Ingredient"(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredient_recipe ON "Recipe-Ingredient_Map"(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredient_ingredient ON "Recipe-Ingredient_Map"(ingredient_id);

-- ============================================
-- 7. Create Recipe-Tag_Map table
-- ============================================
CREATE TABLE IF NOT EXISTS "Recipe-Tag_Map" (
  id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT,
  tag_id BIGINT,

  CONSTRAINT fk_recipe_tag_recipe
    FOREIGN KEY (recipe_id)
    REFERENCES "Recipe"(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_recipe_tag_tag
    FOREIGN KEY (tag_id)
    REFERENCES "RecipeTag"(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_tag_recipe ON "Recipe-Tag_Map"(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tag_tag ON "Recipe-Tag_Map"(tag_id);

-- ============================================
-- 8. Create Recipe-Calendar_Map table
-- ============================================
CREATE TABLE IF NOT EXISTS "Recipe-Calendar_Map" (
  id BIGINT PRIMARY KEY,
  recipe_id BIGINT,
  calendar_id BIGINT,

  CONSTRAINT fk_recipe_calendar_recipe
    FOREIGN KEY (recipe_id)
    REFERENCES "Recipe"(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_recipe_calendar_calendar
    FOREIGN KEY (calendar_id)
    REFERENCES "Calendar"(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_calendar_recipe ON "Recipe-Calendar_Map"(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_calendar_calendar ON "Recipe-Calendar_Map"(calendar_id);

-- ============================================
-- 9. Create trigger functions for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for User table
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for Recipe table
DROP TRIGGER IF EXISTS update_recipe_updated_at ON "Recipe";
CREATE TRIGGER update_recipe_updated_at
  BEFORE UPDATE ON "Recipe"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for Calendar table
DROP TRIGGER IF EXISTS update_calendar_updated_at ON "Calendar";
CREATE TRIGGER update_calendar_updated_at
  BEFORE UPDATE ON "Calendar"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. Add table comments
-- ============================================
COMMENT ON TABLE "User" IS 'Stores user account information';
COMMENT ON TABLE "Recipe" IS 'Stores recipe information including nutritional data';
COMMENT ON TABLE "Ingredient" IS 'Stores ingredient nutritional information';
COMMENT ON TABLE "RecipeTag" IS 'Stores recipe categorization tags';
COMMENT ON TABLE "Calendar" IS 'Stores user meal planning entries';
COMMENT ON TABLE "Recipe-Ingredient_Map" IS 'Maps recipes to their ingredients';
COMMENT ON TABLE "Recipe-Tag_Map" IS 'Maps recipes to their tags';
COMMENT ON TABLE "Recipe-Calendar_Map" IS 'Maps recipes to calendar entries';
