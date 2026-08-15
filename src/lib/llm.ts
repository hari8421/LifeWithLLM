export type LLMSettings = {
  provider: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const LLM_PROVIDERS = [
  { id: "lmstudio", label: "LM Studio", baseUrl: "http://localhost:1234" },
  { id: "ollama", label: "Ollama", baseUrl: "http://localhost:11434" },
  { id: "llamacpp", label: "llama.cpp", baseUrl: "http://localhost:8080" },
  { id: "vllm", label: "vLLM", baseUrl: "http://localhost:8000" },
  { id: "custom", label: "Custom / Tunnel", baseUrl: "" },
] as const;

function apiBase(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

export async function chatCompletion(
  settings: LLMSettings,
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(`${apiBase(settings.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: opts?.temperature ?? 0.7,
      ...(opts?.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected response shape from the LLM endpoint.");
  }
  return content;
}

export async function listModels(settings: LLMSettings): Promise<string[]> {
  const res = await fetch(`${apiBase(settings.baseUrl)}/models`, {
    headers: settings.apiKey
      ? { Authorization: `Bearer ${settings.apiKey}` }
      : {},
  });
  if (!res.ok) {
    throw new Error(`Could not list models (${res.status}).`);
  }
  const data = await res.json();
  const raw = Array.isArray(data?.data) ? data.data : [];
  return (raw as Array<{ id?: string }>)
    .map((m) => m.id ?? "")
    .filter((id): id is string => id.length > 0);
}
