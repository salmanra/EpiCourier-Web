-- Migration: Create Calendar table with meal_type support
-- Description: Creates the Calendar table to store user meal plans with proper relationships to User and Recipe tables
-- Date: 2025-12-06

-- Create Calendar table
CREATE TABLE IF NOT EXISTS "Calendar" (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  recipe_id BIGINT,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,  -- breakfast, lunch, dinner, snack, etc.
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_user_id ON "Calendar"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON "Calendar"(date);
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON "Calendar"(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_recipe_id ON "Calendar"(recipe_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_calendar_timestamp
  BEFORE UPDATE ON "Calendar"
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_updated_at();

-- Add comment to table
COMMENT ON TABLE "Calendar" IS 'Stores user meal planning entries with date, meal type, and completion status';
COMMENT ON COLUMN "Calendar".meal_type IS 'Type of meal: breakfast, lunch, dinner, or snack';
COMMENT ON COLUMN "Calendar".status IS 'Indicates whether the meal has been completed/consumed';
