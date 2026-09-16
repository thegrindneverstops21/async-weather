import http from "http";
import { on } from "process";
import { NewsData, WeatherData } from "./types";
import { formatError } from "./utils";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.9045&longitude=29.4689&current_weather=true";
const NEWS_URL = "https://dummyjson.com/posts?limit=5";

function fetchJson<T>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        http.get(url, (res) => {
            if(res.statusCode && res.statusCode >= 400) {
                reject(new Error(`Request failed with status code ${res.statusCode}`));
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
                    resolve(JSON.parse(raw) as T);
                } catch(err) {
                    reject(err);
                }
            });
        })
        .on("error", reject);
    });
}

function fetchWeather(): Promise<WeatherData> {
    return fetchJson<WeatherData>(WEATHER_URL);
}

function fetchNews(): Promise<NewsData> {
    return fetchJson<NewsData>(NEWS_URL);
}

function printWeather(weather: WeatherData): void {
    console.log(`Current Temperature: ${weather.current_weather.temperature}℃`);
    console.log(`Wind Speed: ${weather.current_weather.windSpeed} km/h\n`);
}

function printNews(news: NewsData): void {
    console.log("Latest headlines:");
    news.posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
    });
}

console.log("Fetching weather and news data...");

fetchWeather()
    .then((weather) => {
        printWeather(weather);
        return fetchNews();
    })
    .then((news) => {
        printNews(news);
    })
    .catch((error) => 
        console.error(formatError("Chained Promise", error)))
        .then(runParallelDemo);
    
    function runParallelDemo(): void {
    console.log("\nFetching weather and news data simultaneously...");

    Promise.all([fetchWeather(), fetchNews()])
        .then(([weather, news]) => {
            printWeather(weather);
            printNews(news);
            runRaceDemo();
        })
        .catch((error) => 
            console.error(formatError("Parallel Promise", error)));
    }

    function runRaceDemo(): void {
        console.log("\nFetching weather and news data with Promise.race...");

        Promise.race([fetchWeather(), fetchNews()])
            .then((fastest) => {
                console.log("Fastest response received:", JSON.stringify(fastest).slice(0, 80) + "...");
            })
            .catch((error) => {
                console.error(formatError("Race Promise", error));
            });
    }