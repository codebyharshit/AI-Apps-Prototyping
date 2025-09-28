"use client";

import React from "react";
import { ComponentRequirementsForm, ComponentRequirements } from "@/components/ComponentRequirementsForm";
import { HtmlCssEditor } from "@/components/HtmlCssEditor";
import { EnhancedAIComponentGenerator } from "@/components/EnhancedAIComponentGenerator";
import { TestVisualEditor } from "@/components/TestVisualEditor";
import { ClaudeTestComponent } from "@/components/ClaudeTestComponent";

export default function TestNewComponents() {
  const [requirements, setRequirements] = React.useState<ComponentRequirements | null>(null);
  const [generatedHtml, setGeneratedHtml] = React.useState("");
  const [currentStep, setCurrentStep] = React.useState<"requirements" | "html-css" | "enhanced" | "visual-test" | "claude-test">("requirements");

  const handleRequirementsSubmit = (req: ComponentRequirements) => {
    setRequirements(req);
    // Simulate HTML generation
    setGeneratedHtml(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Component</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${req.componentType}</h1>
        <p>${req.idea}</p>
        <form>
            <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" placeholder="Enter your name">
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" placeholder="Enter your email">
            </div>
            <div class="form-group">
                <label for="message">Message:</label>
                <textarea id="message" rows="4" placeholder="Enter your message"></textarea>
            </div>
            <button type="submit">Submit</button>
        </form>
    </div>
</body>
</html>
    `);
    setCurrentStep("html-css");
  };

  const handleComponentGenerated = (component: any) => {
    console.log("Component generated:", component);
    alert("Component generated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test New AI Component Generation</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Options</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep("requirements")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Requirements Form
            </button>
            <button
              onClick={() => setCurrentStep("html-css")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              HTML/CSS Editor
            </button>
            <button
              onClick={() => setCurrentStep("enhanced")}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Enhanced Workflow
            </button>
            <button
              onClick={() => setCurrentStep("visual-test")}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test Visual Editor
            </button>
            <button
              onClick={() => setCurrentStep("claude-test")}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Claude vs DeepSeek Test
            </button>
          </div>
        </div>

        {currentStep === "requirements" && (
          <ComponentRequirementsForm
            onSubmit={handleRequirementsSubmit}
            onCancel={() => setCurrentStep("requirements")}
            isLoading={false}
          />
        )}

        {currentStep === "html-css" && requirements && generatedHtml && (
          <HtmlCssEditor
            html={generatedHtml}
            requirements={requirements}
            onSave={(html) => setGeneratedHtml(html)}
            onCancel={() => setCurrentStep("requirements")}
            onGenerateReact={(html) => {
              console.log("Generate React for:", html);
              alert("React generation would happen here!");
            }}
          />
        )}

        {currentStep === "enhanced" && (
          <EnhancedAIComponentGenerator
            onComponentGenerated={handleComponentGenerated}
          />
        )}

        {currentStep === "visual-test" && (
          <TestVisualEditor />
        )}

        {currentStep === "claude-test" && (
          <ClaudeTestComponent />
        )}
      </div>
    </div>
  );
} 