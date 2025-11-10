import { yahooApiFetch } from "@/data-loaders/yahoo-finance-charts";

export async function askLlama(prompt: string): Promise<string> {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1:8b-instruct-q4_K_M",
      prompt,
      stream: false,
      options: {
        num_ctx: 8192, // Max context (8k tokens)
        temperature: 0.7, // Balanced creativity
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error: ${err}`);
  }

  const data = await response.json();
  return data.response;
}

// src/portfolio-ai.ts
//import { askLlama } from "./ai";
//import { yahooApiFetch } from "./yahoo-fetch"; // Your Yahoo loader

export async function analyzePortfolio(symbol: string) {
  const result = await yahooApiFetch(symbol, "1d"); // Last 20 days

  if (result.type === "error") {
    throw new Error("Unhandled");
  }

  const data = result.value.chart.result[0];
  const quote = data?.indicators.quote[0];
  //const meta = data?.meta;

  const close = quote?.close ?? [];
  //const high = quote?.high ?? [];
  //const low = quote?.low ?? [];

  // MARKET CAP: $${(meta?.marketCap / 1e9).toFixed(2)}B
  // 20-DAY HIGH: $${Math.max(...high).toFixed(2)}
  // 20-DAY LOW: $${Math.min(...low).toFixed(2)}
  const context = `
You are a professional ASX portfolio manager.

SYMBOL: ${symbol}
CURRENT PRICE: $${close.at(-1)?.toFixed(2)}
PREVIOUS CLOSE: $${close.at(-2)?.toFixed(2)}
CHANGE: ${(((close.at(-1)! - close.at(-2)!) / close.at(-2)!) * 100).toFixed(2)}%
VOLUME: ${quote?.volume.at(-1)?.toLocaleString()}

You have $10,000 invested.
Suggest:
1. Buy, sell, or hold?
2. Target price in 3 months?
3. Risk level (low/medium/high)?
4. One-sentence reasoning.

Answer in 4 bullet points.
`;

  return await askLlama(context);
}

// Run it
console.log(await analyzePortfolio("IOO.AX"));

const answer = await askLlama(
  "Analyze IOO.AX: close $187.93, volume 28k. Buy/sell?",
);

console.log(answer);

export { answer };
