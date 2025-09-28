import { NextRequest, NextResponse } from "next/server";
import { deepseekClient, modelMapping } from "@/lib/deepseek";

interface ComponentRequirements {
  idea: string;
  componentType: string;
  features: string[];
  styling: string;
  targetAudience: string;
  additionalNotes: string;
}

export async function POST(request: NextRequest) {
  try {
    const requirements: ComponentRequirements = await request.json();

    // Validate required fields
    if (!requirements.idea) {
      return NextResponse.json(
        { error: "Missing required input: idea" },
        { status: 400 }
      );
    }

    // Create a comprehensive prompt from the requirements
    const prompt = `
Component Idea: ${requirements.idea}
Component Type: ${requirements.componentType}

Key Features: ${requirements.features.length > 0 ? requirements.features.join(', ') : 'None specified'}

Styling Preferences: ${requirements.styling || 'Not specified'}

Target Audience: ${requirements.targetAudience || 'General users'}

Additional Notes: ${requirements.additionalNotes || 'None'}
    `.trim();

    const systemPrompt = `You are an expert frontend developer specializing in creating clean, modern HTML and CSS components.

CRITICAL REQUIREMENTS:
- Generate ONLY HTML and CSS code
- NO JavaScript, NO React, NO frameworks
- Use modern CSS with flexbox/grid layouts
- Make it responsive and mobile-friendly
- Use semantic HTML elements
- Include proper accessibility attributes
- Use modern CSS features like CSS Grid, Flexbox, and CSS Custom Properties
- Create clean, maintainable code with proper comments

FORMAT REQUIREMENTS:
- Start with HTML code wrapped in <!DOCTYPE html>
- Include a complete HTML structure with head and body
- Add CSS in a <style> tag in the head
- Use descriptive class names
- Include proper meta tags for responsiveness
- Make sure the component is self-contained and can be embedded

STYLING GUIDELINES:
- Use modern design principles
- Implement the specified theme and color scheme
- Ensure proper spacing and typography
- Make it visually appealing and professional
- Use CSS variables for consistent theming
- Include hover states and transitions where appropriate

ACCESSIBILITY:
- Use semantic HTML elements
- Include proper ARIA labels where needed
- Ensure proper color contrast
- Make it keyboard navigable
- Include focus states

RESPONSIVE DESIGN:
- Use mobile-first approach
- Include media queries for different screen sizes
- Ensure the component works on all devices
- Test for different viewport sizes

OUTPUT FORMAT:
- Return ONLY the complete HTML document with embedded CSS
- No explanations, no markdown, no code blocks
- Start immediately with <!DOCTYPE html>
- End with </html>

The component should be a complete, standalone HTML file that can be opened in any browser.`;

    const response = await deepseekClient.createChatCompletion({
      model: modelMapping["gpt-4o-mini"],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const generatedCode = response.choices[0]?.message?.content || "";

    // Clean the generated code
    let cleanedCode = generatedCode.trim();
    
    // Remove any markdown formatting
    cleanedCode = cleanedCode.replace(/```html|```css|```/g, "").trim();
    
    // Remove any descriptive text before the HTML
    const htmlStartIndex = cleanedCode.indexOf("<!DOCTYPE html");
    if (htmlStartIndex > 0) {
      cleanedCode = cleanedCode.substring(htmlStartIndex);
    }
    
    // Remove any content after the closing </html> tag
    const htmlEndIndex = cleanedCode.lastIndexOf("</html>");
    if (htmlEndIndex !== -1) {
      cleanedCode = cleanedCode.substring(0, htmlEndIndex + 7);
    }

    // Validate that we have a complete HTML document
    if (!cleanedCode.includes("<!DOCTYPE html") || !cleanedCode.includes("</html>")) {
      throw new Error("Generated code is not a complete HTML document");
    }

    return NextResponse.json({
      html: cleanedCode,
      requirements: requirements,
    });
  } catch (error: any) {
    console.error("Error generating HTML/CSS:", error);

    return NextResponse.json(
      {
        error: "Error generating HTML/CSS",
        details: error.message,
      },
      { status: 500 }
    );
  }
} 