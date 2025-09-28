"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";

interface AIDropdownOutputProps {
  id?: string;
  className?: string;
  placeholder?: string;
  options?: string[];
  selectedValue?: string;
  onChange?: (value: string) => void;
  isInteractive?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  padding?: number;
  opacity?: number;
  loading?: boolean;
  loadingText?: string;
  emptyStateText?: string;
  content?: string; // AI processed content that contains options
}

export function AIDropdownOutput({
  id = "ai-dropdown-output",
  className = "",
  placeholder = "AI will populate options...",
  options = [],
  selectedValue = "",
  onChange,
  isInteractive = true,
  backgroundColor = "#ffffff",
  borderColor = "#d1d5db",
  borderWidth = 1,
  borderRadius = 6,
  textColor = "#374151",
  fontSize = 14,
  fontWeight = "normal",
  padding = 12,
  opacity = 1,
  loading = false,
  loadingText = "AI is processing...",
  emptyStateText = "No options available",
  content = "",
}: AIDropdownOutputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedOptions, setParsedOptions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse options from AI content or direct options prop
  useEffect(() => {
    let newOptions: string[] = [];
    
    if (content && content.trim()) {
      // Try to parse content as JSON array first
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          newOptions = parsed.map(item => typeof item === 'string' ? item : String(item));
        }
      } catch (e) {
        // Try to parse as newline-separated options
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          // Remove common prefixes like "- ", "* ", numbers, etc.
          newOptions = lines.map(line => 
            line.replace(/^[\s\-\*\d\.\)]+/, '').trim()
          ).filter(option => option.length > 0);
        } else {
          // Try to parse as comma-separated options
          const commaSeparated = content.split(',').map(item => item.trim()).filter(item => item.length > 0);
          if (commaSeparated.length > 1) {
            newOptions = commaSeparated;
          } else {
            // If all else fails, treat the entire content as a single option
            newOptions = [content.trim()];
          }
        }
      }
    } else if (options && options.length > 0) {
      newOptions = options;
    }

    // Only update if the options have actually changed
    setParsedOptions(prevOptions => {
      if (prevOptions.length !== newOptions.length) return newOptions;
      if (prevOptions.some((option, index) => option !== newOptions[index])) return newOptions;
      return prevOptions;
    });
  }, [content, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleOptionSelect = useCallback((option: string) => {
    if (onChange) {
      onChange(option);
    }
    setIsOpen(false);
  }, [onChange]);

  const displayValue = useMemo(() => {
    if (loading) return loadingText;
    if (selectedValue) return selectedValue;
    if (parsedOptions.length === 0) return emptyStateText;
    return placeholder;
  }, [loading, loadingText, selectedValue, parsedOptions.length, emptyStateText, placeholder]);

  const displayColor = useMemo(() => {
    if (loading) return "#6b7280";
    if (selectedValue) return textColor;
    if (parsedOptions.length === 0) return "#9ca3af";
    return "#9ca3af";
  }, [loading, selectedValue, textColor]);

  return (
    <div
      ref={dropdownRef}
      id={id}
      className={`relative ${className} ${!isInteractive ? "pointer-events-none" : "cursor-pointer"}`}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderRadius: `${borderRadius}px`,
        fontSize: `${fontSize}px`,
        fontWeight,
        padding: `${padding}px`,
        opacity,
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      onClick={() => {
        if (isInteractive && !loading && parsedOptions.length > 0) {
          setIsOpen(!isOpen);
        }
      }}
    >
      <span
        style={{
          color: displayColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {displayValue}
      </span>

      {/* Loading spinner or chevron */}
      {loading ? (
        <div
          className="animate-spin"
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid #e5e7eb",
            borderTop: "2px solid #3b82f6",
            borderRadius: "50%",
            marginLeft: "8px",
          }}
        />
      ) : (
        <ChevronDown
          style={{
            width: "16px",
            height: "16px",
            color: "#9ca3af",
            marginLeft: "8px",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      )}

      {/* Dropdown options list */}
      {isInteractive && isOpen && parsedOptions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: `${borderRadius}px`,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "2px",
          }}
        >
          {parsedOptions.map((option, index) => (
            <div
              key={index}
              style={{
                padding: `${Math.max(8, padding / 2)}px ${padding}px`,
                color: textColor,
                cursor: "pointer",
                borderBottom: index < parsedOptions.length - 1 ? "1px solid #f3f4f6" : "none",
                backgroundColor: selectedValue === option ? "#f3f4f6" : "transparent",
                fontSize: `${fontSize}px`,
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = selectedValue === option ? "#f3f4f6" : "transparent";
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionSelect(option);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
