// src/hooks/useLlama.ts
import { useState, useRef, useCallback, useEffect } from "react";
import ollama, {
  type ChatRequest,
  type ChatResponse,
  type Message,
  type ToolCall,
} from "ollama";
import client from "@/client";
import type { Tool } from "ollama/src/interfaces.js";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.1:8b-instruct-q4_K_M";

// Mock tool execution (replace with real API calls)
const executeTool = async (toolCall: ToolCall): Promise<string> => {
  const { name, arguments: argsStr } = toolCall.function;
  let args;
  try {
    args = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
  } catch (e) {
    throw new Error(`Invalid tool arguments: ${argsStr}`);
  }

  // TODO: from local cache...
  switch (name) {
    case "get_holdings": {
      return JSON.stringify(await client.api.commsec.holdings.get());
    }
    case "get_transactions": {
      return JSON.stringify(await client.api.commsec.transactions.get());
    }
    case "get_stock": {
      return JSON.stringify(
        await client.api.yahoo
          .chart({ symbol: args.symbol })({ interval: "1d" })
          .get(),
      );
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};

// Optional: Default tools schema (from earlier example)
const DEFAULT_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_stock",
      description:
        "Get the stock for a given ticker symbol code via the custom API",
      parameters: {
        type: "object",
        required: ["symbol"],
        properties: {
          symbol: {
            type: "string",
            description: 'The symbol of the stock (e.g., "IOO")',
          },
        },
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_holdings",
      description: "Get the current holdings via the custom API",
    },
  },

  {
    type: "function",
    function: {
      name: "get_transactions",
      description: "Get the current transactions via the custom API",
    },
  },
];

