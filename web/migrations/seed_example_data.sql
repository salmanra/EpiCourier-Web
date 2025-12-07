-- Seed script: Add example recipes, ingredients, and test data
-- Description: Adds sample data to test the application
-- Date: 2025-12-06

-- ============================================
-- 1. Insert sample ingredients
-- ============================================
INSERT INTO "Ingredient" (name, unit, calories_kcal, protein_g, carbs_g, sugars_g, agg_fats_g, cholesterol_mg, vit_a_microg, vit_c_mg)
VALUES
  ('Chicken Breast', 'g', 165, 31, 0, 0, 3.6, 85, 9, 0),
  ('Brown Rice', 'g', 112, 2.6, 24, 0.4, 0.9, 0, 0, 0),
  ('Broccoli', 'g', 34, 2.8, 7, 1.7, 0.4, 0, 623, 89.2),
  ('Olive Oil', 'ml', 884, 0, 0, 0, 100, 0, 0, 0),
  ('Tomato', 'g', 18, 0.9, 3.9, 2.6, 0.2, 0, 833, 13.7),
  ('Pasta', 'g', 131, 5, 25, 0.9, 1.1, 0, 0, 0),
  ('Salmon', 'g', 208, 20, 0, 0, 13, 55, 12, 0),
  ('Spinach', 'g', 23, 2.9, 3.6, 0.4, 0.4, 0, 9377, 28.1),
  ('Garlic', 'g', 149, 6.4, 33, 1, 0.5, 0, 9, 31.2),
  ('Lemon', 'g', 29, 1.1, 9.3, 2.5, 0.3, 0, 22, 53)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. Insert sample recipe tags
-- ============================================
INSERT INTO "RecipeTag" (name, description)
VALUES
  ('Healthy', 'Low calorie, nutritious meals'),
  ('Quick', 'Meals that take less than 30 minutes'),
  ('Vegetarian', 'No meat or fish'),
  ('High Protein', 'Protein-rich meals'),
  ('Low Carb', 'Reduced carbohydrate content')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. Insert sample recipes
