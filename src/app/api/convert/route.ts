import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Railway Video Encoding API configuration
const RAILWAY_API_URL = process.env.VIDEO_ENCODING_API_URL || 'https://vea-production.up.railway.app';

// Simple Railway API converter
async function convertWithRailwayAPI(file: File): Promise<Buffer> {
  console.log('🚀 Starting Railway API conversion...');
  console.log('📁 File:', file.name, 'Size:', file.size, 'Type:', file.type);

  // Validate file is actually a video
  if (!file.type.startsWith('video/')) {
    throw new Error(`Invalid file type: ${file.type}. Only video files are supported.`);
  }

  // Create a new File object with proper WebM MIME type and filename
  // Railway API is strict about file validation
  const webmFile = new File([file], 'vixa-recording.webm', { 
    type: 'video/webm' 
  });

  console.log('📁 Created WebM file for Railway:', webmFile.name, 'Type:', webmFile.type);

  // Create FormData with the properly formatted video file
  const formData = new FormData();
  formData.append('video', webmFile);

  console.log('📤 Sending to Railway API:', `${RAILWAY_API_URL}/convert`);
  console.log('📋 FormData entries:', Array.from(formData.entries()).map(([key, value]) => [
    key, 
    value instanceof File ? `${value.name} (${value.size} bytes, ${value.type})` : value
  ]));

  try {
    // Send request to Railway API
    const response = await fetch(`${RAILWAY_API_URL}/convert`, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Railway API response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Railway API error:', errorText);
      throw new Error(`Railway API failed: ${response.status} - ${errorText}`);
    }

    // Check if Railway returned JSON with download URL
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      console.log('📄 Railway returned JSON response');
      const result = await response.json();
      console.log('📋 JSON result:', result);

      if (!result.success && !result.ok) {
        throw new Error(`Railway conversion failed: ${result.message || 'Unknown error'}`);
      }

      // Get download URL
      const downloadUrl = result.downloadUrl || result.download_url || result.url;
      if (!downloadUrl) {
        throw new Error('No download URL provided by Railway API');
      }

      // Construct full download URL if needed
      let fullDownloadUrl = downloadUrl;
      if (downloadUrl.startsWith('/download/')) {
        fullDownloadUrl = `${RAILWAY_API_URL}${downloadUrl}`;
      } else if (!downloadUrl.startsWith('http')) {
        fullDownloadUrl = `${RAILWAY_API_URL}/download/${downloadUrl}`;
      }

      console.log('⬇️ Downloading converted file from:', fullDownloadUrl);

      // Download the converted file
      const downloadResponse = await fetch(fullDownloadUrl);
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download converted video: ${downloadResponse.status}`);
      }

      const arrayBuffer = await downloadResponse.arrayBuffer();
      console.log('✅ Downloaded converted file:', {
        size: arrayBuffer.byteLength,
        contentType: downloadResponse.headers.get('content-type')
      });

      return Buffer.from(arrayBuffer);
    }

    // Railway returned the file directly
    if (contentType?.includes('video/')) {
      console.log('📹 Railway returned video file directly');
      const arrayBuffer = await response.arrayBuffer();
      console.log('✅ Received converted file:', {
        size: arrayBuffer.byteLength,
        contentType: contentType
      });

      return Buffer.from(arrayBuffer);
    }

    throw new Error(`Unexpected response type: ${contentType}`);

  } catch (error) {
    console.error('❌ Railway API conversion error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🎬 Convert API called');
    
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("❌ No file provided");
      return new Response("No file provided", { status: 400 });
    }

    console.log('📥 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Check if file is already MP4
    if (file.type.includes('mp4') || file.name.endsWith('.mp4')) {
      console.log('✅ File is already MP4, returning as-is');
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

    // Convert using Railway API
    console.log('🔄 Converting with Railway API...');
    const convertedBuffer = await convertWithRailwayAPI(file);
    
    console.log('🎉 Conversion successful!', {
      originalSize: file.size,
      convertedSize: convertedBuffer.length,
      compressionRatio: ((1 - convertedBuffer.length / file.size) * 100).toFixed(1) + '%'
    });

    return new Response(convertedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=recording.mp4",
        "Content-Length": convertedBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("❌ Conversion failed:", error);
    return new Response(`Conversion failed: ${error.message}`, { status: 500 });
  }
}