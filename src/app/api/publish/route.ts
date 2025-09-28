import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

// Store published prototypes (in production, use a database)
const publishedPrototypes = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { components, frames, aiFunctionalities, title } = await request.json();
    
    // Generate unique ID for the prototype
    const prototypeId = `prototype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the prototype data
    const prototypeData = {
      id: prototypeId,
      title: title || "Untitled Prototype",
      components,
      frames,
      aiFunctionalities,
      createdAt: new Date().toISOString(),
      views: 0
    };
    
    publishedPrototypes.set(prototypeId, prototypeData);
    
    // Generate shareable URL
    const shareUrl = `${request.nextUrl.origin}/share/${prototypeId}`;
    
    return NextResponse.json(
      createSuccessResponse({
        prototypeId,
        shareUrl,
        embedCode: `<iframe src="${shareUrl}" width="100%" height="600px" frameborder="0"></iframe>`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse(error.message || "Failed to publish prototype", 500),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const prototypeId = url.searchParams.get('id');
  
  if (!prototypeId) {
    return NextResponse.json(
      createErrorResponse("Prototype ID required", 400),
      { status: 400 }
    );
  }
  
  const prototype = publishedPrototypes.get(prototypeId);
  
  if (!prototype) {
    return NextResponse.json(
      createErrorResponse("Prototype not found", 404),
      { status: 404 }
    );
  }
  
  // Increment view count
  prototype.views++;
  
  return NextResponse.json(createSuccessResponse(prototype));
} 