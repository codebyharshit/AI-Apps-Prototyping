# 🎯 Drag & Drop Element Positioning System

## Overview

This system allows you to **drag, resize, and reposition individual elements** within AI-generated components, similar to Builder.io and Figma. Once you make changes, you can **regenerate the component code** with the new positions applied.

## 🚀 How It Works

### **Step 1: Generate a Component**
1. Go to **AI Configuration** page
2. Use **Generate Components** tab to create any component
3. The component will appear on the canvas

### **Step 2: Enable Element Positioning**
1. Click on the AI-generated component to select it
2. Go to **Design** tab in the AI Configuration sidebar
3. Scroll down to find **"Element Positioning"** section
4. Click **"Enable"** button

### **Step 3: Select and Move Elements**
- **Blue overlay boxes** will appear over all interactive elements
- **Click any box** to select that element
- **Drag the box** to move the element
- **Use corner handles** to resize the element
- **Numerical inputs** allow precise positioning

### **Step 4: Regenerate Code**
1. After making position changes, click **"Regenerate Code with New Positions"**
2. The AI will generate new React code with absolute positioning
3. **Apply & Refresh** to see changes in the component

## 🎨 Features

### **Visual Feedback**
- ✅ **Overlay system** shows selectable elements
- ✅ **Blue borders** indicate selected elements  
- ✅ **Element labels** show component IDs
- ✅ **Resize handles** on selected elements
- ✅ **Real-time position updates**

### **Positioning Controls**
- 🎯 **Drag to move** elements anywhere
- 📐 **Resize handles** for width/height adjustment
- 🔢 **Numerical inputs** for precise positioning
- 📊 **Z-index control** for layering
- 🔒 **Lock/unlock** elements to prevent changes
- 👁️ **Show/hide** elements

### **Code Integration**
- 🔄 **AI regeneration** applies positions to component code
- 💾 **Persistent storage** saves positions across sessions
- 📱 **Run mode compatibility** - changes appear in final app
- 🧪 **Preview system** shows code before applying

## 📋 Step-by-Step Tutorial

### **Example: Repositioning a Login Form**

1. **Generate Login Form**:
   ```
   Prompt: "Create a login form with email input, password input, and submit button"
   ```

2. **Enable Positioning**:
   - Select the generated component
   - Go to Design tab → Element Positioning → Enable

3. **Reposition Elements**:
   - Move email input to top-left: `x: 20, y: 20`
   - Move password input below: `x: 20, y: 80`
   - Move submit button to bottom-right: `x: 200, y: 140`

4. **Regenerate Code**:
   - Click "Regenerate Code with New Positions"
   - New code will include `position: absolute` with exact coordinates

5. **Result**:
   ```jsx
   const LoginForm = (props) => {
     return (
       <div style={{ position: 'relative', width: '300px', height: '200px' }}>
         <Input 
           id="email-input"
           style={{ position: 'absolute', left: '20px', top: '20px', width: '200px' }}
           placeholder="Email" 
         />
         <Input 
           id="password-input" 
           type="password"
           style={{ position: 'absolute', left: '20px', top: '80px', width: '200px' }}
           placeholder="Password" 
         />
         <Button 
           id="submit-button"
           style={{ position: 'absolute', left: '200px', top: '140px' }}
         >
           Login
         </Button>
       </div>
     );
   };
   ```

## 🔧 Technical Implementation

### **How It Works Like Builder.io/Figma**

1. **Overlay System**: 
   - Invisible divs overlay each interactive element
   - Mouse events are captured on overlays, not original elements

2. **Position Tracking**:
   - Tracks mouse movement and converts to CSS coordinates  
   - Updates element positions with `position: absolute`

3. **Code Generation**:
   - AI regenerates component with positioning instructions
   - Converts visual positions back to React inline styles

4. **State Management**:
   - Positions stored in localStorage for persistence
   - Component state tracks selected element and changes

### **Element Detection**
The system automatically finds these elements:
- `button`, `input`, `textarea`, `select`
- Elements with IDs containing "output", "display", "result"
- Elements with `data-ai-element="true"`
- Direct children of `.ai-live-preview`

### **Positioning Algorithm**
```typescript
// 1. Scan for interactive elements
const elements = container.querySelectorAll('button, input, [id*="output"]');

// 2. Create overlay for each element
elements.forEach(element => {
  const overlay = createOverlay(element.getBoundingClientRect());
  overlay.addEventListener('mousedown', startDrag);
});

// 3. Handle drag events
function startDrag(e) {
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;
  updateElementPosition(originalX + deltaX, originalY + deltaY);
}

// 4. Apply positions to actual elements
function applyPosition(element, x, y, width, height) {
  element.style.position = 'absolute';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
}
```

## 🎮 Controls Reference

| Action | Method |
|--------|--------|
| **Select Element** | Click on blue overlay box |
| **Move Element** | Drag the overlay box |
| **Resize Element** | Drag corner handles (when selected) |
| **Precise Position** | Use X/Y number inputs |
| **Precise Size** | Use Width/Height number inputs |
| **Layer Control** | Adjust Z-Index input |
| **Lock Element** | Click lock icon |
| **Hide Element** | Click eye icon |
| **Reset Position** | Click "Reset" button |
| **Save Positions** | Click "Regenerate Code" |

## 🐛 Troubleshooting

### **"No elements found"**
- Ensure component has interactive elements (buttons, inputs)
- Try clicking "Scan" to refresh element detection
- Check that component is AI-generated (has blue "AI Generated" badge)

### **"Drag not working"**
- Make sure element isn't locked (lock icon)
- Ensure positioning mode is enabled
- Check that you're dragging the overlay box, not the element itself

### **"Code regeneration failed"**
- Verify original component has `generatedCode` property
- Check browser console for specific error messages
- Ensure AI API key is configured properly

### **"Positions not saving"**
- Changes are applied immediately in editor mode
- Use "Regenerate Code" to make changes permanent
- Check localStorage for saved position data

## 💡 Best Practices

1. **Start Simple**: Begin with 2-3 elements before complex layouts
2. **Use Grid Layout**: Align elements to invisible grid for cleaner designs  
3. **Z-Index Planning**: Keep related elements in similar z-index ranges
4. **Save Frequently**: Regenerate code after major position changes
5. **Test in Run Mode**: Always verify positioning works in final app

## 🔮 Advanced Usage

### **Custom Element Detection**
Add `data-ai-element="true"` to any element to make it draggable:
```jsx
<div data-ai-element="true" id="custom-element">
  Draggable custom element
</div>
```

### **Programmatic Positioning**
Elements can be positioned via localStorage:
```javascript
const positions = {
  "element-id": {
    x: 100, y: 50, width: 200, height: 40, zIndex: 1
  }
};
localStorage.setItem('elementPositions', JSON.stringify(positions));
```

### **Integration with Direct Manipulation**
Positioning works alongside existing direct manipulation features:
- Color changes + positioning
- Text changes + positioning  
- Border changes + positioning
- All changes regenerated together

---

🎉 **You now have Builder.io-style drag & drop positioning in your AI component system!**