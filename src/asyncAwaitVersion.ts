import https from "https";
import { WeatherData, NewsData, GeocodeResponse, GeocodeResult } from "./types";
import { formatError, promptUser, getWeatherDescription} from "./utils";

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

async function fetchGeocode(place: string): Promise<GeocodeResult> {
  const data = await fetchJson<GeocodeResponse>(geocodeUrl(place));
  const match = data.results?.[0];
  if (!match) throw new Error(`No location found for "${place}"`);
  return match;
}

function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  return fetchJson<WeatherData>(weatherUrl(lat, lon));
}

function fetchNews(): Promise<NewsData> {
  return fetchJson<NewsData>(NEWS_URL);
}

function printWeather(place: string, weather: WeatherData): void {
  const { current_weather, daily } = weather;
  const condition = getWeatherDescription(current_weather.weatherCode);
  const high = daily.temperature_2m_max[0];
  const low = daily.temperature_2m_min[0];

  console.log(`\nWeather in ${place}:`);
  console.log(`Conditions: ${condition}`);
  console.log(`Current temperature: ${current_weather.temperature}°C`);
  console.log(`High: ${high}°C  |  Low: ${low}°C`);
  console.log(`Wind speed: ${current_weather.windSpeed} km/h\n`);
}

function printNews(news: NewsData): void {
  console.log("Latest headlines:");
  news.posts.forEach((post, i) => console.log(`${i + 1}. ${post.title}`));
}

async function runSequential(place: string): Promise<GeocodeResult | undefined> {
  console.log("=== Async/Await Version: sequential fetch ===\n");
  try {
    const location = await fetchGeocode(place);
    const weather = await fetchWeather(location.latitude, location.longitude);
    printWeather(`${location.name}, ${location.country}`, weather);

    const news = await fetchNews();
    printNews(news);

    return location;
  } catch (err) {
    console.error(formatError("Sequential async/await", err));
    return undefined;
  }
}

async function runParallel(location: GeocodeResult): Promise<void> {
  console.log("\n=== Async/Await + Promise.all(): parallel fetch ===\n");
  try {
    const [weather, news] = await Promise.all([
      fetchWeather(location.latitude, location.longitude),
      fetchNews(),
    ]);
    printWeather(`${location.name}, ${location.country}`, weather);
    printNews(news);
  } catch (err) {
    console.error(formatError("Promise.all (async/await)", err));
  }
}

async function runRace(location: GeocodeResult): Promise<void> {
  console.log("\n=== Async/Await + Promise.race(): fastest response ===\n");
  try {
    const fastest = await Promise.race([
      fetchWeather(location.latitude, location.longitude),
      fetchNews(),
    ]);
    console.log(
      "Fastest response received:",
      JSON.stringify(fastest).slice(0, 80) + "..."
    );
  } catch (err) {
    console.error(formatError("Promise.race (async/await)", err));
  }
}

async function main(): Promise<void> {
  const place = await promptUser("Enter a place to check weather for: ");

  const location = await runSequential(place);
  if (!location) return;

  await runParallel(location);
  await runRace(location);
}

main();