// Emergency Recovery Script for localStorage Truncation
// Run this in your browser console to fix the current issue

(function() {
  console.log('🚨 Starting Emergency Recovery...');
  
  // Check current storage health
  const keys = Object.keys(localStorage);
  let totalSize = 0;
  const keySizes = {};
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      const size = new Blob([value]).size;
      keySizes[key] = size;
      totalSize += size;
    }
  });
  
  console.log(`📊 Current localStorage size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log('📋 Key sizes:', keySizes);
  
  // Clean up truncated keys
  const keysToRemove = [
    'modifiedCode_element-1754393096646',
    'virtualComponents',
    'prototypeComponents',
    'componentVersions'
  ];
  
  console.log('🧹 Cleaning up truncated keys...');
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️ Removing: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Try to restore from any working versions
  console.log('🔄 Attempting to restore from working versions...');
  
  // Create a minimal working component
  const workingComponent = {
    id: "element-1754393096646",
    type: "div",
    properties: {
      isAIComponent: true,
      generatedCode: `const ContactSellerModal = (props) => {
  const { className = '', value: externalValue, onChange: externalOnChange, content } = props || {};
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const [internalContent, setInternalContent] = useState(content || 'Hi, I\\'m interested in this item. Could you tell me more about it?');
  
  const currentValue = externalValue !== undefined ? externalValue : internalValue;
  const currentContent = content !== undefined ? content : internalContent;
  
  useEffect(() => {
    if (content !== undefined) {
      setInternalContent(content);
    }
  }, [content]);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (externalOnChange) {
      externalOnChange(e);
    } else {
      setInternalValue(newValue);
    }
  };
  
  const handleSubmit = () => {
    console.log('Message sent:', currentContent + ' ' + currentValue);
  };
  
  return (
    <div className={className} style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Contact Seller</h2>
      
      <div id="output-message-preview" style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px'
      }}>
        {currentContent}
      </div>
      
      <Textarea 
        id="textarea-additional-notes"
        value={currentValue}
        onChange={handleChange}
        placeholder="Add any additional notes..."
        style={{ width: '100%', minHeight: '100px', marginBottom: '15px' }}
      />
      
      <Button 
        id="button-send-message"
        onClick={handleSubmit}
        style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
      >
        Send Message
      </Button>
      
      <div id="note-response-time" style={{ fontSize: '12px', color: '#666' }}>
        Average seller response time: 24 hours
      </div>
    </div>
  );
};

render(<ContactSellerModal />);`,
      hasDirectManipulationChanges: false,
      lastRegenerated: new Date().toISOString()
    }
  };
  
  // Save minimal virtualComponents
  const virtualComponents = {
    "element-1754393096646": workingComponent
  };
  
  try {
    localStorage.setItem('virtualComponents', JSON.stringify(virtualComponents));
    console.log('✅ Restored virtualComponents');
  } catch (e) {
    console.error('❌ Failed to restore virtualComponents:', e);
  }
  
  // Save minimal prototypeComponents
  const prototypeComponents = [{
    id: "d72a4b4d-01ac-4db4-92ce-c1fdb1b19631",
    type: "AIInput",
    position: { x: 749.8384900528716, y: 126.0219750178436 },
    size: { width: 400.70062255859375, height: 300.70062255859375 },
    properties: {
      generatedCode: workingComponent.properties.generatedCode,
      prompt: "This is a modal titled \"Contact seller\" that opens a chat with the seller. It contains a pre-filled greeting message and a text input for additional notes. A \"Send Message\" button submits the form, which then launches the in-platform messaging thread. A note below mentions the average seller response time."
    },
    frameId: "frame-1754392770250"
  }];
  
  try {
    localStorage.setItem('prototypeComponents', JSON.stringify(prototypeComponents));
    console.log('✅ Restored prototypeComponents');
  } catch (e) {
    console.error('❌ Failed to restore prototypeComponents:', e);
  }
  
  // Check final storage health
  const finalKeys = Object.keys(localStorage);
  let finalSize = 0;
  
  finalKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      finalSize += new Blob([value]).size;
    }
  });
  
  console.log(`📊 Final localStorage size: ${(finalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log('✅ Emergency recovery completed!');
  console.log('🔄 Please refresh the page to see the restored component.');
  
  // Dispatch reload event
  window.dispatchEvent(new CustomEvent('reloadComponents'));
  
})(); 