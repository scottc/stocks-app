import { error, value } from "@/lib/lib";
import { type HttpResult, tryFetchJson } from "@/lib/tryFetch";
import { tryJson } from "@/lib/tryRead";
import { tryWrite } from "@/lib/tryWrite";
import { file } from "bun";
import { join } from "path";
import type { AlphaVantageAPIError } from ".";

// Sentiment labels based on the definition provided
export enum SentimentLabel {
  Bearish = "Bearish",
  SomewhatBearish = "Somewhat-Bearish",
  Neutral = "Neutral",
  SomewhatBullish = "Somewhat-Bullish",
  Bullish = "Bullish",
}

// Helper to map from API string to enum
export const parseSentimentLabel = (label: string): SentimentLabel => {
  switch (label) {
    case "Bearish":
      return SentimentLabel.Bearish;
    case "Somewhat-Bearish":
      return SentimentLabel.SomewhatBearish;
    case "Neutral":
      return SentimentLabel.Neutral;
    case "Somewhat-Bullish":
      return SentimentLabel.SomewhatBullish;
    case "Bullish":
      return SentimentLabel.Bullish;
    default:
      throw new Error(`Unknown sentiment label: ${label}`);
  }
};

// Topic relevance score is a string like "0.459462"
type RelevanceScore = `${number}`;

// Ticker sentiment entry
export interface TickerSentiment {
  ticker: string;
  relevance_score: RelevanceScore;
  ticker_sentiment_score: number;
  ticker_sentiment_label: SentimentLabel | string; // fallback for unknown
}

// Topic relevance entry
export interface TopicRelevance {
  topic: string;
  relevance_score: RelevanceScore;
}

// News article / feed item
export interface FeedItem {
  title: string;
  url: string;
  time_published: string; // ISO-like: "20251031T205055"
  authors: string[];
  summary: string;
  banner_image: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: TopicRelevance[];
  overall_sentiment_score: number;
  overall_sentiment_label: SentimentLabel | string;
  ticker_sentiment: TickerSentiment[];
}

// Root response structure
export interface SentimentFeed {
  items: string; // e.g., "50"
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: FeedItem[];
}

type CacheEntry<T> = { timestamp: number; entry: T };

const newsSentimentCache = new Map<string, CacheEntry<SentimentFeed>>();

const cacheKey = (tickers: string, topics?: string) =>
  `tickers:${tickers};topics:${topics}`;

const CACHE_DIR = join(process.cwd(), "data", "alphavantage", "NEWS_SENTIMENT");

export const NEWS_SENTIMENT =
  (apiKey: string) => async (tickers: string, topics?: string) => {
    const entry = newsSentimentCache.get(
      cacheKey(tickers, topics ?? "all"),
    )?.entry;

    if (entry) {
      console.log("[Memory] Found entry...", entry);
      return value(entry);
    }

    const now = Date.now();
    const bunFile = file(
      join(CACHE_DIR, tickers, topics ?? "all", `${now}.json`),
    );

    // TODO: search folder, sort by filename timestamp...

    const jsonFile = await tryJson<SentimentFeed>(bunFile);

    switch (jsonFile.type) {
      case "value":
        console.log("[DISK] Found file...", jsonFile);

        const entry = newsSentimentCache.set(
          cacheKey(tickers, topics ?? "all"),
          {
            timestamp: now,
            entry: jsonFile.value,
          },
        );

        return jsonFile;
      case "error": {
        const r = await tryFetchJson<
          HttpResult<200, SentimentFeed> | AlphaVantageAPIError
        >(
          // https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=COIN,CRYPTO:BTC,FOREX:USD&time_from=20220410T0130&limit=1000&apikey=demo
          `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickers}&apikey=${apiKey}`,
        );

        console.log("[NETWORK] result...", r);

        if (r?.type === "httpResult") {
          if ("Information" in r.body) {
            return error(new Error(`Got a 200 error... ${r.body}`));
          }

          const entry = newsSentimentCache.set(tickers, {
            timestamp: now,
            entry: r.body,
          });

          const bytesWrittenResult = await tryWrite(
            bunFile,
            JSON.stringify(r),
            {
              createPath: true,
            },
          );

          console.log("[DISK] Written", bytesWrittenResult);

          return r;
        } else {
          return error(new Error("Err", { cause: r.error }));
        }
      }
    }
  };
