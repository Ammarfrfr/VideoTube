import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

// --------------------
// FETCH (public routes)
// --------------------
export const getVideos = async () => {
  // Use axios instance to ensure Authorization header (Bearer token) is sent when available.
  const res = await api.get('/videos')

  // normalize responses: ApiResponse wrapper or direct data
  return res?.data?.data || res?.data
}

// --------------------
// AXIOS (auth + protected routes)
// --------------------
const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: false, // using Bearer token, not cookies
  headers: {
    "Content-Type": "application/json",
    'ngrok-skip-browser-warning': 'true'
  },
});

// --------------------
// AUTH TOKEN HELPERS
// --------------------
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  delete api.defaults.headers.common["Authorization"];
}

export default api;

// --------------------
// ERROR NORMALIZATION
// --------------------
function extractMessageFromHtml(html) {
  if (!html || typeof html !== "string") return null;

  const match = html.match(/Error:\s*([^<\n]+)/i);
  if (match?.[1]) return match[1].trim();

  const stripped = html
    .replace(/<[^>]*>/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  return stripped ? stripped.slice(0, 200) : null;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response && typeof err.response.data === "string") {
      const extracted = extractMessageFromHtml(err.response.data);
      if (extracted) {
        err.response.data = { message: extracted };
      }
    }
    return Promise.reject(err);
  }
);
