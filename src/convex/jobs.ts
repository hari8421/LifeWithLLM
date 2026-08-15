import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createJob = mutation({
  args: { type: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("jobs", {
      userId,
      type: args.type,
      title: args.title,
      status: "running",
      createdAt: Date.now(),
    });
  },
});

export const finishJob = mutation({
  args: {
    id: v.id("jobs"),
    status: v.union(v.literal("done"), v.literal("error")),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const job = await ctx.db.get(args.id);
    if (!job || job.userId !== userId) return;

    await ctx.db.patch(args.id, {
      status: args.status,
      summary: args.summary,
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const listJobs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Called by the cron to publish due scheduled posts.
// Real platform publishing (X, LinkedIn, etc.) is wired in once an account
// is connected via OAuth; for now this flips due drafts to "published".
export const publishScheduled = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("posts")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "scheduled").lte("scheduledFor", now)
      )
      .collect();

    for (const post of due) {
      await ctx.db.patch(post._id, { status: "published" });
    }
  },
});
