import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { chatCompletion } from "@/lib/llm";
import { useLLMSettings } from "@/hooks/useLLMSettings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";

const SYSTEM_PROMPT =
  "You are a capable personal assistant running on the user's own machine. " +
  "Be concise, accurate, and genuinely helpful. Use markdown formatting when it improves clarity.";

export default function ChatPage() {
  const settings = useLLMSettings();
  const chats = useQuery(api.chats.listChats) ?? [];
  const createChat = useMutation(api.chats.createChat);
  const sendMessage = useMutation(api.chats.sendMessage);
  const deleteChat = useMutation(api.chats.deleteChat);

  const [chatId, setChatId] = useState<Id<"chats"> | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages =
    useQuery(api.chats.listMessages, chatId ? { chatId } : "skip") ?? [];

  async function handleSend() {
    const text = input.trim();
    if (!text || thinking) return;
    if (!settings?.model) {
      setError("Connect your local LLM in Settings first, then come back.");
      return;
    }
    setError(null);
    setInput("");

    let target = chatId;
    if (!target) {
      target = await createChat({});
      setChatId(target);
    }

    await sendMessage({ chatId: target, role: "user", content: text });
    setThinking(true);

    try {
      const context = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];
      const reply = await chatCompletion(
        {
          provider: settings.provider,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.model,
        },
        context
      );
      await sendMessage({ chatId: target, role: "assistant", content: reply });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to reach the local LLM."
      );
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Chat</h1>
          <p className="text-sm text-muted-foreground">
            {settings?.model
              ? `Connected to ${settings.model}`
              : "No model connected"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const id = await createChat({});
            setChatId(id);
          }}
        >
          <Plus /> New chat
        </Button>
      </div>

      {/* Chat chips */}
      {chats.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {chats.map((c) => (
            <div
              key={c._id}
              className={cn(
                "group flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors",
                c._id === chatId
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <button
                type="button"
                className="max-w-[180px] truncate"
                onClick={() => setChatId(c._id)}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={async () => {
                  await deleteChat({ chatId: c._id });
                  if (c._id === chatId) setChatId(null);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card/50 p-4">
        {messages.length === 0 && !thinking ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Start a conversation</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Ask anything — your local model answers privately, on your own
              machine.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "Summarize the latest AI news",
                "Explain a concept simply",
                "Draft a short tweet about shipping",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setInput(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m._id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {m.role === "assistant" ? (
                  <Markdown content={m.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4 text-primary" /> thinking…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {!settings?.model && (
        <Link
          to="/app/settings"
          className="mt-3 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary hover:bg-primary/10"
        >
          <Settings className="h-3.5 w-3.5" />
          Connect your local LLM in Settings to start chatting.
        </Link>
      )}

      {/* Composer */}
      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Message your assistant…"
          className="min-h-[48px] resize-none"
          rows={1}
        />
        <Button type="submit" disabled={thinking || !input.trim()}>
          <Send />
        </Button>
      </form>
    </div>
  );
}
