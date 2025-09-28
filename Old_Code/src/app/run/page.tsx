"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ComponentData, FrameData } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getComponentDefinition } from "@/lib/components-registry";
import { AIFunctionality } from "@/components/AIFunctionalityConfig";
import AIService from "@/lib/ai-service";

export default function RunMode() {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [componentsToRender, setComponentsToRender] = useState<ComponentData[]>(
    []
  );
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [activeFrame, setActiveFrame] = useState<FrameData | null>(null);
  const [aiFunctionalities, setAIFunctionalities] = useState<AIFunctionality[]>(
    []
  );
  const [isComponentsLoaded, setIsComponentsLoaded] = useState(false);
  const [componentStates, setComponentStates] = useState<Record<string, any>>(
    {}
  );
  const aiServiceRef = useRef<AIService | null>(null);

  useEffect(() => {
    // Retrieve components from localStorage
    const savedComponents = localStorage.getItem("prototypeComponents");
    if (savedComponents) {
      setComponents(JSON.parse(savedComponents));
    }

    // Retrieve frames from localStorage
    const savedFrames = localStorage.getItem("prototypeFrames");
    if (savedFrames) {
      setFrames(JSON.parse(savedFrames));
    }

    // Retrieve AI functionalities from localStorage
    const savedFunctionalities = localStorage.getItem("aiFunctionalities");
    if (savedFunctionalities) {
      setAIFunctionalities(JSON.parse(savedFunctionalities));
    }

    setIsComponentsLoaded(true);
  }, []);

  // Initialize AI service after components are rendered
  useEffect(() => {
    if (isComponentsLoaded && aiFunctionalities.length > 0) {
      const timer = setTimeout(() => {
        // Clean up the old service if it exists
        if (aiServiceRef.current) {
          aiServiceRef.current.destroy(); // You'd need to add a destroy() method to AIService
          aiServiceRef.current = null;
        }

        // Create and initialize the new service
        const aiService = new AIService(aiFunctionalities, setComponentStates);
        aiServiceRef.current = aiService;
        aiService.initialize();
      }, 100);

      return () => {
        clearTimeout(timer);
        // Clean up when the component unmounts or dependencies change
        if (aiServiceRef.current) {
          aiServiceRef.current.destroy();
          aiServiceRef.current = null;
        }
      };
    }
  }, [isComponentsLoaded, aiFunctionalities, activeFrame]);

  // Select initial active frame after components are loaded
  useEffect(() => {
    if (isComponentsLoaded) {
      // Retrieve home frame from localStorage
      const savedHomeFrameId = localStorage.getItem("homeFrameId");
      // If there is no user-specified home frame, we'll render the first frame's content
      setActiveFrame(
        savedHomeFrameId
          ? frames.find((f) => f.id === savedHomeFrameId)
          : frames.length > 0
          ? frames[0]
          : null
      );
    }
  }, [isComponentsLoaded, frames]);

  useEffect(() => {
    setComponentsToRender(
      activeFrame
        ? components.filter((comp) => comp.frameId === activeFrame.id)
        : components
    );
  }, [activeFrame, components]);

  // Custom hook to handle AI functionality execution with cross-frame navigation
  const handleAIFunctionality = (functionality: AIFunctionality) => {
    // Execute the AI functionality (the AI service will handle the rest)
    if (aiServiceRef.current) {
      // Use the public method to execute the functionality
      aiServiceRef.current.executeAIFunctionality(functionality);
    }
  };

  const renderComponent = (component: ComponentData) => {
    const componentDef = getComponentDefinition(component.type);
    if (!componentDef) return null;

    const componentState = componentStates[component.id] || {};

    const renderedComponent = componentDef.render({
      className: "w-full h-full",
      id: `run-${component.id}`,
      isInteractive: true,
      value: componentState.value,
      content: componentState.content,
      onChange: (e: any) => {
        const value = e.target?._valueTracker?.getValue?.() ?? e;
        setComponentStates((prevState) => ({
          ...prevState,
          [component.id]: { ...componentState, value },
        }));
      },
      ...(component.properties || {}),
    });

    // Check for navigation and AI functionality triggers
    const hasNavigateTo = component.properties?.navigateTo;
    const aiTrigger = aiFunctionalities.find(
      (func) => func.triggerComponentId === component.id
    );

    // If the component has either navigation or AI trigger, wrap it with a click handler
    if (hasNavigateTo || aiTrigger) {
      return (
        <div
          className="w-full h-full cursor-pointer"
          onClick={() => {
            // If it's an AI trigger, execute the AI functionality first
            if (aiTrigger) {
              handleAIFunctionality(aiTrigger);
            }

            // If it has navigation, set the active frame after AI functionality (if any)
            if (hasNavigateTo) {
              // Find the frame with the ID matching navigateTo
              const targetFrame = frames.find(
                (f) => f.id === component.properties.navigateTo
              );
              if (targetFrame) {
                setActiveFrame(targetFrame);
              }
            }
          }}
        >
          {renderedComponent}
        </div>
      );
    }

    return renderedComponent;
  };

  return (
    <main className="flex flex-col h-screen w-full overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Editor
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Run Mode</h1>
        </div>
        {aiFunctionalities.length > 0 && (
          <div className="text-sm text-green-600">
            {aiFunctionalities.length} AI{" "}
            {aiFunctionalities.length === 1
              ? "functionality"
              : "functionalities"}{" "}
            active
          </div>
        )}
      </header>
      <div className="w-full flex-1 bg-gray-100 overflow-auto p-6">
        <div className="min-h-full flex items-center justify-center">
          <div
            className="relative bg-white border-2 border-gray-300 rounded-md overflow-hidden"
            style={
              activeFrame
                ? {
                    width: activeFrame.size.width,
                    height: activeFrame.size.height,
                  }
                : {}
            }
          >
            {componentsToRender.map((component) => (
              <div
                key={component.id}
                className="absolute"
                style={{
                  left: `${
                    component.position.x - (activeFrame?.position.x || 0)
                  }px`,
                  top: `${
                    component.position.y - (activeFrame?.position.y || 0)
                  }px`,
                  width: component.size.width,
                  height: component.size.height,
                }}
              >
                {renderComponent(component)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
