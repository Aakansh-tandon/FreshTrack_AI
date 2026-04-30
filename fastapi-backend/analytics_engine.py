"""
FreshTrack AI — Analytics Engine

Calculates waste reduction metrics, category breakdowns,
and consumption statistics from inventory and log data.
"""

from datetime import datetime, timedelta, timezone


class AnalyticsEngine:

    def calculate(
        self,
        inventory: list[dict],
        consumption_logs: list[dict],
    ) -> dict:
        """
        Calculate and return comprehensive analytics:
        - Status counts (fresh, expiring_soon, critical, expired)
        - Consumption vs waste metrics
        - Waste reduction percentage
        - Items saved this week
        - Most wasted category
        - Per-category breakdown (total vs critical)
        """

        # --- Status counts from current inventory ---
        total_items = len(inventory)
        fresh_count = sum(1 for i in inventory if i.get("status") == "fresh")
        expiring_soon_count = sum(1 for i in inventory if i.get("status") == "expiring_soon")
        critical_count = sum(1 for i in inventory if i.get("status") == "critical")
        expired_count = sum(1 for i in inventory if i.get("status") == "expired")

        # --- Consumption log analysis ---
        consumed_count = sum(1 for log in consumption_logs if log.get("action") == "consumed")
        wasted_count = sum(
            1 for log in consumption_logs
            if log.get("action") in ("expired", "discarded")
        )

        # Waste reduction percentage
        total_logged = consumed_count + wasted_count
        waste_reduction_pct = round(
            (consumed_count / total_logged * 100) if total_logged > 0 else 0.0,
            1,
        )

        # Items saved this week (consumed logs in last 7 days)
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        items_saved_this_week = 0
        for log in consumption_logs:
            if log.get("action") == "consumed":
                logged_at = log.get("logged_at", "")
                try:
                    log_date = datetime.fromisoformat(logged_at.replace("Z", "+00:00"))
                    if log_date >= week_ago:
                        items_saved_this_week += 1
                except (ValueError, AttributeError):
                    continue

        # Most wasted category
        waste_by_category: dict[str, int] = {}
        for log in consumption_logs:
            if log.get("action") in ("expired", "discarded"):
                cat = log.get("category", "Other")
                waste_by_category[cat] = waste_by_category.get(cat, 0) + 1

        most_wasted_category = (
            max(waste_by_category, key=waste_by_category.get)
            if waste_by_category
            else "N/A"
        )

        # Category breakdown from inventory
        category_breakdown: dict[str, dict[str, int]] = {}
        for item in inventory:
            cat = item.get("category", "Other")
            if cat not in category_breakdown:
                category_breakdown[cat] = {"total": 0, "critical": 0}
            category_breakdown[cat]["total"] += 1
            if item.get("status") in ("critical", "expired"):
                category_breakdown[cat]["critical"] += 1

        return {
            "total_items": total_items,
            "fresh_count": fresh_count,
            "expiring_soon_count": expiring_soon_count,
            "critical_count": critical_count,
            "expired_count": expired_count,
            "consumed_count": consumed_count,
            "wasted_count": wasted_count,
            "waste_reduction_pct": waste_reduction_pct,
            "items_saved_this_week": items_saved_this_week,
            "most_wasted_category": most_wasted_category,
            "category_breakdown": category_breakdown,
        }
