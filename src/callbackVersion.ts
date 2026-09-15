const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.9045&longitude=29.4689&current_weather=true";
const NEWS_URL = "https://dummyjson.com/posts?limit=5";

type JsonCallback<T> = (error: Error | null, data?: T) => void;

function fetchJson<T>(url: string, )