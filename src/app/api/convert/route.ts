import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Video encoding API configuration
const VIDEO_ENCODING_API_URL = process.env.VIDEO_ENCODING_API_URL || 'https://vea-production.up.railway.app';

// Function to convert video using Railway video encoding API
async function convertWithRailwayAPI(file: File): Promise<Buffer> {
  const formData = new FormData();
  formData.append('video', file);
  
  const response = await fetch(`${VIDEO_ENCODING_API_URL}/convert`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Railway API conversion failed: ${response.status} ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Conversion failed: ${result.message}`);
  }
  
  // Download the converted file
  const downloadResponse = await fetch(`${VIDEO_ENCODING_API_URL}${result.downloadUrl}`);
  if (!downloadResponse.ok) {
    throw new Error('Failed to download converted video');
  }
  
  const arrayBuffer = await downloadResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Function to check if Railway encoding API is available
async function isRailwayAPIAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${VIDEO_ENCODING_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.log('Railway video encoding API not available:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // Check if Railway video encoding API is available
    const isRailwayAvailable = await isRailwayAPIAvailable();
    if (isRailwayAvailable) {
      console.log("Using Railway video encoding API for conversion");
      try {
        const convertedBuffer = await convertWithRailwayAPI(file);
        
        return new Response(convertedBuffer, {
          status: 200,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Disposition": "attachment; filename=recording.mp4",
            "Content-Length": convertedBuffer.length.toString(),
          },
        });
      } catch (error) {
        console.error("Railway API conversion failed:", error);
        throw error;
      }
    } else {
      console.log("Railway video encoding API not available");
      throw new Error("Video encoding service unavailable");
    }
    
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
