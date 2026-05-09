"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background font-sans">
      {/* Left side - Background & Branding (Desktop only) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden lg:flex">
        {/* Animated Background Image */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/auth-bg.png"
            alt="Authentication Background"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay gradient for better text readability if needed, though the image itself is dark */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 via-transparent to-violet-950/40" />
        </motion.div>

        {/* Content on top of background */}
        <div className="relative z-10 flex h-full w-full flex-col p-12 text-white">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white drop-shadow-sm">
                  <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
                </svg>
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
              Join thousands of developers in Cambodia and beyond. Learn the most in-demand skills, build real-world projects, and grow your career.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-auto flex gap-8 text-sm font-medium text-indigo-100/50"
          >
            <span>&copy; 2026 AI-LMS</span>
            <Link href="#" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="#" className="transition-colors hover:text-white">Terms of Service</Link>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-1/4 h-64 w-64 translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      {/* Right side - Auth Forms */}
      <main className="relative flex w-full flex-1 flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
        {/* Background elements for mobile or just extra flair */}
        <div className="lg:hidden absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/auth-bg.png"
            alt="Authentication Background"
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90" />
        </div>

        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 z-10 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-md">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
              </svg>
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

        {/* Footer for mobile */}
        <div className="mt-8 flex gap-6 text-xs font-medium text-muted-foreground lg:hidden">
          <span>&copy; 2026 AI-LMS</span>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
        </div>
      </main>
    </div>
  );
}
