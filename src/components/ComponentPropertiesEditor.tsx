"use client";

import React from "react";
import { PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ComponentData, FrameData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Ban, Loader2, UploadCloud } from "lucide-react";
import { TableData } from "@/components/ui/datatable";
import Papa from "papaparse";

interface ComponentPropertiesEditorProps {
  component: ComponentData;
  frames: FrameData[];
  onUpdateProperties: (id: string, properties: Record<string, any>) => void;
  onClose: () => void;
  onHoverFrame: (id: string | null) => void;
}

// Maximum number of CSV rows to process at once
const CSV_CHUNK_SIZE = 500;

// Helper functions for color conversion
const convertTailwindToHex = (tailwindColor?: string): string => {
  if (!tailwindColor) return "#000000";
  
  // If it's already a hex color, return it as-is
  if (tailwindColor.startsWith('#')) {
    return tailwindColor;
  }
  
  const colorMap: Record<string, string> = {
    // Background colors
    'bg-red-200': '#fecaca', 'bg-red-300': '#fca5a5', 'bg-red-400': '#f87171', 'bg-red-500': '#ef4444',
    'bg-blue-200': '#bfdbfe', 'bg-blue-300': '#93c5fd', 'bg-blue-400': '#60a5fa', 'bg-blue-500': '#3b82f6',
    'bg-green-200': '#bbf7d0', 'bg-green-300': '#86efac', 'bg-green-400': '#4ade80', 'bg-green-500': '#22c55e',
    'bg-yellow-200': '#fef08a', 'bg-yellow-300': '#fde047', 'bg-yellow-400': '#facc15', 'bg-yellow-500': '#eab308',
    'bg-purple-200': '#e9d5ff', 'bg-purple-300': '#d8b4fe', 'bg-purple-400': '#c084fc', 'bg-purple-500': '#a855f7',
    'bg-pink-200': '#fbcfe8', 'bg-pink-300': '#f9a8d4', 'bg-pink-400': '#f472b6', 'bg-pink-500': '#ec4899',
    'bg-orange-200': '#fed7aa', 'bg-orange-300': '#fdba74', 'bg-orange-400': '#fb923c', 'bg-orange-500': '#f97316',
    'bg-indigo-200': '#c7d2fe', 'bg-indigo-300': '#a5b4fc', 'bg-indigo-400': '#818cf8', 'bg-indigo-500': '#6366f1',
    'bg-gray-200': '#e5e7eb', 'bg-gray-300': '#d1d5db', 'bg-gray-400': '#9ca3af', 'bg-gray-500': '#6b7280',
    'bg-black': '#000000', 'bg-white': '#ffffff',
    
    // Border colors
    'border-red-200': '#fecaca', 'border-red-300': '#fca5a5', 'border-red-400': '#f87171', 'border-red-500': '#ef4444',
    'border-blue-200': '#bfdbfe', 'border-blue-300': '#93c5fd', 'border-blue-400': '#60a5fa', 'border-blue-500': '#3b82f6',
    'border-green-200': '#bbf7d0', 'border-green-300': '#86efac', 'border-green-400': '#4ade80', 'border-green-500': '#22c55e',
    'border-yellow-200': '#fef08a', 'border-yellow-300': '#fde047', 'border-yellow-400': '#facc15', 'border-yellow-500': '#eab308',
    'border-purple-200': '#e9d5ff', 'border-purple-300': '#d8b4fe', 'border-purple-400': '#c084fc', 'border-purple-500': '#a855f7',
    'border-pink-200': '#fbcfe8', 'border-pink-300': '#f9a8d4', 'border-pink-400': '#f472b6', 'border-pink-500': '#ec4899',
    'border-orange-200': '#fed7aa', 'border-orange-300': '#fdba74', 'border-orange-400': '#fb923c', 'border-orange-500': '#f97316',
    'border-indigo-200': '#c7d2fe', 'border-indigo-300': '#a5b4fc', 'border-indigo-400': '#818cf8', 'border-indigo-500': '#6366f1',
    'border-gray-200': '#e5e7eb', 'border-gray-300': '#d1d5db', 'border-gray-400': '#9ca3af', 'border-gray-500': '#6b7280',
    'border-black': '#000000', 'border-white': '#ffffff',
  };
  
  return colorMap[tailwindColor] || "#000000";
};

