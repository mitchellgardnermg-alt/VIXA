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
  
  // Send the file directly to Railway API
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
    
    // Log the raw response for debugging
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    console.log('Railway API raw response (first 200 chars):', responseText.substring(0, 200));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Railway API error response:', errorText);
      throw new Error(`Railway API conversion failed: ${response.status} ${errorText}`);
    }
    
    // Check if Railway returned the file directly (MP4 content)
    const contentType = response.headers.get('content-type');
    console.log('Railway API response content-type:', contentType);
    
    // If Railway returns video content, it might be the original file, not converted
    if (contentType?.includes('video/')) {
      console.log('Railway API returned video file directly');
      const arrayBuffer = await response.arrayBuffer();
      console.log('Direct video response size:', arrayBuffer.byteLength);
      
      // Check if this is actually converted or just the original file
      const buffer = Buffer.from(arrayBuffer);
      const signature = buffer.toString('hex', 0, 4);
      console.log('Video file signature:', signature);
      
      // Check if this is WebM (Matroska) - means no conversion happened
      if (signature === '1a45dfa3' || signature === '18538086') {
        console.warn('Warning: Railway returned WebM file - conversion may not have completed');
        console.log('This suggests Railway is returning original file instead of converted MP4');
        throw new Error('Railway API returned original WebM file instead of converted MP4');
      }
      
      // If it's actually MP4, return it
      if (signature === '66747970' || buffer.toString('ascii', 4, 8).includes('mp4')) {
        console.log('Confirmed MP4 file from Railway');
        return buffer;
      }
    }
    
    // Try to parse as JSON for download URL
    let result;
    try {
      const responseText = await response.text();
      console.log('Railway API response text:', responseText);
      result = JSON.parse(responseText);
      console.log('Railway API parsed result:', result);
    } catch (parseError) {
      console.error('Failed to parse Railway API response as JSON:', parseError);
      throw new Error('Railway API returned invalid response format');
    }
    
    if (!result.success) {
      throw new Error(`Conversion failed: ${result.message}`);
    }
    
    // Check if Railway provided a download URL
    if (!result.downloadUrl && !result.download_url && !result.url) {
      console.log('No download URL in response, Railway may have processed file differently');
      throw new Error('Railway API did not provide download URL');
    }
    
    // Download the converted file
    const downloadUrl = result.downloadUrl || result.download_url || result.url;
    if (!downloadUrl) {
      throw new Error('No download URL provided by Railway API');
    }
    
    // Ensure we're using the correct download endpoint format
    let finalDownloadUrl = downloadUrl;
    if (downloadUrl.startsWith('/download/')) {
      finalDownloadUrl = `${VIDEO_ENCODING_API_URL}${downloadUrl}`;
    } else if (!downloadUrl.startsWith('http')) {
      finalDownloadUrl = `${VIDEO_ENCODING_API_URL}/download/${downloadUrl}`;
    }
    
    console.log('Downloading converted file from:', finalDownloadUrl);
    const downloadResponse = await fetch(finalDownloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download converted video: ${downloadResponse.status}`);
    }
    
    const arrayBuffer = await downloadResponse.arrayBuffer();
    console.log('Downloaded file size:', arrayBuffer.byteLength);
    console.log('Download response content-type:', downloadResponse.headers.get('content-type'));
    
    // Validate that we got an actual MP4 file
    const buffer = Buffer.from(arrayBuffer);
    const mp4Signature = buffer.toString('hex', 0, 4);
    console.log('File signature (first 4 bytes):', mp4Signature);
    
    // Check for MP4 file signature (ftyp box)
    if (mp4Signature !== '66747970' && !buffer.toString('ascii', 4, 8).includes('mp4')) {
      console.warn('Warning: Downloaded file does not appear to be a valid MP4');
      console.log('File starts with:', buffer.toString('hex', 0, 16));
    }
    
    return buffer;
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
        
        // Fallback to original file with proper WebM naming
        const buffer = Buffer.from(await file.arrayBuffer());
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "video/webm", // Always return as WebM when conversion fails
            "Content-Disposition": `attachment; filename=vixa-recording.webm`,
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
          "Content-Type": "video/webm", // Always return as WebM
          "Content-Disposition": `attachment; filename=vixa-recording.webm`,
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
            "Content-Type": "video/webm", // Always return as WebM
            "Content-Disposition": `attachment; filename=vixa-recording.webm`,
          },
        });
      }
    } catch (fallbackError) {
      console.error("Final fallback also failed:", fallbackError);
    }
    
    return new Response(`Conversion failed: ${error.message}`, { status: 500 });
  }
}
