import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Globe, Search, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { chatCompletion } from "@/lib/llm";
import { useLLMSettings } from "@/hooks/useLLMSettings";
import { useRunJob } from "@/hooks/useRunJob";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Markdown } from "@/components/Markdown";
import { timeAgo } from "@/lib/utils";

type Source = { title: string; url: string };

function buildPrompt(query: string, results: Source[]) {
  const snippets = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n${r.url}`
    )
    .join("\n");
  return (
    `Research question: ${query}\n\n` +
    `Relevant sources I gathered:\n${snippets}\n\n` +
    `Write a thorough but concise markdown report answering the question. ` +
    `Include a 2-3 sentence summary, key findings as bullet points, and cite ` +
    `sources inline using [1], [2], etc. End with a "Sources" section listing ` +
    `each numbered source with its title and URL.`
  );
}

export default function ResearchPage() {
  const settings = useLLMSettings();
  const runJob = useRunJob();
  const exaSearch = useAction(api.research.exaSearch);
  const saveReport = useMutation(api.reports.saveReport);
  const deleteReport = useMutation(api.reports.deleteReport);
  const reports = useQuery(api.reports.listReports) ?? [];

  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    content: string;
    sources: Source[];
  } | null>(null);

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
      const output = await runJob("research", q, async () => {
        const search = await exaSearch({ query: q, numResults: 6 });
        const sources: Source[] = search.results.map((r) => ({
          title: r.title,
          url: r.url,
        }));
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
              content: buildPrompt(q, sources),
            },
          ],
          { temperature: 0.4 }
        );
        await saveReport({
          title: q.slice(0, 80),
          query: q,
          kind: "research",
          content,
          sources,
        });
        return { content, sources };
      });
      setResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Research agent</h1>
        <p className="text-sm text-muted-foreground">
          Search the web, read the sources, and get a cited report — synthesized
          by your local model.
        </p>
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
          placeholder="e.g. What changed in the EU AI Act in 2026?"
          className="h-11"
        />
        <Button type="submit" disabled={running || !query.trim()}>
          {running ? <Spinner /> : <Search />}
          Research
        </Button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-xl border bg-card p-5">
          <Markdown content={result.content} />
          {result.sources.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sources
              </p>
              <ul className="space-y-1">
                {result.sources.map((s, i) => (
                  <li key={i} className="text-sm">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Globe className="h-4 w-4" /> Past research
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No research yet. Run your first query above.
          </p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() =>
                    setResult({ content: r.content, sources: r.sources })
                  }
                >
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(r.createdAt)}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void deleteReport({ id: r._id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
