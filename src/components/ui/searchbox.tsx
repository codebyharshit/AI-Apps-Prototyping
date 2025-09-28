import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  className?: string;
  placeholder?: string;
  iconPosition?: "left" | "right";
  clearable?: boolean;
}

export function Searchbox({
  onSearch,
  className,
  placeholder = "Search...",
  iconPosition = "left",
  clearable = false,
  ...props
}: SearchboxProps) {
  const [value, setValue] = React.useState(props.value || "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Call original onChange if provided
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value as string);
    }
    
    // Call original onKeyDown if provided
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const handleClear = () => {
    setValue("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <div className="relative w-full">
      {iconPosition === "left" && (
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      
      <Input
        type="search"
        className={cn(
          iconPosition === "left" ? "pl-9" : "pr-9",
          clearable && value ? "pr-8" : "",
          className
        )}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      
      {iconPosition === "right" && (
        <Search className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      
      {clearable && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
          aria-label="Clear search"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
} 