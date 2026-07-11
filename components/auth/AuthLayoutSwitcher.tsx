"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

function DefaultAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background font-sans">
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden lg:flex">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image src="/auth-bg.png" alt="Authentication Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 via-transparent to-violet-950/40" />
        </motion.div>

        <div className="relative z-10 flex h-full w-full flex-col p-12 text-white">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
                <Image src="/logo-mark.png" alt="AI-LMS logo" width={40} height={40} className="h-10 w-10 object-contain" priority />
              </div>
            </div>
            <div>
              <span className="block text-2xl font-bold tracking-tight">AI-LMS</span>
              <span className="text-sm font-medium text-indigo-100/80">AI-Learning Management System</span>
            </div>
          </motion.div>

          <div className="mt-auto max-w-lg">
            <motion.h1
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl"
            >
              Master Coding, <br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Accelerate Your Future.
              </span>
            </motion.h1>
            <motion.p
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-6 text-lg leading-relaxed text-indigo-100/70"
            >
              Join thousands of developers in Cambodia and beyond.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-auto flex gap-8 text-sm font-medium text-indigo-100/50"
          >
            <span>&copy; 2026 Y MENGSEA</span>
            <Link href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </motion.div>
        </div>
      </div>

      <main className="relative flex w-full flex-1 flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="lg:hidden absolute inset-0 z-0 overflow-hidden">
          <Image src="/auth-bg.png" alt="" fill className="object-cover opacity-10" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90" />
        </div>

        <div className="absolute top-8 left-8 z-10 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5">
              <Image src="/logo-mark.png" alt="AI-LMS logo" width={32} height={32} className="h-8 w-8 object-contain" />
            </div>
            <span className="text-lg font-bold">AI-LMS</span>
          </Link>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="z-10 w-full max-w-[440px]"
        >
          {children}
        </motion.div>

        <div className="mt-8 flex gap-6 text-xs font-medium text-muted-foreground lg:hidden">
          <span>&copy; 2026 Y MENGSEA</span>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
        </div>
      </main>
    </div>
  );
}

export function AuthLayoutSwitcher({ children }: { children: React.ReactNode }) {
  return <DefaultAuthLayout>{children}</DefaultAuthLayout>;
}
