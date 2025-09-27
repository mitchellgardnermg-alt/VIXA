import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

export const runtime = "nodejs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy',
  api_key: process.env.CLOUDINARY_API_KEY || 'dummy',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy',
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const width = formData.get("width") as string;
    const height = formData.get("height") as string;
    
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // Check if Cloudinary is properly configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret || 
        cloudName === 'dummy' || apiKey === 'dummy' || apiSecret === 'dummy') {
      console.warn("Cloudinary not configured, falling back to original file");
      
      // Fallback: return the original file with MP4 headers
      const buffer = Buffer.from(await file.arrayBuffer());
      
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": "attachment; filename=recording.mp4",
        },
      });
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Cloudinary and convert to MP4
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          format: "mp4",
          quality: "auto",
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          flags: "progressive",
          eager: [
            {
              format: "mp4",
              quality: "auto",
              width: width ? parseInt(width) : undefined,
              height: height ? parseInt(height) : undefined,
            }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(fileBuffer);
    });

    const result = uploadResult as any;
    
    if (!result || !result.secure_url) {
      throw new Error("Cloudinary upload failed");
    }

    // Download the converted MP4 from Cloudinary
    const response = await fetch(result.secure_url);
    if (!response.ok) {
      throw new Error("Failed to download converted video");
    }

    const mp4Buffer = await response.arrayBuffer();
    
    return new Response(mp4Buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=recording.mp4",
        "Content-Length": mp4Buffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error("Conversion error:", error);
    
    // Fallback: try to return original file if conversion fails
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Disposition": "attachment; filename=recording.mp4",
          },
        });
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }
    
    return new Response("Conversion failed", { status: 500 });
  }
}
