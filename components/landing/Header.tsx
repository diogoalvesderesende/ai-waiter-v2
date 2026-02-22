"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-sm">
            W
          </div>
          <span className="text-lg font-semibold text-white">
            Dim Sum Montijo
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-white/90 hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-white/90 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#demo"
            className="text-sm font-medium text-white/90 hover:text-white transition-colors"
          >
            Demo
          </a>
        </nav>

        <a
          href="#demo"
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition-colors"
        >
          Get Started
        </a>
      </div>
    </header>
  );
}
