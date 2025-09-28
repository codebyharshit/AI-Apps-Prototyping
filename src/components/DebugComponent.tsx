import React from 'react';

const DebugComponent: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      border: '2px solid blue',
      borderRadius: '8px',
      backgroundColor: 'lightblue',
      color: 'darkblue',
      fontSize: '14px'
    }}>
      <h3>Debug Component</h3>
      <p>This is a test React component</p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          padding: '8px 16px',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
};

export default DebugComponent; 