const convertHexToTailwind = (hex: string, prefix: string = "bg"): string => {
  const colorMap: Record<string, string> = {
    '#fecaca': `${prefix}-red-200`, '#fca5a5': `${prefix}-red-300`, '#f87171': `${prefix}-red-400`, '#ef4444': `${prefix}-red-500`,
    '#bfdbfe': `${prefix}-blue-200`, '#93c5fd': `${prefix}-blue-300`, '#60a5fa': `${prefix}-blue-400`, '#3b82f6': `${prefix}-blue-500`,
    '#bbf7d0': `${prefix}-green-200`, '#86efac': `${prefix}-green-300`, '#4ade80': `${prefix}-green-400`, '#22c55e': `${prefix}-green-500`,
    '#fef08a': `${prefix}-yellow-200`, '#fde047': `${prefix}-yellow-300`, '#facc15': `${prefix}-yellow-400`, '#eab308': `${prefix}-yellow-500`,
    '#e9d5ff': `${prefix}-purple-200`, '#d8b4fe': `${prefix}-purple-300`, '#c084fc': `${prefix}-purple-400`, '#a855f7': `${prefix}-purple-500`,
    '#fbcfe8': `${prefix}-pink-200`, '#f9a8d4': `${prefix}-pink-300`, '#f472b6': `${prefix}-pink-400`, '#ec4899': `${prefix}-pink-500`,
    '#fed7aa': `${prefix}-orange-200`, '#fdba74': `${prefix}-orange-300`, '#fb923c': `${prefix}-orange-400`, '#f97316': `${prefix}-orange-500`,
    '#c7d2fe': `${prefix}-indigo-200`, '#a5b4fc': `${prefix}-indigo-300`, '#818cf8': `${prefix}-indigo-400`, '#6366f1': `${prefix}-indigo-500`,
    '#e5e7eb': `${prefix}-gray-200`, '#d1d5db': `${prefix}-gray-300`, '#9ca3af': `${prefix}-gray-400`, '#6b7280': `${prefix}-gray-500`,
    '#000000': `${prefix}-black`, '#ffffff': `${prefix}-white`,
  };
  
  // If exact match found, return it
  const exactMatch = colorMap[hex.toLowerCase()];
  if (exactMatch) {
    return exactMatch;
  }
  
  // For custom colors, return the hex value directly instead of forcing gray
  // This allows custom colors to work properly
  return hex;
};

const getDefaultShapeColor = (shapeType: string): string => {
  const defaults: Record<string, string> = {
    'Rectangle': 'bg-blue-200',
    'Square': 'bg-green-200', 
    'Circle': 'bg-purple-200',
    'Triangle': 'bg-red-200',
    'Diamond': 'bg-yellow-200',
    'Hexagon': 'bg-orange-200',
    'Star': 'bg-pink-200',
    'Ellipse': 'bg-indigo-200',
  };
  return defaults[shapeType] || 'bg-gray-200';
};

const getDefaultShapeBorderColor = (shapeType: string): string => {
  const defaults: Record<string, string> = {
    'Rectangle': 'border-blue-300',
    'Square': 'border-green-300',
    'Circle': 'border-purple-300', 
    'Triangle': 'border-red-300',
    'Diamond': 'border-yellow-300',
    'Hexagon': 'border-orange-300',
    'Star': 'border-pink-300',
    'Ellipse': 'border-indigo-300',
  };
  return defaults[shapeType] || 'border-gray-300';
};

export const ComponentPropertiesEditor: React.FC<
  ComponentPropertiesEditorProps
