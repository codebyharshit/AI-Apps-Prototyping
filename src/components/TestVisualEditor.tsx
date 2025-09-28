"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { VisualManipulationTools } from "./VisualManipulationTools";

export function TestVisualEditor() {
  const [showEditor, setShowEditor] = useState(false);
  const [testHtml, setTestHtml] = useState(`
<!DOCTYPE html>
<html>
<head>
<style>
.test-component {
  font-family: Arial, sans-serif;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
  max-width: 400px;
}

.title {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

.button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.button:hover {
  background-color: #0056b3;
}
</style>
</head>
<body>
<div class="test-component">
  <h1 class="title">Test Component</h1>
  <p class="description">This is a test component for the visual editor. Click on elements to select them and modify their styles.</p>
  <button class="button">Click Me</button>
</div>
</body>
</html>
  `);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test Visual Editor</h2>
      <Button onClick={() => setShowEditor(true)} className="mb-4">
        Open Visual Editor
      </Button>
      
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-6xl max-h-[90vh] overflow-y-auto">
            <VisualManipulationTools
              html={testHtml}
              onUpdateHtml={setTestHtml}
              onClose={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Current HTML:</h3>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
          {testHtml}
        </pre>
      </div>
    </div>
  );
} 