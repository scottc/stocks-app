import { useLlama } from "@/hooks/useLlama";
import { useYahooStock } from "@/hooks/useYahooStock";
import { Card } from "./Card";

export function LlamaAnalyzer({ symbol }: { symbol: string }) {
  const yahooResult = useYahooStock({ symbol });

  const { response, isLoading, error: llamaError, ask } = useLlama();

  const quote = yahooResult.value?.chart.result[0]?.indicators.quote[0];
  // const meta = yahooResult.value?.chart.result[0]?.meta;
  const close = quote?.close ?? [];
  const volume = quote?.volume ?? [];

  //20-DAY HIGH: $${Math.max(...quote.high).toFixed(2)}
  //20-DAY LOW: $${Math.min(...quote.low).toFixed(2)}
  //MARKET CAP: $${(meta.marketCap / 1e9).toFixed(2)}B

  const prompt = `You are a professional ASX portfolio manager.

SYMBOL: ${symbol}

CURRENT PRICE: $${close.at(-1)?.toFixed(2)}
CHANGE: ${(((close.at(-1)! - close.at(-2)!) / close.at(-2)!) * 100).toFixed(2)}%
VOLUME: ${volume.at(-1)?.toLocaleString()}

You have $10,000 invested.
Suggest:
1. Buy, sell, or hold?
2. Target price in 3 months?
3. Risk level?
4. One-sentence reasoning.

Answer in 4 bullet points.`;

  return (
    <Card>
      <h2>AI Analysis: {symbol}</h2>

      {llamaError && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
          Error: {llamaError}
        </div>
      )}

      {response && !isLoading && (
        <textarea rows={20} cols={50}>
          {response}
        </textarea>
      )}

      <h3>Prompt:</h3>
      <textarea rows={20} cols={50}>
        {prompt}
      </textarea>

      <div>
        <button onClick={() => ask(prompt)} disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </Card>
  );
}
