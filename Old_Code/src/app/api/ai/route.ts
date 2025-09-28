import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { systemPrompt, userInputs = [], imageData = [] } = body;

    // Validate required fields
    if (!systemPrompt || (userInputs.length === 0 && imageData.length === 0)) {
      return NextResponse.json(
        { error: "Missing required input: need either text or image data" },
        { status: 400 }
      );
    }

    // Prepare messages for OpenAI API
    const messages = [{ role: "system", content: systemPrompt }];

    const userMessage: any = {
      role: "user",
      content: [],
    };

    // Add text content
    for (const userInput of userInputs) {
      userMessage.content.push({
        type: "text",
        text: userInput,
      });
    }

    // Add image content
    for (const imageUrl of imageData) {
      userMessage.content.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      });
    }

    messages.push(userMessage);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      // temperature: 0.7,
      // max_tokens: 1000,
    });

    // Return the AI response
    return NextResponse.json({
      response:
        response.choices[0]?.message?.content || "No response generated",
    });
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);

    // Return an appropriate error response
    return NextResponse.json(
      {
        error: "Error processing AI request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
