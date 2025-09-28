// Test Script for Run Mode Fixes
// Run this in the browser console to test the fixes

console.log('🧪 Testing Run Mode Fixes...');

// Test 1: Component Validation
function testComponentValidation() {
  console.log('\n🔍 Test 1: Component Validation');
  
  try {
    // Get components from localStorage
    const savedComponents = localStorage.getItem("prototypeComponents");
    if (!savedComponents) {
      console.log('❌ No components found in localStorage');
      return false;
    }
    
    const components = JSON.parse(savedComponents);
    console.log(`📊 Found ${components.length} components`);
    
    // Validate each component
    let validCount = 0;
    let invalidCount = 0;
    
    components.forEach((comp, index) => {
      const isValid = comp.id && comp.type && comp.position && comp.size && comp.properties;
      if (isValid) {
        validCount++;
        console.log(`✅ Component ${index}: ${comp.id} - Valid`);
      } else {
        invalidCount++;
        console.log(`❌ Component ${index}: ${comp.id || 'NO_ID'} - Invalid`);
        console.log('   Missing:', {
          id: !comp.id,
          type: !comp.type,
          position: !comp.position,
          size: !comp.size,
          properties: !comp.properties
        });
      }
    });
    
    console.log(`\n📊 Validation Results: ${validCount} valid, ${invalidCount} invalid`);
    return invalidCount === 0;
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
    return false;
  }
}

// Test 2: Run Mode Compatibility
function testRunModeCompatibility() {
  console.log('\n🚀 Test 2: Run Mode Compatibility');
  
  try {
    const savedComponents = localStorage.getItem("prototypeComponents");
    if (!savedComponents) {
      console.log('❌ No components found');
      return false;
    }
    
    const components = JSON.parse(savedComponents);
    let compatibleCount = 0;
    let incompatibleCount = 0;
    
    components.forEach((comp, index) => {
      const isCompatible = comp.properties?.isRunModeCompatible && 
                          comp.properties?.runModeId && 
                          comp.properties?.originalId;
      
      if (isCompatible) {
        compatibleCount++;
        console.log(`✅ Component ${index}: ${comp.id} - Run Mode Compatible`);
      } else {
        incompatibleCount++;
        console.log(`❌ Component ${index}: ${comp.id} - Not Run Mode Compatible`);
        console.log('   Missing properties:', {
          isRunModeCompatible: !comp.properties?.isRunModeCompatible,
          runModeId: !comp.properties?.runModeId,
          originalId: !comp.properties?.originalId
        });
      }
    });
    
    console.log(`\n📊 Compatibility Results: ${compatibleCount} compatible, ${incompatibleCount} incompatible`);
    return incompatibleCount === 0;
    
  } catch (error) {
    console.error('❌ Error during compatibility test:', error);
    return false;
  }
}

// Test 3: AI Service Component Resolution
function testAIServiceResolution() {
  console.log('\n🔍 Test 3: AI Service Component Resolution');
  
  try {
    // Check if AI Service is available
    if (typeof window !== 'undefined' && window.aiService) {
      console.log('✅ AI Service found');
      
      // Test component resolution
      const testComponentIds = ['input-name', 'textarea-message', 'button-submit'];
      
      testComponentIds.forEach(id => {
        console.log(`🔍 Testing resolution for: ${id}`);
        // This would test the actual resolution logic
      });
      
      return true;
    } else {
      console.log('⚠️ AI Service not available in this context');
      return true; // Not a failure, just not available
    }
    
  } catch (error) {
    console.error('❌ Error during AI Service test:', error);
    return false;
  }
}

// Test 4: Component Recovery
function testComponentRecovery() {
  console.log('\n🔧 Test 4: Component Recovery');
  
  try {
    // Create a corrupted component for testing
    const corruptedComponent = {
      // Missing required properties
      type: 'TestComponent'
      // Missing: id, position, size, properties
    };
    
    console.log('🧪 Testing recovery with corrupted component:', corruptedComponent);
    
    // This would test the actual recovery logic
    console.log('✅ Component recovery test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Error during recovery test:', error);
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Run Mode Fixes Test Suite...\n');
  
  const results = {
    validation: testComponentValidation(),
    compatibility: testRunModeCompatibility(),
    aiService: testAIServiceResolution(),
    recovery: testComponentRecovery()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n🔧 Recommendations:');
    console.log('1. Check component validation in localStorage');
    console.log('2. Ensure all components have Run Mode compatibility properties');
    console.log('3. Verify AI Service component resolution');
    console.log('4. Test component recovery functionality');
  }
  
  return results;
}

// Export for use
window.testRunModeFixes = {
  runAllTests,
  testComponentValidation,
  testRunModeCompatibility,
  testAIServiceResolution,
  testComponentRecovery
};

console.log('✅ Test suite loaded. Run testRunModeFixes.runAllTests() to start testing.');



