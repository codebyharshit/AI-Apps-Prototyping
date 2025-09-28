import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ComponentData } from "@/lib/utils";
import { getComponentDefinition } from "@/lib/components-registry";
import { Trash2, Plus } from "lucide-react";

export interface AIFunctionality {
  id: string;
  name: string;
  inputComponentIds: string[];
  outputComponentId: string | null;
  triggerComponentId: string | null;
  systemPrompt: string;
}

interface AIFunctionalityConfigProps {
  functionality: AIFunctionality;
  components: ComponentData[];
  onUpdate: (functionality: AIFunctionality) => void;
  onDelete: (id: string) => void;
  onHoverComponent?: (id: string | null) => void;
}

export const AIFunctionalityConfig: React.FC<AIFunctionalityConfigProps> = ({
  functionality,
  components,
  onUpdate,
  onDelete,
  onHoverComponent,
}) => {
  const [name, setName] = useState(functionality.name);
  const [inputComponentIds, setInputComponentIds] = useState<string[]>(
    functionality.inputComponentIds || [null]
  );
  const [outputComponentId, setOutputComponentId] = useState<string | null>(
    functionality.outputComponentId
  );
  const [triggerComponentId, setTriggerComponentId] = useState<string | null>(
    functionality.triggerComponentId
  );
  const [systemPrompt, setSystemPrompt] = useState(functionality.systemPrompt);

  // Filter components by category or type for easier selection
  const inputComponents = components.filter((c) => {
    const def = getComponentDefinition(c.type);
    return (
      def &&
      (def.category === "Input" ||
        c.type === "Textarea" ||
        c.type === "Input" ||
        c.type === "ImageUpload")
    );
  });

  const outputComponents = components.filter((c) => {
    const def = getComponentDefinition(c.type);
    return def && (def.category === "Output" || c.type === "TextOutput");
  });

  const triggerComponents = components.filter((c) => {
    const def = getComponentDefinition(c.type);
    return def && c.type === "Button";
  });

  // Update the parent component when any value changes
  useEffect(() => {
    onUpdate({
      ...functionality,
      name,
      inputComponentIds,
      outputComponentId,
      triggerComponentId,
      systemPrompt,
    });
  }, [
    name,
    inputComponentIds,
    outputComponentId,
    triggerComponentId,
    systemPrompt,
  ]);

  // Handle mouse enter/leave for component highlighting
  const handleMouseEnter = (componentId: string) => {
    if (onHoverComponent) {
      onHoverComponent(componentId);
    }
  };

  const handleMouseLeave = () => {
    if (onHoverComponent) {
      onHoverComponent(null);
    }
  };

  const handleAddInput = () => {
    setInputComponentIds([...inputComponentIds, null]);
  };

  const handleRemoveInput = (index: number) => {
    setInputComponentIds(inputComponentIds.filter((_, i) => i !== index));
  };

  const handleInputChange = (index: number, value: string | null) => {
    const newInputComponentIds = [...inputComponentIds];
    newInputComponentIds[index] = value;
    setInputComponentIds(newInputComponentIds);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border-none p-0 text-md font-semibold focus:outline-none focus:ring-0"
              placeholder="AI Functionality Name"
            />
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(functionality.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Input Components</Label>
          {inputComponentIds.map((inputComponentId, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Select
                onValueChange={(value) =>
                  handleInputChange(index, value || null)
                }
                value={inputComponentId || undefined}
              >
                <SelectTrigger id={`input-${functionality.id}-${index}`}>
                  <SelectValue placeholder="Select an input component" />
                </SelectTrigger>
                <SelectContent>
                  {inputComponents.map((comp) => (
                    <SelectItem
                      key={comp.id}
                      value={comp.id}
                      onMouseEnter={() => handleMouseEnter(comp.id)}
                      onMouseLeave={handleMouseLeave}
                      className="cursor-pointer hover:bg-blue-50"
                    >
                      {comp.type} - {comp.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveInput(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddInput}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Input
          </Button>
        </div>

        {/* Output Component */}
        <div className="space-y-2">
          <Label htmlFor={`output-${functionality.id}`}>Output Component</Label>
          <Select
            onValueChange={(value) => setOutputComponentId(value || null)}
            value={outputComponentId || undefined}
          >
            <SelectTrigger id={`output-${functionality.id}`}>
              <SelectValue placeholder="Select an output component" />
            </SelectTrigger>
            <SelectContent>
              {outputComponents.map((comp) => (
                <SelectItem
                  key={comp.id}
                  value={comp.id}
                  onMouseEnter={() => handleMouseEnter(comp.id)}
                  onMouseLeave={handleMouseLeave}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  {comp.type} - {comp.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trigger Component */}
        <div className="space-y-2">
          <Label htmlFor={`trigger-${functionality.id}`}>
            Trigger Component
          </Label>
          <Select
            onValueChange={(value) => setTriggerComponentId(value || null)}
            value={triggerComponentId || undefined}
          >
            <SelectTrigger id={`trigger-${functionality.id}`}>
              <SelectValue placeholder="Select a trigger component" />
            </SelectTrigger>
            <SelectContent>
              {triggerComponents.map((comp) => (
                <SelectItem
                  key={comp.id}
                  value={comp.id}
                  onMouseEnter={() => handleMouseEnter(comp.id)}
                  onMouseLeave={handleMouseLeave}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  {comp.type} - {comp.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor={`system-prompt-${functionality.id}`}>
            System Prompt
          </Label>
          <Textarea
            id={`system-prompt-${functionality.id}`}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter a system prompt for the AI..."
            className="h-32 resize-y"
          />
        </div>
      </CardContent>
    </Card>
  );
};
