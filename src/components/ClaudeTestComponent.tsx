import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Zap, Sparkles, Loader2 } from "lucide-react";

export const ClaudeTestComponent: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"deepseek" | "claude">("deepseek");
  const [testResults, setTestResults] = useState<{
    deepseek: { response: string; time: number; success: boolean };
    claude: { response: string; time: number; success: boolean };
  }>({
    deepseek: { response: "", time: 0, success: false },
    claude: { response: "", time: 0, success: false }
  });

  const testAI = async (provider: "deepseek" | "claude") => {
    if (!inputText.trim()) {
      alert("Please enter some text to test");
      return;
    }

    setIsLoading(true);
    setSelectedProvider(provider);
    const startTime = Date.now();

    try {
      const endpoint = provider === "claude" ? "/api/ai/claude-chat" : "/api/ai/chat";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: "You are a helpful AI assistant. Please respond to the user's input.",
          messages: [
            { role: "user", content: inputText }
          ],
          model: provider === "claude" ? "claude-3-5-sonnet-20241022" : "deepseek-chat"
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data?.data?.response || "No response generated";

      setResponse(aiResponse);
      
      // Update test results
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          response: aiResponse,
          time: responseTime,
          success: true
        }
      }));

    } catch (error) {
      console.error(`Error testing ${provider}:`, error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Update test results with error
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          time: Date.now() - startTime,
          success: false
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const compareResults = () => {
    const { deepseek, claude } = testResults;
    
    if (!deepseek.success || !claude.success) {
      return "Both tests need to complete successfully to compare results.";
    }

    const deepseekLength = deepseek.response.length;
    const claudeLength = claude.response.length;
    const deepseekTime = deepseek.time;
    const claudeTime = claude.time;

    let comparison = "## AI Model Comparison\n\n";
    
    // Response length comparison
    comparison += `**Response Length:**\n`;
    comparison += `- DeepSeek: ${deepseekLength} characters\n`;
    comparison += `- Claude: ${claudeLength} characters\n`;
    comparison += `- Difference: ${Math.abs(deepseekLength - claudeLength)} characters\n\n`;
    
    // Response time comparison
    comparison += `**Response Time:**\n`;
    comparison += `- DeepSeek: ${deepseekTime}ms\n`;
    comparison += `- Claude: ${claudeTime}ms\n`;
    comparison += `- Difference: ${Math.abs(deepseekTime - claudeTime)}ms\n\n`;
    
    // Winner determination
    const speedWinner = deepseekTime < claudeTime ? "DeepSeek" : "Claude";
    const lengthWinner = deepseekLength > claudeLength ? "DeepSeek" : "Claude";
    
    comparison += `**Results:**\n`;
    comparison += `- Speed Winner: ${speedWinner}\n`;
    comparison += `- Length Winner: ${lengthWinner}\n\n`;
    
    comparison += `**Recommendation:**\n`;
    if (deepseekTime < claudeTime && deepseekLength > claudeLength) {
      comparison += "DeepSeek appears to be faster and more detailed for this type of query.";
    } else if (claudeTime < deepseekTime && claudeLength > deepseekLength) {
      comparison += "Claude appears to be faster and more detailed for this type of query.";
    } else if (deepseekTime < claudeTime) {
      comparison += "DeepSeek is faster, but Claude provides more detailed responses.";
    } else {
      comparison += "Claude is faster, but DeepSeek provides more detailed responses.";
    }

    return comparison;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-6 w-6" />
            <span>AI Model Testing & Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-input">Test Input</Label>
            <Textarea
              id="test-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to test both AI models..."
              rows={3}
            />
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={() => testAI("deepseek")}
              disabled={isLoading || !inputText.trim()}
              className="flex-1"
              variant="outline"
            >
              {isLoading && selectedProvider === "deepseek" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test DeepSeek
            </Button>

            <Button
              onClick={() => testAI("claude")}
              disabled={isLoading || !inputText.trim()}
              className="flex-1"
              variant="outline"
            >
              {isLoading && selectedProvider === "claude" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Test Claude
            </Button>
          </div>

          {response && (
            <div className="space-y-2">
              <Label>Response from {selectedProvider === "claude" ? "Claude" : "DeepSeek"}</Label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results Comparison */}
      {(testResults.deepseek.success || testResults.claude.success) && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span>DeepSeek Results</span>
                </Label>
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <p className="text-sm">
                    <strong>Status:</strong> {testResults.deepseek.success ? "✅ Success" : "❌ Failed"}
                  </p>
                  {testResults.deepseek.success && (
                    <>
                      <p className="text-sm">
                        <strong>Time:</strong> {testResults.deepseek.time}ms
                      </p>
                      <p className="text-sm">
                        <strong>Length:</strong> {testResults.deepseek.response.length} characters
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span>Claude Results</span>
                </Label>
                <div className="p-3 bg-purple-50 rounded-lg border">
                  <p className="text-sm">
                    <strong>Status:</strong> {testResults.claude.success ? "✅ Success" : "❌ Failed"}
                  </p>
                  {testResults.claude.success && (
                    <>
                      <p className="text-sm">
                        <strong>Time:</strong> {testResults.claude.time}ms
                      </p>
                      <p className="text-sm">
                        <strong>Length:</strong> {testResults.claude.response.length} characters
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {testResults.deepseek.success && testResults.claude.success && (
              <div className="space-y-2">
                <Label>Analysis & Recommendation</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm">{compareResults()}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. <strong>Enter test text</strong> - Type a question or prompt to test both AI models</p>
          <p>2. <strong>Test both models</strong> - Click the test buttons to run your prompt through each AI</p>
          <p>3. <strong>Compare results</strong> - See response times, lengths, and quality differences</p>
          <p>4. <strong>Make informed decisions</strong> - Use the comparison to choose the best model for your needs</p>
          <p className="mt-4 text-xs">
            <strong>Note:</strong> Make sure you have configured both DeepSeek and Claude API keys in the settings panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

