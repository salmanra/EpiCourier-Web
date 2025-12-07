-- SQL Script to populate Calendar table with test data
-- Adds 2 meals per day for the last 12 months for user_id = 1
--
-- Usage (with psql):
--   psql -U your_username -d your_database -f seed_calendar_test_data.sql
--
-- Or execute via Supabase SQL Editor

-- Clear any existing test data for user 1 (optional - comment out if you want to keep existing data)
-- DELETE FROM "Calendar" WHERE user_id = 1;

-- Insert 2 meals per day for the past 12 months
INSERT INTO "Calendar" (user_id, recipe_id, date, meal_type, status, created_at, updated_at)
SELECT
    1 as user_id,
    -- Randomly select recipe_id from the imported dataset (52764-52894 range)
    -- Note: Adjust this range based on your actual recipe IDs in the database
    (52764 + floor(random() * 50))::int as recipe_id,
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

-- Display summary of inserted data
SELECT
    COUNT(*) as total_meals,
    COUNT(CASE WHEN status = true THEN 1 END) as completed_meals,
    COUNT(CASE WHEN status = false THEN 1 END) as incomplete_meals,
    MIN(date) as earliest_meal,
    MAX(date) as latest_meal
FROM "Calendar"
WHERE user_id = 1;
