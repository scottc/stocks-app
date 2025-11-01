import { useCachedFetch } from "./useCachedFetch";
import client from "@/client";
import { DEFAULT_TTL } from "./cache";

interface UseAlphaVantageListingStatusOptions {
  enabled?: boolean;
  ttl?: number;
}

const DEFAULT_OPTS: UseAlphaVantageListingStatusOptions = {
  enabled: true,
  ttl: DEFAULT_TTL,
};

export const useAlphaVantageListingStatus = (
  opts: UseAlphaVantageListingStatusOptions = {},
) =>
  useCachedFetch(
    // cache key
    `client.api.alphavantage.LISTING_STATUS()`,
    // cache task
    () =>
      client.api.alphavantage.LISTING_STATUS.get().then((res) => {
        if (!res.data) throw new Error("No data");
        return res.data;
      }),
    // options
    { ...DEFAULT_OPTS, ...opts },
  );
