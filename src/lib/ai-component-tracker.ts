import { ComponentData } from "@/lib/utils";

export interface InternalComponent {
  id: string;
  type: 'Input' | 'Button' | 'Textarea' | 'Output' | 'Checkbox' | 'Label';
  parentComponentId: string;
  parentComponentType: string;
  purpose?: string; // extracted from ID if possible
}

/**
 * Extract internal component IDs from AI-generated component code
 */
export function extractInternalComponents(componentCode: string, parentComponent: ComponentData): InternalComponent[] {
  const internalComponents: InternalComponent[] = [];
  
  if (!componentCode) return internalComponents;

  // Patterns to match different component types with IDs
  const patterns = [
    // Input components: <Input id="..." />
    { regex: /<Input[^>]+id=["']([^"']+)["']/gi, type: 'Input' as const },
    // Button components: <Button id="..." />
    { regex: /<Button[^>]+id=["']([^"']+)["']/gi, type: 'Button' as const },
    // Textarea components: <Textarea id="..." />
    { regex: /<Textarea[^>]+id=["']([^"']+)["']/gi, type: 'Textarea' as const },
    // Checkbox components: <Checkbox id="..." />
    { regex: /<Checkbox[^>]+id=["']([^"']+)["']/gi, type: 'Checkbox' as const },
    // Label components: <Label htmlFor="..." /> or <Label id="..." />
    { regex: /<Label[^>]+(?:id|htmlFor)=["']([^"']+)["']/gi, type: 'Label' as const },
    // Output divs and textareas: <div id="output-..." /> or <div id="...-output" /> or <Textarea id="output-..." />
    { regex: /<div[^>]+id=["']((?:output-|.*-output|.*-display|.*-result)[^"']+)["']/gi, type: 'Output' as const },
    // Output textareas: <Textarea id="output-..." /> or <Textarea id="...-output" />
    { regex: /<Textarea[^>]+id=["']((?:output-|.*-output|.*-display|.*-result)[^"']+)["']/gi, type: 'Output' as const },
    // Output spans and paragraphs: <span id="output-..." /> or <p id="output-..." />
    { regex: /<(?:span|p)[^>]+id=["']((?:output-|.*-output|.*-display|.*-result)[^"']+)["']/gi, type: 'Output' as const },
  ];

  patterns.forEach(({ regex, type }) => {
    let match;
    // Reset regex lastIndex to start from beginning
    regex.lastIndex = 0;
    
    while ((match = regex.exec(componentCode)) !== null) {
      const id = match[1];
      
      // Extract purpose from ID if possible
      let purpose = '';
      const idParts = id.split('-');
      if (idParts.length > 1) {
        // Remove the component type prefix and join the rest
        const purposeParts = idParts.slice(1);
        purpose = purposeParts.join(' ').replace(/[_-]/g, ' ');
      }
      
      internalComponents.push({
        id,
        type,
        parentComponentId: parentComponent.id,
        parentComponentType: parentComponent.type,
        purpose: purpose || `${type} component`
      });
    }
  });

  return internalComponents;
}

/**
 * Get all internal components from AI-generated components
 */
export function getAllInternalComponents(components: ComponentData[]): InternalComponent[] {
  const allInternalComponents: InternalComponent[] = [];
  
  components.forEach(component => {
    // Only process AI-generated components (with safety check)
    if (component && component.type && component.type.startsWith('AI') && component.properties?.generatedCode) {
      const internalComponents = extractInternalComponents(
        component.properties.generatedCode,
        component
      );
      allInternalComponents.push(...internalComponents);
    }
  });

  return allInternalComponents;
}

/**
 * Format internal component for display in AI Configurator
 */
export function formatInternalComponentForDisplay(internalComponent: InternalComponent): string {
  return `${internalComponent.type} - ${internalComponent.id} (in ${internalComponent.parentComponentType})`;
}

/**
 * Check if a component ID belongs to an internal component
 */
export function isInternalComponentId(componentId: string, allComponents: ComponentData[]): boolean {
  const internalComponents = getAllInternalComponents(allComponents);
  return internalComponents.some(ic => ic.id === componentId);
}

/**
 * Get the parent component of an internal component
 */
export function getParentComponent(internalComponentId: string, allComponents: ComponentData[]): ComponentData | null {
  const internalComponents = getAllInternalComponents(allComponents);
  const internalComponent = internalComponents.find(ic => ic.id === internalComponentId);
  
  if (!internalComponent) return null;
  
  return allComponents.find(c => c.id === internalComponent.parentComponentId) || null;
}

/**
 * Validate that an AI-generated component has proper IDs for all its elements
 */
