'use client';

import React, { useEffect, useState } from 'react';

interface ElementPositionOverlayProps {
  componentId: string;
  elementPositions: Record<string, { x: number; y: number }>;
  onDragStart: (e: React.MouseEvent, elementId: string) => void;
}

export const ElementPositionOverlay: React.FC<ElementPositionOverlayProps> = ({
  componentId,
  elementPositions,
  onDragStart
}) => {
  const [elements, setElements] = useState<Array<{ id: string; rect: DOMRect }>>([]);

  useEffect(() => {
    // Find all elements with IDs in the component
    const findElements = () => {
      const container = document.querySelector(`[data-component-id="${componentId}"] .ai-live-preview`);
      if (!container) return;

      const elementsWithIds = container.querySelectorAll('[id]');
      const elementData: Array<{ id: string; rect: DOMRect }> = [];

      elementsWithIds.forEach((element) => {
        const id = element.getAttribute('id');
        if (id) {
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Calculate position relative to container
          const relativeRect = new DOMRect(
            rect.left - containerRect.left,
            rect.top - containerRect.top,
            rect.width,
            rect.height
          );
          
          elementData.push({ id, rect: relativeRect });
        }
      });

      setElements(elementData);
    };

    // Wait for the component to render
    const timer = setTimeout(findElements, 100);
    return () => clearTimeout(timer);
  }, [componentId, elementPositions]);

  if (elements.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {elements.map(({ id, rect }) => (
        <div
          key={id}
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move pointer-events-auto"
          style={{
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
          onMouseDown={(e) => onDragStart(e, id)}
          title={`Drag to move ${id}`}
        >
          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
            {id}
          </div>
        </div>
      ))}
    </div>
  );
}; 