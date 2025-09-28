import { AIFunctionality } from "@/components/AIFunctionalityConfig";
import { ComponentData } from "@/lib/utils";
import { TableData } from "@/components/ui/datatable";
import { 
  getAllInternalComponents, 
  isInternalComponentId, 
  getParentComponent,
  InternalComponent 
} from "@/lib/ai-component-tracker";

// Store for pending AI operations that persists across service instances
interface PendingOperation {
  functionality: AIFunctionality;
  promise: Promise<AIResponse>;
  resolve: (value: AIResponse) => void;
  reject: (reason?: any) => void;
}

export interface AIResponse {
  response: string;
  error?: string;
  structuredData?: any; // Add structured data for DataTable responses
}

// Create a global static store for pending operations
// This will survive component unmounts/remounts
const pendingOperations: Map<string, PendingOperation> = new Map();

/**
 * Service for handling AI functionality in Run mode
 */
export class AIService {
  private functionalities: AIFunctionality[];
  private componentElements: Map<string, HTMLElement> = new Map();
  private setComponentStates: React.Dispatch<
    React.SetStateAction<Record<string, any>>
  >;
  private eventListeners: { [key: string]: EventListener } = {};
  private isInitialized: boolean = false;

  constructor(
    functionalities: AIFunctionality[],
    setComponentStates: React.Dispatch<
      React.SetStateAction<Record<string, any>>
    >
  ) {
    this.functionalities = functionalities;
    this.setComponentStates = setComponentStates;
    console.log('🔧 AIService constructor called with', functionalities.length, 'functionalities');
  }

  /**
   * Check if the service is properly initialized
   */
  public getStatus(): { isInitialized: boolean; registeredComponents: number; eventListeners: number } {
    return {
      isInitialized: this.isInitialized,
      registeredComponents: this.componentElements.size,
      eventListeners: Object.keys(this.eventListeners).length
    };
  }

  /**
   * Initialize the AI service with functionalities
   */
  initialize(): void {
    console.log('🔧 Initializing AI Service with functionalities:', this.functionalities);
    console.log(`🔧 Pending operations on initialization: ${pendingOperations.size}`);
    
    // Clear previous registrations
    this.componentElements.clear();
    this.eventListeners = {};
    
    // Set initialized to true immediately to prevent multiple initialization attempts
    this.isInitialized = true;
    
    // Add a small delay to ensure components are fully rendered
    setTimeout(() => {
      try {
        // Process each AI functionality
        this.functionalities.forEach((functionality) => {
          try {
            // Register components for this functionality
            this.registerComponents(functionality);

        // Check if there are pending operations for this functionality's output
        if (
          functionality.outputComponentId &&
          pendingOperations.has(functionality.outputComponentId)
        ) {
          // Get the output element
          const outputElement = this.componentElements.get(
            functionality.outputComponentId
          );
          if (outputElement) {
            // Show loading state for the newly registered component
            this.setComponentStates((prevState) => {
              const newState = { ...prevState };
              if (functionality.outputComponentId) {
                newState[functionality.outputComponentId] = { content: "Loading..." };
              }
              return newState;
            });

            // Retrieve the pending operation
            const operation = pendingOperations.get(
              functionality.outputComponentId
            )!;

            // Listen for the promise to resolve
            operation.promise
              .then((result) => {
                // Update the output component with the result
                this.setComponentStates((prevState) => {
                  const newState = { ...prevState };
                  if (functionality.outputComponentId) {
                    newState[functionality.outputComponentId] = { content: result.response };
                  }
                  return newState;
                });
                // Clean up the pending operation
                if (functionality.outputComponentId) {
                  pendingOperations.delete(functionality.outputComponentId);
                }
              })
              .catch((error) => {
                console.error("Error completing pending AI operation:", error);
                this.setComponentStates((prevState) => {
                  const newState = { ...prevState };
                  if (functionality.outputComponentId) {
                    newState[functionality.outputComponentId] = {
                      content: "An error occurred while processing your request.",
                    };
                  }
                  return newState;
                });
                if (functionality.outputComponentId) {
                  pendingOperations.delete(functionality.outputComponentId);
                }
              });
          }
            }
          } catch (error) {
            console.error(`❌ Error registering functionality ${functionality.name}:`, error);
          }
        });
        
        console.log('✅ AI Service initialization complete. Status:', this.getStatus());
      } catch (error) {
        console.error('❌ Error during AI Service initialization:', error);
        // Reset initialization flag if there was an error
        this.isInitialized = false;
      }
    }, 500); // Wait 500ms for components to render
  }

  /**
   * Reinitialize the service (useful for debugging)
   */
  public reinitialize(): void {
    console.log('🔄 Reinitializing AI Service...');
    this.destroy();
    setTimeout(() => {
      this.initialize();
    }, 100);
  }

  /**
   * Clean up event listeners and other resources
   */
  public destroy(): void {
    console.log('🔧 Destroying AI Service. Current status:', this.getStatus());
    
    // Remove event listeners
    for (const componentId in this.eventListeners) {
      const element = this.componentElements.get(componentId);
      const listener = this.eventListeners[componentId];
      if (element && listener) {
        element.removeEventListener("click", listener);
        console.log(`🔧 Removed event listener for: ${componentId}`);
      }
    }
    this.componentElements.clear(); // Clear the component element map
    this.eventListeners = {}; // Clear the event listener store
    this.isInitialized = false; // Reset initialization flag
    console.log("✅ AIService destroyed, but pending operations preserved");
  }

  /**
   * Register DOM elements for components used in AI functionalities
   */
  private registerComponents(functionality: AIFunctionality): void {
    const { inputComponentIds, outputComponentId, triggerComponentId } =
      functionality;

    console.log(`🔍 Registering components for functionality:`, {
      inputComponentIds,
      outputComponentId,
      triggerComponentId
    });

    // Get all components for internal component lookup
    const allComponents = Array.from(this.componentElements.values())
      .map(el => this.getComponentDataFromElement(el))
      .filter((comp): comp is ComponentData => comp !== null);

    // Register input components
    if (inputComponentIds && inputComponentIds.length > 0) {
      inputComponentIds.forEach((inputComponentId) => {
        if (inputComponentId) {
          console.log(`🔍 Registering input component: ${inputComponentId}`);
          
          // Use enhanced component resolution for Run Mode
          let inputElement = this.resolveComponentForRunMode(inputComponentId, allComponents);
          
          if (inputElement) {
            this.componentElements.set(inputComponentId, inputElement);
            console.log(`✅ Registered input component: ${inputComponentId}`);
          } else {
            console.warn(`❌ Input component not found: ${inputComponentId}`);
            // Additional debugging
            this.debugComponentSearch(inputComponentId, allComponents);
          }
        }
      });
    }

    // Register output component
    if (outputComponentId) {
      console.log(`🔍 Registering output component: ${outputComponentId}`);
      
      // Use enhanced component resolution for Run Mode
      let outputElement = this.resolveComponentForRunMode(outputComponentId, allComponents);
      
      if (outputElement) {
        this.componentElements.set(outputComponentId, outputElement);
        console.log(`✅ Registered output component: ${outputComponentId}`);
        
        // Log additional info about the output component
        const componentTypeAttr = outputElement.getAttribute('data-component-type');
        console.log(`📊 Output component type: ${componentTypeAttr}, classes: ${outputElement.className}`);
      } else {
        console.warn(`❌ Output component not found: ${outputComponentId}`);
        this.debugComponentSearch(outputComponentId, allComponents);
      }
    }

    // Register trigger component
    if (triggerComponentId) {
      console.log(`🔍 Registering trigger component: ${triggerComponentId}`);
      
      // Use enhanced component resolution for Run Mode
      let triggerElement = this.resolveComponentForRunMode(triggerComponentId, allComponents);
      
      if (triggerElement) {
        this.componentElements.set(triggerComponentId, triggerElement);
        console.log(`✅ Registered trigger component: ${triggerComponentId}`);
        
        // CRITICAL: Attach event listener to trigger the AI functionality
        const eventListener = async (event: Event) => {
          event.preventDefault();
          console.log(`🚀 Trigger activated: ${triggerComponentId}`);
          await this.executeAIFunctionality(functionality);
        };
        
        // Remove any existing listener for this component
        if (this.eventListeners[triggerComponentId]) {
          triggerElement.removeEventListener('click', this.eventListeners[triggerComponentId]);
        }
        
        // Add the new listener
        triggerElement.addEventListener('click', eventListener);
        this.eventListeners[triggerComponentId] = eventListener;
        
        console.log(`✅ Event listener attached to trigger: ${triggerComponentId}`);
      } else {
        console.warn(`❌ Trigger component not found: ${triggerComponentId}`);
        this.debugComponentSearch(triggerComponentId, allComponents);
      }
    }
  }

