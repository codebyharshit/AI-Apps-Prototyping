"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextOutput } from "@/components/ui/textoutput";
import { MarkdownOutput } from "@/components/ui/markdownoutput";
import { ImageUpload } from "@/components/ui/imageupload";
import { DataTable } from "@/components/ui/datatable";
import { ComponentSize } from "./utils";
import { AIComponentRenderer } from "@/components/AIComponentRenderer";
import { InsuranceChat } from "@/components/ui/insurancechat";
import { InsuranceInsight } from "@/components/ui/insuranceinsight";
import { Icon } from "@/components/ui/icon";
import { Shape } from "@/components/ui/shape";
import { Alert } from "@/components/ui/alert";
import { Link } from "@/components/ui/link";
import { FileUploader } from "@/components/ui/fileuploader";
import { Searchbox } from "@/components/ui/searchbox";
import { Group } from "@/components/ui/group";
import { 
  AlertCircle, 
  Info, 
  Mail,
  Type,
  Square,
  Circle,
  Triangle,
  Diamond,
  Hexagon,
  Star,
  Edit3,
  MousePointer,
  FileText,
  CheckSquare,
  Upload,
  Download,
  Image,
  Database,
  Eye,
  Link2,
  Search,
  Archive,
  Users,
  CreditCard,
  Tag,
  AlertTriangle,
  ChevronDown,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  FileImage,
  Table,
  Bot,
  MessageSquare,
  Settings,
  Code,
  Palette,
  Box,
  Container,
  Layout,
  Layers,
  Frame,
  Folder,
  Package
} from "lucide-react";
import Chatbot from "@/components/ui/chatbot";
import PromptPlayground from "@/components/ui/promptplayground";
import InputVariantsPanel from "@/components/ui/inputvariantspanel";
import ResponseInspector from "@/components/ui/responseinspector";
import PersonaSwitcher from "@/components/ui/personaswitcher";
import CustomOutputRenderer from "@/components/ui/customoutputrenderer";
import { Card } from "@/components/ui/card";
import DebugComponent from "@/components/DebugComponent";
import { AIDropdownOutput } from "@/components/ui/ai-dropdown-output";

// Dropdown Component Renderer - Separate component to avoid hooks issues
const DropdownComponentRenderer: React.FC<any> = (props) => {
  // Extract properties from props (passed via spread operator from component.properties)
  const {
    placeholder = "Select an option...",
    options = "Option 1\nOption 2\nOption 3",
    selectedValue = "",
    backgroundColor = "#ffffff",
    borderColor = "#d1d5db",
    borderWidth = 1,
    borderRadius = 6,
    textColor = "#374151",
    fontSize = 14,
    fontWeight = "normal",
    padding = 12,
    opacity = 1,
    onChange,
  } = props;

  // Parse options from string (newline separated)
  const optionsList = options.split('\n').filter((opt: string) => opt.trim() !== '');
  const displayValue = selectedValue || placeholder;

  // State for dropdown open/close (only in interactive mode)
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleClick = () => {
    if (props.isInteractive) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (option: string) => {
    if (props.isInteractive && onChange) {
      onChange(option);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      id={props.id || "dropdown-component"}
      className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : "cursor-pointer"}`}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderRadius: `${borderRadius}px`,
        color: selectedValue ? textColor : "#9ca3af",
        fontSize: `${fontSize}px`,
        fontWeight,
        padding: `${padding}px`,
        opacity,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "visible",
        position: "relative",
        zIndex: isOpen ? 1000 : 1,
      }}
      onClick={handleClick}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {displayValue}
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        style={{ 
          marginLeft: "8px", 
          flexShrink: 0,
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease"
        }}
      >
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Dropdown options list (only show in interactive mode) */}
      {props.isInteractive && isOpen && optionsList.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            right: "0",
            backgroundColor: "#ffffff",
            border: `1px solid ${borderColor}`,
            borderRadius: `${borderRadius}px`,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1001,
          }}
        >
          {optionsList.map((option: string, index: number) => (
            <div
              key={index}
              style={{
                padding: `${Math.max(8, padding * 0.8)}px ${padding}px`,
                fontSize: `${fontSize}px`,
                color: textColor,
                cursor: "pointer",
                borderBottom: index < optionsList.length - 1 ? `1px solid #f3f4f6` : "none",
                backgroundColor: selectedValue === option ? "#f3f4f6" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = selectedValue === option ? "#f3f4f6" : "transparent";
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(option);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      
      {/* Show options count as a subtle indicator when in editor mode */}
      {!props.isInteractive && optionsList.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            fontSize: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          {optionsList.length}
        </div>
      )}
    </div>
  );
};

// Define the Component Registry type
export interface ComponentDefinition {
  type: string;
  label: string;
  category: string;
  icon?: React.ReactNode;
  defaultSize: ComponentSize;
  render: (props: any) => React.ReactNode;
}

