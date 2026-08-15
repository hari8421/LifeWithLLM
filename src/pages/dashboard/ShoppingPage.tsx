import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Search, ShoppingCart, Ticket } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { chatCompletion } from "@/lib/llm";
import { useLLMSettings } from "@/hooks/useLLMSettings";
import { useRunJob } from "@/hooks/useRunJob";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";

type Tab = "prices" | "coupons";

function pricePrompt(query: string, texts: string[]) {
  const body = texts
    .map((t, i) => `[${i + 1}] ${t.slice(0, 2500)}`)
    .join("\n\n---\n\n");
  return (
    `Product to compare: ${query}\n\nWeb search excerpts:\n${body}\n\n` +
    `Extract concrete prices, retailers, and relevant details (model, shipping) ` +
    `from the excerpts. Produce a markdown table comparing the options, sorted ` +
    `by best value. End with a one-sentence "Best deal" recommendation. ` +
    `If a price is missing, mark it "not found".`
  );
}

function couponPrompt(query: string, texts: string[]) {
  const body = texts
    .map((t, i) => `[${i + 1}] ${t.slice(0, 2500)}`)
    .join("\n\n---\n\n");
  return (
    `Store: ${query}\n\nWeb search excerpts:\n${body}\n\n` +
    `Extract promo codes, discount percentages, and their terms. Output a ` +
    `markdown list of the best coupons with codes in backticks. Mark uncertain ` +
    `codes as "unverified". End with the single best money-saving tip for this store.`
  );
}

export default function ShoppingPage() {
  const settings = useLLMSettings();
  const runJob = useRunJob();
  const exaSearch = useAction(api.research.exaSearch);
  const saveReport = useMutation(api.reports.saveReport);

  const [tab, setTab] = useState<Tab>("prices");
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    const q = query.trim();
    if (!q || running) return;
    if (!settings?.model) {
      setError("Connect your local LLM in Settings first.");
      return;
    }
    setError(null);
    setResult(null);
    setRunning(true);
    try {
      const output = await runJob(tab, q, async () => {
        const search = await exaSearch({
          query: tab === "prices" ? `${q} price buy` : `${q} promo code coupon`,
          numResults: 8,
          textLength: 3000,
        });
        const texts = search.results.map((r) => r.text);
        const content = await chatCompletion(
          {
            provider: settings.provider,
            baseUrl: settings.baseUrl,
            apiKey: settings.apiKey,
            model: settings.model,
          },
          [
            {
              role: "user",
              content:
                tab === "prices"
                  ? pricePrompt(q, texts)
                  : couponPrompt(q, texts),
            },
          ],
          { temperature: 0.3 }
        );
        await saveReport({
          title: q.slice(0, 80),
          query: q,
          kind: tab,
          content,
          sources: search.results.map((r) => ({
            title: r.title,
            url: r.url,
          })),
        });
        return content;
      });
      setResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Shopping</h1>
        <p className="text-sm text-muted-foreground">
          Compare prices and find coupons with your local model doing the
          reasoning.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("prices")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            tab === "prices"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <ShoppingCart className="h-4 w-4" /> Price comparison
        </button>
        <button
          type="button"
          onClick={() => setTab("coupons")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            tab === "coupons"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Ticket className="h-4 w-4" /> Coupon finder
        </button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "prices"
              ? "e.g. Sony WH-1000XM5 headphones"
              : "e.g. Nike store"
          }
          className="h-11"
        />
        <Button type="submit" disabled={running || !query.trim()}>
          {running ? <Spinner /> : <Search />}
          {tab === "prices" ? "Compare" : "Find coupons"}
        </Button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-xl border bg-card p-5">
          <Markdown content={result} />
        </div>
      )}
    </div>
  );
}
