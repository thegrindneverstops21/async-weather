import https from "https";
import { WeatherData, NewsData, GeocodeResponse, GeocodeResult } from "./types";
import { formatError, promptUser, getWeatherDescription } from "./utils";

const NEWS_URL = "https://dummyjson.com/posts?limit=5";

function geocodeUrl(place: string): string {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    place
  )}&count=1`;
}

function weatherUrl(lat: number, lon: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Request failed with status ${res.statusCode}`));
          res.resume();
          return;
        }

        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw) as T);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

function fetchGeocode(place: string): Promise<GeocodeResult> {
  return fetchJson<GeocodeResponse>(geocodeUrl(place)).then((data) => {
    const match = data.results?.[0];
    if (!match) throw new Error(`No location found for "${place}"`);
    return match;
  });
}

function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  return fetchJson<WeatherData>(weatherUrl(lat, lon));
}

function fetchNews(): Promise<NewsData> {
  return fetchJson<NewsData>(NEWS_URL);
}

function printWeather(place: string, weather: WeatherData): void {
  console.log(`\nWeather in ${place}:`);
  console.log(`Current temperature: ${weather.current_weather.temperature}°C`);
  console.log(`Wind speed: ${weather.current_weather.windSpeed} km/h\n`);
}

function printNews(news: NewsData): void {
  console.log("Latest headlines:");
  news.posts.forEach((post, i) => console.log(`${i + 1}. ${post.title}`));
}

async function main(): Promise<void> {
  console.log("=== Promise Version: chained fetch (geocode -> weather -> news) ===\n");
  const place = await promptUser("Enter a place to check weather for: ");

  let resolvedLocation: GeocodeResult;

  fetchGeocode(place)
    .then((location) => {
      resolvedLocation = location;
      return fetchWeather(location.latitude, location.longitude);
    })
    .then((weather) => {
      printWeather(`${resolvedLocation.name}, ${resolvedLocation.country}`, weather);
      return fetchNews();
    })
    .then((news) => {
      printNews(news);
    })
    .catch((err) => console.error(formatError("Chained Promise", err)))
    .then(() => runParallelDemo(place));
}

function runParallelDemo(place: string): void {
  console.log("\n=== Promise.all(): fetch weather + news simultaneously ===\n");

  fetchGeocode(place)
    .then((location) =>
      Promise.all([fetchWeather(location.latitude, location.longitude), fetchNews()]).then(
        ([weather, news]) => {
          printWeather(`${location.name}, ${location.country}`, weather);
          printNews(news);
          runRaceDemo(location);
        }
      )
    )
    .catch((err) => console.error(formatError("Promise.all", err)));
}

function runRaceDemo(location: GeocodeResult): void {
  console.log("\n=== Promise.race(): whichever resolves first wins ===\n");

  Promise.race([fetchWeather(location.latitude, location.longitude), fetchNews()])
    .then((fastest) => {
      console.log(
        "Fastest response received:",
        JSON.stringify(fastest).slice(0, 80) + "..."
      );
    })
    .catch((err) => console.error(formatError("Promise.race", err)));
}

main();