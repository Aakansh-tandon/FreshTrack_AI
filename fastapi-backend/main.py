"""
FreshTrack AI — FastAPI Backend

Endpoints:
  POST /score-items     → Rank inventory items by urgency score
  POST /auto-recipe     → Auto-generate recipe from critical items
  POST /custom-recipe   → Generate recipe from user ingredients + preferences
  POST /analytics       → Calculate waste reduction analytics
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from urgency_engine import UrgencyEngine
from recipe_engine import RecipeEngine
from analytics_engine import AnalyticsEngine

app = FastAPI(
    title="FreshTrack AI Backend",
    description="Urgency scoring, AI recipe generation, and waste analytics microservice",
    version="1.0.0",
)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fresh-track-ai.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine instances
urgency_engine = UrgencyEngine()
recipe_engine = RecipeEngine()
analytics_engine = AnalyticsEngine()


# --- Request Models ---

class ScoreItemsRequest(BaseModel):
    items: list[dict]


class AutoRecipeRequest(BaseModel):
    items: list[dict]


class CustomRecipeRequest(BaseModel):
    ingredients: list[str]
    preferences: list[str] = []


class AnalyticsRequest(BaseModel):
    inventory: list[dict]
    consumption_logs: list[dict]


# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "ok", "service": "FreshTrack AI Backend"}


@app.post("/score-items")
def score_items(request: ScoreItemsRequest):
    """Rank inventory items by urgency score."""
    ranked = urgency_engine.rank_items(request.items)
    return {"items": ranked}


@app.post("/auto-recipe")
def auto_recipe(request: AutoRecipeRequest):
    """Auto-generate recipe from critical items."""
    cluster = urgency_engine.get_critical_cluster(request.items)

    if not cluster:
        return {"recipe": None, "message": "No critical items found"}

    recipe = recipe_engine.generate_auto_recipe(cluster)
    return {"recipe": recipe, "critical_items_used": len(cluster)}


@app.post("/custom-recipe")
def custom_recipe(request: CustomRecipeRequest):
    """Generate recipe from user-specified ingredients and preferences."""
    recipe = recipe_engine.generate_custom_recipe(
        request.ingredients,
        request.preferences,
    )
    return {"recipe": recipe}


@app.post("/analytics")
def analytics(request: AnalyticsRequest):
    """Calculate waste reduction analytics."""
    result = analytics_engine.calculate(
        request.inventory,
        request.consumption_logs,
    )
    return result
