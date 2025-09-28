import React, { useState } from 'react';

const WorkingOutput = ({ className = '', value: externalValue, onChange: externalOnChange, content: externalContent, ...props }) => {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const [internalContent, setInternalContent] = useState(externalContent || '');
  
  // Use external value if provided, otherwise use internal state
  const currentValue = externalValue !== undefined ? externalValue : internalValue;
  
  // Use external content if provided, otherwise use internal content
  const currentContent = externalContent !== undefined ? externalContent : internalContent;
  
  // Use external onChange if provided, otherwise use internal handler
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (externalOnChange) {
      externalOnChange(e);
    } else {
      setInternalValue(newValue);
    }
  };
  
  return (
    <div className={className}>
      {/* For output components - display the content with proper styling */}
      <div className="output-area p-4 border rounded-md bg-gray-50 min-h-[100px] w-full">
        <div className="text-sm text-gray-600 mb-2">Output:</div>
        <div className="text-base whitespace-pre-wrap">
          {currentContent || "Output will appear here..."}
        </div>
      </div>
    </div>
  );
};

export default WorkingOutput; 