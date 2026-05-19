import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

const businessFields = {
  legacyId: v.number(),
  name: v.string(),
  owner: v.string(),
  address: v.string(),
  region: v.string(),
  category: v.string(),
  kbli: v.string(),
  kbliDesc: v.string(),
  phone: v.optional(v.string()),
  lat: v.number(),
  lng: v.number(),
  status: v.string(),
  verifiedDate: v.optional(v.string()),
  products: v.optional(v.string()),
  capacity: v.optional(v.string()),
  photos: v.array(v.string()),
  customFields: v.record(v.string(), v.string()),
};

const businessValidator = v.object({
  _id: v.id("businesses"),
  _creationTime: v.number(),
  ...businessFields,
  updatedAt: v.number(),
});

const normalizeOptional = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const list = query({
  args: {
    region: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.array(businessValidator),
  handler: async (ctx, args) => {
    if (args.region) {
      const rows = await ctx.db
        .query("businesses")
        .withIndex("by_region", (q) => q.eq("region", args.region as string))
        .collect();
      return rows.filter((row) => (!args.category || row.category === args.category) && (!args.status || row.status === args.status));
    }
    if (args.category) {
      const rows = await ctx.db
        .query("businesses")
        .withIndex("by_category", (q) => q.eq("category", args.category as string))
        .collect();
      return rows.filter((row) => !args.status || row.status === args.status);
    }
    if (args.status) {
      return await ctx.db
        .query("businesses")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .collect();
    }
    return await ctx.db.query("businesses").collect();
  },
});

export const upsert = mutation({
  args: businessFields,
  returns: v.object({ legacyId: v.number() }),
  handler: async (ctx, args) => {
    if (!args.name.trim() || !args.owner.trim() || !args.address.trim()) {
      throw new ConvexError({ code: "INVALID_BUSINESS", message: "Nama, pemilik, dan alamat wajib diisi" });
    }
    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .unique();
    const payload = {
      ...args,
      phone: normalizeOptional(args.phone),
      verifiedDate: normalizeOptional(args.verifiedDate),
      products: normalizeOptional(args.products),
      capacity: normalizeOptional(args.capacity),
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch("businesses", existing._id, payload);
      return { legacyId: args.legacyId };
    }
    await ctx.db.insert("businesses", payload);
    return { legacyId: args.legacyId };
  },
});

export const remove = mutation({
  args: { legacyId: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete("businesses", existing._id);
    return null;
  },
});

export const seedDefaults = mutation({
  args: { businesses: v.array(v.object(businessFields)) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const writes = args.businesses.map(async (business) => {
      const existing = await ctx.db
        .query("businesses")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", business.legacyId))
        .unique();
      if (existing) return 0 as number;
      await ctx.db.insert("businesses", { ...business, updatedAt: Date.now() });
      return 1 as number;
    });
    const results = await Promise.all(writes);
    return results.reduce((sum, value) => sum + value, 0);
  },
});
