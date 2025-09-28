import { AIFunctionality } from "@/components/AIFunctionalityConfig";

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

  constructor(
    functionalities: AIFunctionality[],
    setComponentStates: React.Dispatch<
      React.SetStateAction<Record<string, any>>
    >
  ) {
    this.functionalities = functionalities;
    this.setComponentStates = setComponentStates;
  }

  /**
   * Initialize the AI service by registering component elements
   */
  public initialize(): void {
    console.log(
      `Pending operations on initialization: ${pendingOperations.size}`
    );
    // Clear previous registrations
    this.componentElements.clear();

    // Process each AI functionality
    this.functionalities.forEach((functionality) => {
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
          this.setComponentStates((prevState) => ({
            ...prevState,
            [functionality.outputComponentId]: { content: "Loading..." },
          }));

          // Retrieve the pending operation
          const operation = pendingOperations.get(
            functionality.outputComponentId
          )!;

          // Listen for the promise to resolve
          operation.promise
            .then((result) => {
              // Update the output component with the result
              this.setComponentStates((prevState) => ({
                ...prevState,
                [functionality.outputComponentId]: { content: result.response },
              }));
              // Clean up the pending operation
              pendingOperations.delete(functionality.outputComponentId);
            })
            .catch((error) => {
              console.error("Error completing pending AI operation:", error);
              this.setComponentStates((prevState) => ({
                ...prevState,
                [functionality.outputComponentId]: {
                  content: "An error occurred while processing your request.",
                },
              }));
              pendingOperations.delete(functionality.outputComponentId);
            });
        }
      }
    });
  }

  /**
   * Clean up event listeners and other resources
   */
  public destroy(): void {
    // Remove event listeners
    for (const componentId in this.eventListeners) {
      const element = this.componentElements.get(componentId);
      const listener = this.eventListeners[componentId];
      if (element && listener) {
        element.removeEventListener("click", listener);
      }
    }
    this.componentElements.clear(); // Clear the component element map
    this.eventListeners = {}; // Clear the event listener store
    console.log("AIService destroyed, but pending operations preserved");
  }

  /**
   * Register DOM elements for components used in AI functionalities
   */
  private registerComponents(functionality: AIFunctionality): void {
    const { inputComponentIds, outputComponentId, triggerComponentId } =
      functionality;

    // Register input components
    if (inputComponentIds) {
      inputComponentIds.forEach((inputComponentId) => {
        if (inputComponentId) {
          const inputElement = document.getElementById(
            `run-${inputComponentId}`
          );
          if (inputElement) {
            this.componentElements.set(inputComponentId, inputElement);
          }
        }
      });
    }

    // Register output component
    if (outputComponentId) {
      const outputElement = document.getElementById(`run-${outputComponentId}`);
      if (outputElement) {
        this.componentElements.set(outputComponentId, outputElement);
      }
    }

    // Register trigger component
    if (triggerComponentId) {
      const triggerElement = document.getElementById(
        `run-${triggerComponentId}`
      );
      if (triggerElement) {
        this.componentElements.set(triggerComponentId, triggerElement);
      }
    }
  }

  /**
   * Execute an AI functionality by getting input, calling the API, and updating output
   * Public method that can be called from outside the service
   */
  public async executeAIFunctionality(
    functionality: AIFunctionality
  ): Promise<void> {
    const { inputComponentIds, outputComponentId, systemPrompt } =
      functionality;

    // Get the input values
    let userInputs: string[] = [];
    let imageData: string[] = [];

    if (inputComponentIds) {
      for (const inputComponentId of inputComponentIds) {
        if (inputComponentId) {
          const inputElement = this.componentElements.get(inputComponentId);

          if (inputElement) {
            // Handle different types of input components
            if (this.isImageUploadComponent(inputElement)) {
              // For ImageUpload components, get the image data
              imageData.push(...this.getImageDataFromUpload(inputElement));
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

    // Get the output element
    const outputElement = outputComponentId
      ? (this.componentElements.get(outputComponentId) as HTMLElement)
      : null;

    if (outputComponentId) {
      // Show loading state if the output element is available
      if (outputElement) {
        this.setComponentStates((prevState) => ({
          ...prevState,
          [outputComponentId]: { content: "Loading..." },
        }));
      }

      // Create a new promise for this operation
      let resolvePromise: (value: AIResponse) => void;
      let rejectPromise: (reason?: any) => void;

      const operationPromise = new Promise<AIResponse>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
      });

      // Store the pending operation
      pendingOperations.set(outputComponentId, {
        functionality,
        promise: operationPromise,
        resolve: resolvePromise!,
        reject: rejectPromise!,
      });
      console.log(
        `Pending operations before execution finished: ${pendingOperations.size}`
      );

      try {
        // Call the AI API, including image data if available
        const result = await this.callAI(systemPrompt, userInputs, imageData);

        // Update the output element if it's available
        if (outputElement) {
          if (result.error) {
            this.setComponentStates((prevState) => ({
              ...prevState,
              [outputComponentId]: { content: `Error: ${result.error}` },
            }));
          } else {
            this.setComponentStates((prevState) => ({
              ...prevState,
              [outputComponentId]: { content: result.response },
            }));
          }
        }

        // Resolve the promise
        pendingOperations.get(outputComponentId)?.resolve(result);
        pendingOperations.delete(outputComponentId);
        console.log(
          `Pending operations after execution finished: ${pendingOperations.size}`
        );
      } catch (error) {
        console.error("Error executing AI functionality:", error);

        const errorResponse = {
          response: "An error occurred while processing your request.",
          error: error instanceof Error ? error.message : String(error),
        };

        // Update the output element if it's available
        if (outputElement) {
          this.setComponentStates((prevState) => ({
            ...prevState,
            [outputComponentId]: { content: errorResponse.response },
          }));
        }

        // Reject the promise
        pendingOperations.get(outputComponentId)?.reject(error);
        pendingOperations.delete(outputComponentId);
      }
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
   * Call the AI API with the given system prompt, user input, and image data
   */
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
}

export default AIService;
