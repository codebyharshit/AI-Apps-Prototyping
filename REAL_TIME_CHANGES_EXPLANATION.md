# 🔄 Real-Time Changes in Editor Mode - Complete Flow Explanation

## 🎯 How Real-Time Changes Work in Editor Mode

### **1. User Interaction Flow**

```
User makes change → VisualComponentEditor → Canvas Update → AIComponentRenderer → Real-time Display
```

### **2. Detailed Step-by-Step Process**

#### **Step 1: User Makes a Change**
- User types in text field, changes color, adjusts style, etc.
- `VisualComponentEditor.updateProperty()` is called immediately

#### **Step 2: Immediate Local State Update**
```typescript
// In VisualComponentEditor.updateProperty()
setProperties(prev => ({
  ...prev,
  [propertyPath]: value  // Updates local state immediately
}));
```
- **Result**: UI updates instantly in the editor panel
- **Why**: React state change triggers immediate re-render

#### **Step 3: Component Selector Update**
```typescript
await componentSelector.updateComponentProperty(propertyPath, value);
```
- Updates the component selector's internal state
- Tracks changes for persistence
- Prepares data for localStorage/API saving

#### **Step 4: Canvas Data Update (CRITICAL for Real-time)**
```typescript
// CRITICAL: Update the actual component data in the canvas
if (selectedComponent && onUpdateComponentProperties) {
  const componentId = selectedComponent.properties.componentId || selectedComponent.id;
  if (componentId) {
    const updatedProperties: any = {
      ...selectedComponent.properties,
      [propertyPath]: value
    };
    
    // Apply style overrides or content changes
    if (propertyPath === 'textContent') {
      updatedProperties.textContent = value;
    } else if (propertyPath === 'placeholder') {
      updatedProperties.placeholder = value;
    } else if (propertyPath.startsWith('style.')) {
      const styleProperty = propertyPath.replace('style.', '');
      updatedProperties.styleOverrides = {
        ...updatedProperties.styleOverrides,
        [styleProperty]: value
      };
    }
    
    console.log('🔄 Updating component data in canvas:', componentId, updatedProperties);
    onUpdateComponentProperties(componentId, updatedProperties);
  }
}
```

#### **Step 5: Canvas Re-render**
- `onUpdateComponentProperties` updates the main canvas component data
- Canvas re-renders with updated component properties
- `AIComponentRenderer` receives updated component data

#### **Step 6: AIComponentRenderer Processing**
```typescript
// In AIComponentRenderer
const injectDirectManipulationChanges = (code: string): string => {
  // Check for direct manipulation changes
  const hasDirectManipulationChanges = component.properties?.hasDirectManipulationChanges;
  const styleOverrides = component.properties?.styleOverrides;
  const textContent = component.properties?.textContent;
  const placeholder = component.properties?.placeholder;
  
  // Apply changes to the generated code
  let modifiedCode = code;
  
  // Apply style overrides, content changes, etc.
  // ... (detailed injection logic)
  
  return modifiedCode;
};
```

#### **Step 7: React Live Re-render**
- Modified code is passed to `react-live`
- Component re-renders with changes applied
- **Result**: User sees changes immediately in the canvas

## 📄 Generated Code Console Logging

### **How to View Generated Code**

1. **In Run Mode**: Click the "📄 Show Code" button in the debug panel
2. **Automatic Logging**: Console logs show real-time changes
3. **Manual Debug**: Use "🔍 Debug" button for detailed component info

### **What Gets Logged**

```javascript
// Original Generated Code
console.log('📄 Original Generated Code:');
console.log(generatedCode);

// Modified Code (after direct manipulation changes)
console.log('📄 Cleaned Code (after processing):');
console.log(cleanedCode);

// Changes Applied
console.log('📄 Direct Manipulation Changes Applied:', {
  hasDirectManipulationChanges: component.properties?.hasDirectManipulationChanges,
  styleOverrides: component.properties?.styleOverrides,
  textContent: component.properties?.textContent,
  placeholder: component.properties?.placeholder,
  color: component.properties?.color,
  backgroundColor: component.properties?.backgroundColor
});
```

## 🔍 Real-Time Change Detection

