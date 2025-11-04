import { file } from "bun";
import { join } from "path";
import { value } from "@/store/lib";
import { NEWS_SENTIMENT } from "./NEWS_SENTIMENT";
import type { HttpResult } from "@/lib/tryFetch";

export interface ListingStatus {
  symbol: string;
  name: string;
  exchange: string;
  assetType: "Stock" | "ETF";
  ipoDate: string; // ISO date: "2023-08-30"
  delistingDate: string | null;
  status: "Active" | "Delisted";
}

// Rate Limit:
// 25 requests per day, per API key?
//
// https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=demo

const CACHE_DIR = join(process.cwd(), "data", "alphavantage");

const f = file(join(CACHE_DIR, "LISTING_STATUS", "1761989136353.csv"));
const t = await f.text();

const parseFile = (x: string): ListingStatus[] => {
  return x
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split(","))
    .map(
      (cells): ListingStatus => ({
        symbol: cells.at(0) ?? "",
        name: cells.at(1) ?? "",
        exchange: cells.at(2) ?? "",
        assetType: (() => {
          switch (cells.at(3)) {
            case "Stock":
              return "Stock";
            case "ETF":
              return "ETF";
            default:
              throw new Error(`Unexpected parse value, ${cells.at(3)}`);
          }
        })(),
        ipoDate: cells.at(4) ?? "",
        delistingDate: (cells.at(5) === "null" ? null : cells.at(5)) ?? "",
        status: (() => {
          switch (cells.at(6)?.trim()) {
            case "Active":
              return "Active";
            case "Delisted":
              return "Delisted";
            default:
              throw new Error(
                `Unexpected parse value, "${cells.at(6)?.trim()}"`,
              );
          }
        })(),
      }),
    );
};

export const cache = value(
  parseFile(t).filter((x) => x.assetType === "ETF" && x.status === "Active"),
);

const client = (apiKey: string = "demo") => ({
  NEWS_SENTIMENT: NEWS_SENTIMENT(apiKey),
});

export const instance = client(process.env.ALPHA_VANTAGE_API_KEY);

export type AlphaVantageAPI = typeof client;

export type AlphaVantageAPIError = HttpResult<200, { Information: string }>;
