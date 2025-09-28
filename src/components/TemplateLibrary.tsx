"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Layout, 
  ShoppingCart, 
  MessageSquare, 
  BarChart3, 
  User, 
  FileText,
  Calendar,
  Zap
} from "lucide-react";
import { ComponentData, FrameData } from "@/lib/utils";
import { AIFunctionality } from "@/components/AIFunctionalityConfig";

interface TemplateLibraryProps {
  onTemplateSelected: (data: {
    components: ComponentData[];
    frames: FrameData[];
    aiFunctionalities: AIFunctionality[];
    title: string;
  }) => void;
}

const templates = [
  {
    id: "chatbot-support",
    title: "Customer Support Chatbot",
    description: "AI-powered customer support with chat interface and knowledge base",
    icon: MessageSquare,
    tags: ["AI", "Chat", "Support"],
    difficulty: "Beginner",
    components: [
      {
        id: "chat-container",
        type: "Card",
        position: { x: 70, y: 70 },
        size: { width: 360, height: 400 },
        properties: {
          title: "Customer Support",
          content: "Chat with our AI assistant"
        },
        frameId: "main-frame"
      },
      {
        id: "user-input",
        type: "Input",
        position: { x: 90, y: 380 },
        size: { width: 240, height: 40 },
        properties: {
          placeholder: "Type your question..."
        },
        frameId: "main-frame"
      },
      {
        id: "send-button",
        type: "Button",
        position: { x: 340, y: 380 },
        size: { width: 80, height: 40 },
        properties: {
          text: "Send",
          variant: "default"
        },
        frameId: "main-frame"
      },
      {
        id: "chat-output",
        type: "Chatbot",
        position: { x: 90, y: 120 },
        size: { width: 320, height: 250 },
        properties: {
          systemPrompt: "You are a helpful customer support assistant."
        },
        frameId: "main-frame"
      }
    ],
    frames: [
      {
        id: "main-frame",
        position: { x: 50, y: 50 },
        size: { width: 500, height: 500 },
        label: "Support Chat"
      }
    ],
    aiFunctionalities: [
      {
        id: "support-ai",
        triggerComponentId: "send-button",
        inputComponentIds: ["user-input"],
        outputComponentId: "chat-output",
        systemPrompt: "You are a helpful customer support assistant. Provide clear, friendly, and accurate responses to customer inquiries."
      }
    ]
  },
  {
    id: "data-dashboard",
    title: "Analytics Dashboard",
    description: "Data visualization dashboard with charts and KPI cards",
    icon: BarChart3,
    tags: ["Dashboard", "Analytics", "Data"],
    difficulty: "Intermediate",
    components: [
      {
        id: "header-card",
        type: "Card",
        position: { x: 70, y: 70 },
        size: { width: 600, height: 80 },
        properties: {
          title: "Sales Dashboard",
          content: "Real-time business analytics and insights"
        },
        frameId: "dashboard-frame"
      },
      {
        id: "revenue-card",
        type: "Card",
        position: { x: 70, y: 170 },
        size: { width: 180, height: 120 },
        properties: {
          title: "Total Revenue",
          content: "$125,430"
        },
        frameId: "dashboard-frame"
      },
      {
        id: "users-card",
        type: "Card",
        position: { x: 270, y: 170 },
        size: { width: 180, height: 120 },
        properties: {
          title: "Active Users",
          content: "12,543"
        },
        frameId: "dashboard-frame"
      },
      {
        id: "conversion-card",
        type: "Card",
        position: { x: 470, y: 170 },
        size: { width: 180, height: 120 },
        properties: {
          title: "Conversion Rate",
          content: "3.24%"
        },
        frameId: "dashboard-frame"
      },
      {
        id: "data-table",
        type: "DataTable",
        position: { x: 70, y: 310 },
        size: { width: 580, height: 200 },
        properties: {
          data: [
            ["Product", "Sales", "Growth"],
            ["Product A", "1,234", "+12%"],
            ["Product B", "987", "+8%"],
            ["Product C", "756", "+15%"]
          ]
        },
        frameId: "dashboard-frame"
      }
    ],
    frames: [
      {
        id: "dashboard-frame",
        position: { x: 50, y: 50 },
        size: { width: 750, height: 580 },
        label: "Dashboard"
      }
    ],
    aiFunctionalities: []
  },
  {
    id: "ecommerce-checkout",
    title: "E-commerce Checkout",
    description: "Complete shopping cart and checkout flow",
    icon: ShoppingCart,
    tags: ["E-commerce", "Shopping", "Payments"],
    difficulty: "Advanced",
    components: [
      {
        id: "cart-header",
        type: "Card",
        position: { x: 70, y: 70 },
        size: { width: 400, height: 60 },
        properties: {
          title: "Shopping Cart",
          content: "3 items in your cart"
        },
        frameId: "cart-frame"
      },
      {
        id: "item-list",
        type: "DataTable",
        position: { x: 70, y: 150 },
        size: { width: 400, height: 200 },
        properties: {
          data: [
            ["Item", "Qty", "Price"],
            ["Wireless Headphones", "1", "$99.99"],
            ["Phone Case", "2", "$24.98"],
            ["Charging Cable", "1", "$19.99"]
          ]
        },
        frameId: "cart-frame"
      },
      {
        id: "total-card",
        type: "Card",
        position: { x: 70, y: 370 },
        size: { width: 400, height: 80 },
        properties: {
          title: "Total: $144.96",
          content: "Free shipping on orders over $100"
        },
        frameId: "cart-frame"
      },
      {
        id: "checkout-button",
        type: "Button",
        position: { x: 350, y: 470 },
        size: { width: 120, height: 40 },
        properties: {
          text: "Checkout",
          variant: "default",
          navigateTo: "checkout-frame"
        },
        frameId: "cart-frame"
      },
      {
        id: "checkout-form",
        type: "Card",
        position: { x: 70, y: 70 },
        size: { width: 400, height: 400 },
        properties: {
          title: "Checkout Information",
          content: "Please fill in your details"
        },
        frameId: "checkout-frame"
      },
      {
        id: "email-input",
        type: "Input",
        position: { x: 90, y: 140 },
        size: { width: 360, height: 40 },
        properties: {
          placeholder: "Email address"
        },
        frameId: "checkout-frame"
      },
      {
        id: "card-input",
        type: "Input",
        position: { x: 90, y: 200 },
        size: { width: 360, height: 40 },
        properties: {
          placeholder: "Card number"
        },
        frameId: "checkout-frame"
      },
      {
        id: "place-order",
        type: "Button",
        position: { x: 350, y: 400 },
        size: { width: 120, height: 40 },
        properties: {
          text: "Place Order",
          variant: "default"
        },
        frameId: "checkout-frame"
      }
    ],
    frames: [
      {
        id: "cart-frame",
        position: { x: 50, y: 50 },
        size: { width: 540, height: 550 },
        label: "Shopping Cart"
      },
      {
        id: "checkout-frame",
        position: { x: 650, y: 50 },
        size: { width: 540, height: 500 },
        label: "Checkout"
      }
    ],
    aiFunctionalities: []
  },
  {
    id: "user-profile",
    title: "User Profile & Settings",
    description: "User account management with profile editing",
    icon: User,
    tags: ["Profile", "Settings", "Account"],
    difficulty: "Beginner",
    components: [
      {
        id: "profile-header",
        type: "Card",
        position: { x: 70, y: 70 },
        size: { width: 400, height: 100 },
        properties: {
          title: "John Doe",
          content: "Software Developer • Joined March 2024"
        },
        frameId: "profile-frame"
      },
      {
        id: "name-input",
        type: "Input",
        position: { x: 70, y: 200 },
        size: { width: 400, height: 40 },
        properties: {
          placeholder: "Full Name",
          value: "John Doe"
        },
        frameId: "profile-frame"
      },
      {
        id: "email-profile",
        type: "Input",
        position: { x: 70, y: 260 },
        size: { width: 400, height: 40 },
        properties: {
          placeholder: "Email Address",
          value: "john@example.com"
        },
        frameId: "profile-frame"
      },
      {
        id: "bio-textarea",
        type: "Textarea",
        position: { x: 70, y: 320 },
        size: { width: 400, height: 100 },
        properties: {
          placeholder: "Tell us about yourself...",
          value: "Passionate software developer with 5 years of experience."
        },
        frameId: "profile-frame"
      },
      {
        id: "save-profile",
        type: "Button",
        position: { x: 390, y: 440 },
        size: { width: 80, height: 40 },
        properties: {
          text: "Save",
          variant: "default"
        },
        frameId: "profile-frame"
      }
    ],
    frames: [
      {
        id: "profile-frame",
        position: { x: 50, y: 50 },
        size: { width: 540, height: 520 },
        label: "Profile"
      }
    ],
    aiFunctionalities: []
  }
];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);

  const handleTemplateSelect = (template: typeof templates[0]) => {
    onTemplateSelected({
      components: template.components as ComponentData[],
      frames: template.frames as FrameData[],
      aiFunctionalities: template.aiFunctionalities as AIFunctionality[],
      title: template.title
    });
    setIsOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <Layout className="mr-2 h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Layout className="mr-2 h-5 w-5" />
            Template Library
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-600">
            Choose from our collection of pre-built prototypes to get started quickly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                            {template.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{template.components.length} components</span>
                      <span>{template.frames.length} frames</span>
                      {template.aiFunctionalities.length > 0 && (
                        <span className="flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          AI-powered
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleTemplateSelect(template)}
                    >
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Templates are fully customizable - modify components, styling, and layout</li>
              <li>• AI-powered templates include pre-configured workflows</li>
              <li>• Use templates as starting points for your own designs</li>
              <li>• More templates coming soon based on user feedback</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 