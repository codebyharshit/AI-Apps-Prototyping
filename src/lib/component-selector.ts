export interface SelectableComponentInfo {
  id: string;
  type: string;
  element: HTMLElement;
  properties: ComponentProperties;
  bounds: DOMRect;
  componentCode: string;
  originalCode?: string; // Store original code for comparison
  changes: ComponentChange[]; // Track all changes made
  parentComponentId?: string; // For nested components within AI components
}

export interface ComponentChange {
  id: string;
  timestamp: number;
  propertyPath: string;
  oldValue: any;
  newValue: any;
  type: 'style' | 'content' | 'layout';
}

export interface ComponentProperties {
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  color?: string;
  
  // Layout
  width?: string;
  height?: string;
  margin?: string;
  padding?: string;
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  
  // Border
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  
  // Appearance
  opacity?: string;
  boxShadow?: string;
  
  // Content
  textContent?: string;
  placeholder?: string;
  
  // AI Component specific
  isAIComponent?: boolean;
  generatedCode?: string;
  componentId?: string; // The actual component ID from the canvas
}

class ComponentSelectorService {
  private selectedComponent: SelectableComponentInfo | null = null;
  private onSelectionChangeCallbacks: ((component: SelectableComponentInfo | null) => void)[] = [];
  private highlightOverlay: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private isDisabled: boolean = false;

