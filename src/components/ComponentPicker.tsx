"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { componentsRegistry, ComponentDefinition, getComponentDefinition, getAllComponents } from "@/lib/components-registry";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { Wand2 } from "lucide-react";

// Simple debounce hook implementation
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Create a client-only version of ComponentPickerItem
const NoSSRComponentPickerItem = dynamic(() => Promise.resolve(ComponentPickerItem), {
  ssr: false,
});

export function ComponentPicker() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  // Add client-side only state to ensure this component is fully client-side
  const [mounted, setMounted] = useState(false);
  
  // Only render items on client side
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const allComponents = getAllComponents();
  const filteredComponents = allComponents.filter((component) => {
    if (!debouncedSearchTerm) return true;
    return (
      component.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      component.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  });

  // Group components by category
  const componentsByCategory = filteredComponents.reduce<Record<string, ComponentDefinition[]>>((acc, component) => {
    const category = component.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {});

  const categories = Object.keys(componentsByCategory).sort((a, b) => {
    // Improved systematic category order for better user experience
    const order = [
      // === CORE COMPONENTS === (Most frequently used)
      "Form Controls",           // Buttons, inputs, checkboxes - most common
      "Text & Content",          // Text, headings, labels - content creation
      "Data Display",            // Tables, outputs, displays - showing information
      
      // === LAYOUT & STRUCTURE === 
      "Layout & Containers",     // Groups, cards, containers - organizing content
      "Visual Elements",         // Icons, images, alerts - visual enhancements
      
      // === DESIGN ELEMENTS ===
      "Shapes & Graphics",       // All shapes (filled and outlined)
      
      // === ADVANCED FEATURES ===
      "File & Media",           // File uploads, image handling
      "Advanced Components",     // Complex multi-part components
      
      // === AI & AUTOMATION ===
      "AI Components",          // All AI-related functionality
      "AI Tools",               // AI development tools
      
      // === DEVELOPMENT ===
      "Development Tools"       // Debug and development utilities
    ];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="w-64 h-full border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Components</h2>
        <Input
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        {/* Generate Custom Component section - moved to top */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-blue-500 mb-2 flex items-center">
            <Wand2 className="mr-1 h-4 w-4" />
            Custom Component
          </h3>
          <div
            className="p-3 border-2 border-dashed border-blue-300 bg-blue-50 rounded-md cursor-pointer transition-all hover:bg-blue-100 hover:shadow-sm text-center"
            onClick={() => {
              // Dispatch a custom event that will be listened to by the parent component to show AI generator
              const event = new CustomEvent("showAIComponentGenerator", {
                detail: {
                  show: true,
                },
              });
              window.dispatchEvent(event);
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-blue-700">Generate Custom Component</span>
              <span className="text-xs text-blue-500 mt-1">
                Can't find what you need? Create a custom component with AI
              </span>
            </div>
          </div>
        </div>
        
        {mounted && categories.map((category, index) => {
          // Define category colors and icons for better visual organization
          const getCategoryStyle = (category: string) => {
            const styles: Record<string, { color: string; bg: string; border: string }> = {
              "Form Controls": { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
              "Text & Content": { color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
              "Data Display": { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
              "Layout & Containers": { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
              "Visual Elements": { color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
              "Shapes & Graphics": { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
              "File & Media": { color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
              "Advanced Components": { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
              "AI Components": { color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
              "AI Tools": { color: "text-fuchsia-600", bg: "bg-fuchsia-50", border: "border-fuchsia-200" },
              "Development Tools": { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" }
            };
            return styles[category] || { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
          };
          
          const style = getCategoryStyle(category);
          
          return (
            <div key={category} className="mb-6">
              <div className={`${style.bg} ${style.border} border rounded-lg p-3 mb-3`}>
                <h3 className={`text-sm font-semibold ${style.color} mb-2 flex items-center`}>
                  <span className="mr-2">
                    {category === "Form Controls" && "🎛️"}
                    {category === "Text & Content" && "📝"}
                    {category === "Data Display" && "📊"}
                    {category === "Layout & Containers" && "📦"}
                    {category === "Visual Elements" && "🎨"}
                    {category === "Shapes & Graphics" && "🔷"}
                    {category === "File & Media" && "📁"}
                    {category === "Advanced Components" && "⚙️"}
                    {category === "AI Components" && "🤖"}
                    {category === "AI Tools" && "🛠️"}
                    {category === "Development Tools" && "🔧"}
                  </span>
                  {category}
                  <span className="ml-auto text-xs font-normal opacity-70">
                    {componentsByCategory[category].length}
                  </span>
                </h3>
                <div className="space-y-1">
                  {componentsByCategory[category].map((component) => (
                    <NoSSRComponentPickerItem 
                      key={component.type} 
                      component={component} 
                      isAIComponent={component.type.startsWith('AI')}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        
        {!mounted && (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ComponentPickerItemProps {
  component: ComponentDefinition;
  isAIComponent?: boolean;
}

// Use a client-only component for the draggable items
function ComponentPickerItem({ component, isAIComponent = false }: ComponentPickerItemProps) {
  // Initialize with default values to prevent hydration mismatches
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-${component.type}`,
    data: {
      type: component.type,
      isComponentPickerItem: true,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 border border-gray-200 rounded-md cursor-grab transition-all hover:border-blue-300 hover:shadow-sm",
        isDragging ? "opacity-50" : "",
        isAIComponent ? "border-dashed border-blue-300" : ""
      )}
    >
      <div className="flex items-center space-x-2">
        {component.icon && (
          <div className="flex-shrink-0 text-gray-600">
            {component.icon}
          </div>
        )}
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium">{component.label}</span>
          {isAIComponent ? (
            <span className="text-xs text-blue-500">AI-powered component</span>
          ) : (
            <span className="text-xs text-gray-500">Drag to canvas</span>
          )}
        </div>
      </div>
    </div>
  );
}
