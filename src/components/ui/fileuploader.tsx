import React, { useState, useRef } from "react";
import { Upload, X, File, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploaderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: File | File[];
  onChange?: (files: File | File[] | null) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  dropzoneText?: string;
  buttonText?: string;
  showFileList?: boolean;
}

export function FileUploader({
  value,
  onChange,
  multiple = false,
  accept,
  maxSize,
  className,
  dropzoneText = "Drag and drop files here, or click to select files",
  buttonText = "Select Files",
  showFileList = true,
  ...props
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Convert value to array for consistent handling
  const files = value ? (Array.isArray(value) ? value : [value]) : [];

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFiles = (selectedFiles: FileList | null): File[] => {
    if (!selectedFiles || selectedFiles.length === 0) return [];
    
    const validFiles: File[] = [];
    let errorMessage = null;
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check file size if maxSize is specified
      if (maxSize && file.size > maxSize) {
        errorMessage = `File "${file.name}" exceeds the maximum size of ${maxSize / 1024 / 1024}MB.`;
        continue;
      }
      
      // Check file type if accept is specified
      if (accept) {
        const acceptedTypes = accept.split(",").map(type => type.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split(".").pop()}`;
        
        if (!acceptedTypes.some(type => 
          type === fileType || 
          type === fileExtension || 
          (type.includes("/*") && fileType.startsWith(type.replace("/*", "/")))
        )) {
          errorMessage = `File "${file.name}" has an unsupported file type.`;
          continue;
        }
      }
      
      validFiles.push(file);
    }
    
    setError(errorMessage);
    return validFiles;
  };

  const handleFilesChange = (selectedFiles: FileList | null) => {
    const validFiles = validateFiles(selectedFiles);
    
    if (validFiles.length > 0 && onChange) {
      onChange(multiple ? validFiles : validFiles[0]);
    } else if (validFiles.length === 0 && onChange) {
      onChange(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFilesChange(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesChange(e.target.files);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    
    if (onChange) {
      onChange(multiple ? newFiles : newFiles[0] || null);
    }
  };

  const openFileSelector = () => {
    inputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (file.type.startsWith('image/')) {
      return (
        <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center">
          {file.type.startsWith('image/') && URL.createObjectURL && (
            <img 
              src={URL.createObjectURL(file)} 
              alt={file.name}
              className="w-full h-full object-cover rounded"
              onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
            />
          )}
        </div>
      );
    }
    
    if (file.type.startsWith('text/')) {
      return <FileText className="h-10 w-10 text-blue-500" />;
    }
    
    return <File className="h-10 w-10 text-gray-500" />;
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors",
          dragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary/50",
          "cursor-pointer"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <Upload className="w-10 h-10 mb-2 text-gray-500" />
        <p className="text-sm text-center text-gray-600 mb-2">{dropzoneText}</p>
        <Button 
          type="button" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            openFileSelector();
          }}
        >
          {buttonText}
        </Button>
        
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleInputChange}
          multiple={multiple}
          accept={accept}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {showFileList && files.length > 0 && (
        <ul className="mt-2 divide-y divide-gray-200 border rounded-md">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center py-2 px-3">
              {getFileIcon(file)}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                type="button"
                className="ml-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 