-- ============================================
INSERT INTO "Recipe" (name, description, image_url, min_prep_time, green_score)
VALUES
  (
    'Grilled Chicken with Brown Rice',
    'A healthy, protein-rich meal with grilled chicken breast served over brown rice with steamed broccoli.',
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500',
    25,
    85
  ),
  (
    'Mediterranean Pasta',
    'Light pasta dish with fresh tomatoes, garlic, olive oil, and spinach.',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500',
    20,
    78
  ),
  (
    'Baked Salmon with Vegetables',
    'Oven-baked salmon fillet with roasted broccoli and a lemon-garlic sauce.',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500',
    30,
    92
  ),
  (
    'Quick Veggie Stir Fry',
    'Fast and easy stir-fried vegetables with garlic and olive oil.',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
    15,
    88
  ),
  (
    'Chicken Pasta Bowl',
    'Hearty pasta with grilled chicken, tomatoes, and spinach.',
    'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=500',
    25,
    80
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Link recipes to ingredients
-- ============================================
-- Recipe 1: Grilled Chicken with Brown Rice
INSERT INTO "Recipe-Ingredient_Map" (recipe_id, ingredient_id, relative_unit_100)
SELECT
  r.id,
  i.id,
  CASE i.name
    WHEN 'Chicken Breast' THEN 150
    WHEN 'Brown Rice' THEN 100
    WHEN 'Broccoli' THEN 80
    WHEN 'Olive Oil' THEN 10
  END
FROM "Recipe" r
CROSS JOIN "Ingredient" i
WHERE r.name = 'Grilled Chicken with Brown Rice'
  AND i.name IN ('Chicken Breast', 'Brown Rice', 'Broccoli', 'Olive Oil')
ON CONFLICT DO NOTHING;

-- Recipe 2: Mediterranean Pasta
INSERT INTO "Recipe-Ingredient_Map" (recipe_id, ingredient_id, relative_unit_100)
SELECT
  r.id,
  i.id,
  CASE i.name
    WHEN 'Pasta' THEN 100
    WHEN 'Tomato' THEN 120
    WHEN 'Garlic' THEN 5
    WHEN 'Spinach' THEN 50
    WHEN 'Olive Oil' THEN 15
  END
FROM "Recipe" r
CROSS JOIN "Ingredient" i
WHERE r.name = 'Mediterranean Pasta'
  AND i.name IN ('Pasta', 'Tomato', 'Garlic', 'Spinach', 'Olive Oil')
ON CONFLICT DO NOTHING;

-- Recipe 3: Baked Salmon with Vegetables
INSERT INTO "Recipe-Ingredient_Map" (recipe_id, ingredient_id, relative_unit_100)
SELECT
  r.id,
  i.id,
  CASE i.name
    WHEN 'Salmon' THEN 150
    WHEN 'Broccoli' THEN 100
    WHEN 'Lemon' THEN 30
    WHEN 'Garlic' THEN 5
    WHEN 'Olive Oil' THEN 10
  END
FROM "Recipe" r
CROSS JOIN "Ingredient" i
WHERE r.name = 'Baked Salmon with Vegetables'
  AND i.name IN ('Salmon', 'Broccoli', 'Lemon', 'Garlic', 'Olive Oil')
ON CONFLICT DO NOTHING;

-- Recipe 4: Quick Veggie Stir Fry
INSERT INTO "Recipe-Ingredient_Map" (recipe_id, ingredient_id, relative_unit_100)
SELECT
  r.id,
  i.id,
  CASE i.name
    WHEN 'Broccoli' THEN 100
    WHEN 'Spinach' THEN 80
    WHEN 'Garlic' THEN 5
    WHEN 'Olive Oil' THEN 10
  END
FROM "Recipe" r
CROSS JOIN "Ingredient" i
WHERE r.name = 'Quick Veggie Stir Fry'
  AND i.name IN ('Broccoli', 'Spinach', 'Garlic', 'Olive Oil')
ON CONFLICT DO NOTHING;

-- Recipe 5: Chicken Pasta Bowl
INSERT INTO "Recipe-Ingredient_Map" (recipe_id, ingredient_id, relative_unit_100)
SELECT
  r.id,
  i.id,
  CASE i.name
    WHEN 'Chicken Breast' THEN 120
    WHEN 'Pasta' THEN 100
    WHEN 'Tomato' THEN 80
    WHEN 'Spinach' THEN 50
    WHEN 'Olive Oil' THEN 10
  END
FROM "Recipe" r
CROSS JOIN "Ingredient" i
WHERE r.name = 'Chicken Pasta Bowl'
  AND i.name IN ('Chicken Breast', 'Pasta', 'Tomato', 'Spinach', 'Olive Oil')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Link recipes to tags
-- ============================================
-- Tag mapping
INSERT INTO "Recipe-Tag_Map" (recipe_id, tag_id)
SELECT r.id, t.id
FROM "Recipe" r
CROSS JOIN "RecipeTag" t
WHERE
  (r.name = 'Grilled Chicken with Brown Rice' AND t.name IN ('Healthy', 'High Protein'))
  OR (r.name = 'Mediterranean Pasta' AND t.name IN ('Healthy', 'Quick', 'Vegetarian'))
  OR (r.name = 'Baked Salmon with Vegetables' AND t.name IN ('Healthy', 'High Protein', 'Low Carb'))
  OR (r.name = 'Quick Veggie Stir Fry' AND t.name IN ('Healthy', 'Quick', 'Vegetarian', 'Low Carb'))
  OR (r.name = 'Chicken Pasta Bowl' AND t.name IN ('Quick', 'High Protein'))
ON CONFLICT DO NOTHING;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Sample data inserted successfully!';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - 10 Ingredients';
  RAISE NOTICE '  - 5 Recipe Tags';
  RAISE NOTICE '  - 5 Recipes';
  RAISE NOTICE '  - Recipe-Ingredient mappings';
  RAISE NOTICE '  - Recipe-Tag mappings';
END $$;
