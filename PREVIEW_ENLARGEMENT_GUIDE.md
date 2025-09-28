# 🔍 Component Preview Enlargement System

## Overview

The component preview system now includes powerful enlargement features that allow you to view components in full-screen mode or open them in separate windows for better visibility and testing.

## 🚀 Features

### **1. Maximize Preview**
- **Full-screen overlay**: Component takes up most of the screen
- **Keyboard shortcut**: Press `F11` or `Ctrl+M` to toggle
- **Click to close**: Click outside the preview or use the close button
- **Maintains functionality**: All interactive features work in maximized mode

### **2. Open in New Window**
- **Separate browser window**: Opens component in a new tab/window
- **Full browser environment**: Access to all browser features
- **Responsive testing**: Test on different window sizes
- **Independent session**: Doesn't affect the main application

### **3. Floating Action Buttons**
- **Quick access**: Floating buttons in bottom-right corner
- **Always visible**: Available when preview is not maximized
- **Tooltips**: Hover for usage instructions

## 🎯 How to Use

### **For HTML/CSS Components:**
1. **In the HTML/CSS Editor**: Look for the preview tab
2. **Maximize**: Click the maximize button (📏) or press F11
3. **New Window**: Click the external link button (🔗)
4. **Floating Buttons**: Use the floating buttons in bottom-right

### **For AI Components:**
1. **Select the component** on the canvas
2. **Enable positioning** if needed
3. **Use the same controls** as HTML/CSS components
4. **Test interactions** in the enlarged view

## ⌨️ Keyboard Shortcuts

- **F11**: Toggle maximize preview
- **Ctrl+M**: Alternative maximize shortcut
- **Escape**: Close maximized preview (when focused)

## 🔧 Technical Implementation

### **Maximize Mode:**
```css
.preview-maximized {
  position: fixed;
  inset: 1rem;
  z-index: 50;
  background: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-radius: 0.5rem;
}
```

### **New Window:**
```javascript
const handleOpenInNewWindow = () => {
  const newWindow = window.open('', '_blank', 'width=1200,height=800');
  newWindow.document.write(htmlContent);
  newWindow.document.title = 'Component Preview';
  newWindow.document.close();
};
```

## 🎨 User Experience

### **Visual Feedback:**
- ✅ **Smooth transitions** when maximizing
- ✅ **Overlay background** for focus
- ✅ **Clear controls** with tooltips
- ✅ **Responsive design** adapts to screen size

### **Accessibility:**
- ✅ **Keyboard navigation** support
- ✅ **Screen reader** friendly
- ✅ **High contrast** controls
- ✅ **Focus management** when maximizing

## 🚀 Benefits

1. **Better Visibility**: See components in full detail
2. **Testing**: Test interactions in isolated environment
3. **Development**: Debug and inspect components easily
4. **Presentation**: Show components to stakeholders
5. **Responsive Testing**: Test on different screen sizes

This enhancement makes component development much more efficient and user-friendly! 