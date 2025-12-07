"""Gemini-assisted meal recommender that always picks from Supabase recipes.

Workflow:
1) Load recipes (name, tags, ingredients, description) from Supabase.
   If Supabase is unreachable, fall back to bundled CSV snapshots.
2) Send a short list of available recipes to Gemini 2.5 Flash and ask it
   to select `num_meals` of them for the user's goal, returning JSON.
3) If Gemini is unavailable, fall back to a deterministic picker over
   the Supabase recipe list.
"""

from __future__ import annotations

import csv
import json
import os
import random
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv

try:  # Gemini SDK
    from google import genai
    try:
        from google.genai.types import GenerateContentConfig
    except Exception:  # pragma: no cover
        GenerateContentConfig = None
except Exception:  # pragma: no cover
    genai = None
    GenerateContentConfig = None

try:  # Supabase
    from supabase import create_client, Client
except Exception:  # pragma: no cover
    Client = None
    create_client = None

# Load environment early so module-level initialisation can find keys.
_here = Path(__file__).resolve()
load_dotenv(_here.parent.parent / ".env")
load_dotenv(_here.parents[2] / ".env")
load_dotenv()


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class Recipe:
    id: int
    name: str
    description: str
    ingredients: List[str]
    tags: List[str]


@dataclass
class Meal:
    recipe_id: int
    meal_number: int
    name: str
    summary: str
    calories_kcal: int
    protein_g: int
    carbs_g: int
    fats_g: int
    key_ingredients: List[str]
    tags: List[str]
    reason: str
    instructions: str
    similarity_score: float

    def to_api(self) -> dict:
        base = asdict(self)
        base["id"] = base.pop("recipe_id")
        base["recipe"] = base.pop("instructions")
        return base


# ---------------------------------------------------------------------------
# Supabase recipe loading (with CSV fallback)
# ---------------------------------------------------------------------------
def _get_supabase_client() -> Optional[Client]:
    if create_client is None:
        return None
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except Exception:
        return None


def _load_recipes_from_supabase() -> Optional[List[Recipe]]:
    client = _get_supabase_client()
    if client is None:
        return None
    try:
        recipes = client.table("Recipe").select("*").execute().data
        ingredients = client.table("Ingredient").select("id,name").execute().data
        recipe_ing_map = client.table("Recipe-Ingredient_Map").select("*").execute().data
        tags = client.table("RecipeTag").select("id,name").execute().data
        recipe_tag_map = client.table("Recipe-Tag_Map").select("*").execute().data
    except Exception:
        return None

    ing_lookup = {int(i["id"]): i.get("name", "") for i in ingredients}
    tag_lookup = {int(t["id"]): t.get("name", "") for t in tags}

    ingredients_by_recipe: Dict[int, List[str]] = {}
    for m in recipe_ing_map:
        rid = int(m["recipe_id"])
        iid = int(m["ingredient_id"])
        ingredients_by_recipe.setdefault(rid, []).append(ing_lookup.get(iid, ""))

    tags_by_recipe: Dict[int, List[str]] = {}
    for m in recipe_tag_map:
        rid = int(m["recipe_id"])
        tid = int(m["tag_id"])
        tags_by_recipe.setdefault(rid, []).append(tag_lookup.get(tid, ""))

    catalog: List[Recipe] = []
    for r in recipes:
        rid = int(r["id"])
        catalog.append(
            Recipe(
                id=rid,
                name=r.get("name", f"Recipe {rid}"),
                description=r.get("description", "") or "",
                ingredients=ingredients_by_recipe.get(rid, []),
                tags=tags_by_recipe.get(rid, []),
            )
        )
    return catalog


