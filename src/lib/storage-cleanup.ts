/**
 * Storage Cleanup Utility
 * Eliminates redundancy and keeps only necessary localStorage data
 */

export interface CleanedStorageData {
  prototypeComponents: any[];
  prototypeFrames: any[];
  homeFrameId: string | null;
  aiSidebarWidth: number;
  componentVersions: any[];
}

/**
 * Analyzes current localStorage and identifies redundancy
 */
export const analyzeStorageRedundancy = () => {
  console.log('🔍 Analyzing localStorage redundancy...');
  
  const keys = Object.keys(localStorage);
  const analysis: any = {};
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      const size = new Blob([value]).size;
      analysis[key] = {
        size: size,
        sizeKB: (size / 1024).toFixed(2),
        type: typeof value,
        isJSON: isJSON(value),
        redundancy: identifyRedundancy(key, value)
      };
    }
  });
  
  console.log('📊 Storage Analysis:', analysis);
  return analysis;
};

/**
 * Identifies redundant data patterns
 */
const identifyRedundancy = (key: string, value: string): string[] => {
  const redundancies: string[] = [];
  
  // Check for duplicate component code
  if (key.includes('modifiedCode_') || key.includes('component') || key.includes('generatedCode')) {
    redundancies.push('component-code-duplication');
  }
  
  // Check for large JSON objects
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      if (Object.keys(parsed).length > 20) {
        redundancies.push('large-object');
      }
      if (JSON.stringify(parsed).length > 10000) {
        redundancies.push('oversized-data');
      }
    }
  } catch (e) {
    // Not JSON
  }
  
  return redundancies;
};

/**
 * Checks if a string is valid JSON
 */
const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Cleans up redundant storage and keeps only necessary data
 */
export const cleanupRedundantStorage = (): CleanedStorageData => {
  console.log('🧹 Starting storage cleanup...');
  
  // 1. Keep only essential data
  const essentialData: CleanedStorageData = {
    prototypeComponents: [],
    prototypeFrames: [],
    homeFrameId: null,
    aiSidebarWidth: 450,
    componentVersions: []
  };
  
  // 2. Extract and clean prototypeComponents
  const prototypeComponents = localStorage.getItem('prototypeComponents');
  if (prototypeComponents) {
    try {
      const components = JSON.parse(prototypeComponents);
      essentialData.prototypeComponents = components.map((component: any) => ({
        id: component.id,
        type: component.type,
        position: component.position,
        size: component.size,
        frameId: component.frameId,
        properties: {
          generatedCode: component.properties?.generatedCode,
          prompt: component.properties?.prompt,
          // Only keep essential properties, remove redundant styling
          hasDirectManipulationChanges: component.properties?.hasDirectManipulationChanges || false,
          styleOverrides: component.properties?.styleOverrides || {},
          textContent: component.properties?.textContent,
          placeholder: component.properties?.placeholder,
          lastModified: component.properties?.lastModified
        }
      }));
      console.log(`✅ Cleaned ${essentialData.prototypeComponents.length} prototype components`);
    } catch (e) {
      console.error('❌ Error parsing prototypeComponents:', e);
    }
  }
  
  // 3. Extract prototypeFrames
  const prototypeFrames = localStorage.getItem('prototypeFrames');
  if (prototypeFrames) {
    try {
      essentialData.prototypeFrames = JSON.parse(prototypeFrames);
      console.log(`✅ Cleaned ${essentialData.prototypeFrames.length} prototype frames`);
    } catch (e) {
      console.error('❌ Error parsing prototypeFrames:', e);
    }
  }
  
  // 4. Extract homeFrameId
  const homeFrameId = localStorage.getItem('homeFrameId');
  if (homeFrameId) {
    essentialData.homeFrameId = homeFrameId;
  }
  
  // 5. Extract ai-sidebar-width
  const aiSidebarWidth = localStorage.getItem('ai-sidebar-width');
  if (aiSidebarWidth) {
    essentialData.aiSidebarWidth = parseInt(aiSidebarWidth) || 450;
  }
  
  // 6. Keep only the latest working version of each component
  const componentVersions = localStorage.getItem('componentVersions');
  if (componentVersions) {
    try {
      const versions = JSON.parse(componentVersions);
      
      // Group by originalComponentId and keep only the latest working version
      const versionGroups: { [key: string]: any[] } = {};
      versions.forEach((version: any) => {
        const originalId = version.originalComponentId;
        if (!versionGroups[originalId]) {
          versionGroups[originalId] = [];
        }
        versionGroups[originalId].push(version);
      });
      
      // Keep only the latest working version of each component
      Object.values(versionGroups).forEach(group => {
        const sortedVersions = group.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Find the latest working version
        const workingVersion = sortedVersions.find(v => v.isWorkingVersion) || sortedVersions[0];
        if (workingVersion) {
          essentialData.componentVersions.push(workingVersion);
        }
      });
      
      console.log(`✅ Cleaned component versions: kept ${essentialData.componentVersions.length} latest versions`);
    } catch (e) {
      console.error('❌ Error parsing componentVersions:', e);
    }
  }
  
  return essentialData;
};

