// Emergency Storage Cleanup Script
// Run this in your browser console to eliminate redundancy immediately

(function() {
  console.log('🚨 EMERGENCY STORAGE CLEANUP - Starting...');
  
  // Step 1: Analyze current storage
  const keys = Object.keys(localStorage);
  console.log(`📊 Current localStorage keys: ${keys.length}`);
  
  let totalSize = 0;
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      totalSize += new Blob([value]).size;
    }
  });
  
  console.log(`📦 Current total size: ${(totalSize / 1024).toFixed(1)}KB`);
  
  // Step 2: Identify redundant keys
  const redundantKeys = [
    // All modifiedCode keys (redundant component code)
    ...keys.filter(key => key.startsWith('modifiedCode_')),
    
    // virtualComponents (redundant with prototypeComponents)
    ...keys.filter(key => key === 'virtualComponents'),
    
    // runModeSync keys (temporary sync data)
    ...keys.filter(key => key.startsWith('runModeSync_')),
    
    // backup keys
    ...keys.filter(key => key.startsWith('backup_')),
    
    // Browser-specific keys (not our app data)
    ...keys.filter(key => key.startsWith('ally-')),
    ...keys.filter(key => key.includes('cache')),
    ...keys.filter(key => key.includes('support')),
    
    // Empty or null values
    ...keys.filter(key => {
      const value = localStorage.getItem(key);
      return value === '[]' || value === '{}' || value === 'null' || value === '';
    })
  ];
  
  console.log(`🗑️ Identified ${redundantKeys.length} redundant keys to remove`);
  
  // Step 3: Remove redundant keys
  let removedSize = 0;
  redundantKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      removedSize += new Blob([value]).size;
    }
    localStorage.removeItem(key);
    console.log(`🗑️ Removed: ${key}`);
  });
  
  // Step 4: Clean up componentVersions (keep only latest working version)
  const componentVersions = localStorage.getItem('componentVersions');
  if (componentVersions) {
    try {
      const versions = JSON.parse(componentVersions);
      console.log(`📋 Found ${versions.length} component versions`);
      
      // Group by originalComponentId
      const versionGroups = {};
      versions.forEach(version => {
        const originalId = version.originalComponentId;
        if (!versionGroups[originalId]) {
          versionGroups[originalId] = [];
        }
        versionGroups[originalId].push(version);
      });
      
      // Keep only the latest working version of each component
      const cleanedVersions = [];
      Object.values(versionGroups).forEach(group => {
        const sortedVersions = group.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Find the latest working version
        const workingVersion = sortedVersions.find(v => v.isWorkingVersion) || sortedVersions[0];
        if (workingVersion) {
          cleanedVersions.push(workingVersion);
        }
      });
      
      // Save cleaned versions
      localStorage.setItem('componentVersions', JSON.stringify(cleanedVersions));
      console.log(`✅ Cleaned component versions: ${versions.length} → ${cleanedVersions.length}`);
      
    } catch (e) {
      console.error('❌ Error cleaning component versions:', e);
    }
  }
  
  // Step 5: Clean up prototypeComponents (remove redundant styling)
  const prototypeComponents = localStorage.getItem('prototypeComponents');
  if (prototypeComponents) {
    try {
      const components = JSON.parse(prototypeComponents);
      console.log(`📋 Found ${components.length} prototype components`);
      
      const cleanedComponents = components.map(component => ({
        id: component.id,
        type: component.type,
        position: component.position,
        size: component.size,
        frameId: component.frameId,
        properties: {
          generatedCode: component.properties?.generatedCode,
          prompt: component.properties?.prompt,
          hasDirectManipulationChanges: component.properties?.hasDirectManipulationChanges || false,
          styleOverrides: component.properties?.styleOverrides || {},
          textContent: component.properties?.textContent,
          placeholder: component.properties?.placeholder,
          lastModified: component.properties?.lastModified
        }
      }));
      
      localStorage.setItem('prototypeComponents', JSON.stringify(cleanedComponents));
      console.log(`✅ Cleaned prototype components: removed redundant styling properties`);
      
    } catch (e) {
      console.error('❌ Error cleaning prototype components:', e);
    }
  }
  
  // Step 6: Ensure essential keys exist
  const essentialKeys = ['aiFunctionalities', 'personas'];
  essentialKeys.forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '[]');
      console.log(`✅ Added missing essential key: ${key}`);
    }
  });
  
  // Step 7: Final analysis
  const finalKeys = Object.keys(localStorage);
  let finalSize = 0;
  finalKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      finalSize += new Blob([value]).size;
    }
  });
  
  const sizeReduction = ((totalSize - finalSize) / totalSize * 100).toFixed(1);
  
  console.log('🎉 EMERGENCY CLEANUP COMPLETED!');
  console.log(`📊 Before: ${keys.length} keys, ${(totalSize / 1024).toFixed(1)}KB`);
  console.log(`📊 After: ${finalKeys.length} keys, ${(finalSize / 1024).toFixed(1)}KB`);
  console.log(`🗑️ Removed: ${redundantKeys.length} redundant keys`);
  console.log(`📦 Size reduction: ${sizeReduction}% (${(removedSize / 1024).toFixed(1)}KB saved)`);
  
  console.log('📋 Final localStorage keys:');
  finalKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const size = value ? (new Blob([value]).size / 1024).toFixed(2) : '0';
    console.log(`  - ${key}: ${size}KB`);
  });
  
  console.log('✅ Your localStorage is now clean and optimized!');
  
})(); 