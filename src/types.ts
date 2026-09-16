export interface CurrentWeather {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  time: string;
}


export interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

export interface WeatherData {
  current_weather: CurrentWeather;
  daily: DailyWeather;
}

export interface Post {
  id: number;
  title: string;
  body: string;
}

export interface NewsData {
  posts: Post[];
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
}