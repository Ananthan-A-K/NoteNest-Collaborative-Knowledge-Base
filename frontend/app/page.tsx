"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import SocialProof from "@/components/landing/SocialProof";
import BestPractices from "@/components/landing/BestPractices";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F3F0E6] selection:bg-[#FF6B6B]/20">
      <Navbar />
      <Hero />
      <Features />
      <SocialProof />
      <BestPractices />
      <FAQ />
      <Footer />
    </main>
  );
}