  /**
   * Debug helper to provide more information about component search failures
   */
  private debugComponentSearch(componentId: string, allComponents: ComponentData[]): void {
    console.log(`🔍 Debug info for component: ${componentId}`);
    
    // Check if it's recognized as an internal component
    const isInternal = isInternalComponentId(componentId, allComponents);
    console.log(`Is internal component: ${isInternal}`);
    
    if (isInternal) {
      const parentComponent = getParentComponent(componentId, allComponents);
      console.log(`Parent component:`, parentComponent);
      
      if (parentComponent) {
        const parentElement = document.getElementById(`run-${parentComponent.id}`);
        console.log(`Parent element found:`, !!parentElement);
        
        if (parentElement) {
          // Check what elements are inside the parent
          const childElements = parentElement.querySelectorAll('*[id]');
          console.log(`Child elements with IDs in parent:`, Array.from(childElements).map(el => el.id));
          
          // Try different search methods
          const directSearch = parentElement.querySelector(`#${componentId}`);
          const attributeSearch = parentElement.querySelector(`[id="${componentId}"]`);
          const idContainsSearch = parentElement.querySelector(`[id*="${componentId}"]`);
          
          console.log(`Direct search (#${componentId}):`, !!directSearch);
          console.log(`Attribute search ([id="${componentId}"]):`, !!attributeSearch);
          console.log(`ID contains search ([id*="${componentId}"]):`, !!idContainsSearch);
        }
      }
    } else {
      // Check if there are any elements with similar IDs
      const allElementsWithIds = document.querySelectorAll('*[id]');
      const similarIds = Array.from(allElementsWithIds)
        .map(el => el.id)
        .filter(id => id.includes(componentId) || componentId.includes(id));
      
      console.log(`Similar IDs found:`, similarIds);
    }
  }

  /**
   * Find an internal component element within its parent AI component
   */
  private findInternalComponentElement(internalComponentId: string, allComponents: ComponentData[]): HTMLElement | null {
    const parentComponent = getParentComponent(internalComponentId, allComponents);
    
    if (!parentComponent) {
      console.warn(`Parent component not found for internal component: ${internalComponentId}`);
      return null;
    }

    // Get the parent component's DOM element
    const parentElement = document.getElementById(`run-${parentComponent.id}`);
    
    if (!parentElement) {
      console.warn(`Parent component DOM element not found: run-${parentComponent.id}`);
      return null;
    }

    // Search for the internal component within the parent using multiple strategies
    let internalElement: HTMLElement | null = null;
    
    // Strategy 1: Direct ID match
    internalElement = parentElement.querySelector(`#${internalComponentId}`) as HTMLElement;
    
    // Strategy 2: Attribute selector
    if (!internalElement) {
      internalElement = parentElement.querySelector(`[id="${internalComponentId}"]`) as HTMLElement;
    }
    
    // Strategy 3: Look for elements with data attributes or other identifiers
    if (!internalElement) {
      internalElement = parentElement.querySelector(`[data-id="${internalComponentId}"]`) as HTMLElement;
    }
    
    // Strategy 4: Use a more flexible search within the LivePreview container
    if (!internalElement) {
      const livePreview = parentElement.querySelector('.ai-live-preview');
      if (livePreview) {
        internalElement = livePreview.querySelector(`#${internalComponentId}`) as HTMLElement;
        if (!internalElement) {
          internalElement = livePreview.querySelector(`[id="${internalComponentId}"]`) as HTMLElement;
        }
      }
    }
    
    if (internalElement) {
      console.log(`✅ Found internal component ${internalComponentId} within parent ${parentComponent.id}`);
      return internalElement;
    } else {
      console.warn(`❌ Internal component element not found: ${internalComponentId} within ${parentComponent.id}`);
      
      // Additional debugging - show what's actually in the parent
      const allChildrenWithIds = parentElement.querySelectorAll('*[id]');
      console.log(`Available child elements with IDs:`, Array.from(allChildrenWithIds).map(el => el.id));
      
      return null;
    }
  }

  /**
   * Helper method to extract component data from DOM element
   */
  private getComponentDataFromElement(element: HTMLElement): ComponentData | null {
    // This is a simplified version - you might need to implement proper component data extraction
    const id = element.id?.replace('run-', '') || '';
    return { id } as ComponentData;
  }

  /**
   * Execute an AI functionality by getting input, calling the API, and updating output
   * Public method that can be called from outside the service
   */
  public async executeAIFunctionality(
    functionality: AIFunctionality
  ): Promise<void> {
    // Check if service is properly initialized
    if (!this.isInitialized) {
      console.error('❌ AI Service not initialized. Current status:', this.getStatus());
      console.error('❌ Attempting to reinitialize...');
      this.initialize();
      // Wait a bit for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!this.isInitialized) {
        console.error('❌ Failed to initialize AI Service after retry');
        alert('AI Service initialization failed. Please refresh the page and try again.');
        return;
      }
    }

    console.log('🚀 Executing AI functionality:', functionality.name);
    console.log('🚀 Service status:', this.getStatus());

    const { inputComponentIds, outputComponentId, systemPrompt } =
      functionality;

    // Get the input values
    let userInputs: string[] = [];
    let imageData: string[] = [];

