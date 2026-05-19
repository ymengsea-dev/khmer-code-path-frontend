"use client";

export function SettingsView() {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shrink-0">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Account and application preferences
        </p>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Settings coming soon.</p>
      </div>
    </div>
  );
}
