import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SettingsPanel } from "@/components/SettingsPanel";

{/* Add settings button */}
<DialogTrigger asChild>
  <Button variant="ghost" size="icon">
    <Settings className="h-5 w-5" />
    <span className="sr-only">Settings</span>
  </Button>
</DialogTrigger>
{/* Add dialog for settings */}
<DialogContent className="max-w-md">
  <SettingsPanel />
</DialogContent> 