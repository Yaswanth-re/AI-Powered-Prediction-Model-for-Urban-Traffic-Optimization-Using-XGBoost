class RoadSafetyIndexCalculator:
    """
    Transparent Road Safety Index (0-100) calculator.
    Formula:
    Safety Score = 100 - (Accident Penalty + Congestion Penalty + Weather Penalty + Intersection Penalty + Historical Penalty)
    Interpretation:
    80-100: Very Safe
    60-79: Safe
    40-59: Moderate
    20-39: Dangerous
    0-19: Critical
    """

    def calculate_score(self, segment: dict, weather: dict = None) -> dict:
        base_score = 100.0

        current_cong = segment.get('current_congestion_pct', 25.0)
        hist_accidents = segment.get('accident_frequency_historical', 2.0)
        is_intersection = segment.get('is_intersection', False)
        rain = weather.get('rainfall_mm', 0.0) if weather else 0.0
        vis = weather.get('visibility_m', 10000.0) if weather else 10000.0

        # Penalty calculations
        p_accidents = min(35.0, hist_accidents * 4.0)
        p_congestion = min(30.0, current_cong * 0.35)
        p_weather = min(20.0, (rain * 2.0) + (10.0 if vis < 5000 else 0.0))
        p_intersection = 12.0 if is_intersection else 0.0
        p_historical = min(15.0, (hist_accidents ** 1.2) * 1.5)

        total_penalties = p_accidents + p_congestion + p_weather + p_intersection + p_historical
        final_score = round(max(0.0, min(100.0, base_score - total_penalties)), 1)

        if final_score >= 80.0:
            rating = "Very Safe"
            badge = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        elif final_score >= 60.0:
            rating = "Safe"
            badge = "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
        elif final_score >= 40.0:
            rating = "Moderate"
            badge = "bg-amber-500/20 text-amber-400 border-amber-500/30"
        elif final_score >= 20.0:
            rating = "Dangerous"
            badge = "bg-orange-500/20 text-orange-400 border-orange-500/30"
        else:
            rating = "Critical"
            badge = "bg-rose-500/20 text-rose-400 border-rose-500/30"

        penalties_breakdown = [
            {"name": "Accident Frequency Penalty", "points_deducted": round(p_accidents, 1), "reason": f"Historical accident frequency rating of {hist_accidents}/10"},
            {"name": "Congestion Penalty", "points_deducted": round(p_congestion, 1), "reason": f"Current traffic density congestion at {current_cong}%"},
            {"name": "Weather Exposure Penalty", "points_deducted": round(p_weather, 1), "reason": f"Rainfall: {rain}mm/h, Visibility: {vis}m"},
            {"name": "Intersection Risk Penalty", "points_deducted": round(p_intersection, 1), "reason": "Complex 4-way multi-lane intersection junction" if is_intersection else "Standard linear roadway"},
            {"name": "Historical Corridor Penalty", "points_deducted": round(p_historical, 1), "reason": "Multi-year recurring accident cluster segment"}
        ]

        return {
            "safety_score": final_score,
            "rating": rating,
            "badge_style": badge,
            "base_score": base_score,
            "total_penalties": round(total_penalties, 1),
            "penalties_breakdown": penalties_breakdown,
            "formula": "100 - (Accident Penalty + Congestion Penalty + Weather Penalty + Intersection Penalty + Historical Penalty)"
        }

safety_index_calculator = RoadSafetyIndexCalculator()
