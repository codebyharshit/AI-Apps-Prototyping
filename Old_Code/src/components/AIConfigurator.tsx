import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  AIFunctionalityConfig,
  AIFunctionality,
} from "@/components/AIFunctionalityConfig";
import { ComponentData } from "@/lib/utils";

interface AIConfiguratorProps {
  components: ComponentData[];
  onHoverComponent?: (id: string | null) => void;
}

export function AIConfigurator({
  components,
  onHoverComponent,
}: AIConfiguratorProps) {
  const [functionalities, setFunctionalities] = useState<AIFunctionality[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load AI functionalities from localStorage on mount
  useEffect(() => {
    const savedFunctionalities = localStorage.getItem("aiFunctionalities");
    if (savedFunctionalities) {
      try {
        const parsed = JSON.parse(savedFunctionalities);
        setFunctionalities(parsed);
      } catch (e) {
        console.error("Failed to parse saved AI functionalities:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save AI functionalities to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        "aiFunctionalities",
        JSON.stringify(functionalities)
      );
    }
  }, [functionalities, isInitialized]);

  const addNewFunctionality = () => {
    const newFunctionality: AIFunctionality = {
      id: uuidv4(),
      name: `AI Function ${functionalities.length + 1}`,
      inputComponentIds: [null],
      outputComponentId: null,
      triggerComponentId: null,
      systemPrompt: "",
    };

    setFunctionalities((prev) => [...prev, newFunctionality]);
  };

  const updateFunctionality = (updatedFunctionality: AIFunctionality) => {
    setFunctionalities((prev) =>
      prev.map((func) =>
        func.id === updatedFunctionality.id ? updatedFunctionality : func
      )
    );
  };

  const deleteFunctionality = (id: string) => {
    setFunctionalities((prev) => prev.filter((func) => func.id !== id));
  };

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <div className="flex justify-between items-center w-full px-4">
          <h2 className="text-lg font-semibold">AI Configuration</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-2">
        {functionalities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500">
            <p className="mb-4">No AI functionalities configured yet.</p>
            <Button onClick={addNewFunctionality}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add AI Functionality
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {functionalities.map((functionality) => (
              <AIFunctionalityConfig
                key={functionality.id}
                functionality={functionality}
                components={components}
                onUpdate={updateFunctionality}
                onDelete={deleteFunctionality}
                onHoverComponent={onHoverComponent}
              />
            ))}
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        {functionalities.length > 0 && (
          <Button onClick={addNewFunctionality} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add AI Functionality
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
