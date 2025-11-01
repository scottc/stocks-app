import { useCachedFetch } from "./useCachedFetch";
import client from "@/client";
import { DEFAULT_TTL } from "./cache";

interface UseYahooStockOptions {
  symbol: string;
  enabled?: boolean;
  ttl?: number;
}

export const useAlphaVantageNewsSentiment = ({
  symbol,
  enabled = true,
  ttl = DEFAULT_TTL,
}: UseYahooStockOptions) =>
  useCachedFetch(
    // cache key
    `client.api.alphavantage.NEWS_SENTIMENT({ symbol: : ${symbol} })`,
    // cache task
    () =>
      client.api.alphavantage
        .NEWS_SENTIMENT({ tickers: symbol })
        .get()
        .then((res) => {
          if (!res.data) throw new Error("No data");
          return res.data;
        }),
    // options
    { enabled, ttl },
  );
