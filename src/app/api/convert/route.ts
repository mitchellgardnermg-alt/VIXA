import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "redis";

export const runtime = "nodejs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dcmrwk0oi",
  api_key: "593593288966646",
  api_secret: "CDSntM40x761-Fy68hpfB_vsCzQ"
});

// Redis client for caching
let redisClient: any = null;
const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
  }
  return redisClient;
};

// Request queue to prevent Cloudinary overload
const conversionQueue = new Map<string, Promise<any>>();
const MAX_CONCURRENT_CONVERSIONS = 3;

// Generate cache key for video conversion
function generateCacheKey(fileBuffer: Buffer, width: string, height: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  return `video_${hash}_${width}x${height}`;
}

// Queue management for Cloudinary conversions
async function queueConversion(cacheKey: string, conversionFn: () => Promise<any>) {
  // Check if conversion is already in progress
  if (conversionQueue.has(cacheKey)) {
    return conversionQueue.get(cacheKey);
  }
  
  // Limit concurrent conversions
  if (conversionQueue.size >= MAX_CONCURRENT_CONVERSIONS) {
    // Wait for a slot to become available
    await new Promise(resolve => setTimeout(resolve, 1000));
    return queueConversion(cacheKey, conversionFn);
  }
  
  const conversionPromise = conversionFn().finally(() => {
    conversionQueue.delete(cacheKey);
  });
  
  conversionQueue.set(cacheKey, conversionPromise);
  return conversionPromise;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const width = formData.get("width") as string;
    const height = formData.get("height") as string;
    
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const cacheKey = generateCacheKey(buffer, width, height);
    
    try {
      // Check Redis cache first
      const redis = await getRedisClient();
      const cachedResult = await redis.get(cacheKey);
      
      if (cachedResult) {
        console.log("Cache hit for conversion:", cacheKey);
        const cachedBuffer = Buffer.from(cachedResult, 'base64');
        return new Response(cachedBuffer, {
          status: 200,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Disposition": "attachment; filename=recording.mp4",
            "X-Cache": "HIT"
          },
        });
      }
      
      // Queue the conversion to prevent overload
      const conversionResult = await queueConversion(cacheKey, async () => {
        // Upload to Cloudinary with optimized settings
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "video",
              format: "mp4",
              transformation: [
                { format: "mp4" },
                { quality: "auto:low" },
                { fetch_format: "auto" },
                { width: width || "1920" },
                { height: height || "1080" },
                { crop: "fill" },
                { gravity: "center" },
                { flags: "fast_upload" },
                { bit_rate: "500k" }, // Limit bitrate for faster processing
                { fps: "30" } // Limit FPS for faster processing
              ],
              timeout: 30000 // Reduced timeout
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        // Download the converted MP4 from Cloudinary
        const convertedUrl = (uploadResult as any).secure_url;
        const response = await fetch(convertedUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch converted video: ${response.status}`);
        }

        return Buffer.from(await response.arrayBuffer());
      });

      // Cache the result in Redis (expires in 24 hours)
      await redis.setEx(cacheKey, 86400, conversionResult.toString('base64'));
      console.log("Cached conversion result:", cacheKey);
      
      return new Response(conversionResult, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": "attachment; filename=recording.mp4",
          "X-Cache": "MISS"
        },
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary conversion failed:", cloudinaryError);
      
      // Fallback: return original file with MP4 headers
      console.log("Falling back to original file with MP4 headers");
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": "attachment; filename=recording.mp4",
        },
      });
    }
  } catch (error) {
    console.error("Conversion error:", error);
    return new Response("Conversion failed", { status: 500 });
  }
}
