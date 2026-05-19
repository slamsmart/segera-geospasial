import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  businesses: defineTable({
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
    updatedAt: v.number(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_region", ["region"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),
  visitors: defineTable({
    ip: v.string(),
    timestamp: v.string(),
    page: v.string(),
    userAgent: v.string(),
    city: v.string(),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
