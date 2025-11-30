import { GoogleGenAI } from "@google/genai";
import { ComparisonResult, WeatherData, GroundingChunk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const fetchWeatherComparison = async (location: string): Promise<ComparisonResult> => {
  try {
    const prompt = `
      Act as a precise Japanese weather data aggregator.
      
      Input Location: "${location}"

      CRITICAL STEP 1 (Location Identification):
      - If the input "${location}" is a coordinate pair (e.g., "35.689, 139.691"), you MUST first identify the specific Japanese address at the City or Ward level (市区町村). 
      - Example: "35.689, 139.691" -> "東京都新宿区"
      - If it is already a place name, use it as is.
      - The "Detected Location" in your output MUST be this specific Japanese City/Ward name, NOT the coordinates.

      Task:
      Search for the weather forecast for this detected location for TODAY (current date).
      
      You MUST retrieve data from these exact 8 sources:
      1. tenki.jp
      2. JMA (Japan Meteorological Agency / 気象庁)
      3. Weathernews (ウェザーニューズ)
      4. NHK Weather (NHK 防災)
      5. Yahoo! Weather (Yahoo!天気)
      6. Weather Map (ウェザーマップ)
      7. goo Weather (goo天気)
      8. AccuWeather

      For EACH source, extract the following data for today:
      - Condition: In Japanese (e.g., 晴れ, 曇り, 雨, 雪). Keep it short.
      - High Temp: Number only (Celsius). Use "-" if unavailable.
      - Low Temp: Number only (Celsius). Use "-" if unavailable.
      - Rain Probability: Maximum probability for the rest of the day (Number only). Use "-" if unavailable.

      Output Format (Strictly follow this structure, no markdown tables):

      Detected Location: [Specific City/Ward Name in Japanese (e.g. 新宿区, 横浜市)]

      ---SOURCE: tenki.jp---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SOURCE: JMA---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SOURCE: Weathernews---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SOURCE: NHK---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SOURCE: Yahoo---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SOURCE: Weather Map---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SOURCE: goo Weather---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SOURCE: AccuWeather---
      Condition: [Value]
      High: [Value]
      Low: [Value]
      Rain: [Value]

      ---SUMMARY---
      [Write a concise summary in Japanese (approx 150-200 chars). Compare the forecasts specifically noting any major disagreements among the 8 sources.]
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    return parseGeminiResponse(text, location, groundingChunks);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

const parseGeminiResponse = (text: string, originalInputLocation: string, groundingChunks: GroundingChunk[]): ComparisonResult => {
  const providers: WeatherData[] = [];
  const lines = text.split('\n');
  
  let currentProvider: Partial<WeatherData> | null = null;
  let summary = "";
  let isSummary = false;
  let detectedLocation = originalInputLocation;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Parse Detected Location
    if (trimmed.startsWith('Detected Location:')) {
      const loc = trimmed.replace('Detected Location:', '').trim();
      if (loc && loc !== 'undefined' && loc.length > 0) {
        detectedLocation = loc;
      }
      continue;
    }

    if (trimmed.startsWith('---SUMMARY---')) {
      isSummary = true;
      if (currentProvider) providers.push(finalizeProvider(currentProvider));
      currentProvider = null;
      continue;
    }

    if (isSummary) {
      summary += line + "\n";
      continue;
    }

    if (trimmed.startsWith('---SOURCE:')) {
      if (currentProvider) {
        providers.push(finalizeProvider(currentProvider));
      }
      const sourceName = trimmed.replace('---SOURCE:', '').replace('---', '').trim();
      currentProvider = { sourceName };
    } else if (currentProvider) {
      const lower = trimmed.toLowerCase();
      if (lower.startsWith('condition:')) {
        currentProvider.condition = trimmed.split(':')[1].trim();
        currentProvider.icon = mapConditionToIcon(currentProvider.condition);
      } else if (lower.startsWith('high:')) {
        currentProvider.highTemp = cleanTemp(trimmed.split(':')[1].trim());
      } else if (lower.startsWith('low:')) {
        currentProvider.lowTemp = cleanTemp(trimmed.split(':')[1].trim());
      } else if (lower.startsWith('rain:')) {
        currentProvider.rainProb = cleanRain(trimmed.split(':')[1].trim());
      }
    }
  }

  if (currentProvider) {
    providers.push(finalizeProvider(currentProvider));
  }

  // Attach URLs from grounding
  providers.forEach(p => {
    const match = groundingChunks.find(g => {
      const title = g.web?.title?.toLowerCase() || "";
      const uri = g.web?.uri?.toLowerCase() || "";
      const source = p.sourceName.toLowerCase();
      
      if (source.includes('tenki') && uri.includes('tenki.jp')) return true;
      if (source.includes('yahoo') && uri.includes('yahoo')) return true;
      if ((source.includes('weather') || source.includes('ウェザー')) && uri.includes('weathernews')) return true;
      if ((source.includes('jma') || source.includes('気象庁')) && (uri.includes('jma.go.jp') || title.includes('気象庁'))) return true;
      if (source.includes('nhk') && (uri.includes('nhk.or.jp') || title.includes('nhk'))) return true;
      if (source.includes('map') && (uri.includes('weathermap') || title.includes('ウェザーマップ'))) return true;
      if (source.includes('goo') && uri.includes('goo')) return true;
      if (source.includes('accu') && uri.includes('accuweather')) return true;
      
      return false;
    });

    if (match && match.web) {
      p.url = match.web.uri;
    }
  });

  return {
    location: detectedLocation, // Use the detected name instead of input
    date: new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' }),
    summary: summary.trim(),
    providers,
    groundingSources: groundingChunks
  };
};

const cleanTemp = (val: string): string => {
  if (!val || val === '-' || val.toLowerCase() === 'n/a' || val.toLowerCase() === 'null') return '-';
  const num = val.replace(/[^0-9.-]/g, '');
  return num ? `${num}°` : '-';
};

const cleanRain = (val: string): string => {
  if (!val || val === '-' || val.toLowerCase() === 'n/a' || val.toLowerCase() === 'null') return '-';
  const num = val.replace(/[^0-9]/g, '');
  return num ? `${num}%` : '-';
};

const finalizeProvider = (p: Partial<WeatherData>): WeatherData => {
  return {
    sourceName: p.sourceName || "Unknown",
    condition: p.condition || "---",
    highTemp: p.highTemp || "-",
    lowTemp: p.lowTemp || "-",
    rainProb: p.rainProb || "-",
    url: p.url,
    icon: p.icon || 'unknown'
  };
};

const mapConditionToIcon = (condition: string): WeatherData['icon'] => {
  if (!condition) return 'unknown';
  const c = condition.toLowerCase();
  
  // Japanese and English mapping
  if (c.includes('snow') || c.includes('雪')) return 'snow';
  if (c.includes('thunder') || c.includes('lightning') || c.includes('雷')) return 'thunder';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower') || c.includes('雨')) return 'rain';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('曇')) return 'cloudy';
  if (c.includes('sun') || c.includes('clear') || c.includes('fair') || c.includes('晴')) return 'sunny';
  
  return 'unknown';
};