import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

// Replace with your actual DeepSeek API key
const DEEPSEEK_API_KEY = process.env.DEEP_SEEK_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    // Get API key from cookie (if available)
    const cookieApiKey = request.cookies.get("deepseek_api_key")?.value;
    const apiKey = cookieApiKey || DEEPSEEK_API_KEY;

    const body = await request.json();
    const { systemPrompt, messages } = body;

    // Validate inputs
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        createErrorResponse("Missing or invalid messages array", 400),
        { status: 400 }
      );
    }

    // Prepare messages for DeepSeek (ensure system prompt is first)
    let deepseekMessages = [...messages];
    
    // If systemPrompt is provided and first message isn't a system message,
    // add the system prompt as the first message
    if (systemPrompt && 
        (messages.length === 0 || messages[0].role !== 'system')) {
      deepseekMessages.unshift({ role: 'system', content: systemPrompt });
    }

    try {
      // Verify we have an API key
      if (!apiKey) {
        throw new Error("DeepSeek API key not configured");
      }

      // Call DeepSeek API
      const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat", // or your preferred model
          messages: deepseekMessages,
          temperature: 0.7
        })
      });

      if (!deepseekResponse.ok) {
        const errorData = await deepseekResponse.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || deepseekResponse.status}`);
      }

      const data = await deepseekResponse.json();
      
      // Return the AI response
      return NextResponse.json(
        createSuccessResponse({
          response: data.choices[0].message.content,
          model: data.model,
          usage: data.usage
        })
      );
    } catch (error: any) {
      // If DeepSeek API is unavailable or key is missing, fall back to the simulator
      console.warn("DeepSeek API call failed, falling back to simulator:", error);
      
      // Fallback to simulator-like behavior
      const lastUserMessage = deepseekMessages.filter(m => m.role === 'user').pop()?.content || "";
      
      // Simple fallback response
      const fallbackResponse = `I'm sorry, I couldn't process your request: "${lastUserMessage}" at this time. The AI service is currently unavailable.`;
      
      return NextResponse.json(
        createSuccessResponse({
          response: fallbackResponse,
          fallback: true,
          error: error.message
        })
      );
    }
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    
    return NextResponse.json(
      createErrorResponse(error.message || "Error processing request", 500),
      { status: 500 }
    );
  }
} 