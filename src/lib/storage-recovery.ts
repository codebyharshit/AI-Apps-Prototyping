/**
 * Emergency localStorage recovery utilities
 * Can be called from browser console if storage gets corrupted
 */

export const storageRecovery = {
  
  /**
   * Clean up truncated components from localStorage
   */
  cleanupTruncatedComponents() {
    try {
      const prototypeComponents = localStorage.getItem('prototypeComponents');
      if (!prototypeComponents) {
        console.log('❌ No prototypeComponents found');
        return false;
      }
      
      const components = JSON.parse(prototypeComponents);
      let cleaned = false;
      
      const cleanedComponents = components.map((comp: any) => {
        const code = comp.properties?.generatedCode;
        if (code && this.isCodeTruncated(code)) {
          console.log('🧹 Found truncated component:', comp.id);
          // Remove the truncated code to force regeneration
          return {
            ...comp,
            properties: {
              ...comp.properties,
              generatedCode: null,
              needsRegeneration: true
            }
          };
        }
        return comp;
      });
      
      if (cleaned) {
        localStorage.setItem('prototypeComponents', JSON.stringify(cleanedComponents));
        console.log('✅ Cleaned up truncated components');
        return true;
      } else {
        console.log('✅ No truncated components found');
        return false;
      }
    } catch (e) {
      console.error('❌ Error during cleanup:', e);
      return false;
    }
  },
  
  /**
   * Check if code appears truncated
   */
  isCodeTruncated(code: string): boolean {
    if (!code || typeof code !== 'string') return true;
    
    // Common signs of truncation
    const truncationSigns = [
      !code.includes('render('),
      code.endsWith('setInt'),
      code.endsWith('set'),
      code.endsWith('useEffect(() => {'),
      !code.trim().endsWith(');'),
      code.split('\\n').length < 10 // Very short components are likely truncated
    ];
    
    return truncationSigns.some(sign => sign);
  },
  
  /**
   * Backup current localStorage to download
   */
  backupLocalStorage() {
    try {
      const backup: Record<string, string> = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          backup[key] = localStorage.getItem(key) || '';
        }
      }
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('✅ localStorage backup downloaded');
      return true;
    } catch (e) {
      console.error('❌ Error creating backup:', e);
      return false;
    }
  },
  
  /**
   * Restore localStorage from backup file
   */
  restoreFromBackup(backupData: Record<string, string>) {
    try {
      Object.entries(backupData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      console.log('✅ localStorage restored from backup');
      return true;
    } catch (e) {
      console.error('❌ Error restoring backup:', e);
      return false;
    }
  },
  
  /**
   * Clear problematic localStorage entries
   */
  emergencyCleanup() {
    const keysToRemove = [
      'pendingPositionChanges',
      'elementPositions',
      'ally-supports-cache'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Removed: ${key}`);
      }
    });
    
    console.log('✅ Emergency cleanup completed');
  },
  
  /**
   * Get component code status report
   */
  getComponentCodeStatus() {
    try {
      const prototypeComponents = localStorage.getItem('prototypeComponents');
      if (!prototypeComponents) return { error: 'No components found' };
      
      const components = JSON.parse(prototypeComponents);
      const report = components.map((comp: any) => {
        const code = comp.properties?.generatedCode;
        return {
          id: comp.id,
          type: comp.type,
          hasCode: !!code,
          codeLength: code?.length || 0,
          isTruncated: code ? this.isCodeTruncated(code) : false,
          isValid: code ? (code.includes('render(') && code.startsWith('const ')) : false
        };
      });
      
      console.table(report);
      return report;
    } catch (e) {
      console.error('❌ Error generating report:', e);
      return { error: e };
    }
  }
};

// Enhanced cleanup for truncated components
export const cleanupTruncatedComponents = () => {
  try {
    console.log('🧹 Starting aggressive cleanup of truncated components...');
    
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    let totalSize = 0;
    const keySizes: { [key: string]: number } = {};
    
    // Calculate sizes
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        keySizes[key] = size;
        totalSize += size;
      }
    });
    
    console.log(`📊 Total localStorage size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log('📋 Key sizes:', keySizes);
    
    // Clean up specific problematic keys
    const keysToClean = [
      'modifiedCode_element-1754393096646',
      'virtualComponents',
      'prototypeComponents',
      'componentVersions'
    ];
    
    keysToClean.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🗑️ Removing truncated key: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Clean up any other truncated keys
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value && value.length > 10000) { // Large values
        try {
          JSON.parse(value); // Test if valid JSON
        } catch (e) {
          console.log(`🗑️ Removing invalid JSON key: ${key}`);
          localStorage.removeItem(key);
        }
      }
    });
    
    console.log('✅ Cleanup completed');
    return { success: true, removedKeys: keysToClean };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Emergency recovery - restore from working versions
