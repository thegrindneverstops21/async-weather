export interface CurrentWeather {
  temparature: number;
  windSpeed: number;
  weatherCode: number;
  time: string;
}

export interface WeatherData {
  current_weather: CurrentWeather;
}

export interface Post {
  id: number;
  title: string;
  body: string;
}

export interface NewsData {
  posts: Post[];
}
