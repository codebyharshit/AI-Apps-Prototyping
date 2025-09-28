"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, X } from "lucide-react";

export interface ComponentRequirements {
  idea: string;
  componentType: string;
  features: string[];
  styling: string;
  targetAudience: string;
  additionalNotes: string;
}

interface ComponentRequirementsFormProps {
  onSubmit: (requirements: ComponentRequirements) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialRequirements?: ComponentRequirements;
}

const componentTypes = [
  "Form",
  "Modal",
  "Card",
  "Button",
  "Navigation",
  "Dashboard",
  "Chart",
  "Table",
  "Gallery",
  "Hero Section",
  "Footer",
  "Sidebar",
  "Header",
  "Pricing Table",
  "Testimonial",
  "Contact Form",
  "Login Form",
  "Registration Form",
  "Search Bar",
  "Filter Component",
  "Calendar",
  "Timeline",
  "Progress Bar",
  "Notification",
  "Tooltip",
  "Dropdown",
  "Tabs",
  "Accordion",
  "Carousel",
  "Slider",
  "Custom Component"
];

const stylingOptions = [
  "Modern and Clean",
  "Minimalist",
  "Bold and Colorful",
  "Professional",
  "Playful and Fun",
  "Dark Theme",
  "Light Theme",
  "Material Design",
  "Neumorphism",
  "Glassmorphism",
  "Retro/Vintage",
  "Futuristic",
  "Elegant",
  "Casual",
  "Corporate"
];

const targetAudienceOptions = [
  "General Users",
  "Developers",
  "Designers",
  "Business Users",
  "Students",
  "E-commerce Customers",
  "Content Creators",
  "Administrators",
  "Mobile Users",
  "Desktop Users"
];

export function ComponentRequirementsForm({ onSubmit, onCancel, isLoading = false, initialRequirements }: ComponentRequirementsFormProps) {
  const [requirements, setRequirements] = useState<ComponentRequirements>(initialRequirements || {
    idea: "",
    componentType: "",
    features: [],
    styling: "",
    targetAudience: "",
    additionalNotes: ""
  });

  const [newFeature, setNewFeature] = useState("");

  const handleInputChange = (field: keyof ComponentRequirements, value: string | string[]) => {
    setRequirements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !requirements.features.includes(newFeature.trim())) {
      handleInputChange("features", [...requirements.features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    handleInputChange("features", requirements.features.filter(f => f !== feature));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirements.idea && requirements.componentType) {
      onSubmit(requirements);
    }
  };

  const isFormValid = requirements.idea.trim() && requirements.componentType;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="w-full shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Component Requirements</CardTitle>
                <p className="text-gray-600 text-base mt-1">
                  Describe your component idea and requirements to generate the perfect HTML/CSS
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Component Idea - Full Width */}
            <div className="space-y-3">
              <Label htmlFor="idea" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                What's your component idea? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="idea"
                placeholder="Describe what you want to build... (e.g., A contact form with validation, A pricing table with hover effects, A dashboard card showing user stats)"
                value={requirements.idea}
                onChange={(e) => handleInputChange("idea", e.target.value)}
                className="min-h-[120px] text-base p-4 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required
              />
            </div>

            {/* Component Type and Styling - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="componentType" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  Component Type <span className="text-red-500">*</span>
                </Label>
                <Select value={requirements.componentType} onValueChange={(value) => handleInputChange("componentType", value)}>
                  <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base">
                    <SelectValue placeholder="Select a component type" />
                  </SelectTrigger>
                  <SelectContent>
                    {componentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="styling" className="text-base font-semibold text-gray-700">
                  Preferred Styling
                </Label>
                <Select value={requirements.styling} onValueChange={(value) => handleInputChange("styling", value)}>
                  <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base">
                    <SelectValue placeholder="Choose a styling approach" />
                  </SelectTrigger>
                  <SelectContent>
                    {stylingOptions.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features Section - Full Width */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-gray-700">Key Features</Label>
              <div className="flex gap-3">
                <Input
                  placeholder="Add a feature (e.g., responsive design, animations, validation)"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button 
                  type="button" 
                  onClick={addFeature} 
                  variant="outline" 
                  size="sm"
                  className="h-12 px-6 text-base border-gray-300 hover:bg-gray-50"
                >
                  Add
                </Button>
              </div>
              {requirements.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {requirements.features.map((feature, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors px-3 py-1 text-sm"
                      onClick={() => removeFeature(feature)}
                    >
                      {feature}
                      <X className="ml-2 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Target Audience and Additional Notes - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="targetAudience" className="text-base font-semibold text-gray-700">
                  Target Audience
                </Label>
                <Select value={requirements.targetAudience} onValueChange={(value) => handleInputChange("targetAudience", value)}>
                  <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base">
                    <SelectValue placeholder="Who will use this component?" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAudienceOptions.map((audience) => (
                      <SelectItem key={audience} value={audience}>
                        {audience}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="additionalNotes" className="text-base font-semibold text-gray-700">
                  Additional Notes
                </Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any specific requirements, constraints, or preferences..."
                  value={requirements.additionalNotes}
                  onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                  className="min-h-[80px] text-base p-4 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={isLoading}
                className="h-12 px-8 text-base border-gray-300 hover:bg-gray-50 flex-1 lg:flex-none lg:w-32"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isFormValid || isLoading} 
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    Generate HTML/CSS
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 