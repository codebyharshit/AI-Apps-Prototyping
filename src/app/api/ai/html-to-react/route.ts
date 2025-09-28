import { NextRequest, NextResponse } from "next/server";
import { deepseekClient, modelMapping } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const { html, componentName = "GeneratedComponent" } = await request.json();
    console.log("html", html);
    // Validate required fields
    if (!html) {
      return NextResponse.json(
        { error: "Missing required input: html" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert React developer specializing in converting HTML/CSS to React components.

CRITICAL REQUIREMENTS:
- Convert the provided HTML/CSS to a React functional component
- Extract CSS and convert to inline styles or className-based styling
- Use modern React patterns with hooks
- Make the component fully functional and interactive
- Handle state management appropriately
- Use semantic HTML elements
- Ensure accessibility features are preserved
- Make it responsive and mobile-friendly
- Use ONLY ES6 module syntax (import/export) - NO CommonJS (require/exports)

CRITICAL IMPORTS:
- ALWAYS start your component with: import React, { useState, useEffect } from 'react';
- Include ALL necessary React imports at the top
- This is REQUIRED for the component to work in the sandbox environment
- The import statement MUST be the very first line of code
- NEVER skip the React import - it's essential for JSX to work

CONVERSION GUIDELINES:
- Convert HTML attributes to React props (class -> className, for -> htmlFor, etc.)
- Convert inline event handlers to React event handlers
- PREFER className + CSS string injected via <style> over inline style objects
- Keep complex CSS (pseudo-selectors ::before/::after, :hover, @media, @keyframes) inside CSS, NOT inside JS style objects
 - If CSS is present, include it as:
   const componentCss = \`/* css here */\`;
   and inject it in the JSX with: <style dangerouslySetInnerHTML={{ __html: componentCss }} />
  (place it as the first child in the returned tree)
- Handle form inputs and state properly
- Convert any JavaScript to React hooks and event handlers
- Ensure all interactive elements work correctly

COMPONENT STRUCTURE:
- Use functional components with hooks
- Include proper TypeScript interfaces for props
- Handle both controlled and uncontrolled components
- Include proper error boundaries and loading states
- Make the component reusable and configurable
- ALWAYS start with: const ComponentName = (props) => {
- ALWAYS include state declarations with useState hooks
- ALWAYS include proper props destructuring with default values
- ALWAYS end with: }; export default ComponentName;

CRITICAL STATE MANAGEMENT:
- Define ALL state variables using useState hooks based on the component's needs
- Include default values for all state variables
- Handle all user interactions properly
- Ensure the component is self-contained
- Dynamically determine state variables from the component's functionality

CRITICAL PROPS HANDLING:
- Accept props with default values based on the component's requirements
- Handle missing props gracefully
- Use destructuring with default values
- Dynamically determine required props from the component's functionality

OUTPUT FORMAT:
- Return ONLY the React component code
- ALWAYS include render(<ComponentName {...externalProps} />) at the end for React Live compatibility
- No explanations, no markdown, no code blocks
- Start immediately with the component definition
- Use proper React syntax and patterns
- End with export default ComponentName;
- Use ONLY ES6 export syntax - NEVER use module.exports or exports
- The render() call is CRITICAL for the component to work in the sandbox environment
- The {...externalProps} is REQUIRED to pass external data to the component

CRITICAL ID GENERATION REQUIREMENTS:
- EVERY interactive element MUST have a unique id attribute
- Use descriptive IDs that indicate the element's purpose
- ID format: elementType-purpose (e.g., "input-email", "button-submit")
- These IDs are critical for the AI system to work properly

The component should be a complete, standalone React component that can be used immediately.`;

    const userPrompt = `Convert this HTML/CSS to a React component named "${componentName}":

${html}

Please ensure:
1. All interactive elements have unique IDs
2. Keep CSS in a CSS string and inject it via <style dangerouslySetInnerHTML={{ __html: css }} /> at the top of the returned JSX. Do NOT attempt to convert pseudo-selectors (::before/::after), :hover, @media, @keyframes into JS style objects.
3. Use className on elements to bind to the CSS classes you output in the CSS string
4. The component is fully functional (state, handlers, ARIA) and maintains the original design and responsiveness
5. ALWAYS include render(<${componentName} {...externalProps} />) at the end for React Live compatibility
6. The {...externalProps} is REQUIRED to pass external data to the component`;

    const response = await deepseekClient.createChatCompletion({
      model: modelMapping["gpt-4o-mini"],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const generatedCode = response.choices[0]?.message?.content || "";

    // Clean the generated code
    let cleanedCode = generatedCode.trim();
    
    // Remove any markdown formatting
    cleanedCode = cleanedCode.replace(/```jsx|```tsx|```js|```ts|```/g, "").trim();
    
    // CRITICAL: Ensure React imports are present
    if (!cleanedCode.includes('import React') && !cleanedCode.includes('import { useState }')) {
      console.log("Adding missing React imports");
      cleanedCode = `import React, { useState, useEffect } from 'react';\n\n${cleanedCode}`;
    } else if (!cleanedCode.includes('import React')) {
      // If useState is imported but React isn't, add React import
      console.log("Adding missing React import");
      cleanedCode = `import React from 'react';\n\n${cleanedCode}`;
    }
    
    // Remove any descriptive text before the component code
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
      cleanedCode = cleanedCode.substring(codeStartIndex);
    }
    
    // CRITICAL: Ensure React imports are at the very beginning
    if (!cleanedCode.trim().startsWith('import React')) {
      console.log("Adding React imports at the beginning");
      cleanedCode = `import React, { useState, useEffect } from 'react';\n\n${cleanedCode}`;
    }
    
    // CRITICAL: Fix malformed JSX tags that cause "Expected either /> or > at the end of the tag" error
    console.log("Fixing malformed JSX tags...");
    
    // Fix incomplete self-closing tags
    cleanedCode = cleanedCode.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)(?=\/>|>)/g, (match: string, tagName: string, attributes: string) => {
      const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
      if (selfClosingTags.includes(tagName.toLowerCase()) && !match.endsWith('/>') && !match.endsWith('>')) {
        return match + ' />';
      }
      return match;
    });
    
    // Fix incomplete input tags specifically
    cleanedCode = cleanedCode.replace(/(<input[^>]*?)(?=\s*\/>|\s*>)/g, (match: string) => {
      if (!match.endsWith('/>') && !match.endsWith('>')) {
        return match + ' />';
      }
      return match;
    });
    
    // Fix malformed closing tags with multiple slashes
    cleanedCode = cleanedCode.replace(/\/>\s*\/>\s*\/>\s*\/>/g, ' />');
    cleanedCode = cleanedCode.replace(/\/>\s*\/>\s*\/>/g, ' />');
    cleanedCode = cleanedCode.replace(/\/>\s*\/>\s*$/gm, ' />');
    
    // Fix incomplete div tags
    cleanedCode = cleanedCode.replace(/<div\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
      if (!match.endsWith('>')) {
        return match + '>';
      }
      return match;
    });
    
    // Fix incomplete span tags
    cleanedCode = cleanedCode.replace(/<span\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
      if (!match.endsWith('>')) {
        return match + '>';
      }
      return match;
    });
    
    // Fix incomplete button tags
    cleanedCode = cleanedCode.replace(/<button\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
      if (!match.endsWith('>')) {
        return match + '>';
      }
      return match;
    });
    
    // Fix incomplete label tags
    cleanedCode = cleanedCode.replace(/<label\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
      if (!match.endsWith('>')) {
        return match + '>';
      }
      return match;
    });
    
    // Fix incomplete h2 tags
    cleanedCode = cleanedCode.replace(/<h2\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
      if (!match.endsWith('>')) {
        return match + '>';
      }
      return match;
    });
    
    // Fix incomplete p tags
    cleanedCode = cleanedCode.replace(/<p\s+([^>]*?)(?=\/>|>)/g, (match: string, attributes: string) => {
      if (!match.endsWith('>')) {
        return match + '>';
      }
      return match;
    });
    
    console.log("JSX tag fixing completed");
    
    // CRITICAL: Additional JSX validation and fixing
    // Fix any remaining malformed tags by ensuring proper closing
    cleanedCode = cleanedCode.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)(?=\/>|>)/g, (match: string, tagName: string, attributes: string) => {
      // If the tag doesn't end with /> or >, add the appropriate closing
      if (!match.endsWith('/>') && !match.endsWith('>')) {
        const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        if (selfClosingTags.includes(tagName.toLowerCase())) {
          return match + ' />';
        } else {
          return match + '>';
        }
      }
      return match;
    });
    
    // Fix any remaining incomplete closing tags
    cleanedCode = cleanedCode.replace(/\/>\s*\/>\s*\/>\s*\/>/g, ' />');
    cleanedCode = cleanedCode.replace(/\/>\s*\/>\s*\/>/g, ' />');
    cleanedCode = cleanedCode.replace(/\/>\s*\/>\s*$/gm, ' />');
    
    console.log("Additional JSX validation completed");
    
    // CRITICAL: Fix malformed arrow functions and extra characters
    console.log("Fixing malformed arrow functions and extra characters...");
    
    // Fix malformed arrow functions: " = />>" -> " =>"
    cleanedCode = cleanedCode.replace(/=\s*\/>>/g, '=>');
    
    // Fix malformed arrow functions: " =   />>" -> " =>"
    cleanedCode = cleanedCode.replace(/=\s*\/>>/g, '=>');
    
    // Remove extra ">>>" or ">>" after valid JSX closing tags
    cleanedCode = cleanedCode.replace(/(<\/\w+>|(?<!<)\/>)\s*>{1,}/g, '$1');
    
    // Fix ">>/" to "/>" for self-closing tags
    cleanedCode = cleanedCode.replace(/>>\//g, '/>');
    
    // Fix malformed render call: "render(<Component {...props} >/>)" -> "render(<Component {...props} />)"
    cleanedCode = cleanedCode.replace(/render\(([^)]+)\s*>\/>\);/g, 'render($1 />);');
    
    // Remove any standalone ">>>" or ">>" that shouldn't be there
    cleanedCode = cleanedCode.replace(/\s*>{3,}\s*/g, ' ');
    cleanedCode = cleanedCode.replace(/\s*>{2}\s*/g, ' ');
    
    // Fix any remaining malformed arrow functions with extra characters
    cleanedCode = cleanedCode.replace(/=\s*\/\s*>>/g, '=>');
    cleanedCode = cleanedCode.replace(/=\s*\/\s*>/g, '=>');
    
    // CRITICAL: Fix specific patterns found in the generated code
    // Fix " =   />>" pattern (multiple spaces)
    cleanedCode = cleanedCode.replace(/=\s*\/\s*>>/g, '=>');
    
    // Fix JSX tags with extra ">>>" at the end
    cleanedCode = cleanedCode.replace(/(<[^>]+>)\s*>>>/g, '$1');
    
    // Fix JSX tags with extra ">>" at the end
    cleanedCode = cleanedCode.replace(/(<[^>]+>)\s*>>/g, '$1');
    
    // Fix self-closing tags with extra ">>" before "/>"
    cleanedCode = cleanedCode.replace(/(<[^>]+)\s*>>\s*\/>/g, '$1 />');
    
    // Fix render call with extra " >/>"
    cleanedCode = cleanedCode.replace(/render\(([^)]+)\s*>\s*\/>\);/g, 'render($1 />);');
    
    console.log("Arrow function and character fixing completed");
    
    // CRITICAL: Balance parentheses inside quoted style strings (e.g., missing ')' in rgba(...))
    // This prevents "Unexpected token" errors caused by unbalanced parentheses within CSS strings
    cleanedCode = cleanedCode.replace(/:\s*'([^']*)'/g, (_m: string, value: string) => {
      const open = (value.match(/\(/g) || []).length;
      const close = (value.match(/\)/g) || []).length;
      if (open > close) {
        return `: '${value}${')'.repeat(open - close)}'`;
      }
      return `: '${value}'`;
    });
    cleanedCode = cleanedCode.replace(/:\s*"([^"]*)"/g, (_m: string, value: string) => {
      const open = (value.match(/\(/g) || []).length;
      const close = (value.match(/\)/g) || []).length;
      if (open > close) {
        return `: "${value}${')'.repeat(open - close)}"`;
      }
      return `: "${value}"`;
    });

    // CRITICAL: Apply the same robust cleaning as generate-component API
    console.log("Applying generate-component style cleaning...");
    
    // Apply the same fixCommonSyntaxErrors function logic
    // Remove any descriptive text before the component code
    cleanedCode = cleanedCode.replace(/^[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/i, '');
    
    // CRITICAL: Fix incomplete JSX tags that are causing the syntax error
    console.log("Fixing incomplete JSX tags that cause syntax errors...");
    
    // Fix patterns like: style={{...}} <div -> style={{...}}> <div
    cleanedCode = cleanedCode.replace(/}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '}> <$1');
    
    // Fix patterns like: " <div -> "> <div
    cleanedCode = cleanedCode.replace(/"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '"> <$1');
    
    // Fix patterns like: true <div -> true> <div
    cleanedCode = cleanedCode.replace(/(true|false)\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '$1> <$2');
    
    // Fix patterns like: "modal-title" <div -> "modal-title"> <div
    cleanedCode = cleanedCode.replace(/"([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '"$1"> <$2');
    
    // Fix patterns like: } <div -> }> <div
    cleanedCode = cleanedCode.replace(/}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, '}> <$1');
    
    // Fix patterns like: ) <div -> )> <div
    cleanedCode = cleanedCode.replace(/\)\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, ')> <$1');
    
    // Fix patterns like: , <div -> ,> <div
    cleanedCode = cleanedCode.replace(/,\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, ',> <$1');
    
    console.log("Incomplete JSX tag fixing completed");
    
    // CRITICAL: Additional specific fixes for the exact patterns in the error
    console.log("Applying additional specific fixes...");
    
    // Fix the exact pattern causing the error: aria-labelledby="modal-title" <div
    cleanedCode = cleanedCode.replace(/aria-labelledby="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'aria-labelledby="$1"> <$2');
    
    // Fix patterns like: role="dialog" <div
    cleanedCode = cleanedCode.replace(/role="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'role="$1"> <$2');
    
    // Fix patterns like: aria-modal="true" <div
    cleanedCode = cleanedCode.replace(/aria-modal="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'aria-modal="$1"> <$2');
    
    // Fix patterns like: id="modal-title" <h2
    cleanedCode = cleanedCode.replace(/id="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'id="$1"> <$2');
    
    // Fix patterns like: htmlFor="alert-name" <label
    cleanedCode = cleanedCode.replace(/htmlFor="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'htmlFor="$1"> <$2');
    
    // Fix patterns like: type="text" <input
    cleanedCode = cleanedCode.replace(/type="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'type="$1"> <$2');
    
    // Fix patterns like: placeholder="..." <input
    cleanedCode = cleanedCode.replace(/placeholder="([^"]*)"\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'placeholder="$1"> <$2');
    
    // Fix patterns like: checked={...} <input
    cleanedCode = cleanedCode.replace(/checked=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'checked={$1}> <$2');
    
    // Fix patterns like: onChange={...} <input
    cleanedCode = cleanedCode.replace(/onChange=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'onChange={$1}> <$2');
    
    // Fix patterns like: onClick={...} <button
    cleanedCode = cleanedCode.replace(/onClick=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'onClick={$1}> <$2');
    
    // Fix patterns like: disabled={...} <button
    cleanedCode = cleanedCode.replace(/disabled=\{([^}]*)\}\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'disabled={$1}> <$2');
    
    console.log("Additional specific fixes completed");
    
    // CRITICAL: Fix the exact patterns causing the current error
    console.log("Fixing exact patterns causing syntax errors...");
    
    // Fix patterns like: id="modal-title" {title} -> id="modal-title">{title}
    cleanedCode = cleanedCode.replace(/id="([^"]*)"\s*\{([^}]*)\}/g, 'id="$1">{$2}');
    
    // Fix patterns like: style={styles.modalTitle} {title} -> style={styles.modalTitle}>{title}
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*\{([^}]*)\}/g, 'style={$1}>{$2}');
    
    // Fix patterns like: style={styles.formLabel} Name your alert -> style={styles.formLabel}>Name your alert
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<\/)/g, 'style={$1}>$2');
    
    // Fix patterns like: style={styles.toggleLabel} Get notified via: -> style={styles.toggleLabel}>Get notified via:
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<)/g, 'style={$1}>$2');
    
    // Fix patterns like: onClick={() = setNotificationMethod('email')} -> onClick={() => setNotificationMethod('email')}
    cleanedCode = cleanedCode.replace(/onClick=\{\(\)\s*=\s*([^}]*)\}/g, 'onClick={() => $1}');
    
    // Fix patterns like: onKeyPress={(e) => e.key === 'Enter' && setNotificationMethod('email')} -> onKeyPress={(e) => e.key === 'Enter' && setNotificationMethod('email')}
    cleanedCode = cleanedCode.replace(/onKeyPress=\{\(e\)\s*=\s*([^}]*)\}/g, 'onKeyPress={(e) => $1}');
    
    // Fix patterns like: onClick={handleSave} Save Alert -> onClick={handleSave}>Save Alert
    cleanedCode = cleanedCode.replace(/onClick=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<\/)/g, 'onClick={$1}>$2');
    
    // Fix patterns like: {filters.map((filter, index) => ( -> {filters.map((filter, index) => (
    cleanedCode = cleanedCode.replace(/\{([^}]*\.map\([^)]*\)\s*=>\s*\(\))\s*\{/g, '{$1} {');
    
    // Fix patterns like: {filter.label} -> {filter.label}
    cleanedCode = cleanedCode.replace(/\{([^}]*\.label)\}\s*\{/g, '{$1} {');
    
    // Fix patterns like: {filter.value} -> {filter.value}
    cleanedCode = cleanedCode.replace(/\{([^}]*\.value)\}\s*\{/g, '{$1} {');
    
    console.log("Exact pattern fixes completed");
    
    // CRITICAL: Fix the specific patterns causing the current error
    console.log("Fixing specific patterns causing syntax errors...");
    
    // Fix patterns like: aria-labelledby="modal-title"> <div -> aria-labelledby="modal-title"> <div
    cleanedCode = cleanedCode.replace(/aria-labelledby="([^"]*)"\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'aria-labelledby="$1"> <$2');
    
    // Fix patterns like: style={styles.modalContent}> <div -> style={styles.modalContent}> <div
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
    
    // Fix patterns like: style={styles.searchFilters}> <h3 -> style={styles.searchFilters}> <h3
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
    
    // Fix patterns like: style={styles.formGroup}> <label -> style={styles.formGroup}> <label
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
    
    // Fix patterns like: style={styles.notificationToggle}> <span -> style={styles.notificationToggle}> <span
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
    
    // Fix patterns like: style={styles.modalFooter}> <button -> style={styles.modalFooter}> <button
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*>\s*<\s*([a-zA-Z][a-zA-Z0-9]*)/g, 'style={$1}> <$2');
    
    // Fix patterns like: disabled={!alertName} Save Alert -> disabled={!alertName}>Save Alert
    cleanedCode = cleanedCode.replace(/disabled=\{([^}]*)\}\s*([a-zA-Z][a-zA-Z\s]*[a-zA-Z])(?=\s*<\/)/g, 'disabled={$1}>$2');
    
    // Fix patterns like: } / </span> -> } />
    cleanedCode = cleanedCode.replace(/\}\s*\/\s*<\/span>/g, '} />');
    
    // Fix patterns like: style={...} </tag>  (missing '>') -> style={...}></tag>
    cleanedCode = cleanedCode.replace(/style=\{([^}]*)\}\s*<\/(\w+)>/g, 'style={$1}></$2>');
    
    // Generic: if an attribute list ends with '}' and is immediately followed by a closing tag, insert '>'
    cleanedCode = cleanedCode.replace(/(<[a-zA-Z][^>]*})\s*<\/(\w+)>/g, '$1></$2>');

    // Fix patterns like: } / </span> -> } />
    cleanedCode = cleanedCode.replace(/\}\s*\/\s*<\/span>/g, '} />');
    
    // Remove extra closing tags at the end
    cleanedCode = cleanedCode.replace(/\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*$/g, ');');
    
    // Fix patterns like: render(<Modal {...externalProps}  />); -> render(<Modal {...externalProps} />);
    cleanedCode = cleanedCode.replace(/render\(<([^>]+)\s*\{\s*\.\.\.externalProps\s*\}\s*\/>\);/g, 'render(<$1 {...externalProps} />);');
    
    console.log("Specific pattern fixes completed");
    
    // GENERIC SAFETY NETS (broad fixes for remaining malformed starts)
    // 1) If a start tag ends with attributes and is immediately followed by text, insert '>'
    cleanedCode = cleanedCode.replace(/(<(h[1-6]|p|span|label|div|button)[^>]*?)\s(?=[^<>{}])/g, '$1>');
    // 2) If a start tag ends with attributes and is immediately followed by a closing tag, insert '>'
    cleanedCode = cleanedCode.replace(/(<\w+[^>]*?)\s<\/(\w+)>/g, '$1></$2>');
    // 3) Fix style self-closing tag written as '>/>'
    cleanedCode = cleanedCode.replace(/<style([^>]*)>\s*\/>/g, '<style$1 />');
    // 4) Move attributes that accidentally appear after '>' back into the opening tag
    //    e.g., <div>className="modal">  -> <div className="modal">
    cleanedCode = cleanedCode.replace(/<(\w+)\s*>\s*((?:[a-zA-Z_:][\w:-]*=(?:"[^"]*"|'[^']*'|\{[^}]*\})\s*)+)>/g, '<$1 $2>');
    // 4a) Same, but when attributes are followed by text (no immediate '>'): <h2>id="x" className="y" Text -> <h2 id="x" className="y">Text
    cleanedCode = cleanedCode.replace(/<(\w+)\s*>\s*((?:[a-zA-Z_:][\w:-]*=(?:"[^"]*"|'[^']*'|\{[^}]*\})\s*)+)(?=\s*[^<])/g, '<$1 $2>');
    // 5) Normalize broken onX handlers with missing => (e.g., onChange={(e) = setState(...)})
    cleanedCode = cleanedCode.replace(/on([A-Z][a-zA-Z]*)=\{\s*\(?(?:e|event)\)?\s*=\s*/g, 'on$1={(e) => ');
    // 6) Remove stray '>' tokens immediately after an arrow: (e) => > > expr
    cleanedCode = cleanedCode.replace(/=>\s*>\s*>+/g, '=> ');
    cleanedCode = cleanedCode.replace(/=>\s*>/g, '=> ');

    // Remove lines that start with descriptive text patterns
    cleanedCode = cleanedCode.replace(/^(Create|Here's|This is|Building|Making|Let me create|I'll create|Generate)[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    
    // Remove markdown-style text like "**Input Fields:**" etc.
    cleanedCode = cleanedCode.replace(/^\*\*[^*]+\*\*[\s\S]*?(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    
    // Remove bullet points and descriptions
    cleanedCode = cleanedCode.replace(/^[\s\S]*?(?:- [^\n]*\n)*(?=const\s+\w+\s*=|function\s+\w+)/im, '');
    
    // Look for the first occurrence of "const " and remove everything before it as fallback
    const constMatch = cleanedCode.match(/const\s+\w+\s*=/);
    if (constMatch) {
      const constIndex = cleanedCode.indexOf(constMatch[0]);
      if (constIndex > 0) {
        cleanedCode = cleanedCode.substring(constIndex);
      }
    }
    
    // Fix incomplete className strings with double braces
    cleanedCode = cleanedCode.replace(/bg-opacity}}/g, 'bg-opacity-50');
    cleanedCode = cleanedCode.replace(/opacity}}/g, 'opacity-50');
    
    // Fix incomplete JSX tags
    cleanedCode = cleanedCode.replace(/className="[^"]*}}$/gm, (match: string) => {
      const cleanMatch = match.replace(/}}$/, '');
      return cleanMatch + (cleanMatch.endsWith('"') ? '' : '"');
    });
    
    // Fix incomplete div tags at the end
    cleanedCode = cleanedCode.replace(/<div className="[^"]*}}\s*$/gm, (match: string) => {
      const cleanMatch = match.replace(/}}\s*$/, '');
      return cleanMatch + '"></div>';
    });
    
    // Ensure proper closing of JSX elements
    const openTags = (cleanedCode.match(/<[^/][^>]*[^/]>/g) || []).length;
    const closeTags = (cleanedCode.match(/<\/[^>]+>/g) || []).length;
    
    // Add missing closing div tags if needed
    if (openTags > closeTags) {
      const missingTags = openTags - closeTags;
      for (let i = 0; i < missingTags; i++) {
        cleanedCode += '\n        </div>';
      }
    }
    
    console.log("Generate-component style cleaning completed");
    
    // CRITICAL: Apply the same validateAndCompleteJSX function as generate-component API
    console.log("Applying generate-component JSX validation...");
    
    // Count opening and closing braces
    const openBraces = (cleanedCode.match(/{/g) || []).length;
    const closeBraces = (cleanedCode.match(/}/g) || []).length;
    
    // Add missing closing braces
    if (openBraces > closeBraces) {
      const diff = openBraces - closeBraces;
      cleanedCode += '}'.repeat(diff);
    }
    
    // Count opening and closing parentheses
    const openParens = (cleanedCode.match(/\(/g) || []).length;
    const closeParens = (cleanedCode.match(/\)/g) || []).length;
    
    // Add missing closing parentheses
    if (openParens > closeParens) {
      const diff = openParens - closeParens;
      cleanedCode += ')'.repeat(diff);
    }
    
    // Ensure the code ends properly
    if (!cleanedCode.trim().endsWith(';') && !cleanedCode.trim().endsWith('}')) {
      cleanedCode += ';';
    }
    
    console.log("Generate-component JSX validation completed");
    
    // Remove trailing extra render/export if the model produced them too early
    cleanedCode = cleanedCode.replace(/\n+render\s*\([^)]*\)\s*;?\s*$/g, "");
    cleanedCode = cleanedCode.replace(/\n+export\s+default\s+\w+\s*;?\s*$/g, "");
    
    // Find the component name and ensure proper export default at the end
    const componentMatch = cleanedCode.match(/const\s+(\w+)\s*=/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      
      // If the component name is used in a render call, replace it with the actual component
      cleanedCode = cleanedCode.replace(new RegExp(`render\\(<${componentName}\\s*/>\\)`, 'g'), '');
      
      // Ensure proper export default at the end
      if (!cleanedCode.includes("export default")) {
        cleanedCode += `\n\nexport default ${componentName};`;
      }
      
      // CRITICAL: Add render call for react-live compatibility (like generate-component does)
      // This is REQUIRED for React Live to work properly
      if (!cleanedCode.includes('render(')) {
        console.log(`Adding render call for component: ${componentName}`);
        cleanedCode += `\n\nrender(<${componentName} />);`;
      }
    } else {
      // Fallback: if we can't find the component name, try to extract it from export default
      const exportMatch = cleanedCode.match(/export\s+default\s+(\w+)/);
      if (exportMatch) {
        const componentName = exportMatch[1];
        if (!cleanedCode.includes('render(')) {
          console.log(`Adding render call for component: ${componentName} (fallback)`);
          cleanedCode += `\n\nrender(<${componentName} />);`;
        }
      }
    }

    // FINAL CHECK: Ensure React imports are at the beginning
    if (!cleanedCode.trim().startsWith('import React')) {
      console.log("FINAL CHECK: Adding React imports at the beginning");
      cleanedCode = `import React, { useState, useEffect } from 'react';\n\n${cleanedCode}`;
    }
    
    // FINAL CHECK: Ensure render call is present and properly formatted
    if (!cleanedCode.includes('render(')) {
      console.log("WARNING: No render call found, adding generic render call");
      // Try to find any component name in the code
      const anyComponentMatch = cleanedCode.match(/(?:const|function|export\s+default)\s+(\w+)/);
      if (anyComponentMatch) {
        const fallbackComponentName = anyComponentMatch[1];
        cleanedCode += `\n\nrender(<${fallbackComponentName} {...externalProps} />);`;
      } else {
        // Last resort: add a generic render call
        cleanedCode += `\n\nrender(<div>Component rendered</div>);`;
      }
    } else {
      // Ensure existing render call includes externalProps
      if (!cleanedCode.includes('{...externalProps}')) {
        cleanedCode = cleanedCode.replace(/render\(<(\w+)\s*\/?>/g, `render(<$1 {...externalProps} />`);
        console.log("Updated existing render call to include externalProps");
      }
    }

    // FINAL CLEANUP: Hard cut anything after the render call (prevents stray closing tags from breaking parsing)
    cleanedCode = cleanedCode.replace(/(render\([^)]+\);)\s*[\s\S]*$/, '$1');

    console.log("HTML-to-React conversion completed:");
    console.log("- Original HTML length:", html.length);
    console.log("- Generated code length:", generatedCode.length);
    console.log("- Cleaned code length:", cleanedCode.length);
    console.log("- Has React imports:", cleanedCode.includes('import React'));
    console.log("- Has useState:", cleanedCode.includes('useState'));
    console.log("- Has render call:", cleanedCode.includes('render('));
    console.log("- Has export default:", cleanedCode.includes('export default'));

    return NextResponse.json({
      component: cleanedCode,
      originalHtml: html,
    });
  } catch (error: any) {
    console.error("Error converting HTML to React:", error);

    return NextResponse.json(
      {
        error: "Error converting HTML to React",
        details: error.message,
      },
      { status: 500 }
    );
  }
} 