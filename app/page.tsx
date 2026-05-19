import { Suspense } from "react";
import { HomePage } from "@/components/app/HomePage";

function HomeFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground text-sm">
      Loading…
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePage />
    </Suspense>
  );
}
