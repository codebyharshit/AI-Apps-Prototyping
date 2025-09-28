"use client";

import { MarkdownOutput } from '@/components/ui/markdownoutput';
import { AIDropdownOutput } from '@/components/ui/ai-dropdown-output';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const sampleDashboardMarkdown = `# 📧 User Information

**Name:** Bob Johnson  
**Email:** bob.j@example.com  
**Phone:** (555) 234-5678  
**Member since:** 2022-07-15  

---
**Statistics:**
- 🛒 **8 Orders**
- 💰 **$950.00 Spent**

## 💬 Support Tickets

### Active Tickets: 2

#### 🔴 High Priority
- **Product not as described**
  - Order: ORD-B001
  - Status: ⏳ In-Progress
  - Updated: 2025-10-15

#### 🟡 Medium Priority  
- **Late delivery**
  - Order: ORD-B002
  - Status: 🔴 Open
  - Updated: 2025-10-14

## 📦 Recent Orders

### Order History: 3 orders

#### Order ORD-B001 - $99.99
- **Date:** 2025-08-08
- **Items:** 1 item
- **Payment:** ✅ Paid
- **Shipping:** 🚚 Delivered

#### Order ORD-B002 - $180.00
- **Date:** 2025-08-21
- **Items:** 2 items
- **Payment:** ✅ Paid
- **Shipping:** 📦 In-Transit

---

*Note: Excel date values were converted to standard YYYY-MM-DD format (44764 = 2022-07-15, 45888 = 2025-08-05, etc.)*`;

