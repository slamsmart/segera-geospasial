import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const visitorValidator = v.object({
  _id: v.id("visitors"),
  _creationTime: v.number(),
  ip: v.string(),
  timestamp: v.string(),
  page: v.string(),
  userAgent: v.string(),
  city: v.string(),
  createdAt: v.number(),
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(visitorValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("visitors")
      .withIndex("by_created_at")
      .order("desc")
      .take(Math.min(args.limit ?? 250, 500));
  },
});

export const add = mutation({
  args: {
    ip: v.string(),
    timestamp: v.string(),
    page: v.string(),
    userAgent: v.string(),
    city: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("visitors", { ...args, createdAt: Date.now() });
    return null;
  },
});
