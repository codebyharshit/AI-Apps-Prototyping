# Direct Manipulation Implementation for HTML/CSS Components

## Overview

This implementation adds comprehensive direct manipulation capabilities for HTML/CSS components, allowing users to:

1. **Edit prompts/requirements** - Modify the initial component requirements if they don't like the generated HTML/CSS
2. **Direct HTML/CSS editing** - Edit HTML and CSS directly on the canvas before React conversion
3. **Canvas integration** - Import HTML/CSS components directly to the canvas
4. **Convert to React** - Add a "Convert to React" button on canvas components after direct manipulation

## New Features Implemented

### 1. Enhanced HTML/CSS Editor (`src/components/HtmlCssEditor.tsx`)

**New Features Added:**
- **Prompt Editor Dialog** - Edit component requirements after generation
- **Direct Manipulation Dialog** - Side-by-side HTML and CSS editing
- **Add to Canvas Button** - Directly add HTML/CSS components to canvas
- **Enhanced Toolbar** - Edit Prompt, Direct Edit, and Download buttons

**Key Functions:**
```typescript
// Edit requirements after generation
const handleUpdateRequirements = (newRequirements: ComponentRequirements) => {
  setCurrentRequirements(newRequirements);
  if (onUpdateRequirements) {
    onUpdateRequirements(newRequirements);
  }
  setShowPromptEditor(false);
};

// Add HTML/CSS directly to canvas
const handleAddToCanvas = () => {
  if (onAddToCanvas) {
    onAddToCanvas(editedHtml, currentRequirements);
  }
};
```

### 2. HTML/CSS Canvas Component (`src/components/HtmlCssCanvasComponent.tsx`)

**New Component Features:**
- **Component Header** - Shows component type and action buttons
- **Live Preview** - Real-time iframe preview of the component
- **Edit Dialog** - Full-screen editor with tabs for HTML, CSS, and full code
- **Convert to React Button** - Prominent button to convert after editing
- **Download Functionality** - Export HTML file

**Key Features:**
```typescript
// Component header with action buttons
<div className="bg-gray-100 px-3 py-2 border-b flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Code className="h-4 w-4 text-gray-600" />
    <span className="text-sm font-medium text-gray-700">
      {requirements.componentType}
    </span>
    <Badge variant="outline" className="text-xs">HTML/CSS</Badge>
  </div>
  <div className="flex items-center gap-1">
    <Button onClick={() => setShowEditor(true)}>Edit</Button>
    <Button onClick={downloadHtml}>Download</Button>
    <Button onClick={() => onConvertToReact(currentHtml)}>
      Convert to React
    </Button>
  </div>
</div>
```

### 3. Enhanced AI Component Generator (`src/components/EnhancedAIComponentGenerator.tsx`)

**New Workflow:**
1. **Requirements Collection** - Structured form for component specifications
2. **HTML/CSS Generation** - Generate HTML/CSS based on requirements
3. **HTML/CSS Editing** - Edit with prompt editor and direct manipulation
4. **Canvas Integration** - Add to canvas or convert to React
5. **React Conversion** - Convert finalized HTML/CSS to React

**Key Integration:**
```typescript
// Support for adding HTML/CSS to canvas
const handleAddToCanvas = (html: string, req: ComponentRequirements) => {
  if (onAddHtmlCssToCanvas) {
    onAddHtmlCssToCanvas(html, req);
    setCurrentStep("complete");
  }
};
```

### 4. Editor Integration (`src/components/Editor.tsx`)

**New State Management:**
```typescript
const [htmlCssComponents, setHtmlCssComponents] = useState<Array<{
  id: string;
  html: string;
  requirements: ComponentRequirements;
}>>([]);
```

**New Functions:**
- `handleAddHtmlCssToCanvas()` - Add HTML/CSS components to canvas
- `handleConvertHtmlCssToReact()` - Convert HTML/CSS to React components
- `localStorage` persistence for HTML/CSS components

**Canvas Rendering:**
```typescript
{/* HTML/CSS Components */}
{htmlCssComponents.map((htmlCssComponent, index) => (
  <div
    key={htmlCssComponent.id}
    className="absolute"
    style={{
      left: `${100 + index * 50}px`,
      top: `${100 + index * 50}px`,
      width: '400px',
      height: '300px',
      zIndex: 1000 + index
    }}
  >
    <HtmlCssCanvasComponent
      html={htmlCssComponent.html}
      requirements={htmlCssComponent.requirements}
      onConvertToReact={(html) => handleConvertHtmlCssToReact(html, htmlCssComponent.id)}
      onUpdateHtml={(html) => {
        setHtmlCssComponents(prev => 
          prev.map(c => 
            c.id === htmlCssComponent.id 
              ? { ...c, html } 
              : c
          )
        );
      }}
      className="w-full h-full"
    />
  </div>
))}
```

