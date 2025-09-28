import * as React from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Define the component props including value prop
interface ImageUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
  value?: string[];
  onChange?: (value: string[]) => void;
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  ({ className, isInteractive = false, value, onChange, ...props }, ref) => {
    // Use internal state only when no value prop is provided (uncontrolled mode)
    const [internalImageURLs, setInternalImageURLs] = React.useState<string[]>(
      []
    );
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Determine if we're in controlled or uncontrolled mode
    const isControlled = value !== undefined;

    // Use the appropriate image URLs source
    const imageURLs = isControlled ? value : internalImageURLs;

    // Update function that handles both internal state and onChange callback
    const updateImages = (newImages: string[]) => {
      // Always call onChange if provided
      if (onChange) {
        onChange(newImages);
      }

      // Only update internal state if uncontrolled
      if (!isControlled) {
        setInternalImageURLs(newImages);
      }
    };

    const processFiles = (files: FileList | File[]) => {
      if (!files || files.length === 0) return;

      const newFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (newFiles.length === 0) return;

      const newPreviews: string[] = [];
      let completedReads = 0;

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          completedReads++;

          // Update state only after all reads are complete
          if (completedReads === newFiles.length) {
            updateImages([...imageURLs, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        processFiles(event.target.files);
      }
      // Reset the input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleRemoveImage = (index: number) => {
      const updatedImages = imageURLs.filter((_, i) => i !== index);
      updateImages(updatedImages);
    };

    // Drag and drop event handlers
    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "border border-dashed border-gray-300 rounded-md p-4 flex flex-col gap-4 overflow-auto",
          className
        )}
        {...props}
        data-image-upload="true"
      >
        {/* Upload Button/Area */}
        {(isInteractive || imageURLs.length === 0) && (
          <label
            className={cn(
              "w-full p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-500"
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud
              className={cn(
                "h-8 w-8 mb-2 transition-colors",
                isDragging ? "text-blue-500" : "text-gray-400"
              )}
            />
            <span
              className={cn(
                "text-sm transition-colors",
                isDragging ? "text-blue-600" : "text-gray-600"
              )}
            >
              Click to upload or drag and drop
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}

        {/* Image Previews */}
        {imageURLs.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {imageURLs.map((preview, index) => (
              <div key={`preview-${index}`} className="relative group">
                <Image
                  src={preview}
                  width={200}
                  height={200}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                {isInteractive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white hover:text-white rounded-full opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Hidden data elements to store image data for AI service */}
        {imageURLs.map((preview, index) => (
          <input
            key={`data-${index}`}
            type="hidden"
            name={`image-data-${index}`}
            value={preview}
          />
        ))}
      </div>
    );
  }
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload };
