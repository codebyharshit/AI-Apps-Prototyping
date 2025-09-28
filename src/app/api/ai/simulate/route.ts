import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-utils";

// Sample responses for simulation
const sampleResponses = {
  insurance: [
    "Based on your current coverage plan, we recommend upgrading to our Premium Plus package which includes extended coverage for natural disasters.",
    "Your current policy covers standard home damage, but excludes flooding and earthquakes. Would you like information on our additional coverage options?",
    "I've checked your policy details. You're eligible for a 15% discount if you bundle your home and auto insurance together.",
    "For your travel insurance inquiry, we offer three tiers of coverage: Basic, Standard, and Premium. Each provides different levels of medical coverage and trip cancellation benefits."
  ],
  general: [
    "I'm here to assist you with any questions you might have about our services.",
    "Thank you for your query. Let me look into that for you.",
    "I'd be happy to provide more information about our offerings.",
    "Is there anything specific you'd like to know about our company?"
  ]
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { prompt, userInput, systemPrompt, context, parameters, messages } = body;
    let effectivePrompt = prompt || userInput;

    // If messages array is provided, use the latest user message
    if (Array.isArray(messages) && messages.length > 0) {
      // Find the last user message
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        effectivePrompt = lastUserMsg.content;
      }
    }

    // Validate that a prompt was provided
    if (!effectivePrompt) {
      return NextResponse.json(
        createErrorResponse("Missing required input: prompt", 400),
        { status: 400 }
      );
    }

    // Combine systemPrompt and prompt for context
    const combinedPrompt = systemPrompt
      ? `${systemPrompt} \nUser: ${effectivePrompt}`
      : effectivePrompt;

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Randomly select a response based on user input
    const responsePool = combinedPrompt.toLowerCase().includes("insurance") || combinedPrompt.toLowerCase().includes("policy")
      ? sampleResponses.insurance
      : sampleResponses.general;
    
    const responseIndex = Math.floor(Math.random() * responsePool.length);
    const simulatedResponse = responsePool[responseIndex];

    // Return the simulated response
    return NextResponse.json(
      createSuccessResponse({
        response: simulatedResponse,
        context: context || {},
        parameters: parameters || {}
      })
    );
  } catch (error: any) {
    console.error("Error in simulation:", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    // Return an appropriate error response
    return NextResponse.json(
      createErrorResponse(error.message || "Error processing simulation request", 500),
      { status: 500 }
    );
  }
} 