import React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SettingsPanel } from "@/components/SettingsPanel";

export const SettingsDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <SettingsPanel />
      </DialogContent>
    </Dialog>
  );
}; 