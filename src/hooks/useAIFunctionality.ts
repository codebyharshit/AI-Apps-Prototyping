import { useState, useCallback } from 'react';
import { AIFunctionality } from '@/components/AIFunctionalityConfig';
import { ComponentData } from '@/lib/utils';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const useAIFunctionality = (
  functionality: AIFunctionality,
  components: ComponentData[],
  onUpdateComponentProperties: (id: string, properties: Record<string, any>) => void
) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInputValues = useCallback(() => {
    const inputValues: Record<string, string> = {};

    // Get values from all input components
    functionality.inputComponentIds.forEach(id => {
      if (!id) return;
      
      // Check if this is an uploaded document
      const uploadedDocument = functionality.uploadedDocuments?.find(doc => doc.id === id);
      if (uploadedDocument) {
        // Handle uploaded document data
        const selectedColumns = functionality.inputComponentTableColumns?.[id] || [];
        if (selectedColumns.length > 0) {
          // Format the document data for AI processing
          const { headers, rows } = uploadedDocument.data;
          const headerIndexMap: Record<string, number> = {};
          headers.forEach((header, index) => {
            headerIndexMap[header] = index;
          });

          const formattedData = rows.map(row => {
            const rowEntries: string[] = [];
            for (const selectedColName of selectedColumns) {
              const colIndex = headerIndexMap[selectedColName];
              if (colIndex !== undefined && row[colIndex] !== undefined) {
                rowEntries.push(`${selectedColName}: ${String(row[colIndex])}`);
              }
            }
            return rowEntries.join(", ");
          }).join("\n");

          inputValues[id] = `Document: ${uploadedDocument.name}\n${formattedData}`;
        } else {
          // If no columns selected, include all data
          const { headers, rows } = uploadedDocument.data;
          const formattedData = rows.map(row => 
            headers.map((header, index) => `${header}: ${String(row[index] || '')}`).join(", ")
          ).join("\n");
          
          inputValues[id] = `Document: ${uploadedDocument.name}\n${formattedData}`;
        }
        return;
      }
      
      // Handle regular components
      const component = components.find(c => c.id === id);
      if (!component) return;

      // Get the value depending on component type
      if (component.type === 'Input' || component.type === 'Textarea' || component.type === 'AIInput') {
        inputValues[id] = component.properties?.value || '';
      } else if (component.type === 'ImageUpload') {
        inputValues[id] = component.properties?.value || '';
      } else if (component.type === 'Checkbox') {
        // For checkboxes, convert boolean to descriptive text for AI
        const isChecked = component.properties?.value === true;
        inputValues[id] = isChecked ? 'Yes' : 'No';
      }
    });

    return inputValues;
  }, [functionality.inputComponentIds, functionality.uploadedDocuments, functionality.inputComponentTableColumns, components]);

  const processAIRequest = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const inputValues = getInputValues();
      
      // Combine all input values into a single user message
      const userMessage = Object.entries(inputValues)
        .map(([id, value]) => {
          const component = components.find(c => c.id === id);
          return `${component?.properties?.name || id}: ${value}`;
        })
        .join('\n');

      if (!userMessage.trim()) {
        throw new Error('No input provided');
      }

      // Prepare messages array for the API
      const messages: Message[] = [
        // Start with system prompt
        { role: 'system', content: functionality.systemPrompt },
        // Add chat history
        ...chatHistory,
        // Add the new user message
        { role: 'user', content: userMessage }
      ];

      // Call the DeepSeek API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: functionality.systemPrompt,
          messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data?.data?.response || 'No response from AI';

      // Update chat history
      const newChatHistory: Message[] = [
        ...chatHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ];
      setChatHistory(newChatHistory);

      // Update output component if specified
      if (functionality.outputComponentId) {
        onUpdateComponentProperties(functionality.outputComponentId, {
          content: JSON.stringify(newChatHistory)
        });
      }

      return aiResponse;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('AI processing error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [functionality, components, chatHistory, getInputValues, onUpdateComponentProperties]);

  return {
    chatHistory,
    isProcessing,
    error,
    processAIRequest,
    setChatHistory
  };
}; 