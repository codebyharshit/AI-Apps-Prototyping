// Test script for Run Mode synchronization
// Run this in your browser console to test the sync functionality

(function() {
  console.log('🧪 Testing Run Mode synchronization...');
  
  // Test 1: Check if components exist
  const prototypeComponents = localStorage.getItem('prototypeComponents');
  if (!prototypeComponents) {
    console.log('❌ No prototypeComponents found');
    return;
  }
  
  const components = JSON.parse(prototypeComponents);
  console.log(`✅ Found ${components.length} components`);
  
  // Test 2: Check for components with changes
  const componentsWithChanges = components.filter(c => {
    const hasChanges = c.properties?.hasDirectManipulationChanges;
    const styleOverrides = c.properties?.styleOverrides;
    const textContent = c.properties?.textContent;
    const placeholder = c.properties?.placeholder;
    
    return hasChanges || 
           (styleOverrides && Object.keys(styleOverrides).length > 0) || 
           textContent || 
           placeholder;
  });
  
  console.log(`📊 Components with changes: ${componentsWithChanges.length}`);
  
  if (componentsWithChanges.length > 0) {
    console.log('📋 Components with changes:');
    componentsWithChanges.forEach(c => {
      console.log(`  - ${c.id} (${c.type}):`, {
        hasDirectManipulationChanges: c.properties?.hasDirectManipulationChanges,
        styleOverrides: c.properties?.styleOverrides ? Object.keys(c.properties.styleOverrides) : [],
        textContent: c.properties?.textContent,
        placeholder: c.properties?.placeholder
      });
    });
  }
  
  // Test 3: Check for existing sync data
  const syncKeys = Object.keys(localStorage).filter(key => key.startsWith('runModeSync_'));
  console.log(`🔄 Existing sync data keys: ${syncKeys.length}`);
  
  if (syncKeys.length > 0) {
    console.log('📋 Sync data found:');
    syncKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`  - ${key}:`, data);
      } catch (e) {
        console.log(`  - ${key}: Error parsing`);
      }
    });
  }
  
  // Test 4: Manual sync test
  if (componentsWithChanges.length > 0) {
    const testComponent = componentsWithChanges[0];
    console.log(`🧪 Testing sync for component: ${testComponent.id}`);
    
    // Create sync data manually
    const syncData = {
      componentId: testComponent.id,
      hasDirectManipulationChanges: testComponent.properties?.hasDirectManipulationChanges || false,
      styleOverrides: testComponent.properties?.styleOverrides,
      textContent: testComponent.properties?.textContent,
      placeholder: testComponent.properties?.placeholder,
      color: testComponent.properties?.color,
      backgroundColor: testComponent.properties?.backgroundColor,
      lastModified: new Date().toISOString()
    };
    
    const syncKey = `runModeSync_${testComponent.id}`;
    localStorage.setItem(syncKey, JSON.stringify(syncData));
    
    console.log(`✅ Created test sync data for ${testComponent.id}`);
    console.log(`📄 Sync data:`, syncData);
    
    // Verify it was saved
    const savedData = localStorage.getItem(syncKey);
    if (savedData) {
      console.log(`✅ Sync data saved successfully`);
    } else {
      console.log(`❌ Failed to save sync data`);
    }
  }
  
  console.log('🧪 Test completed!');
  console.log('💡 To test in Run Mode:');
  console.log('  1. Go to Run Mode page');
  console.log('  2. Check browser console for sync messages');
  console.log('  3. Verify that changes are applied to components');
  
})(); 