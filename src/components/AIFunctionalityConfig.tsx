import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ComponentData } from "@/lib/utils";
import { getComponentDefinition } from "@/lib/components-registry";
import { TableData } from "@/components/ui/datatable";
import { Trash2, Plus, Target, FlaskConical, TableIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  getAllInternalComponents, 
  formatInternalComponentForDisplay,
  InternalComponent
} from "@/lib/ai-component-tracker";

export interface AIFunctionality {
  id: string;
  name: string;
  inputComponentIds: (string | null)[];
  outputComponentId: string | null;
  triggerComponentId: string | null;
  systemPrompt: string;
  // A/B Testing properties
  isABTestEnabled?: boolean;
  promptA?: string;
  promptB?: string;
  // DataTable specific properties
  inputComponentTableColumns?: Record<string, string[]>; // Maps component ID to selected columns
  outputComponentTableColumns?: Record<string, string[]>; // Maps component ID to output columns
  // Document upload properties
  uploadedDocuments?: Array<{
    id: string;
    name: string;
    data: TableData;
    uploadedAt: string;
  }>;
}

// Selection mode interface (needs to match the one in AIConfigurator)
interface SelectionMode {
  isActive: boolean;
  type: 'input' | 'output' | 'trigger' | null;
  functionalityId: string | null;
  inputIndex?: number;
}

interface AIFunctionalityConfigProps {
  functionality: AIFunctionality;
  components: ComponentData[];
  onUpdate: (functionality: AIFunctionality) => void;
  onDelete: (id: string) => void;
  onHoverComponent?: (id: string | null) => void;
  onStartSelection?: (type: 'input' | 'output' | 'trigger', functionalityId: string, inputIndex?: number) => void;
  selectionMode?: SelectionMode;
}

