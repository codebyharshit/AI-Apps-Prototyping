import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 === CLAUDE CHAT API ROUTE CALLED ===");
    
    // Get API key from cookie or environment variable
    const cookieApiKey = request.cookies.get("claude_api_key")?.value;
    const envApiKey = process.env.CLAUDE_API_KEY;
    const apiKey = cookieApiKey || envApiKey;

    if (!apiKey) {
      console.error("❌ No Claude API key found");
      return NextResponse.json(
        createErrorResponse("Claude API key not configured. Please add it in settings.", 400),
        { status: 400 }
      );
    }

    const body = await request.json();
    const { systemPrompt, messages, model = "claude-3-5-sonnet-20241022" } = body;

    console.log("📥 Claude Chat Request received:");
    console.log("  - System Prompt:", systemPrompt);
    console.log("  - Messages Count:", messages?.length || 0);
    console.log("  - Model:", model);

    // Validate inputs
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        createErrorResponse("Missing or invalid messages array", 400),
        { status: 400 }
      );
    }

    // Prepare messages for Claude API
    let claudeMessages = [...messages];
    
    // If systemPrompt is provided and first message isn't a system message,
    // add the system prompt as the first message
    if (systemPrompt && 
        (messages.length === 0 || messages[0].role !== 'system')) {
      claudeMessages.unshift({ role: 'system', content: systemPrompt });
    }

    try {
      console.log("📡 Calling Claude Chat API...");
      console.log("  - Model:", model);
      console.log("  - Messages:", JSON.stringify(claudeMessages, null, 2));

      // Call Claude API
      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          messages: claudeMessages,
          temperature: 0.7
        })
      });

      if (!claudeResponse.ok) {
        const errorData = await claudeResponse.json();
        throw new Error(`Claude API error: ${errorData.error?.message || claudeResponse.status}`);
      }

      const data = await claudeResponse.json();
      console.log("✅ Claude Chat API response received:", data);
      
      // Return the AI response
      return NextResponse.json(
        createSuccessResponse({
          response: data.content?.[0]?.text || "No response generated",
          model: data.model || model,
          provider: "Claude",
          usage: data.usage
        })
      );
    } catch (error: any) {
      // If Claude API is unavailable or key is missing, fall back to a helpful message
      console.warn("Claude API call failed, falling back to helpful message:", error);
      
      const lastUserMessage = claudeMessages.filter(m => m.role === 'user').pop()?.content || "";
      
      // Simple fallback response
      const fallbackResponse = `I'm sorry, I couldn't process your request: "${lastUserMessage}" at this time. The Claude AI service is currently unavailable. Please check your API key or try again later.`;
      
      return NextResponse.json(
        createSuccessResponse({
          response: fallbackResponse,
          fallback: true,
          error: error.message,
          provider: "Claude"
        })
      );
    }
  } catch (error: any) {
    console.error("❌ === CLAUDE CHAT API ERROR ===");
    console.error("Error in Claude chat:", error);
    
    return NextResponse.json(
      createErrorResponse(error.message || "Error processing Claude chat request", 500),
      { status: 500 }
    );
  }
}

