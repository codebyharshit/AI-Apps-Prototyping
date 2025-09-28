"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, PlayCircle, CheckCircle, AlertCircle, User, MessageSquare } from "lucide-react";
import { ComponentData } from "@/lib/utils";
import { AIFunctionality } from "@/components/AIFunctionalityConfig";
import { Persona } from "@/components/PersonaManager";
import { handleApiError } from "@/lib/api-utils";

interface PersonaTestingProps {
  personas: Persona[];
  components: ComponentData[];
  aiFunctionalities: AIFunctionality[];
  onUpdateComponentProperties?: (id: string, properties: Record<string, any>) => void;
}

interface TestResult {
  question: string;
  answer: string;
  timestamp: Date;
}

interface TestSession {
  persona: Persona;
  functionality: AIFunctionality;
  results: TestResult[];
  startTime: Date;
  endTime?: Date;
}

export const PersonaTesting: React.FC<PersonaTestingProps> = ({
  personas,
  components,
  aiFunctionalities,
  onUpdateComponentProperties,
}) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedFunctionalityId, setSelectedFunctionalityId] = useState<string | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTestSession, setCurrentTestSession] = useState<TestSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);

  // Get the selected persona and functionality objects
  const selectedPersona = personas.find(p => p.id === selectedPersonaId);
  const selectedFunctionality = aiFunctionalities.find(f => f.id === selectedFunctionalityId);

  // Stage 1: Generate questions from persona
  const generateQuestionsFromPersona = async (persona: Persona): Promise<string[]> => {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Based on the following user persona, generate 5 realistic questions this person would ask. Return the output as a valid JSON array of strings. Persona: ${persona.description}`
          }
        ],
        systemPrompt: "You are a UX researcher generating realistic user questions. Always respond with a valid JSON array of strings, nothing else.",
        temperature: 0.8, // High temperature for creative and varied questions
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate questions: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data?.data?.response || "";
    
    try {
      // Try to parse as JSON array
      const questions = JSON.parse(responseText);
      if (Array.isArray(questions) && questions.every(q => typeof q === "string")) {
        return questions;
      } else {
        throw new Error("Response is not a valid array of strings");
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract questions from text
      const lines = responseText.split('\n').filter((line: string) => line.trim());
      const questions = lines
        .map((line: string) => line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 5); // Take first 5 questions
      
      if (questions.length === 0) {
        throw new Error("Could not extract questions from response");
      }
      
      return questions;
    }
  };

  // Stage 2: Run a question through the AI functionality
  const runQuestionThroughAI = async (question: string, functionality: AIFunctionality): Promise<string> => {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: question
          }
        ],
        systemPrompt: functionality.systemPrompt || "You are a helpful AI assistant.",
        temperature: 0.3, // Lower temperature for consistent prototype responses
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response failed: ${response.status}`);
    }

    const data = await response.json();
    return data?.data?.response || "No response received";
  };

  // Main testing function
  const runPersonaTest = async () => {
    if (!selectedPersona || !selectedFunctionality) {
      setError("Please select both a persona and an AI functionality");
      return;
    }

    setError(null);
    setIsGeneratingQuestions(true);

    try {
      // Stage 1: Generate questions
      console.log(`🧪 Stage 1: Generating questions for persona "${selectedPersona.name}"`);
      const questions = await generateQuestionsFromPersona(selectedPersona);
      setGeneratedQuestions(questions);
      console.log(`✅ Generated ${questions.length} questions:`, questions);

      setIsGeneratingQuestions(false);
      setIsRunningTests(true);

      // Initialize test session
      const testSession: TestSession = {
        persona: selectedPersona,
        functionality: selectedFunctionality,
        results: [],
        startTime: new Date(),
      };

      // Stage 2: Run each question through the AI
      console.log(`🧪 Stage 2: Running questions through AI functionality "${selectedFunctionality.name}"`);
      const results: TestResult[] = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`🔄 Processing question ${i + 1}/${questions.length}: "${question}"`);
        
        try {
          const answer = await runQuestionThroughAI(question, selectedFunctionality);
          const result: TestResult = {
            question,
            answer,
            timestamp: new Date(),
          };
          results.push(result);
          
          // Update test session with intermediate results
          setCurrentTestSession({
            ...testSession,
            results: results,
          });

          // Update output component if specified
          if (selectedFunctionality.outputComponentId && onUpdateComponentProperties) {
            onUpdateComponentProperties(selectedFunctionality.outputComponentId, {
              content: answer
            });
          }

          // Small delay between requests to avoid rate limiting
          if (i < questions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (err) {
          console.error(`❌ Error processing question ${i + 1}:`, err);
          const errorResult: TestResult = {
            question,
            answer: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            timestamp: new Date(),
          };
          results.push(errorResult);
        }
      }

      // Finalize test session
      testSession.results = results;
      testSession.endTime = new Date();
      setCurrentTestSession(testSession);

      console.log(`✅ Persona testing completed. ${results.length} results generated.`);

    } catch (err) {
      console.error("❌ Persona testing failed:", err);
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error || "Persona testing failed");
    } finally {
      setIsGeneratingQuestions(false);
      setIsRunningTests(false);
    }
  };

  const clearResults = () => {
    setCurrentTestSession(null);
    setGeneratedQuestions([]);
    setError(null);
  };

  const formatDuration = (session: TestSession): string => {
    if (!session.endTime) return "In progress...";
    const duration = session.endTime.getTime() - session.startTime.getTime();
    return `${Math.round(duration / 1000)}s`;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md flex items-center">
            <User className="mr-2 h-4 w-4" />
            Persona-Based Testing
          </CardTitle>
          {currentTestSession && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearResults}
              disabled={isGeneratingQuestions || isRunningTests}
            >
              Clear Results
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Persona Selection */}
        <div className="space-y-2">
          <Label htmlFor="persona-select">Test with Persona</Label>
          <Select
            value={selectedPersonaId || undefined}
            onValueChange={setSelectedPersonaId}
            disabled={isGeneratingQuestions || isRunningTests}
          >
            <SelectTrigger id="persona-select">
              <SelectValue placeholder="Select a persona to test with" />
            </SelectTrigger>
            <SelectContent>
              {personas.length === 0 ? (
                <SelectItem value="no-personas" disabled>
                  No personas available - create one first
                </SelectItem>
              ) : (
                personas.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{persona.name}</span>
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {persona.description}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* AI Functionality Selection */}
        <div className="space-y-2">
          <Label htmlFor="functionality-select">AI Functionality to Test</Label>
          <Select
            value={selectedFunctionalityId || undefined}
            onValueChange={setSelectedFunctionalityId}
            disabled={isGeneratingQuestions || isRunningTests}
          >
            <SelectTrigger id="functionality-select">
              <SelectValue placeholder="Select an AI functionality to test" />
            </SelectTrigger>
            <SelectContent>
              {aiFunctionalities.length === 0 ? (
                <SelectItem value="no-functions" disabled>
                  No AI functionalities available - create one first
                </SelectItem>
              ) : (
                aiFunctionalities.map((functionality) => (
                  <SelectItem key={functionality.id} value={functionality.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{functionality.name}</span>
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {functionality.systemPrompt}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Run Test Button */}
        <Button
          onClick={runPersonaTest}
          disabled={
            !selectedPersona || 
            !selectedFunctionality || 
            isGeneratingQuestions || 
            isRunningTests ||
            personas.length === 0 ||
            aiFunctionalities.length === 0
          }
          className="w-full"
        >
          {isGeneratingQuestions ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : isRunningTests ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Persona Test
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Test Results */}
        {currentTestSession && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">Test Session Results</h4>
                <span className="text-xs text-blue-600">
                  {formatDuration(currentTestSession)}
                </span>
              </div>
              <div className="text-sm text-blue-700">
                <p><strong>Persona:</strong> {currentTestSession.persona.name}</p>
                <p><strong>AI Function:</strong> {currentTestSession.functionality.name}</p>
                <p><strong>Questions Generated:</strong> {currentTestSession.results.length}</p>
              </div>
            </div>

            {/* Question-Answer Pairs */}
            <div className="space-y-3">
              {currentTestSession.results.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg bg-white">
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Question {index + 1}:
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{result.question}</p>
                      </div>
                    </div>
                    <div className="ml-6 pl-4 border-l-2 border-gray-200">
                      <p className="text-sm font-medium text-gray-900">AI Response:</p>
                      <p className="text-sm text-gray-700 mt-1">{result.answer}</p>
                    </div>
                    <div className="ml-6 text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {isRunningTests && currentTestSession && generatedQuestions.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 text-yellow-600 mr-2 animate-spin" />
              <span className="text-sm text-yellow-700">
                Processing question {currentTestSession.results.length + 1} of {generatedQuestions.length}...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 