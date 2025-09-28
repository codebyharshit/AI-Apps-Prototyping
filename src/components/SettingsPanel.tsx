import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { AIModelSelector } from "./AIModelSelector";

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>("");
  const [claudeApiKey, setClaudeApiKey] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const savedDeepseekKey = localStorage.getItem("deepseekApiKey") || "";
    const savedClaudeKey = localStorage.getItem("claudeApiKey") || "";
    setDeepseekApiKey(savedDeepseekKey);
    setClaudeApiKey(savedClaudeKey);
  }, []);

  const handleSave = () => {
    // Save API keys to localStorage (in a real app, consider more secure options)
    localStorage.setItem("deepseekApiKey", deepseekApiKey);
    localStorage.setItem("claudeApiKey", claudeApiKey);
    
    // Update API keys in session
    updateApiKeysInSession();
    
    // Show saved confirmation
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const updateApiKeysInSession = async () => {
    try {
      // Update DeepSeek API key
      if (deepseekApiKey) {
        const deepseekResponse = await fetch('/api/settings/update-api-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey: deepseekApiKey, provider: "deepseek" }),
        });
        
        if (!deepseekResponse.ok) {
          throw new Error('Failed to update DeepSeek API key');
        }
      }

      // Update Claude API key
      if (claudeApiKey) {
        const claudeResponse = await fetch('/api/settings/update-api-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey: claudeApiKey, provider: "claude" }),
        });
        
        if (!claudeResponse.ok) {
          throw new Error('Failed to update Claude API key');
        }
      }
    } catch (error) {
      console.error('Error updating API keys:', error);
      // At least the keys are saved in localStorage for next session
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deepseek-api-key">DeepSeek API Key</Label>
          <Input
            id="deepseek-api-key"
            type="password"
            value={deepseekApiKey}
            onChange={(e) => setDeepseekApiKey(e.target.value)}
            placeholder="Enter your DeepSeek API key"
          />
          <p className="text-xs text-gray-500">
            Your API key is stored in your browser and only sent to the DeepSeek API.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="claude-api-key">Claude API Key</Label>
          <Input
            id="claude-api-key"
            type="password"
            value={claudeApiKey}
            onChange={(e) => setClaudeApiKey(e.target.value)}
            placeholder="Enter your Claude API key"
          />
          <p className="text-xs text-gray-500">
            Your Claude API key is stored in your browser and only sent to the Claude API.
          </p>
        </div>

        <div className="pt-4 border-t">
          <AIModelSelector 
            onModelChange={(model, provider) => {
              console.log(`Model changed to: ${model} (${provider})`);
              // You can store this preference in localStorage or state
              localStorage.setItem("preferredModel", model);
              localStorage.setItem("preferredProvider", provider);
            }}
            currentModel={localStorage.getItem("preferredModel") || "deepseek-chat"}
            currentProvider={localStorage.getItem("preferredProvider") || "deepseek"}
          />
        </div>

        <Button
          onClick={handleSave}
          className="w-full"
          disabled={isSaved}
        >
          {isSaved ? "Saved!" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}; 