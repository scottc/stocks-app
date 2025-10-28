import { file, write } from 'bun';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { readdir } from 'fs/promises';
import { error, value, type Result, type YahooStockData } from './lib';



const CACHE_DIR = join(process.cwd(), 'data', 'cache');

/** Cache time-to-live (TTL) in 3600 seconds = 1 hour x 23 hours */
const CACHE_TTL = 3600 * 23;


const yahooApiFetch = async (symbol: string): Promise<Result<YahooStockData>> => {
      try {

        if(symbol === "unknown") {
          console.log(symbol);
          // console.log(JSON.stringify(params, null, 2));
          throw new Error("unknown ticker");
        }

        const cacheSubDir = join(CACHE_DIR, symbol);

        // Ensure ticker directory exists
        mkdirSync(cacheSubDir, { recursive: true });

        // Check for cached files
        const cacheFiles = await readdir(cacheSubDir);
        const jsonFiles = cacheFiles
          .filter(file => file.endsWith('.json'))
          .sort()
          .reverse(); // Latest first
        const now = Math.floor(Date.now() / 1000); // Current Unix timestamp (seconds)

        // Look for a recent cache file (within TTL)
        for (const fileName of jsonFiles) {
          const cacheTimestamp = parseInt(fileName.replace('.json', ''), 10);
          if (isNaN(cacheTimestamp)) continue; // Skip invalid filenames
          if (now - cacheTimestamp <= CACHE_TTL) {
            const cacheFilePath = join(cacheSubDir, fileName);
            const cacheFile = file(cacheFilePath);
            if (await cacheFile.exists()) {
              console.log(`Serving cached data for ${symbol} from ${cacheFilePath}`);

              const cachedData: YahooStockData = await cacheFile.json();

              return value(cachedData);
            }
          }
        }

        // No valid cache; fetch from Yahoo Finance
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.AX?period1=0&period2=9999999999&interval=1d&includePrePost=false&events=div%7Csplit`;
        console.log(`Fetching from Yahoo Finance: ${yahooUrl}`);
        const response = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Bun/1.1.35',
            'Accept': 'application/json',
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
        console.log(`Cached data to ${cacheFilePath}`);

        return data;
      } catch (err) {
        console.error('Proxy error:', err);

        return error(new Error("error error"));
      }
    };

export {
    yahooApiFetch
}