export function validateComponentIDs(componentCode: string): {
  isValid: boolean;
  issues: string[];
  detected: {
    inputs: string[];
    buttons: string[];
    outputs: string[];
    other: string[];
  };
} {
  const issues: string[] = [];
  const detected = {
    inputs: [] as string[],
    buttons: [] as string[],
    outputs: [] as string[],
    other: [] as string[]
  };

  // Check for Input components
  const inputMatches = componentCode.match(/<Input[^>]*>/gi) || [];
  const inputWithIds = componentCode.match(/<Input[^>]+id=["']([^"']+)["']/gi) || [];
  
  detected.inputs = inputWithIds.map(match => {
    const idMatch = match.match(/id=["']([^"']+)["']/);
    return idMatch ? idMatch[1] : '';
  }).filter(id => id);

  if (inputMatches.length > detected.inputs.length) {
    issues.push(`Found ${inputMatches.length} Input components but only ${detected.inputs.length} have IDs`);
  }

  // Check for Button components
  const buttonMatches = componentCode.match(/<Button[^>]*>/gi) || [];
  const buttonWithIds = componentCode.match(/<Button[^>]+id=["']([^"']+)["']/gi) || [];
  
  detected.buttons = buttonWithIds.map(match => {
    const idMatch = match.match(/id=["']([^"']+)["']/);
    return idMatch ? idMatch[1] : '';
  }).filter(id => id);

  if (buttonMatches.length > detected.buttons.length) {
    issues.push(`Found ${buttonMatches.length} Button components but only ${detected.buttons.length} have IDs`);
  }

  // Check for output areas (divs with output-related content)
  const outputDivs = componentCode.match(/<div[^>]*id=["']((?:output-|result-|display-|response-)[^"']+)["']/gi) || [];
  detected.outputs = outputDivs.map(match => {
    const idMatch = match.match(/id=["']([^"']+)["']/);
    return idMatch ? idMatch[1] : '';
  }).filter(id => id);

  // Check for potential output areas without proper IDs
  const textContentDivs = componentCode.match(/<div[^>]*>[\s\S]*?(?:output|result|display|response)[\s\S]*?<\/div>/gi) || [];
  if (textContentDivs.length > detected.outputs.length) {
    issues.push(`Found ${textContentDivs.length} potential output areas but only ${detected.outputs.length} have proper output IDs`);
  }

  // Check for other components with IDs
  const allIdMatches = componentCode.match(/id=["']([^"']+)["']/gi) || [];
  const allIds = allIdMatches.map(match => {
    const idMatch = match.match(/id=["']([^"']+)["']/);
    return idMatch ? idMatch[1] : '';
  }).filter(id => id);

  detected.other = allIds.filter(id => 
    !detected.inputs.includes(id) && 
    !detected.buttons.includes(id) && 
    !detected.outputs.includes(id)
  );

  return {
    isValid: issues.length === 0,
    issues,
    detected
  };
}

/**
 * Generate a report for AI component validation
 */
export function generateComponentReport(component: ComponentData): string {
  if (!component.type.startsWith('AI') || !component.properties?.generatedCode) {
    return 'Not an AI component or missing generated code';
  }

  const validation = validateComponentIDs(component.properties.generatedCode);
  const internalComponents = extractInternalComponents(component.properties.generatedCode, component);

  let report = `📊 AI Component Report: ${component.type} (${component.id})\n`;
  report += `🔍 Generated Code Length: ${component.properties.generatedCode.length} characters\n`;
  report += `✅ Internal Components Detected: ${internalComponents.length}\n\n`;

  if (validation.detected.inputs.length > 0) {
    report += `📥 Input Components (${validation.detected.inputs.length}):\n`;
    validation.detected.inputs.forEach(id => report += `   • ${id}\n`);
    report += '\n';
  }

  if (validation.detected.buttons.length > 0) {
    report += `🔘 Button Components (${validation.detected.buttons.length}):\n`;
    validation.detected.buttons.forEach(id => report += `   • ${id}\n`);
    report += '\n';
  }

  if (validation.detected.outputs.length > 0) {
    report += `📤 Output Areas (${validation.detected.outputs.length}):\n`;
    validation.detected.outputs.forEach(id => report += `   • ${id}\n`);
    report += '\n';
  }

  if (validation.issues.length > 0) {
    report += `⚠️ Issues Found:\n`;
    validation.issues.forEach(issue => report += `   • ${issue}\n`);
    report += '\n';
  }

  if (validation.isValid) {
    report += `✅ Component validation passed!`;
  } else {
    report += `❌ Component validation failed - some elements missing IDs`;
  }

  return report;
} 