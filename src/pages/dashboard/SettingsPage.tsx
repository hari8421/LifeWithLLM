import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Cpu, KeyRound, RefreshCw, Save } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { LLM_PROVIDERS, listModels } from "@/lib/llm";
import { useLLMSettings } from "@/hooks/useLLMSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const settings = useLLMSettings();
  const saveSettings = useMutation(api.settings.saveSettings);

  const [provider, setProvider] = useState("lmstudio");
  const [baseUrl, setBaseUrl] = useState("http://localhost:1234");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setProvider(settings.provider);
      setBaseUrl(settings.baseUrl);
      setModel(settings.model);
      setApiKey(settings.apiKey ?? "");
    }
  }, [settings]);

  function selectProvider(id: string) {
    setProvider(id);
    const preset = LLM_PROVIDERS.find((p) => p.id === id);
    if (preset) setBaseUrl(preset.baseUrl);
  }

  async function fetchModels() {
    setLoadingModels(true);
    setModels([]);
    setMessage(null);
    try {
      const list = await listModels({
        provider,
        baseUrl,
        model: model || "unused",
        apiKey: apiKey || undefined,
      });
      setModels(list);
      if (list.length === 0) setMessage("No models reported by the server.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not list models.");
    } finally {
      setLoadingModels(false);
    }
  }

  async function save() {
    if (!baseUrl.trim() || !model.trim()) {
      setMessage("Base URL and model are required.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings({
        provider,
        baseUrl: baseUrl.trim(),
        model: model.trim(),
        apiKey: apiKey || undefined,
      });
      setMessage("Saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Connect the app to your local (or any OpenAI-compatible) LLM.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Cpu className="h-4 w-4 text-primary" /> Model provider
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {LLM_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectProvider(p.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                provider === p.id
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:1234"
            />
            <p className="text-xs text-muted-foreground">
              The /v1 OpenAI-compatible endpoint root.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API key (optional)</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Only needed for remote endpoints"
              type="password"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="model">Model</Label>
          <div className="flex gap-2">
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. qwen2.5-coder-14b-instruct"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void fetchModels()}
              disabled={loadingModels || !baseUrl.trim()}
            >
              {loadingModels ? <Spinner /> : <RefreshCw />}
              List models
            </Button>
          </div>
          {models.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {models.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-mono text-xs transition-colors",
                    model === m
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {message && (
          <p
            className={cn(
              "mt-4 text-sm",
              message === "Saved." ? "text-primary" : "text-amber-400"
            )}
          >
            {message}
          </p>
        )}

        <Button className="mt-5" onClick={() => void save()} disabled={saving}>
          {saving ? <Spinner /> : <Save />}
          Save connection
        </Button>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-4 w-4 text-primary" /> Environment & setup
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-mono text-xs text-foreground">EXA_API_KEY</span>{" "}
            — required for web research, price comparison, and coupons. Add it in
            Keys / API keys.
          </li>
          <li>
            <span className="font-mono text-xs text-foreground">
              JWT_PRIVATE_KEY
            </span>{" "}
            +{" "}
            <span className="font-mono text-xs text-foreground">JWKS</span> —
            required for sign-in. Generate them with{" "}
            <span className="font-mono text-xs">bun run generate:keys</span> and
            add both to your Convex deployment env vars.
          </li>
          <li>
            <span className="font-mono text-xs text-foreground">
              VITE_CONVEX_URL
            </span>{" "}
            — set automatically by Convex for the dev preview.
          </li>
        </ul>
      </section>
    </div>
  );
}
