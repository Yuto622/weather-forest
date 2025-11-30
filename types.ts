export interface WeatherData {
  sourceName: string;
  condition: string;
  highTemp: string;
  lowTemp: string;
  rainProb: string;
  url?: string;
  icon?: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'unknown';
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ComparisonResult {
  location: string;
  date: string;
  summary: string;
  providers: WeatherData[];
  groundingSources: GroundingChunk[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}