    if (inputComponentIds) {
      for (const inputComponentId of inputComponentIds) {
        if (inputComponentId) {
          // Check if this is an uploaded document
          const uploadedDocument = functionality.uploadedDocuments?.find(doc => doc.id === inputComponentId);
          if (uploadedDocument) {
            console.log(`🔍 Processing uploaded document: ${uploadedDocument.name}`);
            const documentInputs = this.gatherUploadedDocumentInputs(functionality, inputComponentId, uploadedDocument);
            userInputs.push(...documentInputs.userInputs);
            imageData.push(...documentInputs.imageData);
            continue;
          }

          const inputElement = this.componentElements.get(inputComponentId);

          if (inputElement) {
            // Check if this is a DataTable component
            const componentType = inputElement.getAttribute('data-component-type');
            const isDataTable = componentType === 'Table' || componentType === 'TablePlaceholder';
            
            if (isDataTable) {
              console.log(`🔍 Processing DataTable input: ${inputComponentId}`);
              const tableInputs = this.gatherDataTableInputs(functionality, inputComponentId, inputElement);
              userInputs.push(...tableInputs.userInputs);
              imageData.push(...tableInputs.imageData);
              continue;
            }
            // Check if this is an AI component container
            const isAIComponent = inputElement.classList.contains('ai-component');
            
            if (isAIComponent) {
              // For AI components, look inside for actual input elements
              console.log(`🔍 Processing AI component: ${inputComponentId}`);
              console.log('🔍 AI component element:', inputElement);
              
              // Cast to HTMLElement to access querySelector methods
              const container = inputElement as HTMLElement;
              
              // Strategy 1: Look for specific input ID if this is an internal component
              if (inputComponentId !== container.id.replace('run-', '')) {
                console.log(`🔍 Looking for specific input element with ID: ${inputComponentId}`);
                const specificInput = container.querySelector(`#${inputComponentId}`) as HTMLInputElement | HTMLTextAreaElement;
                if (specificInput) {
                  const value = specificInput.value || specificInput.textContent || '';
                  console.log(`🔍 Found specific input: "${value}"`);
                  if (value.trim()) {
                    userInputs.push(value.trim());
                  }
                } else {
                  console.log(`❌ Specific input ${inputComponentId} not found in AI component`);
                }
              } else {
                // Strategy 2: Collect all inputs from the AI component
                console.log(`🔍 Collecting all inputs from AI component`);
                
                // Search in multiple container types
                const searchContainers = [
                  container,
                  container.querySelector('.ai-live-preview'),
                  container.querySelector('[class*="live"]'),
                  container.querySelector('[class*="preview"]')
                ].filter(Boolean) as HTMLElement[];
                
                console.log(`🔍 Searching in ${searchContainers.length} containers`);
                
                for (const searchContainer of searchContainers) {
                  console.log(`🔍 Searching container:`, searchContainer.className);
                  
                  // Comprehensive selector for different types of inputs
                  const selectors = [
                    'input[type="text"]',
                    'input[type="email"]', 
                    'input[type="tel"]',
                    'input[type="number"]',
                    'input[type="password"]',
                    'input:not([type="hidden"]):not([type="button"]):not([type="submit"])',
                    'textarea',
                    '[contenteditable="true"]',
                    '[role="textbox"]'
                  ];
                  
                  for (const selector of selectors) {
                    const inputs = searchContainer.querySelectorAll(selector) as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;
                    console.log(`🔍 Found ${inputs.length} elements with selector: ${selector}`);
                    
                    inputs.forEach((element, index) => {
                      let value = '';
                      
                      // Get value based on element type
                      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        value = element.value || '';
                      } else if (element.hasAttribute('contenteditable')) {
                        value = element.textContent || '';
                      }
                      
                      console.log(`🔍 Input ${index} (${element.tagName}, id="${element.id}"): "${value}"`);
                      
                      if (value.trim()) {
                        userInputs.push(value.trim());
                      }
                    });
                  }
                }
                
                // Strategy 3: If still no inputs found, debug the entire structure
                if (userInputs.length === 0) {
                  console.log('🔍 No inputs found with standard selectors, debugging structure...');
                  
                  // Log ALL elements with their details
                  const allElements = container.querySelectorAll('*');
                  console.log(`🔍 Total elements in AI component: ${allElements.length}`);
                  
                  const relevantElements = Array.from(allElements)
                    .filter(el => 
                      el.tagName === 'INPUT' || 
                      el.tagName === 'TEXTAREA' || 
                      el.hasAttribute('contenteditable') ||
                      el.id ||
                      el.className.includes('input') ||
                      el.className.includes('text')
                    )
                    .slice(0, 20)
                    .map(el => ({
                      tag: el.tagName,
                      id: el.id,
                      classes: el.className,
                      type: (el as HTMLInputElement).type,
                      value: (el as HTMLInputElement).value || el.textContent?.substring(0, 50),
                      attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
                    }));
                  
                  console.log('🔍 Relevant elements found:', relevantElements);
                  
                  // Try to find any element that looks like an input
                  const possibleInputs = allElements as NodeListOf<HTMLElement>;
                  for (const element of possibleInputs) {
                    if ((element as HTMLInputElement).value && (element as HTMLInputElement).value.trim()) {
                      console.log(`🔍 Found element with value: ${element.tagName}#${element.id} = "${(element as HTMLInputElement).value}"`);
                      userInputs.push((element as HTMLInputElement).value.trim());
                    }
                  }
                }
              }
            } else {
              // Handle different types of regular input components
              if (this.isImageUploadComponent(inputElement)) {
                // For ImageUpload components, get the image data
                imageData.push(...this.getImageDataFromUpload(inputElement));
              } else if (this.isCheckboxComponent(inputElement)) {
                // For checkbox components, get the checked state
                const checkboxInput = inputElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
                if (checkboxInput) {
                  const isChecked = checkboxInput.checked;
                  const checkboxValue = isChecked ? 'Yes' : 'No';
                  console.log(`🔍 Checkbox ${inputComponentId} checked state: ${isChecked} -> "${checkboxValue}"`);
                  userInputs.push(checkboxValue);
                } else {
                  console.warn(`⚠️ Checkbox component ${inputComponentId} found but no checkbox input element detected`);
                }
              } else if (
                (inputElement as HTMLInputElement)?.value !== undefined
              ) {
                // Standard input fields
                userInputs.push((inputElement as HTMLInputElement).value);
              } else if (inputElement?.textContent) {
                // Elements with text content
                userInputs.push(inputElement.textContent);
              }
            }
          }
        }
      }
    }

    // Get the output element
    let outputElement = outputComponentId
      ? (this.componentElements.get(outputComponentId) as HTMLElement)
      : null;

    if (!outputElement) {
      console.error("No output element found for AI functionality");
      console.log("🔍 Attempting to register missing output component...");
      
      // Try to register the missing component
      if (outputComponentId && this.registerMissingComponent(outputComponentId)) {
        outputElement = this.componentElements.get(outputComponentId) as HTMLElement;
        if (outputElement) {
          console.log("✅ Successfully registered missing output component, continuing...");
        } else {
          console.error("❌ Failed to register output component, aborting");
          return;
        }
      } else {
        console.error("❌ Could not find or register output component, aborting");
        console.log("🔍 Available component IDs:", this.getAllComponentIds());
        return;
      }
    }
    
    // Ensure we have a valid output element at this point
    if (!outputElement) {
      console.error("❌ No valid output element found, aborting");
      return;
    }
    
    // Get the component ID for the output - use id, not the variable name
    const outputCompId = outputElement?.id?.replace('run-', '') || '';
    
    // Check if the output element is an AI component
    const isOutputAIComponent = outputElement.classList.contains('ai-component');
    
    // Log the collected inputs for debugging
    console.log("🎯 === AI FUNCTIONALITY EXECUTION SUMMARY ===");
    console.log("🎯 System Prompt:", systemPrompt);
    console.log("🎯 Input Component IDs to search:", inputComponentIds);
    console.log("🎯 Output Component ID:", outputComponentId);
    console.log("🎯 Trigger Component ID:", functionality.triggerComponentId);
    console.log("🎯 Registered components:", Array.from(this.componentElements.keys()));
    console.log("🎯 Uploaded documents:", functionality.uploadedDocuments?.map(doc => `${doc.name} (${doc.id})`) || "None");
    console.log("🎯 Collected user inputs:", userInputs);
    console.log("🎯 Collected image data:", imageData.length > 0 ? `${imageData.length} images` : "No images");
    console.log(`🎯 Output component ${outputCompId} is AI component: ${isOutputAIComponent}`);
    console.log("🎯 ============================================");
    
    // Check if we have any inputs to process
    if (userInputs.length === 0 && imageData.length === 0) {
      console.warn("❌ No inputs collected from input components");
      console.warn("❌ Input component IDs that were searched:", inputComponentIds);
      console.warn("❌ Registered component elements:", Array.from(this.componentElements.keys()));
      
      // Special handling for DataTable inputs - they might not have text but have structured data
      let hasDataTableInput = false;
      for (const inputComponentId of inputComponentIds || []) {
        if (!inputComponentId) continue;
        const inputElement = this.componentElements.get(inputComponentId);
        if (inputElement) {
          const componentType = inputElement.getAttribute('data-component-type');
          if (componentType === 'Table') {
            const tableData = this.getDataTableFromElement(inputElement);
            if (tableData && tableData.rows.length > 0) {
              hasDataTableInput = true;
              console.log(`📊 Found DataTable input with ${tableData.rows.length} rows`);
              // Convert table data to text input
              const selectedColumns = inputComponentId ? functionality.inputComponentTableColumns?.[inputComponentId] : undefined;
              if (selectedColumns && selectedColumns.length > 0) {
                const { headers, rows } = tableData;
                const headerIndexMap: Record<string, number> = {};
                headers.forEach((header, index) => {
                  if (header) {
                    headerIndexMap[header] = index;
                  }
                });

                for (const row of rows) {
                  const rowEntries: string[] = [];
                  for (const selectedColName of selectedColumns) {
                    if (selectedColName) {
                      const colIndex = headerIndexMap[selectedColName];
                      if (colIndex !== undefined && row[colIndex] !== undefined) {
                        rowEntries.push(
                          `[${selectedColName}: ${String(row[colIndex])}]`
                        );
                      }
                    }
                  }
                  if (rowEntries.length > 0) {
                    userInputs.push(rowEntries.join(", "));
                  }
                }
                console.log(`📊 Converted DataTable to ${userInputs.length} text inputs`);
                break;
              }
            }
          }
        }
      }
      
      if (!hasDataTableInput) {
        // Create a helpful error message for users
        const errorMessage = `⚠️ No input data found!\n\n` +
          `Please check:\n` +
          `1. Fill out all form fields with some text\n` +
          `2. Make sure you have text in: ${inputComponentIds?.join(', ') || 'input fields'}\n` +
          `3. Click the submit button again after entering text\n\n` +
          `Debug: Searched for ${inputComponentIds?.length || 0} input components but found no text values.`;
        
        if (outputElement) {
          this.updateOutputElement(outputElement, errorMessage);
        }
        return;
      }
    }
    
    // Add user message to chat history (only for non-AI components that use chat format)
    if (outputCompId && userInputs.length > 0 && !isOutputAIComponent) {
      this.updateChatHistory(outputCompId, userInputs.join("\n"), 'user');
    }

    try {
      // Check if the output component is a DataTable
      const outputComponentType = outputElement.getAttribute('data-component-type');
      const isOutputDataTable = outputComponentType === 'Table' || outputComponentType === 'TablePlaceholder';
      
      if (isOutputDataTable && outputComponentId && functionality.outputComponentTableColumns?.[outputComponentId]) {
        console.log(`🔍 Processing DataTable output: ${outputComponentId}`);
        await this.handleDataTableOutput(functionality, outputComponentId, userInputs, imageData);
        return;
      }

            // Special handling for insurance-related prompts
      const isInsuranceRelated = userInputs.some(input => 
        input.toLowerCase().includes("insurance") ||
        input.toLowerCase().includes("coverage") ||
        input.toLowerCase().includes("deductible") ||
        input.toLowerCase().includes("premium") ||
        input.toLowerCase().includes("policy")
      );

      // Get preferred AI provider from localStorage
      const preferredProvider = localStorage.getItem("preferredProvider") || "deepseek";

      // Set loading state on output element and trigger component
      this.setOutputLoading(outputElement, true);
      this.setTriggerLoading(functionality, true);

      // Call the API
        const response = await this.callAIAPI(
          userInputs.join("\n"),
          systemPrompt || "", 
          imageData,
          { isInsurance: isInsuranceRelated, preferredProvider: preferredProvider } // Pass additional context including preferred provider
        );

      // Update the output element with the response
      this.updateOutputElement(outputElement, response);
      } catch (error) {
        console.error("Error executing AI functionality:", error);
        if (outputElement) {
        this.updateOutputElement(
          outputElement,
          "I'm sorry, there was an error processing your request. Please try again."
        );
        }
    } finally {
      // Remove loading state from both output and trigger
      if (outputElement) {
        this.setOutputLoading(outputElement, false);
      }
      this.setTriggerLoading(functionality, false);
    }
  }

  /**
   * Check if an element is an ImageUpload component
   */
  private isImageUploadComponent(element: HTMLElement): boolean {
    // Check for characteristic structure of the ImageUpload component
    return (
      element.classList.contains("border-dashed") &&
      !!element.querySelector('input[type="file"]')
    );
  }

  /**
   * Check if an element is a Checkbox component
   */
  private isCheckboxComponent(element: HTMLElement): boolean {
    // Check for characteristic structure of the Checkbox component
    // Look for checkbox input or data-component-type attribute
    return (
      !!element.querySelector('input[type="checkbox"]') ||
      element.getAttribute('data-component-type') === 'Checkbox'
    );
  }

  /**
   * Extract image data from an ImageUpload component
   */
  private getImageDataFromUpload(element: HTMLElement): string[] {
    const images: string[] = [];

    // Find all image elements within the component
    const imageElements = element.querySelectorAll("img");

    imageElements.forEach((img) => {
      if (img.src && img.src.startsWith("data:")) {
        // Extract data URLs for uploaded images
        images.push(img.src);
      }
    });

    return images;
  }

  /**
   * Call the AI API with context about the specific content type
   */
  private async callAIAPI(
    userInput: string,
    systemPrompt: string,
    imageData: string[] = [],
    context: any = {}
  ): Promise<AIResponse> {
    // Get preferred AI provider from localStorage
    const preferredProvider = localStorage.getItem("preferredProvider") || "deepseek";
    console.log("🚀 === CALLING AI API ===");
    console.log("📥 Request details:", {
      context,
      systemPrompt: systemPrompt || "You are a helpful AI assistant.",
      userInput,
      hasImages: imageData.length > 0,
      userInputLength: userInput.length,
      preferredProvider
    });

    try {
      // If we have images, use the /api/ai endpoint that handles images
      if (imageData.length > 0) {
        console.log("🖼️ Image data detected, using /api/ai endpoint");
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemPrompt: systemPrompt || "You are a helpful AI assistant.",
            userInputs: [userInput],
            imageData,
            preferredProvider: context.preferredProvider || "deepseek"
          }),
        });

        console.log("📡 Image API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ AI API error:", errorText);
          throw new Error(`API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Image API response received:", data);
        return {
          response: data?.data?.response || "I couldn't process the image at this time."
        };
      } else {
        // For text-only, continue using the chat endpoint
        // Enhance the system prompt to prevent code generation for text processing tasks
        const enhancedSystemPrompt = this.enhanceSystemPromptForTextProcessing(systemPrompt);
        
        const messages = [
          { role: "system", content: enhancedSystemPrompt },
          { role: "user", content: userInput }
        ];

        console.log("🤖 Using enhanced system prompt:", enhancedSystemPrompt);
        console.log("📤 Sending request to /api/ai/chat");

        // Check if Claude is preferred and route to Claude chat
        if (context.preferredProvider === "claude") {
          console.log("🤖 Routing to Claude chat API");
          const response = await fetch("/api/ai/claude-chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              systemPrompt: enhancedSystemPrompt,
              messages,
              model: "claude-3-5-sonnet-20241022"
            }),
          });

          console.log("📡 Claude chat API response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Claude chat API error:", errorText);
            
            // Fall back to DeepSeek for insurance-related queries
            if (context.isInsurance) {
              console.log("🔄 Falling back to insurance simulator");
              return this.simulateInsuranceResponse(userInput);
            }
            
            throw new Error(`Claude chat API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log("✅ Claude chat API response received:", data);
          return {
            response: data?.data?.response || "I couldn't generate a response at this time."
          };
        }

        // Use DeepSeek chat API as fallback
        console.log("🤖 Using DeepSeek chat API");
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemPrompt: enhancedSystemPrompt,
            messages,
            context
          }),
        });

        console.log("📡 Chat API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ AI API error:", errorText);
          
          // Fall back to simulator for insurance-related queries
          if (context.isInsurance) {
            console.log("🔄 Falling back to insurance simulator");
            return this.simulateInsuranceResponse(userInput);
          }
          
          throw new Error(`API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Chat API response received:", data);
        return {
          response: data?.data?.response || "I couldn't generate a response at this time."
        };
      }
    } catch (error) {
      console.error("❌ === AI API ERROR ===");
      console.error("Error calling AI API:", error);
      
      // Fall back to simulation if real API fails
      if (context.isInsurance) {
        console.log("🔄 Falling back to insurance simulator due to error");
        return this.simulateInsuranceResponse(userInput);
      }
      
      return {
        response: "I'm sorry, I encountered an error while processing your request.",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Enhance system prompt to prevent code generation for text processing tasks
   */
  private enhanceSystemPromptForTextProcessing(originalPrompt: string): string {
    // Check if this is a text processing task (not code generation)
    const isTextProcessing = originalPrompt.toLowerCase().includes('process') ||
                             originalPrompt.toLowerCase().includes('format') ||
                             originalPrompt.toLowerCase().includes('emojis') ||
                             originalPrompt.toLowerCase().includes('data from input fields') ||
                             originalPrompt.toLowerCase().includes('output box');

    const isCodeGeneration = originalPrompt.toLowerCase().includes('component') ||
                             originalPrompt.toLowerCase().includes('generate') ||
                             originalPrompt.toLowerCase().includes('create') ||
                             originalPrompt.toLowerCase().includes('html') ||
                             originalPrompt.toLowerCase().includes('jsx');

    if (isTextProcessing && !isCodeGeneration) {
      return `${originalPrompt}

IMPORTANT INSTRUCTIONS:
- You are processing text data, NOT generating code
- Return ONLY the processed text content, nothing else
- Do NOT generate HTML, JSX, or any code
- Do NOT include code blocks or markup
- Just return the processed text that should be displayed to the user
- If the task involves emojis, add relevant emojis to the text
- Keep your response as plain text that can be directly displayed in a text box

User data to process: `;
    }

    return originalPrompt;
  }

  /**
   * Simulate an insurance-specific response
   */
  private simulateInsuranceResponse(userInput: string): AIResponse {
    const input = userInput.toLowerCase();
    let response = "I'd be happy to help with your insurance questions. What would you like to know?";
    
    if (input.includes("premium")) {
      response = "Our Premium plan costs $79/month and includes unlimited visits, specialty drugs, and a $100 deductible.";
    } else if (input.includes("standard")) {
      response = "The Standard plan is $39/month with a $250 deductible and covers 6 doctor visits per year.";
    } else if (input.includes("basic")) {
      response = "The Basic plan is our most affordable option at $19/month with a $500 deductible and 3 doctor visits per year.";
    } else if (input.includes("compare") || input.includes("difference")) {
      response = "The main differences between our plans are the monthly cost, deductible amount, number of covered visits, and drug formularies. Would you like me to explain each plan in detail?";
    } else if (input.includes("coverage") || input.includes("cover")) {
      response = "Our plans offer different levels of coverage for doctor visits, prescriptions, and specialists. What specific coverage are you interested in?";
    }
    
    return { response };
  }

  private setOutputLoading(element: HTMLElement, isLoading: boolean): void {
    if (isLoading) {
      element.classList.add("loading");
    } else {
      element.classList.remove("loading");
    }
  }

  private updateOutputElement(element: HTMLElement, responseData: string | AIResponse): void {
    const response = typeof responseData === 'string' 
      ? responseData 
      : responseData.error 
        ? `Error: ${responseData.error}` 
        : responseData.response || 'No response received';
    
    // Get the component ID from the element - handle both internal and main component IDs
    let componentId = element.id.replace('run-', '');
    
    // Check if this is an AI component by looking for the ai-component class
    const isAIComponent = element.classList.contains('ai-component');
    
    console.log(`🎯 Updating output element ${componentId}, isAI: ${isAIComponent}, response length: ${response.length}`);
    console.log(`🎯 Element classes:`, element.className);
    console.log(`🎯 Element ID:`, element.id);
    console.log(`🎯 Response preview: "${response.substring(0, 200)}..."`);
    
    // Get all components for internal component lookup
    const allComponents = Array.from(this.componentElements.values())
      .map(el => this.getComponentDataFromElement(el))
      .filter((comp): comp is ComponentData => comp !== null);
    
    // Check if this is an internal component and get the parent AI component
    let parentComponentId = null;
    const isInternalComponent = isInternalComponentId(componentId, allComponents);
    
    if (isAIComponent) {
      // The element itself is the main AI component
      parentComponentId = componentId;
      console.log(`🎯 Main AI component ID: ${parentComponentId}`);
    } else if (isInternalComponent) {
      // This is an internal component, find its parent
      const parentComponent = getParentComponent(componentId, allComponents);
      if (parentComponent) {
        parentComponentId = parentComponent.id;
        console.log(`🎯 Found parent AI component for internal component ${componentId}: ${parentComponentId}`);
      }
    } else {
      // Check if this is an internal element within an AI component (fallback)
      const parentAIComponent = element.closest('.ai-component');
      if (parentAIComponent) {
        parentComponentId = parentAIComponent.id.replace('run-', '');
        console.log(`🎯 Found parent AI component via DOM traversal: ${parentComponentId}`);
      }
    }
    
    // For internal components, ONLY update the parent component state
    const componentIdsToTry = isInternalComponent && parentComponentId 
      ? [parentComponentId]  // Only update parent for internal components
      : [componentId, parentComponentId].filter(Boolean);  // Update both for main components
    
    console.log(`🎯 Will try updating these component IDs:`, componentIdsToTry);
    
    // ALWAYS try the AI component approach first for any output component
    // This ensures that both AI-generated and regular output components can display content properly
    this.setComponentStates((prevState) => {
      const newState = { ...prevState };
      
      // Update all possible component IDs
      componentIdsToTry.forEach(id => {
        if (id) {
          newState[id] = { 
            ...prevState[id],
            content: response,  // Simple string content that should work for all components
            value: response     // Also set value as backup
          };
          console.log(`🎯 Set component state for ${id}:`, newState[id]);
        }
      });
      
      // Debug: show all current component states
      console.log(`🎯 All component states after update:`, Object.keys(newState).map(key => ({ key, hasContent: !!newState[key]?.content })));
      
      return newState;
    });
    
    // ALSO update chat history for traditional components (as backup)
    if (!isAIComponent) {
      console.log(`🎯 Also updating chat history for traditional component: ${componentId}`);
      this.updateChatHistory(componentId, response);
    }
    
    // Additional debugging: check if the element can be directly updated
    try {
      // Try to find and update any text content in the output element
      const outputTextArea = element.querySelector('[id*="output"], .output-area, [class*="output"]') as HTMLElement;
      if (outputTextArea) {
        console.log(`🎯 Found output text area, updating directly:`, outputTextArea);
        if (outputTextArea.tagName === 'TEXTAREA' || outputTextArea.tagName === 'INPUT') {
          (outputTextArea as HTMLInputElement).value = response;
        } else {
          outputTextArea.textContent = response;
        }
      }
      
      // Also try to update the element itself if it's a text-capable element
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        (element as HTMLInputElement).value = response;
        console.log(`🎯 Updated ${element.tagName} element value directly`);
        
        // For Textarea, also trigger change events to update React state
        if (element.tagName === 'TEXTAREA') {
          const changeEvent = new Event('input', { bubbles: true });
          element.dispatchEvent(changeEvent);
          console.log(`🎯 Dispatched input event for Textarea`);
        }
      } else if (element.contentEditable === 'true' || element.classList.contains('output') || element.id.includes('output')) {
        element.textContent = response;
        console.log(`🎯 Updated element textContent directly`);
      }
      
      // For AI components, try to force update any visible text areas
      if (isAIComponent || parentComponentId) {
        const allTextElements = element.querySelectorAll('div, span, p, [class*="output"], [id*="output"]');
        console.log(`🎯 Found ${allTextElements.length} potential text elements in AI component`);
        allTextElements.forEach((textEl, index) => {
          if (textEl && textEl.textContent !== response) {
            (textEl as HTMLElement).textContent = response;
            console.log(`🎯 Updated text element ${index}: ${textEl.tagName}.${textEl.className}`);
          }
        });
      }
    } catch (directUpdateError) {
      console.log(`🎯 Direct element update failed:`, directUpdateError);
    }
  }
  
  // Track chat history for each component
  private componentChatHistory: Record<string, Array<{role: string, content: string}>> = {};
  
  private updateChatHistory(componentId: string, message: string, role: string = 'assistant'): void {
    // Initialize chat history for this component if needed
    if (!this.componentChatHistory[componentId]) {
      this.componentChatHistory[componentId] = [];
    }
    
    // Add message to history
    this.componentChatHistory[componentId].push({
      role,
      content: message
    });
  }
  
  private getChatHistoryForComponent(componentId: string): Array<{role: string, content: string}> {
    return this.componentChatHistory[componentId] || [];
  }

  /**
   * Call the AI API with the given system prompt, user input, and image data
   */
  /**
   * Generate JSON schema for DataTable output based on selected columns
   */
  private generateTableSchema(columns: string[]) {
    return {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: columns.reduce((acc, col) => {
              acc[col] = { type: "string" };
              return acc;
            }, {} as Record<string, any>),
            required: columns,
          },
        },
      },
      required: ["rows"],
    };
  }

  /**
   * Merge existing table data with AI-generated data
   */
  private mergeTableData(
    existingTableData: TableData,
    aiGeneratedRows: any[],
    outputColumns: string[]
  ): TableData {
    const existingHeaders = existingTableData.headers || [];
    const existingRows = existingTableData.rows || [];

    // Create header index maps for efficiency
    const existingHeaderIndexMap: Record<string, number> = {};
    existingHeaders.forEach((header, index) => {
      existingHeaderIndexMap[header] = index;
    });

    // Determine which columns are new (not in existing headers)
    const newColumns = outputColumns.filter(
      (col) => !existingHeaders.includes(col)
    );

    // Create new headers array: existing headers + new output columns
    const newHeaders = [...existingHeaders, ...newColumns];

    // Create new header index map for the merged headers
    const newHeaderIndexMap: Record<string, number> = {};
    newHeaders.forEach((header, index) => {
      newHeaderIndexMap[header] = index;
    });

    // Process rows
    const newRows: any[][] = [];
    const maxRowCount = Math.max(existingRows.length, aiGeneratedRows.length);

    for (let rowIndex = 0; rowIndex < maxRowCount; rowIndex++) {
      // Start with a new row filled with empty strings
      const newRow: any[] = new Array(newHeaders.length).fill("");

      // Copy existing row data if it exists
      if (rowIndex < existingRows.length) {
        const existingRow = existingRows[rowIndex];
        existingHeaders.forEach((header, oldIndex) => {
          const newIndex = newHeaderIndexMap[header];
          if (newIndex !== undefined && oldIndex < existingRow.length) {
            newRow[newIndex] = existingRow[oldIndex];
          }
        });
      }

      // Update/add output column data from AI response if it exists
      if (rowIndex < aiGeneratedRows.length) {
        const aiRow = aiGeneratedRows[rowIndex];
        outputColumns.forEach((outputColumn) => {
          const newIndex = newHeaderIndexMap[outputColumn];
          if (newIndex !== undefined && aiRow[outputColumn] !== undefined) {
            newRow[newIndex] = aiRow[outputColumn];
          }
        });
      }

      newRows.push(newRow);
    }

    return {
      headers: newHeaders,
      rows: newRows,
    };
  }

  /**
   * Handle DataTable input collection with column selection
   */
  private gatherDataTableInputs(
    functionality: AIFunctionality,
    inputComponentId: string,
    inputElement: HTMLElement
  ): { userInputs: string[]; imageData: string[] } {
    const userInputs: string[] = [];
    const imageData: string[] = [];

    // Get the DataTable component data
    const tableData = this.getDataTableFromElement(inputElement);
    const selectedColumns = inputComponentId ? functionality.inputComponentTableColumns?.[inputComponentId] : undefined;

    if (tableData && selectedColumns && selectedColumns.length > 0) {
      const { headers, rows } = tableData;
      const headerIndexMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        headerIndexMap[header] = index;
      });

      for (const row of rows) {
        const rowEntries: string[] = [];
        for (const selectedColName of selectedColumns) {
          const colIndex = headerIndexMap[selectedColName];
          if (colIndex !== undefined && row[colIndex] !== undefined) {
            rowEntries.push(
              `[${selectedColName}: ${String(row[colIndex])}]`
            );
          }
        }
        if (rowEntries.length > 0) {
          userInputs.push(rowEntries.join(", "));
        }
      }
    }

    return { userInputs, imageData };
  }

  /**
   * Handle uploaded document input collection with column selection
   */
  private gatherUploadedDocumentInputs(
    functionality: AIFunctionality,
    inputComponentId: string,
    uploadedDocument: { id: string; name: string; data: TableData; uploadedAt: string }
  ): { userInputs: string[]; imageData: string[] } {
    const userInputs: string[] = [];
    const imageData: string[] = [];

    const selectedColumns = inputComponentId ? functionality.inputComponentTableColumns?.[inputComponentId] : undefined;
    const { headers, rows } = uploadedDocument.data;

    if (selectedColumns && selectedColumns.length > 0) {
      // Use selected columns
      const headerIndexMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        headerIndexMap[header] = index;
      });

      for (const row of rows) {
        const rowEntries: string[] = [];
        for (const selectedColName of selectedColumns) {
          const colIndex = headerIndexMap[selectedColName];
          if (colIndex !== undefined && row[colIndex] !== undefined) {
            rowEntries.push(
              `[${selectedColName}: ${String(row[colIndex])}]`
            );
          }
        }
        if (rowEntries.length > 0) {
          userInputs.push(rowEntries.join(", "));
        }
      }
    } else {
      // If no columns selected, include all data
      for (const row of rows) {
        const rowEntries: string[] = [];
        headers.forEach((header, index) => {
          if (row[index] !== undefined) {
            rowEntries.push(`[${header}: ${String(row[index])}]`);
          }
        });
        if (rowEntries.length > 0) {
          userInputs.push(rowEntries.join(", "));
        }
      }
    }

    // Add document context
    if (userInputs.length > 0) {
      userInputs.unshift(`Document: ${uploadedDocument.name} (${headers.length} columns, ${rows.length} rows)`);
    }

    return { userInputs, imageData };
  }

  /**
   * Extract table data from a DataTable DOM element
   */
  private getDataTableFromElement(element: HTMLElement): TableData | null {
    try {
      console.log(`🔍 Extracting data from DataTable element:`, element);
      
      // Method 1: Check if data is stored in a data attribute
      const dataAttr = element.getAttribute('data-table-data');
      if (dataAttr) {
        console.log(`📊 Found data in data-table-data attribute`);
        return JSON.parse(dataAttr);
      }

      // Method 2: Check if the element has a data prop (for React components)
      const dataProp = element.getAttribute('data-data');
      if (dataProp) {
        console.log(`📊 Found data in data-data attribute`);
        return JSON.parse(dataProp);
      }

      // Method 3: Try to get data from React component state via componentStates
      const componentId = element.id?.replace('run-', '');
      if (componentId) {
        console.log(`🔍 Looking for component state for: ${componentId}`);
        // We need to access the component state from the React state
        // This will be handled by the component state system
      }

      // Method 4: Parse the actual HTML table if present
      const table = element.querySelector('table');
      if (table) {
        console.log(`📊 Found HTML table, parsing...`);
        const headers: string[] = [];
        const rows: string[][] = [];

        // Extract headers
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
          const headerCells = headerRow.querySelectorAll('th');
          headerCells.forEach(cell => {
            headers.push(cell.textContent?.trim() || '');
          });
        }

        // Extract rows
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          const rowData: string[] = [];
          cells.forEach(cell => {
            rowData.push(cell.textContent?.trim() || '');
          });
          if (rowData.length > 0) {
            rows.push(rowData);
          }
        });

        if (headers.length > 0) {
          console.log(`📊 Successfully parsed HTML table with ${headers.length} headers and ${rows.length} rows`);
          return { headers, rows };
        }
      }

      console.warn(`❌ No table data found in element:`, element);
      return null;
    } catch (error) {
      console.error('Error extracting table data:', error);
      return null;
    }
  }

  /**
   * Update DataTable element with new data
   */
  private updateDataTableElement(element: HTMLElement, tableData: TableData): void {
    try {
      // Store the data in a data attribute for the React component to pick up
      element.setAttribute('data-table-data', JSON.stringify(tableData));
      
      // Dispatch a custom event to notify the React component of the update
      const event = new CustomEvent('dataTableUpdate', { 
        detail: tableData,
        bubbles: true 
      });
      element.dispatchEvent(event);
    } catch (error) {
      console.error('Error updating DataTable element:', error);
    }
  }

  /**
   * Handle DataTable output processing with structured AI responses
   */
  private async handleDataTableOutput(
    functionality: AIFunctionality,
    outputComponentId: string,
    userInputs: string[],
    imageData: string[]
  ): Promise<void> {
    console.log("📊 === HANDLING DATATABLE OUTPUT ===");
    console.log("📥 Input details:", {
      outputComponentId,
      userInputs,
      imageDataCount: imageData.length,
      systemPrompt: functionality.systemPrompt
    });

    const outputColumns = functionality.outputComponentTableColumns?.[outputComponentId];
    if (!outputColumns || outputColumns.length === 0) {
      console.warn(`❌ No output columns specified for DataTable ${outputComponentId}`);
      return;
    }

    console.log("📊 Output columns:", outputColumns);

    const outputElement = this.componentElements.get(outputComponentId);
    if (!outputElement) {
      console.warn(`❌ Output DataTable element not found: ${outputComponentId}`);
      return;
    }

    console.log("✅ Output element found:", outputElement);

    // Get existing table data
    const existingTableData = this.getDataTableFromElement(outputElement);
    const currentTableData: TableData = existingTableData || {
      headers: [],
      rows: [],
    };

    console.log("📊 Current table data:", currentTableData);

    // Set loading state for DataTable
    const headersForLoadingState = [...currentTableData.headers];
    outputColumns.forEach((colName) => {
      if (!headersForLoadingState.includes(colName)) {
        headersForLoadingState.push(colName);
      }
    });

    console.log("📊 Headers for loading state:", headersForLoadingState);

    let rowsForLoadingState = currentTableData.rows.map((row) => {
      const newRow = [...row];
      while (newRow.length < headersForLoadingState.length) {
        newRow.push("");
      }
      return newRow.slice(0, headersForLoadingState.length);
    });

    const applyLoadingToRow = (row: string[]): string[] => {
      const modifiedRow = [...row];
      outputColumns.forEach((colName) => {
        const colIndex = headersForLoadingState.indexOf(colName);
        if (colIndex !== -1) {
          modifiedRow[colIndex] = "Loading...";
        }
      });
      return modifiedRow;
    };

    if (rowsForLoadingState.length > 0) {
      rowsForLoadingState = rowsForLoadingState.map(applyLoadingToRow);
    } else if (outputColumns.length > 0 && currentTableData.rows.length === 0) {
      const SKELETON_ROW_COUNT = 3;
      for (let i = 0; i < SKELETON_ROW_COUNT; i++) {
        const dummyRowContent = new Array(headersForLoadingState.length).fill("");
        rowsForLoadingState.push(applyLoadingToRow(dummyRowContent));
      }
    }

    console.log("📊 Rows for loading state:", rowsForLoadingState);

    // Update component state with loading data
    this.setComponentStates((prevState) => ({
      ...prevState,
      [outputComponentId]: {
        ...prevState[outputComponentId],
        data: { headers: headersForLoadingState, rows: rowsForLoadingState },
      },
    }));

    console.log("✅ Updated component state with loading data");

    const jsonSchema = this.generateTableSchema(outputColumns);
    console.log("📋 Generated JSON schema:", jsonSchema);

    // Enhance the system prompt for DataTable structured output
    const enhancedSystemPrompt = `${functionality.systemPrompt}

CRITICAL INSTRUCTIONS FOR DATATABLE OUTPUT:
- You are updating a DataTable with ${outputColumns.length} column(s): ${outputColumns.join(', ')}
- The table currently has ${currentTableData.rows.length} rows
- You must respond with ONLY valid JSON that matches the provided schema
- Each row in your response should correspond to a row in the existing table
- Format your answers clearly with emojis and proper formatting
- Do NOT include any markdown, explanations, or text outside the JSON structure
- Your response must be parseable JSON that fits the schema exactly`;

    try {
      console.log("🤖 Calling AI with structured output...");
      console.log("📝 Enhanced system prompt:", enhancedSystemPrompt);
      
      const result = await this.callAIStructured(
        enhancedSystemPrompt,
        userInputs,
        imageData,
        jsonSchema
      );

      console.log("✅ AI structured response received:", result);

      if (result.error) {
        console.error("❌ AI error for DataTable:", result.error);
        this.setComponentStates((prevState) => ({
          ...prevState,
          [outputComponentId]: {
            ...prevState[outputComponentId],
            data: currentTableData, // Revert to original data
          },
        }));
        return;
      }
      
      if (result.structuredData) {
        console.log("📊 Processing structured data:", result.structuredData);
        const aiGeneratedRows = result.structuredData.rows || [];
        console.log("📊 AI generated rows:", aiGeneratedRows);
        
        const mergedTableData = this.mergeTableData(
          currentTableData,
          aiGeneratedRows,
          outputColumns
        );
        
        console.log("📊 Merged table data:", mergedTableData);
        
        // Update component state with merged data
        this.setComponentStates((prevState) => ({
          ...prevState,
          [outputComponentId]: {
            ...prevState[outputComponentId],
            data: mergedTableData,
          },
        }));

        console.log("✅ Updated component state with merged data");

        // Also update the DOM element
        this.updateDataTableElement(outputElement, mergedTableData);
        console.log("✅ Updated DOM element with merged data");
      } else {
        console.warn("⚠️ No structured data in AI response, attempting fallback parsing");
        
        // Fallback: try to parse the response manually
        try {
          const responseText = result.response;
          let jsonText = responseText.trim();
          
          // Remove json{} wrapper if present
          if (jsonText.startsWith('json{') && jsonText.endsWith('}')) {
            jsonText = jsonText.slice(5, -1);
          }
          
          // Try to extract JSON from markdown code blocks
          const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1];
          }
          
          const parsedData = JSON.parse(jsonText);
          console.log("🔄 Fallback parsing successful:", parsedData);
          
          if (parsedData.rows && Array.isArray(parsedData.rows)) {
            const aiGeneratedRows = parsedData.rows;
            const mergedTableData = this.mergeTableData(
              currentTableData,
              aiGeneratedRows,
              outputColumns
            );
            
            console.log("📊 Fallback merged table data:", mergedTableData);
            
            // Update component state with merged data
            this.setComponentStates((prevState) => ({
              ...prevState,
              [outputComponentId]: {
                ...prevState[outputComponentId],
                data: mergedTableData,
              },
            }));

            console.log("✅ Updated component state with fallback data");

            // Also update the DOM element
            this.updateDataTableElement(outputElement, mergedTableData);
            console.log("✅ Updated DOM element with fallback data");
            return;
          }
        } catch (fallbackError) {
          console.error("❌ Fallback parsing also failed:", fallbackError);
        }
        
        console.warn("⚠️ No structured data in AI response and fallback failed");
      }
    } catch (error) {
      console.error("❌ === DATATABLE OUTPUT ERROR ===");
      console.error("Error executing AI functionality for DataTable:", error);
      // Revert to original data on error
      this.setComponentStates((prevState) => ({
        ...prevState,
        [outputComponentId]: {
          ...prevState[outputComponentId],
          data: currentTableData,
        },
      }));
      console.log("🔄 Reverted to original data due to error");
    }
  }

  /**
   * Call the AI API with structured output for DataTable responses  
   */
  private async callAIStructured(
    systemPrompt: string,
    userInputs: string[],
    imageData: string[] = [],
    jsonSchema: any
  ): Promise<AIResponse> {
    console.log("🤖 === CALLING AI WITH STRUCTURED OUTPUT ===");
    console.log("📥 Request details:", {
      systemPrompt,
      userInputs,
      hasImages: imageData.length > 0,
      jsonSchema,
    });

    try {
      console.log("📤 Sending structured request to /api/ai");
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          userInputs,
          imageData,
          useStructuredOutput: true,
          jsonSchema,
        }),
      });

      console.log("📡 Structured API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Structured API error:", errorText);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Structured API response received:", data);
      
      return {
        response: data?.data?.response || "No response generated",
        structuredData: data?.data?.structuredData,
      };
    } catch (error) {
      console.error("❌ === STRUCTURED API ERROR ===");
      console.error("Error calling structured AI API:", error);
      return {
        response: "I'm sorry, I encountered an error while processing your request.",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async callAI(
    systemPrompt: string,
    userInputs: string[],
    imageData: string[] = []
  ): Promise<AIResponse> {
    console.log("Calling AI with:", {
      systemPrompt,
      userInputs,
      hasImages: imageData.length > 0,
    });

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          userInputs,
          imageData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          response: "",
          error: errorData.error || "Failed to get AI response",
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling AI API:", error);
      return {
        response: "",
        error: "Network error when calling AI service",
      };
    }
  }

  /**
   * Manually register a component that might be missing
   */
  public registerMissingComponent(componentId: string): boolean {
    console.log(`🔧 Attempting to register missing component: ${componentId}`);
    
    // Try different ways to find the component
    let element = document.getElementById(`run-${componentId}`);
    
    if (!element) {
      element = document.getElementById(componentId);
    }
    
    if (!element) {
      // Try to find by data attributes
      element = document.querySelector(`[data-component-id="${componentId}"]`) as HTMLElement;
    }
    
    if (!element) {
      // Try to find any element with this ID pattern
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (el.id && (el.id === componentId || el.id === `run-${componentId}`)) {
          element = el as HTMLElement;
          break;
        }
      }
    }
    
    if (element) {
      this.componentElements.set(componentId, element);
      console.log(`✅ Successfully registered missing component: ${componentId}`);
      return true;
    } else {
      console.error(`❌ Could not find component to register: ${componentId}`);
      return false;
    }
  }

  /**
   * Check if a component is registered
   */
  public isComponentRegistered(componentId: string): boolean {
    return this.componentElements.has(componentId);
  }

  /**
   * Get all available component IDs in the DOM
   */
  public getAllComponentIds(): string[] {
    const ids: string[] = [];
    
    // Get all elements with run- prefix
    const runElements = document.querySelectorAll('[id^="run-"]');
    runElements.forEach(el => {
      const id = el.id.replace('run-', '');
      ids.push(id);
    });
    
    // Get all elements with data-component-id
    const dataElements = document.querySelectorAll('[data-component-id]');
    dataElements.forEach(el => {
      const id = el.getAttribute('data-component-id');
      if (id && !ids.includes(id)) {
        ids.push(id);
      }
    });
    
    return ids;
  }

  // CRITICAL: Enhanced component resolution for Run Mode
  private resolveComponentForRunMode(componentId: string, allComponents: any[]): HTMLElement | null {
    console.log(`🔍 Resolving component for Run Mode: ${componentId}`);
    
    // Strategy 1: Try direct DOM element search
    let element = document.getElementById(componentId);
    if (element) {
      console.log(`✅ Found component by direct ID: ${componentId}`);
      return element;
    }
    
    // Strategy 2: Try with run- prefix (Run Mode convention)
    element = document.getElementById(`run-${componentId}`);
    if (element) {
      console.log(`✅ Found component with run- prefix: run-${componentId}`);
      return element;
    }
    
    // Strategy 3: Search by component type and similar names
    element = this.findComponentByTypeAndName(componentId, allComponents);
    if (element) {
      console.log(`✅ Found component by type and name matching: ${componentId}`);
      return element;
    }
    
    // Strategy 4: Search by position and properties
    element = this.findComponentByPositionAndProperties(componentId, allComponents);
    if (element) {
      console.log(`✅ Found component by position and properties: ${componentId}`);
      return element;
    }
    
    // Strategy 5: Search by internal component structure
    element = this.findInternalComponentElement(componentId, allComponents);
    if (element) {
      console.log(`✅ Found component as internal component: ${componentId}`);
      return element;
    }
    
    // Strategy 6: Search by similar ID patterns
    element = this.findComponentBySimilarId(componentId, allComponents);
    if (element) {
      console.log(`✅ Found component by similar ID pattern: ${componentId}`);
      return element;
    }
    
    // Final fallback: Look for any element that might match the component ID pattern
    console.log(`🔍 Final fallback: searching for any element matching ${componentId}`);
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const element = el as HTMLElement;
      // Check if element ID contains the component ID
      if (element.id && element.id.includes(componentId)) {
        console.log(`✅ Found component by ID pattern match: ${element.id}`);
        return element;
      }
      // Check if element has data attributes that match
      if (element.dataset.componentId === componentId) {
        console.log(`✅ Found component by data-component-id: ${componentId}`);
        return element;
      }
      // Check if element has classes that match - with null safety
      if (element.className && typeof element.className === 'string' && element.className.includes(componentId)) {
        console.log(`✅ Found component by class name match: ${element.className}`);
        return element;
      }
    }
    
    console.log(`❌ Component not found after all resolution strategies: ${componentId}`);
    return null;
  }
  
  // Find component by type and name matching
  private findComponentByTypeAndName(componentId: string, allComponents: any[]): HTMLElement | null {
    console.log(`🔍 Searching by type and name for: ${componentId}`);
    
    // Extract component type from ID (e.g., "input-name" -> "input")
    const componentType = componentId.split('-')[0];
    
    // Escape special characters for CSS selector safety
    const escapedComponentType = componentType.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    
    // Find all elements with similar component types - use try-catch for safety
    let elements: NodeListOf<Element>;
    try {
      elements = document.querySelectorAll(`[data-component-type*="${escapedComponentType}"], .${escapedComponentType}, [class*="${escapedComponentType}"]`);
    } catch (error) {
      console.warn(`⚠️ Invalid CSS selector for componentType: ${componentType}, falling back to safer search`);
      // Fallback to safer search methods
      try {
        elements = document.querySelectorAll(`[data-component-type], [class*="component"], [id*="component"]`);
      } catch (fallbackError) {
        console.warn(`⚠️ Fallback search also failed, using basic search`);
        elements = document.querySelectorAll(`*`);
      }
    }
    
    for (const element of elements) {
      const elementId = element.id || '';
      const elementClasses = element.className || '';
      const elementType = element.getAttribute('data-component-type') || '';
      
      // Check if this element matches our search criteria
      if (this.elementMatchesComponent(componentId, elementId, elementClasses, elementType, allComponents)) {
        console.log(`✅ Found matching element by type and name:`, element);
        return element as HTMLElement;
      }
    }
    
    return null;
  }
  
  // Find component by position and properties
  private findComponentByPositionAndProperties(componentId: string, allComponents: any[]): HTMLElement | null {
    console.log(`🔍 Searching by position and properties for: ${componentId}`);
    
    // Find the component in our component registry
    const component = allComponents.find(comp => 
      comp.id === componentId || 
      comp.properties?.runModeId === componentId ||
      comp.properties?.originalId === componentId
    );
    
    if (!component || !component.position) {
      console.log(`❌ Component not found in registry or missing position: ${componentId}`);
      return null;
    }
    
    // Search for elements near the expected position
    const searchRadius = 100; // pixels
    const elements = document.querySelectorAll('[data-component-id], [id*="component"], [class*="component"]');
    
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const elementCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(elementCenter.x - component.position.x, 2) + 
        Math.pow(elementCenter.y - component.position.y, 2)
      );
      
      if (distance < searchRadius) {
        console.log(`✅ Found element near expected position:`, element, `distance: ${distance}px`);
        return element as HTMLElement;
      }
    }
    
    return null;
  }
  
  // Find component by similar ID patterns
  private findComponentBySimilarId(componentId: string, allComponents: any[]): HTMLElement | null {
    console.log(`🔍 Searching by similar ID patterns for: ${componentId}`);
    
    // Get all elements with IDs
    const elements = document.querySelectorAll('[id]');
    
    for (const element of elements) {
      const elementId = element.id;
      
      // Check for exact substring matches
      if (elementId.includes(componentId) || componentId.includes(elementId)) {
        console.log(`✅ Found element with similar ID: ${elementId} matches ${componentId}`);
        return element as HTMLElement;
      }
      
      // Check for common patterns (e.g., "input-name" vs "input_name" vs "inputName")
      const normalizedElementId = elementId.replace(/[-_]/g, '').toLowerCase();
      const normalizedComponentId = componentId.replace(/[-_]/g, '').toLowerCase();
      
      if (normalizedElementId === normalizedComponentId) {
        console.log(`✅ Found element with normalized ID match: ${elementId} matches ${componentId}`);
        return element as HTMLElement;
      }
    }
    
    return null;
  }
  
  // Check if element matches component criteria
  private elementMatchesComponent(componentId: string, elementId: string, elementClasses: string, elementType: string, allComponents: any[]): boolean {
    // Check if element ID contains component ID or vice versa
    if (elementId && elementId.includes(componentId) || componentId.includes(elementId)) {
      return true;
    }
    
    // Check if element classes contain component type - with null safety
    const componentType = componentId.split('-')[0];
    if (elementClasses && typeof elementClasses === 'string' && 
        (elementClasses.includes(componentType) || componentType.includes(elementClasses))) {
      return true;
    }
    
    // Check if element type matches component type
    if (elementType && typeof elementType === 'string' && 
        (elementType.includes(componentType) || componentType.includes(elementType))) {
      return true;
    }
    
    // Check if this element corresponds to any component in our registry
    const matchingComponent = allComponents.find(comp => 
      comp.id === elementId ||
      comp.properties?.runModeId === elementId ||
      comp.properties?.originalId === elementId
    );
    
    return !!matchingComponent;
  }

  /**
   * Show or hide loading state on trigger component
   */
  private setTriggerLoading(functionality: AIFunctionality, isLoading: boolean): void {
    if (!functionality.triggerComponentId) return;
    
    const triggerElement = this.componentElements.get(functionality.triggerComponentId);
    if (!triggerElement) return;
    
    if (isLoading) {
      // Add loading class and disable the button
      triggerElement.classList.add("ai-loading");
      if (triggerElement instanceof HTMLButtonElement) {
        triggerElement.disabled = true;
        // Store original text to restore later
        const originalText = triggerElement.textContent || triggerElement.innerHTML;
        triggerElement.setAttribute('data-original-text', originalText);
        // Show loading text with spinner
        triggerElement.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        `;
      }
    } else {
      // Remove loading class and restore button
      triggerElement.classList.remove("ai-loading");
      if (triggerElement instanceof HTMLButtonElement) {
        triggerElement.disabled = false;
        // Restore original text
        const originalText = triggerElement.getAttribute('data-original-text');
        if (originalText) {
          triggerElement.innerHTML = originalText;
        }
      }
    }
  }
}

export default AIService;
