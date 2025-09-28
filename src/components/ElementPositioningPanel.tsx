'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Move, RotateCcw, Save, Code } from 'lucide-react';

interface ElementPosition {
  x: number;
  y: number;
}

interface ElementPositioningPanelProps {
  componentId: string;
  elementPositions: Record<string, ElementPosition>;
  onElementPositionChange: (elementId: string, position: ElementPosition) => void;
  onEnablePositioning: (enabled: boolean) => void;
  onRegenerateWithPositions: () => void;
  isPositioningEnabled: boolean;
}

export const ElementPositioningPanel: React.FC<ElementPositioningPanelProps> = ({
  componentId,
  elementPositions,
  onElementPositionChange,
  onEnablePositioning,
  onRegenerateWithPositions,
  isPositioningEnabled
}) => {
  const [localPositions, setLocalPositions] = useState<Record<string, ElementPosition>>(elementPositions);

  useEffect(() => {
    setLocalPositions(elementPositions);
  }, [elementPositions]);

  const handlePositionChange = (elementId: string, field: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    const newPosition = {
      ...localPositions[elementId],
      [field]: numValue
    };
    
    setLocalPositions(prev => ({
      ...prev,
      [elementId]: newPosition
    }));
    
    onElementPositionChange(elementId, newPosition);
  };

  const resetPositions = () => {
    setLocalPositions({});
    Object.keys(elementPositions).forEach(elementId => {
      onElementPositionChange(elementId, { x: 0, y: 0 });
    });
  };

  const savePositions = () => {
    // Save positions to localStorage
    const key = `elementPositions_${componentId}`;
    localStorage.setItem(key, JSON.stringify(localPositions));
    console.log('💾 Element positions saved:', localPositions);
  };

  const loadPositions = () => {
    const key = `elementPositions_${componentId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const positions = JSON.parse(saved);
        setLocalPositions(positions);
        Object.entries(positions).forEach(([elementId, position]) => {
          onElementPositionChange(elementId, position as ElementPosition);
        });
        console.log('📂 Element positions loaded:', positions);
      } catch (error) {
        console.error('❌ Error loading element positions:', error);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="h-4 w-4" />
          Element Positioning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="positioning-toggle">Enable Element Positioning</Label>
          <Button
            id="positioning-toggle"
            variant={isPositioningEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onEnablePositioning(!isPositioningEnabled)}
          >
            {isPositioningEnabled ? "Enabled" : "Disabled"}
          </Button>
        </div>

        {isPositioningEnabled && (
          <>
            {/* Instructions */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p className="font-medium mb-1">How to use:</p>
              <ul className="text-xs space-y-1">
                <li>• Blue overlays will appear over elements with IDs</li>
                <li>• Drag the overlays to move elements</li>
                <li>• Use the inputs below for precise positioning</li>
                <li>• Click "Regenerate Code" to apply positions to the component</li>
              </ul>
            </div>

            {/* Position Controls */}
            {Object.keys(localPositions).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Element Positions</Label>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetPositions}
                      className="h-6 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={savePositions}
                      className="h-6 px-2"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPositions}
                      className="h-6 px-2"
                    >
                      Load
                    </Button>
                  </div>
                </div>

                {Object.entries(localPositions).map(([elementId, position]) => (
                  <div key={elementId} className="space-y-2 p-3 border rounded-md">
                    <Label className="text-xs font-medium text-gray-700">
                      {elementId}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={position.x}
                          onChange={(e) => handlePositionChange(elementId, 'x', e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={position.y}
                          onChange={(e) => handlePositionChange(elementId, 'y', e.target.value)}
                          className="h-6 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Regenerate Button */}
            <Button
              onClick={onRegenerateWithPositions}
              className="w-full"
              size="sm"
            >
              <Code className="h-4 w-4 mr-2" />
              Regenerate Code with Positions
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 