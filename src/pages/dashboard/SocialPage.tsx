import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  CalendarClock,
  Check,
  Link2,
  PenLine,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { chatCompletion } from "@/lib/llm";
import { PLATFORMS, platformLabel } from "@/lib/platforms";
import { useLLMSettings } from "@/hooks/useLLMSettings";
import { useRunJob } from "@/hooks/useRunJob";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LEARN_PROMPT = (samples: string) =>
  `Analyze the user's writing style from these samples. Write a concise ` +
  `"voice profile" covering: tone, sentence style, vocabulary, humor, ` +
  `formatting habits, and emoji/hashtag use. Output one short paragraph ` +
  `followed by 5 bullet rules to follow when writing like them.\n\nSamples:\n${samples}`;

const DRAFT_PROMPT = (voice: string, platform: string, topic: string) =>
  `You write social media posts in the user's exact voice.\n\nVoice profile:\n` +
  `${voice || "(no voice profile yet — write naturally)"}\n\n` +
  `Task: write a ${platform} post about: ${topic}\n\n` +
  `Return ONLY the post text. Match the platform's tone and length norms.`;

function statusBadge(status: "draft" | "scheduled" | "published") {
  if (status === "published")
    return <Badge variant="success">Published</Badge>;
  if (status === "scheduled") return <Badge variant="warning">Scheduled</Badge>;
  return <Badge variant="secondary">Draft</Badge>;
}

export default function SocialPage() {
  const settings = useLLMSettings();
  const runJob = useRunJob();
  const profile = useQuery(api.social.getStyleProfile);
  const posts = useQuery(api.social.listPosts) ?? [];
  const accounts = useQuery(api.social.listAccounts) ?? [];

  const saveStyleProfile = useMutation(api.social.saveStyleProfile);
  const savePost = useMutation(api.social.savePost);
  const updatePost = useMutation(api.social.updatePost);
  const deletePost = useMutation(api.social.deletePost);
  const connectAccount = useMutation(api.social.connectAccount);

  const [samples, setSamples] = useState("");
  const [learning, setLearning] = useState(false);
  const [learnError, setLearnError] = useState<string | null>(null);

  const [platform, setPlatform] = useState<string>("x");
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const [scheduleFor, setScheduleFor] = useState<Record<string, string>>({});
  const [handle, setHandle] = useState("");

  async function learnStyle() {
    const text = samples.trim();
    if (!text || learning) return;
    if (!settings?.model) {
      setLearnError("Connect your local LLM in Settings first.");
      return;
    }
    setLearnError(null);
    setLearning(true);
    try {
      const voice = await chatCompletion(
        {
          provider: settings.provider,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.model,
        },
        [{ role: "user", content: LEARN_PROMPT(text) }],
        { temperature: 0.4 }
      );
      await saveStyleProfile({
        samples: text.split("\n").filter(Boolean),
        voice,
      });
    } catch (e) {
      setLearnError(e instanceof Error ? e.message : "Failed to learn style.");
    } finally {
      setLearning(false);
    }
  }

  async function draftPost() {
    const t = topic.trim();
    if (!t || drafting) return;
    if (!settings?.model) {
      setDraftError("Connect your local LLM in Settings first.");
      return;
    }
    setDraftError(null);
    setDrafting(true);
    try {
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
            content: DRAFT_PROMPT(profile?.voice ?? "", platformLabel(platform), t),
          },
        ],
        { temperature: 0.8 }
      );
      setDraft(content);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "Failed to draft.");
    } finally {
      setDrafting(false);
    }
  }

  async function schedulePost(id: Id<"posts">) {
    const value = scheduleFor[id];
    if (!value) return;
    await updatePost({
      id,
      status: "scheduled",
      scheduledFor: new Date(value).getTime(),
    });
    setScheduleFor((s) => ({ ...s, [id]: "" }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Social</h1>
        <p className="text-sm text-muted-foreground">
          Learn your voice, draft posts, and queue them up.
        </p>
      </div>

      {/* Style profile */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Your writing style
        </h2>
        {profile?.voice ? (
          <div className="mt-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {profile.voice}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Paste a few of your past posts or messages and the model will learn
            your voice.
          </p>
        )}
        <Textarea
          value={samples}
          onChange={(e) => setSamples(e.target.value)}
          placeholder={"Paste 3-5 samples of your writing, one per line…"}
          className="mt-3 min-h-[120px]"
        />
        {learnError && (
          <p className="mt-2 text-xs text-red-400">{learnError}</p>
        )}
        <Button
          className="mt-3"
          onClick={() => void learnStyle()}
          disabled={learning || !samples.trim()}
        >
          {learning ? <Spinner /> : <Sparkles />}
          {profile?.voice ? "Update my style" : "Learn my style"}
        </Button>
      </section>

      {/* Compose */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <PenLine className="h-4 w-4 text-primary" /> Compose
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                platform === p.id
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What should the post be about?"
          />
          <Button
            onClick={() => void draftPost()}
            disabled={drafting || !topic.trim()}
          >
            {drafting ? <Spinner /> : <Sparkles />}
            Draft
          </Button>
        </div>

        {draftError && (
          <p className="mt-2 text-xs text-red-400">{draftError}</p>
        )}

        {draft && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  void savePost({
                    platform,
                    content: draft,
                    status: "draft",
                  }).then(() => setDraft(""))
                }
              >
                Save draft
              </Button>
              <Button
                variant="outline"
                onClick={() => setDraft("")}
              >
                Discard
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Posts */}
      <section className="space-y-3">
        <h2 className="font-semibold">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts yet. Draft one above.
          </p>
        ) : (
          posts.map((p) => (
            <div key={p._id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {platformLabel(p.platform)}
                  </span>
                  {statusBadge(p.status)}
                  {p.scheduledFor && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" />
                      {new Date(p.scheduledFor).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void deletePost({ id: p._id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{p.content}</p>

              {p.status !== "published" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {p.status === "draft" && (
                    <>
                      <input
                        type="datetime-local"
                        value={scheduleFor[p._id] ?? ""}
                        onChange={(e) =>
                          setScheduleFor((s) => ({
                            ...s,
                            [p._id]: e.target.value,
                          }))
                        }
                        className="rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void schedulePost(p._id)}
                        disabled={!scheduleFor[p._id]}
                      >
                        <CalendarClock /> Schedule
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    onClick={() =>
                      void runJob("publish", p.content.slice(0, 40), async () => {
                        await updatePost({ id: p._id, status: "published" });
                      })
                    }
                  >
                    <Send /> Publish now
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Accounts */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Link2 className="h-4 w-4 text-primary" /> Connected accounts
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Full publishing needs each platform's API access (OAuth). For now you
          can record your handles; the drafts and scheduling flow work end to
          end.
        </p>
        {accounts.length > 0 && (
          <ul className="mt-3 space-y-1">
            {accounts.map((a) => (
              <li key={a._id} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span className="font-medium">{platformLabel(a.platform)}</span>
                <span className="text-muted-foreground">@{a.handle}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id} className="bg-background">
                {p.label}
              </option>
            ))}
          </select>
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="your_handle"
            className="max-w-[180px]"
          />
          <Button
            variant="outline"
            onClick={() => {
              const h = handle.trim();
              if (!h) return;
              void connectAccount({ platform, handle: h }).then(() =>
                setHandle("")
              );
            }}
          >
            Connect
          </Button>
        </div>
      </section>
    </div>
  );
}
