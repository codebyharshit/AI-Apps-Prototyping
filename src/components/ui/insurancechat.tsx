"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InsuranceChatProps {
  id?: string;
  className?: string;
  isInteractive?: boolean;
  initialMessage?: string;
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function InsuranceChat({
  id,
  className = "",
  isInteractive = true,
  initialMessage = "Hello! I'm your Insurance Assistant. How can I help you today?"
}: InsuranceChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: initialMessage,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Predefined insurance responses for demo purposes
  const insuranceResponses = [
    "Based on your current coverage plan, we recommend upgrading to our Premium Plus package.",
    "Your policy covers standard home damage, but excludes flooding and earthquakes. Would you like more information?",
    "You're eligible for a 15% discount if you bundle your home and auto insurance together.",
    "For travel insurance, we offer three tiers: Basic, Standard, and Premium.",
    "I'd be happy to explain the differences between our insurance plans."
  ];

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

    // Simulate bot response
    setTimeout(() => {
      // Select a random response from the insurance responses
      const responseIndex = Math.floor(Math.random() * insuranceResponses.length);
      
      setMessages(prev => [...prev, {
        text: insuranceResponses[responseIndex],
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
            placeholder="Type your question here..."
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