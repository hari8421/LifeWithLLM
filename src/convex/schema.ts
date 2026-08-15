import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Per-user local / OpenAI-compatible LLM endpoint configuration.
  llmSettings: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    baseUrl: v.string(),
    apiKey: v.optional(v.string()),
    model: v.string(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  chats: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_chatId", ["chatId"]),

  // Learned writing voice for social posts.
  styleProfiles: defineTable({
    userId: v.id("users"),
    samples: v.array(v.string()),
    voice: v.string(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  reports: defineTable({
    userId: v.id("users"),
    title: v.string(),
    query: v.string(),
    kind: v.union(
      v.literal("research"),
      v.literal("prices"),
      v.literal("coupons")
    ),
    content: v.string(),
    sources: v.array(v.object({ title: v.string(), url: v.string() })),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  posts: defineTable({
    userId: v.id("users"),
    platform: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published")
    ),
    scheduledFor: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status_scheduledFor", ["status", "scheduledFor"]),

  connectedAccounts: defineTable({
    userId: v.id("users"),
    platform: v.string(),
    handle: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  jobs: defineTable({
    userId: v.id("users"),
    type: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("done"),
      v.literal("error")
    ),
    title: v.string(),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  resumes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  jobSearches: defineTable({
    userId: v.id("users"),
    query: v.string(),
    location: v.string(),
    content: v.string(),
    sources: v.array(v.object({ title: v.string(), url: v.string() })),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
