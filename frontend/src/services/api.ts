const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
const DEFAULT_TIMEOUT_MS = 7000;

function getAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = localStorage.getItem("auth_token");
  const merged = new Headers(headers);
  if (token) {
    merged.set("Authorization", `Bearer ${token}`);
  }
  return merged;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError" && !options.signal?.aborted) {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  }
}

export interface PlaceSuggestion {
  place_id: string;
  name: string;
  address: string;
  lat?: number;
  lon?: number;
  source: "google" | "city_corridor";
}

export interface AutocompleteResult {
  query: string;
  city: string;
  suggestions: PlaceSuggestion[];
  source: string;
  warning?: string | null;
  error?: string | null;
}

export async function fetchPlaceAutocomplete(
  query: string,
  city?: string,
  signal?: AbortSignal
): Promise<AutocompleteResult> {
  const cleanQ = query.trim();
  if (!cleanQ) {
    return { query: "", city: city || "San Francisco", suggestions: [], source: "EMPTY" };
  }

  try {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : "";
    const url = `${API_BASE_URL}/places/autocomplete?query=${encodeURIComponent(cleanQ)}${cityParam}`;
    const res = await fetchWithTimeout(url, { headers: getAuthHeaders(), signal }, 4500);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        query: cleanQ,
        city: city || "San Francisco",
        suggestions: [],
        source: "ERROR",
        error: errData.detail || `Server returned HTTP ${res.status}`,
      };
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("cancelled")) {
      throw err;
    }
    console.error("Error fetching place autocomplete:", err);
    return {
      query: cleanQ,
      city: city || "San Francisco",
      suggestions: [],
      source: "OFFLINE",
      error: "Unable to connect to backend search service. Please check that backend server is running.",
    };
  }
}

export async function fetchPlaceDetails(placeId: string, signal?: AbortSignal) {
  try {
    const url = `${API_BASE_URL}/places/details?place_id=${encodeURIComponent(placeId)}`;
    const res = await fetchWithTimeout(url, { headers: getAuthHeaders(), signal }, 4500);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || `Failed to fetch place details (HTTP ${res.status})` };
    }
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") throw err;
    return { error: err.message || "Failed to fetch place details from backend." };
  }
}

export async function fetchLiveTraffic(city?: string) {
  try {
    const url = city ? `${API_BASE_URL}/traffic/live?city=${encodeURIComponent(city)}` : `${API_BASE_URL}/traffic/live`;
    const res = await fetchWithTimeout(url, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching live traffic:", err);
    return null;
  }
}

export async function fetchPredictions(segmentId?: number) {
  try {
    const url = segmentId ? `${API_BASE_URL}/traffic/predictions?segment_id=${segmentId}` : `${API_BASE_URL}/traffic/predictions`;
    const res = await fetchWithTimeout(url, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching predictions:", err);
    return null;
  }
}

export async function fetchAccidents() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/accidents`, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching accidents:", err);
    return [];
  }
}

export async function fetchHotspots(city?: string) {
  try {
    const url = city ? `${API_BASE_URL}/accidents/hotspots?city=${encodeURIComponent(city)}` : `${API_BASE_URL}/accidents/hotspots`;
    const res = await fetchWithTimeout(url, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching hotspots:", err);
    return null;
  }
}

export async function createHotspot(hotspot: {
  name: string;
  center_lat: number;
  center_lon: number;
  radius_meters?: number;
  risk_score?: number;
  primary_road_name?: string;
  peak_risk_hours?: string;
}) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/hotspots`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(hotspot),
      },
      8000
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || `Failed to create hotspot (HTTP ${res.status})` };
    }
    return await res.json();
  } catch (err: any) {
    return { error: err.message || "Network error while saving hotspot." };
  }
}

export async function planRoute(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  mode: string,
  city?: string,
  originName?: string,
  destinationName?: string,
  signal?: AbortSignal
) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/routes/plan`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          origin,
          destination,
          mode,
          city: city || "San Francisco",
          origin_name: originName || "Departure Location",
          destination_name: destinationName || "Destination Location",
        }),
        signal,
      },
      8000
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        error: errJson.detail || `Route planning failed with status ${res.status}`,
        status: res.status,
      };
    }
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("cancelled")) {
      throw err;
    }
    console.error("Error planning route:", err);
    return {
      error: err.message || "Failed to reach backend server. Please verify backend is running on port 8000.",
      isOffline: true,
    };
  }
}

export async function fetchIncidents() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/incidents`, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching incidents:", err);
    return [];
  }
}

export async function submitIncident(incident: { category: string; description: string; lat: number; lon: number; road_name: string }) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/incidents`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(incident),
      },
      6000
    );
    return await res.json();
  } catch (err) {
    console.error("Error submitting incident:", err);
    return null;
  }
}

export async function fetchWeather(city?: string) {
  try {
    const url = city ? `${API_BASE_URL}/weather?city=${encodeURIComponent(city)}` : `${API_BASE_URL}/weather`;
    const res = await fetchWithTimeout(url, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching weather:", err);
    return null;
  }
}

export async function fetchAnalyticsSummary() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/summary`, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching analytics summary:", err);
    return null;
  }
}

export async function queryAIAssistant(prompt: string) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/ai/query`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ prompt }),
      },
      8000
    );
    if (!res.ok) return { response: "AI service temporarily unavailable." };
    return await res.json();
  } catch (err) {
    console.error("Error querying AI assistant:", err);
    return { response: "Offline fallback: Unable to contact AI service. Ensure backend is running." };
  }
}

export async function runSimulation(params: any) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/simulation/run`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(params),
      },
      8000
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error running simulation:", err);
    return null;
  }
}

export async function fetchModels() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/models`, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching models:", err);
    return [];
  }
}

export async function fetchAlerts() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/alerts`, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching alerts:", err);
    return [];
  }
}

export async function fetchDatasetStatus() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/dataset/status`, { headers: getAuthHeaders() }, 6000);
    if (!res.ok) return { source: "PRELOADED", label: "Pre-loaded Smart City Data", custom_count: 0 };
    return await res.json();
  } catch (err) {
    console.error("Error fetching dataset status:", err);
    return { source: "PRELOADED", label: "Pre-loaded Smart City Data", custom_count: 0 };
  }
}

export async function uploadCustomDataset(segments: any[]) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/dataset/upload`,
      {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ segments }),
      },
      10000
    );
    return await res.json();
  } catch (err) {
    console.error("Error uploading custom dataset:", err);
    return { status: "error", message: "Failed to connect to backend server." };
  }
}

export async function resetDataset() {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/dataset/reset`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
      8000
    );
    return await res.json();
  } catch (err) {
    console.error("Error resetting dataset:", err);
    return null;
  }
}