  constructor() {
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      this.initializeClientSide();
    }
  }

  private initializeClientSide() {
    if (this.isInitialized) return;
    
    this.createHighlightOverlay();
    this.setupGlobalClickHandler();
    this.isInitialized = true;
  }

  private createHighlightOverlay() {
    // Ensure we're in the browser
    if (typeof document === 'undefined') return;
    
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      z-index: 9999;
      display: none;
      border-radius: 4px;
    `;
    document.body.appendChild(this.highlightOverlay);
  }

  private setupGlobalClickHandler() {
    // Ensure we're in the browser
    if (typeof document === 'undefined') return;
    
    document.addEventListener('click', (event) => {
      // Skip if selector is disabled
      if (this.isDisabled) {
        console.log('🛡️ Component selector is disabled, ignoring click');
        return;
      }

      const target = event.target as HTMLElement;
      
      console.log('🖱️ Component Selector: Click detected on element:', target);
      console.log('🖱️ Element classes:', target.className);
      console.log('🖱️ Element attributes:', target.outerHTML.substring(0, 200));
      
      // Check if the click is within the VisualComponentEditor
      const isInEditor = target.closest('[data-component-editor]') !== null;
      if (isInEditor) {
        console.log('🖱️ Click is within component editor, ignoring');
        return;
      }
      
      // Check if clicked element is part of an AI-generated component
      const aiComponent = this.findAIComponent(target);
      if (aiComponent) {
        console.log('✅ Component Selector: Found AI component:', aiComponent);
        event.stopPropagation();
        this.selectComponent(aiComponent);
      } else {
        console.log('❌ Component Selector: No AI component found');
        // Only deselect if we're not clicking on UI controls
        const isUIControl = target.closest('button, input, select, [role="button"], [role="menuitem"]') !== null;
        if (!isUIControl) {
          this.deselectComponent();
        }
      }
    });
  }

  private findAIComponent(element: HTMLElement): HTMLElement | null {
    // Ensure we're in the browser
    if (typeof document === 'undefined') return null;
    
    let current = element;
    
    console.log('🔍 Component Selector: Starting search from element:', current.tagName, current.className);
    
    // Traverse up the DOM tree to find AI component markers
    while (current && current !== document.body) {
      console.log('🔍 Checking element:', current.tagName, current.className);
      console.log('🔍 Has data-ai-component:', current.hasAttribute('data-ai-component'));
      console.log('🔍 Has data-component-id:', current.hasAttribute('data-component-id'));
      console.log('🔍 Has ai-generated class:', current.className && current.className.includes('ai-generated'));
      console.log('🔍 ID starts with ai-component:', current.id && current.id.startsWith('ai-component-'));
      
      // Look for AI component indicators
      if (current.hasAttribute('data-ai-component') || 
          current.hasAttribute('data-component-id') ||
          current.closest('[data-ai-component]') ||
          (current.className && current.className.includes('ai-generated')) ||
          (current.id && current.id.startsWith('ai-component-'))) {
        console.log('✅ Found AI component:', current);
        return current;
      }
      current = current.parentElement!;
    }
    
    console.log('❌ No AI component found in DOM tree');
    return null;
  }

  public selectComponent(element: HTMLElement) {
    this.selectedComponent = this.extractComponentInfo(element);
    this.highlightComponent(element);
    this.notifySelectionChange(this.selectedComponent);
    console.log('✅ Component selected:', this.selectedComponent);
  }

  private deselectComponent() {
    this.selectedComponent = null;
    this.hideHighlight();
    this.notifySelectionChange(null);
  }

  private extractComponentInfo(element: HTMLElement): SelectableComponentInfo {
    const computedStyle = window.getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    
    // Check if this is an AI component
    const isAIComponent = element.classList.contains('ai-component') || 
                         element.closest('.ai-component') !== null;
    
    // Get the actual component ID from the canvas
    const componentId = element.getAttribute('data-component-id') || 
                       element.id.replace('run-', '');
    
    // Get parent component ID if this is a nested element
    const parentAIComponent = element.closest('.ai-component');
    const parentComponentId = parentAIComponent ? 
      parentAIComponent.getAttribute('data-component-id') || 
      parentAIComponent.id.replace('run-', '') : undefined;

    const properties: ComponentProperties = {
      // Typography
      fontFamily: computedStyle.fontFamily,
      fontSize: computedStyle.fontSize,
      fontWeight: computedStyle.fontWeight,
      lineHeight: computedStyle.lineHeight,
      letterSpacing: computedStyle.letterSpacing,
      textAlign: computedStyle.textAlign,
      color: computedStyle.color,
      
      // Layout
      width: computedStyle.width,
      height: computedStyle.height,
      margin: computedStyle.margin,
      padding: computedStyle.padding,
      display: computedStyle.display,
      flexDirection: computedStyle.flexDirection,
      justifyContent: computedStyle.justifyContent,
      alignItems: computedStyle.alignItems,
      
      // Background
      backgroundColor: computedStyle.backgroundColor,
      backgroundImage: computedStyle.backgroundImage,
      
      // Border
      borderRadius: computedStyle.borderRadius,
      borderWidth: computedStyle.borderWidth,
      borderColor: computedStyle.borderColor,
      borderStyle: computedStyle.borderStyle,
      
      // Appearance
      opacity: computedStyle.opacity,
      boxShadow: computedStyle.boxShadow,
      
      // Content
      textContent: element.textContent || '',
      placeholder: (element as HTMLInputElement).placeholder || '',
      
      // AI Component specific
      isAIComponent,
      componentId,
    };

    return {
      id: element.id || `element-${Date.now()}`,
      type: this.detectComponentType(element),
      element,
      properties,
      bounds,
      componentCode: this.extractComponentCode(element),
      originalCode: this.extractComponentCode(element), // Store original code
      changes: [], // Initialize empty changes array
      parentComponentId,
    };
  }

  private detectComponentType(element: HTMLElement): string {
    if (element.tagName === 'BUTTON') return 'button';
    if (element.tagName === 'INPUT') return 'input';
    if (element.tagName === 'TEXTAREA') return 'textarea';
    if (element.tagName === 'IMG') return 'image';
    if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') return 'heading';
    if (element.tagName === 'P') return 'paragraph';
    if (element.classList.contains('card')) return 'card';
    if (element.classList.contains('button')) return 'button';
    return 'div';
  }

  private extractComponentCode(element: HTMLElement): string {
    // Try to find the original React component code
    // This would need to be enhanced to map back to the original component
    return element.outerHTML;
  }

  private highlightComponent(element: HTMLElement) {
    // Ensure we're in the browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!this.highlightOverlay) return;
    
    const bounds = element.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    this.highlightOverlay.style.display = 'block';
    this.highlightOverlay.style.left = `${bounds.left + scrollLeft}px`;
    this.highlightOverlay.style.top = `${bounds.top + scrollTop}px`;
    this.highlightOverlay.style.width = `${bounds.width}px`;
    this.highlightOverlay.style.height = `${bounds.height}px`;
  }

  private hideHighlight() {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
  }

  private notifySelectionChange(component: SelectableComponentInfo | null) {
    this.onSelectionChangeCallbacks.forEach(callback => callback(component));
  }

  // Public API
  public onSelectionChange(callback: (component: SelectableComponentInfo | null) => void) {
    this.onSelectionChangeCallbacks.push(callback);
    return () => {
      const index = this.onSelectionChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onSelectionChangeCallbacks.splice(index, 1);
      }
    };
  }

  public getSelectedComponent(): SelectableComponentInfo | null {
    return this.selectedComponent;
  }

  public updateComponentProperty(propertyPath: string, value: any) {
    if (!this.selectedComponent) {
      console.warn('No component selected for property update');
      return;
    }

    const { element, properties } = this.selectedComponent;
    const oldValue = this.getNestedProperty(properties, propertyPath);
    
    // Track the change
    const change: ComponentChange = {
      id: `change-${Date.now()}`,
      timestamp: Date.now(),
      propertyPath,
      oldValue,
      newValue: value,
      type: this.getChangeType(propertyPath)
    };
    
    this.selectedComponent.changes.push(change);
    
    // Update the properties object
    this.setNestedProperty(properties, propertyPath, value);
    
    // Apply the change to the DOM
    this.applyPropertyChange(element, propertyPath, value);
    
    // Persist changes to localStorage and component properties
    this.persistChanges();
    
    // Notify listeners about the change
    this.notifySelectionChange(this.selectedComponent);
    
    console.log(`✅ Updated property ${propertyPath}:`, { oldValue, newValue: value });
  }

  private persistChanges(): void {
    if (!this.selectedComponent) return;

    const { properties, changes } = this.selectedComponent;
    const componentId = properties.componentId;
    if (!componentId) return;

    try {
      // Get current components from localStorage
      const savedComponents = localStorage.getItem("prototypeComponents");
      if (savedComponents) {
        const components = JSON.parse(savedComponents);
        
        // Find the component to update
        const componentIndex = components.findIndex((comp: any) => comp.id === componentId);
        if (componentIndex !== -1) {
          const component = components[componentIndex];
          
          // Create a styleOverrides object from the changes
          const styleOverrides: Record<string, any> = {};
          changes.forEach(change => {
            if (change.type === 'style') {
              // Convert property path to CSS property name
              const cssProperty = this.convertToCSSProperty(change.propertyPath);
              styleOverrides[cssProperty] = change.newValue;
            } else if (change.type === 'content') {
              // Handle content changes
              if (change.propertyPath === 'textContent') {
                component.properties = component.properties || {};
                component.properties.textContent = change.newValue;
              }
            }
          });
          
          // Store the style overrides in the component properties
          component.properties = component.properties || {};
          component.properties.styleOverrides = styleOverrides;
          component.properties.lastModified = new Date().toISOString();
          
          // Save back to localStorage
          localStorage.setItem("prototypeComponents", JSON.stringify(components));
          
          console.log(`💾 Persisted changes for component ${componentId}:`, styleOverrides);
        }
      }
    } catch (error) {
      console.error('Error persisting changes:', error);
    }
  }

  private getChangeType(propertyPath: string): 'style' | 'content' | 'layout' {
    const styleProps = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'backgroundColor', 'borderRadius'];
    const contentProps = ['textContent', 'placeholder'];
    const layoutProps = ['width', 'height', 'margin', 'padding', 'display', 'flexDirection'];
    
    if (styleProps.some(prop => propertyPath.includes(prop))) return 'style';
    if (contentProps.some(prop => propertyPath.includes(prop))) return 'content';
    if (layoutProps.some(prop => propertyPath.includes(prop))) return 'layout';
    
    return 'style'; // Default to style
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  public getChanges(): ComponentChange[] {
    return this.selectedComponent?.changes || [];
  }

  public revertChanges(): void {
    if (!this.selectedComponent) return;
    
    const { properties } = this.selectedComponent;
    const componentId = properties.componentId;
    
    // Revert all changes
    this.selectedComponent.changes.forEach(change => {
      this.setNestedProperty(this.selectedComponent!.properties, change.propertyPath, change.oldValue);
      this.applyPropertyChange(this.selectedComponent!.element, change.propertyPath, change.oldValue);
    });
    
    this.selectedComponent.changes = [];
    
    // Clear style overrides from localStorage
    if (componentId) {
      try {
        const savedComponents = localStorage.getItem("prototypeComponents");
        if (savedComponents) {
          const components = JSON.parse(savedComponents);
          const componentIndex = components.findIndex((comp: any) => comp.id === componentId);
          if (componentIndex !== -1) {
            const component = components[componentIndex];
            if (component.properties) {
              delete component.properties.styleOverrides;
              delete component.properties.lastModified;
            }
            localStorage.setItem("prototypeComponents", JSON.stringify(components));
            console.log(`🗑️ Cleared style overrides for component ${componentId}`);
          }
        }
      } catch (error) {
        console.error('Error clearing style overrides:', error);
      }
    }
    
    this.notifySelectionChange(this.selectedComponent);
    console.log('✅ Reverted all changes and cleared style overrides');
  }

  public generateUpdatedCode(): string | null {
    if (!this.selectedComponent || this.selectedComponent.changes.length === 0) {
      return null;
    }

    // For AI components, we need to modify the generated code
    if (this.selectedComponent.properties.isAIComponent) {
      return this.generateUpdatedAICode();
    }

    // For regular components, generate a simple component with the changes
    return this.generateSimpleComponentCode();
  }

  private generateUpdatedAICode(): string {
    // This is a simplified approach - in a real implementation, you'd want to
    // parse the original code and apply changes more intelligently
    let code = this.selectedComponent!.originalCode || this.selectedComponent!.componentCode;
    
    // Apply style changes
    const styleChanges = this.selectedComponent!.changes.filter(c => c.type === 'style');
    if (styleChanges.length > 0) {
      // Add a style override section
      const styleOverrides = styleChanges.map(change => {
        const cssProperty = this.convertToCSSProperty(change.propertyPath);
        return `${cssProperty}: ${change.newValue};`;
      }).join('\n    ');
      
      // Insert style overrides into the component
      code = code.replace(/style=\{[^}]*\}/, (match) => {
        const existingStyles = match.replace(/style=\{([^}]*)\}/, '$1');
        return `style={{${existingStyles},${styleOverrides}}}`;
      });
    }
    
    return code;
  }

  private convertToCSSProperty(propertyPath: string): string {
    // Convert camelCase to kebab-case for CSS
    return propertyPath.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  private generateSimpleComponentCode(): string {
    const { properties, type } = this.selectedComponent!;
    
    return `
const ${type} = () => {
  return (
    <div style={{
      fontFamily: "${properties.fontFamily || 'inherit'}",
      fontSize: "${properties.fontSize || 'inherit'}",
      fontWeight: "${properties.fontWeight || 'inherit'}",
      color: "${properties.color || 'inherit'}",
      backgroundColor: "${properties.backgroundColor || 'transparent'}",
      padding: "${properties.padding || '0'}",
      margin: "${properties.margin || '0'}",
      borderRadius: "${properties.borderRadius || '0'}",
      textAlign: "${properties.textAlign || 'left'}",
    }}>
      ${properties.textContent || ''}
    </div>
  );
};
    `.trim();
  }

  private applyPropertyChange(element: HTMLElement, propertyPath: string, value: any) {
    // Map property paths to CSS properties
    const cssPropertyMap: Record<string, string> = {
      'fontSize': 'font-size',
      'fontWeight': 'font-weight',
      'fontFamily': 'font-family',
      'lineHeight': 'line-height',
      'letterSpacing': 'letter-spacing',
      'textAlign': 'text-align',
      'color': 'color',
      'backgroundColor': 'background-color',
      'borderRadius': 'border-radius',
      'borderWidth': 'border-width',
      'borderColor': 'border-color',
      'borderStyle': 'border-style',
      'opacity': 'opacity',
      'boxShadow': 'box-shadow',
      'margin': 'margin',
      'padding': 'padding',
      'width': 'width',
      'height': 'height'
    };

    const cssProperty = cssPropertyMap[propertyPath];
    if (cssProperty) {
      element.style.setProperty(cssProperty, value);
    }

    // Handle special cases
    if (propertyPath === 'textContent') {
      element.textContent = value;
    }
    if (propertyPath === 'placeholder' && element instanceof HTMLInputElement) {
      element.placeholder = value;
    }
  }

  private setNestedProperty(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  public disable(): void {
    this.isDisabled = true;
    console.log('🔒 Component selector disabled');
  }

  public enable(): void {
    this.isDisabled = false;
    console.log('🔓 Component selector enabled');
  }

  public isSelectorDisabled(): boolean {
    return this.isDisabled;
  }
}

// Singleton instance - only create in browser environment
export const componentSelector = typeof window !== 'undefined' 
  ? new ComponentSelectorService() 
  : null as any as ComponentSelectorService; 