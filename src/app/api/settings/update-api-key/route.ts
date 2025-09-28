import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

// Cookie-based API key storage that lasts for the session
export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider = "deepseek" } = await request.json();
    
    if (!apiKey && apiKey !== "") {
      return NextResponse.json(
        createErrorResponse("Missing API key", 400),
        { status: 400 }
      );
    }

    // Store API key in a cookie (lasts for the session)
    // In a production app, you'd use more secure storage
    const response = NextResponse.json(
      createSuccessResponse({ success: true })
    );

    // Set a cookie that expires in 24 hours based on provider
    const cookieName = provider === "claude" ? "claude_api_key" : "deepseek_api_key";
    
    response.cookies.set({
      name: cookieName,
      value: apiKey,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Error updating API key", 500),
      { status: 500 }
    );
  }
} 