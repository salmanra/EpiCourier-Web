#!/usr/bin/env python3
"""
Import full recipe dataset to Supabase database
This script reads CSV files and imports them using the Supabase Python client

Prerequisites:
    pip install supabase python-dotenv

Usage:
    python import_dataset.py

Environment Variables (create a .env file):
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_KEY=your_service_role_key
"""

import csv
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service role key for admin access

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Dataset paths
DATASET_DIR = Path(__file__).parent.parent / "backend" / "dataset"
INGREDIENTS_CSV = DATASET_DIR / "ingredients-supabase.csv"
TAGS_CSV = DATASET_DIR / "tags-supabase.csv"
RECIPES_CSV = DATASET_DIR / "recipes-supabase.csv"
RECIPE_INGREDIENT_MAP_CSV = DATASET_DIR / "recipe_ingredient_map-supabase.csv"
RECIPE_TAG_MAP_CSV = DATASET_DIR / "recipe_tag_map-supabase.csv"


def read_csv(file_path):
    """Read CSV file and return list of dictionaries"""
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)


def convert_types(row, int_fields=None, float_fields=None):
    """Convert string values to appropriate types"""
    int_fields = int_fields or []
    float_fields = float_fields or []

    result = {}
    for key, value in row.items():
        if value == '' or value is None:
            result[key] = None
        elif key in int_fields:
            result[key] = int(value) if value else None
        elif key in float_fields:
            result[key] = float(value) if value else None
        else:
            result[key] = value
    return result


def import_ingredients():
    """Import ingredients from CSV"""
    print("Importing ingredients...")
    data = read_csv(INGREDIENTS_CSV)

    float_fields = ['calories_kcal', 'protein_g', 'carbs_g', 'sugars_g', 'agg_fats_g',
                   'cholesterol_mg', 'agg_minerals_mg', 'vit_a_microg', 'agg_vit_b_mg',
                   'vit_c_mg', 'vit_d_microg', 'vit_e_mg', 'vit_k_microg']
    int_fields = ['id']

    batch_size = 100
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        converted_batch = [convert_types(row, int_fields, float_fields) for row in batch]

        try:
            response = supabase.table("Ingredient").upsert(converted_batch).execute()
            print(f"  Imported {len(batch)} ingredients (batch {i//batch_size + 1})")
        except Exception as e:
            print(f"  Error importing ingredients batch {i//batch_size + 1}: {e}")

    print(f"✓ Total ingredients imported: {len(data)}")


def import_tags():
    """Import recipe tags from CSV"""
    print("\nImporting recipe tags...")
    data = read_csv(TAGS_CSV)

    int_fields = ['id']
    converted_data = [convert_types(row, int_fields) for row in data]

    try:
        response = supabase.table("RecipeTag").upsert(converted_data).execute()
        print(f"✓ Total tags imported: {len(data)}")
    except Exception as e:
        print(f"  Error importing tags: {e}")


def import_recipes():
    """Import recipes from CSV"""
    print("\nImporting recipes...")
    data = read_csv(RECIPES_CSV)

    int_fields = ['id', 'min_prep_time', 'green_score']

    batch_size = 100
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        converted_batch = [convert_types(row, int_fields) for row in batch]

        try:
            response = supabase.table("Recipe").upsert(converted_batch).execute()
            print(f"  Imported {len(batch)} recipes (batch {i//batch_size + 1})")
        except Exception as e:
            print(f"  Error importing recipes batch {i//batch_size + 1}: {e}")

    print(f"✓ Total recipes imported: {len(data)}")


def import_recipe_ingredient_map():
    """Import recipe-ingredient mappings from CSV"""
    print("\nImporting recipe-ingredient mappings...")
    data = read_csv(RECIPE_INGREDIENT_MAP_CSV)

    int_fields = ['id', 'recipe_id', 'ingredient_id', 'relative_unit_100']

    batch_size = 100
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        converted_batch = [convert_types(row, int_fields) for row in batch]

        try:
            response = supabase.table("Recipe-Ingredient_Map").upsert(converted_batch).execute()
            print(f"  Imported {len(batch)} mappings (batch {i//batch_size + 1})")
        except Exception as e:
            print(f"  Error importing recipe-ingredient mappings batch {i//batch_size + 1}: {e}")

    print(f"✓ Total recipe-ingredient mappings imported: {len(data)}")


def import_recipe_tag_map():
    """Import recipe-tag mappings from CSV"""
    print("\nImporting recipe-tag mappings...")
    data = read_csv(RECIPE_TAG_MAP_CSV)

    int_fields = ['id', 'recipe_id', 'tag_id']
    converted_data = [convert_types(row, int_fields) for row in data]

    try:
        response = supabase.table("Recipe-Tag_Map").upsert(converted_data).execute()
        print(f"✓ Total recipe-tag mappings imported: {len(data)}")
    except Exception as e:
        print(f"  Error importing recipe-tag mappings: {e}")


def main():
    """Main import function"""
    print("=" * 60)
    print("Starting EpiCourier Recipe Dataset Import")
    print("=" * 60)

    # Import in correct order (dependencies first)
    import_ingredients()
    import_tags()
    import_recipes()
    import_recipe_ingredient_map()
    import_recipe_tag_map()

    print("\n" + "=" * 60)
    print("Import completed successfully!")
    print("=" * 60)

    # Display summary
    print("\nDatabase Summary:")
    try:
        ingredient_count = supabase.table("Ingredient").select("id", count="exact").execute()
        recipe_count = supabase.table("Recipe").select("id", count="exact").execute()
        tag_count = supabase.table("RecipeTag").select("id", count="exact").execute()

        print(f"  Total Ingredients: {ingredient_count.count}")
        print(f"  Total Recipes: {recipe_count.count}")
        print(f"  Total Tags: {tag_count.count}")
    except Exception as e:
        print(f"  Error fetching summary: {e}")


if __name__ == "__main__":
    main()
