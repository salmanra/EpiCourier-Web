# Recipe Dataset Import Instructions

This directory contains scripts to import the full recipe dataset (355 recipes) into your Supabase database.

## Dataset Overview

Located in `/backend/dataset/`:
- **355 recipes** with descriptions and preparation times
- **448 ingredients** with complete nutritional information
- **35 recipe tags** for categorization
- **529 recipe-ingredient mappings**
- **83 recipe-tag mappings**

## Import Methods

### Method 1: Python Script (Recommended for Supabase)

This method works well with Supabase and provides progress feedback.

1. **Install dependencies:**
   ```bash
   pip install supabase python-dotenv
   ```

2. **Set up environment variables:**

   Create a `.env` file in the `web/` directory:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

   You can find these values in your Supabase project settings:
   - Go to Project Settings → API
   - Copy the Project URL
   - Copy the `service_role` key (NOT the `anon` key)

3. **Run the import script:**
   ```bash
   cd web
   python import_dataset.py
   ```

### Method 2: PostgreSQL COPY (For Direct Database Access)

If you have direct PostgreSQL access (not typical for Supabase):

```bash
psql -U your_username -d your_database -f web/import_full_dataset.sql
```

### Method 3: Supabase SQL Editor (Manual)

If the above methods don't work, you can use the Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Upload the CSV files to Supabase Storage first
3. Use the SQL commands from `import_full_dataset.sql` (adjust file paths)

## Clearing Existing Data (Optional)

**⚠️ WARNING: This will delete all existing recipes, ingredients, and related data!**

If you want to start fresh, uncomment the `TRUNCATE` statements in `import_full_dataset.sql` or add this to your SQL editor before importing:

```sql
TRUNCATE TABLE "Recipe-Tag_Map" CASCADE;
TRUNCATE TABLE "Recipe-Ingredient_Map" CASCADE;
TRUNCATE TABLE "Favorite" CASCADE;
TRUNCATE TABLE "Calendar" CASCADE;
TRUNCATE TABLE "Recipe" CASCADE;
TRUNCATE TABLE "Ingredient" CASCADE;
TRUNCATE TABLE "RecipeTag" CASCADE;
```

## Verifying Import

After import, check the counts in Supabase SQL Editor:

```sql
SELECT
  (SELECT COUNT(*) FROM "Recipe") as recipes,
  (SELECT COUNT(*) FROM "Ingredient") as ingredients,
  (SELECT COUNT(*) FROM "RecipeTag") as tags,
  (SELECT COUNT(*) FROM "Recipe-Ingredient_Map") as recipe_ingredient_maps,
  (SELECT COUNT(*) FROM "Recipe-Tag_Map") as recipe_tag_maps;
```

Expected results:
- Recipes: 355
- Ingredients: 448
- Tags: 35
- Recipe-Ingredient Maps: 529
- Recipe-Tag Maps: 83

## Troubleshooting

### "Permission denied" error
- Make sure you're using the `service_role` key, not the `anon` key

### "Duplicate key value" error
- You may have existing data with conflicting IDs
- Clear existing data first or modify the script to use different IDs

### Import is very slow
- The script uses batching (100 records at a time) to improve performance
- Large datasets may still take 1-2 minutes

### CSV file not found
- Ensure you're running the script from the `web/` directory
- Check that the dataset files exist in `../backend/dataset/`

## After Import

Once imported, you should see:
- 355 recipes in the Recipes tab (instead of just 5)
- Rich filtering options by ingredients and tags
- More diverse data for the Insights visualizations
