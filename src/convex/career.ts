import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveResume = mutation({
  args: {
    id: v.optional(v.id("resumes")),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.userId !== userId) {
        throw new Error("Resume not found");
      }
      await ctx.db.patch(args.id, {
        title: args.title,
        content: args.content,
        updatedAt: now,
      });
      return args.id;
    }

    return await ctx.db.insert("resumes", {
      userId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listResumes = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("resumes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const deleteResume = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const resume = await ctx.db.get(args.id);
    if (resume && resume.userId === userId) {
      await ctx.db.delete(args.id);
    }
  },
});

export const saveJobSearch = mutation({
  args: {
    query: v.string(),
    location: v.string(),
    content: v.string(),
    sources: v.array(v.object({ title: v.string(), url: v.string() })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("jobSearches", {
      userId,
      query: args.query,
      location: args.location,
      content: args.content,
      sources: args.sources,
      createdAt: Date.now(),
    });
  },
});

export const listJobSearches = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("jobSearches")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const deleteJobSearch = mutation({
  args: { id: v.id("jobSearches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const search = await ctx.db.get(args.id);
    if (search && search.userId === userId) {
      await ctx.db.delete(args.id);
    }
  },
});
