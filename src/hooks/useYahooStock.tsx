import { useCachedFetch } from "./useCachedFetch";
import client from "@/client";
import { DEFAULT_TTL } from "./cache";

interface UseYahooStockOptions {
  symbol: string;
  enabled?: boolean;
  ttl?: number;
}

export const useYahooStock = ({
  symbol,
  enabled = true,
  ttl = DEFAULT_TTL,
}: UseYahooStockOptions) => 
  useCachedFetch(
    // cache key
    `client.api.yahoo({ symbol: : ${symbol} })`,
    // cache task
    () =>
      client.api.yahoo({ symbol }).get().then((res) => {
        if (!res.data) throw new Error("No data");
        return res.data;
      }),
    // options
    { enabled, ttl }
  );
