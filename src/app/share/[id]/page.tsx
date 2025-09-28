"use client";

import React, { useEffect, useState } from "react";
import { ComponentData, FrameData } from "@/lib/utils";
import { getComponentDefinition } from "@/lib/components-registry";
import { AIFunctionality } from "@/components/AIFunctionalityConfig";
import AIService from "@/lib/ai-service";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink } from "lucide-react";

interface SharedPrototypeProps {
  params: { id: string };
}

export default function SharedPrototype({ params }: SharedPrototypeProps) {
  const [prototype, setPrototype] = useState<any>(null);
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [activeFrame, setActiveFrame] = useState<FrameData | null>(null);
  const [aiFunctionalities, setAIFunctionalities] = useState<AIFunctionality[]>([]);
  const [componentStates, setComponentStates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrototype();
  }, [params.id]);

  const fetchPrototype = async () => {
    try {
      const response = await fetch(`/api/publish?id=${params.id}`);
      
      if (!response.ok) {
        throw new Error('Prototype not found');
      }
      
      const result = await response.json();
      const prototypeData = result.data;
      
      setPrototype(prototypeData);
      setComponents(prototypeData.components || []);
      setFrames(prototypeData.frames || []);
      setAIFunctionalities(prototypeData.aiFunctionalities || []);
      
      // Set initial frame (home frame or first frame)
      const homeFrame = prototypeData.frames?.[0];
      if (homeFrame) {
        setActiveFrame(homeFrame);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sharePrototype = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: prototype?.title || 'Shared Prototype',
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard!');
    }
  };

  const renderComponent = (component: ComponentData) => {
    const componentDef = getComponentDefinition(component.type);
    if (!componentDef) return null;

    const componentState = componentStates[component.id] || {};
    const safeProperties = component.properties || {};

    return componentDef.render({
      className: "w-full h-full",
      id: `shared-${component.id}`,
      isInteractive: true,
      ...safeProperties,
      value: componentState.value || safeProperties.value || "",
      content: componentState.content || safeProperties.content || "",
      onChange: (e: any) => {
        const value = e.target?.value ?? e;
        setComponentStates((prevState) => ({
          ...prevState,
          [component.id]: { ...componentState, value },
        }));
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading prototype...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Prototype Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            Create Your Own Prototype
          </Button>
        </div>
      </div>
    );
  }

  const componentsToRender = activeFrame
    ? components.filter((comp) => comp.frameId === activeFrame.id)
    : components;

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">{prototype?.title}</h1>
          <span className="ml-3 text-sm text-gray-500">
            {prototype?.views} views
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={sharePrototype}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm" onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Create Your Own
          </Button>
        </div>
      </header>

      {/* Prototype Viewer */}
      <div className="flex-1 bg-gray-100 overflow-auto p-6">
        <div className="min-h-full flex items-center justify-center">
          <div
            className="relative bg-white border-2 border-gray-300 rounded-md overflow-hidden shadow-lg"
            style={
              activeFrame
                ? {
                    width: activeFrame.size.width,
                    height: activeFrame.size.height,
                  }
                : { minWidth: "400px", minHeight: "300px" }
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

      {/* Footer */}
      <footer className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
        Created with AI App Prototyper • <a href="/" className="text-blue-600 hover:underline">Try it yourself</a>
      </footer>
    </div>
  );
} 