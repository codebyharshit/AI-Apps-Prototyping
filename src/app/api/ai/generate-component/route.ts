import { NextRequest, NextResponse } from "next/server";
import { deepseekClient, modelMapping } from "@/lib/deepseek";

// Helper function to fix common syntax errors in generated code
const fixCommonSyntaxErrors = (code: string): string => {
  let fixedCode = code;
  
  // Remove any descriptive text before the component code
  // Remove common descriptive patterns at the beginning
  fixedCode = fixedCode.replace(/^[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/i, '');
  
  // Remove lines that start with descriptive text patterns
  fixedCode = fixedCode.replace(/^(Create|Here's|This is|Building|Making|Let me create|I'll create|Generate)[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
  
  // Remove markdown-style text like "**Input Fields:**" etc.
  fixedCode = fixedCode.replace(/^\*\*[^*]+\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
  
  // Remove bullet points and descriptions
  fixedCode = fixedCode.replace(/^[\s\S]*?(?:- [^\n]*\n)*(?=const\s+\w+\s*=|function\s+\w+)/im, '');
  
  // Look for the first occurrence of "const " and remove everything before it as fallback
  const constMatch = fixedCode.match(/const\s+\w+\s*=/);
  if (constMatch) {
    const constIndex = fixedCode.indexOf(constMatch[0]);
    if (constIndex > 0) {
      fixedCode = fixedCode.substring(constIndex);
    }
  }
  
  // Fix incomplete className strings with double braces
  fixedCode = fixedCode.replace(/bg-opacity}}/g, 'bg-opacity-50');
  fixedCode = fixedCode.replace(/opacity}}/g, 'opacity-50');
  
  // Fix incomplete JSX tags
  fixedCode = fixedCode.replace(/className="[^"]*}}$/gm, (match) => {
    const cleanMatch = match.replace(/}}$/, '');
    return cleanMatch + (cleanMatch.endsWith('"') ? '' : '"');
  });
  
  // Fix incomplete div tags at the end
  fixedCode = fixedCode.replace(/<div className="[^"]*}}\s*$/gm, (match) => {
    const cleanMatch = match.replace(/}}\s*$/, '');
    return cleanMatch + '"></div>';
  });
  
  // Ensure proper closing of JSX elements
  const openTags = (fixedCode.match(/<[^/][^>]*[^/]>/g) || []).length;
  const closeTags = (fixedCode.match(/<\/[^>]+>/g) || []).length;
  
  // Add missing closing div tags if needed
  if (openTags > closeTags) {
    const missingTags = openTags - closeTags;
    for (let i = 0; i < missingTags; i++) {
      fixedCode += '\n        </div>';
    }
  }
  
  return fixedCode;
};