/**
 * Removes all redundant localStorage keys
 */
export const removeRedundantKeys = (): string[] => {
  console.log('🗑️ Removing redundant localStorage keys...');
  
  const keysToRemove = [
    // Remove all modifiedCode keys (redundant with prototypeComponents)
    ...Object.keys(localStorage).filter(key => key.startsWith('modifiedCode_')),
    
    // Remove virtualComponents (redundant with prototypeComponents)
    ...Object.keys(localStorage).filter(key => key === 'virtualComponents'),
    
    // Remove runModeSync keys (temporary sync data)
    ...Object.keys(localStorage).filter(key => key.startsWith('runModeSync_')),
    
    // Remove old backup keys
    ...Object.keys(localStorage).filter(key => key.startsWith('backup_')),
    
    // Remove empty arrays/objects
    ...Object.keys(localStorage).filter(key => {
      const value = localStorage.getItem(key);
      return value === '[]' || value === '{}' || value === 'null';
    }),
    
    // Remove browser-specific keys (not our app data)
    ...Object.keys(localStorage).filter(key => 
      key.startsWith('ally-') || 
      key.startsWith('__') ||
      key.includes('cache') ||
      key.includes('support')
    )
  ];
  
  keysToRemove.forEach(key => {
    console.log(`🗑️ Removing: ${key}`);
    localStorage.removeItem(key);
  });
  
  console.log(`✅ Removed ${keysToRemove.length} redundant keys`);
  return keysToRemove;
};

/**
 * Saves cleaned data back to localStorage
 */
export const saveCleanedData = (cleanedData: CleanedStorageData): void => {
  console.log('💾 Saving cleaned data to localStorage...');
  
  // Clear all existing data
  localStorage.clear();
  
  // Save only essential data
  localStorage.setItem('prototypeComponents', JSON.stringify(cleanedData.prototypeComponents));
  localStorage.setItem('prototypeFrames', JSON.stringify(cleanedData.prototypeFrames));
  
  if (cleanedData.homeFrameId) {
    localStorage.setItem('homeFrameId', cleanedData.homeFrameId);
  }
  
  localStorage.setItem('ai-sidebar-width', cleanedData.aiSidebarWidth.toString());
  
  if (cleanedData.componentVersions.length > 0) {
    localStorage.setItem('componentVersions', JSON.stringify(cleanedData.componentVersions));
  }
  
  // Set empty arrays for required keys
  localStorage.setItem('aiFunctionalities', '[]');
  localStorage.setItem('personas', '[]');
  
  console.log('✅ Cleaned data saved successfully');
};

/**
 * Complete storage cleanup process
 */
export const performCompleteStorageCleanup = (): void => {
  console.log('🚀 Starting complete storage cleanup...');
  
  // 1. Analyze current redundancy
  const analysis = analyzeStorageRedundancy();
  
  // 2. Clean up redundant data
  const cleanedData = cleanupRedundantStorage();
  
  // 3. Remove redundant keys
  const removedKeys = removeRedundantKeys();
  
  // 4. Save cleaned data
  saveCleanedData(cleanedData);
  
  // 5. Verify cleanup
  const finalAnalysis = analyzeStorageRedundancy();
  
  console.log('🎉 Storage cleanup completed!');
  console.log(`📊 Before: ${Object.keys(analysis).length} keys`);
  console.log(`📊 After: ${Object.keys(finalAnalysis).length} keys`);
  console.log(`🗑️ Removed: ${removedKeys.length} redundant keys`);
  
  // Calculate size reduction
  const beforeSize = Object.values(analysis).reduce((total: number, item: any) => total + item.size, 0);
  const afterSize = Object.values(finalAnalysis).reduce((total: number, item: any) => total + item.size, 0);
  const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
  
  console.log(`📦 Size reduction: ${reduction}% (${(beforeSize / 1024).toFixed(1)}KB → ${(afterSize / 1024).toFixed(1)}KB)`);
};

/**
 * Emergency cleanup for immediate redundancy removal
 */
export const emergencyCleanup = (): void => {
  console.log('🚨 Emergency cleanup - removing all redundant data...');
  
  // Remove all redundant keys immediately
  const keysToRemove = [
    ...Object.keys(localStorage).filter(key => key.startsWith('modifiedCode_')),
    ...Object.keys(localStorage).filter(key => key === 'virtualComponents'),
    ...Object.keys(localStorage).filter(key => key.startsWith('runModeSync_')),
    ...Object.keys(localStorage).filter(key => key.startsWith('backup_')),
    ...Object.keys(localStorage).filter(key => key.startsWith('ally-')),
    ...Object.keys(localStorage).filter(key => key.includes('cache')),
    ...Object.keys(localStorage).filter(key => key.includes('support'))
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Emergency removed: ${key}`);
  });
  
  console.log(`✅ Emergency cleanup completed: removed ${keysToRemove.length} keys`);
}; 