def _load_recipes_from_csv() -> List[Recipe]:
    """Offline fallback using the dataset snapshots."""
    dataset_dir = _here.parent.parent / "dataset"
    recipes_path = dataset_dir / "recipes-supabase.csv"
    ingredients_path = dataset_dir / "ingredients-supabase.csv"
    map_path = dataset_dir / "recipe_ingredient_map-supabase.csv"
    tags_path = dataset_dir / "tags-supabase.csv"
    tag_map_path = dataset_dir / "recipe_tag_map-supabase.csv"

    with recipes_path.open() as f:
        recipes_rows = list(csv.DictReader(f))
    with ingredients_path.open() as f:
        ingredient_rows = list(csv.DictReader(f))
    with map_path.open() as f:
        map_rows = list(csv.DictReader(f))
    with tags_path.open() as f:
        tag_rows = list(csv.DictReader(f))
    with tag_map_path.open() as f:
        tag_map_rows = list(csv.DictReader(f))

    ing_lookup = {int(r["id"]): r["name"] for r in ingredient_rows}
    tag_lookup = {int(r["id"]): r["name"] for r in tag_rows}

    ingredients_by_recipe: Dict[int, List[str]] = {}
    for row in map_rows:
        rid = int(row["recipe_id"])
        iid = int(row["ingredient_id"])
        ingredients_by_recipe.setdefault(rid, []).append(ing_lookup.get(iid, ""))

    tags_by_recipe: Dict[int, List[str]] = {}
    for row in tag_map_rows:
        rid = int(row["recipe_id"])
        tid = int(row["tag_id"])
        tags_by_recipe.setdefault(rid, []).append(tag_lookup.get(tid, ""))

    catalog: List[Recipe] = []
    for row in recipes_rows:
        rid = int(row["id"])
        catalog.append(
            Recipe(
                id=rid,
                name=row.get("name", f"Recipe {rid}"),
                description=row.get("description", "") or "",
                ingredients=ingredients_by_recipe.get(rid, []),
                tags=tags_by_recipe.get(rid, []),
            )
        )
    return catalog


_RECIPE_CACHE: Optional[List[Recipe]] = None


def _get_catalog() -> List[Recipe]:
    global _RECIPE_CACHE
    if _RECIPE_CACHE is not None:
        return _RECIPE_CACHE
    catalog = _load_recipes_from_supabase()
    if catalog is None:
        catalog = _load_recipes_from_csv()
    _RECIPE_CACHE = catalog
    return catalog


# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------
def _get_gemini_client():
    api_key = (
        os.getenv("GEMINI_KEY")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GEMINI_TOKEN")
    )
    if not api_key or genai is None:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception:
        return None


def _call_gemini(goal: str, num_meals: int, catalog: List[Recipe]) -> Optional[dict]:
    """Ask Gemini to pick recipes from the supplied catalog and return JSON."""
    client = _get_gemini_client()
    if client is None:
        return None

    # Keep prompt compact: sample up to 40 recipes
    sample_recipes = random.sample(catalog, k=min(len(catalog), 40))
    lines = []
    for r in sample_recipes:
        ing = ", ".join(r.ingredients[:6]) if r.ingredients else "N/A"
        tags = ", ".join(r.tags[:6]) if r.tags else "N/A"
        lines.append(f"- id:{r.id} | name:{r.name} | tags:{tags} | ingredients:{ing}")
    catalog_text = "\n".join(lines)

    prompt = f"""
You are a registered dietitian. Choose exactly {num_meals} meals from the catalog below that best align with the goal.
Goal: "{goal}"

Catalog (only choose from these):
{catalog_text}

Return ONLY valid JSON:
{{
  "goal_expanded": "one or two sentences on how to eat for the goal",
  "meals": [
    {{
      "meal_number": 1,
      "recipe_id": 123,
      "name": "Use the recipe's name",
      "summary": "Why this recipe fits",
      "reason": "Clear, user-friendly rationale",
      "instructions": "1-2 short prep sentences"
    }}
  ]
}}
Rules: every recipe_id must come from the catalog; no markdown; include exactly {num_meals} meals.
"""
    try:
        cfg = {"temperature": 0.45, "response_mime_type": "application/json"}
        if GenerateContentConfig is not None:
            cfg = GenerateContentConfig(**cfg)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=cfg,
        )
        text = getattr(response, "text", "") or getattr(response, "candidates", None)
        if not text:
            return None
        if isinstance(text, str):
            raw_json = text
        else:
            try:
                raw_json = text[0].content.parts[0].text  # type: ignore[index]
            except Exception:
                return None
        return json.loads(raw_json)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Fallback picker (still uses Supabase/CSV recipes)
