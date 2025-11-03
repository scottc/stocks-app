// src/hooks/useLlama.ts
import { useState, useRef, useCallback, useEffect } from "react";

/*
GET
/api/tags
Lists all locally available models with their details (e.g., size, digest).

POST
/api/generate
Generates a text completion from a prompt using the specified model.

POST
/api/chat
Generates a chat completion in a conversational format.

POST
/api/pull
Downloads/pulls a model from the Ollama registry.

POST
/api/push
Pushes a local model to the Ollama registry.

POST
/api/delete
Deletes a local model.

POST
/api/copy
Copies a local model to a new name.

POST
/api/show
Displays detailed information about a local model (e.g., Modelfile, parameters).

POST
/api/create
Creates a new model from a provided Modelfile.

POST
/api/embeddings
Generates embeddings for a given prompt using the specified model.

GET
/api/version
Returns the Ollama server version.
*/

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

    const reqBody: GenerateRequest = {
      model: "llama3.1:8b-instruct-q4_K_M",
      prompt,
      stream: true,
      options: {
        num_ctx: 8192,
        temperature: 0.7,
      },
    };

    try {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        signal: abortControllerRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
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

// Core request interface
export interface ChatRequest {
  model: string; // Name of the model to use (e.g., 'llama3.1')
  messages: Message[]; // Array of conversation messages
  tools?: FunctionTool[]; // Optional: Array of available function tools
  format?: "json" | string; // Optional: Response format (e.g., 'json' or a JSON schema string for structured outputs)
  options?: GenerateOptions; // Optional: Generation parameters
  stream?: boolean; // Optional: Whether to stream the response (default: true)
  think?: boolean; // Optional: Enable step-by-step thinking (for tool-using models)
  keep_alive?: string; // Optional: Duration to keep the model loaded (e.g., '5m', default: '5m')
}

// Message type (used in both request and response)
export interface Message {
  role: "user" | "assistant" | "system" | "tool"; // Role of the message
  content: string; // Text content of the message
  images?: string[]; // Optional: Base64-encoded images (for vision models)
  // For assistant messages in follow-ups: tool_calls?: ToolCall[];
}

// Tool definition (for request.tools)
export interface FunctionTool {
  type: "function"; // Currently only 'function' is supported
  function: {
    name: string; // Unique name of the function
    description: string; // Description of what the function does
    parameters: {
      type: "object"; // JSON Schema type
      properties: Record<string, JsonSchemaType>; // Parameter properties
      required?: string[]; // Required parameters
    }; // Full JSON Schema for parameters
  };
}

// JSON Schema type helper (simplified for parameters)
export interface JsonSchemaType {
  type: "string" | "number" | "integer" | "boolean" | "object" | "array";
  description?: string;
  enum?: string[] | number[];
  // Additional schema props like minLength, maxLength, etc., can be added as needed
}

// Tool call (in response.message.tool_calls or request messages)
export interface ToolCall {
  index?: number; // Optional: Index if parallel calls
  id?: string; // Optional: Unique ID for the call
  type: "function";
  function: {
    name: string; // Name of the called function
    arguments: string; // JSON string of arguments (parse to object)
  };
}

// Generation options (common subset; full list in docs includes more like mirostat, etc.)
export interface GenerateOptions {
  temperature?: number; // 0.0-2.0 (default: 0.8)
  top_p?: number; // 0.0-1.0 (default: 0.9)
  top_k?: number; // Integer (default: 40)
  repeat_penalty?: number; // 1.0+ (default: 1.1)
  seed?: number; // Integer for reproducibility
  num_predict?: number; // Max tokens to predict (default: 128)
  // ... other options like stop sequences, etc.
}

// Core response interface (non-streaming)
export interface ChatResponse {
  model: string; // Model name
  created_at: string; // ISO 8601 timestamp (e.g., '2023-08-04T19:22:45.499127Z')
  message: Message & {
    // Extends Message with assistant-specific fields
    tool_calls?: ToolCall[]; // Array of tool calls if invoked
  };
  done: boolean; // True if response is complete
  done_reason: "stop" | "length" | string; // Reason for completion
  total_duration: number; // Total inference time in nanoseconds
  load_duration: number; // Model load time in nanoseconds
  prompt_eval_count: number; // Tokens in prompt
  prompt_eval_duration: number; // Prompt evaluation time in nanoseconds
  eval_count: number; // Generated tokens
  eval_duration: number; // Generation time in nanoseconds
}

// For streaming: Each chunk is a partial ChatResponse with 'done: false' until the final one
export type ChatStreamChunk = Partial<ChatResponse> & { done: boolean };

// Core request interface
export interface GenerateRequest {
  model: string; // Required: Name of the model (e.g., 'llama3.1')
  prompt: string; // Required: The input prompt for generation
  suffix?: string; // Optional: Text to append after the generated response
  images?: string[]; // Optional: Base64-encoded images (for vision models)
  options?: GenerateOptions; // Optional: Generation parameters (see below)
  system?: string; // Optional: System prompt to guide the model
  template?: string; // Optional: Custom prompt template
  context?: number[]; // Optional: Previous context token IDs for continuation
  stream?: boolean; // Optional: Whether to stream the response (default: true)
  raw?: boolean; // Optional: Treat prompt as raw text (no templating)
  format?: "json" | string; // Optional: Response format (e.g., 'json' or JSON schema for structured outputs)
  keep_alive?: string; // Optional: Duration to keep the model loaded (e.g., '5m', default: '5m')
}

// Generation options (common subset; full list includes more like mirostat, etc.)
export interface GenerateOptions {
  temperature?: number; // 0.0-2.0 (default: 0.8)
  top_p?: number; // 0.0-1.0 (default: 0.9)
  top_k?: number; // Integer (default: 40)
  repeat_penalty?: number; // 1.0+ (default: 1.1)
  seed?: number; // Integer for reproducibility
  num_predict?: number; // Max tokens to predict (default: 128)
  stop?: string | string[]; // Stop sequences
  mirostat?: 0 | 1 | 2; // Mirostat sampling mode (0=disabled, default: 0)
  mirostat_tau?: number; // Mirostat target entropy (default: 5.0)
  mirostat_eta?: number; // Mirostat learning rate (default: 0.1)
  tfs_z?: number; // Tail free sampling (default: 1.0)
  typical_p?: number; // Typical sampling (default: 1.0)
  repeat_last_n?: number; // Repeat penalty last N tokens (default: 64)
  frequency_penalty?: number; // Frequency penalty (default: 0.0)
  presence_penalty?: number; // Presence penalty (default: 0.0)
  // Additional options like penalize_newline, etc., can be extended
}

// Core response interface (non-streaming)
export interface GenerateResponse {
  model: string; // Model name
  created_at: string; // ISO 8601 timestamp (e.g., '2023-08-04T19:22:45.499127Z')
  response: string; // The generated text
  done: boolean; // True if generation is complete
  context?: number[]; // Updated context token IDs for next call
  total_duration: number; // Total inference time in nanoseconds
  load_duration: number; // Model load time in nanoseconds
  prompt_eval_count: number; // Tokens processed in prompt
  prompt_eval_duration: number; // Prompt evaluation time in nanoseconds
  eval_count: number; // Generated tokens
  eval_duration: number; // Generation time in nanoseconds
}

// For streaming: Each chunk is a partial GenerateResponse with 'done: false' until the final one
export type GenerateStreamChunk = Partial<GenerateResponse> & {
  done: boolean;
  response?: string; // Accumulates in chunks
};

// Config: Update these to match your Ollama setup
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.1:8b-instruct-q4_K_M"; // Default model; can be passed as prop

// Optional: Default tools schema (from earlier example; customize or pass as prop)
const DEFAULT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_temperature",
      description:
        "Get the current temperature for a given city via the custom API",
      parameters: {
        type: "object",
        required: ["city"],
        properties: {
          city: {
            type: "string",
            description: 'The name of the city (e.g., "New York")',
          },
        },
      },
    },
  },
] as const;

