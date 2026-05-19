import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v2 as cloudinary } from "cloudinary";

const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("CLOUDINARY_ENV_MISSING");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    configureCloudinary();
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "segera";
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET as string);
    res.status(200).json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CLOUDINARY_ENV_MISSING") {
      res.status(503).json({ error: "Cloudinary belum dikonfigurasi" });
      return;
    }
    res.status(500).json({ error: "Server error" });
  }
}
