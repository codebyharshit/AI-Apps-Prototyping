import React from "react";
import { PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentData, FrameData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Ban } from "lucide-react";

interface ComponentPropertiesEditorProps {
  component: ComponentData;
  frames: FrameData[];
  onUpdateProperties: (id: string, properties: Record<string, any>) => void;
  onClose: () => void;
  onHoverFrame: (id: string | null) => void;
}

export const ComponentPropertiesEditor: React.FC<
  ComponentPropertiesEditorProps
> = ({ component, frames, onUpdateProperties, onClose, onHoverFrame }) => {
  // Get initial properties or use an empty object
  const initialProperties = component.properties || {};

  // Create state for all editable properties
  const [properties, setProperties] =
    React.useState<Record<string, any>>(initialProperties);

  // Handle mouse enter/leave for frame highlighting
  const handleMouseEnter = (frameId: string) => {
    onHoverFrame(frameId);
  };

  const handleMouseLeave = () => {
    onHoverFrame(null);
  };

  // Handle input changes
  const handleChange = (key: string, value: any) => {
    // Special handling for navigateTo property
    if (key === "navigateTo" && value === "none") {
      // Remove the navigateTo property entirely
      const newProperties = { ...properties };
      delete newProperties.navigateTo;
      setProperties(newProperties);
    } else {
      setProperties((prev) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  // Handle save
  const handleSave = () => {
    onUpdateProperties(component.id, properties);
    onHoverFrame(null);
    onClose();
  };

  // Render navigation controls
  const renderNavigationControls = () => {
    if (component.type !== "Button") return null;

    return (
      <>
        <div className="my-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium mb-4">Navigation</h3>
          <div className="grid gap-2 mb-4">
            <Label htmlFor="navigate-to">Navigate to</Label>
            <Select
              onValueChange={(value) => handleChange("navigateTo", value)}
              value={properties.navigateTo || "none"}
            >
              <SelectTrigger id="navigate-to">
                <SelectValue placeholder="Select a frame to navigate to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="none"
                  className="cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex items-center">
                    <Ban className="h-4 w-4 mr-2" />
                    None
                  </div>
                </SelectItem>
                {frames.map((frame) => (
                  <SelectItem
                    key={frame.id}
                    value={frame.id}
                    onMouseEnter={() => handleMouseEnter(frame.id)}
                    onMouseLeave={handleMouseLeave}
                    className="cursor-pointer hover:bg-blue-50"
                  >
                    {frame.label} - {frame.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </>
    );
  };

  // Get property fields based on component type
  const renderPropertyFields = () => {
    switch (component.type) {
      case "Button":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={properties.text || "Button"}
                onChange={(e) => handleChange("text", e.target.value)}
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="button-variant">Variant</Label>
              <Select
                onValueChange={(value) => handleChange("variant", value)}
                value={properties.variant}
              >
                <SelectTrigger id="button-variant">
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="destructive">Destructive</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "Textarea":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="textarea-placeholder">Placeholder</Label>
              <Input
                id="textarea-placeholder"
                value={properties.placeholder || "Textarea component"}
                onChange={(e) => handleChange("placeholder", e.target.value)}
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="textarea-rows">Rows</Label>
              <Input
                id="textarea-rows"
                type="number"
                value={properties.rows || 3}
                onChange={(e) =>
                  handleChange("rows", parseInt(e.target.value, 10))
                }
              />
            </div>
          </>
        );
      case "Input":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="input-placeholder">Placeholder</Label>
              <Input
                id="input-placeholder"
                value={properties.placeholder || "Text input"}
                onChange={(e) => handleChange("placeholder", e.target.value)}
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="input-type">Type</Label>
              <Select
                onValueChange={(value) => handleChange("type", value)}
                value={properties.type}
              >
                <SelectTrigger id="input-type">
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="tel">Telephone</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "Checkbox":
        return (
          <div className="grid gap-2 mb-4">
            <Label htmlFor="checkbox-label">Label</Label>
            <Input
              id="checkbox-label"
              value={properties.label || "Checkbox label"}
              onChange={(e) => handleChange("label", e.target.value)}
            />
          </div>
        );
      case "TextOutput":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="textoutput-content">Placeholder</Label>
              <Input
                id="textoutput-content"
                value={properties.placeholder || "Output text will appear here"}
                onChange={(e) => handleChange("placeholder", e.target.value)}
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="textoutput-variant">Variant</Label>
              <Select
                onValueChange={(value) => handleChange("variant", value)}
                value={properties.variant}
              >
                <SelectTrigger id="textoutput-variant">
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="heading">Heading</SelectItem>
                  <SelectItem value="subheading">Subheading</SelectItem>
                  <SelectItem value="caption">Caption</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      default:
        return (
          <div className="py-2 text-sm text-gray-500">
            No editable properties available for this component type.
          </div>
        );
    }
  };

  return (
    <PopoverContent className="w-80" onPointerDownOutside={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Edit Properties</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {renderPropertyFields()}

      {renderNavigationControls()}

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </PopoverContent>
  );
};
