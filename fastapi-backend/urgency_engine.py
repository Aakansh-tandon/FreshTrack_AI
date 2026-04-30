"""
FreshTrack AI — Weighted Urgency Scoring Engine

Calculates urgency scores for inventory items based on:
- days_remaining (exponential decay)
- category_weight (spoilage risk by food type)
- quantity_factor (more items = slightly higher urgency)

Formula:
  base = 1 / max(days_remaining, 0.5)
  score = base * category_weight * quantity_factor
  Clamped to [0.0, 10.0]
"""

CATEGORY_WEIGHTS = {
    "Dairy": 1.5,
    "Meat": 1.8,
    "Seafood": 2.0,
    "Produce": 1.3,
    "Bakery": 1.2,
    "Frozen": 0.5,
    "Canned": 0.3,
    "Beverages": 0.8,
    "Snacks": 0.6,
    "Other": 1.0,
}


class UrgencyEngine:

    def calculate_score(self, item: dict) -> float:
        """
        Weighted urgency score combining:
        - days_remaining: primary signal (exponential decay)
        - category_weight: dairy/meat expire faster, frozen = low urgency
        - quantity: more quantity = slightly higher urgency

        Formula:
          base = 1 / max(days_remaining, 0.5)
          category_multiplier = CATEGORY_WEIGHTS.get(category, 1.0)
          quantity_factor = min(1 + (quantity - 1) * 0.1, 1.5)
          score = base * category_multiplier * quantity_factor
          Clamp final score to [0.0, 10.0]
        """
        days_remaining = item.get("days_remaining", 0)
        category = item.get("category", "Other")
        quantity = item.get("quantity", 1)

        # Avoid division by zero; expired items get max base urgency
        base = 1.0 / max(days_remaining, 0.5)

        category_multiplier = CATEGORY_WEIGHTS.get(category, 1.0)

        # Quantity factor: scales linearly from 1.0 to a cap of 1.5
        quantity_factor = min(1.0 + (quantity - 1) * 0.1, 1.5)

        score = base * category_multiplier * quantity_factor

        # Clamp to [0.0, 10.0]
        return round(max(0.0, min(score, 10.0)), 4)

    def rank_items(self, items: list[dict]) -> list[dict]:
        """
        Calculate urgency score for each item, add 'urgency_score' field,
        sort by urgency_score descending, and return the ranked list.
        """
        for item in items:
            item["urgency_score"] = self.calculate_score(item)

        ranked = sorted(items, key=lambda x: x["urgency_score"], reverse=True)
        return ranked

    def get_critical_cluster(self, items: list[dict]) -> list[dict]:
        """
        From ranked items, return top items where:
        - urgency_score > 2.0 OR days_remaining <= 3
        - Maximum 6 items (optimal for a single recipe)
        - These are the items that MUST be used first
        """
        ranked = self.rank_items(items)

        critical = [
            item for item in ranked
            if item.get("urgency_score", 0) > 2.0
            or item.get("days_remaining", 0) <= 3
        ]

        # Cap at 6 items for optimal recipe generation
        return critical[:6]
