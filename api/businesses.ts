import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const listBusinesses = makeFunctionReference<"query">("businesses:list");
const upsertBusiness = makeFunctionReference<"mutation">("businesses:upsert");
const removeBusiness = makeFunctionReference<"mutation">("businesses:remove");
const seedDefaults = makeFunctionReference<"mutation">("businesses:seedDefaults");

const getClient = () => {
  const url = process.env.CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL missing");
  return new ConvexHttpClient(url);
};

const requireAdmin = (req: VercelRequest) => {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) return;
  const header = req.headers.authorization;
  if (header !== `Bearer ${token}`) {
    const error = new Error("Unauthorized");
    error.name = "UnauthorizedError";
    throw error;
  }
};

const sendError = (res: VercelResponse, error: unknown) => {
  if (error instanceof Error && error.name === "UnauthorizedError") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (error instanceof Error && error.message === "CONVEX_URL missing") {
    res.status(503).json({ error: "Database belum dikonfigurasi" });
    return;
  }
  res.status(500).json({ error: "Server error" });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const client = getClient();
    if (req.method === "GET") {
      const businesses = await client.query(listBusinesses, {
        region: typeof req.query.region === "string" ? req.query.region : undefined,
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
      });
      res.status(200).json({ businesses });
      return;
    }
    if (req.method === "POST") {
      requireAdmin(req);
      const result = await client.mutation(upsertBusiness, req.body);
      res.status(200).json(result);
      return;
    }
    if (req.method === "PUT") {
      requireAdmin(req);
      const inserted = await client.mutation(seedDefaults, { businesses: req.body.businesses ?? [] });
      res.status(200).json({ inserted });
      return;
    }
    if (req.method === "DELETE") {
      requireAdmin(req);
      const legacyId = Number(req.query.legacyId ?? req.body?.legacyId);
      await client.mutation(removeBusiness, { legacyId });
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}
