import { useLlama, useOllamaChat } from "@/hooks/useLlama";
import { useYahooStock } from "@/hooks/useYahooStock";
import { Card } from "./Card";
import { useState } from "react";

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

export const LlamaChat = () => {
  const { messages, pendingContent, sendMessage, isLoading, error } =
    useOllamaChat({
      model: "llama3.1:8b-instruct-q4_K_M", // Match your model
    });
  const [input, setInput] = useState("");

  console.log(pendingContent, isLoading, error, messages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input, (chunk) => {
        // Optional: Extra callback logic, e.g., play typing sound
        console.log("Live chunk via callback:", chunk);
      });
      setInput("");
    }
  };

  // Helper to render messages, with live pending at the end
  const renderMessages = () => {
    return messages.map((msg, idx) => {
      const isPending =
        idx === messages.length - 1 &&
        msg.role === "assistant" &&
        pendingContent;
      const key = `${msg.role}-${idx}-${msg.content?.length || 0}`; // Stable key for re-renders

      return (
        <div key={key} className={`message ${msg.role}`}>
          {JSON.stringify(msg)}
          {msg.content || (isPending ? pendingContent : "")}
          {msg.tool_calls && (
            <pre>{JSON.stringify(msg.tool_calls, null, 2)}</pre>
          )}
          {isPending && <span className="typing-indicator">▋</span>}{" "}
          {/* Optional cursor */}
        </div>
      );
    });
  };

  return (
    <div>
      <div className="chat-history">
        {pendingContent}
        {renderMessages()}
        {isLoading && !pendingContent && <div>Thinking...</div>}
        {error && <div className="error">{error}</div>}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};
