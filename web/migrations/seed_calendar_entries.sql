-- Seed script: Add example calendar entries for testing
-- Description: Adds sample calendar entries linked to your user account
-- Date: 2025-12-06
--
-- IMPORTANT: This script assumes you have already:
-- 1. Created a user account in the app (via sign up)
-- 2. Run the seed_example_data.sql script to add recipes

-- ============================================
-- Add calendar entries for the current user
-- ============================================

-- This will add calendar entries for the FIRST user in your database
-- If you need to target a specific user, replace the user_id subquery

DO $$
DECLARE
  v_user_id BIGINT;
  v_recipe_1 BIGINT;
  v_recipe_2 BIGINT;
  v_recipe_3 BIGINT;
  v_recipe_4 BIGINT;
  v_recipe_5 BIGINT;
  v_today TEXT;
  v_tomorrow TEXT;
  v_day_after TEXT;
BEGIN
  -- Get the first user's ID
  SELECT id INTO v_user_id FROM "User" LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found! Please create a user account first by signing up in the app.';
  END IF;

  -- Get recipe IDs
  SELECT id INTO v_recipe_1 FROM "Recipe" WHERE name = 'Grilled Chicken with Brown Rice' LIMIT 1;
  SELECT id INTO v_recipe_2 FROM "Recipe" WHERE name = 'Mediterranean Pasta' LIMIT 1;
  SELECT id INTO v_recipe_3 FROM "Recipe" WHERE name = 'Baked Salmon with Vegetables' LIMIT 1;
  SELECT id INTO v_recipe_4 FROM "Recipe" WHERE name = 'Quick Veggie Stir Fry' LIMIT 1;
  SELECT id INTO v_recipe_5 FROM "Recipe" WHERE name = 'Chicken Pasta Bowl' LIMIT 1;

  IF v_recipe_1 IS NULL THEN
    RAISE EXCEPTION 'No recipes found! Please run seed_example_data.sql first.';
  END IF;

  -- Get dates (today, tomorrow, day after)
  v_today := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
  v_tomorrow := TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'YYYY-MM-DD');
  v_day_after := TO_CHAR(CURRENT_DATE + INTERVAL '2 days', 'YYYY-MM-DD');

  -- Insert calendar entries
  INSERT INTO "Calendar" (user_id, recipe_id, date, meal_type, status, notes)
  VALUES
    -- Today's meals
    (v_user_id, v_recipe_1, v_today, 'breakfast', false, 'Healthy start to the day'),
    (v_user_id, v_recipe_2, v_today, 'lunch', false, 'Light lunch'),
    (v_user_id, v_recipe_3, v_today, 'dinner', false, 'Nutritious dinner'),

    -- Tomorrow's meals
    (v_user_id, v_recipe_4, v_tomorrow, 'breakfast', false, 'Quick morning meal'),
    (v_user_id, v_recipe_5, v_tomorrow, 'lunch', false, 'Protein-packed lunch'),
    (v_user_id, v_recipe_1, v_tomorrow, 'dinner', false, 'Classic favorite'),

    -- Day after tomorrow
    (v_user_id, v_recipe_2, v_day_after, 'breakfast', false, NULL),
    (v_user_id, v_recipe_3, v_day_after, 'lunch', false, NULL),
    (v_user_id, v_recipe_4, v_day_after, 'dinner', false, NULL)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Calendar entries added successfully!';
  RAISE NOTICE 'Added meals for user ID: %', v_user_id;
  RAISE NOTICE 'Date range: % to %', v_today, v_day_after;
END $$;