export const emergencyRecovery = () => {
  try {
    console.log('🚨 Starting emergency recovery...');
    
    // First, clean up truncated data
    cleanupTruncatedComponents();
    
    // Try to restore from componentVersions if available
    const versions = localStorage.getItem('componentVersions');
    if (versions) {
      try {
        const parsedVersions = JSON.parse(versions);
        if (Array.isArray(parsedVersions) && parsedVersions.length > 0) {
          // Find the most recent working version
          const workingVersion = parsedVersions.find(v => v.isWorkingVersion) || 
                                parsedVersions[parsedVersions.length - 1];
          
          if (workingVersion && workingVersion.generatedCode) {
            console.log(`🔄 Restoring from version ${workingVersion.versionNumber}`);
            
            // Create a minimal virtualComponents entry
            const minimalComponent = {
              id: workingVersion.originalComponentId,
              type: "div",
              properties: {
                isAIComponent: true,
                generatedCode: workingVersion.generatedCode,
                hasDirectManipulationChanges: false,
                lastRegenerated: new Date().toISOString()
              }
            };
            
            // Save minimal data
            localStorage.setItem('virtualComponents', JSON.stringify({
              [workingVersion.originalComponentId]: minimalComponent
            }));
            
            console.log('✅ Emergency recovery completed');
            return { success: true, restoredFrom: workingVersion.versionNumber };
          }
        }
      } catch (e) {
        console.log('⚠️ Could not parse componentVersions, removing...');
        localStorage.removeItem('componentVersions');
      }
    }
    
    console.log('⚠️ No working versions found, starting fresh');
    return { success: true, message: 'Starting fresh' };
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Smart storage management
export const smartStorageManager = {
  // Check if we're approaching limits
  checkStorageHealth: () => {
    const totalSize = Object.keys(localStorage).reduce((total, key) => {
      const value = localStorage.getItem(key);
      return total + (value ? new Blob([value]).size : 0);
    }, 0);
    
    const sizeMB = totalSize / 1024 / 1024;
    const isHealthy = sizeMB < 4; // Keep under 4MB to be safe
    
    return {
      sizeMB: sizeMB.toFixed(2),
      isHealthy,
      needsCleanup: sizeMB > 5
    };
  },
  
  // Intelligent cleanup
  intelligentCleanup: () => {
    const health = smartStorageManager.checkStorageHealth();
    
    if (health.needsCleanup) {
      console.log(`⚠️ Storage at ${health.sizeMB}MB, performing cleanup...`);
      return cleanupTruncatedComponents();
    }
    
    return { success: true, message: 'Storage is healthy' };
  },
  
  // Safe set with automatic cleanup
  safeSet: (key: string, value: string) => {
    try {
      // Check if this will exceed limits
      const currentSize = Object.keys(localStorage).reduce((total, k) => {
        const v = localStorage.getItem(k);
        return total + (v ? new Blob([v]).size : 0);
      }, 0);
      
      const newValueSize = new Blob([value]).size;
      const projectedSize = (currentSize + newValueSize) / 1024 / 1024;
      
      if (projectedSize > 4) {
        console.log(`⚠️ Projected size ${projectedSize.toFixed(2)}MB, cleaning up first...`);
        smartStorageManager.intelligentCleanup();
      }
      
      localStorage.setItem(key, value);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to set item:', error);
      return { success: false, error: (error as Error).message };
    }
  }
};

// Make available globally for emergency use
if (typeof window !== 'undefined') {
  (window as any).storageRecovery = storageRecovery;
}