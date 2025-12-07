-- SQL Script to populate Calendar table with test data using ACTUAL recipe IDs from database
-- Adds 2 meals per day for the last 12 months for user_id = 1
-- This version dynamically selects from recipes that exist in the Recipe table
--
-- Usage (with psql):
--   psql -U your_username -d your_database -f seed_calendar_with_real_recipes.sql
--
-- Or execute via Supabase SQL Editor

-- Clear any existing test data for user 1 (optional - uncomment if needed)
-- DELETE FROM "Calendar" WHERE user_id = 1;

-- First, create a temporary table with all recipe IDs
CREATE TEMP TABLE temp_recipe_ids AS
SELECT id FROM "Recipe" ORDER BY id;

-- Insert 2 meals per day for the past 12 months
-- This version randomly picks from ACTUAL recipes in your database
INSERT INTO "Calendar" (user_id, recipe_id, date, meal_type, status, created_at, updated_at)
SELECT
    1 as user_id,
    -- Randomly select an actual recipe_id from the Recipe table
    (SELECT id FROM temp_recipe_ids ORDER BY random() LIMIT 1) as recipe_id,
    -- Date from the series
    day::date as date,
    -- Alternate between 'lunch' and 'dinner' for the 2 meals per day
    CASE
        WHEN meal_num = 1 THEN 'lunch'
        ELSE 'dinner'
    END as meal_type,
    -- Randomly set some meals as completed (70% completion rate)
    (random() > 0.3) as status,
    -- Set created_at to the meal date
    day::timestamp as created_at,
    -- Set updated_at to the meal date
    day::timestamp as updated_at
FROM
    -- Generate series of dates for the past 12 months
    generate_series(
        CURRENT_DATE - INTERVAL '12 months',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    ) AS day,
    -- Generate 2 meals per day
    generate_series(1, 2) AS meal_num
ORDER BY day, meal_num;

-- Clean up temp table
DROP TABLE temp_recipe_ids;

-- Display summary of inserted data
SELECT
    COUNT(*) as total_meals,
    COUNT(CASE WHEN status = true THEN 1 END) as completed_meals,
    COUNT(CASE WHEN status = false THEN 1 END) as incomplete_meals,
    MIN(date) as earliest_meal,
    MAX(date) as latest_meal,
    COUNT(DISTINCT recipe_id) as unique_recipes_used
FROM "Calendar"
WHERE user_id = 1;

-- Show recipe distribution
SELECT
    r.name,
    COUNT(*) as times_used
FROM "Calendar" c
JOIN "Recipe" r ON c.recipe_id = r.id
WHERE c.user_id = 1
GROUP BY r.id, r.name
ORDER BY times_used DESC
LIMIT 10;
