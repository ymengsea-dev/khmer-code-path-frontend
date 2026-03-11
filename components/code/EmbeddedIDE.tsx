"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const DEFAULT_CODE = `// Write JavaScript and click Run
console.log("Hello, Khmer Code Path!");

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));
`;

export function EmbeddedIDE() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(() => {
    setError(null);
    setOutput([]);
    setIsRunning(true);

    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: unknown[]) => {
      logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
    };
    console.error = (...args: unknown[]) => {
      logs.push("[error] " + args.map((a) => String(a)).join(" "));
    };
    console.warn = (...args: unknown[]) => {
      logs.push("[warn] " + args.map((a) => String(a)).join(" "));
    };

    try {
      const fn = new Function(code);
      const result = fn();
      if (result !== undefined) {
        logs.push(String(result));
      }
      setOutput(logs.length ? logs : ["(no output)"]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOutput(logs);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setIsRunning(false);
    }
  }, [code]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <h1 className="text-lg font-semibold text-foreground">Code</h1>
        <Button
          size="sm"
          onClick={handleRun}
          disabled={isRunning}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Running…" : "Run"}
        </Button>
      </header>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <div className="flex flex-1 flex-col border-b md:border-b-0 md:border-r border-border">
          <div className="border-b border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Editor (JavaScript)
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-[200px] w-full resize-none border-0 bg-transparent p-4 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="// Write your code here..."
          />
        </div>

        <div className="flex flex-1 flex-col min-h-[180px] md:min-h-0">
          <div className="border-b border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Output
          </div>
          <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-sm text-foreground bg-muted/10">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : output.length === 0 ? (
              <span className="text-muted-foreground">Click Run to execute your code.</span>
            ) : (
              output.map((line, i) => (
                <span key={i}>
                  {line}
                  {"\n"}
                </span>
              ))
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
