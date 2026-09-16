import https from "https";
import { WeatherData, NewsData, GeocodeResponse } from "./types";
import { formatError, promptUser, getWeatherDescription } from "./utils";

const NEWS_URL = "https://dummyjson.com/posts?limit=5";

function geocodeUrl(place: string): string {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    place,
  )}&count=1`;
}

function weatherUrl(lat: number, lon: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
}

type JsonCallback<T> = (error: Error | null, data?: T) => void;

function fetchJson<T>(url: string, callback: JsonCallback<T>): void {
  https
    .get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        callback(new Error(`Request failed with status ${res.statusCode}`));
        res.resume();
        return;
      }

      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          callback(null, JSON.parse(raw) as T);
        } catch (err) {
          callback(err as Error);
        }
      });
    })
    .on("error", (err) => callback(err));
}

function fetchGeocode(
  place: string,
  callback: JsonCallback<GeocodeResponse>,
): void {
  fetchJson<GeocodeResponse>(geocodeUrl(place), callback);
}

function fetchWeather(
  lat: number,
  lon: number,
  callback: JsonCallback<WeatherData>,
): void {
  fetchJson<WeatherData>(weatherUrl(lat, lon), callback);
}

function fetchNews(callback: JsonCallback<NewsData>): void {
  fetchJson<NewsData>(NEWS_URL, callback);
}

// Nested on purpose: geocode -> weather -> news, each depending on the last.
// This is "callback hell" in action, made worse by the extra geocoding step.
function fetchDashboardData(
  place: string,
  callback: JsonCallback<{
    weather: WeatherData;
    news: NewsData;
    place: string;
  }>,
): void {
  fetchGeocode(place, (geoErr, geoData) => {
    if (geoErr) {
      callback(geoErr);
      return;
    }

    const match = geoData?.results?.[0];
    if (!match) {
      callback(new Error(`No location found for "${place}"`));
      return;
    }

    console.log(`Found "${match.name}, ${match.country}". Fetching weather...`);

    fetchWeather(match.latitude, match.longitude, (weatherErr, weather) => {
      if (weatherErr || !weather) {
        callback(weatherErr ?? new Error("No weather data returned"));
        return;
      }

      console.log("Weather fetched. Now fetching news (nested callback)...");

      fetchNews((newsErr, news) => {
        if (newsErr || !news) {
          callback(newsErr ?? new Error("No news data returned"));
          return;
        }

        callback(null, {
          weather,
          news,
          place: `${match.name}, ${match.country}`,
        });
      });
    });
  });
}

async function main(): Promise<void> {
  console.log("=== Callback Version: Async Weather & News Dashboard ===\n");
  const place = await promptUser("Enter a place to check weather for: ");

  fetchDashboardData(place, (err, data) => {
    if (err) {
      console.error(formatError("Callback Dashboard", err));
      return;
    }

    const { weather, news, place: resolvedPlace } = data!;
    const condition = getWeatherDescription(weather.current_weather.weatherCode);
    const high = weather.daily.temperature_2m_max[0];
    const low = weather.daily.temperature_2m_min[0];

    console.log(`\nWeather in ${resolvedPlace}:`);
    console.log(`Conditions: ${condition}`);
    console.log(
      `Current temperature: ${weather.current_weather.temperature}°C`,
    );
    console.log(`High: ${high}°C  |  Low: ${low}°C`);
    console.log(`Wind speed: ${weather.current_weather.windSpeed} km/h\n`);

    console.log("Latest headlines:");
    news.posts.forEach((post, i) => console.log(`${i + 1}. ${post.title}`));
  });
}

main();
