import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

const PROTOTYPE_SYSTEM_PROMPT = `You are an expert UI/UX designer and prototype generator. Given a user's natural language description, you will generate a complete prototype specification.

Your response must be a valid JSON object with this exact structure:
{
  "title": "Prototype Title",
  "description": "Brief description",
  "components": [
    {
      "id": "unique-id",
      "type": "ComponentType",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 200, "height": 40 },
      "properties": {
        "text": "Button Text",
        "variant": "default"
      },
      "frameId": "frame-1"
    }
  ],
  "frames": [
    {
      "id": "frame-1",
      "position": { "x": 50, "y": 50 },
      "size": { "width": 400, "height": 600 },
      "label": "Main Screen"
    }
  ],
  "aiFunctionalities": [
    {
      "id": "ai-func-1",
      "triggerComponentId": "button-1",
      "outputComponentId": "output-1",
      "systemPrompt": "AI system prompt",
      "inputComponentIds": ["input-1"]
    }
  ]
}

Available component types: Button, Input, Textarea, Card, Select, DataTable, Chatbot, AIOutput, AIComponentRenderer, TextOutput, FileUploader, ImageUpload

Component positioning guidelines:
- Frame size should accommodate all components
- Leave 20px margins around frame edges
- Stack components vertically with 10-20px spacing
- Place related components near each other
- Buttons typically 120x40, inputs 200x40, cards can be larger

For AI functionalities:
- Always include relevant AI workflows
- Use descriptive system prompts
- Connect inputs to outputs logically
- Make interactions intuitive

Generate a complete, functional prototype that fulfills the user's request.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        createErrorResponse("Prompt is required", 400),
        { status: 400 }
      );
    }

    // Get API key from cookie or environment
    const cookieApiKey = request.cookies.get("deepseek_api_key")?.value;
    const apiKey = cookieApiKey || process.env.DEEP_SEEK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        createErrorResponse("AI API key not configured", 500),
        { status: 500 }
      );
    }

    // Call DeepSeek API for prototype generation
    const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: PROTOTYPE_SYSTEM_PROMPT },
          { role: "user", content: `Create a prototype for: ${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.json();
      throw new Error(`DeepSeek API error: ${errorData.error?.message || deepseekResponse.status}`);
    }

    const data = await deepseekResponse.json();
    const responseContent = data.choices[0].message.content;

    // Parse the JSON response
    let prototypeSpec;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
      prototypeSpec = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse prototype JSON:", responseContent);
      
      // Fallback: Generate a simple prototype structure
      prototypeSpec = {
        title: "Generated Prototype",
        description: "Prototype generated from prompt",
        components: [
          {
            id: "welcome-text",
            type: "Card",
            position: { x: 70, y: 70 },
            size: { width: 260, height: 100 },
            properties: {
              title: "Welcome",
              content: "Your prototype is being generated. Please refine your prompt for better results."
            },
            frameId: "frame-1"
          }
        ],
        frames: [
          {
            id: "frame-1",
            position: { x: 50, y: 50 },
            size: { width: 400, "height": 300 },
            label: "Main"
          }
        ],
        aiFunctionalities: []
      };
    }

    // Validate and ensure required fields
    if (!prototypeSpec.components) prototypeSpec.components = [];
    if (!prototypeSpec.frames) prototypeSpec.frames = [];
    if (!prototypeSpec.aiFunctionalities) prototypeSpec.aiFunctionalities = [];

    // Ensure frame IDs are consistent
    prototypeSpec.components.forEach((component: any, index: number) => {
      if (!component.id) component.id = `component-${index}`;
      if (!component.frameId && prototypeSpec.frames.length > 0) {
        component.frameId = prototypeSpec.frames[0].id;
      }
    });

    return NextResponse.json(
      createSuccessResponse(prototypeSpec)
    );

  } catch (error: any) {
    console.error("Error generating prototype:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Failed to generate prototype", 500),
      { status: 500 }
    );
  }
} 