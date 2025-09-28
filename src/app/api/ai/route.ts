import { NextRequest, NextResponse } from "next/server";
import { deepseekClient, modelMapping } from "@/lib/deepseek";
import { handleApiError, createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

// Add OpenAI for vision capabilities
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 === AI API ROUTE CALLED ===");
    
    // Parse the request body
    const body = await request.json();
    const { systemPrompt, userInputs = [], imageData = [], preferredProvider = "deepseek" } = body;

    console.log("📥 Request received:");
    console.log("  - System Prompt:", systemPrompt);
    console.log("  - User Inputs:", userInputs);
    console.log("  - Image Data Count:", imageData.length);
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

    // Check if Claude is preferred and we have images
    if (preferredProvider === "claude" && imageData.length > 0) {
      console.log(`Processing ${imageData.length} images with Claude Vision`);
      
      try {
        // Route to Claude API for image processing
        const claudeResponse = await fetch(`${request.nextUrl.origin}/api/ai/claude`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemPrompt,
            userInputs,
            imageData,
            useStructuredOutput: body.useStructuredOutput,
            jsonSchema: body.jsonSchema
          }),
        });

        if (!claudeResponse.ok) {
          throw new Error(`Claude API error: ${claudeResponse.status}`);
        }

        const claudeData = await claudeResponse.json();
        return NextResponse.json(claudeData);
      } catch (error) {
        console.error("Claude Vision API error:", error);
        // Fall through to other options
      }
    }

    // If we have images and OpenAI API key, use OpenAI Vision
    if (imageData.length > 0 && OPENAI_API_KEY) {
      console.log(`Processing ${imageData.length} images with OpenAI Vision`);
      
      try {
        // Prepare content for OpenAI Vision API
        const content: Array<{type: "text", text: string} | {type: "image_url", image_url: {url: string}}> = [
          {
            type: "text" as const,
            text: userInputs.join('\n') || "Please analyze this image."
          }
        ];

        // Add images to content
        imageData.forEach((image: string) => {
          content.push({
            type: "image_url" as const,
            image_url: {
              url: image
            }
          });
        });

        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content }
            ],
            max_tokens: 1000
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        
        return NextResponse.json(
          createSuccessResponse({
            response: openaiData.choices[0]?.message?.content || "Could not analyze the image",
            model: "gpt-4-vision-preview",
            provider: "OpenAI"
          })
        );
      } catch (error) {
        console.error("OpenAI Vision API error:", error);
        // Fall through to the helpful message below
      }
    }

    // Note about image content - provide a more helpful response
    if (imageData.length > 0) {
      console.log(`Received ${imageData.length} images for processing`);
      
      // Since DeepSeek doesn't support images, provide a helpful response
      return NextResponse.json(
        createSuccessResponse({
          response: `I can see that you've uploaded ${imageData.length} image(s), but I'm currently using DeepSeek API which doesn't support image analysis. 

To enable image processing, you would need to:
1. Add an OPENAI_API_KEY environment variable to use GPT-4 Vision
2. Switch to Google Gemini Vision API  
3. Use Claude 3 Vision API
4. Or configure a different vision-capable AI model

For now, could you please describe what's in the image(s) and I'll help you with text-based analysis?`,
        })
      );
    }

    // Check if Claude is preferred for text processing
    if (preferredProvider === "claude" && imageData.length === 0) {
      console.log(`Routing text request to Claude API`);
      
      try {
        // Route to Claude API for text processing
        const claudeResponse = await fetch(`${request.nextUrl.origin}/api/ai/claude`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemPrompt,
            userInputs,
            imageData,
            useStructuredOutput: body.useStructuredOutput,
            jsonSchema: body.jsonSchema
          }),
        });

        if (!claudeResponse.ok) {
          throw new Error(`Claude API error: ${claudeResponse.status}`);
        }

        const claudeData = await claudeResponse.json();
        return NextResponse.json(claudeData);
      } catch (error) {
        console.error("Claude API error:", error);
        // Fall through to DeepSeek
        console.log("Falling back to DeepSeek API");
      }
    }

    // Prepare messages for Deepseek API
    const messages = [{ role: "system", content: systemPrompt }];

    // Check if this is a structured output request
    const useStructuredOutput = body.useStructuredOutput;
    const jsonSchema = body.jsonSchema;

    if (useStructuredOutput && jsonSchema) {
      console.log("🔧 === STRUCTURED OUTPUT REQUEST ===");
      console.log("📋 JSON Schema:", JSON.stringify(jsonSchema, null, 2));
      
      // Enhance system prompt for structured output
      const structuredSystemPrompt = `${systemPrompt}

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
      
      messages[0] = { role: "system", content: structuredSystemPrompt };
      console.log("🤖 Enhanced system prompt for structured output:", structuredSystemPrompt);
    }

    // Deepseek doesn't support multiple content types in the same message like OpenAI
    // So we need to concatenate all user inputs into a single message
    let userContent = "";
    
    // Add text content
    for (const userInput of userInputs) {
      userContent += userInput + "\n";
    }
    
    messages.push({
      role: "user",
      content: userContent.trim()
    });

    console.log("🤖 Preparing DeepSeek API call:");
    console.log("  - Model:", modelMapping["gpt-4o-mini"]);
    console.log("  - Messages:", JSON.stringify(messages, null, 2));
    console.log("  - User Content Length:", userContent.length);

    // Use Deepseek model instead of OpenAI
    console.log("📡 Calling DeepSeek API...");
    const response = await deepseekClient.createChatCompletion({
      model: modelMapping["gpt-4o-mini"], // Use the mapped model
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log("✅ DeepSeek API response received:");
    console.log("  - Response Content:", response.choices[0]?.message?.content);
    console.log("  - Full Response:", JSON.stringify(response, null, 2));

    // Return the AI response
    const aiResponse = response.choices[0]?.message?.content || "No response generated";
    console.log("📤 Sending response back to client:", aiResponse);
    
    // Handle structured output parsing
    if (useStructuredOutput && jsonSchema) {
      console.log("🔧 === PARSING STRUCTURED OUTPUT ===");
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
            structuredData: parsedResponse
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
                structuredData: parsedResponse
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
            error: "Failed to parse structured JSON response"
          })
        );
      }
    }
    
    return NextResponse.json(
      createSuccessResponse({
        response: aiResponse,
      })
    );
  } catch (error: any) {
    console.error("❌ === AI API ERROR ===");
    console.error("Error calling Deepseek API:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    const errorResponse = handleApiError(error);
    console.error("Error response being sent:", errorResponse);
    
    // Return an appropriate error response
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.status || 500 }
    );
  }
}
