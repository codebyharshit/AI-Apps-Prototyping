# Direct Manipulation System Guide

## Overview

The Direct Manipulation system allows you to visually edit components in the editor mode and have those changes automatically applied in run mode. This system provides real-time visual feedback and persistent changes across modes.

## How It Works

### 1. Editor Mode - Making Changes

1. **Select a Component**: Click on any component on the canvas to select it
2. **Open Visual Editor**: The Visual Component Editor panel will appear on the right
3. **Make Changes**: Use the editor to modify:
   - Typography (font family, size, weight, color)
   - Layout (width, height, margins, padding)
   - Colors (text color, background color)
   - Content (text content, placeholder text)
   - Decoration (bold, italic, underline, strikethrough)

### 2. Real-time Preview

- Changes are applied instantly to the component on the canvas
- You can see the visual feedback immediately
- The component selector tracks all changes made

### 3. Saving Changes

- **Automatic Saving**: Changes are automatically saved to localStorage as you make them
- **Manual Save**: Click "Save Changes" button to explicitly save changes via API
- **Generate Code**: Click "Generate Code" to get the updated component code

### 4. Run Mode - Viewing Changes

- All saved changes are automatically applied when you switch to run mode
- Components with direct manipulation changes show a blue "✏️ Edited" indicator
- Style overrides and content changes are merged with the original component properties

## Technical Implementation

### API Endpoint

```
POST /api/save-direct-manipulation
```

**Request Body:**
```json
{
  "componentId": "string",
  "changes": [
    {
      "id": "string",
      "timestamp": "number",
      "propertyPath": "string",
      "oldValue": "any",
      "newValue": "any",
      "type": "style|content|layout"
    }
  ],
  "styleOverrides": {
    "color": "#ff0000",
    "fontSize": "16px",
    "backgroundColor": "#f0f0f0"
  },
  "contentChanges": {
    "textContent": "Updated text",
    "placeholder": "Updated placeholder"
  }
}
```

### Data Flow

1. **Component Selection**: Component selector extracts component info and properties
2. **Property Updates**: Visual editor calls `updateComponentProperty()` 
3. **Change Tracking**: Changes are tracked in the component selector
4. **Persistence**: Changes are saved to localStorage and optionally via API
5. **Run Mode Application**: Utility functions apply changes in run mode

### Key Files

- `src/lib/component-selector.ts` - Core selection and change tracking
- `src/components/VisualComponentEditor.tsx` - Visual editing interface
- `src/app/run/page.tsx` - Run mode with change application
- `src/lib/utils.ts` - Utility functions for applying changes
- `src/app/api/save-direct-manipulation/route.ts` - API endpoint

## Utility Functions

### `applyStyleOverrides(props, styleOverrides)`

Merges style overrides into component props:
```javascript
const updatedProps = applyStyleOverrides(originalProps, {
  color: "#ff0000",
  fontSize: "16px"
});
```

### `applyContentChanges(props, contentChanges)`

Applies content changes to component props:
```javascript
const updatedProps = applyContentChanges(originalProps, {
  textContent: "Updated text",
  placeholder: "Updated placeholder"
});
```

## Troubleshooting

### Changes Not Appearing in Run Mode

1. **Check Console**: Look for "🎨 Applying style overrides" messages
2. **Verify localStorage**: Check if changes are saved in browser dev tools
3. **Check API Response**: Ensure the save API call is successful
4. **Component Type**: Ensure the component type supports style overrides

### Common Issues

1. **AI Components**: AI components use code injection for style overrides
2. **Regular Components**: Regular components use prop merging for style overrides
3. **Content Changes**: Text content and placeholder changes are applied differently
4. **Style Conflicts**: Existing styles are merged with overrides

## Best Practices

1. **Save Regularly**: Use the "Save Changes" button to ensure changes persist
2. **Test in Run Mode**: Always verify changes appear correctly in run mode
3. **Use Revert**: Use "Revert All" to undo changes if needed
4. **Check Console**: Monitor console logs for debugging information

## Future Enhancements

- Database persistence for changes
- Change history and versioning
- Collaborative editing
- Advanced styling options
- Component templates with pre-applied styles 