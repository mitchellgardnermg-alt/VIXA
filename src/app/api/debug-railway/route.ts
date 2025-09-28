import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VIDEO_ENCODING_API_URL = process.env.VIDEO_ENCODING_API_URL || 'https://vea-production.up.railway.app';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('=== Railway API Debug Test ===');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Test Railway API
    const testFormData = new FormData();
    testFormData.append('video', file);
    
    console.log('Sending to Railway API...');
    const response = await fetch(`${VIDEO_ENCODING_API_URL}/convert`, {
      method: 'POST',
      body: testFormData,
    });
    
    console.log('Railway response status:', response.status);
    console.log('Railway response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    let responseData;
    if (contentType?.includes('video/')) {
      // It's a video file
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const signature = buffer.toString('hex', 0, 8);
      
      responseData = {
        type: 'video_file',
        contentType,
        contentLength,
        fileSize: arrayBuffer.byteLength,
        signature,
        firstBytes: signature
      };
    } else {
      // It's probably JSON
      const text = await response.text();
      responseData = {
        type: 'json_response',
        contentType,
        contentLength,
        response: text
      };
    }
    
    return NextResponse.json({
      success: true,
      railwayStatus: response.status,
      railwayHeaders: Object.fromEntries(response.headers.entries()),
      responseData
    });
    
  } catch (error) {
    console.error('Railway API debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
