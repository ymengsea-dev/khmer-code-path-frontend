"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { schoolService } from "@/lib/services/school-service";
import type { SchoolRegistrationInfo } from "@/lib/types/school-api";

export function SchoolRegisterLayout({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [info, setInfo] = useState<SchoolRegistrationInfo | null>(null);
  const coverSrc = schoolService.getRegistrationCoverUrl(info?.coverUrl);

  useEffect(() => {
    let cancelled = false;
    void schoolService.getRegistrationInfo(slug).then((data) => {
      if (!cancelled) setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans">
      <div className="pointer-events-none absolute inset-0">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image src="/auth-bg.png" alt="" fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/50" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-6 py-6 sm:px-10">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold">
              {info?.name?.charAt(0) ?? "S"}
            </div>
            <div>
              <span className="block text-lg font-bold tracking-tight sm:text-xl">
                {info?.name ?? "School Portal"}
              </span>
              <span className="text-xs font-medium text-white/75 sm:text-sm">
                Student registration
              </span>
            </div>
          </Link>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          {info?.tagline ? (
            <aside className="order-2 hidden flex-1 items-center px-6 lg:order-1 lg:flex lg:px-10 xl:px-16">
              <p className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl xl:text-5xl">
                {info.tagline}
              </p>
            </aside>
          ) : null}

          <main className="order-1 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-4 sm:px-10 lg:order-2 lg:items-end lg:justify-center lg:pr-16 lg:pb-10 xl:pr-24">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="w-full max-w-[440px]"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
