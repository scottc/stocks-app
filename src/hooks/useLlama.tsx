// src/hooks/useLlama.ts
import { useState, useRef } from "react";

export function useLlama() {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const ask = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setResponse("");
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        signal: abortControllerRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1:8b-instruct-q4_K_M",
          prompt,
          stream: true,
          options: { num_ctx: 8192, temperature: 0.7 },
        }),
      });

      if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              setResponse((prev) => prev + data.response);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  return { response, isLoading, error, ask, cancel };
}
