"use client";

import { Editor } from "@/components/Editor";
import { SettingsDialog } from "@/components/SettingsDialog";

export default function Home() {
  return (
    <main className="flex flex-col h-screen w-full overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-bold">AI App Prototyper</h1>
        <div className="flex items-center gap-2">
          <SettingsDialog />
        </div>
      </header>
      <Editor />
    </main>
  );
}
