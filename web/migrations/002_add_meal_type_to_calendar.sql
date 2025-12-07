-- Migration: Add meal_type column to existing Calendar table
-- Description: Use this if the Calendar table already exists but is missing the meal_type column
-- Date: 2025-12-06

-- Add meal_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Calendar'
    AND column_name = 'meal_type'
  ) THEN
    ALTER TABLE "Calendar"
      ADD COLUMN meal_type TEXT NOT NULL DEFAULT 'dinner';

    -- Add check constraint
    ALTER TABLE "Calendar"
      ADD CONSTRAINT check_meal_type
        CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));

    RAISE NOTICE 'Added meal_type column to Calendar table';
  ELSE
    RAISE NOTICE 'meal_type column already exists in Calendar table';
  END IF;
END $$;
