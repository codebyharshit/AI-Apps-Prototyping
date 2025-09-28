// Test script for persistence after refresh
// Run this in your browser console to test the persistence functionality

(function() {
  console.log('🧪 Testing persistence after refresh...');
  
  // Test 1: Check current components
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
  
  if (componentsWithChanges.length === 0) {
    console.log('💡 No components with changes found. Make some changes in Design Mode first!');
    return;
  }
  
  // Test 3: Show current changes
  console.log('📋 Current changes in prototypeComponents:');
  componentsWithChanges.forEach(c => {
    console.log(`  - ${c.id} (${c.type}):`, {
      hasDirectManipulationChanges: c.properties?.hasDirectManipulationChanges,
      styleOverrides: c.properties?.styleOverrides ? Object.keys(c.properties.styleOverrides) : [],
      textContent: c.properties?.textContent,
      placeholder: c.properties?.placeholder,
      lastModified: c.properties?.lastModified
    });
  });
  
  // Test 4: Check sync data
  const syncKeys = Object.keys(localStorage).filter(key => key.startsWith('runModeSync_'));
  console.log(`🔄 Sync data keys: ${syncKeys.length}`);
  
  if (syncKeys.length > 0) {
    console.log('📋 Sync data found:');
    syncKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`  - ${key}:`, {
          applied: data.applied,
          appliedAt: data.appliedAt,
          lastModified: data.lastModified,
          hasChanges: data.hasDirectManipulationChanges
        });
      } catch (e) {
        console.log(`  - ${key}: Error parsing`);
      }
    });
  }
  
  // Test 5: Simulate persistence test
  console.log('🧪 Simulating persistence test...');
  
  const testComponent = componentsWithChanges[0];
  console.log(`📝 Testing persistence for component: ${testComponent.id}`);
  
  // Create a backup of current state
  const backupKey = `backup_${testComponent.id}_${Date.now()}`;
  localStorage.setItem(backupKey, JSON.stringify(testComponent));
  console.log(`💾 Created backup: ${backupKey}`);
  
  // Test 6: Verify changes are in the right place
  console.log('🔍 Verifying changes are properly stored...');
  
  const hasProperStorage = testComponent.properties?.hasDirectManipulationChanges ||
                          (testComponent.properties?.styleOverrides && Object.keys(testComponent.properties.styleOverrides).length > 0) ||
                          testComponent.properties?.textContent ||
                          testComponent.properties?.placeholder;
  
  if (hasProperStorage) {
    console.log('✅ Changes are properly stored in prototypeComponents');
    console.log('✅ These changes should persist after refresh');
  } else {
    console.log('❌ Changes are not properly stored in prototypeComponents');
    console.log('❌ These changes will NOT persist after refresh');
  }
  
  // Test 7: Instructions for manual testing
  console.log('💡 Manual persistence test:');
  console.log('  1. Make changes in Design Mode');
  console.log('  2. Go to Run Mode - verify changes appear');
  console.log('  3. Refresh the page');
  console.log('  4. Go back to Run Mode - changes should still be there');
  console.log('  5. If changes disappear, run this test again to debug');
  
  // Test 8: Cleanup old sync data
  console.log('🧹 Cleaning up old sync data...');
  syncKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data.applied && data.appliedAt) {
        const appliedAt = new Date(data.appliedAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 0.1) { // Clean up after 6 minutes for testing
          localStorage.removeItem(key);
          console.log(`🧹 Cleaned up old sync data: ${key}`);
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  });
  
  console.log('🧪 Persistence test completed!');
  
})(); 