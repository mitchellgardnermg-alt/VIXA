import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VIDEO_ENCODING_API_URL = process.env.VIDEO_ENCODING_API_URL || 'https://vea-production.up.railway.app';

export async function GET() {
  try {
    console.log('Testing Railway API health...');
    const healthResponse = await fetch(`${VIDEO_ENCODING_API_URL}/health`);
    const healthData = await healthResponse.json();
    
    return NextResponse.json({
      success: true,
      health: healthData,
      apiUrl: VIDEO_ENCODING_API_URL
    });
  } catch (error) {
    console.error('Railway API test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      apiUrl: VIDEO_ENCODING_API_URL
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('Testing Railway API with file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const testFormData = new FormData();
    testFormData.append('video', file);
    
    const response = await fetch(`${VIDEO_ENCODING_API_URL}/convert`, {
      method: 'POST',
      body: testFormData,
    });
    
    const responseText = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('Railway API test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
