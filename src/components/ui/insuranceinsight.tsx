"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InsuranceInsightProps {
  id?: string;
  className?: string;
  isInteractive?: boolean;
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function InsuranceInsight({
  id,
  className = "",
  isInteractive = true
}: InsuranceInsightProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your Insurance Assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Predefined insurance responses
  const insuranceResponses: Record<string, string[]> = {
    premium: [
      "Our Premium plan costs $79/month and includes unlimited visits, specialty drugs, and a $100 deductible.",
      "The Premium plan is our most comprehensive option, offering unlimited visits and specialty drug coverage.",
      "With the Premium plan, you'll get the most complete coverage we offer, including specialty medications."
    ],
    standard: [
      "The Standard plan is $39/month with a $250 deductible and covers 6 doctor visits per year.",
      "Our Standard plan offers a good balance of coverage and cost at $39 monthly.",
      "For $39/month, the Standard plan includes 6 annual doctor visits and brand name drugs."
    ],
    basic: [
      "The Basic plan is our most affordable option at $19/month with a $500 deductible.",
      "At $19/month, the Basic plan covers 3 doctor visits yearly and generic drugs.",
      "Our Basic plan is budget-friendly at $19 monthly with a $500 deductible."
    ],
    coverage: [
      "Our plans offer different levels of coverage for doctor visits, prescriptions, and specialists.",
      "Coverage options range from basic preventive care to comprehensive coverage including specialty drugs.",
      "All plans include prescription coverage, but the drug formularies vary by plan level."
    ],
    compare: [
      "The Basic plan ($19/mo) offers 3 visits/year, the Standard ($39/mo) offers 6 visits/year, and Premium ($79/mo) offers unlimited visits.",
      "When comparing plans, consider your typical healthcare usage - Premium offers the most comprehensive coverage but at a higher cost.",
      "The main differences between plans are the number of covered visits, drug formularies, and deductible amounts."
    ],
    default: [
      "I'd be happy to help answer your insurance questions. Would you like to know about our Basic, Standard, or Premium plans?",
      "I can provide information about our coverage options, deductibles, or help you compare plans. What specific information are you looking for?",
      "Thanks for your question. I can help with information about plan benefits, costs, or coverage details. What would you like to know more about?"
    ]
  };

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const newMessages = [...messages, {
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    }];
    
    setMessages(newMessages);
    setInputValue("");

    // Determine response category based on user input
    const userQuestion = inputValue.toLowerCase();
    let responseCategory = 'default';
    
    if (userQuestion.includes('premium') || userQuestion.includes('$79')) {
      responseCategory = 'premium';
    } else if (userQuestion.includes('standard') || userQuestion.includes('$39')) {
      responseCategory = 'standard';
    } else if (userQuestion.includes('basic') || userQuestion.includes('$19')) {
      responseCategory = 'basic';
    } else if (userQuestion.includes('coverage') || userQuestion.includes('cover')) {
      responseCategory = 'coverage';
    } else if (userQuestion.includes('compare') || userQuestion.includes('difference') || userQuestion.includes('vs')) {
      responseCategory = 'compare';
    }
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      // Select a random response from the appropriate category
      const responses = insuranceResponses[responseCategory];
      const responseIndex = Math.floor(Math.random() * responses.length);
      
      setMessages(prev => [...prev, {
        text: responses[responseIndex],
        isUser: false,
        timestamp: new Date()
      }]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-full border rounded-md overflow-hidden ${className}`} id={id}>
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 font-medium">
        Insurance Assistant
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isUser 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-white border rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      {isInteractive && (
        <div className="border-t p-2 flex items-center">
          <Input
            placeholder="Ask about insurance plans or coverage..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 mr-2"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage} 
            className="bg-blue-500 hover:bg-blue-600"
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
} 