/**
 * Utility functions for localStorage debugging and management
 */

export const localStorageUtils = {
  
  /**
   * Get detailed info about localStorage usage
   */
  getStorageInfo() {
    const storage = localStorage;
    const totalSize = JSON.stringify(storage).length;
    const entries: Array<{key: string, size: number, truncated: boolean}> = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key) || '';
        const size = value.length;
        const truncated = this.isValueTruncated(key, value);
        entries.push({ key, size, truncated });
      }
    }
    
    return {
      totalSize,
      entries: entries.sort((a, b) => b.size - a.size),
      quota: this.estimateQuota()
    };
  },
  
  /**
   * Check if a localStorage value appears to be truncated
   */
  isValueTruncated(key: string, value: string): boolean {
    try {
      if (key === 'prototypeComponents') {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.some((comp: any) => {
            const code = comp.properties?.generatedCode;
            if (code) {
              // Check if code ends abruptly (common signs of truncation)
              return !code.includes('render(') || 
                     code.endsWith('setInt') || 
                     code.endsWith('set') ||
                     !code.trim().endsWith(');');
            }
            return false;
          });
        }
      }
    } catch (e) {
      return true; // If can't parse, probably truncated
    }
    return false;
  },
  
  /**
   * Estimate localStorage quota
   */
  estimateQuota(): number {
    try {
      // Try to estimate by attempting to store data
      const testKey = '__storage_test__';
      let size = 1024 * 1024; // Start with 1MB
      let data = 'x'.repeat(size);
      
      while (size > 0) {
        try {
          localStorage.setItem(testKey, data);
          localStorage.removeItem(testKey);
          return size * 10; // Estimate total quota as 10x what we can store
        } catch (e) {
          size = Math.floor(size * 0.9);
          data = 'x'.repeat(size);
        }
      }
      return 5 * 1024 * 1024; // Default to 5MB estimate
    } catch (e) {
      return 5 * 1024 * 1024;
    }
  },
  
  /**
   * Clean up localStorage to free space
   */
  cleanup() {
    const toRemove = [
      'pendingPositionChanges', // Temporary data
      'ai-sidebar-width',
      'ally-supports-cache',
    ];
    
    toRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Cleaned up localStorage key: ${key}`);
      }
    });
  },
  
  /**
   * Safely set item with error handling
   */
  safeSetItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('❌ localStorage.setItem failed:', e);
      
      if (e instanceof DOMException && (
        e.code === 22 || // QUOTA_EXCEEDED_ERR
        e.code === 1014 || // NS_ERROR_DOM_QUOTA_REACHED
        e.name === 'QuotaExceededError'
      )) {
        console.log('🧹 Quota exceeded, attempting cleanup...');
        this.cleanup();
        
        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (e2) {
          console.error('❌ localStorage.setItem failed even after cleanup:', e2);
          return false;
        }
      }
      
      return false;
    }
  },
  
  /**
   * Clean up corrupted virtualComponents data
   */
  cleanupVirtualComponents(): boolean {
    try {
      const virtualComponents = localStorage.getItem('virtualComponents');
      if (!virtualComponents) {
        console.log('✅ No virtualComponents to clean');
        return true;
      }

      // Try to parse - if it fails, it's corrupted
      try {
        JSON.parse(virtualComponents);
        console.log('✅ virtualComponents data is valid');
        return true;
      } catch (parseError) {
        console.warn('⚠️ virtualComponents data is corrupted, cleaning up...');
        localStorage.removeItem('virtualComponents');
        console.log('🧹 Removed corrupted virtualComponents data');
        return true;
      }
    } catch (error) {
      console.error('❌ Error cleaning virtualComponents:', error);
      return false;
    }
  },

  /**
   * Debug component code in localStorage
   */
  debugComponentCode(componentId: string) {
    const prototypeComponents = localStorage.getItem('prototypeComponents');
    if (prototypeComponents) {
      try {
        const components = JSON.parse(prototypeComponents);
        const component = components.find((c: any) => c.id === componentId);
        
        if (component) {
          const code = component.properties?.generatedCode || '';
          console.log('🔍 Component Code Debug:', {
            componentId,
            codeLength: code.length,
            hasRenderCall: code.includes('render('),
            startsCorrectly: code.startsWith('const '),
            endsCorrectly: code.trim().endsWith(');'),
            firstLine: code.split('\\n')[0],
            lastLine: code.split('\\n').pop(),
            truncated: this.isValueTruncated('prototypeComponents', prototypeComponents)
          });
          
          return {
            code,
            isValid: code.includes('render(') && code.startsWith('const ') && code.trim().endsWith(');'),
            isTruncated: this.isValueTruncated('prototypeComponents', prototypeComponents)
          };
        }
      } catch (e) {
        console.error('❌ Error parsing prototypeComponents:', e);
      }
    }
    
    return null;
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).localStorageUtils = localStorageUtils;
}