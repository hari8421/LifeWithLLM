import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveSettings = mutation({
  args: {
    provider: v.string(),
    baseUrl: v.string(),
    model: v.string(),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const values = {
      provider: args.provider,
      baseUrl: args.baseUrl,
      model: args.model,
      apiKey: args.apiKey,
      updatedAt: Date.now(),
    };

    const existing = await ctx.db
      .query("llmSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, values);
      return existing._id;
    }
    return await ctx.db.insert("llmSettings", { userId, ...values });
  },
});

export const getSettings = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("llmSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});
