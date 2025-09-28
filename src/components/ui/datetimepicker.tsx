import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: Date | string;
  onChange?: (value: Date) => void;
  showTime?: boolean;
  showDate?: boolean;
  className?: string;
  placeholder?: string;
  format?: string;
}

export function DateTimePicker({
  value,
  onChange,
  showTime = true,
  showDate = true,
  className,
  placeholder = "Select date and time",
  format: formatString = "yyyy-MM-dd HH:mm",
  ...props
}: DateTimePickerProps) {
  // Convert value to Date object if it's a string
  const dateValue = value ? (typeof value === "string" ? new Date(value) : value) : null;
  
  // Format the display value
  const displayValue = dateValue 
    ? format(dateValue, formatString)
    : "";

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue && onChange) {
      // For browser-native date input, convert the string to Date
      const newDate = new Date(newValue);
      
      // If we had a previous date and we're just updating part of it
      // (either date or time), preserve the other part
      if (dateValue) {
        if (!showDate) {
          // If only changing time, preserve the date
          newDate.setFullYear(dateValue.getFullYear());
          newDate.setMonth(dateValue.getMonth());
          newDate.setDate(dateValue.getDate());
        } else if (!showTime) {
          // If only changing date, preserve the time
          newDate.setHours(dateValue.getHours());
          newDate.setMinutes(dateValue.getMinutes());
          newDate.setSeconds(dateValue.getSeconds());
        }
      }
      
      onChange(newDate);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <div className="absolute left-2 flex h-full items-center pointer-events-none">
          {showDate && <CalendarIcon className="h-4 w-4 text-muted-foreground" />}
        </div>
        
        <Input
          type={showTime && !showDate ? "time" : "datetime-local"}
          className={cn(
            "pr-10",
            showDate && "pl-8",
            !showDate && showTime && "pl-8"
          )}
          value={displayValue}
          onChange={handleDateChange}
          placeholder={placeholder}
          {...props}
        />
        
        {showTime && (
          <div className="absolute right-2 flex h-full items-center pointer-events-none">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
} 