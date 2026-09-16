import https from "https";
import { on } from "process";
import { NewsData, WeatherData } from "./types";
import { formatError } from "./utils";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.9045&longitude=29.4689&current_weather=true";
const NEWS_URL = "https://dummyjson.com/posts?limit=5";

type JsonCallback<T> = (error: Error | null, data?: T) => void;

function fetchJson<T>(url: string, callback: JsonCallback<T>): void {
  https.get(url, (res) => {
    if(res.statusCode && res.statusCode >= 400) {
      callback(new Error(`Request failed with status code ${res.statusCode}`));
      res.resume(); 
      return;
    }

    let raw = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      raw += chunk;
    });
    res.on("end", () => {
      try {
        resolve_(JSON.parse(raw) as T);
      } catch(err) {
        callback(err as Error);
      }
    });

    function resolve_(data: T) {
      callback(null, data);
    }
  })
  .on("error", (err) => callback(err as Error));
}

function fetchWeather(callback: JsonCallback<WeatherData>): void {
  fetchJson<WeatherData>(WEATHER_URL, callback);
}

function fetchNews(callback: JsonCallback<NewsData>): void {
  fetchJson<NewsData>(NEWS_URL, callback);
}

function fetchDashboard(callback: JsonCallback<{ weather: WeatherData; news: NewsData }>): void {
  fetchWeather((weatherError, weather) => {
    if (weatherError || !weather) {
      callback(weatherError ?? new Error("No weather data returned"));
      return
    }

    console.log("Weather fetched. Now fetching news...");
    fetchNews((newsError, news) => {
      if (newsError || !news) {
        callback(newsError ?? new Error("No news data returned"));
        return;
      }
      callback(null, { weather, news });
    });
  });
}

console.log("Fetching dashboard data...");
fetchDashboard((error, data) => {
  if (error) {
    console.error(formatError("Error fetching dashboard data", error));
    return;
  }

  const { weather, news } = data!;
  console.log(`Current Weather: ${weather.current_weather}`);
  console.log(`Wind Speed: ${weather.current_weather.windSpeed} km/h\n`);

  console.log("Latest headlines:");
  news.posts.forEach((post, index) => {
    console.log(`${index + 1}. ${post.title}`);
  });
});