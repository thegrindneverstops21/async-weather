import https from "https";
import { on } from "process";
import { NewsData, WeatherData } from "./types";
import { formatError, promptUser, getWeatherDescription } from "./utils";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.9045&longitude=29.4689&current_weather=true";
const NEWS_URL = "https://dummyjson.com/posts?limit=5";

function fetchJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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
                } catch (error) {
                    reject(error);
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

async function runSequentially(): Promise<void> {
    console.log("Fetching weather and news data...");
    try {
        const weather = await fetchWeather();
        printWeather(weather);
        const news = await fetchNews();
        printNews(news);
    }catch (error) {
        console.error(formatError("Error fetching data", error));
    }
}

async function runParallel(): Promise<void> {
    console.log("Fetching weather and news data in parallel...");
    try{
        const [weather, news] = await Promise.all([fetchWeather(), fetchNews()]);
        printWeather(weather);
        printNews(news);
    }catch (error) {
        console.error(formatError("Error fetching data", error));
    }
}

async function runRace(): Promise<void> {
    console.log("Fetching weather and news data with Promise.race...");
    try {
        const fastest = await Promise.race([fetchWeather(), fetchNews()]);
        console.log("Fastest response received:", JSON.stringify(fastest).slice(0, 80) + "...");
    } catch (error) {
        console.error(formatError("Error fetching data", error));
    }
}

async function main(): Promise<void> {
    await runSequentially();
    await runParallel();
    await runRace();
}

main()