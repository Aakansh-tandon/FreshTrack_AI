"""
FreshTrack AI — Recipe Generation Engine

Uses Google Gemini 2.0 Flash to generate recipes from expiring ingredients.
Supports both automatic (critical-item-based) and custom (user-preference-based) generation.
"""

import os
import json
import re

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


class RecipeEngine:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def _parse_json_response(self, text: str) -> dict:
        """Strip accidental markdown fences and parse JSON."""
        # Remove ```json ... ``` or ``` ... ``` wrappers
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            return {
                "error": True,
                "message": f"Failed to parse Gemini response as JSON: {str(e)}",
                "raw_response": text[:500],
            }

    def generate_auto_recipe(self, critical_items: list[dict]) -> dict:
        """
        Called automatically when items are critical — no user input needed.
        Generates a recipe that uses as many expiring ingredients as possible.
        """
        if not critical_items:
            return {"error": True, "message": "No critical items provided"}

        # Format ingredient list
        ingredients_text = "\n".join(
            f"- {item.get('product_name', 'Unknown')} ({item.get('category', 'Other')}): "
            f"{item.get('days_remaining', 0)} days left, urgency score: {item.get('urgency_score', 0):.2f}"
            for item in critical_items
        )

        prompt = f"""You are a professional chef specializing in zero food waste cooking.
You MUST use the provided expiring ingredients as the PRIMARY components.
Return ONLY valid JSON — no markdown, no explanation, no code blocks.

These ingredients are expiring urgently (sorted by urgency):
{ingredients_text}

Generate ONE recipe that uses AS MANY of these ingredients as possible.

Return ONLY this JSON:
{{
  "title": "recipe name",
  "description": "2 sentence description mentioning waste reduction",
  "prep_time": "X mins",
  "cook_time": "X mins",
  "difficulty": "Easy|Medium|Hard",
  "ingredients": ["ingredient with quantity"],
  "instructions": ["step 1", "step 2"],
  "expiring_items_used": ["item names from the input list used"],
  "items_saved_count": 0,
  "urgency_score": 0.0
}}"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)

            # Calculate urgency_score as average of used items if not set
            if not result.get("error"):
                used_names = [n.lower() for n in result.get("expiring_items_used", [])]
                used_scores = [
                    item.get("urgency_score", 0)
                    for item in critical_items
                    if item.get("product_name", "").lower() in used_names
                ]
                if used_scores:
                    result["urgency_score"] = round(sum(used_scores) / len(used_scores), 2)
                result["items_saved_count"] = len(result.get("expiring_items_used", []))

            return result
        except Exception as e:
            return {
                "error": True,
                "message": f"Gemini API call failed: {str(e)}",
            }

    def generate_custom_recipe(
        self,
        ingredients: list[str],
        preferences: list[str],
    ) -> dict:
        """
        User-requested recipe with dietary preferences.
        Same JSON output format as auto recipe.
        """
        if not ingredients:
            return {"error": True, "message": "No ingredients provided"}

        ingredients_text = "\n".join(f"- {ing}" for ing in ingredients)
        preferences_text = ", ".join(preferences) if preferences else "None"

        prompt = f"""You are a professional chef specializing in zero food waste cooking.
You MUST use the provided ingredients as the PRIMARY components.
Return ONLY valid JSON — no markdown, no explanation, no code blocks.

Available ingredients:
{ingredients_text}

Dietary preferences: {preferences_text}

Generate ONE recipe that uses AS MANY of these ingredients as possible.

Return ONLY this JSON:
{{
  "title": "recipe name",
  "description": "2 sentence description mentioning waste reduction",
  "prep_time": "X mins",
  "cook_time": "X mins",
  "difficulty": "Easy|Medium|Hard",
  "ingredients": ["ingredient with quantity"],
  "instructions": ["step 1", "step 2"],
  "expiring_items_used": ["item names from the input list used"],
  "items_saved_count": 0,
  "urgency_score": 0.0
}}"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            if not result.get("error"):
                result["items_saved_count"] = len(result.get("expiring_items_used", []))
            return result
        except Exception as e:
            return {
                "error": True,
                "message": f"Gemini API call failed: {str(e)}",
            }

    def rank_recipes(self, recipes: list[dict]) -> list[dict]:
        """
        Sort recipes by:
        1. items_saved_count descending (primary)
        2. urgency_score descending (tiebreaker)
        Add 'rank' field and 'best_match': True on rank=1 item.
        """
        sorted_recipes = sorted(
            recipes,
            key=lambda r: (r.get("items_saved_count", 0), r.get("urgency_score", 0)),
            reverse=True,
        )

        for i, recipe in enumerate(sorted_recipes):
            recipe["rank"] = i + 1
            recipe["best_match"] = (i == 0)

        return sorted_recipes
