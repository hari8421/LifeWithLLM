"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

type ExaResult = {
  title?: string;
  url?: string;
  text?: string;
};

export const exaSearch = action({
  args: {
    query: v.string(),
    numResults: v.optional(v.number()),
    textLength: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = process.env.EXA_API_KEY;
    if (!key) {
      throw new Error(
        "EXA_API_KEY is not set. Add it under Keys / API keys to enable web research."
      );
    }

    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify({
        query: args.query,
        numResults: args.numResults ?? 6,
        type: "auto",
        contents: { text: { maxCharacters: args.textLength ?? 6000 } },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Search failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as { results?: ExaResult[] };
    const results = (data.results ?? []).map((r) => ({
      title: r.title ?? r.url ?? "Untitled",
      url: r.url ?? "",
      text: r.text ?? "",
    }));

    return { results };
  },
});
