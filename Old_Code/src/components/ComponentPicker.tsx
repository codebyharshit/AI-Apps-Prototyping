import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { componentsRegistry } from "@/lib/components-registry";

interface ComponentItemProps {
  componentDef: (typeof componentsRegistry)[0];
}

const ComponentItem: React.FC<ComponentItemProps> = ({ componentDef }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `draggable-${componentDef.type}`,
    data: {
      type: componentDef.type,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-4 border rounded-md mb-2 cursor-grab bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="mb-1 text-sm text-gray-500">{componentDef.label}</div>
      <div className="relative">
        {componentDef.render({
          className: `${componentDef.defaultSize.width} ${componentDef.defaultSize.height}`,
          isInteractive: false,
          id: `preview-${componentDef.type}`,
        })}
      </div>
    </div>
  );
};

export const ComponentPicker: React.FC = () => {
  // Group components by category
  const componentsByCategory = componentsRegistry.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<string, typeof componentsRegistry>);

  return (
    <div className="w-[340px] border-r h-full overflow-y-auto bg-gray-50 p-4">
      <h2 className="text-lg font-semibold mb-4">Components</h2>

      {Object.entries(componentsByCategory).map(([category, components]) => (
        <div key={category} className="mb-4">
          <h3 className="text-md font-medium mb-2 text-gray-700">{category}</h3>
          <div className="space-y-2">
            {components.map((component) => (
              <ComponentItem key={component.type} componentDef={component} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
