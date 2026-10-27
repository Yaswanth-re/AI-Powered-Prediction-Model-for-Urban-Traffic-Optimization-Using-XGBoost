class ScenarioSimulationEngine:
    """What-If Scenario Simulator for Urban Traffic Planning"""

    def run_simulation(self, scenario_params: dict) -> dict:
        traffic_volume_change_pct = scenario_params.get("traffic_volume_change_pct", 20.0)
        rainfall_mm = scenario_params.get("rainfall_mm", 0.0)
        road_closure_id = scenario_params.get("road_closure_id", None)
        event_surge = scenario_params.get("event_surge_flag", False)

        base_avg_congestion = 38.0
        base_avg_time_min = 22.0
        base_safety_score = 76.0
        base_risk_level = "LOW"

        # Calculate impact metrics
        cong_delta = (traffic_volume_change_pct * 0.4) + (rainfall_mm * 1.5) + (25.0 if road_closure_id else 0.0) + (18.0 if event_surge else 0.0)
        sim_congestion = min(98.0, max(10.0, base_avg_congestion + cong_delta))
        
        time_delta = (cong_delta / 100.0) * 16.0
        sim_travel_time = round(base_avg_time_min + time_delta, 1)

        safety_penalty = (cong_delta * 0.5) + (rainfall_mm * 2.0)
        sim_safety = max(12.0, min(95.0, base_safety_score - safety_penalty))

        if sim_safety < 35.0:
            sim_risk = "CRITICAL"
        elif sim_safety < 55.0:
            sim_risk = "HIGH"
        elif sim_safety < 75.0:
            sim_risk = "MEDIUM"
        else:
            sim_risk = "LOW"

        impact_summary = []
        if road_closure_id:
            impact_summary.append(f"Road closure diverts ~1,800 VPH to adjacent secondary arteries, increasing nearby congestion by +27%.")
        if rainfall_mm > 5.0:
            impact_summary.append(f"Wet asphalt reduces average corridor speed by {round(rainfall_mm * 1.2, 1)} km/h.")
        if event_surge:
            impact_summary.append(f"Stadium event generates +40% localized vehicle density around central district.")

        return {
            "scenario_name": scenario_params.get("scenario_name", "Custom What-If Scenario"),
            "baseline": {
                "avg_congestion_pct": base_avg_congestion,
                "avg_travel_time_min": base_avg_time_min,
                "city_safety_score": base_safety_score,
                "risk_level": base_risk_level
            },
            "simulated": {
                "avg_congestion_pct": round(sim_congestion, 1),
                "avg_travel_time_min": sim_travel_time,
                "city_safety_score": round(sim_safety, 1),
                "risk_level": sim_risk,
                "congestion_change_pct": round(cong_delta, 1),
                "travel_time_change_min": round(time_delta, 1),
                "safety_score_change": round(-safety_penalty, 1)
            },
            "impact_analysis": impact_summary
        }

scenario_simulation_engine = ScenarioSimulationEngine()
