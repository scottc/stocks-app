import { file, write } from "bun";
import { join } from "path";
import { mkdirSync } from "fs";
import { readdir } from "fs/promises";
import { error, value, type Result } from "@/lib/lib";

export interface YahooStockData {
  chart: YahooChart;
}

export interface YahooChart {
  result: YahooChartResultItem[];
  error: null;
}

export interface YahooChartResultItem {
  meta: YahooMeta;
  timestamp: number[];
  indicators: YahooChartIndicators;
}

export interface YahooMeta {
  currency: unknown;
  symbol: string;
  exchangeName: string;
  fullExchangeName: string;
  instrumentType: string;
  firstTradeDate: unknown;
  regularMarketTime: unknown;
  hasPrePostMarketData: unknown;
  gmtoffset: unknown;
  timezone: string;
  exchangeTimezoneName: string;
  regularMarketPrice: unknown;
  fiftyTwoWeekHigh: unknown;
  fiftyTwoWeekLow: unknown;
  regularMarketDayHigh: unknown;
  regularMarketDayLow: unknown;
  regularMarketVolume: unknown;
  longName: string;
  shortName: string;
  chartPreviousClose: unknown;
  priceHint: unknown;
  currentTradingPeriod: TradingPeriods;
  dataGranularity: unknown;
  range: unknown;
  validRanges: unknown;
}

export interface TradingPeriods {
  pre: TradingHours;
  regular: TradingHours;
  post: TradingHours;
}

export interface TradingHours {
  timezone: string;
  start: number;
  end: number;
  gmtoffset: number;
}

export interface YahooChartIndicators {
  quote: YahooQuote[];
  adjclose: AdjClose[];
}

export interface AdjClose {
  adjclose: (number | null)[];
}

export interface YahooQuote {
  high: (number | null)[];
  volume: (number | null)[];
  /** @deprecated You're probably looking for adjclose, which doesn't subtract dividends. */
  close: (number | null)[];
  low: (number | null)[];
  open: (number | null)[];
}

const CACHE_DIR = join(process.cwd(), "data", "yahoo", "charts");

/** Cache time-to-live (TTL) in 3600 seconds = 1 hour x 23 hours */
const CACHE_TTL = 3600 * 23;

const memoryCache = new Map<
  string,
  { data: YahooStockData; timestamp: number }
>();

const yahooApiFetch = async (
  yahooSymbol: string,
): Promise<Result<YahooStockData>> => {
  try {
    if (yahooSymbol === "unknown") {
      console.log(yahooSymbol);
      // console.log(JSON.stringify(params, null, 2));
      throw new Error("unhandled");
    }

    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp (seconds)

    // 1. Check in-memory cache (exact symbol)
    const memEntry = memoryCache.get(yahooSymbol);
    if (memEntry && now - memEntry.timestamp <= CACHE_TTL) {
      console.log(`[Memory] Serving cached data for ${yahooSymbol}`);
      return value(memEntry.data);
    }

    const cacheSubDir = join(CACHE_DIR, yahooSymbol);

    // Ensure ticker directory exists
    mkdirSync(cacheSubDir, { recursive: true });

    // Check for cached files
    const cacheFiles = await readdir(cacheSubDir);
    const jsonFiles = cacheFiles
      .filter((file) => file.endsWith(".json"))
      .sort()
      .reverse(); // Latest first

    // Look for a recent cache file (within TTL)
    for (const fileName of jsonFiles) {
      const cacheTimestamp = parseInt(fileName.replace(".json", ""), 10);
      if (isNaN(cacheTimestamp)) continue; // Skip invalid filenames
      if (now - cacheTimestamp <= CACHE_TTL) {
        const cacheFilePath = join(cacheSubDir, fileName);
        const cacheFile = file(cacheFilePath);
        if (await cacheFile.exists()) {
          console.log(
            `[Disk] Serving cached data for ${yahooSymbol} from ${cacheFilePath}`,
          );

          const cachedData: YahooStockData = await cacheFile.json();

          // Populate in-memory cache on disk hit
          memoryCache.set(yahooSymbol, {
            data: cachedData,
            timestamp: cacheTimestamp,
          });
          console.log(`[Memory] Cached data for ${yahooSymbol}`);

          return value(cachedData);
        }
      }
    }

    // https://query1.finance.yahoo.com/v8/finance/chart/IOO.AX?events=capitalGain%7Cdiv%7Csplit&formatted=true&includeAdjustedClose=true&interval=1d&period1=1199228400&period2=1761709580&symbol=IOO.AX&userYfid=true&lang=en-US&region=US
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=0&period2=9999999999&interval=1d&includePrePost=false&includeAdjustedClose=true&events=div%7Csplit`;
    console.log(`[Network] Fetching from Yahoo Finance: ${yahooUrl}`);
    const response = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Bun/1.1.35",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return error(new Error("not ok error")); // new Response(`Yahoo Finance API error: ${response.statusText}`, { status: response.status });
    }

    const data = await response.json();

    // Save to cache
    const timestamp = Math.floor(Date.now() / 1000);
    const cacheFilePath = join(cacheSubDir, `${timestamp}.json`);
    await write(file(cacheFilePath), JSON.stringify(data));
    console.log(`[Disk] Cached yahoo data to ${cacheFilePath}`);

    // Save to in-memory cache
    memoryCache.set(yahooSymbol, { data, timestamp });
    console.log(`[Memory] Cached yahoo data for ${yahooSymbol}`);

    return value(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return error(err instanceof Error ? err : new Error(String(err)));
  }
};

export { yahooApiFetch };
