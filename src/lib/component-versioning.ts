/**
 * Component versioning system for safe code updates with fallback protection
 */

export interface ComponentVersion {
  id: string;
  originalComponentId: string;
  versionNumber: number;
  timestamp: string;
  generatedCode: string;
  changes: Record<string, any>;
  isWorkingVersion: boolean;
  hasRenderingIssues?: boolean;
  errorMessage?: string;
}

export const componentVersioning = {
  
  /**
   * Create a new version of a component with updated code
   */
  createNewVersion(
    originalComponentId: string, 
    newCode: string, 
    changes: Record<string, any>
  ): ComponentVersion {
    const timestamp = new Date().toISOString();
    const versionNumber = this.getNextVersionNumber(originalComponentId);
    
    return {
      id: `${originalComponentId}_v${versionNumber}`,
      originalComponentId,
      versionNumber,
      timestamp,
      generatedCode: newCode,
      changes,
      isWorkingVersion: false,
      hasRenderingIssues: false
    };
  },
  
  /**
   * Get the next version number for a component
   */
  getNextVersionNumber(componentId: string): number {
    const versions = this.getComponentVersions(componentId);
    if (versions.length === 0) return 1;
    return Math.max(...versions.map(v => v.versionNumber)) + 1;
  },
  
  /**
   * Get all versions of a component
   */
  getComponentVersions(componentId: string): ComponentVersion[] {
    try {
      const versionsData = localStorage.getItem('componentVersions');
      if (!versionsData) return [];
      
      const allVersions: ComponentVersion[] = JSON.parse(versionsData);
      return allVersions.filter(v => v.originalComponentId === componentId);
    } catch (error) {
      console.error('Error loading component versions:', error);
      return [];
    }
  },
  
  /**
   * Save a new version to localStorage
   */
  saveVersion(version: ComponentVersion): boolean {
    try {
      const versionsData = localStorage.getItem('componentVersions');
      const allVersions: ComponentVersion[] = versionsData ? JSON.parse(versionsData) : [];
      
      // Remove any existing version with the same ID
      const filteredVersions = allVersions.filter(v => v.id !== version.id);
      filteredVersions.push(version);
      
      localStorage.setItem('componentVersions', JSON.stringify(filteredVersions));
      console.log(`💾 Saved component version: ${version.id}`);
      return true;
    } catch (error) {
      console.error('Error saving component version:', error);
      return false;
    }
  },
  
  /**
   * Mark a version as having rendering issues
   */
  markVersionAsBroken(versionId: string, errorMessage: string): boolean {
    try {
      const versionsData = localStorage.getItem('componentVersions');
      if (!versionsData) return false;
      
      const allVersions: ComponentVersion[] = JSON.parse(versionsData);
      const version = allVersions.find(v => v.id === versionId);
      
      if (version) {
        version.hasRenderingIssues = true;
        version.errorMessage = errorMessage;
        version.isWorkingVersion = false;
        
        localStorage.setItem('componentVersions', JSON.stringify(allVersions));
        console.log(`❌ Marked version as broken: ${versionId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error marking version as broken:', error);
      return false;
    }
  },
  
  /**
   * Mark a version as working
   */
  markVersionAsWorking(versionId: string): boolean {
    try {
      const versionsData = localStorage.getItem('componentVersions');
      if (!versionsData) return false;
      
      const allVersions: ComponentVersion[] = JSON.parse(versionsData);
      
      // First, unmark all other versions of the same component as working
      const version = allVersions.find(v => v.id === versionId);
      if (!version) return false;
      
      allVersions.forEach(v => {
        if (v.originalComponentId === version.originalComponentId) {
          v.isWorkingVersion = false;
        }
      });
      
      // Mark this version as working
      version.isWorkingVersion = true;
      version.hasRenderingIssues = false;
      
      localStorage.setItem('componentVersions', JSON.stringify(allVersions));
      console.log(`✅ Marked version as working: ${versionId}`);
      return true;
    } catch (error) {
      console.error('Error marking version as working:', error);
      return false;
    }
  },
  
  /**
   * Get the current working version of a component
   */
  getWorkingVersion(componentId: string): ComponentVersion | null {
    const versions = this.getComponentVersions(componentId);
    return versions.find(v => v.isWorkingVersion) || null;
  },
  
  /**
   * Create a new component in prototypeComponents from a version
   */
  createComponentFromVersion(version: ComponentVersion): boolean {
    try {
      const savedComponents = localStorage.getItem('prototypeComponents');
      if (!savedComponents) return false;
      
      const components = JSON.parse(savedComponents);
      
      // Find the original component to get position, size, etc.
      const originalComponent = components.find((c: any) => c.id === version.originalComponentId);
      if (!originalComponent) return false;
      
      // Create new component with version code
      const newComponent = {
        ...originalComponent,
        id: version.id,
        properties: {
          ...originalComponent.properties,
          generatedCode: version.generatedCode,
          isVersion: true,
          originalComponentId: version.originalComponentId,
          versionNumber: version.versionNumber,
          lastRegenerated: version.timestamp
        },
        // Position it slightly offset from the original
        position: {
          x: originalComponent.position.x + 50,
          y: originalComponent.position.y + 50
        }
      };
      
      components.push(newComponent);
      localStorage.setItem('prototypeComponents', JSON.stringify(components));
      
      console.log(`🎯 Created new component from version: ${version.id}`);
      return true;
    } catch (error) {
      console.error('Error creating component from version:', error);
      return false;
    }
  },
  
  /**
   * Replace original component with a working version
   */
  replaceWithVersion(originalComponentId: string, versionId: string): boolean {
    try {
      const savedComponents = localStorage.getItem('prototypeComponents');
      if (!savedComponents) return false;
      
      const components = JSON.parse(savedComponents);
      const originalIndex = components.findIndex((c: any) => c.id === originalComponentId);
      
      if (originalIndex === -1) return false;
      
      const version = this.getComponentVersions(originalComponentId).find(v => v.id === versionId);
      if (!version) return false;
      
      // Update original component with version code
      components[originalIndex].properties = {
        ...components[originalIndex].properties,
        generatedCode: version.generatedCode,
        lastRegenerated: version.timestamp,
        replacedWithVersion: versionId
      };
      
      localStorage.setItem('prototypeComponents', JSON.stringify(components));
      console.log(`🔄 Replaced original component with version: ${versionId}`);
      return true;
    } catch (error) {
      console.error('Error replacing with version:', error);
      return false;
    }
  },
  
  /**
   * Clean up old versions (keep only last 5 per component)
   */
  cleanupOldVersions(componentId: string): void {
    try {
      const versions = this.getComponentVersions(componentId);
      if (versions.length <= 5) return;
      
      // Sort by timestamp and keep only the 5 most recent
      const sortedVersions = versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const toKeep = sortedVersions.slice(0, 5);
      const toRemove = sortedVersions.slice(5);
      
      // Remove old versions from storage
      const versionsData = localStorage.getItem('componentVersions');
      if (!versionsData) return;
      
      const allVersions: ComponentVersion[] = JSON.parse(versionsData);
      const filteredVersions = allVersions.filter(v => 
        v.originalComponentId !== componentId || toKeep.some(keep => keep.id === v.id)
      );
      
      localStorage.setItem('componentVersions', JSON.stringify(filteredVersions));
      console.log(`🧹 Cleaned up ${toRemove.length} old versions for component: ${componentId}`);
    } catch (error) {
      console.error('Error cleaning up old versions:', error);
    }
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).componentVersioning = componentVersioning;
}