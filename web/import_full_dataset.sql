-- Import Full Recipe Dataset from CSV files
-- This script imports all recipes, ingredients, tags, and their relationships
--
-- PREREQUISITES:
-- 1. CSV files must be accessible to PostgreSQL server
-- 2. Run this from the project root directory
--
-- Usage (from project root):
--   psql -U your_username -d your_database -f web/import_full_dataset.sql
--
-- Or via Supabase SQL Editor:
--   Note: Supabase SQL Editor doesn't support COPY FROM, so use the alternative
--   import_full_dataset_via_supabase.sh script instead

-- Clear existing data (CAREFUL: This deletes all current data!)
-- Uncomment the lines below if you want to start fresh
-- TRUNCATE TABLE "Recipe-Tag_Map" CASCADE;
-- TRUNCATE TABLE "Recipe-Ingredient_Map" CASCADE;
-- TRUNCATE TABLE "Favorite" CASCADE;
-- TRUNCATE TABLE "Calendar" CASCADE;
-- TRUNCATE TABLE "Recipe" CASCADE;
-- TRUNCATE TABLE "Ingredient" CASCADE;
-- TRUNCATE TABLE "RecipeTag" CASCADE;

-- Import Ingredients
-- Note: Adjust the file path to match your system
\COPY "Ingredient" (id, name, unit, calories_kcal, protein_g, carbs_g, sugars_g, agg_fats_g, cholesterol_mg, agg_minerals_mg, vit_a_microg, agg_vit_b_mg, vit_c_mg, vit_d_microg, vit_e_mg, vit_k_microg) FROM '/home/rahmy/EpiCourier-Web/backend/dataset/ingredients-supabase.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Import Tags
\COPY "RecipeTag" (id, name, description) FROM '/home/rahmy/EpiCourier-Web/backend/dataset/tags-supabase.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Import Recipes
\COPY "Recipe" (id, name, description, min_prep_time, green_score, image_url) FROM '/home/rahmy/EpiCourier-Web/backend/dataset/recipes-supabase.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Import Recipe-Ingredient Mappings
\COPY "Recipe-Ingredient_Map" (id, recipe_id, ingredient_id, relative_unit_100) FROM '/home/rahmy/EpiCourier-Web/backend/dataset/recipe_ingredient_map-supabase.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Import Recipe-Tag Mappings
\COPY "Recipe-Tag_Map" (id, recipe_id, tag_id) FROM '/home/rahmy/EpiCourier-Web/backend/dataset/recipe_tag_map-supabase.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Update sequences to avoid ID conflicts
SELECT setval(pg_get_serial_sequence('"Ingredient"', 'id'), (SELECT MAX(id) FROM "Ingredient"));
SELECT setval(pg_get_serial_sequence('"RecipeTag"', 'id'), (SELECT MAX(id) FROM "RecipeTag"));
SELECT setval(pg_get_serial_sequence('"Recipe"', 'id'), (SELECT MAX(id) FROM "Recipe"));
SELECT setval(pg_get_serial_sequence('"Recipe-Ingredient_Map"', 'id'), (SELECT MAX(id) FROM "Recipe-Ingredient_Map"));
SELECT setval(pg_get_serial_sequence('"Recipe-Tag_Map"', 'id'), (SELECT MAX(id) FROM "Recipe-Tag_Map"));

-- Display import summary
SELECT 'Import Summary:' as status;
SELECT COUNT(*) as total_ingredients FROM "Ingredient";
SELECT COUNT(*) as total_tags FROM "RecipeTag";
SELECT COUNT(*) as total_recipes FROM "Recipe";
SELECT COUNT(*) as total_recipe_ingredient_mappings FROM "Recipe-Ingredient_Map";
SELECT COUNT(*) as total_recipe_tag_mappings FROM "Recipe-Tag_Map";

-- Show sample of imported recipes
SELECT id, name, min_prep_time, green_score
FROM "Recipe"
ORDER BY id
LIMIT 10;