// Helper function to validate and complete JSX structure
const validateAndCompleteJSX = (code: string): string => {
  let validatedCode = code;
  
  // Count opening and closing braces
  const openBraces = (validatedCode.match(/{/g) || []).length;
  const closeBraces = (validatedCode.match(/}/g) || []).length;
  
  // Add missing closing braces
  if (openBraces > closeBraces) {
    const diff = openBraces - closeBraces;
    validatedCode += '}'.repeat(diff);
  }
  
  // Count opening and closing parentheses
  const openParens = (validatedCode.match(/\(/g) || []).length;
  const closeParens = (validatedCode.match(/\)/g) || []).length;
  
  // Add missing closing parentheses
  if (openParens > closeParens) {
    const diff = openParens - closeParens;
    validatedCode += ')'.repeat(diff);
  }
  
  // Ensure the code ends properly
  if (!validatedCode.trim().endsWith(';') && !validatedCode.trim().endsWith('}')) {
    validatedCode += ';';
  }
  
  return validatedCode;
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, componentType } = await request.json();

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: "Missing required input: prompt" },
        { status: 400 }
      );
    }

    // Create system prompt based on component type
    let systemPrompt = `You are an AI assistant that generates React component code based on user descriptions.
Generate a React functional component for a ${componentType || "UI"} component. 

CRITICAL FORMATTING REQUIREMENTS - READ CAREFULLY:
- NEVER INCLUDE ANY TEXT BEFORE THE COMPONENT CODE
- NEVER write "Create a React component called..." or "Here's a..." or ANY descriptive text
- NEVER include explanatory paragraphs, bullet points, or markdown formatting
- NEVER include phrases like "**Input Fields:**" or "**Submit Button:**" 
- NEVER include project descriptions or feature lists
- YOUR FIRST LINE MUST BE: const ComponentName = ...
- DO NOT include any import statements as we will provide all necessary components.
- DO NOT export the component.
- DO NOT include comments within the code.
- Focus on using only these components in your code: React, useState, useEffect, Button, Input, Textarea, Label, Checkbox.
- CRITICAL: For components that display external content, you MUST use useEffect to update when the content prop changes.
- Your code MUST be complete with no syntax errors.
- Always provide matching closing brackets for every opening bracket.
- Always provide matching closing parentheses for every opening parenthesis.
- Always close all JSX tags properly.
- Ensure all arrow functions have properly formatted return statements.
- The component should be a complete, standalone functional component.
- End all statements with semicolons where appropriate.
- Use inline styles with the style={{}} prop or className for styling.
- You may use React hooks like useState and useEffect.
- CRITICAL: Complete all JSX elements - never leave tags incomplete.
- CRITICAL: Complete all className strings - never leave them with hanging quotes or braces.
- MOST IMPORTANT: You MUST include a render() function call at the end of the code that renders your component, like this: render(<ComponentName />);

ABSOLUTELY NO DESCRIPTIVE TEXT - COMPONENT CODE ONLY!

CRITICAL ID GENERATION REQUIREMENTS - THIS IS MANDATORY:
- EVERY SINGLE Input, Button, Textarea, Checkbox, and output div MUST have a unique id attribute
- Use descriptive, meaningful IDs that indicate the component's purpose
- ID format should be: componentType-purpose (e.g., "input-user-text", "button-submit-data", "output-response-display")
- EXAMPLES YOU MUST FOLLOW:
  * <Input id="input-user-text" placeholder="Enter text" />
  * <Button id="button-submit-data" onClick={handleSubmit}>Submit</Button>
  * <div id="output-response-display" className="output-area">
  * <Textarea id="textarea-user-message" placeholder="Message" />
- NO COMPONENT WITHOUT AN ID: Every interactive element needs an id
- OUTPUT AREAS: Use IDs like "output-", "result-", "display-", "response-"
- INPUT AREAS: Use IDs like "input-", "field-", "entry-"  
- BUTTONS: Use IDs like "button-", "btn-", "action-"
- These IDs are CRITICAL for the AI system to work - without them, components cannot be selected!

IMPORTANT: For input elements, make sure they handle both external and internal state properly:
- Check if external value/onChange props are provided
- Use external props when available, fall back to internal state when not
- This pattern prevents controlled/uncontrolled component conflicts

CRITICAL FOR OUTPUT COMPONENTS: When generating ${componentType} components, you MUST follow these rules:
- ALWAYS display the currentContent in a prominent, visible area
- Use proper conditional rendering to show content when available
- Make the content area clearly distinguishable and well-styled
- Handle empty states gracefully with placeholder text
- For text content, use proper formatting and styling
- Make sure the content area takes up significant space and is easily readable

IMPORTANT: For output elements, make sure they handle external content properly:
- Check if external content props are provided
- Display external content when available, fall back to internal state when not
- For text outputs, use the content prop to display text
- For components that show data, check for external content first
- Use appropriate formatting for displaying text responses
- Make the output area clearly visible and readable
- CRITICAL: The output area should be the main focus of the component when content is available`;

    // Add special instructions for Display/Output components
    if (componentType === 'Display' || componentType === 'Output') {
      systemPrompt += `

SPECIAL INSTRUCTIONS FOR DISPLAY/OUTPUT COMPONENTS:
- The primary purpose is to show content passed from external sources
- Make the content display area the largest and most prominent part
- Use good typography and spacing for readability
- Handle both plain text and formatted content
- Show loading states when content is "Loading..."
- Always make the currentContent visible when it exists
- Use conditional rendering: {currentContent && <div>...</div>}
- Style the content area with proper padding, borders, and background`;
    }

    systemPrompt += `

The component should follow this exact structure (simplified for React Live compatibility):
const ComponentName = (props) => {
  const { className = '', value: externalValue, onChange: externalOnChange, content } = props || {};
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const [internalContent, setInternalContent] = useState(content || '');
  
  // Use external value if provided, otherwise use internal state
  const currentValue = externalValue !== undefined ? externalValue : internalValue;
  
  // Use external content if provided, otherwise use internal content
  const currentContent = content !== undefined ? content : internalContent;
  
  // Update internal content when external content changes
  useEffect(() => {
    if (content !== undefined) {
      setInternalContent(content);
    }
  }, [content]);
  
  // Use external onChange if provided, otherwise use internal handler
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (externalOnChange) {
      externalOnChange(e);
    } else {
      setInternalValue(newValue);
    }
  };
  
  return (
    <div className={className}>`;

    // Add component-specific JSX based on type
    if (componentType === 'Input' || componentType === 'Form') {
      systemPrompt += `
      {/* For input components - ALWAYS include unique IDs */}
      <Input 
        id="input-main-field"
        value={currentValue} 
        onChange={handleChange}
        placeholder="Enter text here..."
      />`;
    }
    
    if (componentType === 'Output' || componentType === 'Display') {
      systemPrompt += `
      {/* For output components - display the content with proper styling and ID */}
      <div id="output-main-display" className="output-area p-4 border rounded-md bg-gray-50 min-h-[100px] w-full">
        <div className="text-sm text-gray-600 mb-2">Output:</div>
        <div className="text-base whitespace-pre-wrap">
          {currentContent || "Output will appear here..."}
        </div>
      </div>`;
    }

    systemPrompt += `
      
      {/* Adapt based on whether this is input, output, or mixed component */}
      {/* REMEMBER: Every Button, Input, Textarea, and output area MUST have a unique ID */}
    </div>
  );
};

render(<ComponentName {...externalProps} />);

EXAMPLES OF PROPER ID USAGE:
- <Input id="input-user-email" placeholder="Email" />
- <Button id="button-submit-form" onClick={handleSubmit}>Submit</Button>
- <Textarea id="textarea-user-message" placeholder="Message" />
- <div id="output-api-response" className="result-area">...</div>

IMPORTANT: Make sure to complete ALL JSX elements and close ALL tags properly. Never leave incomplete elements or strings.
CRITICAL: Your response must START IMMEDIATELY with "const ComponentName" - no text before it.
CRITICAL: For output/display components, ensure the currentContent is ALWAYS visible and properly styled when available.
CRITICAL: EVERY interactive element (Input, Button, Textarea) and output area MUST have a descriptive, unique ID.

IMPORTANT CONTENT PROP HANDLING:
- Always use 'content' (not 'externalContent') in the destructuring
- Always include useEffect to update when content changes
- Always display currentContent in the output area
- The pattern is: const Component = ({ content, ...props }) => { ... }
- NOT: const Component = ({ content: externalContent, ...props }) => { ... }`;

    const response = await deepseekClient.createChatCompletion({
      model: modelMapping["gpt-4o-mini"],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent outputs
      max_tokens: 4000, // Increase token limit to prevent truncation
    });

    const generatedCode = response.choices[0]?.message?.content || "";

    // Extract and clean the generated component code
    let cleanedCode = generatedCode.replace(/```jsx|```tsx|```js|```ts|```/g, "").trim();
    
    // AGGRESSIVE CLEANING: Remove any remaining descriptive text
    // This is the most important step - removing all non-code content
    const codeStartPatterns = [
      /const\s+\w+\s*=/,
      /function\s+\w+\s*\(/,
      /export\s+const\s+\w+\s*=/,
      /export\s+function\s+\w+\s*\(/
    ];
    
    let codeStartIndex = -1;
    for (const pattern of codeStartPatterns) {
      const match = cleanedCode.match(pattern);
      if (match) {
        const index = cleanedCode.indexOf(match[0]);
        if (codeStartIndex === -1 || index < codeStartIndex) {
          codeStartIndex = index;
        }
      }
    }
    
    if (codeStartIndex > 0) {
      console.log(`API: Removing ${codeStartIndex} characters of descriptive text`);
      cleanedCode = cleanedCode.substring(codeStartIndex);
    }
    
    // Additional aggressive cleaning patterns
    cleanedCode = cleanedCode.replace(/^[\s\S]*?Create a React component[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*Input Fields:\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*Submit Button:\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*Output Field:\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*Styling Requirements:\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*Functionality:\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?Make sure all[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    
    console.log(`Final cleaned code length: ${cleanedCode.length} characters`);
    
    // Apply syntax error fixes
    cleanedCode = fixCommonSyntaxErrors(cleanedCode);
    
    // Strip any preview artifacts that may leak into prompt-driven outputs
    cleanedCode = cleanedCode.replace(/\bAI Component Preview\b/g, '');
    cleanedCode = cleanedCode.replace(/\bScroll to see full component\b/g, '');
    cleanedCode = cleanedCode.replace(/\sdata-ai-element="true"/g, '');
    cleanedCode = cleanedCode.replace(/\sdata-element-id="[^"]*"/g, '');
    cleanedCode = cleanedCode.replace(/\sdata-component-id="[^"]*"/g, '');

    // Validate and complete JSX structure
    cleanedCode = validateAndCompleteJSX(cleanedCode);
    
    // Additional validation for specific patterns
    try {
      // Check for basic syntax validity
    const openBraces = (cleanedCode.match(/{/g) || []).length;
    const closeBraces = (cleanedCode.match(/}/g) || []).length;
    
      if (openBraces !== closeBraces) {
        console.warn(`Brace mismatch detected: ${openBraces} open, ${closeBraces} close`);
        // Try to fix it
        if (openBraces > closeBraces) {
          cleanedCode += '}'.repeat(openBraces - closeBraces);
        }
      }
      
      // CRITICAL: Ensure there's ALWAYS a render call for all components
      if (!cleanedCode.includes('render(')) {
        // Extract component name with better pattern matching
        const componentNameMatch = cleanedCode.match(/const\s+(\w+)\s*=/) || 
                                   cleanedCode.match(/function\s+(\w+)\s*\(/) ||
                                   ['', 'GeneratedComponent']; // fallback
        const componentName = componentNameMatch[1] || 'GeneratedComponent';
        
        console.log(`Adding missing render call for component: ${componentName}`);
        cleanedCode += `\n\nrender(<${componentName} />);`;
      }

      // FINAL SANITIZATION: Keep only the first render(...) and drop any trailing junk
      // This prevents stray closing tags like </div> after the render call from breaking parsing
      cleanedCode = cleanedCode.replace(/(render\([^)]*\);)[\s\S]*$/g, '$1');

      // Also strip dangling closing tags at absolute EOF just in case
      cleanedCode = cleanedCode.replace(/\s*<\/[a-zA-Z0-9_-]+>\s*$/g, '');
      
      // For output/display components, add extra validation
      if (componentType === 'Output' || componentType === 'Display') {
        // Ensure the component contains content display logic
        if (!cleanedCode.includes('currentContent')) {
          console.warn('Output component missing currentContent logic');
          // This is a critical issue - the component won't work without it
        }
        
        // Ensure proper content prop handling
        if (!cleanedCode.includes('content:') && !cleanedCode.includes('content = ')) {
          console.warn('Output component missing content prop destructuring');
        }
      }
      
    } catch (validationError) {
      console.error("Syntax validation error:", validationError);
    }

    return NextResponse.json({
      component: cleanedCode,
      raw: generatedCode, // Include raw response for debugging
    });
  } catch (error: any) {
    console.error("Error generating component with Deepseek:", error);

    return NextResponse.json(
      {
        error: "Error generating component",
        details: error.message,
      },
      { status: 500 }
    );
  }
} 