// Custom hook for Ollama chat API with tool support
export const useOllamaChat = (
  options: {
    model?: string;
    tools?: typeof DEFAULT_TOOLS;
    initialMessages?: Message[];
  } = {},
) => {
  const {
    model = MODEL,
    tools = DEFAULT_TOOLS,
    initialMessages = [],
  } = options;

  // State
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pendingContent, setPendingContent] = useState(""); // For live preview during stream
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingMessageRef = useRef<Message | null>(null); // Ref to track/update the in-flight assistant msg

  // Helper: Send a chat request (streaming or not; reusable for follow-ups)
  const sendChatRequest = useCallback(
    async (
      reqMessages: Message[],
      isFollowUp = false,
    ): Promise<Message | null> => {
      const requestBody: ChatRequest = {
        model,
        messages: reqMessages,
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
        options: { temperature: 0.7 },
        keep_alive: "5m",
      };

      console.log("Request Body:", requestBody);

      const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        const t = await response.text();
        throw new Error(`HTTP error! status: ${response.status} ${t}`);
      }

      console.log("[Network] streaming response...");

      // Stream processing (same as before, but generalized)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let hasToolCalls = false;
      pendingMessageRef.current = {
        role: "assistant",
        content: "",
        tool_calls: [],
      };

      while (true) {
        const { done, value } = (await reader?.read()) ?? {
          done: true,
          value: undefined,
        };
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];

          console.log("[Hook] line: ", line);

          const parsedLine: Partial<ChatResponse> = JSON.parse(line ?? "{}");
          console.log("[Hook] parsed: ", parsedLine);

          if (parsedLine.done === true) continue;

          try {
            const chunk: Partial<ChatResponse> = parsedLine;

            console.log("[AI] chunk:", chunk);

            // Accumulate content
            if (chunk.message?.content) {
              const newChunk = chunk.message.content;
              pendingMessageRef.current!.content += newChunk;
              console.log("[AI] newChunk:", newChunk);
              if (!isFollowUp) {
                // Only update pending for initial/final streams (not tool intermediates)
                setPendingContent((prev) => prev + newChunk);
              }
            }

            // Handle tool calls
            if (
              chunk.message?.tool_calls &&
              chunk.message.tool_calls.length > 0
            ) {
              console.log(
                "[AI] AI is calling tools:",
                chunk.message.tool_calls,
              );
              if (pendingMessageRef.current!.tool_calls) {
                pendingMessageRef.current!.tool_calls.push(
                  ...chunk.message.tool_calls,
                );
              }
              hasToolCalls = true;
            }

            // Update messages with pending state
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role !== "assistant" || isFollowUp) {
                updated.push({ ...pendingMessageRef.current! });
              } else {
                updated[lastIdx] = { ...pendingMessageRef.current! };
              }
              return updated;
            });
          } catch (parseErr) {
            console.warn("Failed to parse stream chunk:", parseErr);
          }
        }

        buffer = lines[lines.length - 1];
      }

      // Finalize pending message and return it for tool check
      const finalAssistant = pendingMessageRef.current
        ? { ...pendingMessageRef.current! }
        : null;
      if (finalAssistant) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === "assistant") {
            updated[lastIdx] = finalAssistant;
          }
          return updated;
        });
        if (!isFollowUp) {
          setPendingContent(""); // Clear only for non-follow-ups
        }
      }
      pendingMessageRef.current = null;
      return finalAssistant;
    },
    [model, tools],
  );

  // Send a new user message and get response (with tool handling)
  const sendMessage = useCallback(
    async (userInput: string, onStreamChunk?: (chunk: string) => void) => {
      if (!userInput.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setPendingContent("");
      abortControllerRef.current = new AbortController();

      // Add user message
      const newUserMessage: Message = { role: "user", content: userInput };
      setMessages((prev) => [...prev, newUserMessage]);

      try {
        // Step 1: Initial request to model
        console.log("[Hook] Step 1: Initial request to model");
        const initialAssistant = await sendChatRequest([
          ...messages,
          newUserMessage,
        ]);

        // Step 2: Check for tool calls using the returned assistant (avoids state staleness)
        console.log(
          "[Hook] Step 2: Check for tool calls using the returned assistant (avoids state staleness)",
        );

        //
        if (
          initialAssistant?.tool_calls &&
          initialAssistant.tool_calls.length > 0
        ) {
          console.log(
            "[Hook] Step 3: Execute tools (mock for now; parallel if multiple)",
          );

          // Step 3: Execute tools (mock for now; parallel if multiple)
          const toolResults: Message[] = [];
          for (const toolCall of initialAssistant.tool_calls) {
            try {
              const result = await executeTool(toolCall);
              toolResults.push({
                role: "tool",
                content: result,
                tool_call_id: toolCall.id || "", // Optional, for matching
              });
              console.log(
                `[Tool] Result for ${toolCall.function.name}: ${result}`,
              );
            } catch (toolErr) {
              console.error("[Tool] Execution failed:", toolErr);
              toolResults.push({
                role: "tool",
                content: `Error executing ${toolCall.function.name}: ${toolErr}`,
                tool_call_id: toolCall.id || "",
              });
            }
          }

          console.log("[Hook] Step 4: Append tool results to messages");

          // Step 4: Append tool results to messages
          setMessages((prev) => [...prev, ...toolResults]);

          console.log(
            "[Hook] Step 5: Follow-up request to model with tool results",
          );

          // Step 5: Follow-up request to model with tool results
          const followUpMessages = [
            ...messages,
            newUserMessage,
            initialAssistant,
            ...toolResults,
          ];
          const finalAssistant = await sendChatRequest(followUpMessages, true); // isFollowUp to handle appending correctly

          // Step 6: Final response is now in messages—UI will render it
          console.log(
            "[Hook] Step 6: Final response is now in messages—UI will render it",
          );
        }
      } catch (err) {
        console.log("[Hook] Err");

        if (err.name === "AbortError") {
          console.log("Request aborted");
        } else {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred",
          );
          console.error("Chat API error:", err);
          // Rollback user message on error
          setMessages((prev) => prev.slice(0, -1));
        }
        setPendingContent("");
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, model, tools, isLoading, sendChatRequest],
  );

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages(initialMessages);
    setError(null);
  }, [initialMessages]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    pendingContent,
    sendMessage,
    isLoading,
    error,
    cancelRequest,
    clearMessages,
  };
};
