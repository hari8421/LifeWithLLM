import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveReport = mutation({
  args: {
    title: v.string(),
    query: v.string(),
    kind: v.union(
      v.literal("research"),
      v.literal("prices"),
      v.literal("coupons")
    ),
    content: v.string(),
    sources: v.array(v.object({ title: v.string(), url: v.string() })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("reports", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listReports = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("reports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const deleteReport = mutation({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const report = await ctx.db.get(args.id);
    if (report && report.userId === userId) {
      await ctx.db.delete(args.id);
    }
  },
});
