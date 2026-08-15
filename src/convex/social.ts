import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveStyleProfile = mutation({
  args: { samples: v.array(v.string()), voice: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("styleProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        samples: args.samples,
        voice: args.voice,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("styleProfiles", {
      userId,
      samples: args.samples,
      voice: args.voice,
      updatedAt: Date.now(),
    });
  },
});

export const getStyleProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("styleProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const savePost = mutation({
  args: {
    platform: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published")
    ),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("posts", {
      userId,
      platform: args.platform,
      content: args.content,
      status: args.status,
      scheduledFor: args.scheduledFor,
      createdAt: Date.now(),
    });
  },
});

export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    content: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"))
    ),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const post = await ctx.db.get(args.id);
    if (!post || post.userId !== userId) return;

    const { id: _id, ...rest } = args;
    await ctx.db.patch(_id, rest);
  },
});

export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const post = await ctx.db.get(args.id);
    if (post && post.userId === userId) {
      await ctx.db.delete(args.id);
    }
  },
});

export const listPosts = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const connectAccount = mutation({
  args: { platform: v.string(), handle: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const found = existing.find((a) => a.platform === args.platform);
    if (found) {
      await ctx.db.patch(found._id, { handle: args.handle });
      return found._id;
    }
    return await ctx.db.insert("connectedAccounts", {
      userId,
      platform: args.platform,
      handle: args.handle,
      createdAt: Date.now(),
    });
  },
});

export const listAccounts = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("connectedAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});