### **Automatic Console Logging**
```typescript
// In AIComponentRenderer - automatic logging for real-time tracking
if (isInteractive && component.properties?.hasDirectManipulationChanges) {
  console.log(`🔄 REAL-TIME RENDER - Component ${component.id}:`);
  console.log(`📄 Original Code Length:`, generatedCode?.length || 0);
  console.log(`📄 Modified Code Length:`, cleanedCode?.length || 0);
  console.log(`🎨 Changes Applied:`, {
    styleOverrides: component.properties?.styleOverrides,
    textContent: component.properties?.textContent,
    placeholder: component.properties?.placeholder,
    color: component.properties?.color,
    backgroundColor: component.properties?.backgroundColor
  });
  console.log(`📄 Modified Code Preview (first 200 chars):`, cleanedCode.substring(0, 200));
}
```

## 🎨 How Different Change Types Work

### **1. Text Content Changes**
```typescript
if (textContent) {
  // Replace text content in elements
  modifiedCode = modifiedCode.replace(
    />([^<]*)</g,
    (match, content) => {
      if (!content.includes('{') && !content.includes('}')) {
        return `>${textContent}<`;
      }
      return match;
    }
  );
}
```

### **2. Style Overrides**
```typescript
if (styleOverrides && Object.keys(styleOverrides).length > 0) {
  const overrideStyles = Object.entries(styleOverrides)
    .map(([property, value]) => `${property}: "${value}"`)
    .join(', ');
  
  // Add or merge with existing style attribute
  if (openingTag.includes('style=')) {
    modifiedCode = modifiedCode.replace(
      /style=\{([^}]*)\}/g,
      (match, existingStyles) => {
        return `style={{${existingStyles}, ${overrideStyles}}}`;
      }
    );
  } else {
    const newTag = openingTag.replace('>', ` style={{${overrideStyles}}>`);
    modifiedCode = modifiedCode.replace(returnPattern, 'return (' + newTag);
  }
}
```

### **3. Placeholder Changes**
```typescript
if (placeholder) {
  // Replace placeholder attributes
  modifiedCode = modifiedCode.replace(
    /placeholder="[^"]*"/g,
    `placeholder="${placeholder}"`
  );
}
```

## 🚀 Why Real-Time Works in Editor Mode

### **Key Factors:**

1. **Immediate State Updates**: React state changes trigger instant re-renders
2. **Canvas Data Synchronization**: Changes update the central component data
3. **Code Injection**: Generated code is modified before rendering
4. **React Live**: Dynamic code execution shows changes immediately
5. **No Persistence Delay**: Changes apply before saving to localStorage/API

### **Editor vs Run Mode Difference:**

- **Editor Mode**: Uses `react-live` with modified code + real-time canvas updates
- **Run Mode**: Uses `react-live` with modified code + localStorage persistence

## 🔧 Debugging Real-Time Changes

### **Console Commands to Track Changes:**

```javascript
// 1. Check component properties
console.log('Component Properties:', component.properties);

// 2. Check generated code
console.log('Generated Code:', generatedCode);

// 3. Check modified code
console.log('Modified Code:', cleanedCode);

// 4. Check direct manipulation changes
console.log('Direct Manipulation Changes:', {
  hasDirectManipulationChanges: component.properties?.hasDirectManipulationChanges,
  styleOverrides: component.properties?.styleOverrides,
  textContent: component.properties?.textContent,
  placeholder: component.properties?.placeholder
});
```

### **Visual Debug Tools:**

1. **Debug Panel**: Shows all changes in real-time
2. **Show Code Button**: Displays generated and modified code
3. **Debug Button**: Logs detailed component information
4. **Console Logs**: Automatic tracking of all changes

## ✅ Summary

**Real-time changes work because:**
1. **Immediate state updates** in VisualComponentEditor
2. **Canvas data synchronization** via `onUpdateComponentProperties`
3. **Code injection** in AIComponentRenderer
4. **React Live rendering** with modified code
5. **No persistence delays** - changes apply instantly

**To view generated code:**
1. Go to run mode
2. Click "📄 Show Code" button in debug panel
3. Check browser console for full code details
4. Use "🔍 Debug" button for component information 