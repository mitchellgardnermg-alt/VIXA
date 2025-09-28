import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RAILWAY_API_URL = process.env.VIDEO_ENCODING_API_URL || 'https://vea-production.up.railway.app';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing Railway API endpoints...');

    // Test health endpoint
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${RAILWAY_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    console.log('Health check result:', {
      status: healthResponse.status,
      ok: healthResponse.ok,
      statusText: healthResponse.statusText
    });

    if (healthResponse.ok) {
      const healthText = await healthResponse.text();
      console.log('Health response:', healthText);
    }

    return NextResponse.json({
      railwayApiUrl: RAILWAY_API_URL,
      healthStatus: healthResponse.status,
      healthOk: healthResponse.ok,
      endpoints: {
        health: `${RAILWAY_API_URL}/health`,
        convert: `${RAILWAY_API_URL}/convert`,
        download: `${RAILWAY_API_URL}/download/:filename`
      },
      message: healthResponse.ok ? 'Railway API is healthy!' : 'Railway API health check failed'
    });

  } catch (error) {
    console.error('❌ Railway API test failed:', error);
    return NextResponse.json({
      error: error.message,
      railwayApiUrl: RAILWAY_API_URL,
      message: 'Railway API test failed'
    }, { status: 500 });
  }
}