// Create the registry of available components - organized by user-friendly categories
export const componentsRegistry: ComponentDefinition[] = [
  // === FORM CONTROLS === (Most commonly used interactive components)
  {
    type: "Button",
    label: "Button",
    category: "Form Controls",
    icon: <MousePointer className="h-4 w-4" />,
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
          {props.textContent || props.text || "Button"}
        </Button>
      );
    },
  },
  {
    type: "Input",
    label: "Text Input",
    category: "Form Controls",
    icon: <Edit3 className="h-4 w-4" />,
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
    type: "Textarea",
    label: "Text Area",
    category: "Form Controls",
    icon: <FileText className="h-4 w-4" />,
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
    type: "Checkbox",
    label: "Checkbox",
    category: "Form Controls",
    icon: <CheckSquare className="h-4 w-4" />,
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
    type: "Searchbox",
    label: "Search Box",
    category: "Form Controls",
    icon: <Search className="h-4 w-4" />,
    defaultSize: {
      width: 256,
      height: 40,
    },
    render: (props) => {
      return (
        <Searchbox
          id={props.id || "searchbox"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          placeholder={props.placeholder || "Search..."}
          iconPosition={props.iconPosition || "left"}
          clearable={props.clearable || true}
          disabled={!props.isInteractive}
          onSearch={props.onSearch}
          onChange={props.onChange}
          value={props.value}
        />
      );
    },
  },

  // === ADVANCED INPUTS === (More complex input components)
  {
    type: "DropdownComponent",
    label: "Dropdown",
    category: "Form Controls",
    icon: <ChevronDown className="h-4 w-4" />,
    defaultSize: {
      width: 200,
      height: 40,
    },
    render: (props) => {
      return <DropdownComponentRenderer {...props} />;
    },
  },
  {
    type: "ImageUpload",
    label: "Image Upload",
    category: "File & Media",
    icon: <Image className="h-4 w-4" />,
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
  {
    type: "FileUploader",
    label: "File Uploader",
    category: "File & Media",
    icon: <Upload className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 200,
    },
    render: (props) => {
      return (
        <FileUploader
          id={props.id || "file-uploader"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          multiple={props.multiple || false}
          accept={props.accept}
          maxSize={props.maxSize}
          dropzoneText={props.dropzoneText || "Drag and drop files here, or click to select files"}
          buttonText={props.buttonText || "Select Files"}
          showFileList={props.showFileList || true}
          disabled={!props.isInteractive}
          onChange={props.onChange}
          value={props.value}
        />
      );
    },
  },
  // === TEXT & TYPOGRAPHY === (Text display components)
  {
    type: "Heading1",
    label: "Heading 1",
    category: "Text & Content",
    icon: <Heading1 className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 48,
    },
    render: (props) => {
      // Calculate dynamic font size based on container height
      // Default height is 48px with text-4xl (36px), so scale proportionally
      const containerHeight = props.component?.size?.height || 48;
      const baseFontSize = 36; // text-4xl equivalent
      const baseHeight = 48;
      const dynamicFontSize = Math.max(12, (containerHeight / baseHeight) * baseFontSize);
      
      return (
        <h1
          id={props.id || "heading-1"}
          className={`font-bold ${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ 
            color: props.color || "#000",
            fontSize: `${dynamicFontSize}px`,
            lineHeight: '1.2',
            height: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {props.textContent || props.text || "Heading 1"}
        </h1>
      );
    },
  },
  {
    type: "Heading2",
    label: "Heading 2",
    category: "Text & Content",
    icon: <Heading2 className="h-4 w-4" />,
    defaultSize: {
      width: 280,
      height: 40,
    },
    render: (props) => {
      // Calculate dynamic font size based on container height
      // Default height is 40px with text-3xl (30px), so scale proportionally
      const containerHeight = props.component?.size?.height || 40;
      const baseFontSize = 30; // text-3xl equivalent
      const baseHeight = 40;
      const dynamicFontSize = Math.max(10, (containerHeight / baseHeight) * baseFontSize);
      
      return (
        <h2
          id={props.id || "heading-2"}
          className={`font-semibold ${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ 
            color: props.color || "#000",
            fontSize: `${dynamicFontSize}px`,
            lineHeight: '1.2',
            height: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {props.textContent || props.text || "Heading 2"}
        </h2>
      );
    },
  },
  {
    type: "Heading3",
    label: "Heading 3",
    category: "Text & Content",
    icon: <Heading3 className="h-4 w-4" />,
    defaultSize: {
      width: 260,
      height: 36,
    },
    render: (props) => {
      // Calculate dynamic font size based on container height
      const containerHeight = props.component?.size?.height || 36;
      const baseFontSize = 24; // text-2xl equivalent
      const baseHeight = 36;
      const dynamicFontSize = Math.max(10, (containerHeight / baseHeight) * baseFontSize);
      
      return (
        <h3
          id={props.id || "heading-3"}
          className={`font-semibold ${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ 
            color: props.color || "#000",
            fontSize: `${dynamicFontSize}px`,
            lineHeight: '1.2',
            height: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {props.textContent || props.text || "Heading 3"}
        </h3>
      );
    },
  },
  {
    type: "Heading4",
    label: "Heading 4",
    category: "Text & Content",
    icon: <Heading4 className="h-4 w-4" />,
    defaultSize: {
      width: 240,
      height: 32,
    },
    render: (props) => {
      // Calculate dynamic font size based on container height
      const containerHeight = props.component?.size?.height || 32;
      const baseFontSize = 20; // text-xl equivalent
      const baseHeight = 32;
      const dynamicFontSize = Math.max(10, (containerHeight / baseHeight) * baseFontSize);
      
      return (
        <h4
          id={props.id || "heading-4"}
          className={`font-medium ${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ 
            color: props.color || "#000",
            fontSize: `${dynamicFontSize}px`,
            lineHeight: '1.2',
            height: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {props.textContent || props.text || "Heading 4"}
        </h4>
      );
    },
  },
  {
    type: "Text",
    label: "Text",
    category: "Text & Content",
    icon: <Type className="h-4 w-4" />,
    defaultSize: {
      width: 200,
      height: 24,
    },
    render: (props) => {
      // Calculate dynamic font size based on container height
      // Default height is 24px with text-base (16px), so scale proportionally
      const containerHeight = props.component?.size?.height || 24;
      const baseFontSize = 16; // text-base equivalent
      const baseHeight = 24;
      const dynamicFontSize = Math.max(8, (containerHeight / baseHeight) * baseFontSize);
      
      // Debug log for text scaling
      if (props.component && (containerHeight !== baseHeight)) {
        console.log(`📏 Text component scaling:`, {
          componentId: props.component.id,
          containerHeight,
          baseHeight,
          baseFontSize,
          dynamicFontSize: Math.round(dynamicFontSize)
        });
      }
      
      return (
        <p
          id={props.id || "text"}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ 
            color: props.color || "#000",
            fontSize: `${dynamicFontSize}px`,
            lineHeight: '1.4',
            height: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {props.textContent || props.text || "Text content"}
        </p>
      );
    },
  },
  {
    type: "Paragraph",
    label: "Paragraph",
    category: "Text & Content",
    icon: <AlignLeft className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 80,
    },
    render: (props) => {
      // Calculate dynamic font size based on container height
      // Default height is 80px with text-base (16px), so scale proportionally
      const containerHeight = props.component?.size?.height || 80;
      const baseFontSize = 16; // text-base equivalent
      const baseHeight = 80;
      const dynamicFontSize = Math.max(8, (containerHeight / baseHeight) * baseFontSize);
      
      return (
        <p
          id={props.id || "paragraph"}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ 
            color: props.color || "#000",
            fontSize: `${dynamicFontSize}px`,
            lineHeight: '1.6',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {props.textContent || props.text || "This is a paragraph of text. You can use this component to add longer text content to your prototype. It supports multiple lines and proper text formatting."}
        </p>
      );
    },
  },
  {
    type: "Subtitle",
    label: "Subtitle",
    category: "Text & Content",
    icon: <Hash className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 28,
    },
    render: (props) => {
      return (
        <p
          id={props.id || "subtitle"}
          className={`text-lg text-gray-600 ${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ color: props.color || "#6b7280" }}
        >
          {props.textContent || props.text || "Subtitle text"}
        </p>
      );
    },
  },
  {
    type: "Caption",
    label: "Caption",
    category: "Text & Content",
    icon: <FileText className="h-4 w-4" />,
    defaultSize: {
      width: 200,
      height: 20,
    },
    render: (props) => {
      return (
        <p
          id={props.id || "caption"}
          className={`text-sm text-gray-500 ${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
          style={{ color: props.color || "#9ca3af" }}
        >
          {props.textContent || props.text || "Caption text"}
        </p>
      );
    },
  },
  // === OUTPUT & DISPLAY === (Components that show data/content)
  {
    type: "TextOutput",
    label: "Text Output",
    category: "Data Display",
    icon: <Eye className="h-4 w-4" />,
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
          enableMarkdown={props.enableMarkdown}
        />
      );
    },
  },
  {
    type: "MarkdownOutput",
    label: "Markdown Output",
    category: "Data Display",
    icon: <FileText className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 200,
    },
    render: (props) => {
      console.log(`🔍 MarkdownOutput Registry Debug:`, {
        id: props.id,
        content: props.content ? props.content.substring(0, 100) + '...' : 'NO CONTENT',
        contentLength: props.content?.length || 0,
        allProps: Object.keys(props)
      });
      
      return (
        <MarkdownOutput
          id={props.id || "markdown-output"}
          className={props.className || ""}
          placeholder={props.placeholder || "Markdown content will render here..."}
          content={props.content}
          variant={props.variant || "default"}
          maxLines={props.maxLines}
          enableMarkdown={true} // Always enable markdown
          enableCodeHighlight={true} // Always enable code highlighting
        />
      );
    },
  },
  {
    type: "DataTable",
    label: "Data Table",
    category: "Data Display",
    icon: <Table className="h-4 w-4" />,
    defaultSize: {
      width: 450,
      height: 300,
    },
    render: (props: any) => {
      return (
        <DataTable
          id={props.id}
          className={`${props.className || ""} ${
            !props.isInteractive ? "pointer-events-none cursor-default" : ""
          }`}
          data={props.data}
          onDataChange={props.onDataChange}
          isInteractive={props.isInteractive}
        />
      );
    },
  },
  {
    type: "Icon",
    label: "Icon",
    category: "Visual Elements",
    icon: <Palette className="h-4 w-4" />,
    defaultSize: {
      width: 40,
      height: 40,
    },
    render: (props) => {
      const LucideIcon = props.iconName ? require("lucide-react")[props.iconName] || Mail : Mail;
      return (
        <Icon
          id={props.id || "icon"}
          className={props.className || ""}
          icon={LucideIcon}
          size={props.size || 24}
          strokeWidth={props.strokeWidth || 2}
        />
      );
    },
  },
  // === SHAPES === (Basic geometric shapes)
  {
    type: "Rectangle",
    label: "Rectangle",
    category: "Shapes & Graphics",
    icon: <Square className="h-4 w-4" />,
    defaultSize: {
      width: 120,
      height: 80,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "rectangle"}
          className={props.className || ""}
          type="rectangle"
          variant={props.variant || "filled"}
          color={props.color || "bg-blue-200"}
          borderColor={props.borderColor || "border-blue-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  {
    type: "Square",
    label: "Square",
    category: "Shapes & Graphics",
    icon: <Square className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "square"}
          className={props.className || ""}
          type="square"
          variant={props.variant || "filled"}
          color={props.color || "bg-green-200"}
          borderColor={props.borderColor || "border-green-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  {
    type: "Circle",
    label: "Circle",
    category: "Shapes & Graphics",
    icon: <Circle className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "circle"}
          className={props.className || ""}
          type="circle"
          variant={props.variant || "filled"}
          color={props.color || "bg-purple-200"}
          borderColor={props.borderColor || "border-purple-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  {
    type: "Triangle",
    label: "Triangle",
    category: "Shapes & Graphics",
    icon: <Triangle className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "triangle"}
          className={props.className || ""}
          type="triangle"
          variant={props.variant || "filled"}
          color={props.color || "bg-red-200"}
          borderColor={props.borderColor || "border-red-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  {
    type: "Diamond",
    label: "Diamond",
    category: "Shapes & Graphics",
    icon: <Diamond className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "diamond"}
          className={props.className || ""}
          type="diamond"
          variant={props.variant || "filled"}
          color={props.color || "bg-yellow-200"}
          borderColor={props.borderColor || "border-yellow-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  {
    type: "Hexagon",
    label: "Hexagon",
    category: "Shapes & Graphics",
    icon: <Hexagon className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "hexagon"}
          className={props.className || ""}
          type="hexagon"
          variant={props.variant || "filled"}
          color={props.color || "bg-indigo-200"}
          borderColor={props.borderColor || "border-indigo-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  {
    type: "Star",
    label: "Star",
    category: "Shapes & Graphics",
    icon: <Star className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "star"}
          className={props.className || ""}
          type="star"
          variant={props.variant || "filled"}
          color={props.color || "bg-pink-200"}
          borderColor={props.borderColor || "border-pink-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  {
    type: "Ellipse",
    label: "Ellipse",
    category: "Shapes & Graphics",
    icon: <Circle className="h-4 w-4" />,
    defaultSize: {
      width: 140,
      height: 80,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "ellipse"}
          className={props.className || ""}
          type="ellipse"
          variant={props.variant || "filled"}
          color={props.color || "bg-teal-200"}
          borderColor={props.borderColor || "border-teal-300"}
          borderWidth={props.borderWidth || 1}
        />
      );
    },
  },
  // === SHAPE OUTLINES === (Outline versions of shapes)
  {
    type: "RectangleOutline",
    label: "Rectangle Outline",
    category: "Shapes & Graphics",
    icon: <Square className="h-4 w-4" />,
    defaultSize: {
      width: 120,
      height: 80,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "rectangle-outline"}
          className={props.className || ""}
          type="rectangle"
          variant="outline"
          color="bg-transparent"
          borderColor={props.borderColor || "border-blue-500"}
          borderWidth={props.borderWidth || 2}
        />
      );
    },
  },
  {
    type: "CircleOutline",
    label: "Circle Outline",
    category: "Shapes & Graphics",
    icon: <Circle className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "circle-outline"}
          className={props.className || ""}
          type="circle"
          variant="outline"
          color="bg-transparent"
          borderColor={props.borderColor || "border-purple-500"}
          borderWidth={props.borderWidth || 2}
        />
      );
    },
  },
  {
    type: "SquareOutline",
    label: "Square Outline",
    category: "Shapes & Graphics",
    icon: <Square className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 100,
    },
    render: (props) => {
      return (
        <Shape
          id={props.id || "square-outline"}
          className={props.className || ""}
          type="square"
          variant="outline"
          color="bg-transparent"
          borderColor={props.borderColor || "border-green-500"}
          borderWidth={props.borderWidth || 2}
        />
      );
    },
  },
  // === VISUAL ELEMENTS === (Alerts, links, etc.)
  {
    type: "Alert",
    label: "Alert",
    category: "Visual Elements",
    icon: <AlertCircle className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 80,
    },
    render: (props) => {
      // Support AI-generated content - check for content from AI responses
      const alertContent = props.content || props.textContent || props.children || "This is an alert message.";
      const alertTitle = props.title || (props.content ? "AI Response" : "Alert Title");
      
      return (
        <Alert
          id={props.id || "alert"}
          className={props.className || ""}
          variant={props.variant || "default"}
          title={alertTitle}
          icon={props.showIcon ? <AlertCircle className="h-4 w-4" /> : undefined}
        >
          {alertContent}
        </Alert>
      );
    },
  },
  {
    type: "Link",
    label: "Link",
    category: "Visual Elements",
    icon: <Link2 className="h-4 w-4" />,
    defaultSize: {
      width: 100,
      height: 40,
    },
    render: (props) => {
      return (
        <Link
          id={props.id || "link"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          variant={props.variant || "default"}
          size={props.size || "default"}
          href={props.href || "#"}
          target={props.target}
          asButton={props.asButton}
          onClick={!props.isInteractive ? (e) => e.preventDefault() : undefined}
        >
          {props.textContent || props.text || "Link Text"}
        </Link>
      );
    },
  },
  // === CONTAINERS === (Layout and grouping components)
  {
    type: "Group",
    label: "Group",
    category: "Layout & Containers",
    icon: <Folder className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 200,
    },
    render: (props) => {
      return (
        <Group
          id={props.id || "group"}
          className={props.className || ""}
          direction={props.direction || "row"}
          align={props.align || "start"}
          justify={props.justify || "start"}
          spacing={props.spacing || "md"}
          wrap={props.wrap || false}
          bordered={props.bordered || false}
        >
          {props.children || <div className="text-gray-400 text-sm p-4">Add components here</div>}
        </Group>
      );
    },
  },
  {
    type: "Card",
    label: "Card",
    category: "Layout & Containers",
    icon: <Package className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 200,
    },
    render: (props) => {
      return (
        <Card
          id={props.id || "card"}
          className={`${props.className || ""} p-4 ${
            !props.isInteractive ? "pointer-events-none" : ""
          }`}
        >
          <div className="space-y-2">
            {props.title && (
              <div className="text-lg font-semibold">{props.title}</div>
            )}
            {props.content && (
              <div className="text-sm text-gray-600">{props.content}</div>
            )}
          </div>
        </Card>
      );
    },
  },
  // === DEBUG & DEVELOPMENT === (Development tools)
  {
    type: "DebugComponent",
    label: "Debug Component",
    category: "Development Tools",
    icon: <Code className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 200,
    },
    render: (props) => <DebugComponent />,
  },
  // === AI SIMULATION === (AI-powered interactive components)
  {
    type: "Chatbot",
    label: "Chatbot",
    category: "AI Components",
    icon: <Bot className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 500,
    },
    render: (props) => <Chatbot {...props} />,
  },
  {
    type: "SimulationChatbot",
    label: "Simulation Chatbot",
    category: "AI Components",
    icon: <MessageSquare className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 500,
    },
    render: (props) => <Chatbot {...props} />,
  },
  // === AI TOOLS === (AI development and testing tools)
  {
    type: "PromptPlayground",
    label: "Prompt Playground",
    category: "AI Tools",
    icon: <Settings className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 400,
    },
    render: (props) => <PromptPlayground {...props} />,
  },
  {
    type: "InputVariantsPanel",
    label: "Input Variants Panel",
    category: "AI Tools",
    icon: <Layers className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 400,
    },
    render: (props) => <InputVariantsPanel {...props} />,
  },
  {
    type: "ResponseInspector",
    label: "Response Inspector",
    category: "AI Tools",
    icon: <Eye className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 400,
    },
    render: (props) => <ResponseInspector {...props} />,
  },
  {
    type: "PersonaSwitcher",
    label: "Persona/Style Switcher",
    category: "AI Tools",
    icon: <Users className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 400,
    },
    render: (props) => <PersonaSwitcher {...props} />,
  },
  {
    type: "CustomOutputRenderer",
    label: "Custom Output Renderer",
    category: "AI Tools",
    icon: <Frame className="h-4 w-4" />,
    defaultSize: {
      width: 400,
      height: 400,
    },
    render: (props) => <CustomOutputRenderer {...props} />,
  },
  
  // === COMPOSITE COMPONENTS === (Pre-built component combinations)
  {
    type: "TextBox",
    label: "Text Box",
    category: "Advanced Components",
    icon: <Box className="h-4 w-4" />,
    defaultSize: {
      width: 200,
      height: 60,
    },
    render: (props) => {
      // Extract properties from props (passed via spread operator from component.properties)
      const {
        textContent = "Text Box",
        backgroundColor = "#f3f4f6",
        borderColor = "#d1d5db",
        borderWidth = 1,
        borderRadius = 8,
        textColor = "#374151",
        fontSize = 16,
        fontWeight = "normal",
        textAlign = "center",
        padding = 16,
        opacity = 1,
      } = props;

      // Debug logging for composite components
      if (props.component?.type === "TextBox") {
        console.log(`🧩 TextBox render:`, {
          componentId: props.component.id,
          textContent,
          backgroundColor,
          allProps: Object.keys(props),
          componentProperties: props.component.properties
        });
      }

      return (
        <div
          id={props.id || "text-box"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          style={{
            backgroundColor,
            borderColor,
            borderWidth: `${borderWidth}px`,
            borderStyle: "solid",
            borderRadius: `${borderRadius}px`,
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: textAlign as "left" | "center" | "right",
            padding: `${padding}px`,
            opacity,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {textContent}
        </div>
      );
    },
  },
  {
    type: "ButtonComponent",
    label: "Button Component",
    category: "Advanced Components", 
    icon: <MousePointer className="h-4 w-4" />,
    defaultSize: {
      width: 120,
      height: 40,
    },
    render: (props) => {
      // Extract properties from props (passed via spread operator from component.properties)
      const {
        textContent = "Button",
        backgroundColor = "#3b82f6",
        borderColor = "#2563eb",
        borderWidth = 1,
        borderRadius = 6,
        textColor = "#ffffff",
        fontSize = 14,
        fontWeight = "500",
        textAlign = "center",
        padding = 12,
        opacity = 1,
      } = props;

      return (
        <div
          id={props.id || "button-component"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : "cursor-pointer hover:opacity-90 transition-opacity"}`}
          style={{
            backgroundColor,
            borderColor,
            borderWidth: `${borderWidth}px`,
            borderStyle: "solid",
            borderRadius: `${borderRadius}px`,
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: textAlign as "left" | "center" | "right",
            padding: `${padding}px`,
            opacity,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {textContent}
        </div>
      );
    },
  },
  {
    type: "CardComponent",
    label: "Card Component",
    category: "Advanced Components",
    icon: <CreditCard className="h-4 w-4" />,
    defaultSize: {
      width: 280,
      height: 160,
    },
    render: (props) => {
      // Extract properties from props (passed via spread operator from component.properties)
      const {
        textContent = "Card Title\n\nCard content goes here. You can edit this text and adjust the card size.",
        backgroundColor = "#ffffff",
        borderColor = "#e5e7eb",
        borderWidth = 1,
        borderRadius = 12,
        textColor = "#374151",
        fontSize = 14,
        fontWeight = "normal",
        textAlign = "left",
        padding = 20,
        opacity = 1,
      } = props;

      return (
        <div
          id={props.id || "card-component"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          style={{
            backgroundColor,
            borderColor,
            borderWidth: `${borderWidth}px`,
            borderStyle: "solid",
            borderRadius: `${borderRadius}px`,
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: textAlign as "left" | "center" | "right",
            padding: `${padding}px`,
            opacity,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            boxSizing: "border-box",
            overflow: "hidden",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
            {textContent}
          </div>
        </div>
      );
    },
  },
  {
    type: "LabelComponent",
    label: "Label Component",
    category: "Advanced Components",
    icon: <Tag className="h-4 w-4" />,
    defaultSize: {
      width: 150,
      height: 32,
    },
    render: (props) => {
      // Extract properties from props (passed via spread operator from component.properties)
      const {
        textContent = "Label Text",
        backgroundColor = "#ffffff",
        borderColor = "#d1d5db",
        borderWidth = 1,
        borderRadius = 6,
        textColor = "#374151",
        fontSize = 14,
        fontWeight = "500",
        textAlign = "left",
        padding = 8,
        opacity = 1,
      } = props;

      return (
        <div
          id={props.id || "label-component"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          style={{
            backgroundColor,
            borderColor,
            borderWidth: `${borderWidth}px`,
            borderStyle: "solid",
            borderRadius: `${borderRadius}px`,
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: textAlign as "left" | "center" | "right",
            padding: `${padding}px`,
            opacity,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {textContent}
        </div>
      );
    },
  },
  {
    type: "TagComponent", 
    label: "Tag Component",
    category: "Advanced Components",
    icon: <Hash className="h-4 w-4" />,
    defaultSize: {
      width: 80,
      height: 28,
    },
    render: (props) => {
      // Extract properties from props (passed via spread operator from component.properties)
      const {
        textContent = "Tag",
        backgroundColor = "#f3f4f6",
        borderColor = "#d1d5db",
        borderWidth = 1,
        borderRadius = 20,
        textColor = "#374151",
        fontSize = 12,
        fontWeight = "500",
        textAlign = "center",
        padding = 6,
        opacity = 1,
      } = props;

      return (
        <div
          id={props.id || "tag-component"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          style={{
            backgroundColor,
            borderColor,
            borderWidth: `${borderWidth}px`,
            borderStyle: "solid",
            borderRadius: `${borderRadius}px`,
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: textAlign as "left" | "center" | "right",
            padding: `${padding}px`,
            opacity,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {textContent}
        </div>
      );
    },
  },
  {
    type: "AlertBox",
    label: "Alert Box", 
    category: "Advanced Components",
    icon: <AlertTriangle className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 80,
    },
    render: (props) => {
      // Extract properties from props (passed via spread operator from component.properties)
      const {
        textContent = "⚠️ Alert Message\n\nThis is an important message.",
        backgroundColor = "#fef3c7",
        borderColor = "#f59e0b",
        borderWidth = 2,
        borderRadius = 8,
        textColor = "#92400e",
        fontSize = 14,
        fontWeight = "normal",
        textAlign = "left",
        padding = 16,
        opacity = 1,
      } = props;

      return (
        <div
          id={props.id || "alert-box"}
          className={`${props.className || ""} ${!props.isInteractive ? "pointer-events-none" : ""}`}
          style={{
            backgroundColor,
            borderColor,
            borderWidth: `${borderWidth}px`,
            borderStyle: "solid",
            borderRadius: `${borderRadius}px`,
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: textAlign as "left" | "center" | "right",
            padding: `${padding}px`,
            opacity,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
            {textContent}
          </div>
        </div>
      );
    },
  },
];

// Hidden AI component definitions (not shown in sidebar but used by the app)
const aiComponentsRegistry: ComponentDefinition[] = [
  // AI Input component
  {
    type: "AIInput",
    label: "AI Input",
    category: "AI Components",
    defaultSize: {
      width: 300,
      height: 200,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
  // AI Output component
  {
    type: "AIOutput",
    label: "AI Output",
    category: "AI Components",
    defaultSize: {
      width: 300,
      height: 200,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
  // AI Form component
  {
    type: "AIForm",
    label: "AI Form",
    category: "AI Components",
    defaultSize: {
      width: 400,
      height: 300,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
  // AI Container component
  {
    type: "AIContainer",
    label: "AI Container",
    category: "AI Components",
    defaultSize: {
      width: 400,
      height: 300,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
  // AI Display component
  {
    type: "AIDisplay",
    label: "AI Display",
    category: "AI Components",
    defaultSize: {
      width: 300,
      height: 200,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
  // AI UI Component (for HTML-to-React conversions)
  {
    type: "AIUIComponent",
    label: "AI UI Component",
    category: "AI Components",
    defaultSize: {
      width: 400,
      height: 300,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
  // AI Dropdown Output component
  {
    type: "AIDropdownOutput",
    label: "AI Dropdown Output",
    category: "AI Components",
    icon: <ChevronDown className="h-4 w-4" />,
    defaultSize: {
      width: 200,
      height: 40,
    },
    render: (props) => {
      return (
        <AIDropdownOutput
          id={props.id}
          className={props.className}
          placeholder={props.placeholder || "AI will populate options..."}
          selectedValue={props.selectedValue || props.value}
          onChange={props.onChange}
          isInteractive={props.isInteractive}
          backgroundColor={props.backgroundColor}
          borderColor={props.borderColor}
          borderWidth={props.borderWidth}
          borderRadius={props.borderRadius}
          textColor={props.textColor}
          fontSize={props.fontSize}
          fontWeight={props.fontWeight}
          padding={props.padding}
          opacity={props.opacity}
          content={props.content}
          loading={props.loading}
          loadingText={props.loadingText}
          emptyStateText={props.emptyStateText}
          {...props}
        />
      );
    },
  },
  // AI Alert component - specifically designed for AI outputs
  {
    type: "AIAlert",
    label: "AI Alert",
    category: "AI Components",
    icon: <AlertCircle className="h-4 w-4" />,
    defaultSize: {
      width: 300,
      height: 80,
    },
    render: (props) => {
      // Enhanced AI content handling with automatic variant selection
      const alertContent = props.content || props.textContent || props.children || "...";
      
      // Auto-detect alert variant based on AI response content
      let variant = props.variant || "default";
      const contentLower = alertContent.toLowerCase();
      if (contentLower.includes("error") || contentLower.includes("failed") || 
          contentLower.includes("not found") || contentLower.includes("couldn't find")) {
        variant = "destructive";
      } else if (contentLower.includes("success") || contentLower.includes("completed") || 
                 contentLower.includes("found") || contentLower.includes("verified")) {
        variant = "success";
      } else if (contentLower.includes("warning") || contentLower.includes("caution") || 
                 contentLower.includes("please verify")) {
        variant = "warning";
      } else if (contentLower.includes("info") || contentLower.includes("note") || 
                 contentLower.includes("please")) {
        variant = "info";
      }
      
      return (
        <Alert
          id={props.id || "ai-alert"}
          className={`${props.className || ""} ai-output-component`}
          variant={variant}
          title={props.title || "AI Response"}
          icon={<AlertCircle className="h-4 w-4" />}
        >
          {alertContent}
        </Alert>
      );
    },
  },
];

// Insurance specific components
const insuranceComponentsRegistry: ComponentDefinition[] = [
  {
    type: "InsuranceChat",
    label: "Insurance Chat",
    category: "Advanced Components",
    defaultSize: {
      width: 300,
      height: 400,
    },
    render: (props) => {
      return (
        <InsuranceChat
          id={props.id || "insurance-chat"}
          className={props.className}
          isInteractive={props.isInteractive}
          initialMessage="Hello! I'm your Insurance Assistant. How can I help you today?"
        />
      );
    },
  },
  {
    type: "InsuranceInsight",
    label: "Insurance Insight",
    category: "Advanced Components",
    defaultSize: {
      width: 400,
      height: 500,
    },
    render: (props) => {
      return (
        <InsuranceInsight
          id={props.id || "insurance-insight"}
          className={props.className}
          isInteractive={props.isInteractive}
        />
      );
    },
  },
  {
    type: "InsuranceInput",
    label: "Insurance Input",
    category: "Advanced Components",
    defaultSize: {
      width: 300,
      height: 50,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
  {
    type: "InsuranceSendButton",
    label: "Insurance Send Button",
    category: "Form Controls",
    defaultSize: {
      width: 80,
      height: 40,
    },
    render: (props) => {
      return <AIComponentRenderer component={props.component} {...props} />;
    },
  },
];

// Helper function to get a component definition by type
export const getComponentDefinition = (
  type: string
): ComponentDefinition | undefined => {
  // First check for exact match in standard registry
  const exactMatch = componentsRegistry.find((component) => component.type === type);
  if (exactMatch) return exactMatch;

  // Then check in the AI components registry
  const aiMatch = aiComponentsRegistry.find((component) => component.type === type);
  if (aiMatch) return aiMatch;
  
  // Then check in the insurance components registry
  const insuranceMatch = insuranceComponentsRegistry.find((component) => component.type === type);
  if (insuranceMatch) return insuranceMatch;

  // If no exact match, try to match AI prefixed components with their base definitions
  if (type.startsWith("AI")) {
    // First try exact match in AI registry
    const aiExactMatch = aiComponentsRegistry.find(
      (component) => component.type === type
    );
    if (aiExactMatch) return aiExactMatch;
    
    // Then try to match with base definitions
    const aiType = type.replace(/^AI/, "");
    const aiComponentDef = aiComponentsRegistry.find(
      (component) => component.type === `AI${aiType}`
    );
    if (aiComponentDef) return aiComponentDef;
    
    // If still no match, create a generic AI component definition
    return {
      type: type,
      label: type,
      category: "AI Components",
      defaultSize: {
        width: 400,
        height: 300,
      },
      render: (props) => {
        return <AIComponentRenderer component={props.component} {...props} />;
      },
    };
  }

  return undefined;
};

// Export all component registries
export { aiComponentsRegistry, insuranceComponentsRegistry };

// Create a combined registry for the component picker
export const getAllComponents = (): ComponentDefinition[] => {
  return [
    ...componentsRegistry,
    ...aiComponentsRegistry,
    ...insuranceComponentsRegistry
  ];
};