export const useOllamaChat = (
  options: {
    model?: string;
    tools?: typeof DEFAULT_TOOLS;
    initialMessages?: Message[];
  } = {},
) => {
  const { model = MODEL, tools = [], initialMessages = [] } = options;

  // State
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pendingContent, setPendingContent] = useState(""); // New: For live preview during stream
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingMessageRef = useRef<Message | null>(null); // Ref to track/update the in-flight assistant msg

  // Send a new user message and get streamed response
  const sendMessage = useCallback(
    async (userInput: string, onStreamChunk?: (chunk: string) => void) => {
      if (!userInput.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setPendingContent(""); // Reset live preview
      abortControllerRef.current = new AbortController();

      // Add user message to history
      const newUserMessage: Message = { role: "user", content: userInput };
      setMessages((prev) => [...prev, newUserMessage]);

      const requestBody: ChatRequest = {
        model: "llama3.1:8b-instruct-q4_K_M",
        messages: [...messages, newUserMessage], // Include full history
        tools: DEFAULT_TOOLS, // tools.length > 0 ? tools : undefined,
        stream: true, // Enable streaming
        options: { temperature: 0.7 }, // Customize as needed
        keep_alive: "5m",
      };

      console.log("Request Body:", requestBody);

      try {
        const response = await fetch(OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const t = await response.text();
          throw new Error(`HTTP error! status: ${response.status} ${t}`);
        }

        console.log("[Network] streaming response...");

        // Stream processing
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let hasToolCalls = false; // Track if tools were called

        // Initialize pending message (will be updated via ref)
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

            // if (dataStr === "[DONE]") continue;

            try {
              const chunk: Partial<ChatResponse> = JSON.parse(line);

              // Accumulate content
              if (chunk.message?.content) {
                const newChunk = chunk.message.content;
                pendingMessageRef.current!.content += newChunk;

                console.log("[AI] chunk: 3333", newChunk);

                setPendingContent((prev) => prev + newChunk); // Update live preview state
                onStreamChunk?.(newChunk); // Callback for real-time UI updates
              }

              // Handle tool calls (append to assistant message)
              if (
                chunk.message?.tool_calls &&
                chunk.message.tool_calls.length > 0
              ) {
                console.log(
                  "[AI] AI is calling tools: ",
                  chunk.message.tool_calls,
                );
                pendingMessageRef.current!.tool_calls.push(
                  ...chunk.message.tool_calls,
                );
                hasToolCalls = true;
              }

              // Update full messages array with current pending state (efficient single update per chunk)
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "user") {
                  // First time: Push the pending message
                  updated.push({ ...pendingMessageRef.current! });
                } else {
                  // Subsequent: Update in place
                  updated[lastIdx] = { ...pendingMessageRef.current! };
                }
                return updated;
              });
            } catch (parseErr) {
              console.warn("Failed to parse stream chunk:", parseErr);
            }
          }

          buffer = lines[lines.length - 1]; // Carry over incomplete line
        }

        // Finalize: Ensure tools are set and clear pending
        if (pendingMessageRef.current) {
          if (hasToolCalls) {
            pendingMessageRef.current.tool_calls =
              pendingMessageRef.current.tool_calls; // Already accumulated
          }
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === "assistant") {
              updated[lastIdx] = pendingMessageRef.current!;
            }
            return updated;
          });
        }
        setPendingContent(""); // Clear live preview
        pendingMessageRef.current = null;
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Request aborted");
        } else {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred",
          );
          console.error("Chat API error:", err);
        }
        // Rollback user message on error
        setMessages((prev) => prev.slice(0, -1));
        setPendingContent("");
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, model, tools, isLoading], // Dependencies unchanged
  );

  // ... (keep cancelRequest, clearMessages, useEffect as-is)

  return {
    messages,
    pendingContent, // New: Expose for live rendering in component
    sendMessage,
    isLoading,
    error,
    // cancelRequest,
    // clearMessages,
  };
};

// Example usage in a React component
/*
const MyChatComponent = () => {
  const { messages, sendMessage, isLoading, error } = useOllamaChat({ model: 'llama3.1' });
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input, (chunk) => {
        // Optional: Update a live preview div with chunk
      });
      setInput('');
    }
  };

  return (
    <div>
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
            {msg.tool_calls && <pre>{JSON.stringify(msg.tool_calls, null, 2)}</pre>}
          </div>
        ))}
        {isLoading && <div>Typing...</div>}
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
*/