> = ({ component, frames, onUpdateProperties, onClose, onHoverFrame }) => {
  // Get initial properties or use an empty object with default values
  const initialProperties = component.properties || {};

  // Create state for all editable properties
  const [properties, setProperties] =
    React.useState<Record<string, any>>(initialProperties);
  const [isProcessingCsv, setIsProcessingCsv] = React.useState(false);
  const [csvStats, setCsvStats] = React.useState<{
    totalRows: number;
    totalColumns: number;
  } | null>(null);

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

  const processCsvChunks = (
    results: Papa.ParseResult<string[]>,
    file: File,
    chunkSize: number = CSV_CHUNK_SIZE
  ) => {
    return new Promise<TableData | null>((resolve, reject) => {
      // Check for errors
      if (results.errors.length > 0) {
        console.error("PapaParse errors:", results.errors);
        const errorMessages = results.errors
          .map((err) => `${err.message} (Row: ${err.row})`)
          .join("\n");
        alert(
          `Failed to parse CSV file. Please ensure it's correctly formatted.\n${errorMessages}`
        );
        resolve(null);
        return;
      }

      const data: string[][] = results.data;

      if (!data || data.length === 0) {
        resolve(null);
        return;
      }

      // Extract and process headers
      const rawHeaders = data[0];
      if (!rawHeaders || (rawHeaders.length === 0 && data.length === 1)) {
        resolve(null);
        return;
      }

      const headers = rawHeaders.map((h, index) => {
        const headerText = (h || "").toString().trim();
        // Ensure unique headers by adding index if duplicate
        return headerText || `Column ${index + 1}`;
      });

      // Check for duplicate headers and make them unique
      const uniqueHeaders = headers.map((header, index) => {
        const duplicateCount = headers.slice(0, index).filter(h => h === header).length;
        return duplicateCount > 0 ? `${header} (${duplicateCount + 1})` : header;
      });

      const allHeadersEmpty = uniqueHeaders.every((h) => h.startsWith("Column "));

      if (allHeadersEmpty && data.length <= 1) {
        resolve(null);
        return;
      }

      // Process rows in chunks
      const rowData = data.slice(1);
      const totalRows = rowData.length;
      const processedRows: string[][] = [];
      const totalChunks = Math.ceil(totalRows / chunkSize);

      // Set stats for display
      setCsvStats({
        totalRows,
        totalColumns: uniqueHeaders.length,
      });

      // Process the first chunk immediately
      const firstChunkEnd = Math.min(chunkSize, totalRows);
      processRowChunk(0, firstChunkEnd);

      function processRowChunk(start: number, end: number) {
        const chunk = rowData.slice(start, end);

        // Process this chunk
        const processedChunk = chunk.map((rowArray) => {
          const newRow = Array(uniqueHeaders.length).fill("");
          for (let i = 0; i < uniqueHeaders.length; i++) {
            if (rowArray[i] !== undefined && rowArray[i] !== null) {
              newRow[i] = String(rowArray[i]).trim();
            }
          }
          return newRow;
        });

        // Add to processed rows
        processedRows.push(...processedChunk);

        // If we're done, resolve with the result
        if (end >= totalRows) {
          resolve({ headers: uniqueHeaders, rows: processedRows });
          return;
        }

        // Process next chunk with a small delay to avoid UI freezing
        const nextEnd = Math.min(end + chunkSize, totalRows);
        setTimeout(() => processRowChunk(end, nextEnd), 0);
      }
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Basic MIME type check
    if (
      !file.type.includes("csv") &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      alert("Please upload a valid .csv file.");
      event.target.value = ""; // Reset file input
      return;
    }

    // Start loading indicator
    setIsProcessingCsv(true);
    setCsvStats(null);

    // Use worker-thread approach for larger files
    const workerEnabled = file.size > 1024 * 1024; // 1MB threshold

    if (workerEnabled) {
      Papa.parse<string[]>(file, {
        worker: true, // Use worker thread
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const tableData = await processCsvChunks(results, file);
            handleChange("data", tableData);
          } catch (error) {
            console.error("Error processing CSV:", error);
            alert("An error occurred while processing the CSV file.");
            handleChange("data", null);
          } finally {
            setIsProcessingCsv(false);
            event.target.value = ""; // Reset file input
          }
        },
        error: (error) => {
          console.error("PapaParse critical error:", error);
          alert(
            "A critical error occurred while trying to read or parse the CSV file."
          );
          handleChange("data", null);
          setIsProcessingCsv(false);
          event.target.value = "";
        },
      });
    } else {
      // For smaller files, use the regular approach
      Papa.parse<string[]>(file, {
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const tableData = await processCsvChunks(results, file);
            handleChange("data", tableData);
          } catch (error) {
            console.error("Error processing CSV:", error);
            alert("An error occurred while processing the CSV file.");
            handleChange("data", null);
          } finally {
            setIsProcessingCsv(false);
            event.target.value = ""; // Reset file input
          }
        },
        error: (error) => {
          console.error("PapaParse critical error:", error);
          alert(
            "A critical error occurred while trying to read or parse the CSV file."
          );
          handleChange("data", null);
          setIsProcessingCsv(false);
          event.target.value = "";
        },
      });
    }
  };

  const handleClearCsvData = () => {
    handleChange("data", null);
    setCsvStats(null);
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
              defaultValue="none"
            >
              <SelectTrigger id="navigate-to">
                <SelectValue placeholder="Select a frame to navigate to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="cursor-pointer hover:bg-blue-50">
                  <div className="flex items-center">
                    <Ban className="h-4 w-4 mr-2" />
                    None
                  </div>
                </SelectItem>
                {frames.filter(frame => frame.id && frame.id.trim() !== "").map((frame) => (
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

  const renderTablePropertyFields = () => {
    const tableData = properties.data as TableData | null;

    return (
      <>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="table-csv-upload">Upload CSV File</Label>
          <Input
            id="table-csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessingCsv}
            className="block w-full text-sm text-slate-500 cursor-pointer
              file:mr-3 file:py-1.5 file:px-3
              file:rounded-md file:border-0
              file:text-xs file:font-medium
              file:bg-slate-100 file:text-slate-700
              hover:file:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
          />

          {isProcessingCsv && (
            <div className="mt-2 text-xs text-blue-600 p-2 border rounded-md bg-blue-50 flex items-center">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              <span>Processing CSV data...</span>
            </div>
          )}

          {!isProcessingCsv && tableData && tableData.headers.length > 0 && (
            <div className="mt-2 text-xs text-gray-600 p-2 border rounded-md bg-gray-50">
              <p className="font-semibold">
                Loaded: {tableData.headers.length} columns,{" "}
                {csvStats?.totalRows || tableData.rows.length} rows.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCsvData}
                className="mt-1 text-red-600 hover:text-red-700 px-1 py-0 h-auto hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Data
              </Button>
            </div>
          )}

          {!isProcessingCsv &&
            (!tableData || tableData.headers.length === 0) && (
              <div className="mt-2 text-xs text-gray-500 p-3 border border-dashed rounded-md flex items-center justify-center">
                <UploadCloud className="h-4 w-4 mr-2 text-gray-400" />
                <span>No CSV data loaded.</span>
              </div>
            )}
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
                value={properties.variant || "default"}
                defaultValue="default"
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
                value={properties.type || "text"}
                defaultValue="text"
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
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="checkbox-label">Label</Label>
              <Input
                id="checkbox-label"
                value={properties.label || "Checkbox label"}
                onChange={(e) => handleChange("label", e.target.value)}
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="checkbox-checked">Default State</Label>
              <Select
                onValueChange={(value) => handleChange("value", value === "true")}
                value={properties.value !== undefined ? properties.value.toString() : "false"}
                defaultValue="false"
              >
                <SelectTrigger id="checkbox-checked">
                  <SelectValue placeholder="Select default state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Unchecked</SelectItem>
                  <SelectItem value="true">Checked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
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
                value={properties.variant || "default"}
                defaultValue="default"
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
      case "TextBox":
      case "ButtonComponent":
      case "CardComponent":
      case "LabelComponent":
      case "TagComponent":
      case "AlertBox":
      case "DropdownComponent":
        return (
          <>
            {component.type === "DropdownComponent" ? (
              <>
                <div className="grid gap-2 mb-4">
                  <Label htmlFor="dropdown-placeholder">Placeholder Text</Label>
                  <Input
                    id="dropdown-placeholder"
                    value={properties.placeholder || ""}
                    onChange={(e) => handleChange("placeholder", e.target.value)}
                    placeholder="Select an option..."
                  />
                </div>
                <div className="grid gap-2 mb-4">
                  <Label htmlFor="dropdown-options">Options (one per line)</Label>
                  <Textarea
                    id="dropdown-options"
                    value={properties.options || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("options", e.target.value)}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2 mb-4">
                  <Label htmlFor="dropdown-selected">Selected Value</Label>
                  <Input
                    id="dropdown-selected"
                    value={properties.selectedValue || ""}
                    onChange={(e) => handleChange("selectedValue", e.target.value)}
                    placeholder="Leave empty for no selection"
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2 mb-4">
                <Label htmlFor="text-content">Text Content</Label>
                <Textarea
                  id="text-content"
                  value={properties.textContent || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("textContent", e.target.value)}
                  placeholder="Enter text content..."
                  rows={component.type === "CardComponent" || component.type === "AlertBox" ? 4 : 2}
                />
              </div>
            )}
            <div className="grid gap-2 mb-4">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={properties.backgroundColor || "#f3f4f6"}
                  onChange={(e) => handleChange("backgroundColor", e.target.value)}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Select
                  onValueChange={(value) => handleChange("backgroundColor", value)}
                  value={properties.backgroundColor?.startsWith('#') ? 'custom' : (properties.backgroundColor || "#f3f4f6")}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select background color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#ffffff">White</SelectItem>
                    <SelectItem value="#f3f4f6">Light Gray</SelectItem>
                    <SelectItem value="#3b82f6">Blue</SelectItem>
                    <SelectItem value="#10b981">Green</SelectItem>
                    <SelectItem value="#f59e0b">Yellow</SelectItem>
                    <SelectItem value="#ef4444">Red</SelectItem>
                    <SelectItem value="#8b5cf6">Purple</SelectItem>
                    <SelectItem value="#ec4899">Pink</SelectItem>
                    {properties.backgroundColor?.startsWith('#') && (
                      <SelectItem value="custom">Custom ({properties.backgroundColor})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={properties.textColor || "#374151"}
                  onChange={(e) => handleChange("textColor", e.target.value)}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Select
                  onValueChange={(value) => handleChange("textColor", value)}
                  value={properties.textColor?.startsWith('#') ? 'custom' : (properties.textColor || "#374151")}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select text color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#000000">Black</SelectItem>
                    <SelectItem value="#374151">Dark Gray</SelectItem>
                    <SelectItem value="#6b7280">Gray</SelectItem>
                    <SelectItem value="#ffffff">White</SelectItem>
                    <SelectItem value="#3b82f6">Blue</SelectItem>
                    <SelectItem value="#10b981">Green</SelectItem>
                    <SelectItem value="#ef4444">Red</SelectItem>
                    {properties.textColor?.startsWith('#') && (
                      <SelectItem value="custom">Custom ({properties.textColor})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="border-color">Border Color</Label>
              <div className="flex gap-2">
                <Input
                  id="border-color"
                  type="color"
                  value={properties.borderColor || "#d1d5db"}
                  onChange={(e) => handleChange("borderColor", e.target.value)}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Select
                  onValueChange={(value) => handleChange("borderColor", value)}
                  value={properties.borderColor?.startsWith('#') ? 'custom' : (properties.borderColor || "#d1d5db")}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select border color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#d1d5db">Light Gray</SelectItem>
                    <SelectItem value="#6b7280">Gray</SelectItem>
                    <SelectItem value="#374151">Dark Gray</SelectItem>
                    <SelectItem value="#3b82f6">Blue</SelectItem>
                    <SelectItem value="#10b981">Green</SelectItem>
                    <SelectItem value="#ef4444">Red</SelectItem>
                    {properties.borderColor?.startsWith('#') && (
                      <SelectItem value="custom">Custom ({properties.borderColor})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="border-width">Border Width</Label>
                <Input
                  id="border-width"
                  type="number"
                  value={properties.borderWidth || 1}
                  onChange={(e) => handleChange("borderWidth", parseInt(e.target.value, 10) || 1)}
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="border-radius">Border Radius</Label>
                <Input
                  id="border-radius"
                  type="number"
                  value={properties.borderRadius || 8}
                  onChange={(e) => handleChange("borderRadius", parseInt(e.target.value, 10) || 0)}
                  min="0"
                  max="50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Input
                  id="font-size"
                  type="number"
                  value={properties.fontSize || 16}
                  onChange={(e) => handleChange("fontSize", parseInt(e.target.value, 10) || 16)}
                  min="8"
                  max="48"
                />
              </div>
              <div>
                <Label htmlFor="padding">Padding</Label>
                <Input
                  id="padding"
                  type="number"
                  value={properties.padding || 16}
                  onChange={(e) => handleChange("padding", parseInt(e.target.value, 10) || 16)}
                  min="0"
                  max="50"
                />
              </div>
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="text-align">Text Alignment</Label>
              <Select
                onValueChange={(value) => handleChange("textAlign", value)}
                value={properties.textAlign || "center"}
              >
                <SelectTrigger id="text-align">
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="font-weight">Font Weight</Label>
              <Select
                onValueChange={(value) => handleChange("fontWeight", value)}
                value={properties.fontWeight || "normal"}
              >
                <SelectTrigger id="font-weight">
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semi Bold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "DataTable":
        return renderTablePropertyFields();
      case "Heading1":
      case "Heading2":
      case "Heading3":
      case "Heading4":
      case "Text":
      case "Paragraph":
      case "Subtitle":
      case "Caption":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="text-content">Text Content</Label>
              <Input
                id="text-content"
                value={properties.textContent || properties.text || ""}
                onChange={(e) => handleChange("textContent", e.target.value)}
                placeholder="Enter text content..."
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="text-color">Text Color</Label>
              <Input
                id="text-color"
                type="color"
                value={properties.color || "#000000"}
                onChange={(e) => handleChange("color", e.target.value)}
              />
            </div>
          </>
        );
      case "Button":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={properties.textContent || properties.text || ""}
                onChange={(e) => handleChange("textContent", e.target.value)}
                placeholder="Enter button text..."
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="button-variant">Variant</Label>
              <Select
                onValueChange={(value) => handleChange("variant", value)}
                value={properties.variant || "default"}
                defaultValue="default"
              >
                <SelectTrigger id="button-variant">
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="destructive">Destructive</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "Link":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                value={properties.textContent || properties.text || ""}
                onChange={(e) => handleChange("textContent", e.target.value)}
                placeholder="Enter link text..."
              />
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="link-href">URL</Label>
              <Input
                id="link-href"
                value={properties.href || ""}
                onChange={(e) => handleChange("href", e.target.value)}
                placeholder="Enter URL..."
              />
            </div>
          </>
        );
      case "Rectangle":
      case "Square": 
      case "Circle":
      case "Triangle":
      case "Diamond":
      case "Hexagon":
      case "Star":
      case "Ellipse":
        return (
          <>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="shape-variant">Style</Label>
              <Select
                onValueChange={(value) => handleChange("variant", value)}
                value={properties.variant || "filled"}
                defaultValue="filled"
              >
                <SelectTrigger id="shape-variant">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="shape-color">Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  id="shape-color"
                  type="color"
                  value={convertTailwindToHex(properties.color)}
                  onChange={(e) => handleChange("color", convertHexToTailwind(e.target.value))}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Select
                  onValueChange={(value) => handleChange("color", value)}
                  value={
                    // If the current color is a predefined Tailwind class, use it
                    // Otherwise, if it's a custom hex color, show "Custom"
                    properties.color?.startsWith('#') ? 'custom' : 
                    (properties.color || getDefaultShapeColor(component.type))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-red-200">Red</SelectItem>
                    <SelectItem value="bg-blue-200">Blue</SelectItem>
                    <SelectItem value="bg-green-200">Green</SelectItem>
                    <SelectItem value="bg-yellow-200">Yellow</SelectItem>
                    <SelectItem value="bg-purple-200">Purple</SelectItem>
                    <SelectItem value="bg-pink-200">Pink</SelectItem>
                    <SelectItem value="bg-orange-200">Orange</SelectItem>
                    <SelectItem value="bg-indigo-200">Indigo</SelectItem>
                    <SelectItem value="bg-gray-200">Gray</SelectItem>
                    <SelectItem value="bg-black">Black</SelectItem>
                    <SelectItem value="bg-white">White</SelectItem>
                    {properties.color?.startsWith('#') && (
                      <SelectItem value="custom">Custom ({properties.color})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="shape-border-color">Border Color</Label>
              <div className="flex gap-2">
                <Input
                  id="shape-border-color"
                  type="color"
                  value={convertTailwindToHex(properties.borderColor)}
                  onChange={(e) => handleChange("borderColor", convertHexToTailwind(e.target.value, "border"))}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Select
                  onValueChange={(value) => handleChange("borderColor", value)}
                  value={
                    // If the current border color is a predefined Tailwind class, use it
                    // Otherwise, if it's a custom hex color, show "Custom"
                    properties.borderColor?.startsWith('#') ? 'custom-border' : 
                    (properties.borderColor || getDefaultShapeBorderColor(component.type))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select border color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="border-red-300">Red</SelectItem>
                    <SelectItem value="border-blue-300">Blue</SelectItem>
                    <SelectItem value="border-green-300">Green</SelectItem>
                    <SelectItem value="border-yellow-300">Yellow</SelectItem>
                    <SelectItem value="border-purple-300">Purple</SelectItem>
                    <SelectItem value="border-pink-300">Pink</SelectItem>
                    <SelectItem value="border-orange-300">Orange</SelectItem>
                    <SelectItem value="border-indigo-300">Indigo</SelectItem>
                    <SelectItem value="border-gray-300">Gray</SelectItem>
                    <SelectItem value="border-black">Black</SelectItem>
                    <SelectItem value="border-white">White</SelectItem>
                    {properties.borderColor?.startsWith('#') && (
                      <SelectItem value="custom-border">Custom ({properties.borderColor})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 mb-4">
              <Label htmlFor="shape-border-width">Border Width</Label>
              <Input
                id="shape-border-width"
                type="number"
                min="0"
                max="10"
                value={properties.borderWidth || 1}
                onChange={(e) => handleChange("borderWidth", parseInt(e.target.value, 10) || 1)}
                placeholder="Border width in pixels"
              />
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

      {/* Universal Layer Controls - applies to all component types */}
      <div className="my-4 pt-4 border-t border-gray-200">
        <h3 className="font-medium mb-4">Layer Properties</h3>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="component-zindex">Z-Index (Layer Order)</Label>
          <Input
            id="component-zindex"
            type="number"
            value={properties.zIndex || 1}
            onChange={(e) => handleChange("zIndex", parseInt(e.target.value, 10) || 1)}
            placeholder="Layer order (higher = front)"
            min="0"
            max="999"
          />
          <div className="text-xs text-gray-500">
            Higher values appear in front. Default: 1
          </div>
        </div>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="component-opacity">Opacity</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="component-opacity"
              type="range"
              min="0"
              max="100"
              value={Math.round((properties.opacity || 1) * 100)}
              onChange={(e) => handleChange("opacity", parseInt(e.target.value, 10) / 100)}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 min-w-[3rem]">
              {Math.round((properties.opacity || 1) * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={isProcessingCsv}>
          {isProcessingCsv ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </PopoverContent>
  );
};
