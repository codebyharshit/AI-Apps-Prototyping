import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 === CLAUDE API ROUTE CALLED ===");
    
    // Parse the request body
    const body = await request.json();
    const { systemPrompt, userInputs = [], imageData = [], model = "claude-3-5-sonnet-20241022" } = body;

    console.log("📥 Claude Request received:");
    console.log("  - System Prompt:", systemPrompt);
    console.log("  - User Inputs:", userInputs);
    console.log("  - Image Data Count:", imageData.length);
    console.log("  - Model:", model);
    console.log("  - Full Request Body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!systemPrompt || (userInputs.length === 0 && imageData.length === 0)) {
      console.error("❌ Validation failed: Missing required input");
      return NextResponse.json(
        createErrorResponse("Missing required input: need either text or image data", 400),
        { status: 400 }
      );
    }

    console.log("✅ Request validation passed");

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

    // Check if this is a structured output request
    const useStructuredOutput = body.useStructuredOutput;
    const jsonSchema = body.jsonSchema;

    // Prepare messages for Claude API
    const messages = [{ role: "user", content: [] }];

    // Add text content
    if (userInputs.length > 0) {
      const textContent = userInputs.join('\n');
      messages[0].content.push({
        type: "text",
        text: textContent
      });
    }

    // Add image content if available
    if (imageData.length > 0) {
      imageData.forEach((image: string) => {
        // Convert data URL to base64 if needed
        let imageData = image;
        if (image.startsWith('data:image/')) {
          // Extract base64 data from data URL
          const base64Data = image.split(',')[1];
          imageData = base64Data;
        }
        
        messages[0].content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg", // Default to JPEG, could be made configurable
            data: imageData
          }
        });
      });
    }

    // Add system message if provided
    let systemMessage = systemPrompt;
    if (useStructuredOutput && jsonSchema) {
      systemMessage = `${systemPrompt}

IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
${JSON.stringify(jsonSchema, null, 2)}

CRITICAL REQUIREMENTS:
1. Start your response with { and end with }
2. Do NOT wrap your response in json{}, markdown, or any other formatting
3. Do NOT include any explanations, text, or formatting outside the JSON
4. Use proper JSON syntax with double quotes for strings
5. Your response must be parseable by JSON.parse()

Example of CORRECT format:
{
  "rows": [
    {
      "Answer": "Your formatted answer here"
    }
  ]
}

Example of INCORRECT format:
json{
  "rows": [
    {
      "Answer": "Your formatted answer here"
    }
  ]
}`;
    }

    // Call Claude API
    console.log("📡 Calling Claude API...");
    console.log("  - Model:", model);
    console.log("  - Messages:", JSON.stringify(messages, null, 2));

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
        messages: [
          { role: "system", content: systemMessage },
          ...messages
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("❌ Claude API error:", errorText);
      throw new Error(`Claude API error: ${claudeResponse.status} ${errorText}`);
    }

    const data = await claudeResponse.json();
    console.log("✅ Claude API response received:", data);

    const aiResponse = data.content?.[0]?.text || "No response generated";
    console.log("📤 Sending Claude response back to client:", aiResponse);

    // Handle structured output parsing
    if (useStructuredOutput && jsonSchema) {
      console.log("🔧 === PARSING CLAUDE STRUCTURED OUTPUT ===");
      try {
        // Clean the response - remove json{...} wrapper if present
        let cleanResponse = aiResponse.trim();
        
        // Check if response is wrapped in json{...}
        if (cleanResponse.startsWith('json{') && cleanResponse.endsWith('}')) {
          cleanResponse = cleanResponse.slice(5, -1); // Remove json{ and }
          console.log("🧹 Cleaned json{} wrapper, extracted:", cleanResponse);
        }
        
        // Try to parse the response as JSON
        const parsedResponse = JSON.parse(cleanResponse);
        console.log("✅ Successfully parsed structured JSON:", parsedResponse);
        
        return NextResponse.json(
          createSuccessResponse({
            response: aiResponse,
            structuredData: parsedResponse,
            model: model,
            provider: "Claude"
          })
        );
      } catch (parseError) {
        console.error("❌ Failed to parse structured JSON:", parseError);
        console.log("📝 Raw response that failed to parse:", aiResponse);
        
        // Try alternative parsing methods
        try {
          // Try to extract JSON from markdown code blocks
          const codeBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            const extractedJson = codeBlockMatch[1];
            console.log("🔍 Extracted JSON from code block:", extractedJson);
            const parsedResponse = JSON.parse(extractedJson);
            console.log("✅ Successfully parsed JSON from code block:", parsedResponse);
            
            return NextResponse.json(
              createSuccessResponse({
                response: aiResponse,
                structuredData: parsedResponse,
                model: model,
                provider: "Claude"
              })
            );
          }
        } catch (codeBlockError) {
          console.error("❌ Failed to parse JSON from code block:", codeBlockError);
        }
        
        // Return the raw response as fallback
        return NextResponse.json(
          createSuccessResponse({
            response: aiResponse,
            error: "Failed to parse structured JSON response",
            model: model,
            provider: "Claude"
          })
        );
      }
    }

    return NextResponse.json(
      createSuccessResponse({
        response: aiResponse,
        model: model,
        provider: "Claude"
      })
    );
  } catch (error: any) {
    console.error("❌ === CLAUDE API ERROR ===");
    console.error("Error calling Claude API:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      createErrorResponse(error.message || "Error calling Claude API", 500),
      { status: 500 }
    );
  }
}

