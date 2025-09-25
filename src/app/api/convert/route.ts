import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // For now, return the original file with MP4 headers
    // This ensures the app works while we implement proper conversion
    const buffer = Buffer.from(await file.arrayBuffer());
    
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=recording.mp4",
      },
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return new Response("Conversion failed", { status: 500 });
  }
}