# ---------------------------------------------------------------------------
def _fallback_plan(goal: str, num_meals: int, catalog: List[Recipe]) -> dict:
    chosen = catalog[:num_meals] if len(catalog) >= num_meals else catalog
    meals: List[Meal] = []
    for idx, r in enumerate(chosen):
        meals.append(
            Meal(
                recipe_id=r.id,
                meal_number=idx + 1,
                name=r.name,
                summary=f"{r.name} supports '{goal}' with balanced nutrients.",
                calories_kcal=0,
                protein_g=0,
                carbs_g=0,
                fats_g=0,
                key_ingredients=r.ingredients[:8],
                tags=r.tags[:6],
                reason="Selected from existing recipes to match the goal.",
                instructions=(r.description[:180] + "...") if r.description else "See recipe card.",
                similarity_score=round(1.0 - (idx * 0.05), 3),
            )
        )
    return {
        "goal_expanded": f"Practical eating pattern to achieve: {goal}.",
        "meals": meals,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def create_meal_plan(goal: str, num_meals: int) -> tuple[list[dict], str]:
    catalog = _get_catalog()
    gemini_plan = _call_gemini(goal, num_meals, catalog)

    if gemini_plan and isinstance(gemini_plan.get("meals"), list):
        catalog_lookup = {r.id: r for r in catalog}
        meals: List[Meal] = []
        used_ids = set()
        for idx, m in enumerate(gemini_plan["meals"]):
            rid = int(m.get("recipe_id", 0))
            recipe = catalog_lookup.get(rid)
            if recipe is None or rid in used_ids:
                continue
            used_ids.add(rid)
            meals.append(
                Meal(
                    recipe_id=rid,
                    meal_number=int(m.get("meal_number", idx + 1)),
                    name=recipe.name,
                    summary=str(m.get("summary", recipe.description or goal)),
                    calories_kcal=int(m.get("calories_kcal", 0)),
                    protein_g=int(m.get("protein_g", 0)),
                    carbs_g=int(m.get("carbs_g", 0)),
                    fats_g=int(m.get("fats_g", 0)),
                    key_ingredients=recipe.ingredients[:8],
                    tags=recipe.tags[:6],
                    reason=str(m.get("reason", "Supports the goal.")),
                    instructions=str(m.get("instructions", recipe.description or "See recipe card.")),
                    similarity_score=round(1.0 - (idx * 0.05), 3),
                )
            )

        # If Gemini returned fewer meals than requested, top up deterministically
        if len(meals) < num_meals:
            remaining = [r for r in catalog if r.id not in used_ids][: num_meals - len(meals)]
            start_idx = len(meals)
            for i, r in enumerate(remaining):
                meals.append(
                    Meal(
                        recipe_id=r.id,
                        meal_number=start_idx + i + 1,
                        name=r.name,
                        summary=f"{r.name} supports '{goal}'.",
                        calories_kcal=0,
                        protein_g=0,
                        carbs_g=0,
                        fats_g=0,
                        key_ingredients=r.ingredients[:8],
                        tags=r.tags[:6],
                        reason="Filled from existing recipes to hit requested count.",
                        instructions=(r.description[:180] + "...") if r.description else "See recipe card.",
                        similarity_score=round(1.0 - ((start_idx + i) * 0.05), 3),
                    )
                )

        goal_expanded = str(gemini_plan.get("goal_expanded", goal)).strip()
    else:
        # alert if we are using fallback 
        fallback = _fallback_plan(goal, num_meals, catalog)
        meals = fallback["meals"]
        goal_expanded = fallback["goal_expanded"]

    meals_sorted = sorted(meals, key=lambda m: m.similarity_score, reverse=True)
    return [m.to_api() for m in meals_sorted], goal_expanded
