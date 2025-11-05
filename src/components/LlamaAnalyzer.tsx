import { useOllamaChat } from "@/hooks/useLlama";
import { actor } from "@/store";
import { useSelector } from "@xstate/react";
import { useState } from "react";

export const LlamaChat = () => {
  const [input, setInput] = useState("");

  const ip = useSelector(actor, (s) => s.context.ai.input);

  const model = "llama3.1:8b-instruct-q4_K_M";
  const {
    messages,
    pendingContent,
    sendMessage,
    isLoading,
    error,
    cancelRequest,
    clearMessages,
  } = useOllamaChat({
    model: model,
  });

  // Optional: Remove this in production
  console.log("State Debug:", { pendingContent, isLoading, error, messages });

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

  // Helper to render messages with role-specific styling and tool handling
  const renderMessages = () => {
    return messages.map((msg, idx) => {
      const isLast = idx === messages.length - 1;
      const isPending =
        isLast && msg.role === "assistant" && pendingContent && isLoading;
      const key = `${msg.role}-${idx}-${msg.content?.length || 0}-${pendingContent?.length || 0}`;

      // Determine content to display (handles pending for assistants)
      let displayContent = msg.content || "";
      if (isPending) {
        displayContent += pendingContent; // Append live stream to assistant
      }

      // Role-specific rendering
      switch (msg.role) {
        case "user":
          return (
            <div key={key} className="message user">
              <strong>You:</strong> {displayContent}
            </div>
          );
        case "assistant":
          return (
            <div key={key} className="message assistant">
              <strong>Assistant:</strong> {displayContent}
              {msg.tool_calls && msg.tool_calls.length > 0 && (
                <details className="tool-calls">
                  <summary>🛠️ Tool Calls ({msg.tool_calls.length})</summary>
                  <pre>{JSON.stringify(msg.tool_calls, null, 2)}</pre>
                </details>
              )}
              {isPending && <span className="typing-indicator">▋</span>}
            </div>
          );
        case "tool":
          return (
            <div key={key} className="message tool">
              <strong>Tool Result:</strong> {displayContent}
              {msg.tool_call_id && <small> (ID: {msg.tool_call_id})</small>}
            </div>
          );
        case "system":
        default:
          return (
            <div key={key} className="message system">
              <em>System: {displayContent}</em>
            </div>
          );
      }
    });
  };

  const handleClear = () => {
    clearMessages();
    setInput("");
  };

  return (
    <div className="llama-chat">
      <style>{`
        .llama-chat {
          max-width: 600px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          color: #e0e0e0; /* Base text color for dark mode */
        }
        .chat-history {
          height: 400px;
          overflow-y: auto;
          border: 1px solid #333;
          padding: 10px;
          margin-bottom: 10px;
          background: #1e1e1e;
        }
        .message {
          margin-bottom: 10px;
          padding: 8px;
          border-radius: 8px;
        }
        .user {
          background: #0d47a1;
          text-align: right;
          color: #e3f2fd;
        }
        .assistant {
          background: #4a148c;
          color: #f3e5f5;
        }
        .tool {
          background: #2a2a2a;
          font-size: 0.9em;
          border-left: 3px solid #ff9800;
          color: #ffcc80;
        }
        .system {
          background: #424242;
          font-size: 0.8em;
          color: #9e9e9e;
        }
        .tool-calls {
          margin-top: 5px;
        }
        .tool-calls summary {
          cursor: pointer;
          font-weight: bold;
        }
        .typing-indicator {
          animation: blink 1s infinite;
          color: #90caf9;
        }
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
        form {
          display: flex;
          gap: 10px;
        }
        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #555;
          border-radius: 4px;
          background: #2a2a2a;
          color: #e0e0e0;
        }
        button {
          padding: 10px 20px;
          background: #1e88e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:disabled {
          background: #424242;
          cursor: not-allowed;
          color: #757575;
        }
        .error {
          color: #ffcdd2;
          background: #b71c1c;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }
        .thinking {
          text-align: center;
          color: #aaa;
          font-style: italic;
        }
        .clear-btn {
          background: #d32f2f;
          margin-left: 10px;
          padding: 5px 10px;
          font-size: 0.8em;
          color: white;
        }
      `}</style>

      <div>
        Model:{" "}
        <select>
          <option>{model}</option>
        </select>
      </div>

      <div>
        Tools:
        <br />
        <label>
          <input type="checkbox" checked={true}></input>
          Weather Forcast
        </label>
        <br />
        <label>
          <input type="checkbox"></input>
          Internet Search
        </label>
        <br />
        <label>
          <input type="checkbox"></input>
          Check Brokerage Holdings
        </label>
        <br />
        <label>
          <input type="checkbox"></input>
          Check Brokerage Transactions
        </label>
        <br />
        <label>
          <input type="checkbox"></input>
          Check Stock Market
        </label>
      </div>

      <div className="chat-history">
        {renderMessages()}
        {isLoading && !pendingContent && (
          <div className="thinking">Thinking...</div>
        )}
        {error && <div className="error">Error: {error}</div>}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? "Sending..." : "Send"}
        </button>
        <button
          type="button"
          className="clear-btn"
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear
        </button>
        {isLoading && (
          <button type="button" onClick={cancelRequest} className="clear-btn">
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};
