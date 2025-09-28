import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { code, componentType = "Container", prompt = "Component created from existing code" } = await request.json();

    // Validate required fields
    if (!code) {
      return NextResponse.json(
        createErrorResponse("Missing required input: code", 400),
        { status: 400 }
      );
    }

    console.log('🆕 Creating component from existing code');
    console.log('📄 Code length:', code.length);
    console.log('🎯 Component type:', componentType);

    // Return the code as-is without any regeneration
    return NextResponse.json(
      createSuccessResponse({
        component: code,
        componentType,
        prompt,
        createdFromExistingCode: true
      })
    );

  } catch (error: any) {
    console.error("Error creating component from code:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Error creating component from code", 500),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    createSuccessResponse({
      message: "Create Component from Code API is ready",
      endpoint: "/api/ai/create-component-from-code"
    })
  );
} 