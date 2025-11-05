import { LlamaChat } from "@/components/LlamaAnalyzer";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ai")({
  component: AIPage,
});

function AIPage() {
  return (
    <div>
      <h2>AI</h2>

      <LlamaChat />
    </div>
  );
}
