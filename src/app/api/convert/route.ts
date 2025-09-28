import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Video encoding API configuration
const VIDEO_ENCODING_API_URL = process.env.VIDEO_ENCODING_API_URL || 'https://vea-production.up.railway.app';

// Function to convert video using Railway video encoding API
async function convertWithRailwayAPI(file: File): Promise<Buffer> {
  console.log('Starting Railway API conversion for file:', file.name, 'size:', file.size, 'type:', file.type);
  
  // Check if the file is a valid video file
  if (!file.type.startsWith('video/')) {
    throw new Error(`Invalid file type: ${file.type}. Only video files are supported.`);
  }
  
  const formData = new FormData();
  formData.append('video', file);
  
  console.log('Sending request to:', `${VIDEO_ENCODING_API_URL}/convert`);
  
  try {
    const response = await fetch(`${VIDEO_ENCODING_API_URL}/convert`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Railway API response status:', response.status);
    console.log('Railway API response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Railway API error response:', errorText);
      throw new Error(`Railway API conversion failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Railway API result:', result);
    
    if (!result.success) {
      throw new Error(`Conversion failed: ${result.message}`);
    }
    
    // Download the converted file
    const downloadUrl = result.downloadUrl || result.download_url || result.url;
    if (!downloadUrl) {
      throw new Error('No download URL provided by Railway API');
    }
    
    console.log('Downloading converted file from:', downloadUrl);
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download converted video: ${downloadResponse.status}`);
    }
    
    const arrayBuffer = await downloadResponse.arrayBuffer();
    console.log('Downloaded file size:', arrayBuffer.byteLength);
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Railway API conversion error:', error);
    throw error;
  }
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
    console.log('Convert API called');
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.error("No file provided");
      return new Response("No file provided", { status: 400 });
    }

    console.log('File received:', file.name, 'size:', file.size, 'type:', file.type);

    // Check if the file is already MP4
    if (file.type.includes('mp4') || file.name.endsWith('.mp4')) {
      console.log('File is already MP4, returning as-is');
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": "attachment; filename=recording.mp4",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    // Check if Railway video encoding API is available
    console.log('Checking Railway API availability...');
    const isRailwayAvailable = await isRailwayAPIAvailable();
    console.log('Railway API available:', isRailwayAvailable);
    
    if (isRailwayAvailable) {
      console.log("Using Railway video encoding API for conversion");
      try {
        const convertedBuffer = await convertWithRailwayAPI(file);
        console.log('Conversion successful, buffer size:', convertedBuffer.length);
        
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
        console.log("Falling back to original file due to conversion error");
        
        // Fallback to original file
        const buffer = Buffer.from(await file.arrayBuffer());
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": file.type || "video/webm",
            "Content-Disposition": `attachment; filename=recording.${file.name.split('.').pop() || 'webm'}`,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    } else {
      console.log("Railway video encoding API not available, returning original file");
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": file.type || "video/webm",
          "Content-Disposition": `attachment; filename=recording.${file.name.split('.').pop() || 'webm'}`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }
    
  } catch (error) {
    console.error("Conversion error:", error);
    
    // Final fallback: try to return original file if everything fails
    try {
      console.log('Attempting final fallback to original file');
      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log('Final fallback successful, returning original file');
        
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": file.type || "video/webm",
            "Content-Disposition": `attachment; filename=recording.${file.name.split('.').pop() || 'webm'}`,
          },
        });
      }
    } catch (fallbackError) {
      console.error("Final fallback also failed:", fallbackError);
    }
    
    return new Response(`Conversion failed: ${error.message}`, { status: 500 });
  }
}
