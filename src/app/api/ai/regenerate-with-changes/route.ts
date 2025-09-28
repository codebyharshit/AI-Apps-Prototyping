import { NextRequest, NextResponse } from "next/server";
import { deepseekClient, modelMapping } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const { 
      componentId, 
      originalCode, 
      originalPrompt, 
      componentType, 
      directManipulationChanges 
    } = await request.json();

    // Validate required fields
    if (!originalCode || !componentType) {
      return NextResponse.json(
        { error: "Missing required fields: originalCode and componentType" },
        { status: 400 }
      );
    }

    console.log('🔄 Regenerating component with changes:', {
        componentId,
      componentType,
      hasPositioning: !!directManipulationChanges?.positioning,
      changesCount: Object.keys(directManipulationChanges || {}).length
    });

    // Build enhanced system prompt for regeneration
    let regenerationPrompt = `You are an AI assistant that regenerates React component code by applying specific changes to existing code.

CRITICAL INSTRUCTIONS:
- You will receive an existing React component and specific changes to apply
- Apply the changes while preserving the component's core functionality
- DO NOT include any import statements - React is provided automatically
- DO NOT include export statements
- START directly with: const ComponentName = (props) => {
- MUST end with: render(<ComponentName {...externalProps} />);
- Use inline styles for positioning and styling changes
- Preserve all existing event handlers and logic
- Maintain proper JSX structure and React patterns

ORIGINAL COMPONENT TYPE: ${componentType}
ORIGINAL PROMPT: ${originalPrompt || 'React component'}

CHANGES TO APPLY:`;

    // Handle different types of changes
    const changes = directManipulationChanges || {};

    // 1. Style overrides (colors, fonts, etc.)
  if (changes.styleOverrides && Object.keys(changes.styleOverrides).length > 0) {
      regenerationPrompt += `

STYLE CHANGES:
${Object.entries(changes.styleOverrides)
  .map(([property, value]) => `- Apply ${property}: ${value} to the main container`)
  .join('\n')}`;
    }

    // 2. Content changes
    if (changes.textContent || changes.placeholder) {
      regenerationPrompt += `

CONTENT CHANGES:`;
      if (changes.textContent) {
        regenerationPrompt += `\n- Change text content to: "${changes.textContent}"`;
      }
      if (changes.placeholder) {
        regenerationPrompt += `\n- Change placeholder text to: "${changes.placeholder}"`;
      }
    }

    // 3. POSITIONING CHANGES (NEW)
    if (changes.positioning && changes.elementPositions) {
      regenerationPrompt += `

CRITICAL POSITIONING CHANGES:
You MUST apply absolute positioning to elements as specified below.
For each element, wrap it in a positioned container or apply styles directly:

${Object.entries(changes.elementPositions)
  .map(([elementId, styles]: [string, any]) => {
    return `Element "${elementId}":
  - position: ${styles.position || 'absolute'}
  - left: ${styles.left}
  - top: ${styles.top}
  - width: ${styles.width}
  - height: ${styles.height}
  - z-index: ${styles.zIndex || 1}`;
  })
  .join('\n\n')}

POSITIONING IMPLEMENTATION RULES:
1. Set the main container to position: relative
2. Apply position: absolute to moved elements
3. Use exact pixel values as specified above
4. Preserve element functionality while changing position
5. Ensure no overlap issues with z-index
6. Keep elements within the container bounds`;
    }

    // 4. Other property changes
    const otherChanges = Object.entries(changes).filter(([key]) => 
      !['styleOverrides', 'textContent', 'placeholder', 'positioning', 'elementPositions', 'positionInstructions'].includes(key)
    );

    if (otherChanges.length > 0) {
      regenerationPrompt += `

OTHER CHANGES:
${otherChanges.map(([property, value]) => `- ${property}: ${value}`).join('\n')}`;
    }

    regenerationPrompt += `

ORIGINAL CODE TO MODIFY:
\`\`\`javascript
${originalCode}
\`\`\`

REGENERATION REQUIREMENTS:
1. Keep all existing functionality intact
2. Apply the specified changes precisely
3. Maintain proper React component structure
4. Use inline styles for all styling changes
5. Ensure the component remains fully functional
6. If positioning is specified, implement it with absolute positioning within a relative container
7. Preserve all existing IDs and interactive functionality
8. Handle both external props and internal state properly
9. Apply positioning changes without breaking existing layout

Generate the modified component code now:`;

    // Debug: Check prompt length before API call
    console.log('🔍 REGENERATION DEBUG: Prompt length:', regenerationPrompt.length);
    console.log('🔍 REGENERATION DEBUG: Original code length:', originalCode.length);
    
    // If prompt is too long, truncate the original code section intelligently
    if (regenerationPrompt.length > 10000) {
      console.warn('⚠️ Regeneration prompt is very long, may cause truncation');
      // Keep first and last parts of original code for context
      const codeLines = originalCode.split('\n');
      if (codeLines.length > 30) {
        const truncatedCode = [
          ...codeLines.slice(0, 15),
          '// ... (code truncated for regeneration) ...',
          ...codeLines.slice(-15)
        ].join('\n');
        regenerationPrompt = regenerationPrompt.replace(originalCode, truncatedCode);
        console.log('🔧 Truncated original code in prompt for regeneration');
      }
    }

    // Call DeepSeek API with enhanced parameters
    const response = await deepseekClient.createChatCompletion({
      model: modelMapping["gpt-4o-mini"],
      messages: [
        { 
          role: "system", 
          content: "You are an expert React developer who regenerates component code by applying specific changes while preserving functionality. CRITICAL: Always provide complete, valid React component code that ends with a render() call." 
        },
        { role: "user", content: regenerationPrompt }
      ],
      temperature: 0.3, // Match original generation API
      max_tokens: 6000, // Increase to prevent truncation
    });

    const regeneratedCode = response.choices[0]?.message?.content || "";
    
    console.log('🔍 REGENERATION DEBUG: Raw response length:', regeneratedCode.length);
    console.log('🔍 REGENERATION DEBUG: Response starts with:', regeneratedCode.substring(0, 100));
    console.log('🔍 REGENERATION DEBUG: Response ends with:', regeneratedCode.substring(regeneratedCode.length - 100));

    // Clean the regenerated code with enhanced logic (matching original generation API)
    let cleanedCode = regeneratedCode.replace(/```jsx|```tsx|```js|```ts|```javascript|```/g, "").trim();
    
    // AGGRESSIVE CLEANING: Remove any remaining descriptive text (matching original API)
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
      console.log(`🔧 REGENERATION: Removing ${codeStartIndex} characters of descriptive text`);
      cleanedCode = cleanedCode.substring(codeStartIndex);
    }
    
    // Additional aggressive cleaning patterns (from original API)
    cleanedCode = cleanedCode.replace(/^[\s\S]*?Create a React component[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*Input Fields:\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*Submit Button:\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    
    console.log('🔍 REGENERATION DEBUG: Cleaned code length:', cleanedCode.length);

    // Remove design-preview artifacts that may leak into generated code
    cleanedCode = cleanedCode.replace(/\bAI Component Preview\b/g, '');
    cleanedCode = cleanedCode.replace(/\bScroll to see full component\b/g, '');
    cleanedCode = cleanedCode.replace(/\sdata-ai-element="true"/g, '');
    cleanedCode = cleanedCode.replace(/\sdata-element-id="[^"]*"/g, '');
    cleanedCode = cleanedCode.replace(/\sdata-component-id="[^"]*"/g, '');

    // ADDITIONAL CLEANING: Remove concatenated text artifacts that appear in regeneration
    // This is the critical fix for the extra text issue
    cleanedCode = cleanedCode.replace(/<div>[^<]*AI Component Preview[^<]*<\/div>/g, '');
    cleanedCode = cleanedCode.replace(/<div>[^<]*Scroll to see full component[^<]*<\/div>/g, '');
    cleanedCode = cleanedCode.replace(/<div>[^<]*NameEmailMessageI agree to termsSubmit[^<]*<\/div>/g, '');
    
    // Remove any divs that contain concatenated form labels
    cleanedCode = cleanedCode.replace(/<div>[^<]*(?:Name|Email|Message|I agree to terms|Submit)[^<]*<\/div>/g, '');
    
    // Remove any remaining descriptive text patterns that might appear
    cleanedCode = cleanedCode.replace(/^[\s\S]*?\*\*[^*]+\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    cleanedCode = cleanedCode.replace(/^[\s\S]*?(?:- [^\n]*\n){2,}(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    
    // Ensure render call exists
    if (!cleanedCode.includes('render(')) {
      const componentNameMatch = cleanedCode.match(/const\s+(\w+)\s*=/) || ['', 'RegeneratedComponent'];
      const componentName = componentNameMatch[1] || 'RegeneratedComponent';
      cleanedCode += `\n\nrender(<${componentName} {...externalProps} />);`;
      console.log(`🔧 REGENERATION: Added missing render call for ${componentName}`);
    }
    
    // Additional validation and completion (from original API)
    try {
      // Check for basic syntax validity
      const openBraces = (cleanedCode.match(/{/g) || []).length;
      const closeBraces = (cleanedCode.match(/}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        console.warn(`⚠️ REGENERATION: Brace mismatch detected: ${openBraces} open, ${closeBraces} close`);
        // Try to fix it
        if (openBraces > closeBraces) {
          cleanedCode += '}'.repeat(openBraces - closeBraces);
          console.log('🔧 REGENERATION: Fixed brace mismatch');
        }
      }
    } catch (validationError) {
      console.error("❌ REGENERATION: Syntax validation error:", validationError);
    }

    // Validate the code structure
    const hasValidStructure = cleanedCode.includes('const ') && cleanedCode.includes('render(');
    
    if (!hasValidStructure) {
      console.error('❌ Generated code lacks proper structure');
  return NextResponse.json({ 
        success: false,
        error: "Generated code structure is invalid",
        data: { originalCode, regeneratedCode, cleanedCode }
      }, { status: 400 });
    }

    console.log('✅ Component regeneration successful');
    console.log(`📄 Original code length: ${originalCode.length}`);
    console.log(`📄 Raw response length: ${regeneratedCode.length}`);
    console.log(`📄 Final cleaned code length: ${cleanedCode.length}`);
    console.log(`📄 Code reduction: ${((regeneratedCode.length - cleanedCode.length) / regeneratedCode.length * 100).toFixed(1)}%`);
    console.log(`📄 Code is complete: ${cleanedCode.includes('render(') && cleanedCode.trim().endsWith(');')}`);

    return NextResponse.json({
      success: true,
      data: {
        newGeneratedCode: cleanedCode,
        originalCode,
        appliedChanges: directManipulationChanges,
        componentId,
        regeneratedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("❌ Error regenerating component:", error);

    return NextResponse.json({
      success: false,
      error: "Error regenerating component",
      details: error.message,
    }, { status: 500 });
  }
} 