## Workflow

### Step 1: Requirements Collection
- User fills out comprehensive requirements form
- System validates all required fields
- Requirements are structured and organized

### Step 2: HTML/CSS Generation
- AI generates HTML/CSS based on requirements
- Code is cleaned and validated
- User receives a complete HTML document

### Step 3: HTML/CSS Editing & Direct Manipulation
- **Prompt Editor**: Edit requirements if needed
- **Direct Manipulation**: Edit HTML/CSS directly
- **Live Preview**: See changes in real-time
- **Multiple Views**: HTML, CSS, and full code tabs

### Step 4: Canvas Integration
- **Add to Canvas**: Import HTML/CSS component directly
- **Canvas Positioning**: Components appear on canvas with proper positioning
- **Direct Editing**: Edit HTML/CSS directly on canvas
- **Convert to React**: Convert when ready

### Step 5: React Conversion
- Click "Convert to React" button on canvas component
- AI converts HTML/CSS to React with proper:
  - Component structure
  - Event handlers
  - State management
  - Accessibility features
  - Unique IDs for AI system integration

## Key Benefits

### 1. Prompt Editor Window
- **Edit Requirements**: Modify component specifications after generation
- **Structured Approach**: Comprehensive form with all component options
- **Real-time Updates**: Changes reflect immediately in generated code

### 2. Direct Manipulation Tools
- **Side-by-side Editing**: HTML and CSS editing in separate panels
- **Live Preview**: Real-time preview of changes
- **Multiple Views**: HTML structure, CSS styles, and full code
- **Copy Functionality**: Copy individual sections or full code

### 3. Canvas Integration
- **Direct Import**: Add HTML/CSS components directly to canvas
- **Visual Editing**: Edit components visually on the canvas
- **Persistent Storage**: Components saved to localStorage
- **Positioning**: Automatic positioning with proper spacing

### 4. Convert to React Button
- **Prominent Placement**: Clear button on component header
- **One-click Conversion**: Convert after all edits are complete
- **Seamless Integration**: Converted components work with existing system
- **Proper Cleanup**: Remove HTML/CSS component after conversion

## Technical Implementation

### Component Structure
- **TypeScript**: All components use TypeScript for type safety
- **React Hooks**: Proper state management with useState and useEffect
- **Error Handling**: Comprehensive error handling and validation
- **Responsive Design**: Components work on all screen sizes

### State Management
- **Local State**: Component-specific state for editing and preview
- **Global State**: Canvas-level state for HTML/CSS components
- **Persistence**: localStorage for component persistence
- **Real-time Updates**: Immediate reflection of changes

### API Integration
- **HTML/CSS Generation**: `/api/ai/generate-html-css`
- **React Conversion**: `/api/ai/html-to-react`
- **Error Handling**: Proper error messages and fallbacks
- **Loading States**: Visual feedback during API calls

## Usage Instructions

### 1. Enable Enhanced Workflow
- Toggle "Enhanced Workflow" switch in AI Component Generator
- This enables the new structured workflow

### 2. Fill Requirements
- Complete the comprehensive requirements form
- Include component type, desired elements, styling preferences
- Add any additional notes or specifications

### 3. Generate HTML/CSS
- Click "Generate HTML/CSS" button
- Review the generated code in the editor
- Use "Edit Prompt" if requirements need changes

### 4. Direct Manipulation
- Use "Direct Edit" for side-by-side HTML/CSS editing
- Edit HTML structure, CSS styles, or full code
- See live preview of changes

### 5. Add to Canvas
- Click "Add to Canvas" to import HTML/CSS component
- Component appears on canvas with editing capabilities
- Continue editing directly on canvas if needed

### 6. Convert to React
- Click "Convert to React" button on canvas component
- Component is converted to React and integrated into system
- HTML/CSS component is removed from canvas

## Future Enhancements

1. **Drag and Drop**: Allow repositioning of HTML/CSS components on canvas
2. **Resize Controls**: Add resize handles for component dimensions
3. **Template Library**: Pre-built HTML/CSS templates
4. **Version Control**: Track changes and iterations
5. **Collaboration**: Share and reuse component requirements
6. **Advanced Editing**: Syntax highlighting and code completion
7. **Component Library**: Save and reuse HTML/CSS components

## Conclusion

This implementation provides a comprehensive solution for direct manipulation of HTML/CSS components, addressing all the requirements:

- ✅ **Prompt editor window** for modifying requirements
- ✅ **Direct manipulation tools** for HTML/CSS editing
- ✅ **Canvas integration** for HTML/CSS components
- ✅ **Convert to React button** on canvas components
- ✅ **Direct manipulation on canvas** with full editing capabilities

The workflow is now more flexible, allowing users to iterate on their designs before committing to React components, while maintaining full compatibility with the existing system. 