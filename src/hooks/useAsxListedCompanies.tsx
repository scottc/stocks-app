import { useCachedFetch } from "./useCachedFetch";
import client from "@/client";
import { DEFAULT_TTL } from "./cache";

interface UseAsxListedCompaniesOptions {
  enabled?: boolean;
  ttl?: number;
}

const DEFAULT_OPTS: UseAsxListedCompaniesOptions = {
  enabled: true,
  ttl: DEFAULT_TTL,
};

export const useAsxListedCompanies = (
  opts: UseAsxListedCompaniesOptions = {},
) =>
  useCachedFetch(
    // cache key
    `client.api.asx.listedcompanies()`,
    // cache task
    () =>
      client.api.asx.listedcompanies.get().then((res) => {
        if (!res.data) throw new Error("No data");
        return res.data;
      }),
    // options
    { ...DEFAULT_OPTS, ...opts },
  );
