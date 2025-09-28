"use client";

import React, { useState } from 'react';
import { MarkdownOutput } from '@/components/ui/markdownoutput';
import { Button } from '@/components/ui/button';

const sampleMarkdown = `# Markdown Output Demo

This is a **bold** text and this is *italic* text.

## Features Supported:

### Lists
- Bulleted lists
- **Bold items**
- *Italic items*

### Numbered Lists
1. First item
2. Second item
3. Third item

### Code Examples

Inline code: \`console.log("Hello World")\`

Code block:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

const message = greet("AI Assistant");
console.log(message);
\`\`\`

### Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Headers | ✅ | H1-H6 |
| Lists | ✅ | Ordered & Unordered |
| Code | ✅ | Syntax highlighting |
| Tables | ✅ | GitHub Flavored Markdown |
| Links | ✅ | External links |

### Links and Images
[Visit OpenAI](https://openai.com)

### Blockquotes
> This is a blockquote. It can contain **bold** and *italic* text.
> 
> Multiple paragraphs are supported too.

### AI Integration Ready!
This component is perfect for displaying AI-generated content including:
- ✅ Formatted responses
- ✅ Code snippets with syntax highlighting  
- ✅ Structured documentation
- ✅ Rich text explanations
`;

const aiResponseExample = `# AI Analysis Result

Based on your request, here's my analysis:

## Summary
The user wants to integrate **markdown rendering** capabilities into their output components for better AI response formatting.

## Implementation Steps:

### 1. Dependencies Installed
\`\`\`bash
npm install react-markdown remark-gfm rehype-highlight
\`\`\`

### 2. Component Features
- **Automatic markdown detection**
- **Syntax highlighting** for code blocks
- **GitHub Flavored Markdown** support
- **Custom styling** for better readability

### 3. Integration with AI
\`\`\`typescript
// Example usage with AI responses
const aiResponse = await callAIAPI(prompt);
// The MarkdownOutput component will automatically detect and render markdown
\`\`\`

> **Pro Tip**: The component automatically detects markdown patterns and switches to markdown rendering mode!

**Ready for production use!** ✅
`;

export function MarkdownDemo() {
  const [currentContent, setCurrentContent] = useState(sampleMarkdown);
  const [isLoading, setIsLoading] = useState(false);

  const simulateAIResponse = () => {
    setIsLoading(true);
    setCurrentContent("Loading...");
    
    setTimeout(() => {
      setCurrentContent(aiResponseExample);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Markdown Output Demo</h1>
        <div className="space-x-2">
          <Button 
            onClick={() => setCurrentContent(sampleMarkdown)}
            variant="outline"
          >
            Show Demo Content
          </Button>
          <Button 
            onClick={simulateAIResponse}
            disabled={isLoading}
          >
            {isLoading ? "AI Responding..." : "Simulate AI Response"}
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Markdown Output Component</h2>
        <MarkdownOutput
          placeholder="AI responses will render here with full markdown support..."
          content={currentContent}
          enableMarkdown={true}
          enableCodeHighlight={true}
          className="min-h-[400px]"
        />
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Integration Notes:</h3>
        <ul className="space-y-1">
          <li>• The component automatically detects markdown content</li>
          <li>• Code blocks include syntax highlighting</li>
          <li>• Tables, lists, and links are fully supported</li>
          <li>• Perfect for AI-generated responses</li>
          <li>• Works with chat history format too</li>
        </ul>
      </div>
    </div>
  );
}

