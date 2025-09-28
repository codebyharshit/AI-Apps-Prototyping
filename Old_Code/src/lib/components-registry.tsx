import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextOutput } from "@/components/ui/textoutput";
import { ImageUpload } from "@/components/ui/imageupload";
import { ComponentSize } from "./utils";

// Define the Component Registry type
export interface ComponentDefinition {
  type: string;
  label: string;
  category: string;
  icon?: React.ReactNode;
  defaultSize: ComponentSize;
  render: (props: any) => React.ReactNode;
}

// Create the registry of available components
export const componentsRegistry: ComponentDefinition[] = [
  {
    type: "Textarea",
    label: "Text Area",
    category: "Input",
    defaultSize: {
      width: 256,
      height: 80,
    },
    render: (props) => {
      return (
        <Textarea
          id={props.id || "text-area"}
          placeholder={props.placeholder || "Textarea component"}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          disabled={!props.isInteractive}
          rows={props.rows || 3}
          onChange={props.onChange}
          value={props.value}
        />
      );
    },
  },
  {
    type: "Button",
    label: "Button",
    category: "Input",
    defaultSize: {
      width: 80,
      height: 40,
    },
    render: (props) => {
      return (
        <Button
          id={props.id || "button"}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          onClick={!props.isInteractive ? (e) => e.preventDefault() : undefined}
          variant={props.variant || "default"}
        >
          {props.text || "Button"}
        </Button>
      );
    },
  },
  {
    type: "Input",
    label: "Text Input",
    category: "Input",
    defaultSize: {
      width: 256,
      height: 40,
    },
    render: (props) => {
      return (
        <Input
          id={props.id || "text-input"}
          placeholder={props.placeholder || "Text input"}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          disabled={!props.isInteractive}
          type={props.type || "text"}
          onChange={props.onChange}
          value={props.value}
        />
      );
    },
  },
  {
    type: "Checkbox",
    label: "Checkbox",
    category: "Input",
    defaultSize: {
      width: 192,
      height: 40,
    },
    render: (props) => {
      return (
        <div
          className={`flex items-center ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
        >
          <div className="inline-flex items-center justify-center h-5 w-5 mr-2">
            <Checkbox
              id={props.id || "checkbox"}
              className="h-4 w-4"
              disabled={!props.isInteractive}
              onCheckedChange={props.onChange}
              checked={props.value}
            />
          </div>
          <Label
            htmlFor={props.id || "checkbox"}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {props.label || "Checkbox label"}
          </Label>
        </div>
      );
    },
  },
  {
    type: "ImageUpload",
    label: "Image Upload",
    category: "Input",
    defaultSize: {
      width: 256,
      height: 192,
    },
    render: (props) => {
      return (
        <ImageUpload
          id={props.id || "image-upload"}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          isInteractive={props.isInteractive}
          value={props.value}
          onChange={props.onChange}
        />
      );
    },
  },
  // Text Output component in Output category
  {
    type: "TextOutput",
    label: "Text Output",
    category: "Output",
    defaultSize: {
      width: 256,
      height: 80,
    },
    render: (props) => {
      return (
        <TextOutput
          id={props.id || "text-output"}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          placeholder={props.placeholder || "Output text will appear here"}
          content={props.content}
          variant={props.variant || "default"}
          maxLines={props.maxLines}
        />
      );
    },
  },
];

// Helper function to get a component definition by type
export const getComponentDefinition = (
  type: string
): ComponentDefinition | undefined => {
  return componentsRegistry.find((component) => component.type === type);
};
