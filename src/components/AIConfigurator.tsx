import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Zap, Activity, Target, X, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  AIFunctionalityConfig,
  AIFunctionality,
} from "@/components/AIFunctionalityConfig";
import { AIComponentGenerator } from "@/components/AIComponentGenerator";
import { AIBehaviorSimulator } from "@/components/AIBehaviorSimulator";
import { PersonaManager, Persona } from "@/components/PersonaManager";
import { PersonaTesting } from "@/components/PersonaTesting";
import { VisualComponentEditor } from "@/components/VisualComponentEditor";
import { ComponentData } from "@/lib/utils";
// Comment out the Tabs import until we get the proper components
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Selection mode interface
interface SelectionMode {
  isActive: boolean;
  type: 'input' | 'output' | 'trigger' | null;
  functionalityId: string | null;
  inputIndex?: number; // For input components since there can be multiple
}

interface AIConfiguratorProps {
  components: ComponentData[];
  onHoverComponent?: (id: string | null) => void;
  onComponentGenerated?: (component: ComponentData) => void;
  onUpdateComponentProperties?: (id: string, properties: Record<string, any>, type: "component" | "frame") => void;
  onComponentSelection?: (componentId: string) => void; // New callback for direct selection
  selectionMode?: SelectionMode;
  onSelectionModeUpdate?: (selectionMode: SelectionMode) => void;
  canvasRef?: React.RefObject<HTMLElement>; // Add canvas reference for positioning
}

