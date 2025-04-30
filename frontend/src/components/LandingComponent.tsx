"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import Header from "@/components/Header";

export default function LandingPage() {
  return (
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Logo Section */}
        <div className="text-center mb-10 z-10">
          <div className="mb-4">
            <Image
              src="/logo.svg"
              alt="Dune Wars"
              width={400}
              height={100}
              priority
            />
          </div>
          <div className="flex justify-center space-x-24">
            <span className="text-2xl">沙丘</span>
            <span className="text-2xl">战争</span>
          </div>
        </div>

        {/* Play Button */}
        <Link href="/profile" className="mb-16 z-10">
          <Button
            className="text-lg px-8 py-6 rounded-full bg-white text-black hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            size="lg"
          >
            Play Now <span className="ml-2">→</span>
          </Button>
        </Link>

        {/* Hero Image Section - Sticky to bottom */}
        <div className="bottom-0 w-[50%]">
          <Image
            src="/landing-page-hero.png"
            alt="Dune Wars Hero"
            width={1200}
            height={600}
            className="w-full h-auto object-cover object-bottom"
            priority
          />
        </div>
      </main>
    </div>
  );
}