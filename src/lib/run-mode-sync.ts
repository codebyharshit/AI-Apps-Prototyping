/**
 * Run Mode Synchronization Utility
 * Ensures that changes made in Design Mode are properly reflected in Run Mode
 */

export interface RunModeSyncData {
  componentId: string;
  hasDirectManipulationChanges: boolean;
  styleOverrides?: Record<string, any>;
  textContent?: string;
  placeholder?: string;
  color?: string;
  backgroundColor?: string;
  lastModified: string;
}

/**
 * Syncs component changes from Design Mode to Run Mode
 */
export const syncComponentToRunMode = (componentId: string): boolean => {
  try {
    console.log(`🔄 Syncing component ${componentId} to Run Mode...`);
    
    // Get the component from prototypeComponents
    const prototypeComponents = localStorage.getItem('prototypeComponents');
    if (!prototypeComponents) {
      console.warn('❌ No prototypeComponents found in localStorage');
      return false;
    }
    
    const components = JSON.parse(prototypeComponents);
    const component = components.find((c: any) => c.id === componentId);
    
    if (!component) {
      console.warn(`❌ Component ${componentId} not found in prototypeComponents`);
      return false;
    }
    
    // Check if component has direct manipulation changes
    const hasChanges = component.properties?.hasDirectManipulationChanges;
    const styleOverrides = component.properties?.styleOverrides;
    const textContent = component.properties?.textContent;
    const placeholder = component.properties?.placeholder;
    
    // Check if there are any changes worth syncing
    const hasStyleChanges = styleOverrides && Object.keys(styleOverrides).length > 0;
    const hasContentChanges = textContent || placeholder;
    const hasColorChanges = component.properties?.color || component.properties?.backgroundColor;
    
    if (!hasChanges && !hasStyleChanges && !hasContentChanges && !hasColorChanges) {
      console.log(`📄 Component ${componentId} has no changes to sync`);
      return true;
    }
    
    console.log(`🔄 Component ${componentId} has changes to sync:`, {
      hasDirectManipulationChanges: hasChanges,
      hasStyleChanges,
      hasContentChanges,
      hasColorChanges,
      textContent,
      placeholder
    });
    
    // Create sync data
    const syncData: RunModeSyncData = {
      componentId,
      hasDirectManipulationChanges: hasChanges || false,
      styleOverrides,
      textContent,
      placeholder,
      color: component.properties?.color,
      backgroundColor: component.properties?.backgroundColor,
      lastModified: new Date().toISOString()
    };
    
    // Save to localStorage for Run Mode to pick up
    const syncKey = `runModeSync_${componentId}`;
    localStorage.setItem(syncKey, JSON.stringify(syncData));
    
    console.log(`✅ Synced component ${componentId} to Run Mode:`, syncData);
    return true;
    
  } catch (error) {
    console.error(`❌ Error syncing component ${componentId} to Run Mode:`, error);
    return false;
  }
};

/**
 * Gets sync data for a component in Run Mode
 */
export const getRunModeSyncData = (componentId: string): RunModeSyncData | null => {
  try {
    const syncKey = `runModeSync_${componentId}`;
    const syncData = localStorage.getItem(syncKey);
    
    if (syncData) {
      const parsed = JSON.parse(syncData);
      
      // Check if this sync data is too old (older than 1 hour)
      if (parsed.lastModified) {
        const lastModified = new Date(parsed.lastModified);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 1) {
          console.log(`🧹 Cleaning up old sync data for ${componentId} (${hoursDiff.toFixed(1)} hours old)`);
          cleanupRunModeSyncData(componentId);
          return null;
        }
      }
      
      console.log(`📄 Found Run Mode sync data for ${componentId}:`, parsed);
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error getting Run Mode sync data for ${componentId}:`, error);
    return null;
  }
};

/**
 * Marks sync data as applied (but keeps it for persistence)
 */
export const markRunModeSyncDataAsApplied = (componentId: string): void => {
  try {
    const syncKey = `runModeSync_${componentId}`;
    const syncData = localStorage.getItem(syncKey);
    
    if (syncData) {
      const data = JSON.parse(syncData);
      data.applied = true;
      data.appliedAt = new Date().toISOString();
      localStorage.setItem(syncKey, JSON.stringify(data));
      console.log(`✅ Marked Run Mode sync data as applied for ${componentId}`);
    }
  } catch (error) {
    console.error(`❌ Error marking Run Mode sync data as applied for ${componentId}:`, error);
  }
};

/**
 * Cleans up sync data after it's been applied
 */
export const cleanupRunModeSyncData = (componentId: string): void => {
  try {
    const syncKey = `runModeSync_${componentId}`;
    localStorage.removeItem(syncKey);
    console.log(`🧹 Cleaned up Run Mode sync data for ${componentId}`);
  } catch (error) {
    console.error(`❌ Error cleaning up Run Mode sync data for ${componentId}:`, error);
  }
};

/**
 * Checks if a component needs to be synced to Run Mode
 */
export const needsRunModeSync = (componentId: string): boolean => {
  try {
    const prototypeComponents = localStorage.getItem('prototypeComponents');
    if (!prototypeComponents) return false;
    
    const components = JSON.parse(prototypeComponents);
    const component = components.find((c: any) => c.id === componentId);
    
    if (!component) return false;
    
    const hasChanges = component.properties?.hasDirectManipulationChanges;
    const styleOverrides = component.properties?.styleOverrides;
    const textContent = component.properties?.textContent;
    const placeholder = component.properties?.placeholder;
    
    return hasChanges || 
           (styleOverrides && Object.keys(styleOverrides).length > 0) || 
           textContent || 
           placeholder;
           
  } catch (error) {
    console.error(`❌ Error checking if component ${componentId} needs sync:`, error);
    return false;
  }
};

/**
 * Syncs all components that need syncing
 */
export const syncAllComponentsToRunMode = (): void => {
  try {
    const prototypeComponents = localStorage.getItem('prototypeComponents');
    if (!prototypeComponents) return;
    
    const components = JSON.parse(prototypeComponents);
    let syncedCount = 0;
    
    components.forEach((component: any) => {
      if (needsRunModeSync(component.id)) {
        if (syncComponentToRunMode(component.id)) {
          syncedCount++;
        }
      }
    });
    
    console.log(`🔄 Synced ${syncedCount} components to Run Mode`);
    
  } catch (error) {
    console.error('❌ Error syncing all components to Run Mode:', error);
  }
}; 