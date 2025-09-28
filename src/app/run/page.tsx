"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ComponentData, FrameData, applyStyleOverrides, applyContentChanges } from "@/lib/utils";
import { syncAllComponentsToRunMode } from "@/lib/run-mode-sync";
import { ArrowLeft, Layers, Eye, EyeOff, Users } from "lucide-react";
import Link from "next/link";
import { getComponentDefinition } from "@/lib/components-registry";
import { AIFunctionality } from "@/components/AIFunctionalityConfig";
import AIService from "@/lib/ai-service";
import { PersonaTesting } from "@/components/PersonaTesting";
import { Persona } from "@/components/PersonaManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RunMode() {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [componentsToRender, setComponentsToRender] = useState<ComponentData[]>(
    []
  );
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [activeFrame, setActiveFrame] = useState<FrameData | null>(null);
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [showPersonaPanel, setShowPersonaPanel] = useState(false);
  const [homeFrameId, setHomeFrameId] = useState<string | null>(null);
  const [aiFunctionalities, setAIFunctionalities] = useState<AIFunctionality[]>(
    []
  );
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isComponentsLoaded, setIsComponentsLoaded] = useState(false);
  const [componentStates, setComponentStates] = useState<Record<string, any>>(
    {}
  );
  const aiServiceRef = useRef<AIService | null>(null);

  useEffect(() => {
    // Retrieve components from localStorage
    const savedComponents = localStorage.getItem("prototypeComponents");
    if (savedComponents) {
      const parsedComponents = JSON.parse(savedComponents);
      console.log('🏃 RUN MODE: Loading components from localStorage');
      console.log('🏃 RUN MODE: Total components found:', parsedComponents.length);
      console.log('🏃 RUN MODE: Component details:', parsedComponents.map((c: any) => ({
        id: c.id,
        type: c.type,
        hasGeneratedCode: !!c.properties?.generatedCode,
        generatedCodeLength: c.properties?.generatedCode?.length || 0,
        lastRegenerated: c.properties?.lastRegenerated
      })));
      setComponents(parsedComponents);
    } else {
      console.warn('🏃 RUN MODE: No prototypeComponents found in localStorage');
    }

    // Retrieve frames from localStorage
    const savedFrames = localStorage.getItem("prototypeFrames");
    if (savedFrames) {
      setFrames(JSON.parse(savedFrames));
    }

    // Retrieve home frame ID from localStorage
    const savedHomeFrameId = localStorage.getItem("homeFrameId");
    if (savedHomeFrameId) {
      setHomeFrameId(savedHomeFrameId);
    }

    // Retrieve AI functionalities from localStorage
    const savedFunctionalities = localStorage.getItem("aiFunctionalities");
    if (savedFunctionalities) {
      setAIFunctionalities(JSON.parse(savedFunctionalities));
    }

    // Retrieve personas from localStorage
    const savedPersonas = localStorage.getItem("personas");
    if (savedPersonas) {
      setPersonas(JSON.parse(savedPersonas));
    }

    setIsComponentsLoaded(true);
    
    // CRITICAL: Sync all components to ensure changes are available
    syncAllComponentsToRunMode();
  }, []);

  // Listen for component reload events from the Editor
  useEffect(() => {
    const handleComponentReload = (event: any) => {
      console.log('🔄 RUN MODE: Received reloadComponents event:', event.detail);
      
      // Reload components from localStorage
      const savedComponents = localStorage.getItem("prototypeComponents");
      if (savedComponents) {
        const parsedComponents = JSON.parse(savedComponents);
        console.log('🔄 RUN MODE: Reloading components after regeneration');
        console.log('🔄 RUN MODE: Updated component count:', parsedComponents.length);
        setComponents(parsedComponents);
        
        // CRITICAL: Apply any pending sync data immediately
        parsedComponents.forEach((component: any) => {
          if (component.properties?.hasDirectManipulationChanges) {
            console.log(`🔄 RUN MODE: Component ${component.id} has changes that need to be applied`);
            // The AIComponentRenderer will handle applying these changes
          }
        });
        
        // Also update component states to ensure the new code is used
        if (event.detail.componentId) {
          const updatedComponent = parsedComponents.find((c: any) => c.id === event.detail.componentId);
          if (updatedComponent) {
            console.log('🔄 RUN MODE: Found updated component:', updatedComponent.id);
            console.log('🔄 RUN MODE: New generated code length:', updatedComponent.properties?.generatedCode?.length || 0);
          }
        }
      }
    };

    window.addEventListener('reloadComponents', handleComponentReload, { once: false });
    
    return () => {
      window.removeEventListener('reloadComponents', handleComponentReload);
    };
  }, []);

  // Initialize AI service after components are rendered
  useEffect(() => {
    if (isComponentsLoaded && aiFunctionalities.length > 0) {
      console.log('🔧 Setting up AI Service initialization...', {
        componentsLoaded: isComponentsLoaded,
        functionalitiesCount: aiFunctionalities.length,
        componentsCount: componentsToRender.length
      });
      
      const timer = setTimeout(() => {
        // Clean up the old service if it exists
        if (aiServiceRef.current) {
          console.log('🗑️ Cleaning up existing AI Service');
          aiServiceRef.current.destroy();
          aiServiceRef.current = null;
        }

        // Create and initialize the new service
        console.log('🚀 Creating new AI Service with functionalities:', aiFunctionalities);
        const aiService = new AIService(aiFunctionalities, setComponentStates);
        aiServiceRef.current = aiService;
        aiService.initialize();
      }, 200); // Increased delay slightly

      return () => {
        clearTimeout(timer);
        // Clean up when the component unmounts or dependencies change
        if (aiServiceRef.current) {
          aiServiceRef.current.destroy();
          aiServiceRef.current = null;
        }
      };
    }
  }, [isComponentsLoaded, aiFunctionalities]); // Removed activeFrame dependency

  // Select initial active frame after components are loaded
  useEffect(() => {
    if (isComponentsLoaded) {
      // Find the frame to activate
      let frameToActivate: FrameData | null = null;
      
      if (homeFrameId) {
        // Try to find the saved home frame
        frameToActivate = frames.find((f) => f.id === homeFrameId) || null;
      } else if (frames.length > 0) {
        // Otherwise use the first frame
        frameToActivate = frames[0];
      }
      
      // Set the active frame
      setActiveFrame(frameToActivate);
    }
  }, [isComponentsLoaded, frames, homeFrameId]);

  useEffect(() => {
    setComponentsToRender(
      activeFrame
        ? components.filter((comp) => comp.frameId === activeFrame.id)
        : components
    );
  }, [activeFrame, components]);

  // Initialize component states after components are loaded
  useEffect(() => {
    if (isComponentsLoaded && components.length > 0) {
      console.log("Initializing component states for Run mode");
      
      // Create initial state for all components
      const initialComponentStates: Record<string, any> = {};
      
      components.forEach(component => {
        // Make sure each component has basic state values
        let defaultValue: any = "";
        let defaultContent: any = "";
        
        // Set appropriate default values based on component type
        if (component.type === "Checkbox") {
          // Handle checkbox values more carefully - distinguish between undefined and false
          defaultValue = component.properties?.value !== undefined ? component.properties.value : false;
        } else if (component.type === "DataTable") {
          defaultValue = component.properties?.data || [];
        } else {
          defaultValue = component.properties?.value || "";
        }
        
        defaultContent = component.properties?.content || "";
        
        initialComponentStates[component.id] = {
          ...(component.properties || {}),  // Start with existing properties
          value: defaultValue,
          content: defaultContent,
        };
        
        console.log(`Initialized state for ${component.id} (${component.type})`, initialComponentStates[component.id]);
      });
      
      // Update component states
      setComponentStates(prevStates => ({
        ...prevStates,
        ...initialComponentStates
      }));
    }
  }, [isComponentsLoaded, components]);

  // Frame selection handlers
  const handleFrameChange = (frameId: string) => {
    const targetFrame = frames.find((f) => f.id === frameId);
    if (targetFrame) {
      setActiveFrame(targetFrame);
    }
  };

  const toggleFrameSelector = () => {
    setShowFrameSelector(!showFrameSelector);
  };

  // Custom hook to handle AI functionality execution with cross-frame navigation
  const handleAIFunctionality = (functionality: AIFunctionality) => {
    // Execute the AI functionality (the AI service will handle the rest)
    if (aiServiceRef.current) {
      // Use the public method to execute the functionality
      aiServiceRef.current.executeAIFunctionality(functionality);
    } else {
      console.error('❌ AI Service not available');
    }
  };


  // Debug function to reinitialize AI service
  const reinitializeAIService = () => {
    if (aiServiceRef.current) {
      aiServiceRef.current.reinitialize();
      alert('AI Service reinitialized');
    } else {
      console.error('❌ AI Service not available');
      alert('AI Service not available');
    }
  };

  // Debug function to check AI service status
  const debugAIService = () => {
    if (aiServiceRef.current) {
      const status = aiServiceRef.current.getStatus();
      const allComponentIds = aiServiceRef.current.getAllComponentIds();
      console.log('🔍 AI Service Debug Info:', {
        status,
        allComponentIds,
        functionalities: aiFunctionalities,
        componentsToRender: componentsToRender.map(c => ({ id: c.id, type: c.type }))
      });
      alert(`AI Service Status:\n- Initialized: ${status.isInitialized}\n- Registered Components: ${status.registeredComponents}\n- Event Listeners: ${status.eventListeners}\n- Available Component IDs: ${allComponentIds.length}\n\nCheck console for detailed info.`);
    } else {
      alert('AI Service not available');
    }
  };

  // Calculate the required height for the container based on component positions
  const calculateContainerHeight = (components: ComponentData[], frame: FrameData | null) => {
    if (!frame || components.length === 0) return frame?.size.height || 400;
    
    let maxBottom = 0;
    components.forEach(component => {
      const componentBottom = component.position.y + component.size.height;
      maxBottom = Math.max(maxBottom, componentBottom);
    });
    
    // Add some padding and ensure it's at least the frame height
    return Math.max(maxBottom + 20, frame.size.height);
  };

  const renderComponent = (component: ComponentData) => {
    console.log("Run mode rendering component:", component.id, component.type, component);
    
    const componentDef = getComponentDefinition(component.type);
    if (!componentDef) {
      console.error(`Component definition not found for type: ${component.type}`);
      return <div className="p-2 text-red-500 border border-red-300 bg-red-50 rounded">Error: Component type {component.type} not registered</div>;
    }

    // Make sure we have component state for this component
    const componentState = componentStates[component.id] || {};

    // Ensure component has default properties if missing
    const safeProperties = component.properties || {};
    
    // Apply direct manipulation changes (style overrides and content changes)
    let effectiveProperties = { ...safeProperties };
    
    // Apply style overrides from direct manipulation
    if (safeProperties.styleOverrides && Object.keys(safeProperties.styleOverrides).length > 0) {
      console.log(`🎨 Applying style overrides for ${component.id}:`, safeProperties.styleOverrides);
      console.log(`🎨 Component has direct manipulation changes:`, safeProperties.hasDirectManipulationChanges);
      effectiveProperties = applyStyleOverrides(effectiveProperties, safeProperties.styleOverrides);
    }
    
    // Apply content changes from direct manipulation
    const contentChanges: Record<string, any> = {};
    if (safeProperties.textContent) {
      contentChanges.textContent = safeProperties.textContent;
    }
    if (safeProperties.placeholder) {
      contentChanges.placeholder = safeProperties.placeholder;
    }
    if (Object.keys(contentChanges).length > 0) {
      effectiveProperties = applyContentChanges(effectiveProperties, contentChanges);
    }
    
    // For DataTable components, we need to handle both the original data and AI-updated data
    if (component.type === "DataTable") {
      // Use AI-updated data if available, otherwise fall back to original data
      const aiUpdatedData = componentState.data;
      if (aiUpdatedData) {
        effectiveProperties.data = aiUpdatedData;
      }
    }
    
    // Check if this is an AI component that needs the full component object
    const isAIComponent = component.type.startsWith("AI");
    
    console.log(`Component state for ${component.id}:`, componentState);
    console.log(`Effective properties for ${component.id}:`, effectiveProperties);
    
    // Prepare props for AI components
    const aiComponentProps = isAIComponent ? {
      value: componentState.value || effectiveProperties.value || "",
      content: componentState.content || effectiveProperties.content || "",
      onChange: (e: any) => {
        const value = e.target?.value ?? e;
        console.log(`AI Component ${component.id} onChange triggered with value:`, value);
        setComponentStates((prevState) => ({
          ...prevState,
          [component.id]: { ...componentState, value },
        }));
      },
      component: {
        ...component,
        properties: effectiveProperties // Use effective properties with style overrides
      }, // Pass the full component object for AIComponentRenderer
      isRunMode: true, // Add run mode flag to hide headers
    } : {};
    
    if (isAIComponent) {
      console.log(`🎯 RUN MODE: Props being passed to AI component ${component.id}:`, aiComponentProps);
      console.log(`🎯 RUN MODE: Component state for ${component.id}:`, componentState);
      console.log(`🚨 RUN MODE: Component.properties:`, component.properties);
      console.log(`🚨 RUN MODE: Has generatedCode?`, !!component.properties?.generatedCode);
      console.log(`🚨 RUN MODE: GeneratedCode length:`, component.properties?.generatedCode?.length || 0);
      console.log(`🚨 RUN MODE: GeneratedCode first 200 chars:`, component.properties?.generatedCode?.substring(0, 200));
      console.log(`🚨 RUN MODE: Component full structure:`, {
        id: component.id,
        type: component.type,
        hasProperties: !!component.properties,
        propertiesKeys: component.properties ? Object.keys(component.properties) : []
      });
    }
    
    // Prepare props based on component type
    let componentProps: any = {
      className: "w-full h-full",
      id: `run-${component.id}`,
      // Add data attributes for AI service to identify component types
      ...(component.type === "DataTable" ? { "data-component-type": "Table" } : {}),
    };

    // Handle different component types with appropriate props
    if (isAIComponent) {
      // For AI components, use the AI-specific props
      componentProps = { ...componentProps, ...aiComponentProps };
    } else if (component.type === "Checkbox") {
      // For checkboxes, enable interaction and handle boolean values properly
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for checkboxes
        value: componentState.value !== undefined ? componentState.value : (effectiveProperties.value !== undefined ? effectiveProperties.value : false),
        label: effectiveProperties.label || "Checkbox label",
        onChange: (checked: boolean) => {
          console.log(`Checkbox ${component.id} onChange triggered with value:`, checked);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, value: checked },
          }));
        },
      };
    } else if (component.type === "Textarea") {
      // For textareas, enable interaction and handle text values
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for textareas
        value: componentState.value || effectiveProperties.value || "",
        placeholder: effectiveProperties.placeholder || "Textarea component",
        rows: effectiveProperties.rows || 3,
        onChange: (e: any) => {
          const value = e.target?.value || "";
          console.log(`Textarea ${component.id} onChange triggered with value:`, value);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, value },
          }));
        },
      };
    } else if (component.type === "Input") {
      // For text inputs, enable interaction and handle text values
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for inputs
        value: componentState.value || effectiveProperties.value || "",
        placeholder: effectiveProperties.placeholder || "Text input",
        type: effectiveProperties.type || "text",
        onChange: (e: any) => {
          const value = e.target?.value || "";
          console.log(`Input ${component.id} onChange triggered with value:`, value);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, value },
          }));
        },
      };
    } else if (component.type === "Button") {
      // For buttons, enable interaction and handle clicks
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for buttons
        text: effectiveProperties.text || "Button",
        variant: effectiveProperties.variant || "default",
        onClick: (e: any) => {
          console.log(`Button ${component.id} clicked`);
          // Handle button click - could trigger AI functionality or navigation
          const aiTrigger = aiFunctionalities.find(
            (func) => func.triggerComponentId === component.id
          );
          if (aiTrigger) {
            handleAIFunctionality(aiTrigger);
          }
        },
      };
    } else if (component.type === "ImageUpload") {
      // For image uploads, enable interaction
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for image uploads
        value: componentState.value || effectiveProperties.value || "",
        onChange: (value: any) => {
          console.log(`ImageUpload ${component.id} onChange triggered with value:`, value);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, value },
          }));
        },
      };
    } else if (component.type === "Searchbox") {
      // For searchboxes, enable interaction
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for searchboxes
        value: componentState.value || effectiveProperties.value || "",
        placeholder: effectiveProperties.placeholder || "Search...",
        iconPosition: effectiveProperties.iconPosition || "left",
        clearable: effectiveProperties.clearable !== false,
        onChange: (value: string) => {
          console.log(`Searchbox ${component.id} onChange triggered with value:`, value);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, value },
          }));
        },
        onSearch: (value: string) => {
          console.log(`Searchbox ${component.id} onSearch triggered with value:`, value);
          // Could trigger AI functionality here
          const aiTrigger = aiFunctionalities.find(
            (func) => func.triggerComponentId === component.id
          );
          if (aiTrigger) {
            handleAIFunctionality(aiTrigger);
          }
        },
      };
    } else if (component.type === "FileUploader") {
      // For file uploaders, enable interaction
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for file uploaders
        value: componentState.value || effectiveProperties.value || [],
        multiple: effectiveProperties.multiple || false,
        accept: effectiveProperties.accept,
        maxSize: effectiveProperties.maxSize,
        dropzoneText: effectiveProperties.dropzoneText || "Drag and drop files here, or click to select files",
        buttonText: effectiveProperties.buttonText || "Select Files",
        showFileList: effectiveProperties.showFileList !== false,
        onChange: (files: any) => {
          console.log(`FileUploader ${component.id} onChange triggered with files:`, files);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, value: files },
          }));
        },
      };
    } else if (component.type === "DropdownComponent") {
      // For dropdown components, enable interaction and handle selection
      componentProps = {
        ...componentProps,
        isInteractive: true, // Enable interaction for dropdowns
        placeholder: effectiveProperties.placeholder || "Select an option...",
        options: effectiveProperties.options || "Option 1\nOption 2\nOption 3",
        selectedValue: componentState.selectedValue || effectiveProperties.selectedValue || "",
        backgroundColor: effectiveProperties.backgroundColor || "#ffffff",
        borderColor: effectiveProperties.borderColor || "#d1d5db",
        borderWidth: effectiveProperties.borderWidth || 1,
        borderRadius: effectiveProperties.borderRadius || 6,
        textColor: effectiveProperties.textColor || "#374151",
        fontSize: effectiveProperties.fontSize || 14,
        fontWeight: effectiveProperties.fontWeight || "normal",
        padding: effectiveProperties.padding || 12,
        opacity: effectiveProperties.opacity || 1,
        onChange: (selectedValue: string) => {
          console.log(`Dropdown ${component.id} onChange triggered with value:`, selectedValue);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, selectedValue },
          }));
        },
      };
    } else if (["TextBox", "ButtonComponent", "CardComponent", "LabelComponent", "TagComponent", "AlertBox"].includes(component.type)) {
      // For composite components, pass through all properties and enable basic interaction for buttons
      componentProps = {
        ...componentProps,
        isInteractive: component.type === "ButtonComponent", // Only enable interaction for button-like components
        ...effectiveProperties, // Pass all properties through
        onClick: component.type === "ButtonComponent" ? (e: any) => {
          console.log(`Composite Button ${component.id} clicked`);
          // Handle button click - could trigger AI functionality or navigation
          const aiTrigger = aiFunctionalities.find(
            (func) => func.triggerComponentId === component.id
          );
          if (aiTrigger) {
            handleAIFunctionality(aiTrigger);
          }
        } : undefined,
      };
    } else if (component.type === "DataTable") {
      // For DataTable components, use effective properties
      componentProps = { ...componentProps, ...effectiveProperties };
    } else if (["Heading1", "Heading2", "Heading3", "Heading4", "Text", "Paragraph", "Subtitle", "Caption"].includes(component.type)) {
      // For text components, pass textContent and other text properties
      componentProps = {
        ...componentProps,
        isInteractive: false,
        textContent: effectiveProperties.textContent || effectiveProperties.text || "",
        text: effectiveProperties.textContent || effectiveProperties.text || "",
        color: effectiveProperties.color,
        ...effectiveProperties, // Pass all effective properties
      };
      console.log(`🎯 RUN MODE: Text component ${component.id} props:`, componentProps);
    } else if (component.type === "Button") {
      // For buttons, handle text content specially
      componentProps = {
        ...componentProps,
        isInteractive: true,
        textContent: effectiveProperties.textContent || effectiveProperties.text || "",
        text: effectiveProperties.textContent || effectiveProperties.text || "",
        variant: effectiveProperties.variant || "default",
        onClick: (e: any) => {
          console.log(`Button ${component.id} clicked`);
          // Handle button clicks if needed
        },
        ...effectiveProperties, // Pass all effective properties
      };
      console.log(`🎯 RUN MODE: Button ${component.id} props:`, componentProps);
    } else {
      // For other components, use standard props
      componentProps = {
        ...componentProps,
        isInteractive: false, // Disable interaction for most components
        value: componentState.value || effectiveProperties.value || "",
        content: componentState.content || effectiveProperties.content || "",
        textContent: effectiveProperties.textContent || effectiveProperties.text || "",
        text: effectiveProperties.textContent || effectiveProperties.text || "",
        onChange: (e: any) => {
          const value = e.target?._valueTracker?.getValue?.() ?? e.target?.value ?? e;
          console.log(`Component ${component.id} onChange triggered with value:`, value);
          setComponentStates((prevState) => ({
            ...prevState,
            [component.id]: { ...componentState, value },
          }));
        },
        ...effectiveProperties, // Pass all effective properties
      };
    }

    const renderedComponent = componentDef.render(componentProps);

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
                (f) => f.id === component.properties?.navigateTo
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

    // Components with direct manipulation changes - no visual indicator in run mode
    // (Changes are already applied to the component rendering)

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
          
          {/* Frame Selector */}
          {frames.length > 1 && (
            <div className="ml-6 flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFrameSelector}
                className="flex items-center"
              >
                {showFrameSelector ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {showFrameSelector ? "Hide" : "Show"} Frame Selector
              </Button>
              
              {showFrameSelector && (
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-gray-500" />
                  <Select
                    value={activeFrame?.id || ""}
                    onValueChange={handleFrameChange}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select frame">
                        {activeFrame ? (
                          <div className="flex items-center">
                            <span>{activeFrame.label || `Frame ${activeFrame.id}`}</span>
                            {activeFrame.id === homeFrameId && (
                              <span className="ml-2 text-xs bg-green-100 text-green-600 px-1 rounded">
                                HOME
                              </span>
                            )}
                          </div>
                        ) : (
                          "Select frame"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {frames.map((frame) => (
                        <SelectItem key={frame.id} value={frame.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{frame.label || `Frame ${frame.id}`}</span>
                            {frame.id === homeFrameId && (
                              <span className="ml-2 text-xs bg-green-100 text-green-600 px-1 rounded">
                                HOME
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {aiFunctionalities.length > 0 && (
            <div className="text-sm text-green-600">
              {aiFunctionalities.length} AI{" "}
              {aiFunctionalities.length === 1 ? "Function" : "Functions"} Active
            </div>
          )}
          
          {/* Debug buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={debugAIService}
              className="text-xs"
            >
              🔍 Debug AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={reinitializeAIService}
              className="text-xs"
            >
              🔄 Reinit AI
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPersonaPanel(!showPersonaPanel)}
            className="flex items-center"
          >
            <Users className="mr-2 h-4 w-4" />
            {showPersonaPanel ? "Hide" : "Show"} Personas
          </Button>
        </div>
      </header>
      <div className="flex flex-1 relative overflow-hidden">
        <div className={`transition-all duration-300 ${showPersonaPanel ? 'w-2/3' : 'w-full'} bg-gray-100 overflow-auto p-6`}>
          <div className="min-h-full flex items-center justify-center">
            <div
              className="relative bg-white border-2 border-gray-300 rounded-md overflow-auto"
              style={
                activeFrame
                  ? {
                      width: activeFrame.size.width,
                      height: calculateContainerHeight(componentsToRender, activeFrame),
                      maxWidth: '100%',
                      maxHeight: 'calc(100vh - 8rem)',
                    }
                  : {
                      maxWidth: '100%',
                      maxHeight: 'calc(100vh - 8rem)',
                      height: calculateContainerHeight(componentsToRender, null),
                    }
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
                    zIndex: component.properties?.zIndex || 1,
                    opacity: component.properties?.opacity || 1,
                  }}
                >
                  {renderComponent(component)}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Persona Testing Panel */}
        {showPersonaPanel && (
          <div className="w-1/3 bg-white border-l border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Persona Testing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Test your AI functionalities with different personas
              </p>
            </div>
                         <div className="flex-1 overflow-auto">
               <PersonaTesting 
                 personas={personas}
                 components={components}
                 aiFunctionalities={aiFunctionalities}
                 onUpdateComponentProperties={(id, properties) => {
                   setComponentStates(prevState => ({
                     ...prevState,
                     [id]: { ...prevState[id], ...properties }
                   }));
                 }}
               />
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
