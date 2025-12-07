# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## Quick Start

**If you're starting fresh and have NO tables created yet:**
1. Run `000_create_all_tables.sql` - This creates ALL tables in the correct order

**If you already have User and Recipe tables:**
1. Run `001_create_calendar_table.sql` - This creates only the Calendar table

**If you have Calendar table but it's missing meal_type:**
1. Run `002_add_meal_type_to_calendar.sql` - This adds the meal_type column

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of the migration file (e.g., `001_create_calendar_table.sql`)
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

### Option 3: Using psql (Direct Database Connection)

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" -f migrations/001_create_calendar_table.sql
```

## After Running Migrations

### Update TypeScript Types

After creating or modifying tables, regenerate your TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

Or if using Supabase CLI:

```bash
supabase gen types typescript --linked > src/types/supabase.ts
```

## Migration Files

- `001_create_calendar_table.sql` - Creates the Calendar table with meal_type support

## Troubleshooting

### Error: relation "User" does not exist

Make sure the User and Recipe tables exist before running this migration. The Calendar table has foreign key dependencies on these tables.

### Error: table "Calendar" already exists

If the table already exists but is missing the `meal_type` column, you may need to alter the existing table instead:

```sql
ALTER TABLE "Calendar" ADD COLUMN IF NOT EXISTS meal_type TEXT NOT NULL DEFAULT 'dinner';
ALTER TABLE "Calendar" ADD CONSTRAINT check_meal_type
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));
```