export function AIConfigurator({
  components,
  onHoverComponent,
  onComponentGenerated,
  onUpdateComponentProperties,
  onComponentSelection,
  selectionMode,
  onSelectionModeUpdate,
  canvasRef,
}: AIConfiguratorProps) {
  const [functionalities, setFunctionalities] = useState<AIFunctionality[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("functionalities");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  
  // Use external selection mode state
  const currentSelectionMode = selectionMode || {
    isActive: false,
    type: null,
    functionalityId: null,
    inputIndex: undefined,
  };

  // Debug: Track internal components detection (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 AIConfigurator: Components changed, count: ${components.length}`);
    }
  }, [components.length]); // Only depend on length to avoid infinite loops

  // Load AI functionalities and personas from localStorage on mount
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
    
    const savedPersonas = localStorage.getItem("personas");
    if (savedPersonas) {
      try {
        const parsed = JSON.parse(savedPersonas);
        setPersonas(parsed);
      } catch (e) {
        console.error("Failed to parse saved personas:", e);
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

  // Listen for events to open design properties
  useEffect(() => {
    const handleOpenDesignProperties = (event: CustomEvent) => {
      console.log("🎨 AIConfigurator: Received openDesignProperties event:", event.detail);
      const { componentId, componentType } = event.detail;
      
      // Set the selected component ID
      setSelectedComponentId(componentId);
      
      // Switch to design tab
      setActiveTab("design");
    };

    window.addEventListener('ai:openDesignProperties', handleOpenDesignProperties as any);
    return () => window.removeEventListener('ai:openDesignProperties', handleOpenDesignProperties as any);
  }, []);

  // Save personas to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("personas", JSON.stringify(personas));
    }
  }, [personas, isInitialized]);

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
    console.log(`🔄 AIConfigurator: Updating functionality ${updatedFunctionality.id} (${updatedFunctionality.name})`);
    console.log(`🔄 AIConfigurator: Input components:`, updatedFunctionality.inputComponentIds);
    console.log(`🔄 AIConfigurator: Uploaded documents:`, updatedFunctionality.uploadedDocuments?.length || 0);
    
    setFunctionalities((prev) => {
      const updated = prev.map((func) =>
        func.id === updatedFunctionality.id ? updatedFunctionality : func
      );
      console.log(`🔄 AIConfigurator: Updated functionalities:`, updated.map(f => ({
        id: f.id,
        name: f.name,
        inputCount: f.inputComponentIds.length,
        docCount: f.uploadedDocuments?.length || 0
      })));
      return updated;
    });
  };

  const deleteFunctionality = (id: string) => {
    setFunctionalities((prev) => prev.filter((func) => func.id !== id));
  };

  const handleComponentGenerated = (component: ComponentData) => {
    console.log("AIConfigurator received component", component);
    if (onComponentGenerated) {
      console.log("Calling onComponentGenerated callback");
      onComponentGenerated(component);
      
      // CRITICAL: Dispatch reloadComponents event to automatically refresh the canvas
      // This eliminates the need for manual page refresh
      setTimeout(() => {
        console.log('🔄 Dispatching reloadComponents event for automatic refresh...');
        const reloadEvent = new CustomEvent('reloadComponents', {
          detail: { 
            componentId: component.id, 
            newCode: component.properties?.generatedCode,
            autoRefresh: true 
          }
        });
        window.dispatchEvent(reloadEvent);
        console.log('✅ reloadComponents event dispatched - canvas will refresh automatically');
      }, 200); // Small delay to ensure component is fully added
      
    } else {
      console.error("onComponentGenerated callback is not defined");
    }
  };

  // Handler for updating component properties from simulator
  const handleUpdateComponentProperties = (id: string, properties: Record<string, any>) => {
    if (onUpdateComponentProperties) {
      onUpdateComponentProperties(id, properties, "component");
    } else {
      console.error("onUpdateComponentProperties callback is not defined");
    }
  };

  // Selection mode handlers
  const startComponentSelection = (
    type: 'input' | 'output' | 'trigger', 
    functionalityId: string, 
    inputIndex?: number
  ) => {
    if (onSelectionModeUpdate) {
      onSelectionModeUpdate({
        isActive: true,
        type,
        functionalityId,
        inputIndex,
      });
    }
  };

  const cancelComponentSelection = () => {
    if (onSelectionModeUpdate) {
      onSelectionModeUpdate({
        isActive: false,
        type: null,
        functionalityId: null,
        inputIndex: undefined,
      });
    }
  };

  const handleComponentSelected = (componentId: string) => {
    if (!currentSelectionMode.isActive || !currentSelectionMode.functionalityId) return;

    const functionality = functionalities.find(f => f.id === currentSelectionMode.functionalityId);
    if (!functionality) return;

    // Update the functionality based on selection type
    const updatedFunctionality = { ...functionality };
    
    if (currentSelectionMode.type === 'input' && currentSelectionMode.inputIndex !== undefined) {
      const newInputIds = [...functionality.inputComponentIds];
      newInputIds[currentSelectionMode.inputIndex] = componentId;
      updatedFunctionality.inputComponentIds = newInputIds;
    } else if (currentSelectionMode.type === 'output') {
      updatedFunctionality.outputComponentId = componentId;
    } else if (currentSelectionMode.type === 'trigger') {
      updatedFunctionality.triggerComponentId = componentId;
    }

    updateFunctionality(updatedFunctionality);
    cancelComponentSelection();

    // Call the parent callback if provided
    if (onComponentSelection) {
      onComponentSelection(componentId);
    }
  };

  // Debug function to test internal component detection
  const testInternalComponentDetection = async () => {
    const { getAllInternalComponents, extractInternalComponents, generateComponentReport, validateComponentIDs } = await import('@/lib/ai-component-tracker');
    
    console.log('🧪 Testing internal component detection...');
    console.log('📊 Current components:', components.length);
    
    const aiComponents = components.filter(c => c.type.startsWith('AI'));
    console.log('🤖 AI Components found:', aiComponents.length);
    
    if (aiComponents.length === 0) {
      console.log('⚠️ No AI components found! Generate an AI component first, then click this debug button.');
      alert('No AI components found! Please generate an AI component first, then try the debug button.');
      return;
    }
    
    aiComponents.forEach((aiComp, index) => {
      console.log(`\n🔍 === Testing AI Component ${index + 1} ===`);
      console.log('📝 Component ID:', aiComp.id);
      console.log('🏷️ Component Type:', aiComp.type);
      console.log('💾 Has generated code:', !!aiComp.properties?.generatedCode);
      
      if (aiComp.properties?.generatedCode) {
        const code = aiComp.properties.generatedCode;
        const report = generateComponentReport(aiComp);
        const validation = validateComponentIDs(code);
        
        console.log('📊 COMPONENT REPORT:');
        console.log(report);
        
        // Test extraction
        const internal = extractInternalComponents(code, aiComp);
        console.log(`\n✅ Extracted ${internal.length} internal components:`, internal);
        
        if (internal.length === 0) {
          console.log('❌ NO INTERNAL COMPONENTS DETECTED!');
          console.log('🔍 Validation issues:', validation.issues);
          console.log('📄 Code sample:', code.substring(0, 500));
        }
      }
    });
    
    const allInternal = getAllInternalComponents(components);
    console.log(`\n📈 === SUMMARY ===`);
    console.log(`Total internal components detected: ${allInternal.length}`);
    
    if (allInternal.length > 0) {
      console.log('📋 All internal components:');
      allInternal.forEach(ic => {
        console.log(`   ${ic.type}: ${ic.id} (parent: ${ic.parentComponentId})`);
      });
      console.log('✅ SUCCESS: Internal components detected and should be available for selection!');
    } else {
      console.log('❌ ISSUE: No internal components detected. Check the component generation.');
    }
  };

  // Simple tab switching for now without the Tabs component
  const renderTabContent = () => {
    switch (activeTab) {
      case "components":
        return <AIComponentGenerator onComponentGenerated={handleComponentGenerated} />;
      case "simulator":
        return (
          <AIBehaviorSimulator
            components={components}
            onHoverComponent={onHoverComponent}
            onUpdateComponentProperties={handleUpdateComponentProperties}
          />
        );
      case "personas":
        return (
          <div className="space-y-4">
            <PersonaManager
              personas={personas}
              onPersonasChange={setPersonas}
            />
            <PersonaTesting
              personas={personas}
              components={components}
              aiFunctionalities={functionalities}
              onUpdateComponentProperties={handleUpdateComponentProperties}
            />
          </div>
        );
      case "design":
        return (
                      <VisualComponentEditor
              className="h-full"
              onUpdateComponentProperties={handleUpdateComponentProperties}
              canvasRef={canvasRef}
              onComponentGenerated={handleComponentGenerated}
              selectedComponentId={selectedComponentId || undefined}
            />
        );
      case "functionalities":
      default:
        return functionalities.length === 0 ? (
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
                onStartSelection={startComponentSelection}
                selectionMode={currentSelectionMode}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <ResizableSidebar 
      side="right" 
      minWidth={320} 
      maxWidth={1000} 
      defaultWidth={450}
      className="border-l border-gray-200"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center w-full px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h2 className="text-lg font-semibold">AI Configuration</h2>
            {/* Debug button for testing internal component detection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={testInternalComponentDetection}
              className="text-xs"
              title="Test internal component detection"
            >
              🧪 Debug
            </Button>
          </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {/* Selection Mode Banner */}
          {currentSelectionMode.isActive && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Select {currentSelectionMode.type} component on canvas
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelComponentSelection}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Click on any component on the canvas to select it
              </p>
            </div>
          )}
          
          {/* Simple tab navigation */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="grid grid-cols-2 gap-1">
            <Button 
              variant={activeTab === "functionalities" ? "default" : "outline"}
                className="flex items-center justify-center text-xs px-2" 
              onClick={() => setActiveTab("functionalities")}
            >
                <Zap className="h-3 w-3 mr-1" />
              Functions
            </Button>
            <Button 
              variant={activeTab === "components" ? "default" : "outline"}
                className="flex items-center justify-center text-xs px-2" 
              onClick={() => setActiveTab("components")}
            >
                <PlusCircle className="h-3 w-3 mr-1" />
              Generate
            </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
            <Button 
              variant={activeTab === "simulator" ? "default" : "outline"}
                className="flex items-center justify-center text-xs px-2" 
              onClick={() => setActiveTab("simulator")}
            >
                <Activity className="h-3 w-3 mr-1" />
              Simulate
            </Button>
              <Button 
                variant={activeTab === "personas" ? "default" : "outline"}
                className="flex items-center justify-center text-xs px-2" 
                onClick={() => setActiveTab("personas")}
              >
                <User className="h-3 w-3 mr-1" />
                Personas
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-1">
              <Button 
                variant={activeTab === "design" ? "default" : "outline"}
                className="flex items-center justify-center text-xs px-2" 
                onClick={() => setActiveTab("design")}
              >
                <Target className="h-3 w-3 mr-1" />
                Design
              </Button>
            </div>
          </div>

          {renderTabContent()}
        </div>
        
        {/* Footer */}
          {activeTab === "functionalities" && functionalities.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <Button onClick={addNewFunctionality} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add AI Functionality
            </Button>
          </div>
          )}
      </div>
    </ResizableSidebar>
  );
}