export default function TestMarkdownDashboard() {
  const [userInput, setUserInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [aiDropdownContent, setAiDropdownContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate AI processing to generate dropdown options
  const processAIRequest = async () => {
    if (!userInput.trim()) return;
    
    setIsProcessing(true);
    setAiDropdownContent('');
    setSelectedOption('');

    try {
      // Simulate AI API call with delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate context-aware options based on input
      let options: string[] = [];
      
      if (userInput.toLowerCase().includes('color')) {
        options = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
      } else if (userInput.toLowerCase().includes('food') || userInput.toLowerCase().includes('eat')) {
        options = ['Pizza', 'Burger', 'Sushi', 'Pasta', 'Salad', 'Tacos'];
      } else if (userInput.toLowerCase().includes('country') || userInput.toLowerCase().includes('nation')) {
        options = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan'];
      } else if (userInput.toLowerCase().includes('animal')) {
        options = ['Dog', 'Cat', 'Eagle', 'Lion', 'Dolphin', 'Elephant'];
      } else if (userInput.toLowerCase().includes('programming') || userInput.toLowerCase().includes('language')) {
        options = ['JavaScript', 'Python', 'TypeScript', 'Java', 'C++', 'Go'];
      } else if (userInput.toLowerCase().includes('task') || userInput.toLowerCase().includes('project')) {
        // Simulate task list matching
        const taskList = [
          { name: 'Complete User Authentication', link: 'https://project.com/auth-task' },
          { name: 'Design Database Schema', link: 'https://project.com/db-schema' },
          { name: 'Implement Payment Gateway', link: 'https://project.com/payment' },
          { name: 'Create API Documentation', link: 'https://project.com/api-docs' },
          { name: 'Setup CI/CD Pipeline', link: 'https://project.com/cicd' },
          { name: 'Write Unit Tests', link: 'https://project.com/unit-tests' }
        ];
        
        // Find matching tasks based on input
        const matchingTasks = taskList.filter(task => 
          task.name.toLowerCase().includes(userInput.toLowerCase().replace('task', '').trim()) ||
          userInput.toLowerCase().includes(task.name.toLowerCase().split(' ')[0])
        );
        
        if (matchingTasks.length > 0) {
          options = matchingTasks.map(task => `${task.name} - ${task.link}`);
        } else {
          // If no exact matches, show all tasks
          options = taskList.map(task => `${task.name} - ${task.link}`);
        }
      } else {
        // Default options based on input keywords
        const words = userInput.toLowerCase().split(' ');
        if (words.includes('technology')) {
          options = ['Artificial Intelligence', 'Machine Learning', 'Blockchain', 'Cloud Computing', 'IoT', 'Cybersecurity'];
        } else if (words.includes('music')) {
          options = ['Rock', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country'];
        } else {
          options = [`Option for "${userInput}"`, 'Alternative Choice', 'Another Option', 'Custom Selection', 'Final Choice'];
        }
      }

      // Convert to string format (newline separated)
      setAiDropdownContent(options.join('\n'));
    } catch (error) {
      console.error('Error processing AI request:', error);
      setAiDropdownContent('Error\nFailed to process\nTry again');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">AI Dropdown Output Demo</h1>
        
        {/* AI Dropdown Demo Section */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">🤖 AI-Powered Dropdown Demo</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div>
              <h3 className="text-lg font-medium mb-3">Input for AI Processing:</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Type task name or keyword (e.g., 'authentication', 'database', 'payment')"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full"
                />
                <Button 
                  onClick={processAIRequest}
                  disabled={!userInput.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'AI Processing...' : 'Send to AI & Generate Options'}
                </Button>
                
                {/* Sample prompts */}
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Try these examples:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['favorite color', 'task authentication', 'programming language', 'project database', 'task payment'].map((example) => (
                      <button
                        key={example}
                        onClick={() => setUserInput(example)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Dropdown Output Section */}
            <div>
              <h3 className="text-lg font-medium mb-3">AI-Generated Dropdown:</h3>
              <AIDropdownOutput
                placeholder="AI will populate options..."
                content={aiDropdownContent}
                selectedValue={selectedOption}
                onChange={setSelectedOption}
                loading={isProcessing}
                loadingText="AI is generating options..."
                emptyStateText="Send input to AI first"
                className="w-full mb-3"
              />
              
              {selectedOption && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">
                    <strong>Selected:</strong> {selectedOption}
                  </p>
                </div>
              )}
              
              {aiDropdownContent && !isProcessing && (
                <div className="mt-4 p-3 bg-gray-50 border rounded">
                  <p className="text-sm font-medium text-gray-700 mb-2">AI Generated Content:</p>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">{aiDropdownContent}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">🔧 How to Integrate with Real AI Functionality</h2>
          <div className="space-y-4 text-blue-900">
            <div>
              <h3 className="font-semibold mb-2">1. Add AI Dropdown Output to Canvas:</h3>
              <p className="text-sm">In the main app, go to Components → AI → "AI Dropdown Output" and drag it to your canvas.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Set up AI Functionality:</h3>
              <p className="text-sm">Configure an AI functionality with:</p>
              <ul className="text-sm mt-1 ml-4 list-disc">
                <li><strong>Input Component:</strong> Any text input component</li>
                <li><strong>Output Component:</strong> Your AI Dropdown Output component</li>
                <li><strong>System Prompt:</strong> "Based on the Task List Table provided in the input, analyze the user's text input to find the task name. Search through the task list to find matching or related tasks and their associated links. Return only the matching task names with their links in this format: 'Task Name - Link URL', one per line, no additional text or explanations."</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. AI Processing:</h3>
              <p className="text-sm">The AI will process the input and populate the dropdown with contextual options automatically.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Raw Markdown */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Original Markdown Demo - Raw Source:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96 border">
              {sampleDashboardMarkdown}
            </pre>
          </div>
          
          {/* Rendered Markdown */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Original Markdown Demo - Rendered Output:</h2>
            <div className="border border-gray-300 rounded-lg">
              <MarkdownOutput
                placeholder="Dashboard content will appear here..."
                content={sampleDashboardMarkdown}
                enableMarkdown={true}
                enableCodeHighlight={true}
                className="min-h-96"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Expected Results:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>✅ Headers should be properly sized and styled</li>
            <li>✅ **Bold text** should render as bold</li>
            <li>✅ Emojis should display correctly</li>
            <li>✅ Lists should be properly indented</li>
            <li>✅ Horizontal rules (---) should show as dividers</li>
            <li>✅ Status icons should align properly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