export const AIFunctionalityConfig: React.FC<AIFunctionalityConfigProps> = ({
  functionality,
  components,
  onUpdate,
  onDelete,
  onHoverComponent,
  onStartSelection,
  selectionMode,
}) => {
  const [name, setName] = useState(functionality.name);
  const [inputComponentIds, setInputComponentIds] = useState<(string | null)[]>(
    functionality.inputComponentIds || [null]
  );
  const [outputComponentId, setOutputComponentId] = useState<string | null>(
    functionality.outputComponentId
  );
  const [triggerComponentId, setTriggerComponentId] = useState<string | null>(
    functionality.triggerComponentId
  );
  const [systemPrompt, setSystemPrompt] = useState(functionality.systemPrompt);
  const [isABTestEnabled, setIsABTestEnabled] = useState(functionality.isABTestEnabled || false);
  const [promptA, setPromptA] = useState(functionality.promptA || "");
  const [promptB, setPromptB] = useState(functionality.promptB || "");
  const [inputComponentTableColumns, setInputComponentTableColumns] = useState<Record<string, string[]>>(
    functionality.inputComponentTableColumns || {}
  );
  const [outputComponentTableColumns, setOutputComponentTableColumns] = useState<Record<string, string[]>>(
    functionality.outputComponentTableColumns || {}
  );
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    id: string;
    name: string;
    data: TableData;
    uploadedAt: string;
  }>>(functionality.uploadedDocuments || []);

  // Sync with prop changes only when the functionality ID changes (new functionality)
  useEffect(() => {
    console.log(`🔄 Syncing state for functionality ${functionality.id} (${functionality.name})`);
    setName(functionality.name);
    setInputComponentIds(functionality.inputComponentIds || [null]);
    setOutputComponentId(functionality.outputComponentId);
    setTriggerComponentId(functionality.triggerComponentId);
    setSystemPrompt(functionality.systemPrompt);
    setIsABTestEnabled(functionality.isABTestEnabled || false);
    setPromptA(functionality.promptA || "");
    setPromptB(functionality.promptB || "");
    setInputComponentTableColumns(functionality.inputComponentTableColumns || {});
    setOutputComponentTableColumns(functionality.outputComponentTableColumns || {});
    setUploadedDocuments(functionality.uploadedDocuments || []);
  }, [functionality.id]); // Only sync when the functionality ID changes

  // Filter components by category or type for easier selection
  const inputComponents = components.filter((c) => {
    const def = getComponentDefinition(c.type);
    return (
      def &&
      (def.category === "Input" ||
        c.type === "Textarea" ||
        c.type === "Input" ||
        c.type === "ImageUpload" ||
        c.type === "DataTable" ||
        c.type === "InsuranceInput" ||
        c.type === "InsuranceInsight" ||
        c.type === "AIInput")
    );
  });

  const outputComponents = components.filter((c) => {
    const def = getComponentDefinition(c.type);
    return def && (
      def.category === "Output" || 
      def.category === "Data Display" ||
      def.category === "Output & Display" ||
      def.category === "Visual Elements" ||
      c.type === "TextOutput" || 
      c.type === "MarkdownOutput" ||
      c.type === "Alert" ||
      c.type === "AIAlert" ||
      c.type === "DataTable" ||
      c.type === "InsuranceChat" ||
      c.type === "AIOutput" ||
      c.type.startsWith("AI") && c.type.endsWith("Output")
    );
  });

  const triggerComponents = components.filter((c) => {
    const def = getComponentDefinition(c.type);
    return def && (
      c.type === "Button" || 
      c.type === "InsuranceSendButton")
  });

  // Get internal components from AI-generated components
  const internalComponents = getAllInternalComponents(components);
  
  // Separate internal components by type
  const internalInputs = internalComponents.filter(ic => 
    ic.type === 'Input' || ic.type === 'Textarea' || ic.type === 'Checkbox'
  );
  
  const internalOutputs = internalComponents.filter(ic => 
    ic.type === 'Output'
  );
  
  const internalTriggers = internalComponents.filter(ic => 
    ic.type === 'Button'
  );

  // Combined lists for dropdowns (regular components + internal components)
  const allInputOptions = [
    ...inputComponents.filter(comp => comp.id && comp.id.trim() !== ""),
    ...internalInputs,
    // Add uploaded documents as virtual components
    ...uploadedDocuments.map(doc => ({
      id: doc.id,
      type: 'DataTable',
      properties: {
        name: doc.name,
        data: doc.data,
        title: doc.name
      }
    }))
  ];
  
  const allOutputOptions = [
    ...outputComponents.filter(comp => comp.id && comp.id.trim() !== ""),
    ...internalOutputs
  ];
  
  const allTriggerOptions = [
    ...triggerComponents.filter(comp => comp.id && comp.id.trim() !== ""),
    ...internalTriggers
  ];

  // Update the parent component when any value changes
  useEffect(() => {
    // Only update if we have a valid functionality ID to prevent cross-contamination
    if (functionality.id) {
      // Create a completely new object to avoid reference issues
      const updatedFunctionality: AIFunctionality = {
        id: functionality.id,
        name,
        inputComponentIds: [...inputComponentIds], // Create new array
        outputComponentId,
        triggerComponentId,
        systemPrompt,
        isABTestEnabled,
        promptA,
        promptB,
        inputComponentTableColumns: { ...inputComponentTableColumns }, // Create new object
        outputComponentTableColumns: { ...outputComponentTableColumns }, // Create new object
        uploadedDocuments: [...(uploadedDocuments || [])], // Create new array
      };
      
      console.log(`🔄 Updating functionality ${functionality.id} (${functionality.name}):`, {
        inputComponentIds,
        uploadedDocuments: uploadedDocuments.length,
        name
      });
      
      onUpdate(updatedFunctionality);
    }
  }, [
    functionality.id, // Only depend on the ID, not the entire functionality object
    name,
    inputComponentIds,
    outputComponentId,
    triggerComponentId,
    systemPrompt,
    isABTestEnabled,
    promptA,
    promptB,
    inputComponentTableColumns,
    outputComponentTableColumns,
    uploadedDocuments,
  ]);

  // Handle mouse enter/leave for component highlighting
  const handleMouseEnter = (componentId: string) => {
    if (onHoverComponent) {
      onHoverComponent(componentId);
    }
  };

  const handleMouseLeave = () => {
    if (onHoverComponent) {
      onHoverComponent(null);
    }
  };

  const handleAddInput = () => {
    setInputComponentIds([...inputComponentIds, null]);
  };

  // New function to handle document upload
  const handleDocumentUpload = async (file: File) => {
    try {
      console.log(`📄 Uploading document for functionality: ${functionality.id} (${functionality.name})`);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file and create a DataTable component
      const response = await fetch('/api/ai/upload-document', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      
      const data = await response.json();
      
      // Create a document entry for this functionality
      const documentId = `doc-${Date.now()}`;
      const newDocument = {
        id: documentId,
        name: file.name,
        data: data.tableData,
        uploadedAt: new Date().toISOString()
      };
      
      console.log(`📄 Adding document to functionality ${functionality.id}:`, newDocument);
      
      // Add the document to this functionality's uploaded documents
      setUploadedDocuments(prev => {
        const newDocs = [...prev, newDocument];
        console.log(`📄 Updated uploadedDocuments for ${functionality.id}:`, newDocs);
        return newDocs;
      });
      
      // Add it as an input to this functionality (using the document ID)
      setInputComponentIds(prev => {
        const newInputs = [...prev, documentId];
        console.log(`📄 Updated inputComponentIds for ${functionality.id}:`, newInputs);
        return newInputs;
      });
      
      console.log('Created new document entry:', newDocument);
      
      // Show success message
      alert(`✅ Document "${file.name}" uploaded successfully! Added as input to AI Function: ${functionality.name}`);
      
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  // Function to handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleDocumentUpload(file);
      // Clear the input so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const handleRemoveInput = (index: number) => {
    setInputComponentIds(inputComponentIds.filter((_, i) => i !== index));
  };

  const handleInputChange = (index: number, value: string | null) => {
    const newInputComponentIds = [...inputComponentIds];
    const oldValue = newInputComponentIds[index];
    newInputComponentIds[index] = value;
    setInputComponentIds(newInputComponentIds);

    // Clean up table column selections if component changed
    if (oldValue && oldValue !== value) {
      const newInputTableColumns = { ...inputComponentTableColumns };
      delete newInputTableColumns[oldValue];
      setInputComponentTableColumns(newInputTableColumns);
    }
  };

  // Helper function to get table data from a component
  const getTableDataFromComponent = (componentId: string): TableData | null => {
    const component = components.find(c => c.id === componentId);
    if (component && component.type === "DataTable" && component.properties?.data) {
      return component.properties.data as TableData;
    }
    return null;
  };

  // Helper function to handle column selection for input tables
  const handleInputTableColumnChange = (componentId: string, selectedColumns: string[]) => {
    setInputComponentTableColumns(prev => ({
      ...prev,
      [componentId]: selectedColumns
    }));
  };

  // Helper function to handle column selection for output tables
  const handleOutputTableColumnChange = (componentId: string, selectedColumns: string[]) => {
    setOutputComponentTableColumns(prev => ({
      ...prev,
      [componentId]: selectedColumns
    }));
  };

  // Handle output component change and clean up table columns if needed
  const handleOutputComponentChange = (value: string | null) => {
    const oldValue = outputComponentId;
    setOutputComponentId(value);

    // Clean up table column selections if component changed
    if (oldValue && oldValue !== value) {
      const newOutputTableColumns = { ...outputComponentTableColumns };
      delete newOutputTableColumns[oldValue];
      setOutputComponentTableColumns(newOutputTableColumns);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border-none p-0 text-md font-semibold focus:outline-none focus:ring-0"
              placeholder="AI Functionality Name"
            />
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(functionality.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Input Components</Label>
          {inputComponentIds.map((inputComponentId, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-1">
                <Select
                  onValueChange={(value) =>
                    handleInputChange(index, value || null)
                  }
                  value={inputComponentId || undefined}
                  disabled={selectionMode?.isActive && selectionMode.functionalityId !== functionality.id}
                >
                  <SelectTrigger id={`input-${functionality.id}-${index}`}>
                    <SelectValue placeholder="Select an input component" />
                  </SelectTrigger>
                  <SelectContent>
                    {allInputOptions.map((comp) => {
                      // Check if this is an internal component
                      const isInternal = 'parentComponentId' in comp;
                      // Check if this is an uploaded document
                      const isUploadedDocument = uploadedDocuments.some(doc => doc.id === comp.id);
                      
                      let displayText = '';
                      let hoverComponentId = comp.id;
                      
                      if (isInternal) {
                        displayText = formatInternalComponentForDisplay(comp as InternalComponent);
                        hoverComponentId = (comp as InternalComponent).parentComponentId;
                      } else if (isUploadedDocument) {
                        const doc = uploadedDocuments.find(d => d.id === comp.id);
                        displayText = `📄 ${doc?.name || 'Uploaded Document'}`;
                      } else {
                        displayText = `${comp.type} - ${comp.id}`;
                      }
                      
                      return (
                      <SelectItem
                        key={comp.id}
                        value={comp.id}
                          onMouseEnter={() => handleMouseEnter(hoverComponentId)}
                        onMouseLeave={handleMouseLeave}
                        className="cursor-pointer hover:bg-blue-50"
                      >
                          <div className="flex flex-col">
                            <span>{displayText}</span>
                            {isInternal && (
                              <span className="text-xs text-gray-500">
                                Internal: {(comp as InternalComponent).purpose}
                              </span>
                            )}
                            {isUploadedDocument && (
                              <span className="text-xs text-green-600">
                                📊 {(() => {
                                  const doc = uploadedDocuments.find(d => d.id === comp.id);
                                  return `${doc?.data?.headers?.length || 0} columns, ${doc?.data?.rows?.length || 0} rows`;
                                })()}
                              </span>
                            )}
                          </div>
                      </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Target Selection Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onStartSelection?.('input', functionality.id, index)}
                disabled={selectionMode?.isActive}
                title="Click to select component directly on canvas"
              >
                <Target className="h-4 w-4" />
              </Button>
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveInput(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddInput}
              className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Input
          </Button>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="document-upload"
                accept=".csv,.xlsx,.xls"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('document-upload')?.click()}
                className="w-full"
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>
          </div>
        </div>

        {/* Show Uploaded Documents */}
        {uploadedDocuments.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Documents</Label>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="p-3 border rounded-md bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TableIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{doc.name}</span>
                      <span className="text-xs text-green-600">
                        📊 {doc.data.headers.length} columns, {doc.data.rows.length} rows
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedDocuments(prev => prev.filter(d => d.id !== doc.id));
                        setInputComponentIds(prev => prev.filter(id => id !== doc.id));
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Column Selection for DataTable Input Components */}
        {inputComponentIds.some(id => {
          if (!id) return false;
          const component = components.find(c => c.id === id);
          const isUploadedDocument = uploadedDocuments.some(doc => doc.id === id);
          return component?.type === "DataTable" || isUploadedDocument;
        }) && (
          <div className="space-y-2">
            <Label>Input Column Selection</Label>
            {inputComponentIds.map((inputComponentId, index) => {
              if (!inputComponentId) return null;
              const component = components.find(c => c.id === inputComponentId);
              const uploadedDocument = uploadedDocuments.find(doc => doc.id === inputComponentId);
              
              // Handle both regular DataTable components and uploaded documents
              let tableData: TableData | null = null;
              let componentName = '';
              
              if (component?.type === "DataTable") {
                tableData = getTableDataFromComponent(inputComponentId);
                componentName = `${component.type} - ${inputComponentId}`;
              } else if (uploadedDocument) {
                tableData = uploadedDocument.data;
                componentName = `📄 ${uploadedDocument.name}`;
              } else {
                return null;
              }
              
              const selectedColumns = inputComponentTableColumns[inputComponentId] || [];
              
              if (!tableData || !tableData.headers) {
                return (
                  <div key={`input-table-${index}`} className="p-3 border rounded-md bg-gray-50">
                    <p className="text-sm text-gray-600">
                      {componentName}: No data loaded.
                    </p>
                  </div>
                );
              }

              return (
                <div key={`input-table-${index}`} className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm font-medium mb-2">
                    {componentName} ({tableData.headers.length} columns, {tableData.rows.length} rows)
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {tableData.headers.map((header, colIndex) => (
                      <div key={`input-col-${colIndex}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`input-col-${inputComponentId}-${colIndex}`}
                          checked={selectedColumns.includes(header)}
                          onCheckedChange={(checked) => {
                            const newSelectedColumns = checked
                              ? [...selectedColumns, header]
                              : selectedColumns.filter(col => col !== header);
                            handleInputTableColumnChange(inputComponentId, newSelectedColumns);
                          }}
                        />
                        <Label htmlFor={`input-col-${inputComponentId}-${colIndex}`} className="text-sm">
                          {header}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Output Component */}
        <div className="space-y-2">
          <Label htmlFor={`output-${functionality.id}`}>Output Component</Label>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Select
                onValueChange={(value) => handleOutputComponentChange(value || null)}
                value={outputComponentId || undefined}
                disabled={selectionMode?.isActive && selectionMode.functionalityId !== functionality.id}
              >
                <SelectTrigger id={`output-${functionality.id}`}>
                  <SelectValue placeholder="Select an output component" />
                </SelectTrigger>
                            <SelectContent>
                  {allOutputOptions.map((comp) => {
                    // Check if this is an internal component
                    const isInternal = 'parentComponentId' in comp;
                    const displayText = isInternal 
                      ? formatInternalComponentForDisplay(comp as InternalComponent)
                      : `${comp.type} - ${comp.id}`;
                    const hoverComponentId = isInternal 
                      ? (comp as InternalComponent).parentComponentId 
                      : comp.id;
                    
                    return (
                    <SelectItem
                      key={comp.id}
                      value={comp.id}
                        onMouseEnter={() => handleMouseEnter(hoverComponentId)}
                      onMouseLeave={handleMouseLeave}
                      className="cursor-pointer hover:bg-blue-50"
                    >
                        <div className="flex flex-col">
                          <span>{displayText}</span>
                          {isInternal && (
                            <span className="text-xs text-gray-500">
                              Internal: {(comp as InternalComponent).purpose}
                            </span>
                          )}
                        </div>
                    </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Target Selection Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onStartSelection?.('output', functionality.id)}
              disabled={selectionMode?.isActive}
              title="Click to select component directly on canvas"
            >
              <Target className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Column Selection for DataTable Output Component */}
        {outputComponentId && (() => {
          const component = components.find(c => c.id === outputComponentId);
          if (component?.type !== "DataTable") return null;
          
          const tableData = getTableDataFromComponent(outputComponentId);
          const selectedColumns = outputComponentTableColumns[outputComponentId] || [];
          
          if (!tableData || !tableData.headers) {
            return (
              <div className="space-y-2">
                <Label>Output Column Selection</Label>
                <div className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-600">
                    {component.type} - {outputComponentId}: No data loaded. Upload CSV data first.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-2">
              <Label>Output Column Selection</Label>
              <div className="p-3 border rounded-md bg-gray-50">
                <p className="text-sm font-medium mb-2">
                  {component.type} - {outputComponentId} ({tableData.headers.length} columns, {tableData.rows.length} rows)
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {tableData.headers.map((header, colIndex) => (
                    <div key={`output-col-${colIndex}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`output-${outputComponentId}-col-${colIndex}`}
                        checked={selectedColumns.includes(header)}
                        onCheckedChange={(checked) => {
                          const newColumns = checked 
                            ? [...selectedColumns, header]
                            : selectedColumns.filter(col => col !== header);
                          handleOutputTableColumnChange(outputComponentId, newColumns);
                        }}
                      />
                      <Label 
                        htmlFor={`output-${outputComponentId}-col-${colIndex}`}
                        className="text-xs"
                      >
                        {header}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedColumns.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Selected: {selectedColumns.join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Trigger Component */}
        <div className="space-y-2">
          <Label htmlFor={`trigger-${functionality.id}`}>
            Trigger Component
          </Label>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Select
                onValueChange={(value) => setTriggerComponentId(value || null)}
                value={triggerComponentId || undefined}
                disabled={selectionMode?.isActive && selectionMode.functionalityId !== functionality.id}
              >
                <SelectTrigger id={`trigger-${functionality.id}`}>
                  <SelectValue placeholder="Select a trigger component" />
                </SelectTrigger>
                <SelectContent>
                  {allTriggerOptions.map((comp) => {
                    // Check if this is an internal component
                    const isInternal = 'parentComponentId' in comp;
                    const displayText = isInternal 
                      ? formatInternalComponentForDisplay(comp as InternalComponent)
                      : `${comp.type} - ${comp.id}`;
                    const hoverComponentId = isInternal 
                      ? (comp as InternalComponent).parentComponentId 
                      : comp.id;
                    
                    return (
                    <SelectItem
                      key={comp.id}
                      value={comp.id}
                        onMouseEnter={() => handleMouseEnter(hoverComponentId)}
                      onMouseLeave={handleMouseLeave}
                      className="cursor-pointer hover:bg-blue-50"
                    >
                        <div className="flex flex-col">
                          <span>{displayText}</span>
                          {isInternal && (
                            <span className="text-xs text-gray-500">
                              Internal: {(comp as InternalComponent).purpose}
                            </span>
                          )}
                        </div>
                    </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Target Selection Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onStartSelection?.('trigger', functionality.id)}
              disabled={selectionMode?.isActive}
              title="Click to select component directly on canvas"
            >
              <Target className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* A/B Testing Toggle */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`ab-test-${functionality.id}`}
              checked={isABTestEnabled}
              onCheckedChange={(checked) => setIsABTestEnabled(checked as boolean)}
            />
            <Label htmlFor={`ab-test-${functionality.id}`} className="flex items-center">
              <FlaskConical className="h-4 w-4 mr-2" />
              Enable A/B Test
            </Label>
          </div>
          <p className="text-xs text-gray-500">
            Compare two system prompts side-by-side to see which performs better
          </p>
        </div>

        {/* System Prompt or A/B Prompts */}
        {isABTestEnabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`prompt-a-${functionality.id}`} className="flex items-center text-blue-700">
                  <FlaskConical className="h-3 w-3 mr-1" />
                  Prompt A
                </Label>
                <Textarea
                  id={`prompt-a-${functionality.id}`}
                  value={promptA}
                  onChange={(e) => setPromptA(e.target.value)}
                  placeholder="Enter the first prompt variant..."
                  className="h-40 resize-y border-blue-200 focus:border-blue-400"
                />
                <div className="text-xs text-blue-600">
                  Characters: {promptA.length}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`prompt-b-${functionality.id}`} className="flex items-center text-green-700">
                  <FlaskConical className="h-3 w-3 mr-1" />
                  Prompt B
                </Label>
                <Textarea
                  id={`prompt-b-${functionality.id}`}
                  value={promptB}
                  onChange={(e) => setPromptB(e.target.value)}
                  placeholder="Enter the second prompt variant..."
                  className="h-40 resize-y border-green-200 focus:border-green-400"
                />
                <div className="text-xs text-green-600">
                  Characters: {promptB.length}
                </div>
              </div>
            </div>
            
            {/* A/B Test Tips */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 mb-1">💡 A/B Testing Tips</div>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Make small, focused changes between prompts</li>
                <li>• Test one variable at a time (tone, specificity, examples)</li>
                <li>• Both prompts will use temperature=0 for fair comparison</li>
              </ul>
            </div>
          </div>
        ) : (
        <div className="space-y-2">
          <Label htmlFor={`system-prompt-${functionality.id}`}>
            System Prompt
          </Label>
          <Textarea
            id={`system-prompt-${functionality.id}`}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter a system prompt for the AI..."
            className="h-32 resize-y"
          />
        </div>
        )}
      </CardContent>
    </Card>
  );
};