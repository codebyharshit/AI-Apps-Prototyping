import { NextRequest, NextResponse } from "next/server";
import { deepseekClient, modelMapping } from "@/lib/deepseek";
import { createSuccessResponse, createErrorResponse, handleApiError } from "@/lib/api-utils";

// SystemPrompt for component generation
const SYSTEM_PROMPT = `You are an expert React developer, specializing in creating clean, reusable components. 
Create a React functional component with TypeScript according to the user's specification.
Output ONLY the full React component code with no explanation, comments, or markdown.
Follow these guidelines:
- Use React Hooks where appropriate
- Use modern ES6+ syntax
- Make sure component props have proper TypeScript interfaces
- Make the component fully functional and standalone
- Use proper import statements for any dependencies
- Export the component as default
- Create a clean, minimal design that is responsive
- The component should render with the provided props (with defaults if applicable)

The code MUST be wrapped in a render function call like this:
render(() => <YourComponent prop1="value1" />);

Remember, output ONLY the complete React component code.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, componentType = "generic" } = await request.json();

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        createErrorResponse("Missing required input: prompt", 400),
        { status: 400 }
      );
    }

    const enhancedPrompt = `Create a ${componentType} component with the following specification: ${prompt}`;

    // Call DeepSeek API for component generation
    const response = await deepseekClient.createChatCompletion({
      model: modelMapping["gpt-4o-mini"],
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: enhancedPrompt }
      ],
      temperature: 0.7,
    });

    const generatedCode = response.choices[0]?.message?.content || "";

    return NextResponse.json(
      createSuccessResponse({
        code: generatedCode,
        componentType,
        prompt
      })
    );
  } catch (error: any) {
    console.error("Error in component generation:", error);
    return handleApiError(error);
  }
} 