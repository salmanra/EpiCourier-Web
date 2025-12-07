from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from api.recommender import create_meal_plan

_here = Path(__file__).resolve()
load_dotenv(_here.parent.parent / ".env")
load_dotenv(_here.parents[2] / ".env")
load_dotenv()

app = FastAPI(title="EpiCourier Meal Recommender", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    goal: str = Field(..., description="User's nutrition or fitness objective.")
    num_meals: int = Field(..., alias="numMeals", ge=1, le=10, description="How many meals to include.")

    model_config = {"populate_by_name": True}


class RecommendResponse(BaseModel):
    goal_expanded: str
    recipes: list[dict]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommender", response_model=RecommendResponse)
def recommend_meals(req: RecommendRequest):
    goal = req.goal.strip()
    if not goal:
        raise HTTPException(status_code=400, detail="Goal cannot be empty.")

    meals, expanded = create_meal_plan(goal, req.num_meals)
    return {"recipes": meals, "goal_expanded": expanded}
