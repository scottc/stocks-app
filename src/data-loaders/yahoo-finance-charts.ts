import { file, write } from "bun";
import { join } from "path";
import { mkdirSync } from "fs";
import { readdir } from "fs/promises";
import { error, value, type Result } from "@/lib";

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
    currency: any;
    symbol: string;
    exchangeName: any;
    fullExchangeName: any;
    instrumentType: any;
    firstTradeDate: any;
    regularMarketTime: any;
    hasPrePostMarketData: any;
    gmtoffset: any;
    timezone: any;
    exchangeTimezoneName: any;
    regularMarketPrice: any;
    fiftyTwoWeekHigh: any;
    fiftyTwoWeekLow: any;
    regularMarketDayHigh: any;
    regularMarketDayLow: any;
    regularMarketVolume: any;
    longName: string;
    shortName: string;
    chartPreviousClose: any;
    priceHint: any;
    currentTradingPeriod: TradingPeriods;
    dataGranularity: any;
    range: any;
    validRanges: any; 
}

export interface TradingPeriods {
  pre: TradingHours;
  regular: TradingHours;
  post: TradingHours;
}

export interface TradingHours { timezone: string, start: number, end:number, gmtoffset: number }

export interface YahooChartIndicators {
    quote: YahooQuote[];
    adjclose: number[];
}

export interface YahooQuote {
    high: number[];
    volume: number[];
    close: number[];
    low: number[];
    open: number[];
}

const CACHE_DIR = join(process.cwd(), "data", "cache");

/** Cache time-to-live (TTL) in 3600 seconds = 1 hour x 23 hours */
const CACHE_TTL = 3600 * 23;

const memoryCache = new Map<
  string,
  { data: YahooStockData; timestamp: number }
>();

const yahooApiFetch = async (
  symbol: string,
): Promise<Result<YahooStockData>> => {
  try {
    if (symbol === "unknown") {
      console.log(symbol);
      // console.log(JSON.stringify(params, null, 2));
      throw new Error("unknown ticker");
    }

    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp (seconds)

    // 1. Check in-memory cache (exact symbol)
    const memEntry = memoryCache.get(symbol);
    if (memEntry && now - memEntry.timestamp <= CACHE_TTL) {
      console.log(`[Memory] Serving cached data for ${symbol}`);
      return value(memEntry.data);
    }

    const cacheSubDir = join(CACHE_DIR, symbol);

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
            `[Disk] Serving cached data for ${symbol} from ${cacheFilePath}`,
          );

          const cachedData: YahooStockData = await cacheFile.json();

          // Populate in-memory cache on disk hit
          memoryCache.set(symbol, {
            data: cachedData,
            timestamp: cacheTimestamp,
          });
          console.log(`[Memory] Cached data for ${symbol}`);

          return value(cachedData);
        }
      }
    }

    // No valid cache; fetch from Yahoo Finance
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.AX?period1=0&period2=9999999999&interval=1d&includePrePost=false&events=div%7Csplit`;
    console.log(`Fetching from Yahoo Finance: ${yahooUrl}`);
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
    console.log(`[Disk] Cached data to ${cacheFilePath}`);

    // Save to in-memory cache
    memoryCache.set(symbol, { data, timestamp });
    console.log(`[Memory] Cached data for ${symbol}`);

    return value(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return error(err instanceof Error ? err : new Error(String(err)));
  }
};

export { yahooApiFetch };
