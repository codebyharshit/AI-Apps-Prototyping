"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit2, Save, X, User } from "lucide-react";

export interface Persona {
  id: string;
  name: string;
  description: string;
}

interface PersonaManagerProps {
  personas: Persona[];
  onPersonasChange: (personas: Persona[]) => void;
}

export const PersonaManager: React.FC<PersonaManagerProps> = ({
  personas,
  onPersonasChange,
}) => {
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingPersona(null);
    setFormData({ name: "", description: "" });
  };

  const handleStartEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setIsCreating(false);
    setFormData({
      name: persona.name,
      description: persona.description,
    });
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Please fill in both name and description");
      return;
    }

    if (isCreating) {
      // Create new persona
      const newPersona: Persona = {
        id: `persona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
      };
      onPersonasChange([...personas, newPersona]);
    } else if (editingPersona) {
      // Update existing persona
      const updatedPersonas = personas.map((p) =>
        p.id === editingPersona.id
          ? { ...p, name: formData.name.trim(), description: formData.description.trim() }
          : p
      );
      onPersonasChange(updatedPersonas);
    }

    // Reset form
    setIsCreating(false);
    setEditingPersona(null);
    setFormData({ name: "", description: "" });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPersona(null);
    setFormData({ name: "", description: "" });
  };

  const handleDelete = (personaId: string) => {
    if (confirm("Are you sure you want to delete this persona?")) {
      const updatedPersonas = personas.filter((p) => p.id !== personaId);
      onPersonasChange(updatedPersonas);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md flex items-center">
            <User className="mr-2 h-4 w-4" />
            Persona Manager
          </CardTitle>
          <Button
            onClick={handleStartCreate}
            size="sm"
            disabled={isCreating || editingPersona !== null}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Persona
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Creation/Edit Form */}
        {(isCreating || editingPersona) && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="space-y-3">
              <div>
                <Label htmlFor="persona-name">Persona Name</Label>
                <Input
                  id="persona-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Tech-Savvy Manager, Busy Parent, etc."
                />
              </div>
              <div>
                <Label htmlFor="persona-description">Description</Label>
                <Textarea
                  id="persona-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe this persona's background, goals, pain points, and typical behavior..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isCreating ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Personas List */}
        {personas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm">No personas created yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Create personas to run targeted tests against your AI prototype
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{persona.name}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {persona.description}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(persona)}
                      disabled={isCreating || editingPersona !== null}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(persona.id)}
                      disabled={isCreating || editingPersona !== null}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 