import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const recentVisitors = makeFunctionReference<"query">("visitors:recent");
const addVisitor = makeFunctionReference<"mutation">("visitors:add");

const getClient = () => {
  const url = process.env.CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL missing");
  return new ConvexHttpClient(url);
};

const sendError = (res: VercelResponse, error: unknown) => {
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
      const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 250;
      const visitors = await client.query(recentVisitors, { limit });
      res.status(200).json({ visitors });
      return;
    }
    if (req.method === "POST") {
      await client.mutation(addVisitor, req.body);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "GET,POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}
